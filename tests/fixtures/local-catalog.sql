-- DEVELOPMENT / TEST DATA ONLY. Never apply this file to a remote database.
-- These are foundation verification fixtures, not Money Kit or commercial evidence.
INSERT OR IGNORE INTO products (id, name, slug, summary, status)
VALUES ('11111111-1111-4111-8111-111111111111', '[TEST] Foundation Product', 'test-foundation-product', 'Development verification fixture; not for sale.', 'ACTIVE');
INSERT OR IGNORE INTO product_versions (id, product_id, version, status, metadata_json)
VALUES ('22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111', 'test-v1', 'ACTIVE', '{"test_only":true}');
INSERT OR IGNORE INTO offers (id, product_id, product_version_id, name, price_minor, currency, currency_exponent, status, delivery_reference)
VALUES ('33333333-3333-4333-8333-333333333333', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', '[TEST] IDR verification offer', 20000, 'IDR', 0, 'ACTIVE', 'test-only:no-delivery');
