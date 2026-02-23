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
exports.ipoService = exports.IPOService = void 0;
var prisma_1 = require("../db/prisma");
var redis_1 = require("../db/redis");
var logger_1 = require("../utils/logger");
var IPOService = /** @class */ (function () {
    function IPOService() {
    }
    /**
     * Get all IPOs with filtering
     */
    IPOService.prototype.getIPOs = function (status) {
        return __awaiter(this, void 0, void 0, function () {
            var cacheKey, cached, where, ipos;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        cacheKey = "ipos:list:".concat(status || 'all');
                        return [4 /*yield*/, redis_1.cache.get(cacheKey)];
                    case 1:
                        cached = _a.sent();
                        if (cached) {
                            logger_1.default.debug('Cache hit for IPO list');
                            return [2 /*return*/, cached];
                        }
                        where = {};
                        if (status) {
                            where.status = status.toUpperCase();
                        }
                        return [4 /*yield*/, prisma_1.default.iPO.findMany({
                                where: where,
                                orderBy: { openDate: 'desc' },
                            })];
                    case 2:
                        ipos = _a.sent();
                        // Cache for 5 minutes
                        return [4 /*yield*/, redis_1.cache.set(cacheKey, ipos, 300)];
                    case 3:
                        // Cache for 5 minutes
                        _a.sent();
                        return [2 /*return*/, ipos];
                }
            });
        });
    };
    /**
     * Get single IPO by ID
     */
    IPOService.prototype.getIPOById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var ipo;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma_1.default.iPO.findUnique({
                            where: { id: id },
                        })];
                    case 1:
                        ipo = _a.sent();
                        return [2 /*return*/, ipo];
                }
            });
        });
    };
    /**
     * Simulate GMP data fetching (in real app, scrape from websites)
     */
    IPOService.prototype.updateGMPData = function (ipoId) {
        return __awaiter(this, void 0, void 0, function () {
            var gmpPercent;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        gmpPercent = Math.random() * 40 - 5;
                        return [4 /*yield*/, prisma_1.default.iPO.update({
                                where: { id: ipoId },
                                data: {
                                    gmpPercent: gmpPercent,
                                    gmpLastUpdated: new Date(),
                                },
                            })];
                    case 1:
                        _a.sent();
                        logger_1.default.info("Updated GMP for IPO ".concat(ipoId), { gmpPercent: gmpPercent });
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Update subscription data
     */
    IPOService.prototype.updateSubscriptionData = function (ipoId, data) {
        return __awaiter(this, void 0, void 0, function () {
            var totalSubscription;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        totalSubscription = (data.retailSubscription * 0.35) +
                            (data.hniSubscription * 0.15) +
                            (data.qibSubscription * 0.50);
                        return [4 /*yield*/, prisma_1.default.iPO.update({
                                where: { id: ipoId },
                                data: __assign(__assign({}, data), { totalSubscription: totalSubscription, subscriptionLastUpdated: new Date() }),
                            })];
                    case 1:
                        _a.sent();
                        logger_1.default.info("Updated subscription data for IPO ".concat(ipoId), data);
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * IPO Advisor - Calculate verdict
     */
    IPOService.prototype.calculateAdvisorVerdict = function (ipoId) {
        return __awaiter(this, void 0, void 0, function () {
            var ipo, score, reasons, risks, verdict;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma_1.default.iPO.findUnique({
                            where: { id: ipoId },
                        })];
                    case 1:
                        ipo = _a.sent();
                        if (!ipo) {
                            throw new Error('IPO not found');
                        }
                        score = 0;
                        reasons = [];
                        risks = [];
                        // Positive signals
                        if (ipo.gmpPercent && Number(ipo.gmpPercent) > 20) {
                            score += 2;
                            reasons.push("Strong GMP of ".concat(ipo.gmpPercent.toFixed(1), "%"));
                        }
                        if (ipo.qibSubscription && Number(ipo.qibSubscription) > 3) {
                            score += 2;
                            reasons.push("QIB subscription ".concat(ipo.qibSubscription.toFixed(1), "x"));
                        }
                        if (ipo.revenue3yrCagr && Number(ipo.revenue3yrCagr) > 25) {
                            score += 1;
                            reasons.push("3-year revenue CAGR: ".concat(ipo.revenue3yrCagr, "%"));
                        }
                        if (ipo.promoterHoldingPercent && Number(ipo.promoterHoldingPercent) > 60) {
                            score += 1;
                            reasons.push("High promoter holding: ".concat(ipo.promoterHoldingPercent, "%"));
                        }
                        // Negative signals
                        if (ipo.debtToEquity && Number(ipo.debtToEquity) > 2) {
                            score -= 2;
                            risks.push("High debt-to-equity ratio: ".concat(ipo.debtToEquity));
                        }
                        if (ipo.profitMarginAvg && Number(ipo.profitMarginAvg) < 5) {
                            score -= 1;
                            risks.push("Low profit margins: ".concat(ipo.profitMarginAvg, "%"));
                        }
                        if (score >= 4) {
                            verdict = 'APPLY';
                        }
                        else if (score >= 2) {
                            verdict = 'NEUTRAL';
                        }
                        else {
                            verdict = 'AVOID';
                        }
                        // Update database
                        return [4 /*yield*/, prisma_1.default.iPO.update({
                                where: { id: ipoId },
                                data: {
                                    advisorVerdict: verdict,
                                    advisorScore: score,
                                    advisorFlags: risks,
                                },
                            })];
                    case 2:
                        // Update database
                        _a.sent();
                        return [2 /*return*/, { verdict: verdict, score: score, reasons: reasons, risks: risks }];
                }
            });
        });
    };
    /**
     * Get upcoming IPOs
     */
    IPOService.prototype.getUpcomingIPOs = function () {
        return __awaiter(this, void 0, void 0, function () {
            var now, ipos;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        now = new Date();
                        return [4 /*yield*/, prisma_1.default.iPO.findMany({
                                where: {
                                    openDate: { gt: now },
                                },
                                orderBy: { openDate: 'asc' },
                                take: 10,
                            })];
                    case 1:
                        ipos = _a.sent();
                        return [2 /*return*/, ipos];
                }
            });
        });
    };
    /**
     * Get open IPOs (currently accepting applications)
     */
    IPOService.prototype.getOpenIPOs = function () {
        return __awaiter(this, void 0, void 0, function () {
            var now, ipos;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        now = new Date();
                        return [4 /*yield*/, prisma_1.default.iPO.findMany({
                                where: {
                                    openDate: { lte: now },
                                    closeDate: { gte: now },
                                },
                                orderBy: { closeDate: 'asc' },
                            })];
                    case 1:
                        ipos = _a.sent();
                        return [2 /*return*/, ipos];
                }
            });
        });
    };
    return IPOService;
}());
exports.IPOService = IPOService;
exports.ipoService = new IPOService();
