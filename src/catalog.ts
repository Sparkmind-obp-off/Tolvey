import type { Product, PublicOffer } from './types';

const productColumns =
  'id, name, slug, summary, status, created_at, updated_at';
const offerColumns =
  'o.id, o.product_id, o.product_version_id, o.name, o.price_minor, o.currency, o.currency_exponent, o.status, o.created_at, o.updated_at';
const publicOfferJoin = `FROM offers o
  JOIN products p ON p.id = o.product_id
  JOIN product_versions v ON v.id = o.product_version_id AND v.product_id = o.product_id
  WHERE o.status = 'ACTIVE' AND p.status = 'ACTIVE' AND v.status = 'ACTIVE'`;

// A readiness probe checks the actual columns needed by the public read model.
export async function verifySchema(db: D1Database): Promise<void> {
  await db.batch([
    db.prepare(`SELECT ${productColumns} FROM products LIMIT 0`),
    db.prepare(
      'SELECT id, product_id, version, status, metadata_json, created_at, updated_at FROM product_versions LIMIT 0',
    ),
    db.prepare(
      `SELECT ${offerColumns}, o.delivery_reference FROM offers o LIMIT 0`,
    ),
  ]);
}

export async function listProducts(
  db: D1Database,
  limit: number,
  after: string | null,
) {
  const result = await db
    .prepare(
      `SELECT ${productColumns} FROM products
      WHERE status = 'ACTIVE' AND id > ? ORDER BY id LIMIT ?`,
    )
    .bind(after ?? '', limit + 1)
    .all<Product>();
  return page(result.results, limit);
}

export async function getProduct(db: D1Database, id: string) {
  return db
    .prepare(
      `SELECT ${productColumns} FROM products WHERE id = ? AND status = 'ACTIVE'`,
    )
    .bind(id)
    .first<Product>();
}

export async function listOffers(
  db: D1Database,
  limit: number,
  after: string | null,
) {
  const result = await db
    .prepare(
      `SELECT ${offerColumns} ${publicOfferJoin} AND o.id > ? ORDER BY o.id LIMIT ?`,
    )
    .bind(after ?? '', limit + 1)
    .all<PublicOffer>();
  return page(result.results, limit);
}

export async function getOffer(db: D1Database, id: string) {
  return db
    .prepare(`SELECT ${offerColumns} ${publicOfferJoin} AND o.id = ?`)
    .bind(id)
    .first<PublicOffer>();
}

function page<T extends { id: string }>(rows: T[], limit: number) {
  const data = rows.slice(0, limit);
  return {
    data,
    next_cursor: rows.length > limit ? data[data.length - 1].id : null,
  };
}
