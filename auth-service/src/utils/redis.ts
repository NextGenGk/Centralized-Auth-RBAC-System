import { createClient } from 'redis';
import { config } from '../config';
import { logger } from './logger';

export const redisClient = createClient({ url: config.redis.url });

redisClient.on('error',   (err) => logger.error('Redis client error', { err }));
redisClient.on('connect', ()    => logger.info('Redis connected'));
redisClient.on('reconnecting', () => logger.warn('Redis reconnecting...'));

export const connectRedis = async (): Promise<void> => {
  await redisClient.connect();
};

// ── Refresh token store ────────────────────────────────────────
const refreshKey = (userId: string) => `refresh:${userId}`;

export const setRefreshToken = (userId: string, token: string, ttlSeconds: number) =>
  redisClient.setEx(refreshKey(userId), ttlSeconds, token);

export const getRefreshToken = (userId: string): Promise<string | null> =>
  redisClient.get(refreshKey(userId));

export const deleteRefreshToken = (userId: string) =>
  redisClient.del(refreshKey(userId));

// ── Access token blacklist ─────────────────────────────────────
const blacklistKey = (token: string) => `blacklist:${token}`;

export const blacklistToken = (token: string, ttlSeconds: number) =>
  redisClient.setEx(blacklistKey(token), ttlSeconds, '1');

export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  const result = await redisClient.get(blacklistKey(token));
  return result !== null;
};
