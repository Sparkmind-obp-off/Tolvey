import type { Bindings } from './types';

export interface ConnectionDiagnostic {
  signed_http?: number;
  control_http?: number;
  amount_validation?: boolean;
  transport_failed?: boolean;
  transport_failure_kind?:
    'native_receiver' | 'timeout' | 'fetch_option' | 'unverified';
  checked_at: string;
}

export class DuitkuError extends Error {
  constructor(
    public code: string,
    public status: 400 | 401 | 404 | 409 | 413 | 503 = 400,
    public diagnostic?: ConnectionDiagnostic,
  ) {
    super(code);
  }
}
export interface DuitkuConfig {
  environment: 'sandbox' | 'production';
  merchantCode: string;
  apiKey: string;
  callbackUrl: string;
  returnUrl: string;
}
export function duitkuConfig(env: Bindings): DuitkuConfig {
  if (
    !(
      (['local', 'test'].includes(env.APP_ENV ?? '') &&
        env.DUITKU_ENV === 'sandbox') ||
      (env.APP_ENV === 'production' && env.DUITKU_ENV === 'production')
    ) ||
    env.DUITKU_POP_ENABLED !== 'true' ||
    !env.DB
  )
    throw new DuitkuError('PAYMENT_UNAVAILABLE', 503);
  if (
    typeof env.DUITKU_MERCHANT_CODE !== 'string' ||
    !/^[A-Za-z0-9]{1,50}$/.test(env.DUITKU_MERCHANT_CODE) ||
    typeof env.DUITKU_API_KEY !== 'string' ||
    !/^[A-Za-z0-9_-]{16,256}$/.test(env.DUITKU_API_KEY)
  )
    throw new DuitkuError('PAYMENT_UNAVAILABLE', 503);
  function url(value: unknown, path: string) {
    if (typeof value !== 'string' || value.length > 255)
      throw new DuitkuError('PAYMENT_UNAVAILABLE', 503);
    let u: URL;
    try {
      u = new URL(value);
    } catch {
      throw new DuitkuError('PAYMENT_UNAVAILABLE', 503);
    }
    if (
      u.protocol !== 'https:' ||
      u.username ||
      u.password ||
      u.search ||
      u.hash ||
      u.pathname !== path ||
      /^(localhost|127\.|0\.|169\.254\.|10\.|192\.168\.|\[)/.test(u.hostname)
    )
      throw new DuitkuError('PAYMENT_UNAVAILABLE', 503);
    return u;
  }
  const callback = url(
    env.DUITKU_CALLBACK_URL,
    '/api/provider/duitku-pop/callback',
  );
  const returned = url(env.DUITKU_RETURN_URL, '/payments/duitku-pop/return');
  if (callback.origin !== returned.origin)
    throw new DuitkuError('PAYMENT_UNAVAILABLE', 503);
  return {
    environment: env.DUITKU_ENV as 'sandbox' | 'production',
    merchantCode: env.DUITKU_MERCHANT_CODE,
    apiKey: env.DUITKU_API_KEY,
    callbackUrl: callback.href,
    returnUrl: returned.href,
  };
}
// Connection checks use a separate server-only operator secret, never the provider key.
export function duitkuOperatorAvailable(env: Bindings): boolean {
  return (
    typeof env.DUITKU_OPERATOR_TOKEN === 'string' &&
    env.DUITKU_OPERATOR_TOKEN.length >= 32 &&
    env.DUITKU_OPERATOR_TOKEN.length <= 256
  );
}

export function duitkuEndpoints(config: DuitkuConfig) {
  if (config.environment === 'production')
    return {
      create: 'https://api-prod.duitku.com/api/merchant/createInvoice',
      status:
        'https://passport.duitku.com/webapi/api/merchant/transactionStatus',
      paymentOrigin: 'https://app-prod.duitku.com',
    };
  if (config.environment === 'sandbox')
    return {
      create: 'https://api-sandbox.duitku.com/api/merchant/createInvoice',
      status:
        'https://sandbox.duitku.com/webapi/api/merchant/transactionStatus',
      paymentOrigin: 'https://app-sandbox.duitku.com',
    };
  throw new DuitkuError('PAYMENT_UNAVAILABLE', 503);
}

export async function hmacSha256(
  message: string,
  secret: string,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signed = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(message),
  );
  return Array.from(new Uint8Array(signed), (b) =>
    b.toString(16).padStart(2, '0'),
  ).join('');
}
export function equalSignature(actual: string, expected: string) {
  if (!/^[a-f0-9]{64}$/i.test(actual)) return false;
  let diff = 0;
  for (let i = 0; i < 64; i++)
    diff |= actual.toLowerCase().charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}
export async function boundedText(
  request: Request | Response,
  max: number,
): Promise<string> {
  const reader = request.body?.getReader();
  if (!reader) throw new DuitkuError('INVALID_BODY');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > max) {
        await reader.cancel();
        throw new DuitkuError('BODY_TOO_LARGE', 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let at = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, at);
    at += chunk.byteLength;
  }
  try {
    return new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }).decode(
      bytes,
    );
  } catch {
    throw new DuitkuError('INVALID_BODY');
  }
}
