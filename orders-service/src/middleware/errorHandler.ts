import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { logger }   from '../utils/logger';

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ status: 'error', message: err.message });
    return;
  }

  const error = err as Error;

  if (error.name === 'JsonWebTokenError') {
    res.status(401).json({ status: 'error', message: 'Invalid token' });
    return;
  }
  if (error.name === 'TokenExpiredError') {
    res.status(401).json({ status: 'error', message: 'Token has expired' });
    return;
  }

  logger.error('Unhandled error', { error: err });
  res.status(500).json({ status: 'error', message: 'Internal server error' });
};
