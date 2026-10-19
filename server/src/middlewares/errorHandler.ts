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

  const candidateStatus = typeof err === 'object' && err !== null && 'status' in err
    ? err.status
    : typeof err === 'object' && err !== null && 'statusCode' in err
      ? err.statusCode
      : undefined;
  const status = typeof candidateStatus === 'number' && candidateStatus >= 400 && candidateStatus < 500
    ? candidateStatus
    : 500;
  return res.status(status).json({
    success: false,
    message: status === 500 ? 'Internal server error' : 'Invalid request',
  });
};
