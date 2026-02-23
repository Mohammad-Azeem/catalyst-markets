(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

import express from 'express';
import http from 'http';
import cors from 'cors';
import prisma from './db/prisma';
import redis from './db/redis';

import stockRoutes from './routes/stocks';
import ipoRoutes from './routes/ipos';
import portfolioRoutes from './routes/portfolio';
import watchlistRoutes from './routes/watchlist';

const app = express();

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Health check
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    await redis.ping();
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(503).json({ status: 'error', error: String(error) });
  }
});

// Routes
app.get('/api/v1', (req, res) => {
  res.json({ message: 'Catalyst Markets API' });
});

app.use('/api/v1/stocks', stockRoutes);
app.use('/api/v1/ipos', ipoRoutes);
app.use('/api/v1/portfolio', portfolioRoutes);
app.use('/api/v1/watchlist', watchlistRoutes);

// Error handlers
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use((err: Error, req: any, res: any, next: any) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message });
});

// Start server
const PORT = 3001;
const server = http.createServer(app);

async function start() {
  try {
    console.log('🔍 Connecting to database...');
    await prisma.$connect();
    console.log('✅ Database connected');

    console.log('🔍 Connecting to Redis...');
    await redis.ping();
    console.log('✅ Redis connected');

    server.listen(PORT, () => {
      console.log('✅ Server running on http://localhost:' + PORT);
      console.log('🏥 Health: http://localhost:' + PORT + '/health');
      console.log('🔗 API: http://localhost:' + PORT + '/api/v1');
    });
  } catch (error) {
    console.error('❌ Startup failed:', error);
    process.exit(1);
  }
}

start();

export default app;