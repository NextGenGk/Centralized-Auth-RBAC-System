import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { logger }   from '../utils/logger';

interface PrismaKnownError extends Error {
  code: string;
}

const isPrismaKnownError = (err: unknown): err is PrismaKnownError =>
  typeof err === 'object' &&
  err !== null &&
  'code' in err &&
  typeof (err as Record<string, unknown>).code === 'string' &&
  err instanceof Error;

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

  // Prisma known request errors (P2002 = unique, P2025 = not found)
  if (isPrismaKnownError(err)) {
    if (err.code === 'P2002') {
      res.status(409).json({ status: 'error', message: 'Record already exists' });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({ status: 'error', message: 'Record not found' });
      return;
    }
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
  if (error.name === 'NotBeforeError') {
    res.status(401).json({ status: 'error', message: 'Token not yet valid' });
    return;
  }

  logger.error('Unhandled error', { error: err });
  res.status(500).json({ status: 'error', message: 'Internal server error' });
};
