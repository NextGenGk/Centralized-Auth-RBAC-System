import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate }         from '../middleware/authenticate';
import { validate }             from '../middleware/validate';
import * as ctrl                from '../controllers/auth.controller';
import { config }               from '../config';

export const authRouter = Router();

const loginLimiter = rateLimit({
  windowMs: config.rateLimit.loginWindow * 1000,
  max:      config.rateLimit.loginMax,
  message:  { status: 'error', message: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders:   false,
});

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:    { type: string, format: email, example: "john@example.com" }
 *               password: { type: string, example: "Secret@123" }
 *     responses:
 *       201: { description: User registered successfully }
 *       400: { description: Validation error }
 *       409: { description: Email already registered }
 */
authRouter.post('/register', validate(ctrl.registerSchema), ctrl.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login and receive JWT tokens
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:    { type: string, format: email, example: "admin@example.com" }
 *               password: { type: string, example: "Admin@1234" }
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:  { type: string }
 *                     refreshToken: { type: string }
 *       401: { description: Invalid credentials }
 *       403: { description: Account disabled }
 *       429: { description: Too many attempts }
 */
authRouter.post('/login', loginLimiter, validate(ctrl.loginSchema), ctrl.login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Rotate tokens using a refresh token
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200: { description: New token pair issued }
 *       401: { description: Invalid or revoked refresh token }
 */
authRouter.post('/refresh', validate(ctrl.refreshSchema), ctrl.refresh);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout — revokes both tokens immediately
 *     responses:
 *       200: { description: Logged out }
 *       401: { description: Not authenticated }
 */
authRouter.post('/logout', authenticate, ctrl.logout);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get the authenticated user's profile
 *     responses:
 *       200: { description: User profile }
 *       401: { description: Not authenticated }
 */
authRouter.get('/me', authenticate, ctrl.getMe);

/**
 * @swagger
 * /auth/public-key:
 *   get:
 *     tags: [Auth]
 *     summary: Retrieve the RSA public key for token verification
 *     security: []
 *     responses:
 *       200: { description: Public key }
 */
authRouter.get('/public-key', ctrl.getPublicKey);
