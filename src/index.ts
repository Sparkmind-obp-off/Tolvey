import { Hono } from 'hono';
import { serveStatic } from 'hono/cloudflare-workers';
import { secureHeaders } from 'hono/secure-headers';
import { configuredEnvironment, isId, newId } from './config';
import {
  getOffer,
  getProduct,
  listOffers,
  listProducts,
  verifySchema,
} from './catalog';
import type { AppContext } from './types';
import transactionRoutes, { coreAvailable } from './transaction-api';
import { verifyTransactionSchema } from './transaction-store';

const app = new Hono<AppContext>();

app.use(
  '*',
  secureHeaders({
    contentSecurityPolicy: {
      defaultSrc: ["'none'"],
      styleSrc: ["'self'"],
      frameAncestors: ["'none'"],
      baseUri: ["'none'"],
      formAction: ["'none'"],
    },
    referrerPolicy: 'no-referrer',
  }),
);

app.use('*', async (c, next) => {
  const requestId = newId(); // Do not trust client-supplied correlation headers.
  c.set('requestId', requestId);
  c.header('X-Request-ID', requestId);
  c.header('Cache-Control', 'no-store');
  const started = Date.now();
  await next();
  // Only bounded fields: no query, URL, payload, headers, credentials, or DB error text.
  console.info(
    JSON.stringify({
      event: 'http.request',
      request_id: requestId,
      method: c.req.method,
      status: c.res.status,
      duration_ms: Date.now() - started,
    }),
  );
});

app.use('*', async (c, next) => {
  const isCheckoutWrite =
    c.req.method === 'POST' && c.req.path === '/api/transaction-core/checkouts';
  if (!['GET', 'HEAD', 'OPTIONS'].includes(c.req.method) && !isCheckoutWrite) {
    c.header('Allow', 'GET, HEAD, OPTIONS');
    return c.json(
      { error: 'METHOD_NOT_ALLOWED', request_id: c.get('requestId') },
      405,
    );
  }
  if (c.req.method === 'OPTIONS') {
    c.header('Allow', 'GET, HEAD, OPTIONS');
    return c.body(null, 204);
  }
  await next();
});

app.get('/health', (c) =>
  c.json({ status: 'ok', service: 'tolvey', phase: 'foundation' }),
);

app.get('/ready', async (c) => {
  if (!configuredEnvironment(c.env) || !c.env.DB) {
    return c.json({ status: 'not_ready', request_id: c.get('requestId') }, 503);
  }
  try {
    await verifySchema(c.env.DB);
    if (c.env.TRANSACTION_CORE_ENABLED === 'true') {
      if (!coreAvailable(c.env))
        return c.json(
          { status: 'not_ready', request_id: c.get('requestId') },
          503,
        );
      await verifyTransactionSchema(c.env.DB);
    }
    return c.json({ status: 'ready' });
  } catch {
    console.error(
      JSON.stringify({
        event: 'readiness.failed',
        request_id: c.get('requestId'),
      }),
    );
    return c.json({ status: 'not_ready', request_id: c.get('requestId') }, 503);
  }
});

app.use('/api/*', async (c, next) => {
  if (!configuredEnvironment(c.env) || !c.env.DB) {
    return c.json(
      { error: 'SERVICE_UNAVAILABLE', request_id: c.get('requestId') },
      503,
    );
  }
  await next();
});

app.route('/api/transaction-core', transactionRoutes);

for (const resource of ['products', 'offers'] as const) {
  app.get(`/api/${resource}`, async (c) => {
    const rawLimit = c.req.query('limit') ?? '20';
    const after = c.req.query('after') ?? null;
    if (
      !/^[1-9][0-9]?$/.test(rawLimit) ||
      Number(rawLimit) > 50 ||
      (after !== null && !isId(after))
    ) {
      return c.json(
        { error: 'INVALID_QUERY', request_id: c.get('requestId') },
        400,
      );
    }
    const result =
      resource === 'products'
        ? await listProducts(c.env.DB!, Number(rawLimit), after)
        : await listOffers(c.env.DB!, Number(rawLimit), after);
    return c.json(result);
  });
  app.get(`/api/${resource}/:id`, async (c) => {
    const id = c.req.param('id');
    if (!isId(id)) {
      return c.json(
        { error: 'INVALID_ID', request_id: c.get('requestId') },
        400,
      );
    }
    const result =
      resource === 'products'
        ? await getProduct(c.env.DB!, id)
        : await getOffer(c.env.DB!, id);
    if (!result)
      return c.json(
        { error: 'NOT_FOUND', request_id: c.get('requestId') },
        404,
      );
    return c.json({ data: result });
  });
}

app.use('/static/*', serveStatic({ root: './public' }));
app.get('/', (c) =>
  c.html(`<!doctype html>
<html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TOLVEY — Foundation</title><link rel="stylesheet" href="/static/style.css"></head>
<body><main id="foundation-status"><p class="eyebrow">TOLVEY</p><h1>Product House Hub + Commerce House Hub</h1><p>Fondasi aplikasi dan katalog canonical. Pembelian, pembayaran, dan pengiriman belum tersedia.</p><nav aria-label="Verifikasi fondasi"><a href="/health">Health</a><a href="/ready">Readiness</a><a href="/api/products">Products API</a><a href="/api/offers">Offers API</a></nav></main></body></html>`),
);

// Explicit terminal route survives the Pages plugin's outer Hono wrapper.
// Hono's private notFound handler alone is not propagated by that plugin.
app.all('*', (c) =>
  c.json({ error: 'NOT_FOUND', request_id: c.get('requestId') }, 404),
);
app.notFound((c) =>
  c.json({ error: 'NOT_FOUND', request_id: c.get('requestId') }, 404),
);
app.onError((_error, c) => {
  console.error(
    JSON.stringify({ event: 'http.error', request_id: c.get('requestId') }),
  );
  return c.json(
    { error: 'INTERNAL_ERROR', request_id: c.get('requestId') },
    500,
  );
});

export default app;
