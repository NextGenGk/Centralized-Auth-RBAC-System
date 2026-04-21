import { Router }              from 'express';
import { authenticate }        from '../middleware/authenticate';
import { requirePermission }   from '../middleware/requirePermission';
import * as ctrl               from '../controllers/orders.controller';

export const ordersRouter = Router();

// Every route on this service requires a valid JWT
ordersRouter.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Orders resource — all routes require a valid JWT
 */

/**
 * @swagger
 * /orders:
 *   get:
 *     tags: [Orders]
 *     summary: List all orders (paginated)
 *     description: Requires `orders:read` permission
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Paginated orders list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 data:
 *                   type: object
 *                   properties:
 *                     orders:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Order'
 *       401: { description: No token / invalid token }
 *       403: { description: Missing orders:read permission }
 */
ordersRouter.get('/', requirePermission('orders:read'), ctrl.getOrders);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Get a single order by ID
 *     description: Requires `orders:read` permission
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Order found }
 *       401: { description: No token / invalid token }
 *       403: { description: Missing orders:read permission }
 *       404: { description: Order not found }
 */
ordersRouter.get('/:id', requirePermission('orders:read'), ctrl.getOrderById);

/**
 * @swagger
 * /orders:
 *   post:
 *     tags: [Orders]
 *     summary: Create a new order
 *     description: Requires `orders:write` permission
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [product, quantity, price]
 *             properties:
 *               product:  { type: string,  example: "Mechanical Keyboard" }
 *               quantity: { type: integer, example: 1 }
 *               price:    { type: number,  example: 149.99 }
 *     responses:
 *       201: { description: Order created }
 *       400: { description: Missing required fields }
 *       401: { description: No token / invalid token }
 *       403: { description: Missing orders:write permission }
 */
ordersRouter.post('/', requirePermission('orders:write'), ctrl.createOrder);

/**
 * @swagger
 * /orders/{id}:
 *   put:
 *     tags: [Orders]
 *     summary: Update an existing order
 *     description: Requires `orders:write` permission
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               product:  { type: string }
 *               quantity: { type: integer }
 *               price:    { type: number }
 *               status:   { type: string, enum: [pending, processing, completed, cancelled] }
 *     responses:
 *       200: { description: Order updated }
 *       401: { description: No token / invalid token }
 *       403: { description: Missing orders:write permission }
 *       404: { description: Order not found }
 */
ordersRouter.put('/:id', requirePermission('orders:write'), ctrl.updateOrder);

/**
 * @swagger
 * /orders/{id}:
 *   delete:
 *     tags: [Orders]
 *     summary: Delete an order
 *     description: Requires `orders:delete` permission
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Order deleted }
 *       401: { description: No token / invalid token }
 *       403: { description: Missing orders:delete permission }
 *       404: { description: Order not found }
 */
ordersRouter.delete('/:id', requirePermission('orders:delete'), ctrl.deleteOrder);

/**
 * @swagger
 * components:
 *   schemas:
 *     Order:
 *       type: object
 *       properties:
 *         id:        { type: string }
 *         userId:    { type: string }
 *         product:   { type: string }
 *         quantity:  { type: integer }
 *         price:     { type: number }
 *         status:    { type: string, enum: [pending, processing, completed, cancelled] }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 */
