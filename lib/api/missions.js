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
exports.toOfflineMission = toOfflineMission;
exports.getOfflineMissions = getOfflineMissions;
exports.getDailyMissions = getDailyMissions;
exports.getMissionProgress = getMissionProgress;
exports.completeMission = completeMission;
exports.listAdminMissions = listAdminMissions;
exports.createAdminMission = createAdminMission;
exports.updateAdminMission = updateAdminMission;
/**
 * Missions API
 * Offline and daily missions for parent-child activities
 */
var client_1 = require("./client");
// ─── Public helper ───────────────────────────────────────────────────────────
/**
 * Map backend MissionResponse + optional progress into the frontend OfflineMission type.
 */
function toOfflineMission(m, progress) {
    var _a, _b;
    return {
        id: m.id,
        title: m.title,
        description: m.description,
        targetWords: m.target_words,
        context: m.context,
        conversationPrompts: m.conversation_prompts,
        completed: (_a = progress === null || progress === void 0 ? void 0 : progress.completed) !== null && _a !== void 0 ? _a : false,
        completedDate: (progress === null || progress === void 0 ? void 0 : progress.completed_date)
            ? new Date(progress.completed_date)
            : undefined,
        parentNotes: (_b = progress === null || progress === void 0 ? void 0 : progress.parent_notes) !== null && _b !== void 0 ? _b : undefined,
    };
}
// ─── API functions ───────────────────────────────────────────────────────────
/**
 * Get offline (real-world activity) missions for a child.
 */
function getOfflineMissions(childId) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, (0, client_1.apiRequest)("/missions/offline/".concat(childId))];
        });
    });
}
/**
 * Get digital daily missions for a child.
 */
function getDailyMissions(childId) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, (0, client_1.apiRequest)("/missions/daily/".concat(childId))];
        });
    });
}
/**
 * Get completion progress for all missions for a child.
 */
function getMissionProgress(childId) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, (0, client_1.apiRequest)("/missions/".concat(childId, "/progress"))];
        });
    });
}
/**
 * Mark a mission as complete (or un-complete) for a child.
 */
function completeMission(missionId, childId, completed, parentNotes) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, (0, client_1.apiRequest)("/missions/".concat(missionId, "/complete/").concat(childId), {
                    method: "POST",
                    body: JSON.stringify({ completed: completed, parent_notes: parentNotes !== null && parentNotes !== void 0 ? parentNotes : null }),
                })];
        });
    });
}
/**
 * Get the full mission catalog for admin management.
 */
function listAdminMissions() {
    return __awaiter(this, arguments, void 0, function (includeInactive) {
        if (includeInactive === void 0) { includeInactive = true; }
        return __generator(this, function (_a) {
            return [2 /*return*/, (0, client_1.apiRequest)("/missions/admin/catalog?include_inactive=".concat(String(includeInactive)))];
        });
    });
}
/**
 * Create a mission catalog entry as an admin.
 */
function createAdminMission(data) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, (0, client_1.apiRequest)("/missions/admin/catalog", {
                    method: "POST",
                    body: JSON.stringify(data),
                })];
        });
    });
}
/**
 * Update a mission catalog entry as an admin.
 */
function updateAdminMission(missionId, data) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, (0, client_1.apiRequest)("/missions/admin/catalog/".concat(missionId), {
                    method: "PATCH",
                    body: JSON.stringify(data),
                })];
        });
    });
}
