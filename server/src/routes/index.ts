import { Router } from 'express';
import { authRouter } from './auth.routes.js';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.get('/health', (_req, res) => {
  res.status(200).json({ success: true, message: 'RideX server is healthy', data: { status: 'ok' } });
});
