import dotenv from 'dotenv';
import path from 'path';

const envFile = process.env.NODE_ENV === 'production' 
  ? '.env.production' 
  : '.env.development';

dotenv.config({ path: path.resolve(process.cwd(), envFile) });

const requiredEnvVars = [
  'DATABASE_URL',
  'REDIS_URL',
  'JWT_SECRET',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  appName: process.env.APP_NAME || 'Catalyst Markets',
  appVersion: process.env.APP_VERSION || '0.1.0',

  database: {
    url: process.env.DATABASE_URL!,
  },

  redis: {
    url: process.env.REDIS_URL!,
    cacheTtl: parseInt(process.env.REDIS_CACHE_TTL || '300', 10),
  },

  auth: {
    jwtSecret: process.env.JWT_SECRET!,
    jwtExpiry: parseInt(process.env.JWT_EXPIRY || '86400', 10),
  },

  apis: {
    iexCloud: {
      apiKey: process.env.IEX_CLOUD_API_KEY,
      baseUrl: process.env.IEX_CLOUD_BASE_URL || 'https://cloud.iexapis.com/stable',
    },
    alphaVantage: {
      apiKey: process.env.ALPHA_VANTAGE_API_KEY,
      baseUrl: process.env.ALPHA_VANTAGE_BASE_URL || 'https://www.alphavantage.co',
    },
  },

  cors: {
    origins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
  },

  features: {
    usMarkets: process.env.ENABLE_US_MARKETS === 'true',
    euMarkets: process.env.ENABLE_EU_MARKETS === 'true',
    optionsChain: process.env.ENABLE_OPTIONS_CHAIN === 'true',
    proTier: process.env.ENABLE_PRO_TIER === 'true',
  },

  monitoring: {
    logLevel: process.env.LOG_LEVEL || 'info',
  },
} as const;

if (config.env === 'development') {
  console.log('🔧 Configuration loaded:', {
    env: config.env,
    port: config.port,
    database: '✓',
    redis: '✓',
    features: config.features,
  });
}

export default config;