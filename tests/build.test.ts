import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Miniflare, convertV4MiniflareOptions, Log, LogLevel } from 'miniflare';

let runtime: Miniflare;
let db: D1Database;

beforeAll(async () => {
  runtime = new Miniflare(
    convertV4MiniflareOptions({
      name: 'built-worker-tests',
      modules: true,
      script: readFileSync('dist/_worker.js', 'utf8'),
      compatibilityDate: '2026-04-15',
      d1Databases: ['DB'],
      bindings: { APP_ENV: 'test' },
      log: new Log(LogLevel.ERROR),
    }),
  );
  db = (await runtime.getD1Database('DB')) as unknown as D1Database;
});

afterAll(async () => {
  await runtime?.dispose();
});
const request = (path: string, method = 'GET') =>
  runtime.dispatchFetch(`http://test.local${path}`, { method });

describe('compiled Pages Worker on actual workerd', () => {
  it('built health works with fresh, unmigrated D1', async () => {
    const health = await request('/health');
    expect(health.status).toBe(200);
    expect(await health.json()).toMatchObject({ service: 'tolvey' });
    expect((await request('/ready')).status).toBe(503);
  });

  it('applies schema to fresh D1 and reads canonical persisted fixtures through built Worker', async () => {
    for (const file of [
      'migrations/0001_canonical_catalog.sql',
      'tests/fixtures/local-catalog.sql',
    ]) {
      const sql = readFileSync(file, 'utf8')
        .replace(/^--.*$/gm, '')
        .split(/;\s*(?:\n|$)/)
        .map((s) => s.trim())
        .filter(Boolean);
      await db.batch(sql.map((s) => db.prepare(s)));
    }
    expect((await request('/ready')).status).toBe(200);
    const product = await request(
      '/api/products/11111111-1111-4111-8111-111111111111',
    );
    expect(product.status).toBe(200);
    expect(await product.json()).toMatchObject({
      data: { slug: 'test-foundation-product' },
    });
    const offer = await (
      await request('/api/offers/33333333-3333-4333-8333-333333333333')
    ).json();
    expect(offer).toMatchObject({
      data: { price_minor: 20000, currency: 'IDR', currency_exponent: 0 },
    });
    expect(JSON.stringify(offer)).not.toContain('delivery_reference');
  });

  it('compiled wrapper preserves JSON 404 on unknown API and page routes', async () => {
    for (const path of [
      '/api/checkout',
      '/api/payments',
      '/api/admin',
      '/unknown',
    ]) {
      const response = await request(path);
      expect(response.status).toBe(404);
      expect(await response.json()).toMatchObject({ error: 'NOT_FOUND' });
    }
  });

  it('compiled Worker rejects writes and unsafe identifiers', async () => {
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
      expect((await request('/api/products', method)).status).toBe(405);
    }
    expect((await request('/api/products/bad')).status).toBe(400);
  });

  it('compiled Worker handles database errors without exposing SQL details', async () => {
    await db.prepare('DROP TABLE offers').run();
    const response = await request('/api/offers');
    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({ error: 'INTERNAL_ERROR' });
    expect((await request('/ready')).status).toBe(503);
  });
});
