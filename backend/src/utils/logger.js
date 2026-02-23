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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = void 0;
var winston_1 = require("winston");
var config_1 = require("../config");
var _a = winston_1.default.format, combine = _a.combine, timestamp = _a.timestamp, printf = _a.printf, colorize = _a.colorize, errors = _a.errors;
// Custom log format
var logFormat = printf(function (_a) {
    var level = _a.level, message = _a.message, timestamp = _a.timestamp, stack = _a.stack, metadata = __rest(_a, ["level", "message", "timestamp", "stack"]);
    var msg = "".concat(timestamp, " [").concat(level, "]: ").concat(message);
    if (Object.keys(metadata).length > 0) {
        msg += " ".concat(JSON.stringify(metadata));
    }
    if (stack) {
        msg += "\n".concat(stack);
    }
    return msg;
});
// Create logger instance
var logger = winston_1.default.createLogger({
    level: config_1.config.monitoring.logLevel,
    format: combine(errors({ stack: true }), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.json()),
    defaultMeta: {
        service: config_1.config.appName,
        env: config_1.config.env,
        version: config_1.config.appVersion,
    },
    transports: [
        // Console transport
        new winston_1.default.transports.Console({
            format: combine(colorize(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat),
        }),
        // Error log file
        new winston_1.default.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        // Combined log file
        new winston_1.default.transports.File({
            filename: 'logs/combined.log',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
    ],
    exceptionHandlers: [
        new winston_1.default.transports.File({ filename: 'logs/exceptions.log' }),
    ],
    rejectionHandlers: [
        new winston_1.default.transports.File({ filename: 'logs/rejections.log' }),
    ],
});
// Add Datadog transport in production (if configured)
if (config_1.config.env === 'production' && config_1.config.monitoring.datadog.apiKey) {
    logger.add(new winston_1.default.transports.Http({
        host: 'http-intake.logs.datadoghq.com',
        path: "/api/v2/logs?dd-api-key=".concat(config_1.config.monitoring.datadog.apiKey, "&ddsource=nodejs&service=").concat(config_1.config.appName),
        ssl: true,
    }));
}
// Helper methods
exports.log = {
    info: function (message, meta) { return logger.info(message, meta); },
    error: function (message, error, meta) {
        if (error instanceof Error) {
            logger.error(message, __assign({ error: error.message, stack: error.stack }, meta));
        }
        else {
            logger.error(message, __assign({ error: error }, meta));
        }
    },
    warn: function (message, meta) { return logger.warn(message, meta); },
    debug: function (message, meta) { return logger.debug(message, meta); },
};
exports.default = logger;
