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
exports.portfolioService = exports.PortfolioService = void 0;
var prisma_1 = require("../db/prisma");
var redis_1 = require("../db/redis");
var logger_1 = require("../utils/logger");
var PortfolioService = /** @class */ (function () {
    function PortfolioService() {
    }
    /**
     * Get all portfolios for a user
     */
    PortfolioService.prototype.getUserPortfolios = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var cacheKey, cached, portfolios, result;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        cacheKey = "portfolios:user:".concat(userId);
                        return [4 /*yield*/, redis_1.cache.get(cacheKey)];
                    case 1:
                        cached = _a.sent();
                        if (cached) {
                            return [2 /*return*/, cached];
                        }
                        return [4 /*yield*/, prisma_1.default.portfolio.findMany({
                                where: { userId: userId },
                                include: {
                                    stocks: {
                                        include: {
                                            stock: true,
                                        },
                                    },
                                },
                            })];
                    case 2:
                        portfolios = _a.sent();
                        return [4 /*yield*/, Promise.all(portfolios.map(function (p) { return _this.calculatePortfolioMetrics(p); }))];
                    case 3:
                        result = _a.sent();
                        // Cache for 1 minute
                        return [4 /*yield*/, redis_1.cache.set(cacheKey, result, 60)];
                    case 4:
                        // Cache for 1 minute
                        _a.sent();
                        return [2 /*return*/, result];
                }
            });
        });
    };
    /**
     * Get single portfolio by ID
     */
    PortfolioService.prototype.getPortfolio = function (portfolioId, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var portfolio;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma_1.default.portfolio.findFirst({
                            where: { id: portfolioId, userId: userId },
                            include: {
                                stocks: {
                                    include: {
                                        stock: true,
                                    },
                                },
                            },
                        })];
                    case 1:
                        portfolio = _a.sent();
                        if (!portfolio)
                            return [2 /*return*/, null];
                        return [2 /*return*/, this.calculatePortfolioMetrics(portfolio)];
                }
            });
        });
    };
    /**
     * Create new portfolio
     */
    PortfolioService.prototype.createPortfolio = function (userId, name, description) {
        return __awaiter(this, void 0, void 0, function () {
            var portfolio;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma_1.default.portfolio.create({
                            data: {
                                userId: userId,
                                name: name,
                                description: description,
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
                        portfolio = _a.sent();
                        // Invalidate cache
                        return [4 /*yield*/, redis_1.cache.del("portfolios:user:".concat(userId))];
                    case 2:
                        // Invalidate cache
                        _a.sent();
                        return [2 /*return*/, this.calculatePortfolioMetrics(portfolio)];
                }
            });
        });
    };
    /**
     * Add stock to portfolio
     */
    PortfolioService.prototype.addStock = function (portfolioId, userId, data) {
        return __awaiter(this, void 0, void 0, function () {
            var portfolio, stock, existing;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma_1.default.portfolio.findFirst({
                            where: { id: portfolioId, userId: userId },
                        })];
                    case 1:
                        portfolio = _a.sent();
                        if (!portfolio) {
                            throw new Error('Portfolio not found');
                        }
                        return [4 /*yield*/, prisma_1.default.stock.findUnique({
                                where: { symbol: data.symbol },
                            })];
                    case 2:
                        stock = _a.sent();
                        if (!stock) {
                            throw new Error('Stock not found');
                        }
                        return [4 /*yield*/, prisma_1.default.portfolioStock.findFirst({
                                where: {
                                    portfolioId: portfolioId,
                                    stockId: stock.id,
                                },
                            })];
                    case 3:
                        existing = _a.sent();
                        if (existing) {
                            throw new Error('Stock already in portfolio');
                        }
                        // Add stock to portfolio
                        return [4 /*yield*/, prisma_1.default.portfolioStock.create({
                                data: {
                                    portfolioId: portfolioId,
                                    stockId: stock.id,
                                    buyPrice: data.buyPrice,
                                    quantity: data.quantity,
                                    buyDate: data.buyDate,
                                },
                            })];
                    case 4:
                        // Add stock to portfolio
                        _a.sent();
                        // Invalidate cache
                        return [4 /*yield*/, redis_1.cache.del("portfolios:user:".concat(userId))];
                    case 5:
                        // Invalidate cache
                        _a.sent();
                        logger_1.default.info('Stock added to portfolio', {
                            portfolioId: portfolioId,
                            symbol: data.symbol,
                            quantity: data.quantity,
                        });
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Remove stock from portfolio
     */
    PortfolioService.prototype.removeStock = function (portfolioId, stockId, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var portfolio;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma_1.default.portfolio.findFirst({
                            where: { id: portfolioId, userId: userId },
                        })];
                    case 1:
                        portfolio = _a.sent();
                        if (!portfolio) {
                            throw new Error('Portfolio not found');
                        }
                        return [4 /*yield*/, prisma_1.default.portfolioStock.delete({
                                where: {
                                    portfolioId_stockId: {
                                        portfolioId: portfolioId,
                                        stockId: stockId,
                                    },
                                },
                            })];
                    case 2:
                        _a.sent();
                        // Invalidate cache
                        return [4 /*yield*/, redis_1.cache.del("portfolios:user:".concat(userId))];
                    case 3:
                        // Invalidate cache
                        _a.sent();
                        logger_1.default.info('Stock removed from portfolio', { portfolioId: portfolioId, stockId: stockId });
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Delete portfolio
     */
    PortfolioService.prototype.deletePortfolio = function (portfolioId, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var portfolio;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma_1.default.portfolio.findFirst({
                            where: { id: portfolioId, userId: userId },
                        })];
                    case 1:
                        portfolio = _a.sent();
                        if (!portfolio) {
                            throw new Error('Portfolio not found');
                        }
                        return [4 /*yield*/, prisma_1.default.portfolio.delete({
                                where: { id: portfolioId },
                            })];
                    case 2:
                        _a.sent();
                        // Invalidate cache
                        return [4 /*yield*/, redis_1.cache.del("portfolios:user:".concat(userId))];
                    case 3:
                        // Invalidate cache
                        _a.sent();
                        logger_1.default.info('Portfolio deleted', { portfolioId: portfolioId });
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Calculate portfolio metrics (P&L)
     */
    PortfolioService.prototype.calculatePortfolioMetrics = function (portfolio) {
        return __awaiter(this, void 0, void 0, function () {
            var totalInvested, currentValue, stocks, totalGainLoss, totalGainLossPercent;
            return __generator(this, function (_a) {
                totalInvested = 0;
                currentValue = 0;
                stocks = portfolio.stocks.map(function (ps) {
                    var invested = ps.buyPrice * ps.quantity;
                    var current = ps.stock.currentPrice * ps.quantity;
                    var gainLoss = current - invested;
                    var gainLossPercent = (gainLoss / invested) * 100;
                    totalInvested += invested;
                    currentValue += current;
                    return {
                        id: ps.id,
                        symbol: ps.stock.symbol,
                        name: ps.stock.name,
                        exchange: ps.stock.exchange,
                        quantity: ps.quantity,
                        buyPrice: ps.buyPrice,
                        buyDate: ps.buyDate,
                        currentPrice: ps.stock.currentPrice,
                        currentValue: current,
                        investedValue: invested,
                        gainLoss: gainLoss,
                        gainLossPercent: gainLossPercent,
                    };
                });
                totalGainLoss = currentValue - totalInvested;
                totalGainLossPercent = totalInvested > 0
                    ? (totalGainLoss / totalInvested) * 100
                    : 0;
                return [2 /*return*/, {
                        id: portfolio.id,
                        name: portfolio.name,
                        description: portfolio.description,
                        stocks: stocks,
                        totalInvested: totalInvested,
                        currentValue: currentValue,
                        totalGainLoss: totalGainLoss,
                        totalGainLossPercent: totalGainLossPercent,
                    }];
            });
        });
    };
    return PortfolioService;
}());
exports.PortfolioService = PortfolioService;
exports.portfolioService = new PortfolioService();
