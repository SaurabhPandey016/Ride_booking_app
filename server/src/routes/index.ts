import { Router } from 'express';
import { authRouter } from './auth.routes.js';
import { mapsRouter } from './maps.routes.js';
import { ridesRouter } from './rides.routes.js';
import { driverRouter } from './driver.routes.js';
import { paymentsRouter } from './payments.routes.js';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/maps', mapsRouter);
apiRouter.use('/rides', ridesRouter);
apiRouter.use('/driver', driverRouter);
apiRouter.use('/payments', paymentsRouter);
apiRouter.get('/health', (_req, res) => {
  res.status(200).json({ success: true, message: 'RideX server is healthy', data: { status: 'ok' } });
});
