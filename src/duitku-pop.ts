import { isId } from './config';
import {
  hash,
  type PaymentAdapter,
  type VerifiedPaymentSignal,
} from './transaction-domain';
import { getOrder, type OrderRecord } from './transaction-store';
import {
  boundedText,
  DuitkuError,
  equalSignature,
  hmacSha256,
  type DuitkuConfig,
} from './duitku-config';

export interface PopResult {
  provider_reference: string;
  status: 'PENDING';
  payment_url: string;
}
export interface AuthenticatedCallback {
  order_id: string;
  reference: string;
  amount: number;
  result: '00' | '01';
  payload_hash: string;
}
export const POP_CREATE_URL =
  'https://api-sandbox.duitku.com/api/merchant/createInvoice';
// Official common verification API (not V2 invoice creation). POP project applicability must be live-verified.
export const STATUS_URL =
  'https://sandbox.duitku.com/webapi/api/merchant/transactionStatus';
export function callbackStatus(result: string): 'CONFIRMED' | 'FAILED' {
  if (result === '00') return 'CONFIRMED';
  if (result === '01') return 'FAILED';
  throw new DuitkuError('UNKNOWN_STATUS');
}
function reference(value: unknown): asserts value is string {
  if (
    typeof value !== 'string' ||
    !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(value)
  )
    throw new DuitkuError('INVALID_REFERENCE');
}
function amount(value: unknown): number {
  if (
    typeof value !== 'string' ||
    !/^[1-9][0-9]{0,15}$/.test(value) ||
    !Number.isSafeInteger(Number(value))
  )
    throw new DuitkuError('INVALID_AMOUNT');
  return Number(value);
}
export function payable(
  order: OrderRecord | null,
  now: Date,
): asserts order is OrderRecord {
  if (!order) throw new DuitkuError('ORDER_NOT_FOUND', 404);
  if (order.state !== 'CHECKOUT_STARTED' || order.payment_status !== 'PENDING')
    throw new DuitkuError('ORDER_NOT_PAYABLE', 409);
  if (
    !Number.isFinite(now.getTime()) ||
    now.toISOString() < order.updated_at ||
    now.toISOString() >= order.expires_at
  )
    throw new DuitkuError('ORDER_EXPIRED', 409);
  if (
    !Number.isSafeInteger(order.amount_minor) ||
    order.amount_minor <= 0 ||
    order.currency !== 'IDR' ||
    order.currency_exponent !== 0
  )
    throw new DuitkuError('UNSUPPORTED_MONEY');
}

export class DuitkuPop implements PaymentAdapter {
  readonly key = 'duitku-pop-sandbox';
  private authenticated = new WeakSet<object>();
  constructor(
    private config: DuitkuConfig,
    private db: D1Database,
    private transport: typeof fetch = fetch,
    private clock: () => Date = () => new Date(),
  ) {}

  private async post(
    url: string,
    body: object,
    headers: Record<string, string> = {},
  ) {
    try {
      const response = await this.transport(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(body),
        redirect: 'error',
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok)
        throw new DuitkuError(
          response.status === 409 ? 'PROVIDER_BUSY' : 'PROVIDER_UNAVAILABLE',
          503,
        );
      if (
        response.headers
          .get('content-type')
          ?.split(';')[0]
          .trim()
          .toLowerCase() !== 'application/json'
      )
        throw new DuitkuError('INVALID_PROVIDER_RESPONSE', 503);
      const data = JSON.parse(await boundedText(response, 16384));
      if (!data || typeof data !== 'object' || Array.isArray(data))
        throw new DuitkuError('INVALID_PROVIDER_RESPONSE', 503);
      return data as Record<string, unknown>;
    } catch (error) {
      if (error instanceof DuitkuError) throw error;
      throw new DuitkuError('PROVIDER_UNAVAILABLE', 503);
    }
  }
  async initiate(
    input: Parameters<PaymentAdapter['initiate']>[0],
    email?: string,
  ): Promise<PopResult> {
    const order = await getOrder(this.db, input.order_id);
    const now = this.clock();
    payable(order, now);
    if (
      order.transaction_reference !== input.transaction_reference ||
      order.amount_minor !== input.amount_minor ||
      order.currency !== input.currency ||
      order.currency_exponent !== input.currency_exponent
    )
      throw new DuitkuError('CANONICAL_MISMATCH', 409);
    if (
      typeof email !== 'string' ||
      email.length > 255 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    )
      throw new DuitkuError('EMAIL_REQUIRED');
    const minutes = Math.floor(
      (Date.parse(order.expires_at) - now.getTime()) / 60000,
    );
    if (minutes < 1) throw new DuitkuError('ORDER_EXPIRED', 409);
    const timestamp = String(now.getTime());
    const data = await this.post(
      POP_CREATE_URL,
      {
        paymentAmount: order.amount_minor,
        merchantOrderId: order.id,
        productDetails: order.offer_name,
        email,
        callbackUrl: this.config.callbackUrl,
        returnUrl: this.config.returnUrl,
        expiryPeriod: minutes,
        // paymentMethod intentionally omitted: Duitku POP owns method selection.
      },
      {
        'x-duitku-timestamp': timestamp,
        'x-duitku-merchantcode': this.config.merchantCode,
        'x-duitku-signature': await hmacSha256(
          this.config.merchantCode + timestamp,
          this.config.apiKey,
        ),
      },
    );
    if (
      data.statusCode !== '00' ||
      data.merchantCode !== this.config.merchantCode
    )
      throw new DuitkuError('INVALID_PROVIDER_RESPONSE', 503);
    reference(data.reference);
    let url: URL;
    try {
      url = new URL(String(data.paymentUrl));
    } catch {
      throw new DuitkuError('INVALID_PROVIDER_RESPONSE', 503);
    }
    if (
      url.origin !== 'https://app-sandbox.duitku.com' ||
      url.pathname !== '/redirect_checkout' ||
      url.username ||
      url.password ||
      url.hash ||
      url.searchParams.getAll('reference').length !== 1 ||
      url.searchParams.get('reference') !== data.reference ||
      Array.from(url.searchParams.keys()).some((k) => k !== 'reference')
    )
      throw new DuitkuError('INVALID_PROVIDER_RESPONSE', 503);
    return {
      provider_reference: data.reference,
      status: 'PENDING',
      payment_url: url.href,
    };
  }

  async authenticate(request: Request): Promise<AuthenticatedCallback> {
    if (
      request.method !== 'POST' ||
      request.headers
        .get('content-type')
        ?.split(';')[0]
        .trim()
        .toLowerCase() !== 'application/x-www-form-urlencoded'
    )
      throw new DuitkuError('INVALID_CONTENT_TYPE');
    const text = await boundedText(request, 8192);
    if (/%(?![0-9a-f]{2})/i.test(text)) throw new DuitkuError('INVALID_BODY');
    // URLSearchParams silently replaces invalid UTF-8 percent sequences; disallow those.
    try {
      decodeURIComponent(text.replaceAll('+', ' '));
    } catch {
      throw new DuitkuError('INVALID_BODY');
    }
    const form = new URLSearchParams(text);
    if (Array.from(form.keys()).some((k) => form.getAll(k).length !== 1))
      throw new DuitkuError('DUPLICATE_FIELD');
    if (
      form.size > 40 ||
      Array.from(form.values()).some((v) => v.length > 2048)
    )
      throw new DuitkuError('INVALID_BODY');
    const merchant = form.get('merchantCode'),
      rawAmount = form.get('amount'),
      id = form.get('merchantOrderId'),
      signature = form.get('signature');
    if (
      merchant !== this.config.merchantCode ||
      typeof id !== 'string' ||
      !isId(id) ||
      id !== id.toLowerCase() ||
      !signature
    )
      throw new DuitkuError('INVALID_NOTIFICATION', 401);
    const paidAmount = amount(rawAmount);
    const expected = await hmacSha256(
      merchant + rawAmount + id,
      this.config.apiKey,
    );
    if (!equalSignature(signature, expected))
      throw new DuitkuError('INVALID_NOTIFICATION', 401);
    const ref = form.get('reference');
    reference(ref);
    const result = form.get('resultCode');
    callbackStatus(result ?? '');
    const callback: AuthenticatedCallback = {
      order_id: id,
      reference: ref,
      amount: paidAmount,
      result: result as '00' | '01',
      payload_hash: await hash(
        JSON.stringify([merchant, id, rawAmount, ref, result]),
      ),
    };
    this.authenticated.add(callback);
    return callback;
  }
  async normalize(
    callback: AuthenticatedCallback,
  ): Promise<VerifiedPaymentSignal> {
    if (!this.authenticated.has(callback))
      throw new DuitkuError('INVALID_NOTIFICATION', 401);
    const order = await getOrder(this.db, callback.order_id);
    if (!order) throw new DuitkuError('ORDER_NOT_FOUND', 404);
    if (
      order.currency !== 'IDR' ||
      order.currency_exponent !== 0 ||
      order.amount_minor !== callback.amount
    )
      throw new DuitkuError('AMOUNT_MISMATCH', 409);
    const payment = await this.db
      .prepare(
        'SELECT provider,provider_reference FROM payments WHERE order_id=?',
      )
      .bind(order.id)
      .first<{ provider: string; provider_reference: string }>();
    if (
      payment?.provider !== this.key ||
      payment.provider_reference !== callback.reference
    )
      throw new DuitkuError('REFERENCE_MISMATCH', 409);
    // Callback HMAC does NOT cover resultCode/reference. Never trust those alone.
    const status = await this.post(STATUS_URL, {
      merchantCode: this.config.merchantCode,
      merchantOrderId: order.id,
      signature: await hmacSha256(
        this.config.merchantCode + order.id,
        this.config.apiKey,
      ),
    });
    if (
      status.merchantOrderId !== order.id ||
      status.reference !== callback.reference ||
      amount(status.amount) !== order.amount_minor
    )
      throw new DuitkuError('STATUS_MISMATCH', 409);
    const mapped = callbackStatus(callback.result);
    if (status.statusCode !== (mapped === 'CONFIRMED' ? '00' : '02'))
      throw new DuitkuError('STATUS_NOT_FINAL', 503);
    return {
      provider: this.key,
      provider_reference: callback.reference,
      event_reference: 'notification:' + callback.reference,
      transaction_reference: order.transaction_reference,
      amount_minor: order.amount_minor,
      currency: order.currency,
      currency_exponent: order.currency_exponent,
      status: mapped,
    };
  }
  async verifyNotification(request: Request): Promise<VerifiedPaymentSignal> {
    return this.normalize(await this.authenticate(request));
  }
}
