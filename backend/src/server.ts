


//1.
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cron from 'node-cron';
import { config } from './config';
import logger from './utils/logger';
import prisma from './db/prisma';
import redis from './db/redis';
import { websocketService } from './services/websocket';
import { yahooFinanceService } from './services/yahooFinance';

// Routes
import stockRoutes from './routes/stocks';
import ipoRoutes from './routes/ipos';
import portfolioRoutes from './routes/portfolio';
import watchlistRoutes from './routes/watchlist';

const app = express();

// ============================================
// MIDDLEWARE
// ============================================

app.use(helmet({
  contentSecurityPolicy: config.env === 'production',
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: config.cors.origins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    });
  });
  next();
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.env,
    checks: { database: 'unknown', redis: 'unknown' },
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    health.checks.database = 'healthy';
  } catch (error) {
    logger.error('Database health check failed', error);
    health.checks.database = 'unhealthy';
    health.status = 'degraded';
  }

  try {
    await redis.ping();
    health.checks.redis = 'healthy';
  } catch (error) {
    logger.error('Redis health check failed', error);
    health.checks.redis = 'unhealthy';
    health.status = 'degraded';
  }

  res.status(health.status === 'ok' ? 200 : 503).json(health);
});

// ============================================
// API ROUTES
// ============================================

app.get('/api/v1', (req, res) => {
  res.json({
    name: config.appName,
    version: config.appVersion,
    message: 'Catalyst Markets API',
  });
});

app.use('/api/v1/stocks', stockRoutes);
app.use('/api/v1/ipos', ipoRoutes);
app.use('/api/v1/portfolio', portfolioRoutes);
app.use('/api/v1/watchlist', watchlistRoutes);

// ============================================
// ERROR HANDLING
// ============================================

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});

app.use((err: Error, req: any, res: any, next: any) => {
  logger.error('Unhandled error', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: config.env === 'development' ? err.message : 'Something went wrong',
  });
});

// ============================================
// SERVER STARTUP
// ============================================

let server: http.Server;

const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('✅ Database connected');

    // Test Redis connection
    await redis.ping();
    logger.info('✅ Redis connected');

    const PORT = config.port || 3001;

    // Create HTTP server
    server = http.createServer(app);

    // Start listening
    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📝 Environment: ${config.env}`);
      logger.info(`🏥 Health: http://localhost:${PORT}/health`);
      logger.info(`🔗 API: http://localhost:${PORT}/api/v1`);
      logger.info(`🔌 WebSocket: ws://localhost:${PORT}/ws`);
    });

    // Initialize WebSocket
    websocketService.initialize(server);
    logger.info('✅ WebSocket initialized');

    

  } catch (error) {
    logger.error('❌ Failed to start server', error);
    console.error('Startup error:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async (signal: string) => {
  logger.info(`${signal} received, shutting down...`);
  
  websocketService.shutdown();
  
  if (server) {
    server.close(async () => {
      await prisma.$disconnect();
      await redis.quit();
      logger.info('✅ Shutdown complete');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', error);
  console.error('UNCAUGHT EXCEPTION:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection', { reason });
  console.error('UNHANDLED REJECTION:', reason);
});

// Start the server
console.log('🔍 Starting server...');
startServer();

export default app;


/*

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};


import express, { type Application, type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config';
import logger from './utils/logger';
import prisma from './db/prisma';
import redis from './db/redis';
import { websocketService } from './services/websocket';

// Import route modules
import stockRoutes from './routes/stocks';
import ipoRoutes from './routes/ipos';
import portfolioRoutes from './routes/portfolio';
import watchlistRoutes from './routes/watchlist';

// Initialize Express app
const app: Application = express();

// ============================================
// MIDDLEWARE
// ============================================

// Security headers
app.use(helmet({
  contentSecurityPolicy: config.env === 'production',
  crossOriginEmbedderPolicy: false,
}));

// CORS
app.use(cors({
  origin: config.cors.origins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    });
  });
  
  next();
});

// ============================================
// HEALTH CHECK ROUTES
// ============================================

app.get('/health', async (req: Request, res: Response) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.env,
    version: config.appVersion,
    checks: {
      database: 'unknown',
      redis: 'unknown',
    },
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    health.checks.database = 'healthy';
  } catch (error) {
    logger.error('Database health check failed', error);
    health.checks.database = 'unhealthy';
    health.status = 'degraded';
  }

  try {
    await redis.ping();
    health.checks.redis = 'healthy';
  } catch (error) {
    logger.error('Redis health check failed', error);
    health.checks.redis = 'unhealthy';
    health.status = 'degraded';
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

app.get('/ready', (req: Request, res: Response) => {
  res.status(200).json({ ready: true });
});

// ============================================
// API ROUTES
// ============================================

app.get('/api/v1', (req: Request, res: Response) => {
  res.json({
    name: config.appName,
    version: config.appVersion,
    environment: config.env,
    message: 'Catalyst Markets API is running',
  });
});

// Mount API routes
app.use('/api/v1/stocks', stockRoutes);
app.use('/api/v1/ipos', ipoRoutes);
app.use('/api/v1/portfolio', portfolioRoutes);
app.use('/api/v1/watchlist', watchlistRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', err, {
    method: req.method,
    path: req.path,
    body: req.body,
  });

  res.status(500).json({
    error: 'Internal Server Error',
    message: config.env === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// SERVER STARTUP
// ============================================

const startServer = async () => {
  try {
    await prisma.$connect();
    logger.info('✅ Database connected');

    await redis.ping();
    logger.info('✅ Redis connected');

    app.listen(config.port, () => {
      logger.info(`🚀 ${config.appName} v${config.appVersion} running on port ${config.port}`);
      logger.info(`📝 Environment: ${config.env}`);
      logger.info(`🏥 Health check: http://localhost:${config.port}/health`);
      logger.info(`🔗 API: http://localhost:${config.port}/api/v1`);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
};

const shutdown = async (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully...`);
  
  try {
    await prisma.$disconnect();
    await redis.quit();
    logger.info('✅ Connections closed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
});


console.log('🔍 About to call startServer()...');
startServer();

export default app;

*/


