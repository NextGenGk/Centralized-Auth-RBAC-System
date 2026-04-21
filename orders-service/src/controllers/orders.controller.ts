import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Order, CreateOrderDto, UpdateOrderDto } from '../types';
import { AppError } from '../utils/AppError';
import { logger }   from '../utils/logger';

// ── In-memory store ────────────────────────────────────────────
// In production this would be a database (PostgreSQL, MongoDB, etc.)
const ordersStore: Order[] = [
  {
    id:        'ord-0001',
    userId:    'seed-user-001',
    product:   'MacBook Pro 16"',
    quantity:  1,
    price:     2499.00,
    status:    'completed',
    createdAt: new Date('2024-01-10T09:00:00Z'),
    updatedAt: new Date('2024-01-11T14:00:00Z'),
  },
  {
    id:        'ord-0002',
    userId:    'seed-user-002',
    product:   'Sony WH-1000XM5 Headphones',
    quantity:  2,
    price:     349.99,
    status:    'processing',
    createdAt: new Date('2024-02-14T11:30:00Z'),
    updatedAt: new Date('2024-02-14T11:30:00Z'),
  },
  {
    id:        'ord-0003',
    userId:    'seed-user-001',
    product:   'USB-C Hub 12-in-1',
    quantity:  3,
    price:     79.99,
    status:    'pending',
    createdAt: new Date('2024-03-01T08:15:00Z'),
    updatedAt: new Date('2024-03-01T08:15:00Z'),
  },
];

// ── Audit helper ───────────────────────────────────────────────
const audit = (userId: string, action: string, orderId: string) => {
  logger.info(`AUDIT | user=${userId} | action=${action} | resource=orders | id=${orderId}`);
};

// ── Controllers ────────────────────────────────────────────────

/**
 * GET /orders
 * Permission required: orders:read
 */
export const getOrders = (req: Request, res: Response, _next: NextFunction): void => {
  const page  = Math.max(1, parseInt(req.query.page  as string || '1',  10));
  const limit = Math.min(100, parseInt(req.query.limit as string || '10', 10));
  const start = (page - 1) * limit;

  const paginated = ordersStore.slice(start, start + limit);

  audit(req.user!.sub, 'list', '*');

  res.json({
    status: 'success',
    data: {
      orders: paginated,
      pagination: {
        total: ordersStore.length,
        page,
        limit,
        pages: Math.ceil(ordersStore.length / limit),
      },
    },
  });
};

/**
 * GET /orders/:id
 * Permission required: orders:read
 */
export const getOrderById = (req: Request, res: Response, next: NextFunction): void => {
  const order = ordersStore.find((o) => o.id === req.params.id);
  if (!order) return next(new AppError('Order not found', 404));

  audit(req.user!.sub, 'read', order.id);
  res.json({ status: 'success', data: { order } });
};

/**
 * POST /orders
 * Permission required: orders:write
 */
export const createOrder = (req: Request, res: Response, _next: NextFunction): void => {
  const { product, quantity, price } = req.body as CreateOrderDto;

  if (!product || !quantity || !price) {
    res.status(400).json({
      status: 'error',
      message: 'product, quantity, and price are required',
    });
    return;
  }

  const order: Order = {
    id:        `ord-${uuidv4().split('-')[0]}`,
    userId:    req.user!.sub,
    product,
    quantity:  Number(quantity),
    price:     Number(price),
    status:    'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  ordersStore.push(order);
  audit(req.user!.sub, 'create', order.id);

  res.status(201).json({ status: 'success', data: { order } });
};

/**
 * PUT /orders/:id
 * Permission required: orders:write
 */
export const updateOrder = (req: Request, res: Response, next: NextFunction): void => {
  const idx = ordersStore.findIndex((o) => o.id === req.params.id);
  if (idx === -1) return next(new AppError('Order not found', 404));

  const updates = req.body as UpdateOrderDto;
  ordersStore[idx] = {
    ...ordersStore[idx],
    ...updates,
    updatedAt: new Date(),
  };

  audit(req.user!.sub, 'update', ordersStore[idx].id);
  res.json({ status: 'success', data: { order: ordersStore[idx] } });
};

/**
 * DELETE /orders/:id
 * Permission required: orders:delete
 */
export const deleteOrder = (req: Request, res: Response, next: NextFunction): void => {
  const idx = ordersStore.findIndex((o) => o.id === req.params.id);
  if (idx === -1) return next(new AppError('Order not found', 404));

  const [removed] = ordersStore.splice(idx, 1);
  audit(req.user!.sub, 'delete', removed.id);

  res.json({ status: 'success', message: `Order ${removed.id} deleted` });
};
