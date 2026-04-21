import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/authenticate';
import { validate }                  from '../middleware/validate';
import * as ctrl                     from '../controllers/admin.controller';

export const adminRouter = Router();

// All admin routes require a valid JWT and the 'admin' role
adminRouter.use(authenticate, requireRole('admin'));

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin-only management endpoints
 */

// ── Users ──────────────────────────────────────────────────────

/**
 * @swagger
 * /admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: List all users (paginated)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200: { description: Paginated user list }
 *       403: { description: Admin role required }
 */
adminRouter.get('/users', ctrl.getUsers);

/**
 * @swagger
 * /admin/users/{userId}/roles:
 *   post:
 *     tags: [Admin]
 *     summary: Assign a role to a user
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [roleId]
 *             properties:
 *               roleId: { type: string, format: uuid }
 *     responses:
 *       200: { description: Role assigned }
 *       404: { description: User or role not found }
 */
adminRouter.post('/users/:userId/roles',    validate(ctrl.assignRoleSchema),    ctrl.assignRoleToUser);

/**
 * @swagger
 * /admin/users/{userId}/status:
 *   patch:
 *     tags: [Admin]
 *     summary: Enable or disable a user account
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [isActive]
 *             properties:
 *               isActive: { type: boolean }
 *     responses:
 *       200: { description: Status updated }
 */
adminRouter.patch('/users/:userId/status',  validate(ctrl.toggleStatusSchema),  ctrl.toggleUserStatus);

// ── Roles ──────────────────────────────────────────────────────

/**
 * @swagger
 * /admin/roles:
 *   get:
 *     tags: [Admin]
 *     summary: List all roles with their permissions
 *     responses:
 *       200: { description: Roles list }
 */
adminRouter.get('/roles', ctrl.getRoles);

/**
 * @swagger
 * /admin/roles:
 *   post:
 *     tags: [Admin]
 *     summary: Create a new role
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:        { type: string, example: "analyst" }
 *               description: { type: string, example: "Read-only analyst role" }
 *     responses:
 *       201: { description: Role created }
 *       409: { description: Role already exists }
 */
adminRouter.post('/roles', validate(ctrl.createRoleSchema), ctrl.createRole);

/**
 * @swagger
 * /admin/roles/{roleId}/permissions:
 *   post:
 *     tags: [Admin]
 *     summary: Assign a permission to a role
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [permissionId]
 *             properties:
 *               permissionId: { type: string, format: uuid }
 *     responses:
 *       200: { description: Permission assigned }
 *       404: { description: Role or permission not found }
 */
adminRouter.post('/roles/:roleId/permissions', validate(ctrl.assignPermissionSchema), ctrl.assignPermissionToRole);

// ── Permissions ────────────────────────────────────────────────

/**
 * @swagger
 * /admin/permissions:
 *   get:
 *     tags: [Admin]
 *     summary: List all permissions
 *     responses:
 *       200: { description: Permissions list }
 */
adminRouter.get('/permissions', ctrl.getPermissions);

/**
 * @swagger
 * /admin/permissions:
 *   post:
 *     tags: [Admin]
 *     summary: Create a new permission
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [resource, action]
 *             properties:
 *               resource: { type: string, example: "invoices" }
 *               action:   { type: string, enum: [read, write, delete, manage] }
 *     responses:
 *       201: { description: Permission created }
 *       409: { description: Permission already exists }
 */
adminRouter.post('/permissions', validate(ctrl.createPermissionSchema), ctrl.createPermission);

// ── Audit logs ─────────────────────────────────────────────────

/**
 * @swagger
 * /admin/audit-logs:
 *   get:
 *     tags: [Admin]
 *     summary: Retrieve audit logs
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema: { type: string, format: uuid }
 *         description: Filter by user ID
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *     responses:
 *       200: { description: Paginated audit log }
 */
adminRouter.get('/audit-logs', ctrl.getAuditLogs);
