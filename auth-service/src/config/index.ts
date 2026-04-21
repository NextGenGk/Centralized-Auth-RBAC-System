import dotenv from 'dotenv';
dotenv.config();

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

function decodeKey(b64: string): string {
  return Buffer.from(b64, 'base64').toString('utf8');
}

export const config = {
  port:    parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  database: {
    url: required('DATABASE_URL'),
  },

  jwt: {
    privateKey:    decodeKey(required('JWT_PRIVATE_KEY')),
    publicKey:     decodeKey(required('JWT_PUBLIC_KEY')),
    accessExpiry:  process.env.JWT_ACCESS_EXPIRY  || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  },

  rateLimit: {
    loginMax:     parseInt(process.env.LOGIN_RATE_LIMIT    || '10',  10),
    loginWindow:  parseInt(process.env.LOGIN_RATE_WINDOW   || '900', 10), // 15 min in seconds
    globalMax:    parseInt(process.env.GLOBAL_RATE_LIMIT   || '100', 10),
    globalWindow: parseInt(process.env.GLOBAL_RATE_WINDOW  || '60',  10),
  },
} as const;
