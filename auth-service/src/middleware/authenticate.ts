import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { isTokenBlacklisted } from '../utils/redis';
import { AppError } from '../utils/AppError';

/** Verifies Bearer JWT and populates req.user */
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError('No token provided', 401));
  }

  const token = authHeader.split(' ')[1];

  // Reject blacklisted tokens immediately
  const blacklisted = await isTokenBlacklisted(token);
  if (blacklisted) {
    return next(new AppError('Token has been revoked', 401));
  }

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (err) {
    next(err); // JWT errors → errorHandler
  }
};

/** Checks that req.user has at least one of the given roles */
export const requireRole = (...roles: string[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(new AppError('Authentication required', 401));

    const hasRole = req.user.roles.some((r) => roles.includes(r));
    if (!hasRole) return next(new AppError('Admin access required', 403));

    next();
  };

/** Checks that req.user has a specific permission */
export const requirePermission = (permission: string) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(new AppError('Authentication required', 401));

    if (!req.user.permissions.includes(permission)) {
      return next(new AppError('Insufficient permissions', 403));
    }

    next();
  };
