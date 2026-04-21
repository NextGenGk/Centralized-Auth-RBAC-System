import { PrismaClient } from '@prisma/client';
import {
  signAccessToken,
  signRefreshToken,
  verifyToken,
  secondsUntilExpiry,
} from '../utils/jwt';
import {
  setRefreshToken,
  getRefreshToken,
  deleteRefreshToken,
  blacklistToken,
} from '../utils/redis';
import { AppError } from '../utils/AppError';
import { config }   from '../config';
import { TokenPair, JwtPayload } from '../types';

const prisma = new PrismaClient();

// ── Types ──────────────────────────────────────────────────────
interface RolePermissionShape {
  permission: { resource: string; action: string };
}
interface RoleShape {
  name: string;
  rolePermissions: RolePermissionShape[];
}
interface UserRoleShape {
  role: RoleShape;
}
interface UserShape {
  id:        string;
  email:     string;
  isActive:  boolean;
  userRoles: UserRoleShape[];
}

/** Parse "15m", "7d", "1h" → seconds */
const parseTtlSeconds = (expiry: string): number => {
  const m = expiry.match(/^(\d+)([smhd])$/);
  if (!m) return 604800;
  const n = parseInt(m[1], 10);
  const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
  return n * (multipliers[m[2]] ?? 86400);
};

const refreshTtlSeconds = (): number =>
  parseTtlSeconds(config.jwt.refreshExpiry);

export const generateTokenPair = async (
  userId: string,
  email: string,
  roles: string[],
  permissions: string[]
): Promise<TokenPair> => {
  const accessToken  = signAccessToken({ sub: userId, email, roles, permissions });
  const refreshToken = signRefreshToken(userId);
  await setRefreshToken(userId, refreshToken, refreshTtlSeconds());
  return { accessToken, refreshToken };
};

export const rotateTokens = async (refreshToken: string): Promise<TokenPair> => {
  let decoded: JwtPayload;
  try {
    decoded = verifyToken(refreshToken);
  } catch {
    throw new AppError('Invalid refresh token', 401);
  }

  const userId = decoded.sub;
  const stored = await getRefreshToken(userId);
  if (!stored || stored !== refreshToken) {
    throw new AppError('Refresh token is invalid or has been revoked', 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        include: {
          role: {
            include: { rolePermissions: { include: { permission: true } } },
          },
        },
      },
    },
  }) as UserShape | null;

  if (!user || !user.isActive) {
    await deleteRefreshToken(userId);
    throw new AppError('Account is inactive or does not exist', 401);
  }

  const roles: string[] = user.userRoles.map((ur) => ur.role.name);
  const permissions: string[] = [
    ...new Set(
      user.userRoles.flatMap((ur) =>
        ur.role.rolePermissions.map(
          (rp) => `${rp.permission.resource}:${rp.permission.action}`
        )
      )
    ),
  ];

  const newAccessToken  = signAccessToken({ sub: userId, email: user.email, roles, permissions });
  const newRefreshToken = signRefreshToken(userId);
  await setRefreshToken(userId, newRefreshToken, refreshTtlSeconds());

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

export const revokeTokens = async (userId: string, accessToken: string): Promise<void> => {
  const ttl = secondsUntilExpiry(accessToken);
  if (ttl > 0) await blacklistToken(accessToken, ttl);
  await deleteRefreshToken(userId);
};
