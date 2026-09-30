import { isId } from './config';

export type TransactionState =
  | 'OFFER_READY'
  | 'CHECKOUT_STARTED'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_CONFIRMED'
  | 'FULFILLMENT_PENDING'
  | 'FULFILLED'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_EXPIRED'
  | 'CANCELLED'
  | 'FULFILLMENT_FAILED'
  | 'REFUND_PENDING'
  | 'REFUNDED';
export type PaymentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'FAILED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'REFUND_PENDING'
  | 'REFUNDED';

const transitions: Record<TransactionState, readonly TransactionState[]> = {
  OFFER_READY: ['CHECKOUT_STARTED'],
  CHECKOUT_STARTED: ['PAYMENT_PENDING', 'PAYMENT_EXPIRED', 'CANCELLED'],
  PAYMENT_PENDING: [
    'PAYMENT_CONFIRMED',
    'PAYMENT_FAILED',
    'PAYMENT_EXPIRED',
    'CANCELLED',
  ],
  PAYMENT_CONFIRMED: ['FULFILLMENT_PENDING', 'REFUND_PENDING'],
  FULFILLMENT_PENDING: ['FULFILLED', 'FULFILLMENT_FAILED', 'REFUND_PENDING'],
  FULFILLMENT_FAILED: ['FULFILLMENT_PENDING', 'REFUND_PENDING'],
  FULFILLED: ['REFUND_PENDING'],
  PAYMENT_FAILED: [],
  PAYMENT_EXPIRED: [],
  CANCELLED: [],
  REFUND_PENDING: ['REFUNDED'],
  REFUNDED: [],
};

export class TransactionError extends Error {
  constructor(
    public code: string,
    public status: 400 | 404 | 409 | 413 | 503 = 400,
  ) {
    super(code);
  }
}

export function assertTransition(
  from: TransactionState,
  to: TransactionState,
): void {
  if (!transitions[from]?.includes(to))
    throw new TransactionError('INVALID_TRANSITION', 409);
}

export interface CheckoutInput {
  offer_id: string;
  quantity: number;
  source_channel: string;
  customer_reference: string | null;
}

export function parseCheckout(input: unknown): CheckoutInput {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw new TransactionError('INVALID_INPUT');
  const data = input as Record<string, unknown>;
  const allowed = [
    'offer_id',
    'quantity',
    'source_channel',
    'customer_reference',
  ];
  if (Object.keys(data).some((key) => !allowed.includes(key)))
    throw new TransactionError('INVALID_INPUT');
  if (typeof data.offer_id !== 'string' || !isId(data.offer_id))
    throw new TransactionError('INVALID_OFFER_ID');
  if (
    !Number.isInteger(data.quantity) ||
    Number(data.quantity) < 1 ||
    Number(data.quantity) > 100
  )
    throw new TransactionError('INVALID_QUANTITY');
  if (
    typeof data.source_channel !== 'string' ||
    !/^[a-z0-9][a-z0-9._-]{0,63}$/.test(data.source_channel)
  )
    throw new TransactionError('INVALID_SOURCE');
  if (
    data.customer_reference != null &&
    (typeof data.customer_reference !== 'string' ||
      !isId(data.customer_reference))
  )
    throw new TransactionError('INVALID_CUSTOMER_REFERENCE');
  return {
    offer_id: data.offer_id.toLowerCase(),
    quantity: Number(data.quantity),
    source_channel: data.source_channel,
    customer_reference:
      typeof data.customer_reference === 'string'
        ? data.customer_reference.toLowerCase()
        : null,
  };
}

export function validateIdempotencyKey(key: string): void {
  if (!/^[A-Za-z0-9._:-]{16,128}$/.test(key))
    throw new TransactionError('INVALID_IDEMPOTENCY_KEY');
}

export async function hash(value: string): Promise<string> {
  const bytes = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(bytes), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
}

// Contract only. Phase 3 supplies a real implementation with provider verification.
export interface PaymentAdapter {
  readonly key: string;
  initiate(input: {
    order_id: string;
    transaction_reference: string;
    amount_minor: number;
    currency: string;
    currency_exponent: number;
    idempotency_key: string;
  }): Promise<{ provider_reference: string; status: 'PENDING' }>;
  verifyNotification(request: Request): Promise<VerifiedPaymentSignal>;
}
export interface VerifiedPaymentSignal {
  provider: string;
  event_reference: string;
  provider_reference: string;
  transaction_reference: string;
  amount_minor: number;
  currency: string;
  currency_exponent: number;
  status: PaymentStatus;
}
