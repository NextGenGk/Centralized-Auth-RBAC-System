import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as authService  from '../services/auth.service';
import * as tokenService from '../services/token.service';
import { config } from '../config';

// ── Validation schemas ─────────────────────────────────────────
export const registerSchema = z.object({
  email:    z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});

export const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// ── Controllers ────────────────────────────────────────────────

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body as z.infer<typeof registerSchema>;
    const user = await authService.register(email, password, req.ip ?? undefined);
    res.status(201).json({ status: 'success', data: { user } });
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body as z.infer<typeof loginSchema>;
    const tokens = await authService.login(email, password, req.ip ?? undefined);
    res.json({ status: 'success', data: tokens });
  } catch (err) {
    next(err);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.body as z.infer<typeof refreshSchema>;
    const tokens = await tokenService.rotateTokens(refreshToken);
    res.json({ status: 'success', data: tokens });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token  = req.headers.authorization!.split(' ')[1];
    const userId = req.user!.sub;
    await tokenService.revokeTokens(userId, token);
    res.json({ status: 'success', message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await authService.getProfile(req.user!.sub);
    res.json({ status: 'success', data: { user } });
  } catch (err) {
    next(err);
  }
};

/** Exposes the RSA public key so resource services can verify tokens */
export const getPublicKey = (_req: Request, res: Response): void => {
  res.json({ status: 'success', data: { publicKey: config.jwt.publicKey } });
};
