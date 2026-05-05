"use strict";
/**
 * API Client Configuration
 * Handles all communication with FastAPI backend with retry logic and error handling
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.API_BASE_URL = exports.APIError = void 0;
exports.getAuthToken = getAuthToken;
exports.setAuthToken = setAuthToken;
exports.clearAuthToken = clearAuthToken;
exports.apiRequest = apiRequest;
var API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
exports.API_BASE_URL = API_BASE_URL;
// API Error class for better error handling
var APIError = /** @class */ (function (_super) {
    __extends(APIError, _super);
    function APIError(status, detail, message) {
        var _this = _super.call(this, message || detail) || this;
        _this.status = status;
        _this.detail = detail;
        _this.name = "APIError";
        return _this;
    }
    return APIError;
}(Error));
exports.APIError = APIError;
// Retry configuration
var RETRY_CONFIG = {
    maxAttempts: 3,
    initialDelayMs: 1000,
    maxDelayMs: 5000,
    backoffMultiplier: 2,
    retryableStatuses: [408, 429, 500, 502, 503, 504], // Timeout, Too Many Requests, Server errors
};
/**
 * Get stored auth token
 */
function getAuthToken() {
    if (typeof window === "undefined")
        return null;
    return localStorage.getItem("auth_token");
}
/**
 * Set auth token
 */
function setAuthToken(token) {
    if (typeof window === "undefined")
        return;
    localStorage.setItem("auth_token", token);
    logDebug("Token stored");
}
/**
 * Clear auth token
 */
function clearAuthToken() {
    if (typeof window === "undefined")
        return;
    localStorage.removeItem("auth_token");
    logDebug("Token cleared");
}
/**
 * Simple debug logging
 */
function logDebug(message, data) {
    var isDev = process.env.NODE_ENV === "development";
    if (isDev) {
        console.log("[API] ".concat(message), data || "");
    }
}
/**
 * Sleep helper for retry delays
 */
function sleep(ms) {
    return new Promise(function (resolve) { return setTimeout(resolve, ms); });
}
/**
 * Parse error response from server
 */
function parseErrorResponse(response) {
    return __awaiter(this, void 0, void 0, function () {
        var contentType, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    contentType = response.headers.get("content-type");
                    if (!(contentType === null || contentType === void 0 ? void 0 : contentType.includes("application/json"))) return [3 /*break*/, 4];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, response.json()];
                case 2: return [2 /*return*/, _b.sent()];
                case 3:
                    _a = _b.sent();
                    return [2 /*return*/, { detail: "HTTP ".concat(response.status, ": ").concat(response.statusText) }];
                case 4: return [2 /*return*/, { detail: "HTTP ".concat(response.status, ": ").concat(response.statusText) }];
            }
        });
    });
}
/**
 * Make an authenticated API request with retry logic
 */
function apiRequest(endpoint_1) {
    return __awaiter(this, arguments, void 0, function (endpoint, options) {
        var token, lastError, delayMs, attempt, headers, response, errorData, currentPath, result, error_1;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    token = getAuthToken();
                    lastError = null;
                    delayMs = RETRY_CONFIG.initialDelayMs;
                    attempt = 1;
                    _a.label = 1;
                case 1:
                    if (!(attempt <= RETRY_CONFIG.maxAttempts)) return [3 /*break*/, 18];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 9, , 17]);
                    headers = __assign({ "Content-Type": "application/json" }, options.headers);
                    if (token) {
                        headers["Authorization"] = "Bearer ".concat(token);
                    }
                    logDebug("Request [".concat(attempt, "/").concat(RETRY_CONFIG.maxAttempts, "]: ").concat(options.method || "GET", " ").concat(endpoint));
                    return [4 /*yield*/, fetch("".concat(API_BASE_URL).concat(endpoint), __assign(__assign({}, options), { headers: headers }))];
                case 3:
                    response = _a.sent();
                    if (!!response.ok) return [3 /*break*/, 7];
                    return [4 /*yield*/, parseErrorResponse(response)];
                case 4:
                    errorData = _a.sent();
                    // Handle 401 Unauthorized
                    if (response.status === 401) {
                        logDebug("Unauthorized (401) - clearing token");
                        clearAuthToken();
                        if (typeof window !== "undefined") {
                            currentPath = window.location.pathname;
                            if (!currentPath.includes("/login") &&
                                !currentPath.includes("/register")) {
                                window.location.href = "/login";
                            }
                        }
                        throw new APIError(response.status, errorData.detail || "Unauthorized", "Your session has expired. Please login again.");
                    }
                    if (!(RETRY_CONFIG.retryableStatuses.includes(response.status) &&
                        attempt < RETRY_CONFIG.maxAttempts)) return [3 /*break*/, 6];
                    logDebug("Retryable error ".concat(response.status, " - retrying in ").concat(delayMs, "ms"));
                    lastError = new APIError(response.status, errorData.detail || response.statusText);
                    return [4 /*yield*/, sleep(delayMs)];
                case 5:
                    _a.sent();
                    delayMs = Math.min(delayMs * RETRY_CONFIG.backoffMultiplier, RETRY_CONFIG.maxDelayMs);
                    return [3 /*break*/, 17];
                case 6: 
                // Non-retryable error
                throw new APIError(response.status, errorData.detail || response.statusText);
                case 7: return [4 /*yield*/, response.json()];
                case 8:
                    result = _a.sent();
                    logDebug("Response successful: ".concat(endpoint));
                    return [2 /*return*/, result];
                case 9:
                    error_1 = _a.sent();
                    if (!(error_1 instanceof APIError)) return [3 /*break*/, 12];
                    lastError = error_1;
                    // Don't retry on 401, 403, 422 (validation)
                    if ([401, 403, 422].includes(error_1.status)) {
                        throw error_1;
                    }
                    if (!(attempt < RETRY_CONFIG.maxAttempts)) return [3 /*break*/, 11];
                    logDebug("Retrying... (".concat(attempt, "/").concat(RETRY_CONFIG.maxAttempts, ")"));
                    return [4 /*yield*/, sleep(delayMs)];
                case 10:
                    _a.sent();
                    delayMs = Math.min(delayMs * RETRY_CONFIG.backoffMultiplier, RETRY_CONFIG.maxDelayMs);
                    return [3 /*break*/, 17];
                case 11: return [3 /*break*/, 16];
                case 12:
                    if (!(error_1 instanceof TypeError)) return [3 /*break*/, 15];
                    // Network error
                    lastError = new Error("Network error: Unable to reach server. Check your connection.");
                    logDebug("Network error on attempt ".concat(attempt, ":"), error_1.message);
                    if (!(attempt < RETRY_CONFIG.maxAttempts)) return [3 /*break*/, 14];
                    return [4 /*yield*/, sleep(delayMs)];
                case 13:
                    _a.sent();
                    delayMs = Math.min(delayMs * RETRY_CONFIG.backoffMultiplier, RETRY_CONFIG.maxDelayMs);
                    return [3 /*break*/, 17];
                case 14: return [3 /*break*/, 16];
                case 15:
                    lastError = error_1;
                    _a.label = 16;
                case 16: throw lastError;
                case 17:
                    attempt++;
                    return [3 /*break*/, 1];
                case 18: throw (lastError || new Error("Failed after ".concat(RETRY_CONFIG.maxAttempts, " attempts")));
            }
        });
    });
}
