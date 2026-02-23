"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
var dotenv_1 = require("dotenv");
var path_1 = require("path");
var envFile = process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.development';
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), envFile) });
var requiredEnvVars = [
    'DATABASE_URL',
    'REDIS_URL',
    'JWT_SECRET',
];
for (var _i = 0, requiredEnvVars_1 = requiredEnvVars; _i < requiredEnvVars_1.length; _i++) {
    var envVar = requiredEnvVars_1[_i];
    if (!process.env[envVar]) {
        throw new Error("Missing required environment variable: ".concat(envVar));
    }
}
exports.config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3001', 10),
    appName: process.env.APP_NAME || 'Catalyst Markets',
    appVersion: process.env.APP_VERSION || '0.1.0',
    database: {
        url: process.env.DATABASE_URL,
    },
    redis: {
        url: process.env.REDIS_URL,
        cacheTtl: parseInt(process.env.REDIS_CACHE_TTL || '300', 10),
    },
    auth: {
        jwtSecret: process.env.JWT_SECRET,
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
};
if (exports.config.env === 'development') {
    console.log('🔧 Configuration loaded:', {
        env: exports.config.env,
        port: exports.config.port,
        database: '✓',
        redis: '✓',
        features: exports.config.features,
    });
}
exports.default = exports.config;
