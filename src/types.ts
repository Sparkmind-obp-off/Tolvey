export type Lifecycle = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
export type AppEnvironment = 'local' | 'test' | 'staging' | 'production';

export type Bindings = {
  DB?: D1Database;
  APP_ENV?: string;
  TRANSACTION_CORE_ENABLED?: string;
  TRANSACTION_CORE_TOKEN?: string;
};

export type AppContext = {
  Bindings: Bindings;
  Variables: { requestId: string };
};

export interface Product {
  id: string;
  name: string;
  slug: string;
  summary: string;
  status: Lifecycle;
  created_at: string;
  updated_at: string;
}

export interface ProductVersion {
  id: string;
  product_id: string;
  version: string;
  status: Lifecycle;
  metadata_json: string;
  created_at: string;
  updated_at: string;
}

// Private delivery configuration is intentionally absent from public API DTOs.
export interface PublicOffer {
  id: string;
  product_id: string;
  product_version_id: string;
  name: string;
  price_minor: number;
  currency: string;
  currency_exponent: number;
  status: Lifecycle;
  created_at: string;
  updated_at: string;
}
