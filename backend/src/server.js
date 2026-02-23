"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var cors_1 = require("cors");
var helmet_1 = require("helmet");
var compression_1 = require("compression");
var config_1 = require("./config");
var logger_1 = require("./utils/logger");
var prisma_1 = require("./db/prisma");
var redis_1 = require("./db/redis");
// Import route modules
var stocks_1 = require("./routes/stocks");
var ipos_1 = require("./routes/ipos");
var portfolio_1 = require("./routes/portfolio");
var watchlist_1 = require("./routes/watchlist");
// Initialize Express app
var app = (0, express_1.default)();
// ============================================
// MIDDLEWARE
// ============================================
// Security headers
app.use((0, helmet_1.default)({
    contentSecurityPolicy: config_1.config.env === 'production',
    crossOriginEmbedderPolicy: false,
}));
// CORS
app.use((0, cors_1.default)({
    origin: config_1.config.cors.origins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
// Compression
app.use((0, compression_1.default)());
// Body parsing
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Request logging
app.use(function (req, res, next) {
    var start = Date.now();
    res.on('finish', function () {
        var duration = Date.now() - start;
        logger_1.default.info('HTTP Request', {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration: "".concat(duration, "ms"),
            ip: req.ip,
        });
    });
    next();
});
// ============================================
// HEALTH CHECK ROUTES
// ============================================
app.get('/health', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var health, error_1, error_2, statusCode;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                health = {
                    status: 'ok',
                    timestamp: new Date().toISOString(),
                    uptime: process.uptime(),
                    environment: config_1.config.env,
                    version: config_1.config.appVersion,
                    checks: {
                        database: 'unknown',
                        redis: 'unknown',
                    },
                };
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, prisma_1.default.$queryRaw(templateObject_1 || (templateObject_1 = __makeTemplateObject(["SELECT 1"], ["SELECT 1"])))];
            case 2:
                _a.sent();
                health.checks.database = 'healthy';
                return [3 /*break*/, 4];
            case 3:
                error_1 = _a.sent();
                logger_1.default.error('Database health check failed', error_1);
                health.checks.database = 'unhealthy';
                health.status = 'degraded';
                return [3 /*break*/, 4];
            case 4:
                _a.trys.push([4, 6, , 7]);
                return [4 /*yield*/, redis_1.default.ping()];
            case 5:
                _a.sent();
                health.checks.redis = 'healthy';
                return [3 /*break*/, 7];
            case 6:
                error_2 = _a.sent();
                logger_1.default.error('Redis health check failed', error_2);
                health.checks.redis = 'unhealthy';
                health.status = 'degraded';
                return [3 /*break*/, 7];
            case 7:
                statusCode = health.status === 'ok' ? 200 : 503;
                res.status(statusCode).json(health);
                return [2 /*return*/];
        }
    });
}); });
app.get('/ready', function (req, res) {
    res.status(200).json({ ready: true });
});
// ============================================
// API ROUTES
// ============================================
app.get('/api/v1', function (req, res) {
    res.json({
        name: config_1.config.appName,
        version: config_1.config.appVersion,
        environment: config_1.config.env,
        message: 'Catalyst Markets API is running',
    });
});
// Mount API routes
app.use('/api/v1/stocks', stocks_1.default);
app.use('/api/v1/ipos', ipos_1.default);
app.use('/api/v1/portfolio', portfolio_1.default);
app.use('/api/v1/watchlist', watchlist_1.default);
// ============================================
// ERROR HANDLING
// ============================================
// 404 handler
app.use(function (req, res) {
    res.status(404).json({
        error: 'Not Found',
        message: "Route ".concat(req.method, " ").concat(req.path, " not found"),
        timestamp: new Date().toISOString(),
    });
});
// Global error handler
app.use(function (err, req, res, next) {
    logger_1.default.error('Unhandled error', err, {
        method: req.method,
        path: req.path,
        body: req.body,
    });
    res.status(500).json({
        error: 'Internal Server Error',
        message: config_1.config.env === 'development' ? err.message : 'Something went wrong',
        timestamp: new Date().toISOString(),
    });
});
// ============================================
// SERVER STARTUP
// ============================================
var startServer = function () { return __awaiter(void 0, void 0, void 0, function () {
    var error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, prisma_1.default.$connect()];
            case 1:
                _a.sent();
                logger_1.default.info('✅ Database connected');
                return [4 /*yield*/, redis_1.default.ping()];
            case 2:
                _a.sent();
                logger_1.default.info('✅ Redis connected');
                app.listen(config_1.config.port, function () {
                    logger_1.default.info("\uD83D\uDE80 ".concat(config_1.config.appName, " v").concat(config_1.config.appVersion, " running on port ").concat(config_1.config.port));
                    logger_1.default.info("\uD83D\uDCDD Environment: ".concat(config_1.config.env));
                    logger_1.default.info("\uD83C\uDFE5 Health check: http://localhost:".concat(config_1.config.port, "/health"));
                    logger_1.default.info("\uD83D\uDD17 API: http://localhost:".concat(config_1.config.port, "/api/v1"));
                });
                return [3 /*break*/, 4];
            case 3:
                error_3 = _a.sent();
                logger_1.default.error('Failed to start server', error_3);
                process.exit(1);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
var shutdown = function (signal) { return __awaiter(void 0, void 0, void 0, function () {
    var error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                logger_1.default.info("".concat(signal, " received, shutting down gracefully..."));
                _a.label = 1;
            case 1:
                _a.trys.push([1, 4, , 5]);
                return [4 /*yield*/, prisma_1.default.$disconnect()];
            case 2:
                _a.sent();
                return [4 /*yield*/, redis_1.default.quit()];
            case 3:
                _a.sent();
                logger_1.default.info('✅ Connections closed');
                process.exit(0);
                return [3 /*break*/, 5];
            case 4:
                error_4 = _a.sent();
                logger_1.default.error('Error during shutdown', error_4);
                process.exit(1);
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
process.on('SIGTERM', function () { return shutdown('SIGTERM'); });
process.on('SIGINT', function () { return shutdown('SIGINT'); });
process.on('uncaughtException', function (error) {
    logger_1.default.error('Uncaught Exception', error);
    process.exit(1);
});
process.on('unhandledRejection', function (reason, promise) {
    logger_1.default.error('Unhandled Rejection', { reason: reason, promise: promise });
});
startServer();
exports.default = app;
var templateObject_1;
