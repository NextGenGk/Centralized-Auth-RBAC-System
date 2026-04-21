import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config }   from '../config';
import { AppError } from '../utils/AppError';
import { JwtPayload } from '../types';

/**
 * Validates the Bearer JWT using the RSA public key.
 * The Orders Service NEVER calls the Auth Service or queries any user DB.
 * All identity and permission data is read directly from the verified token payload.
 */
export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError('No token provided', 401));
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, config.jwt.publicKey, {
      algorithms: ['RS256'],
    }) as JwtPayload;

    req.user = payload;
    next();
  } catch (err) {
    next(err); // JWT errors → errorHandler
  }
};
