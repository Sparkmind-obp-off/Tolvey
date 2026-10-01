import { Hono } from 'hono';
import type { AppContext } from './types';
import { duitkuGateway } from './duitku-gateway';
import {
  DuitkuError,
  duitkuConfig,
  duitkuOperatorAvailable,
  equalSignature,
  hmacSha256,
} from './duitku-config';
import { DuitkuPop } from './duitku-pop';
import { TransactionError } from './transaction-domain';
const routes = new Hono<AppContext>();
// Private operational check, not customer checkout or Hosted route admission.
routes.post('/connection/check', async (c) => {
  const config = duitkuConfig(c.env);
  if (!duitkuOperatorAvailable(c.env))
    throw new DuitkuError('PAYMENT_UNAVAILABLE', 503);
  const header = c.req.header('Authorization');
  const supplied = header?.startsWith('Bearer ') ? header.slice(7) : '';
  if (
    supplied.length < 32 ||
    supplied.length > 256 ||
    !equalSignature(
      await hmacSha256('tolvey.operator.check', supplied),
      await hmacSha256('tolvey.operator.check', c.env.DUITKU_OPERATOR_TOKEN!),
    )
  )
    throw new DuitkuError('OPERATOR_UNAUTHORIZED', 401);
  // Request body/query never supplies provider credentials, amount, order or URL.
  try {
    const result = await new DuitkuPop(config, c.env.DB!).checkConnection();
    return c.json({ data: result });
  } catch (error) {
    if (
      error instanceof DuitkuError &&
      error.code === 'PROVIDER_AUTH_UNVERIFIED'
    )
      return c.json(
        {
          error: error.code,
          diagnostic: error.diagnostic,
          request_id: c.get('requestId'),
        },
        503,
      );
    throw error;
  }
});
routes.post('/callback', async (c) => {
  await duitkuGateway(c.env).callback(c.req.raw, c.get('requestId'));
  // POP docs require an HTTP POST receiver, no mandatory acknowledgement body is specified.
  return c.text('OK', 200);
});
routes.onError((error, c) => {
  const status =
    error instanceof DuitkuError || error instanceof TransactionError
      ? error.status
      : 503;
  console.info(
    JSON.stringify({
      event: 'payment.notification',
      request_id: c.get('requestId'),
      status,
    }),
  );
  return c.json(
    {
      error: 'PAYMENT_NOTIFICATION_REJECTED',
      message: 'Payment notification could not be processed.',
      request_id: c.get('requestId'),
    },
    status,
  );
});
export default routes;
