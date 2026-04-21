import jwt from 'jsonwebtoken';
import { config } from '../config';
import { JwtPayload } from '../types';

type AccessPayload = Omit<JwtPayload, 'iat' | 'exp'>;

export const signAccessToken = (payload: AccessPayload): string =>
  jwt.sign(payload, config.jwt.privateKey, {
    algorithm: 'RS256',
    expiresIn: config.jwt.accessExpiry,
  } as jwt.SignOptions);

export const signRefreshToken = (userId: string): string =>
  jwt.sign({ sub: userId }, config.jwt.privateKey, {
    algorithm: 'RS256',
    expiresIn: config.jwt.refreshExpiry,
  } as jwt.SignOptions);

export const verifyToken = (token: string): JwtPayload =>
  jwt.verify(token, config.jwt.publicKey, {
    algorithms: ['RS256'],
  }) as JwtPayload;

/** Decode without verifying — used to read exp for blacklisting */
export const decodeToken = (token: string): JwtPayload | null =>
  jwt.decode(token) as JwtPayload | null;

/** Seconds until a token expires (0 if already expired) */
export const secondsUntilExpiry = (token: string): number => {
  const decoded = decodeToken(token);
  if (!decoded?.exp) return 0;
  return Math.max(0, decoded.exp - Math.floor(Date.now() / 1000));
};
