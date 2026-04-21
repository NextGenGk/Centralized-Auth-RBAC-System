import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './index';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Orders Service API',
      version: '1.0.0',
      description: 'Protected Orders Resource Service — requires Bearer JWT',
    },
    servers: [{ url: `http://localhost:${config.port}`, description: 'Local' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: process.env.NODE_ENV === 'production' 
    ? ['./dist/routes/*.js'] 
    : ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
