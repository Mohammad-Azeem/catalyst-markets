"use strict";
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
exports.watchlistService = exports.WatchlistService = void 0;
var prisma_1 = require("../db/prisma");
var redis_1 = require("../db/redis");
var logger_1 = require("../utils/logger");
var WatchlistService = /** @class */ (function () {
    function WatchlistService() {
    }
    /**
     * Get all watchlists for a user
     */
    WatchlistService.prototype.getUserWatchlists = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var cacheKey, cached, watchlists, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        cacheKey = "watchlists:user:".concat(userId);
                        return [4 /*yield*/, redis_1.cache.get(cacheKey)];
                    case 1:
                        cached = _a.sent();
                        if (cached) {
                            return [2 /*return*/, cached];
                        }
                        return [4 /*yield*/, prisma_1.default.watchlist.findMany({
                                where: { userId: userId },
                                include: {
                                    stocks: {
                                        include: {
                                            stock: true,
                                        },
                                        orderBy: {
                                            addedAt: 'desc',
                                        },
                                    },
                                },
                            })];
                    case 2:
                        watchlists = _a.sent();
                        result = watchlists.map(function (w) { return ({
                            id: w.id,
                            name: w.name,
                            stocks: w.stocks.map(function (ws) { return ({
                                id: ws.id,
                                symbol: ws.stock.symbol,
                                name: ws.stock.name,
                                exchange: ws.stock.exchange,
                                currentPrice: ws.stock.currentPrice.toNumber(),
                                dayChangePercent: ws.stock.dayChangePercent.toNumber(),
                                addedAt: ws.addedAt,
                            }); }),
                            stockCount: w.stocks.length,
                        }); });
                        // Cache for 30 seconds
                        return [4 /*yield*/, redis_1.cache.set(cacheKey, result, 30)];
                    case 3:
                        // Cache for 30 seconds
                        _a.sent();
                        return [2 /*return*/, result];
                }
            });
        });
    };
    /**
     * Get single watchlist
     */
    WatchlistService.prototype.getWatchlist = function (watchlistId, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var watchlist;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma_1.default.watchlist.findFirst({
                            where: { id: watchlistId, userId: userId },
                            include: {
                                stocks: {
                                    include: {
                                        stock: true,
                                    },
                                    orderBy: {
                                        addedAt: 'desc',
                                    },
                                },
                            },
                        })];
                    case 1:
                        watchlist = _a.sent();
                        if (!watchlist)
                            return [2 /*return*/, null];
                        return [2 /*return*/, {
                                id: watchlist.id,
                                name: watchlist.name,
                                stocks: watchlist.stocks.map(function (ws) { return ({
                                    id: ws.id,
                                    symbol: ws.stock.symbol,
                                    name: ws.stock.name,
                                    exchange: ws.stock.exchange,
                                    currentPrice: ws.stock.currentPrice.toNumber(),
                                    dayChangePercent: ws.stock.dayChangePercent.toNumber(),
                                    addedAt: ws.addedAt,
                                }); }),
                                stockCount: watchlist.stocks.length,
                            }];
                }
            });
        });
    };
    /**
     * Create new watchlist
     */
    WatchlistService.prototype.createWatchlist = function (userId, name) {
        return __awaiter(this, void 0, void 0, function () {
            var watchlist;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma_1.default.watchlist.create({
                            data: {
                                userId: userId,
                                name: name,
                            },
                            include: {
                                stocks: {
                                    include: {
                                        stock: true,
                                    },
                                },
                            },
                        })];
                    case 1:
                        watchlist = _a.sent();
                        // Invalidate cache
                        return [4 /*yield*/, redis_1.cache.del("watchlists:user:".concat(userId))];
                    case 2:
                        // Invalidate cache
                        _a.sent();
                        return [2 /*return*/, {
                                id: watchlist.id,
                                name: watchlist.name,
                                stocks: [],
                                stockCount: 0,
                            }];
                }
            });
        });
    };
    /**
     * Add stock to watchlist
     */
    WatchlistService.prototype.addStock = function (watchlistId, userId, symbol) {
        return __awaiter(this, void 0, void 0, function () {
            var watchlist, stock, existing;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma_1.default.watchlist.findFirst({
                            where: { id: watchlistId, userId: userId },
                        })];
                    case 1:
                        watchlist = _a.sent();
                        if (!watchlist) {
                            throw new Error('Watchlist not found');
                        }
                        return [4 /*yield*/, prisma_1.default.stock.findUnique({
                                where: { symbol: symbol },
                            })];
                    case 2:
                        stock = _a.sent();
                        if (!stock) {
                            throw new Error('Stock not found');
                        }
                        return [4 /*yield*/, prisma_1.default.watchlistStock.findFirst({
                                where: {
                                    watchlistId: watchlistId,
                                    stockId: stock.id,
                                },
                            })];
                    case 3:
                        existing = _a.sent();
                        if (existing) {
                            throw new Error('Stock already in watchlist');
                        }
                        // Add to watchlist
                        return [4 /*yield*/, prisma_1.default.watchlistStock.create({
                                data: {
                                    watchlistId: watchlistId,
                                    stockId: stock.id,
                                },
                            })];
                    case 4:
                        // Add to watchlist
                        _a.sent();
                        // Invalidate cache
                        return [4 /*yield*/, redis_1.cache.del("watchlists:user:".concat(userId))];
                    case 5:
                        // Invalidate cache
                        _a.sent();
                        logger_1.default.info('Stock added to watchlist', {
                            watchlistId: watchlistId,
                            symbol: symbol,
                        });
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Remove stock from watchlist
     */
    WatchlistService.prototype.removeStock = function (watchlistId, stockId, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var watchlist;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma_1.default.watchlist.findFirst({
                            where: { id: watchlistId, userId: userId },
                        })];
                    case 1:
                        watchlist = _a.sent();
                        if (!watchlist) {
                            throw new Error('Watchlist not found');
                        }
                        return [4 /*yield*/, prisma_1.default.watchlistStock.delete({
                                where: {
                                    watchlistId_stockId: {
                                        watchlistId: watchlistId,
                                        stockId: stockId,
                                    },
                                },
                            })];
                    case 2:
                        _a.sent();
                        // Invalidate cache
                        return [4 /*yield*/, redis_1.cache.del("watchlists:user:".concat(userId))];
                    case 3:
                        // Invalidate cache
                        _a.sent();
                        logger_1.default.info('Stock removed from watchlist', { watchlistId: watchlistId, stockId: stockId });
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Delete watchlist
     */
    WatchlistService.prototype.deleteWatchlist = function (watchlistId, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var watchlist;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma_1.default.watchlist.findFirst({
                            where: { id: watchlistId, userId: userId },
                        })];
                    case 1:
                        watchlist = _a.sent();
                        if (!watchlist) {
                            throw new Error('Watchlist not found');
                        }
                        return [4 /*yield*/, prisma_1.default.watchlist.delete({
                                where: { id: watchlistId },
                            })];
                    case 2:
                        _a.sent();
                        // Invalidate cache
                        return [4 /*yield*/, redis_1.cache.del("watchlists:user:".concat(userId))];
                    case 3:
                        // Invalidate cache
                        _a.sent();
                        logger_1.default.info('Watchlist deleted', { watchlistId: watchlistId });
                        return [2 /*return*/];
                }
            });
        });
    };
    return WatchlistService;
}());
exports.WatchlistService = WatchlistService;
exports.watchlistService = new WatchlistService();
