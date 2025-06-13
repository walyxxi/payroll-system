import { logger } from '../utils/logger.js';
import AppError from '../utils/AppError.js';

export const errorHandler = (err, req, res, next) => {
  const status = (err instanceof AppError && err.status) || 500;
  const requestId = String(req.headers['x-request-id'] || '');
  const userId = req.user && req.user.id;
  const ip = req.ip;

  logger.error('[%s] %s %s - %s', requestId, req.method, req.originalUrl, err.message, {
    stack: err.stack,
    userId,
    ip,
    details: err.details,
  });

  const response = {
    error: err.message || 'Internal Server Error',
    ...(err instanceof AppError && err.details ? { details: err.details } : {}),
    requestId,
  };
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(status).json(response);
};