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
var ipo_1 = require("../services/ipo");
var logger_1 = require("../utils/logger");
var router = (0, express_1.Router)();
var validateRequest = function (req, res, next) {
    var errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation Error', details: errors.array() });
    }
    next();
};
// ============================================
// GET /api/v1/ipos
// List all IPOs with filtering
// ============================================
router.get('/', [
    (0, express_validator_1.query)('status').optional().isIn(['UPCOMING', 'OPEN', 'CLOSED', 'LISTED']),
    validateRequest,
], function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var status_1, ipos, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                status_1 = req.query.status;
                return [4 /*yield*/, ipo_1.ipoService.getIPOs(status_1)];
            case 1:
                ipos = _a.sent();
                res.json({
                    data: ipos,
                    count: ipos.length,
                    meta: {
                        status: status_1 || 'all',
                    },
                });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                logger_1.default.error('Error fetching IPOs', error_1);
                next(error_1);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// GET /api/v1/ipos/upcoming
router.get('/upcoming', function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var ipos, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, ipo_1.ipoService.getUpcomingIPOs()];
            case 1:
                ipos = _a.sent();
                res.json({ data: ipos, count: ipos.length });
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                logger_1.default.error('Error fetching upcoming IPOs', error_2);
                next(error_2);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// GET /api/v1/ipos/open
router.get('/open', function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var ipos, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, ipo_1.ipoService.getOpenIPOs()];
            case 1:
                ipos = _a.sent();
                res.json({ data: ipos, count: ipos.length });
                return [3 /*break*/, 3];
            case 2:
                error_3 = _a.sent();
                logger_1.default.error('Error fetching open IPOs', error_3);
                next(error_3);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// GET /api/v1/ipos/:id
router.get('/:id', [
    (0, express_validator_1.param)('id').isInt({ min: 1 }).toInt(),
    validateRequest,
], function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var id, ipo, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                id = parseInt(req.params.id);
                return [4 /*yield*/, ipo_1.ipoService.getIPOById(id)];
            case 1:
                ipo = _a.sent();
                if (!ipo) {
                    return [2 /*return*/, res.status(404).json({
                            error: 'IPO Not Found',
                            message: "IPO with ID ".concat(id, " not found"),
                        })];
                }
                res.json({ data: ipo });
                return [3 /*break*/, 3];
            case 2:
                error_4 = _a.sent();
                logger_1.default.error('Error fetching IPO details', error_4);
                next(error_4);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// POST /api/v1/ipos/:id/advisor
router.post('/:id/advisor', [
    (0, express_validator_1.param)('id').isInt({ min: 1 }).toInt(),
    validateRequest,
], function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var id, result, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                id = parseInt(req.params.id);
                return [4 /*yield*/, ipo_1.ipoService.calculateAdvisorVerdict(id)];
            case 1:
                result = _a.sent();
                res.json({
                    data: result,
                    meta: {
                        ipoId: id,
                        timestamp: new Date().toISOString(),
                    },
                });
                return [3 /*break*/, 3];
            case 2:
                error_5 = _a.sent();
                if (error_5 instanceof Error && error_5.message === 'IPO not found') {
                    return [2 /*return*/, res.status(404).json({ error: 'IPO Not Found' })];
                }
                logger_1.default.error('Error calculating IPO advisor verdict', error_5);
                next(error_5);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
//export default router;
//);
// ============================================
// GET /api/v1/ipos/upcoming
// Get upcoming IPOs
// ============================================
router.get('/upcoming', function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var ipos, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, ipo_1.ipoService.getUpcomingIPOs()];
            case 1:
                ipos = _a.sent();
                res.json({ data: ipos, count: ipos.length });
                return [3 /*break*/, 3];
            case 2:
                error_6 = _a.sent();
                logger_1.default.error('Error fetching upcoming IPOs', error_6);
                next(error_6);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// ============================================
// GET /api/v1/ipos/open
// Get currently open IPOs
// ============================================
router.get('/open', function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var ipos, error_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, ipo_1.ipoService.getOpenIPOs()];
            case 1:
                ipos = _a.sent();
                res.json({ data: ipos, count: ipos.length });
                return [3 /*break*/, 3];
            case 2:
                error_7 = _a.sent();
                logger_1.default.error('Error fetching open IPOs', error_7);
                next(error_7);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// ============================================
// GET /api/v1/ipos/:id
// Get IPO details
// ============================================
router.get('/:id', [
    (0, express_validator_1.param)('id').isInt().toInt(),
    validateRequest,
], function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var id, ipo, error_8;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                id = parseInt(req.params.id);
                return [4 /*yield*/, ipo_1.ipoService.getIPOById(id)];
            case 1:
                ipo = _a.sent();
                if (!ipo) {
                    return [2 /*return*/, res.status(404).json({
                            error: 'IPO Not Found',
                            message: "IPO with ID ".concat(id, " not found"),
                        })];
                }
                res.json({ data: ipo });
                return [3 /*break*/, 3];
            case 2:
                error_8 = _a.sent();
                logger_1.default.error('Error fetching IPO details', error_8);
                next(error_8);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// ============================================
// POST /api/v1/ipos/:id/advisor
// Get IPO investment recommendation
// ============================================
router.post('/:id/advisor', [
    (0, express_validator_1.param)('id').isInt().toInt(),
    validateRequest,
], function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var id, result, error_9;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                id = parseInt(req.params.id);
                return [4 /*yield*/, ipo_1.ipoService.calculateAdvisorVerdict(id)];
            case 1:
                result = _a.sent();
                res.json({
                    data: result,
                    timestamp: new Date(),
                });
                return [3 /*break*/, 3];
            case 2:
                error_9 = _a.sent();
                if (error_9 instanceof Error && error_9.message === 'IPO not found') {
                    return [2 /*return*/, res.status(404).json({ error: 'IPO Not Found' })];
                }
                logger_1.default.error('Error calculating IPO advisor verdict', error_9);
                next(error_9);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// ============================================
// POST /api/v1/ipos/:id/update-gmp
// Update GMP data (admin only in production)
// ============================================
router.post('/:id/update-gmp', [
    (0, express_validator_1.param)('id').isInt().toInt(),
    validateRequest,
], function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var id, error_10;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                id = parseInt(req.params.id);
                return [4 /*yield*/, ipo_1.ipoService.updateGMPData(id)];
            case 1:
                _a.sent();
                res.json({
                    success: true,
                    message: 'GMP data updated successfully',
                });
                return [3 /*break*/, 3];
            case 2:
                error_10 = _a.sent();
                logger_1.default.error('Error updating GMP data', error_10);
                next(error_10);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// ============================================
// POST /api/v1/ipos/:id/update-subscription
// Update subscription data
// ============================================
router.post('/:id/update-subscription', [
    (0, express_validator_1.param)('id').isInt().toInt(),
    (0, express_validator_1.body)('retailSubscription').isFloat({ min: 0 }),
    (0, express_validator_1.body)('hniSubscription').isFloat({ min: 0 }),
    (0, express_validator_1.body)('qibSubscription').isFloat({ min: 0 }),
    validateRequest,
], function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var id, _a, retailSubscription, hniSubscription, qibSubscription, error_11;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                id = parseInt(req.params.id);
                _a = req.body, retailSubscription = _a.retailSubscription, hniSubscription = _a.hniSubscription, qibSubscription = _a.qibSubscription;
                return [4 /*yield*/, ipo_1.ipoService.updateSubscriptionData(id, {
                        retailSubscription: retailSubscription,
                        hniSubscription: hniSubscription,
                        qibSubscription: qibSubscription,
                    })];
            case 1:
                _b.sent();
                res.json({
                    success: true,
                    message: 'Subscription data updated successfully',
                });
                return [3 /*break*/, 3];
            case 2:
                error_11 = _b.sent();
                logger_1.default.error('Error updating subscription data', error_11);
                next(error_11);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.default = router;
