import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword } from '../utils/bcrypt';
import { generateTokenPair } from './token.service';
import { AppError } from '../utils/AppError';
import { TokenPair, SafeUser } from '../types';

const prisma = new PrismaClient();

// ── Types for Prisma include shapes ───────────────────────────
interface RolePermissionWithPermission {
  permission: { resource: string; action: string };
}
interface RoleWithPermissions {
  name: string;
  rolePermissions: RolePermissionWithPermission[];
}
interface UserRoleWithRole {
  role: RoleWithPermissions;
}
interface UserRoleSimple {
  role: { name: string };
}
interface UserWithRoles {
  id:        string;
  email:     string;
  password:  string;
  isActive:  boolean;
  createdAt: Date;
  updatedAt: Date;
  userRoles: UserRoleWithRole[];
}

const getUserWithPermissions = (userId: string) =>
  prisma.user.findUnique({
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
  }) as Promise<UserWithRoles | null>;

const flattenPermissions = (user: UserWithRoles) => {
  const roles       = user.userRoles.map((ur) => ur.role.name);
  const permissions = [
    ...new Set(
      user.userRoles.flatMap((ur) =>
        ur.role.rolePermissions.map(
          (rp) => `${rp.permission.resource}:${rp.permission.action}`
        )
      )
    ),
  ] as string[];
  return { roles, permissions };
};

const writeAuditLog = (userId: string, action: string, resource: string, ip?: string, metadata?: object) =>
  prisma.auditLog.create({ data: { userId, action, resource, ip, metadata } }).catch(() => {});

// ── Auth operations ────────────────────────────────────────────

export const register = async (
  email: string,
  password: string,
  ip?: string
): Promise<SafeUser> => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError('Email already registered', 409);

  const defaultRole = await prisma.role.findUnique({ where: { name: 'user' } });
  if (!defaultRole) throw new AppError('Default role not configured', 500);

  const hashed = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email,
      password: hashed,
      userRoles: { create: { roleId: defaultRole.id } },
    },
    include: { userRoles: { include: { role: true } } },
  });

  await writeAuditLog(user.id, 'register', 'auth', ip);

  return {
    id:        user.id,
    email:     user.email,
    isActive:  user.isActive,
    createdAt: user.createdAt,
    roles:     (user.userRoles as UserRoleSimple[]).map((ur) => ur.role.name),
  };
};

export const login = async (
  email: string,
  password: string,
  ip?: string
): Promise<TokenPair> => {
  const raw = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  const user = raw ? await getUserWithPermissions(raw.id) : null;

  if (!user) throw new AppError('Invalid email or password', 401);
  if (!user.isActive) throw new AppError('Account has been disabled', 403);

  const valid = await comparePassword(password, user.password);
  if (!valid) throw new AppError('Invalid email or password', 401);

  const { roles, permissions } = flattenPermissions(user);
  const tokens = await generateTokenPair(user.id, user.email, roles, permissions);

  await writeAuditLog(user.id, 'login', 'auth', ip, { roles });

  return tokens;
};

export const getProfile = async (userId: string): Promise<SafeUser> => {
  const user = await getUserWithPermissions(userId);
  if (!user) throw new AppError('User not found', 404);

  const { roles } = flattenPermissions(user);
  return {
    id:        user.id,
    email:     user.email,
    isActive:  user.isActive,
    createdAt: user.createdAt,
    roles,
  };
};

// ── Admin operations ───────────────────────────────────────────

export const createRole = async (name: string, description?: string) =>
  prisma.role.create({ data: { name, description } });

export const createPermission = async (resource: string, action: string) =>
  prisma.permission.create({ data: { resource, action } });

export const assignPermissionToRole = async (roleId: string, permissionId: string) => {
  const [role, permission] = await Promise.all([
    prisma.role.findUnique({ where: { id: roleId } }),
    prisma.permission.findUnique({ where: { id: permissionId } }),
  ]);
  if (!role)       throw new AppError('Role not found', 404);
  if (!permission) throw new AppError('Permission not found', 404);

  return prisma.rolePermission.upsert({
    where: { roleId_permissionId: { roleId, permissionId } },
    update: {},
    create: { roleId, permissionId },
  });
};

export const assignRoleToUser = async (userId: string, roleId: string) => {
  const [user, role] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.role.findUnique({ where: { id: roleId } }),
  ]);
  if (!user) throw new AppError('User not found', 404);
  if (!role) throw new AppError('Role not found', 404);

  return prisma.userRole.upsert({
    where: { userId_roleId: { userId, roleId } },
    update: {},
    create: { userId, roleId },
  });
};

export const listUsers = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { userRoles: { include: { role: true } } },
    }),
    prisma.user.count(),
  ]);

  return {
    users: users.map((u) => ({
      id:        u.id,
      email:     u.email,
      isActive:  u.isActive,
      createdAt: u.createdAt,
      roles:     u.userRoles.map((ur) => ur.role.name),
    })),
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  };
};

export const listRoles = async () =>
  prisma.role.findMany({
    include: { rolePermissions: { include: { permission: true } } },
  });

export const listPermissions = async () => prisma.permission.findMany();

export const getAuditLogs = async (userId?: string, page = 1, limit = 50) => {
  const skip  = (page - 1) * limit;
  const where = userId ? { userId } : {};
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { email: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);
  return { logs, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
};

export const toggleUserStatus = async (userId: string, isActive: boolean) =>
  prisma.user.update({ where: { id: userId }, data: { isActive } });
