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
exports.cache = void 0;
var ioredis_1 = require("ioredis");
var config_1 = require("../config");
console.log('Connecting to Redis at:', config_1.config.redis.url);
var redis = new ioredis_1.default(config_1.config.redis.url, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    retryStrategy: function (times) {
        var delay = Math.min(times * 50, 2000);
        return delay;
    },
    reconnectOnError: function (err) {
        var targetError = 'READONLY';
        if (err.message.includes(targetError)) {
            // Only reconnect when the error contains "READONLY"
            return true;
        }
        return false;
    },
});
redis.on('connect', function () {
    console.log('✅ Redis connected');
});
redis.on('error', function (err) {
    console.error('❌ Redis connection error:', err);
});
redis.on('ready', function () {
    console.log('✅ Redis ready to accept commands');
});
// Graceful shutdown
process.on('SIGTERM', function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, redis.quit()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
// Cache utility functions
exports.cache = {
    /**
     * Get cached value
     */
    get: function (key) {
        return __awaiter(this, void 0, void 0, function () {
            var value;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, redis.get(key)];
                    case 1:
                        value = _a.sent();
                        if (!value)
                            return [2 /*return*/, null];
                        try {
                            return [2 /*return*/, JSON.parse(value)];
                        }
                        catch (_b) {
                            return [2 /*return*/, value];
                        }
                        return [2 /*return*/];
                }
            });
        });
    },
    /**
     * Set cache with TTL
     */
    set: function (key, value, ttl) {
        return __awaiter(this, void 0, void 0, function () {
            var serialized, ttlSeconds;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        serialized = typeof value === 'string' ? value : JSON.stringify(value);
                        ttlSeconds = ttl || config_1.config.redis.cacheTtl;
                        return [4 /*yield*/, redis.setex(key, ttlSeconds, serialized)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    },
    /**
     * Delete cached value
     */
    del: function (key) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, redis.del(key)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    },
    /**
     * Delete multiple keys by pattern
     */
    delPattern: function (pattern) {
        return __awaiter(this, void 0, void 0, function () {
            var keys;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, redis.keys(pattern)];
                    case 1:
                        keys = _a.sent();
                        if (!(keys.length > 0)) return [3 /*break*/, 3];
                        return [4 /*yield*/, redis.del.apply(redis, keys)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    },
    /**
     * Check if key exists
     */
    exists: function (key) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, redis.exists(key)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result === 1];
                }
            });
        });
    },
    /**
     * Increment counter
     */
    incr: function (key, ttl) {
        return __awaiter(this, void 0, void 0, function () {
            var value;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, redis.incr(key)];
                    case 1:
                        value = _a.sent();
                        if (!(ttl && value === 1)) return [3 /*break*/, 3];
                        return [4 /*yield*/, redis.expire(key, ttl)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [2 /*return*/, value];
                }
            });
        });
    },
    /**
     * Get multiple values at once
     */
    mget: function (keys) {
        return __awaiter(this, void 0, void 0, function () {
            var values;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (keys.length === 0)
                            return [2 /*return*/, []];
                        return [4 /*yield*/, redis.mget.apply(redis, keys)];
                    case 1:
                        values = _a.sent();
                        return [2 /*return*/, values.map(function (value) {
                                if (!value)
                                    return null;
                                try {
                                    return JSON.parse(value);
                                }
                                catch (_a) {
                                    return value;
                                }
                            })];
                }
            });
        });
    },
    /**
     * Set multiple values at once
     */
    mset: function (items, ttl) {
        return __awaiter(this, void 0, void 0, function () {
            var pipeline;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        pipeline = redis.pipeline();
                        Object.entries(items).forEach(function (_a) {
                            var key = _a[0], value = _a[1];
                            var serialized = typeof value === 'string' ? value : JSON.stringify(value);
                            if (ttl) {
                                pipeline.setex(key, ttl, serialized);
                            }
                            else {
                                pipeline.set(key, serialized);
                            }
                        });
                        return [4 /*yield*/, pipeline.exec()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    },
};
exports.default = redis;
