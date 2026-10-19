import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { apiRouter } from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { env } from './config/env.js';
import { webhook } from './controllers/payment.controller.js';
import { asyncHandler } from './utils/asyncHandler.js';

const app = express();

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  }),
);
app.post(
  '/api/payments/webhook',
  express.raw({ type: 'application/json' }),
  asyncHandler(webhook),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/api', apiRouter);
app.use(errorHandler);

export default app;
