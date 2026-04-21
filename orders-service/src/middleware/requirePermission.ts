import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { logger }   from '../utils/logger';

/**
 * Factory that returns a middleware enforcing a specific permission.
 * Permissions are read from req.user.permissions (decoded from the JWT).
 *
 * Usage: router.get('/orders', authenticate, requirePermission('orders:read'), handler)
 */
export const requirePermission = (permission: string) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (!req.user.permissions.includes(permission)) {
      logger.warn(
        `Access denied — user ${req.user.sub} missing permission "${permission}". ` +
        `Has: [${req.user.permissions.join(', ')}]`
      );
      return next(
        new AppError(
          `Forbidden — requires permission: ${permission}`,
          403
        )
      );
    }

    next();
  };
