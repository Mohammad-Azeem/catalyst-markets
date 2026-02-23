import Redis from 'ioredis';
import { config } from '../config';

console.log('Connecting to Redis at:', config.redis.url);
const redis = new Redis(config.redis.url, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError(err) {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      // Only reconnect when the error contains "READONLY"
      return true;
    }
    return false;
  },
});

redis.on('connect', () => {
  console.log('✅ Redis connected');
});

redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err);
});

redis.on('ready', () => {
  console.log('✅ Redis ready to accept commands');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await redis.quit();
});

// Cache utility functions
export const cache = {
  /**
   * Get cached value
   */
  async get<T>(key: string): Promise<T | null> {
    const value = await redis.get(key);
    if (!value) return null;
    
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  },

  /**
   * Set cache with TTL
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    const ttlSeconds = ttl || config.redis.cacheTtl;
    await redis.setex(key, ttlSeconds, serialized);
  },

  /**
   * Delete cached value
   */
  async del(key: string): Promise<void> {
    await redis.del(key);
  },

  /**
   * Delete multiple keys by pattern
   */
  async delPattern(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  },

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const result = await redis.exists(key);
    return result === 1;
  },

  /**
   * Increment counter
   */
  async incr(key: string, ttl?: number): Promise<number> {
    const value = await redis.incr(key);
    if (ttl && value === 1) {
      await redis.expire(key, ttl);
    }
    return value;
  },

  /**
   * Get multiple values at once
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    if (keys.length === 0) return [];
    
    const values = await redis.mget(...keys);
    return values.map(value => {
      if (!value) return null;
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as unknown as T;
      }
    });
  },

  /**
   * Set multiple values at once
   */
  async mset(items: Record<string, any>, ttl?: number): Promise<void> {
    const pipeline = redis.pipeline();
    
    Object.entries(items).forEach(([key, value]) => {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      if (ttl) {
        pipeline.setex(key, ttl, serialized);
      } else {
        pipeline.set(key, serialized);
      }
    });
    
    await pipeline.exec();
  },
};

export default redis;