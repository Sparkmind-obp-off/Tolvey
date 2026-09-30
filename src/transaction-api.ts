import { Hono } from 'hono';
import { configuredEnvironment } from './config';
import type { AppContext, Bindings } from './types';
import { hash, TransactionError } from './transaction-domain';
import {
  createCheckout,
  getCheckout,
  getOrder,
  checkoutDto,
  orderDto,
} from './transaction-store';

// Temporary non-production service boundary, not customer auth or Hosted admission.
export function coreAvailable(env: Bindings): boolean {
  const environment = configuredEnvironment(env);
  return (
    environment !== null &&
    environment !== 'production' &&
    !!env.DB &&
    env.TRANSACTION_CORE_ENABLED === 'true' &&
    typeof env.TRANSACTION_CORE_TOKEN === 'string' &&
    env.TRANSACTION_CORE_TOKEN.length >= 32 &&
    env.TRANSACTION_CORE_TOKEN.length <= 256
  );
}

async function authorized(
  header: string | undefined,
  token: string,
): Promise<boolean> {
  if (!header?.startsWith('Bearer ')) return false;
  const supplied = header.slice(7);
  if (supplied.length < 32 || supplied.length > 256) return false;
  const [actual, expected] = await Promise.all([hash(supplied), hash(token)]);
  let difference = 0;
  for (let i = 0; i < expected.length; i++)
    difference |= actual.charCodeAt(i) ^ expected.charCodeAt(i);
  return difference === 0;
}

async function readJson(request: Request): Promise<unknown> {
  if (
    !request.headers
      .get('content-type')
      ?.toLowerCase()
      .startsWith('application/json')
  )
    throw new TransactionError('INVALID_CONTENT_TYPE');
  const reader = request.body?.getReader();
  if (!reader) throw new TransactionError('INVALID_JSON');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 2048) {
        await reader.cancel();
        throw new TransactionError('BODY_TOO_LARGE', 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(
      new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }).decode(body),
    );
  } catch {
    throw new TransactionError('INVALID_JSON');
  }
}

const routes = new Hono<AppContext>();
routes.use('*', async (c, next) => {
  if (!coreAvailable(c.env))
    return c.json(
      {
        error: 'TRANSACTION_CORE_UNAVAILABLE',
        message: 'Transaction core is unavailable.',
        request_id: c.get('requestId'),
      },
      503,
    );
  if (
    !(await authorized(
      c.req.header('Authorization'),
      c.env.TRANSACTION_CORE_TOKEN!,
    ))
  )
    return c.json(
      {
        error: 'UNAUTHORIZED',
        message: 'Authorization is required.',
        request_id: c.get('requestId'),
      },
      401,
    );
  await next();
});

routes.post('/checkouts', async (c) => {
  const input = await readJson(c.req.raw);
  const key = c.req.header('Idempotency-Key') ?? '';
  const result = await createCheckout(
    c.env.DB!,
    input,
    key,
    c.get('requestId'),
  );
  return c.json({ data: result }, result.replayed ? 200 : 201);
});

routes.get('/checkouts/:id', async (c) => {
  const record = await getCheckout(c.env.DB!, c.req.param('id'));
  if (!record) throw new TransactionError('NOT_FOUND', 404);
  return c.json({ data: checkoutDto(record) });
});
routes.get('/orders/:id', async (c) => {
  const record = await getOrder(c.env.DB!, c.req.param('id'));
  if (!record) throw new TransactionError('NOT_FOUND', 404);
  return c.json({ data: orderDto(record) });
});

routes.onError((error, c) => {
  if (error instanceof TransactionError)
    return c.json(
      {
        error: error.code,
        message: 'Transaction request could not be completed.',
        request_id: c.get('requestId'),
      },
      error.status,
    );
  console.error(
    JSON.stringify({
      event: 'transaction.error',
      request_id: c.get('requestId'),
    }),
  );
  return c.json(
    {
      error: 'INTERNAL_ERROR',
      message: 'Transaction request could not be completed.',
      request_id: c.get('requestId'),
    },
    500,
  );
});

export default routes;
