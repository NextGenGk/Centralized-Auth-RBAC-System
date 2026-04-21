import app              from './app';
import { config }       from './config';
import { connectRedis } from './utils/redis';
import { logger }       from './utils/logger';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function bootstrap(): Promise<void> {
  try {
    // 1 – Verify DB connection
    await prisma.$connect();
    logger.info('PostgreSQL connected');

    // 2 – Connect Redis
    await connectRedis();

    // 3 – Start HTTP server
    const server = app.listen(config.port, () => {
      logger.info(`Auth Service running on http://localhost:${config.port}`);
      logger.info(`Swagger docs at  http://localhost:${config.port}/api-docs`);
    });

    // ── Graceful shutdown ──────────────────────────────────────
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received — shutting down`);
      server.close(async () => {
        await prisma.$disconnect();
        logger.info('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));
  } catch (err) {
    logger.error('Failed to start server', { err });
    process.exit(1);
  }
}

bootstrap();
