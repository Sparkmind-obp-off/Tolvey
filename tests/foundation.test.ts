import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import app from '../src/index';
import { configuredEnvironment, isId, newId } from '../src/config';
import type {
  Bindings,
  Product,
  ProductVersion,
  PublicOffer,
} from '../src/types';

const productId = '11111111-1111-4111-8111-111111111111';
const versionId = '22222222-2222-4222-8222-222222222222';
const offerId = '33333333-3333-4333-8333-333333333333';
let runtime: Miniflare;
let db: D1Database;
const logs: string[] = [];

async function applySql(database: D1Database, path: string) {
  // Controlled foundation files contain no triggers or semicolon/newline in SQL literals.
  const statements = readFileSync(resolve(path), 'utf8')
    .replace(/^--.*$/gm, '')
    .split(/;\s*(?:\n|$)/)
    .map((sql) => sql.trim())
    .filter(Boolean);
  await database.batch(statements.map((sql) => database.prepare(sql)));
}

const bindings = (): Bindings => ({ DB: db, APP_ENV: 'test' });
const get = (path: string, env = bindings()) =>
  app.request(path, undefined, env);

beforeAll(async () => {
  vi.spyOn(console, 'info').mockImplementation((entry) =>
    logs.push(String(entry)),
  );
  vi.spyOn(console, 'error').mockImplementation((entry) =>
    logs.push(String(entry)),
  );
  runtime = new Miniflare(
    convertV4MiniflareOptions({
      name: 'foundation-tests',
      modules: true,
      script:
        'export default { fetch() { return new Response("test harness"); } }',
      compatibilityDate: '2026-04-15',
      d1Databases: ['DB', 'UNMIGRATED'],
    }),
  );
  db = (await runtime.getD1Database('DB')) as unknown as D1Database;
  await applySql(db, 'migrations/0001_canonical_catalog.sql');
});

beforeEach(async () => {
  logs.length = 0;
  await db.batch([
    db.prepare('DELETE FROM offers'),
    db.prepare('DELETE FROM product_versions'),
    db.prepare('DELETE FROM products'),
  ]);
  await applySql(db, 'tests/fixtures/local-catalog.sql');
});

afterAll(async () => {
  await runtime?.dispose();
  vi.restoreAllMocks();
});

describe('application and configuration', () => {
  it('health is independent of database availability', async () => {
    const response = await get('/health', {});
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: 'ok',
      service: 'tolvey',
      phase: 'foundation',
    });
    expect(isId(response.headers.get('X-Request-ID')!)).toBe(true);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
  });

  it('readiness verifies migrated canonical tables on real local D1', async () => {
    const response = await get('/ready');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ready' });
  });

  it.each([
    {},
    { APP_ENV: 'production' },
    { DB: undefined, APP_ENV: 'test' },
    { APP_ENV: 'invalid' },
  ])(
    'fails closed when required configuration or binding is absent: %j',
    async (env) => {
      expect((await get('/ready', env)).status).toBe(503);
      expect((await get('/api/products', env)).status).toBe(503);
    },
  );

  it('does not silently default missing environment even with DB bound', async () => {
    expect((await get('/ready', { DB: db })).status).toBe(503);
  });

  it('unmigrated database remains not ready', async () => {
    const empty = (await runtime.getD1Database(
      'UNMIGRATED',
    )) as unknown as D1Database;
    const response = await get('/ready', { DB: empty, APP_ENV: 'test' });
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain('no such table');
  });

  it('database failure is sanitized in responses and structured logs', async () => {
    const unavailable = {
      prepare() {
        throw new Error('sensitive-db-detail');
      },
    } as unknown as D1Database;
    const response = await get('/api/products?private=sensitive-query', {
      DB: unavailable,
      APP_ENV: 'test',
    });
    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain('sensitive');
    expect(logs.join(' ')).not.toContain('sensitive');
    expect(logs.some((line) => JSON.parse(line).event === 'http.error')).toBe(
      true,
    );
  });

  it('server creates fresh correlation identifiers rather than trusting callers', async () => {
    const first = await app.request(
      '/health',
      { headers: { 'X-Request-ID': 'untrusted' } },
      bindings(),
    );
    const second = await get('/health');
    expect(first.headers.get('X-Request-ID')).not.toBe('untrusted');
    expect(first.headers.get('X-Request-ID')).not.toBe(
      second.headers.get('X-Request-ID'),
    );
  });

  it('identifiers are non-predictable UUIDv4 and configuration is explicit', () => {
    const ids = Array.from({ length: 100 }, newId);
    expect(new Set(ids).size).toBe(100);
    expect(ids.every(isId)).toBe(true);
    expect(isId("' OR 1=1 --")).toBe(false);
    for (const APP_ENV of ['local', 'test', 'staging', 'production']) {
      expect(configuredEnvironment({ APP_ENV })).toBe(APP_ENV);
    }
    expect(configuredEnvironment({ APP_ENV: 'unknown' })).toBeNull();
  });

  it('root is an honest foundation status page, not a purchase flow', async () => {
    const response = await get('/');
    expect(response.status).toBe(200);
    expect(await response.text()).toContain('belum tersedia');
    expect(response.headers.get('Content-Security-Policy')).toContain(
      "default-src 'none'",
    );
  });
});

describe('real D1 migration and canonical integrity', () => {
  it('represents product, version and offer with integer money and UTC timestamps', async () => {
    const product = await db
      .prepare('SELECT * FROM products WHERE id = ?')
      .bind(productId)
      .first<Product>();
    const version = await db
      .prepare('SELECT * FROM product_versions WHERE id = ?')
      .bind(versionId)
      .first<ProductVersion>();
    const offer = await db
      .prepare('SELECT * FROM offers WHERE id = ?')
      .bind(offerId)
      .first<PublicOffer>();
    expect(product?.slug).toBe('test-foundation-product');
    expect(version?.product_id).toBe(productId);
    expect(JSON.parse(version!.metadata_json)).toEqual({ test_only: true });
    expect(offer).toMatchObject({
      product_id: productId,
      product_version_id: versionId,
      price_minor: 20000,
      currency: 'IDR',
      currency_exponent: 0,
    });
    expect(Number.isSafeInteger(offer!.price_minor)).toBe(true);
    expect(product?.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T.*Z$/);
    expect(
      (await db.prepare('PRAGMA foreign_key_check').all()).results,
    ).toEqual([]);
  });

  it('supports a different currency and explicit exponent without float prices', async () => {
    await db
      .prepare(
        "UPDATE offers SET price_minor = 1999, currency = 'USD', currency_exponent = 2 WHERE id = ?",
      )
      .bind(offerId)
      .run();
    const row = await db
      .prepare('SELECT price_minor, currency, currency_exponent FROM offers')
      .first();
    expect(row).toEqual({
      price_minor: 1999,
      currency: 'USD',
      currency_exponent: 2,
    });
  });

  it.each([20000.5, -1, 9007199254740992, 'not-money'])(
    'rejects unsafe price representation %s',
    async (price) => {
      await expect(
        db.prepare('UPDATE offers SET price_minor = ?').bind(price).run(),
      ).rejects.toThrow();
    },
  );

  it.each(['idr', 'US', '123', 'USDD'])(
    'rejects malformed currency %s',
    async (currency) => {
      await expect(
        db.prepare('UPDATE offers SET currency = ?').bind(currency).run(),
      ).rejects.toThrow();
    },
  );

  it.each([-1, 7, 1.5])(
    'rejects invalid monetary exponent %s',
    async (exponent) => {
      await expect(
        db
          .prepare('UPDATE offers SET currency_exponent = ?')
          .bind(exponent)
          .run(),
      ).rejects.toThrow();
    },
  );

  it('enforces foreign keys and restricts deleting referenced products/versions', async () => {
    await expect(
      db
        .prepare('UPDATE product_versions SET product_id = ?')
        .bind(newId())
        .run(),
    ).rejects.toThrow();
    await expect(
      db
        .prepare('UPDATE offers SET product_version_id = ?')
        .bind(newId())
        .run(),
    ).rejects.toThrow();
    await expect(
      db.prepare('DELETE FROM products WHERE id = ?').bind(productId).run(),
    ).rejects.toThrow();
    await expect(
      db
        .prepare('DELETE FROM product_versions WHERE id = ?')
        .bind(versionId)
        .run(),
    ).rejects.toThrow();
  });

  it('prevents offers linking a version belonging to a different product', async () => {
    const other = newId();
    await db
      .prepare('INSERT INTO products (id, name, slug) VALUES (?, ?, ?)')
      .bind(other, 'Other test product', 'other-test')
      .run();
    await expect(
      db.prepare('UPDATE offers SET product_id = ?').bind(other).run(),
    ).rejects.toThrow();
  });

  it('enforces unique slugs and product/version labels', async () => {
    await expect(
      db
        .prepare('INSERT INTO products (id, name, slug) VALUES (?, ?, ?)')
        .bind(newId(), 'Duplicate', 'test-foundation-product')
        .run(),
    ).rejects.toThrow();
    await expect(
      db
        .prepare(
          'INSERT INTO product_versions (id, product_id, version) VALUES (?, ?, ?)',
        )
        .bind(newId(), productId, 'test-v1')
        .run(),
    ).rejects.toThrow();
  });

  it.each(['products', 'product_versions', 'offers'])(
    'rejects unknown lifecycle in %s',
    async (table) => {
      await expect(
        db.prepare(`UPDATE ${table} SET status = 'PAID'`).run(),
      ).rejects.toThrow();
    },
  );

  it.each(['{broken', '[]', 'null'])(
    'requires object JSON metadata: %s',
    async (json) => {
      await expect(
        db
          .prepare('UPDATE product_versions SET metadata_json = ?')
          .bind(json)
          .run(),
      ).rejects.toThrow();
    },
  );

  it('draft is the default, with no auto-publication', async () => {
    const id = newId();
    await db
      .prepare('INSERT INTO products (id, name, slug) VALUES (?, ?, ?)')
      .bind(id, 'Draft test', 'draft-test')
      .run();
    expect(
      await db
        .prepare('SELECT status FROM products WHERE id = ?')
        .bind(id)
        .first(),
    ).toEqual({ status: 'DRAFT' });
    expect((await get(`/api/products/${id}`)).status).toBe(404);
  });

  it('includes only three domain tables, no speculative transaction or marketplace schema', async () => {
    const result = await db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY name",
      )
      .all<{ name: string }>();
    expect(result.results.map((r) => r.name)).toEqual([
      'offers',
      'product_versions',
      'products',
    ]);
  });
});

describe('public read-only canonical API', () => {
  it('reads active product and offer from persisted D1 records', async () => {
    expect((await get(`/api/products/${productId}`)).status).toBe(200);
    const response = await get(`/api/offers/${offerId}`);
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      data: PublicOffer & Record<string, unknown>;
    };
    expect(body.data.price_minor).toBe(20000);
    expect(body.data).not.toHaveProperty('delivery_reference');
    expect(body.data).not.toHaveProperty('metadata_json');
    expect(await (await get('/api/products')).json()).toMatchObject({
      data: [{ id: productId }],
      next_cursor: null,
    });
    expect(await (await get('/api/offers')).json()).toMatchObject({
      data: [{ id: offerId }],
      next_cursor: null,
    });
  });

  it.each(['products', 'offers'])(
    'returns 404 for nonexistent %s records',
    async (resource) => {
      expect((await get(`/api/${resource}/${newId()}`)).status).toBe(404);
    },
  );

  it.each([
    '/api/products/bad',
    '/api/offers/bad',
    '/api/products/%27%20OR%201=1',
    '/api/products?limit=0',
    '/api/products?limit=51',
    '/api/offers?limit=1.5',
    '/api/offers?limit=-2',
    '/api/products?after=bad',
  ])('rejects unsafe input %s', async (path) => {
    expect((await get(path)).status).toBe(400);
  });

  it('paginates deterministically with a bounded keyset cursor', async () => {
    await db
      .prepare(
        'INSERT INTO products (id, name, slug, status) VALUES (?, ?, ?, ?)',
      )
      .bind(
        'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        'Pagination fixture',
        'pagination-test',
        'ACTIVE',
      )
      .run();
    const first = (await (await get('/api/products?limit=1')).json()) as {
      data: Product[];
      next_cursor: string;
    };
    expect(first.data.map((p) => p.id)).toEqual([productId]);
    expect(first.next_cursor).toBe(productId);
    const next = (await (
      await get(`/api/products?limit=1&after=${first.next_cursor}`)
    ).json()) as { data: Product[]; next_cursor: null };
    expect(next.data.map((p) => p.slug)).toEqual(['pagination-test']);
    expect(next.next_cursor).toBeNull();
  });

  it.each(['DRAFT', 'ARCHIVED'])(
    'hides %s products and related offers',
    async (status) => {
      await db.prepare('UPDATE products SET status = ?').bind(status).run();
      expect((await get(`/api/products/${productId}`)).status).toBe(404);
      expect((await get(`/api/offers/${offerId}`)).status).toBe(404);
      expect(await (await get('/api/products')).json()).toEqual({
        data: [],
        next_cursor: null,
      });
      expect(await (await get('/api/offers')).json()).toEqual({
        data: [],
        next_cursor: null,
      });
    },
  );

  it.each(['DRAFT', 'ARCHIVED'])(
    'hides offers of %s versions',
    async (status) => {
      await db
        .prepare('UPDATE product_versions SET status = ?')
        .bind(status)
        .run();
      expect((await get(`/api/offers/${offerId}`)).status).toBe(404);
      expect(await (await get('/api/offers')).json()).toEqual({
        data: [],
        next_cursor: null,
      });
    },
  );

  it.each(['DRAFT', 'ARCHIVED'])('hides %s offers', async (status) => {
    await db.prepare('UPDATE offers SET status = ?').bind(status).run();
    expect((await get(`/api/offers/${offerId}`)).status).toBe(404);
  });

  it.each(['POST', 'PUT', 'PATCH', 'DELETE'])(
    'does not expose unrestricted %s mutations on any surface',
    async (method) => {
      for (const path of [
        '/',
        '/health',
        '/ready',
        '/api/products',
        `/api/products/${productId}`,
        '/api/offers',
        '/api/admin',
        '/api/checkout',
      ]) {
        const response = await app.request(
          path,
          { method, body: '{}' },
          bindings(),
        );
        expect(response.status).toBe(405);
        expect(response.headers.get('Allow')).toBe('GET, HEAD, OPTIONS');
      }
      expect(
        (await db.prepare('SELECT COUNT(*) AS count FROM products').first())
          ?.count,
      ).toBe(1);
    },
  );

  it('supports safe HEAD/OPTIONS and denies nonexistent future APIs', async () => {
    const head = await app.request('/health', { method: 'HEAD' }, bindings());
    expect(head.status).toBe(200);
    expect(await head.text()).toBe('');
    expect(
      (await app.request('/api/products', { method: 'OPTIONS' }, bindings()))
        .status,
    ).toBe(204);
    for (const path of [
      '/api/checkout',
      '/api/payments',
      '/api/admin',
      '/api/versions',
      '/unknown',
    ]) {
      expect((await get(path)).status).toBe(404);
    }
  });
});
