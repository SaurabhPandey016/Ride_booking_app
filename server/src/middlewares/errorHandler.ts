import type { ErrorRequestHandler } from 'express';
import { AppError } from '../utils/AppError.js';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.details ?? undefined,
    });
  }

  const status = err.statusCode ?? 500;
  return res.status(status).json({
    success: false,
    message: 'Internal server error',
    errors: err instanceof Error ? err.message : 'Unexpected error',
  });
};
