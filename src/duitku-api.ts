import { Hono } from 'hono';
import type { AppContext } from './types';
import { duitkuGateway } from './duitku-gateway';
import { DuitkuError } from './duitku-config';
import { TransactionError } from './transaction-domain';
const routes = new Hono<AppContext>();
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
