import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as authService from '../services/auth.service';

// ── Validation schemas ─────────────────────────────────────────
export const createRoleSchema = z.object({
  name:        z.string().min(1).max(50).regex(/^[a-z_]+$/, 'Lowercase letters and underscores only'),
  description: z.string().max(200).optional(),
});

export const createPermissionSchema = z.object({
  resource: z.string().min(1).max(50).regex(/^[a-z_]+$/, 'Lowercase letters and underscores only'),
  action:   z.enum(['read', 'write', 'delete', 'manage']),
});

export const assignPermissionSchema = z.object({
  permissionId: z.string().uuid(),
});

export const assignRoleSchema = z.object({
  roleId: z.string().uuid(),
});

export const toggleStatusSchema = z.object({
  isActive: z.boolean(),
});

// ── Controllers ────────────────────────────────────────────────

export const getUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page  = parseInt(req.query.page  as string || '1',  10);
    const limit = parseInt(req.query.limit as string || '20', 10);
    const result = await authService.listUsers(page, limit);
    res.json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
};

export const createRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, description } = req.body as z.infer<typeof createRoleSchema>;
    const role = await authService.createRole(name, description);
    res.status(201).json({ status: 'success', data: { role } });
  } catch (err) {
    next(err);
  }
};

export const getRoles = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const roles = await authService.listRoles();
    res.json({ status: 'success', data: { roles } });
  } catch (err) {
    next(err);
  }
};

export const createPermission = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { resource, action } = req.body as z.infer<typeof createPermissionSchema>;
    const permission = await authService.createPermission(resource, action);
    res.status(201).json({ status: 'success', data: { permission } });
  } catch (err) {
    next(err);
  }
};

export const getPermissions = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const permissions = await authService.listPermissions();
    res.json({ status: 'success', data: { permissions } });
  } catch (err) {
    next(err);
  }
};

export const assignPermissionToRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { roleId }       = req.params;
    const { permissionId } = req.body as z.infer<typeof assignPermissionSchema>;
    await authService.assignPermissionToRole(roleId, permissionId);
    res.json({ status: 'success', message: 'Permission assigned to role' });
  } catch (err) {
    next(err);
  }
};

export const assignRoleToUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;
    const { roleId } = req.body as z.infer<typeof assignRoleSchema>;
    await authService.assignRoleToUser(userId, roleId);
    res.json({ status: 'success', message: 'Role assigned to user' });
  } catch (err) {
    next(err);
  }
};

export const toggleUserStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId }   = req.params;
    const { isActive } = req.body as z.infer<typeof toggleStatusSchema>;
    const user = await authService.toggleUserStatus(userId, isActive);
    res.json({ status: 'success', data: { user: { id: user.id, email: user.email, isActive: user.isActive } } });
  } catch (err) {
    next(err);
  }
};

export const getAuditLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.query.userId as string | undefined;
    const page   = parseInt(req.query.page  as string || '1',  10);
    const limit  = parseInt(req.query.limit as string || '50', 10);
    const result = await authService.getAuditLogs(userId, page, limit);
    res.json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
};
