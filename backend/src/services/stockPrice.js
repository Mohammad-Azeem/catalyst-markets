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
exports.stockPriceService = exports.StockPriceService = exports.AlphaVantageService = exports.IEXCloudService = void 0;
var axios_1 = require("axios");
var zod_1 = require("zod");
var config_1 = require("../config");
var redis_1 = require("../db/redis");
var logger_1 = require("../utils/logger");
var p_limit_1 = require("p-limit");
// Limit concurrent API requests to avoid rate limits
var apiLimit = (0, p_limit_1.default)(5);
// ============================================
// SCHEMAS - Validate API responses
// ============================================
var IEXQuoteSchema = zod_1.z.object({
    symbol: zod_1.z.string(),
    companyName: zod_1.z.string(),
    latestPrice: zod_1.z.number().nullable(),
    change: zod_1.z.number().nullable(),
    changePercent: zod_1.z.number().nullable(),
    volume: zod_1.z.number().nullable(),
    avgTotalVolume: zod_1.z.number().nullable(),
    week52High: zod_1.z.number().nullable(),
    week52Low: zod_1.z.number().nullable(),
    marketCap: zod_1.z.number().nullable(),
    peRatio: zod_1.z.number().nullable(),
}).passthrough();
var AlphaVantageQuoteSchema = zod_1.z.object({
    'Global Quote': zod_1.z.object({
        '01. symbol': zod_1.z.string(),
        '05. price': zod_1.z.string(),
        '09. change': zod_1.z.string(),
        '10. change percent': zod_1.z.string(),
        '06. volume': zod_1.z.string(),
    }),
}).passthrough();
// ============================================
// IEX CLOUD SERVICE
// ============================================
var IEXCloudService = /** @class */ (function () {
    function IEXCloudService() {
        this.CACHE_TTL = 15; // 15 seconds cache
        this.baseUrl = config_1.config.apis.iexCloud.baseUrl;
        this.apiKey = config_1.config.apis.iexCloud.apiKey || '';
        if (!this.apiKey) {
            logger_1.default.warn('IEX Cloud API key not configured');
        }
    }
    IEXCloudService.prototype.fetchQuote = function (symbol) {
        return __awaiter(this, void 0, void 0, function () {
            var cacheKey, cached, response, validated, data, quote, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        cacheKey = "stock:iex:".concat(symbol);
                        return [4 /*yield*/, redis_1.cache.get(cacheKey)];
                    case 1:
                        cached = _a.sent();
                        if (cached) {
                            logger_1.default.debug("Cache hit for ".concat(symbol));
                            return [2 /*return*/, __assign(__assign({}, cached), { source: 'cache' })];
                        }
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 5, , 6]);
                        logger_1.default.debug("Fetching ".concat(symbol, " from IEX Cloud"));
                        return [4 /*yield*/, axios_1.default.get("".concat(this.baseUrl, "/stock/").concat(symbol, "/quote"), {
                                params: { token: this.apiKey },
                                timeout: 10000, // 10 second timeout
                            })];
                    case 3:
                        response = _a.sent();
                        validated = IEXQuoteSchema.safeParse(response.data);
                        if (!validated.success) {
                            logger_1.default.error('Invalid IEX response structure', {
                                symbol: symbol,
                                errors: validated.error.issues,
                                data: response.data,
                            });
                            return [2 /*return*/, null];
                        }
                        data = validated.data;
                        // Handle null values from API
                        if (data.latestPrice === null) {
                            logger_1.default.warn("No price data for ".concat(symbol));
                            return [2 /*return*/, null];
                        }
                        quote = {
                            symbol: data.symbol,
                            name: data.companyName,
                            price: data.latestPrice,
                            change: data.change || 0,
                            changePercent: data.changePercent || 0,
                            volume: data.volume || 0,
                            marketCap: data.marketCap || undefined,
                            high52Week: data.week52High || undefined,
                            low52Week: data.week52Low || undefined,
                            peRatio: data.peRatio || undefined,
                            source: 'iex',
                            lastUpdated: new Date(),
                        };
                        // Cache the result
                        return [4 /*yield*/, redis_1.cache.set(cacheKey, quote, this.CACHE_TTL)];
                    case 4:
                        // Cache the result
                        _a.sent();
                        logger_1.default.info("Successfully fetched ".concat(symbol, " from IEX"), {
                            price: quote.price,
                            changePercent: quote.changePercent,
                        });
                        return [2 /*return*/, quote];
                    case 5:
                        error_1 = _a.sent();
                        return [2 /*return*/, this.handleError(symbol, error_1)];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    IEXCloudService.prototype.fetchMultipleQuotes = function (symbols) {
        return __awaiter(this, void 0, void 0, function () {
            var quotes, errors, promises;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        quotes = [];
                        errors = [];
                        logger_1.default.info("Fetching ".concat(symbols.length, " quotes from IEX"));
                        promises = symbols.map(function (symbol) {
                            return apiLimit(function () { return __awaiter(_this, void 0, void 0, function () {
                                var quote;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: 
                                        // Add small delay between requests
                                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 100); })];
                                        case 1:
                                            // Add small delay between requests
                                            _a.sent();
                                            return [4 /*yield*/, this.fetchQuote(symbol)];
                                        case 2:
                                            quote = _a.sent();
                                            if (quote) {
                                                quotes.push(quote);
                                            }
                                            else {
                                                errors.push({
                                                    symbol: symbol,
                                                    error: 'Failed to fetch quote',
                                                    retryable: true,
                                                });
                                            }
                                            return [2 /*return*/];
                                    }
                                });
                            }); });
                        });
                        return [4 /*yield*/, Promise.allSettled(promises)];
                    case 1:
                        _a.sent();
                        logger_1.default.info("Fetched ".concat(quotes.length, "/").concat(symbols.length, " quotes"), {
                            success: quotes.length,
                            failed: errors.length,
                        });
                        return [2 /*return*/, { quotes: quotes, errors: errors }];
                }
            });
        });
    };
    IEXCloudService.prototype.handleError = function (symbol, error) {
        var _a, _b, _c;
        if (axios_1.default.isAxiosError(error)) {
            var axiosError = error;
            if (((_a = axiosError.response) === null || _a === void 0 ? void 0 : _a.status) === 404) {
                logger_1.default.warn("Stock not found: ".concat(symbol));
                return null;
            }
            if (((_b = axiosError.response) === null || _b === void 0 ? void 0 : _b.status) === 429) {
                logger_1.default.error('IEX Cloud rate limit exceeded', {
                    symbol: symbol,
                    retryAfter: axiosError.response.headers['retry-after'],
                });
                // TODO: Implement exponential backoff
                return null;
            }
            if (axiosError.code === 'ETIMEDOUT') {
                logger_1.default.error('IEX Cloud timeout', { symbol: symbol });
                return null;
            }
            logger_1.default.error('IEX Cloud API error', {
                symbol: symbol,
                status: (_c = axiosError.response) === null || _c === void 0 ? void 0 : _c.status,
                message: axiosError.message,
            });
        }
        else {
            logger_1.default.error('Unexpected error fetching from IEX', {
                symbol: symbol,
                error: String(error),
            });
        }
        return null;
    };
    return IEXCloudService;
}());
exports.IEXCloudService = IEXCloudService;
// ============================================
// ALPHA VANTAGE SERVICE (FALLBACK)
// ============================================
var AlphaVantageService = /** @class */ (function () {
    function AlphaVantageService() {
        this.CACHE_TTL = 60; // 1 minute cache (free tier has lower limits)
        this.baseUrl = config_1.config.apis.alphaVantage.baseUrl;
        this.apiKey = config_1.config.apis.alphaVantage.apiKey || '';
        if (!this.apiKey) {
            logger_1.default.warn('Alpha Vantage API key not configured');
        }
    }
    AlphaVantageService.prototype.fetchQuote = function (symbol) {
        return __awaiter(this, void 0, void 0, function () {
            var cacheKey, cached, response, validated, data, quote, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        cacheKey = "stock:av:".concat(symbol);
                        return [4 /*yield*/, redis_1.cache.get(cacheKey)];
                    case 1:
                        cached = _a.sent();
                        if (cached) {
                            return [2 /*return*/, __assign(__assign({}, cached), { source: 'cache' })];
                        }
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 5, , 6]);
                        logger_1.default.debug("Fetching ".concat(symbol, " from Alpha Vantage"));
                        return [4 /*yield*/, axios_1.default.get(this.baseUrl + '/query', {
                                params: {
                                    function: 'GLOBAL_QUOTE',
                                    symbol: symbol,
                                    apikey: this.apiKey,
                                },
                                timeout: 10000,
                            })];
                    case 3:
                        response = _a.sent();
                        // Alpha Vantage returns error messages in JSON
                        if (response.data['Error Message']) {
                            logger_1.default.warn("Alpha Vantage error for ".concat(symbol, ":"), response.data['Error Message']);
                            return [2 /*return*/, null];
                        }
                        if (response.data['Note']) {
                            logger_1.default.warn('Alpha Vantage rate limit (Note message):', response.data['Note']);
                            return [2 /*return*/, null];
                        }
                        validated = AlphaVantageQuoteSchema.safeParse(response.data);
                        if (!validated.success) {
                            logger_1.default.error('Invalid Alpha Vantage response', {
                                symbol: symbol,
                                errors: validated.error.issues,
                            });
                            return [2 /*return*/, null];
                        }
                        data = validated.data['Global Quote'];
                        quote = {
                            symbol: data['01. symbol'],
                            name: data['01. symbol'], // AV doesn't provide company name in this endpoint
                            price: parseFloat(data['05. price']),
                            change: parseFloat(data['09. change']),
                            changePercent: parseFloat(data['10. change percent'].replace('%', '')),
                            volume: parseInt(data['06. volume']),
                            source: 'alphavantage',
                            lastUpdated: new Date(),
                        };
                        return [4 /*yield*/, redis_1.cache.set(cacheKey, quote, this.CACHE_TTL)];
                    case 4:
                        _a.sent();
                        return [2 /*return*/, quote];
                    case 5:
                        error_2 = _a.sent();
                        logger_1.default.error('Alpha Vantage API error', {
                            symbol: symbol,
                            error: error_2 instanceof Error ? error_2.message : String(error_2),
                        });
                        return [2 /*return*/, null];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    return AlphaVantageService;
}());
exports.AlphaVantageService = AlphaVantageService;
// ============================================
// UNIFIED STOCK SERVICE (WITH FALLBACKS)
// ============================================
var StockPriceService = /** @class */ (function () {
    function StockPriceService() {
        this.iexService = new IEXCloudService();
        this.alphaVantageService = new AlphaVantageService();
    }
    /**
     * Fetch stock quote with automatic fallback
     */
    StockPriceService.prototype.getQuote = function (symbol_1) {
        return __awaiter(this, arguments, void 0, function (symbol, exchange) {
            var quote;
            if (exchange === void 0) { exchange = 'NASDAQ'; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.iexService.fetchQuote(symbol)];
                    case 1:
                        quote = _a.sent();
                        if (quote) {
                            return [2 /*return*/, quote];
                        }
                        // Fallback to Alpha Vantage
                        logger_1.default.info("Falling back to Alpha Vantage for ".concat(symbol));
                        return [4 /*yield*/, this.alphaVantageService.fetchQuote(symbol)];
                    case 2:
                        quote = _a.sent();
                        if (quote) {
                            return [2 /*return*/, quote];
                        }
                        // All sources failed
                        logger_1.default.error("Failed to fetch quote for ".concat(symbol, " from all sources"));
                        return [2 /*return*/, null];
                }
            });
        });
    };
    /**
     * Fetch multiple quotes with batch optimization
     */
    StockPriceService.prototype.getMultipleQuotes = function (symbols_1) {
        return __awaiter(this, arguments, void 0, function (symbols, exchange) {
            var _a, quotes, errors, _i, errors_1, symbol, quote;
            if (exchange === void 0) { exchange = 'NASDAQ'; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        logger_1.default.info("Fetching quotes for ".concat(symbols.length, " symbols"));
                        return [4 /*yield*/, this.iexService.fetchMultipleQuotes(symbols)];
                    case 1:
                        _a = _b.sent(), quotes = _a.quotes, errors = _a.errors;
                        if (!(errors.length > 0)) return [3 /*break*/, 5];
                        logger_1.default.info("Retrying ".concat(errors.length, " failed symbols with Alpha Vantage"));
                        _i = 0, errors_1 = errors;
                        _b.label = 2;
                    case 2:
                        if (!(_i < errors_1.length)) return [3 /*break*/, 5];
                        symbol = errors_1[_i].symbol;
                        return [4 /*yield*/, this.alphaVantageService.fetchQuote(symbol)];
                    case 3:
                        quote = _b.sent();
                        if (quote) {
                            quotes.push(quote);
                        }
                        _b.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/, quotes];
                }
            });
        });
    };
    /**
     * Get cached quote (no API call)
     */
    StockPriceService.prototype.getCachedQuote = function (symbol) {
        return __awaiter(this, void 0, void 0, function () {
            var iexCache, avCache;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, redis_1.cache.get("stock:iex:".concat(symbol))];
                    case 1:
                        iexCache = _a.sent();
                        if (iexCache)
                            return [2 /*return*/, iexCache];
                        return [4 /*yield*/, redis_1.cache.get("stock:av:".concat(symbol))];
                    case 2:
                        avCache = _a.sent();
                        if (avCache)
                            return [2 /*return*/, avCache];
                        return [2 /*return*/, null];
                }
            });
        });
    };
    return StockPriceService;
}());
exports.StockPriceService = StockPriceService;
// Export singleton instance
exports.stockPriceService = new StockPriceService();
