"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
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
var express_validator_1 = require("express-validator");
var stockPrice_1 = require("../services/stockPrice");
var prisma_1 = require("../db/prisma");
var redis_1 = require("../db/redis");
var logger_1 = require("../utils/logger");
var router = (0, express_1.Router)();
// ============================================
// VALIDATION MIDDLEWARE
// ============================================
var validateRequest = function (req, res, next) {
    var errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation Error',
            details: errors.array(),
        });
    }
    next();
};
// ============================================
// GET /api/v1/stocks
// List all stocks with pagination and filtering
// ============================================
router.get('/', [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).toInt(),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    (0, express_validator_1.query)('exchange').optional().isIn(['NSE', 'NASDAQ', 'NYSE', 'LSE', 'EURONEXT']),
    (0, express_validator_1.query)('sector').optional().isString(),
    (0, express_validator_1.query)('search').optional().isString(),
    validateRequest,
], function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var page, limit, exchange, sector, search, skip, where, cacheKey, cached, _a, stocks, total, response, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 4, , 5]);
                page = parseInt(req.query.page) || 1;
                limit = parseInt(req.query.limit) || 20;
                exchange = req.query.exchange;
                sector = req.query.sector;
                search = req.query.search;
                skip = (page - 1) * limit;
                where = {};
                if (exchange)
                    where.exchange = exchange;
                if (sector)
                    where.sector = sector;
                if (search) {
                    where.OR = [
                        { name: { contains: search, mode: 'insensitive' } },
                        { symbol: { contains: search, mode: 'insensitive' } },
                    ];
                }
                cacheKey = "stocks:list:".concat(JSON.stringify({ page: page, limit: limit, exchange: exchange, sector: sector, search: search }));
                return [4 /*yield*/, redis_1.cache.get(cacheKey)];
            case 1:
                cached = _b.sent();
                if (cached) {
                    logger_1.default.debug('Cache hit for stocks list');
                    return [2 /*return*/, res.json(cached)];
                }
                return [4 /*yield*/, Promise.all([
                        prisma_1.default.stock.findMany({
                            where: where,
                            skip: skip,
                            take: limit,
                            orderBy: { marketCap: 'desc' },
                            select: {
                                id: true,
                                symbol: true,
                                name: true,
                                exchange: true,
                                sector: true,
                                currentPrice: true,
                                dayChange: true,
                                dayChangePercent: true,
                                volume: true,
                                marketCap: true,
                                lastUpdated: true,
                            },
                        }),
                        prisma_1.default.stock.count({ where: where }),
                    ])];
            case 2:
                _a = _b.sent(), stocks = _a[0], total = _a[1];
                response = {
                    data: stocks,
                    pagination: {
                        page: page,
                        limit: limit,
                        total: total,
                        totalPages: Math.ceil(total / limit),
                        hasMore: page * limit < total,
                    },
                };
                // Cache for 1 minute
                return [4 /*yield*/, redis_1.cache.set(cacheKey, response, 60)];
            case 3:
                // Cache for 1 minute
                _b.sent();
                res.json(response);
                return [3 /*break*/, 5];
            case 4:
                error_1 = _b.sent();
                logger_1.default.error('Error fetching stocks list', error_1);
                next(error_1);
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
// ============================================
// GET /api/v1/stocks/:symbol
// Get detailed stock information
// ============================================
router.get('/:symbol', [
    (0, express_validator_1.param)('symbol').isString().isLength({ min: 1, max: 10 }).toUpperCase(),
    (0, express_validator_1.query)('exchange').optional().isIn(['NSE', 'NASDAQ', 'NYSE', 'LSE', 'EURONEXT']),
    validateRequest,
], function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var symbol, exchange, stock, quote, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 5, , 6]);
                symbol = req.params.symbol;
                exchange = req.query.exchange || 'NASDAQ';
                return [4 /*yield*/, prisma_1.default.stock.findUnique({
                        where: { symbol: symbol },
                    })];
            case 1:
                stock = _a.sent();
                if (!!stock) return [3 /*break*/, 4];
                logger_1.default.info("Stock ".concat(symbol, " not found in database, fetching from API"));
                return [4 /*yield*/, stockPrice_1.stockPriceService.getQuote(symbol, exchange)];
            case 2:
                quote = _a.sent();
                if (!quote) {
                    return [2 /*return*/, res.status(404).json({
                            error: 'Stock Not Found',
                            message: "Stock with symbol ".concat(symbol, " not found"),
                        })];
                }
                return [4 /*yield*/, prisma_1.default.stock.create({
                        data: {
                            symbol: quote.symbol,
                            name: quote.name,
                            exchange: exchange,
                            currentPrice: quote.price,
                            dayChange: quote.change,
                            dayChangePercent: quote.changePercent,
                            volume: BigInt(quote.volume),
                            marketCap: quote.marketCap ? quote.marketCap : undefined,
                            high52Week: quote.high52Week,
                            low52Week: quote.low52Week,
                            peRatio: quote.peRatio,
                            lastUpdated: new Date(),
                        },
                    })];
            case 3:
                // Create stock in database
                stock = _a.sent();
                _a.label = 4;
            case 4:
                res.json({
                    data: stock,
                    meta: {
                        source: 'database',
                        lastUpdated: stock.lastUpdated,
                    },
                });
                return [3 /*break*/, 6];
            case 5:
                error_2 = _a.sent();
                logger_1.default.error('Error fetching stock details', error_2);
                next(error_2);
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); });
// ============================================
// GET /api/v1/stocks/:symbol/price
// Get real-time price (with aggressive caching)
// ============================================
router.get('/:symbol/price', [
    (0, express_validator_1.param)('symbol').isString().isLength({ min: 1, max: 10 }).toUpperCase(),
    (0, express_validator_1.query)('exchange').optional().isIn(['NSE', 'NASDAQ', 'NYSE', 'LSE', 'EURONEXT']),
    (0, express_validator_1.query)('realtime').optional().isBoolean(),
    validateRequest,
], function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var symbol, exchange, realtime, cached, quote, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                symbol = req.params.symbol;
                exchange = req.query.exchange || 'NASDAQ';
                realtime = req.query.realtime === 'true';
                if (!!realtime) return [3 /*break*/, 2];
                return [4 /*yield*/, stockPrice_1.stockPriceService.getCachedQuote(symbol)];
            case 1:
                cached = _a.sent();
                if (cached) {
                    return [2 /*return*/, res.json({
                            data: cached,
                            meta: {
                                source: 'cache',
                                age: Math.floor((Date.now() - cached.lastUpdated.getTime()) / 1000),
                            },
                        })];
                }
                _a.label = 2;
            case 2: return [4 /*yield*/, stockPrice_1.stockPriceService.getQuote(symbol, exchange)];
            case 3:
                quote = _a.sent();
                if (!quote) {
                    return [2 /*return*/, res.status(404).json({
                            error: 'Price Not Available',
                            message: "Unable to fetch price for ".concat(symbol),
                        })];
                }
                // Update database (fire and forget)
                prisma_1.default.stock.update({
                    where: { symbol: symbol },
                    data: {
                        currentPrice: quote.price,
                        dayChange: quote.change,
                        dayChangePercent: quote.changePercent,
                        volume: BigInt(quote.volume),
                        lastUpdated: new Date(),
                    },
                }).catch(function (err) {
                    logger_1.default.error('Failed to update stock price in database', err);
                });
                res.json({
                    data: quote,
                    meta: {
                        source: quote.source,
                        realtime: true,
                    },
                });
                return [3 /*break*/, 5];
            case 4:
                error_3 = _a.sent();
                logger_1.default.error('Error fetching stock price', error_3);
                next(error_3);
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
// ============================================
// POST /api/v1/stocks/batch-prices
// Get multiple stock prices efficiently
// ============================================
router.post('/batch-prices', [
    (0, express_validator_1.query)('exchange').optional().isIn(['NSE', 'NASDAQ', 'NYSE', 'LSE', 'EURONEXT']),
    validateRequest,
], function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var symbols, exchange, quotes, successful_1, failed, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                symbols = req.body.symbols;
                exchange = req.query.exchange || 'NASDAQ';
                // Validation
                if (!Array.isArray(symbols) || symbols.length === 0) {
                    return [2 /*return*/, res.status(400).json({
                            error: 'Invalid Request',
                            message: 'symbols must be a non-empty array',
                        })];
                }
                if (symbols.length > 50) {
                    return [2 /*return*/, res.status(400).json({
                            error: 'Too Many Symbols',
                            message: 'Maximum 50 symbols allowed per request',
                        })];
                }
                // Challenge: Fetching many stocks can hit rate limits
                // Solution: Use batch endpoint and aggressive caching
                logger_1.default.info("Batch price request for ".concat(symbols.length, " symbols"));
                return [4 /*yield*/, stockPrice_1.stockPriceService.getMultipleQuotes(symbols, exchange)];
            case 1:
                quotes = _a.sent();
                successful_1 = quotes.map(function (q) { return q.symbol; });
                failed = symbols.filter(function (s) { return !successful_1.includes(s); });
                res.json({
                    data: quotes,
                    meta: {
                        requested: symbols.length,
                        successful: successful_1.length,
                        failed: failed.length,
                        failedSymbols: failed,
                    },
                });
                return [3 /*break*/, 3];
            case 2:
                error_4 = _a.sent();
                logger_1.default.error('Error in batch price fetch', error_4);
                next(error_4);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// ============================================
// POST /api/v1/stocks/search
// Search stocks by name or symbol
// ============================================
router.post('/search', [
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    validateRequest,
], function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var searchQuery, limit, cacheKey, cached, stocks, response, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                searchQuery = req.body.query;
                limit = parseInt(req.query.limit) || 10;
                if (!searchQuery || searchQuery.length < 2) {
                    return [2 /*return*/, res.status(400).json({
                            error: 'Invalid Search Query',
                            message: 'Search query must be at least 2 characters',
                        })];
                }
                cacheKey = "stocks:search:".concat(searchQuery, ":").concat(limit);
                return [4 /*yield*/, redis_1.cache.get(cacheKey)];
            case 1:
                cached = _a.sent();
                if (cached) {
                    return [2 /*return*/, res.json(cached)];
                }
                return [4 /*yield*/, prisma_1.default.stock.findMany({
                        where: {
                            OR: [
                                { name: { contains: searchQuery, mode: 'insensitive' } },
                                { symbol: { contains: searchQuery, mode: 'insensitive' } },
                            ],
                        },
                        take: limit,
                        orderBy: { marketCap: 'desc' },
                        select: {
                            id: true,
                            symbol: true,
                            name: true,
                            exchange: true,
                            currentPrice: true,
                            dayChangePercent: true,
                        },
                    })];
            case 2:
                stocks = _a.sent();
                response = {
                    data: stocks,
                    meta: {
                        query: searchQuery,
                        results: stocks.length,
                    },
                };
                // Cache search results for 5 minutes
                return [4 /*yield*/, redis_1.cache.set(cacheKey, response, 300)];
            case 3:
                // Cache search results for 5 minutes
                _a.sent();
                res.json(response);
                return [3 /*break*/, 5];
            case 4:
                error_5 = _a.sent();
                logger_1.default.error('Error in stock search', error_5);
                next(error_5);
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
// ============================================
// ERROR HANDLING
// ============================================
router.use(function (error, req, res, next) {
    logger_1.default.error('Stock API error', {
        error: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method,
    });
    res.status(500).json(__assign({ error: 'Internal Server Error', message: 'An error occurred while processing your request' }, (process.env.NODE_ENV === 'development' && { details: error.message })));
});
exports.default = router;
