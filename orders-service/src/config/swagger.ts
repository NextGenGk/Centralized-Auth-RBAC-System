import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';
import { config } from './index';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Orders Service API',
      version: '1.0.0',
      description: 'Protected Orders Resource Service — requires Bearer JWT',
    },
    servers: [
      { url: '/', description: 'Current Server' },
      { url: `http://localhost:${config.port}`, description: 'Local' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  // Use absolute paths to ensure Vercel can find the files
  apis: [
    path.join(__dirname, '../routes/*.ts'),
    path.join(__dirname, '../routes/*.js'),
    path.join(process.cwd(), 'src/routes/*.ts'),
    path.join(process.cwd(), 'dist/routes/*.js'),
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
