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
var express_1 = require("express");
var express_validator_1 = require("express-validator");
var portfolio_1 = require("../services/portfolio");
var logger_1 = require("../utils/logger");
var router = (0, express_1.Router)();
var validateRequest = function (req, res, next) {
    var errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation Error', details: errors.array() });
    }
    next();
};
// Mock user ID for now (in production, get from JWT token)
var getUserId = function (req) {
    // TODO: Extract from JWT token
    return 1;
};
// ============================================
// GET /api/v1/portfolio
// Get all portfolios for current user
// ============================================
router.get('/', function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, portfolios, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                userId = getUserId(req);
                return [4 /*yield*/, portfolio_1.portfolioService.getUserPortfolios(userId)];
            case 1:
                portfolios = _a.sent();
                res.json({
                    data: portfolios,
                    count: portfolios.length,
                });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                logger_1.default.error('Error fetching portfolios', error_1);
                next(error_1);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// ============================================
// GET /api/v1/portfolio/:id
// Get single portfolio with P&L
// ============================================
router.get('/:id', [
    (0, express_validator_1.param)('id').isInt({ min: 1 }).toInt(),
    validateRequest,
], function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, portfolioId, portfolio, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                userId = getUserId(req);
                portfolioId = parseInt(req.params.id);
                return [4 /*yield*/, portfolio_1.portfolioService.getPortfolio(portfolioId, userId)];
            case 1:
                portfolio = _a.sent();
                if (!portfolio) {
                    return [2 /*return*/, res.status(404).json({
                            error: 'Portfolio Not Found',
                            message: "Portfolio with ID ".concat(portfolioId, " not found"),
                        })];
                }
                res.json({ data: portfolio });
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                logger_1.default.error('Error fetching portfolio', error_2);
                next(error_2);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// ============================================
// POST /api/v1/portfolio
// Create new portfolio
// ============================================
router.post('/', [
    (0, express_validator_1.body)('name').isString().isLength({ min: 1, max: 100 }).trim(),
    (0, express_validator_1.body)('description').optional().isString().isLength({ max: 500 }).trim(),
    validateRequest,
], function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, _a, name_1, description, portfolio, error_3;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                userId = getUserId(req);
                _a = req.body, name_1 = _a.name, description = _a.description;
                return [4 /*yield*/, portfolio_1.portfolioService.createPortfolio(userId, name_1, description)];
            case 1:
                portfolio = _b.sent();
                res.status(201).json({
                    data: portfolio,
                    message: 'Portfolio created successfully',
                });
                return [3 /*break*/, 3];
            case 2:
                error_3 = _b.sent();
                logger_1.default.error('Error creating portfolio', error_3);
                next(error_3);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// ============================================
// POST /api/v1/portfolio/:id/stocks
// Add stock to portfolio
// ============================================
router.post('/:id/stocks', [
    (0, express_validator_1.param)('id').isInt({ min: 1 }).toInt(),
    (0, express_validator_1.body)('symbol').isString().isLength({ min: 1, max: 20 }).toUpperCase().trim(),
    (0, express_validator_1.body)('quantity').isInt({ min: 1 }),
    (0, express_validator_1.body)('buyPrice').isFloat({ min: 0.01 }),
    (0, express_validator_1.body)('buyDate').isISO8601(),
    validateRequest,
], function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, portfolioId, _a, symbol, quantity, buyPrice, buyDate, error_4;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                userId = getUserId(req);
                portfolioId = parseInt(req.params.id);
                _a = req.body, symbol = _a.symbol, quantity = _a.quantity, buyPrice = _a.buyPrice, buyDate = _a.buyDate;
                return [4 /*yield*/, portfolio_1.portfolioService.addStock(portfolioId, userId, {
                        symbol: symbol,
                        quantity: quantity,
                        buyPrice: buyPrice,
                        buyDate: new Date(buyDate),
                    })];
            case 1:
                _b.sent();
                res.status(201).json({
                    success: true,
                    message: 'Stock added to portfolio',
                });
                return [3 /*break*/, 3];
            case 2:
                error_4 = _b.sent();
                if (error_4 instanceof Error) {
                    if (error_4.message === 'Portfolio not found') {
                        return [2 /*return*/, res.status(404).json({ error: 'Portfolio Not Found' })];
                    }
                    if (error_4.message === 'Stock not found') {
                        return [2 /*return*/, res.status(404).json({ error: 'Stock Not Found' })];
                    }
                    if (error_4.message === 'Stock already in portfolio') {
                        return [2 /*return*/, res.status(400).json({ error: 'Stock Already in Portfolio' })];
                    }
                }
                logger_1.default.error('Error adding stock to portfolio', error_4);
                next(error_4);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// ============================================
// DELETE /api/v1/portfolio/:id/stocks/:stockId
// Remove stock from portfolio
// ============================================
router.delete('/:id/stocks/:stockId', [
    (0, express_validator_1.param)('id').isInt({ min: 1 }).toInt(),
    (0, express_validator_1.param)('stockId').isInt({ min: 1 }).toInt(),
    validateRequest,
], function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, portfolioId, stockId, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                userId = getUserId(req);
                portfolioId = parseInt(req.params.id);
                stockId = parseInt(req.params.stockId);
                return [4 /*yield*/, portfolio_1.portfolioService.removeStock(portfolioId, stockId, userId)];
            case 1:
                _a.sent();
                res.json({
                    success: true,
                    message: 'Stock removed from portfolio',
                });
                return [3 /*break*/, 3];
            case 2:
                error_5 = _a.sent();
                if (error_5 instanceof Error && error_5.message === 'Portfolio not found') {
                    return [2 /*return*/, res.status(404).json({ error: 'Portfolio Not Found' })];
                }
                logger_1.default.error('Error removing stock from portfolio', error_5);
                next(error_5);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// ============================================
// DELETE /api/v1/portfolio/:id
// Delete portfolio
// ============================================
router.delete('/:id', [
    (0, express_validator_1.param)('id').isInt({ min: 1 }).toInt(),
    validateRequest,
], function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, portfolioId, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                userId = getUserId(req);
                portfolioId = parseInt(req.params.id);
                return [4 /*yield*/, portfolio_1.portfolioService.deletePortfolio(portfolioId, userId)];
            case 1:
                _a.sent();
                res.json({
                    success: true,
                    message: 'Portfolio deleted successfully',
                });
                return [3 /*break*/, 3];
            case 2:
                error_6 = _a.sent();
                if (error_6 instanceof Error && error_6.message === 'Portfolio not found') {
                    return [2 /*return*/, res.status(404).json({ error: 'Portfolio Not Found' })];
                }
                logger_1.default.error('Error deleting portfolio', error_6);
                next(error_6);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.default = router;
