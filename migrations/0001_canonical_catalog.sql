-- Canonical TOLVEY catalog only. No payment, order, customer, or delivery execution.
CREATE TABLE products (
  id TEXT PRIMARY KEY NOT NULL CHECK(length(id) = 36),
  name TEXT NOT NULL CHECK(length(trim(name)) BETWEEN 1 AND 160),
  slug TEXT NOT NULL UNIQUE CHECK(
    length(slug) BETWEEN 1 AND 100
    AND slug NOT GLOB '*[^a-z0-9-]*'
    AND substr(slug, 1, 1) <> '-' AND substr(slug, -1, 1) <> '-'
  ),
  summary TEXT NOT NULL DEFAULT '' CHECK(length(summary) <= 4000),
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT', 'ACTIVE', 'ARCHIVED')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
) STRICT;

CREATE TABLE product_versions (
  id TEXT PRIMARY KEY NOT NULL CHECK(length(id) = 36),
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  version TEXT NOT NULL CHECK(length(trim(version)) BETWEEN 1 AND 60),
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT', 'ACTIVE', 'ARCHIVED')),
  metadata_json TEXT NOT NULL DEFAULT '{}' CHECK(json_valid(metadata_json) AND json_type(metadata_json) = 'object'),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE(product_id, version),
  UNIQUE(product_id, id)
) STRICT;

CREATE TABLE offers (
  id TEXT PRIMARY KEY NOT NULL CHECK(length(id) = 36),
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_version_id TEXT NOT NULL,
  name TEXT NOT NULL CHECK(length(trim(name)) BETWEEN 1 AND 160),
  price_minor INTEGER NOT NULL CHECK(typeof(price_minor) = 'integer' AND price_minor BETWEEN 0 AND 9007199254740991),
  currency TEXT NOT NULL CHECK(length(currency) = 3 AND currency NOT GLOB '*[^A-Z]*'),
  currency_exponent INTEGER NOT NULL CHECK(currency_exponent BETWEEN 0 AND 6),
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT', 'ACTIVE', 'ARCHIVED')),
  delivery_reference TEXT NOT NULL CHECK(length(trim(delivery_reference)) BETWEEN 1 AND 300),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY(product_id, product_version_id) REFERENCES product_versions(product_id, id) ON DELETE RESTRICT
) STRICT;

CREATE INDEX products_public_idx ON products(status, id);
CREATE INDEX versions_product_idx ON product_versions(product_id, status, id);
CREATE INDEX offers_public_idx ON offers(status, id);
CREATE INDEX offers_version_idx ON offers(product_id, product_version_id, status);
