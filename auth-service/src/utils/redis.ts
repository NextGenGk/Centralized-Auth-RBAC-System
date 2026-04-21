import { createClient } from 'redis';
import { config } from '../config';
import { logger } from './logger';

const client = createClient({ 
  url: config.redis.url,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 50, 1000),
    connectTimeout: 5000,
  }
});

client.on('error', (err) => logger.error('Redis client error', { err }));

/** 
 * Ensures Redis is connected before performing operations.
 * Essential for Serverless (Vercel) lifecycles.
 */
async function getClient() {
  if (!client.isOpen) {
    await client.connect().catch(err => logger.error('Redis connection failed', { err }));
  }
  return client;
}

// ── Refresh token store ────────────────────────────────────────
const refreshKey = (userId: string) => `refresh:${userId}`;

export const setRefreshToken = async (userId: string, token: string, ttlSeconds: number) => {
  const c = await getClient();
  return c.setEx(refreshKey(userId), ttlSeconds, token);
};

export const getRefreshToken = async (userId: string): Promise<string | null> => {
  const c = await getClient();
  return c.get(refreshKey(userId));
};

export const deleteRefreshToken = async (userId: string) => {
  const c = await getClient();
  return c.del(refreshKey(userId));
};

// ── Access token blacklist ─────────────────────────────────────
const blacklistKey = (token: string) => `blacklist:${token}`;

export const blacklistToken = async (token: string, ttlSeconds: number) => {
  const c = await getClient();
  return c.setEx(blacklistKey(token), ttlSeconds, '1');
};

export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  try {
    const c = await getClient();
    if (!c.isOpen) return false; // Fail open if Redis is unreachable
    const result = await c.get(blacklistKey(token));
    return result !== null;
  } catch (err) {
    logger.error('Blacklist check failed', { err });
    return false; // Fail open to keep service running
  }
};

export const connectRedis = async () => {
  await getClient();
};

export const redisClient = client;
