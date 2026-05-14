import express, { Request, Response } from 'express';
import 'dotenv/config';
import pinoHttp from 'pino-http';
import { env, validateEnv } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/db';
import { connectRedis, disconnectRedis } from './config/redis';
import {
  authenticate,
  auditLogger,
  errorHandler,
} from './middlewares';
import { logger } from './utils/logger';
import { clientRoutes, clientContactRoutes, clientSiteRoutes } from './modules/clients';
import { 
  serviceGroupRoutes,
  serviceRoutes,
  servicePlanRoutes,
  serviceAddonRoutes
} from './modules/catalog';
import { billingModuleRoutes } from './modules/billing';
import inventoryRoutes from './modules/inventory';
import categoryRoutes from './modules/categories';
import subscriptionRoutes from './modules/subscriptions/subscription.routes';
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/routes';
import uploadRoutes from './modules/upload/upload.routes';
import { settingsRoutes } from './modules/settings/settings.routes';
import { getQueueHealth, closeQueues } from './jobs/queues';
import { startWorkers, stopWorkers } from './jobs/workers';
import cors from 'cors';

/**
 * Create Express application
 */
export function createApp(): express.Application {
  const app = express(); // Initialize the app

  // Middleware: Request logging
  app.use(pinoHttp({ logger }));

  // Middleware: Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Middleware: CORS (scaffold)
 app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-signup-key',
    ],
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  })
);

  // Middleware: Audit logging
  app.use(auditLogger);

  // Health check endpoint (public)
  app.get('/health', async (_req: Request, res: Response) => {
    const queues = await getQueueHealth();

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: env.nodeEnv,
      queues,
    });
  });

  // API v1 routes (scaffold)
  app.get('/api/v1/status', (_req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'I-ITSM API v1 is running',
      version: '0.1.0',
    });
  });

  // CRM Routes (clients module)
  app.use('/api/v1/clients', clientRoutes);
  app.use('/api/v1/clients/:clientId/contacts', clientContactRoutes);
  app.use('/api/v1/clients/:clientId/sites', clientSiteRoutes);

  // Catalog Routes
  app.use('/api/v1/catalog/service-groups', serviceGroupRoutes);
  app.use('/api/v1/catalog/services', serviceRoutes);
  app.use('/api/v1/catalog/service-plans', servicePlanRoutes);
  app.use('/api/v1/catalog/service-addons', serviceAddonRoutes);

  // Billing Routes
  app.use('/api/v1/billing', billingModuleRoutes);

  // Inventory Routes
  app.use('/api/v1/inventory', inventoryRoutes);

  // Category Routes
  app.use('/api/v1/categories', categoryRoutes);

  // Subscriptions Routes
  app.use('/api/v1/subscriptions', subscriptionRoutes);

  // Auth Routes
  app.use('/api/v1/auth', authRoutes);

  // Users Routes (admin management)
  app.use('/api/v1/users', usersRoutes);

  // Upload Routes
  app.use('/api/v1/upload', uploadRoutes);

  // Settings Routes (admin only)
  app.use('/api/v1/settings', settingsRoutes);

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: 'Endpoint not found',
      path: req.path,
    });
  });

  // Error handler (must be last)
  app.use(errorHandler);

  return app; // Return the app instance
}

/**
 * Start the server
 */
export async function startServer(): Promise<void> {
  try {
    // Validate environment
    validateEnv();
    logger.info('Environment validation passed');

    // Connect to services
    await connectDatabase();
    // await connectRedis();
    // await startWorkers();

    // Create and start Express app
    const app = createApp();
    const server = app.listen(env.port, () => {
      logger.info(`Server started on port ${env.port}`, {
        environment: env.nodeEnv,
        apiUrl: env.apiBaseUrl,
      });
    });
 
    // Graceful shutdown
    // const shutdown = async (signal: string) => {
    //   logger.info(`Received ${signal}, shutting down gracefully...`);
    //   server.close(async () => {
    //     await stopWorkers();
    //     await closeQueues();
    //     await disconnectDatabase();
    //     await disconnectRedis();
    //     logger.info('Server shut down complete');
    //     process.exit(0);
    //   });
    // };

    // process.on('SIGTERM', () => shutdown('SIGTERM'));
    // process.on('SIGINT', () => shutdown('SIGINT'));
  }  catch (error) {
  logger.error('Failed to start server', { error });

  console.error("🔥 FULL STARTUP ERROR:", error);

  process.exit(1);
}
}


startServer();
export default createApp;
