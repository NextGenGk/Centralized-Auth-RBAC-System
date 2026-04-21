import dotenv from 'dotenv';
dotenv.config();

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

function decodeKey(b64: string, name: string): string {
  try {
    const decoded = Buffer.from(b64, 'base64').toString('utf8');
    if (!decoded.includes('BEGIN')) {
      console.warn(`[Config] ${name} might not be a valid RSA key (missing BEGIN header)`);
    }
    return decoded;
  } catch (err) {
    throw new Error(`Failed to decode ${name} from Base64: ${err}`);
  }
}

export const config = {
  port:    parseInt(process.env.PORT || '3002', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  jwt: {
    publicKey: decodeKey(required('JWT_PUBLIC_KEY'), 'JWT_PUBLIC_KEY'),
  },

  authService: {
    url: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  },
} as const;
