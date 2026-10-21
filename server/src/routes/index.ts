import { Router } from 'express';
import { authRouter } from './auth.routes.js';
import { mapsRouter } from './maps.routes.js';
import { ridesRouter } from './rides.routes.js';
import { driverRouter } from './driver.routes.js';
import { paymentsRouter } from './payments.routes.js';
import { reviewsRouter } from './reviews.routes.js';
import { receiptsRouter } from './receipts.routes.js';
import { health } from '../controllers/health.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/maps', mapsRouter);
apiRouter.use('/rides', ridesRouter);
apiRouter.use('/driver', driverRouter);
apiRouter.use('/payments', paymentsRouter);
apiRouter.use('/reviews', reviewsRouter);
apiRouter.use('/receipts', receiptsRouter);
apiRouter.get('/health', asyncHandler(health));
