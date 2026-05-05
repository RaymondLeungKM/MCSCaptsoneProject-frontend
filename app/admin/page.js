"use client";
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
exports.default = AdminPage;
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var CozyPageWrapper_1 = require("@/components/CozyPageWrapper");
var alert_1 = require("@/components/ui/alert");
var button_1 = require("@/components/ui/button");
var card_1 = require("@/components/ui/card");
var input_1 = require("@/components/ui/input");
var label_1 = require("@/components/ui/label");
var select_1 = require("@/components/ui/select");
var switch_1 = require("@/components/ui/switch");
var table_1 = require("@/components/ui/table");
var textarea_1 = require("@/components/ui/textarea");
var use_toast_1 = require("@/hooks/use-toast");
var auth_context_1 = require("@/lib/auth-context");
var missions_1 = require("@/lib/api/missions");
var utils_1 = require("@/lib/utils");
var STATUS_OPTIONS = [
    { value: "draft", label: "草稿" },
    { value: "published", label: "已發佈" },
    { value: "archived", label: "已封存" },
];
var SURFACE_OPTIONS = [
    { value: "parent", label: "家長端" },
    { value: "child", label: "小朋友端" },
    { value: "both", label: "雙端" },
];
var CONTEXT_OPTIONS = [
    { value: "general", label: "日常對話" },
    { value: "mealtime", label: "用餐時間" },
    { value: "bedtime", label: "睡前時光" },
    { value: "playtime", label: "遊戲時間" },
    { value: "outdoor", label: "戶外活動" },
    { value: "shopping", label: "購物情境" },
];
function createEmptyMissionForm() {
    return {
        id: null,
        slug: "",
        title: "",
        description: "",
        context: "general",
        isOffline: true,
        status: "draft",
        locale: "zh-HK",
        ageMin: "",
        ageMax: "",
        difficulty: "",
        surface: "parent",
        sortOrder: "0",
        selectionTags: "",
        targetWords: "",
        conversationPrompts: "",
        catalogMetadata: "",
        isActive: true,
    };
}
function missionToForm(mission) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    return {
        id: mission.id,
        slug: mission.slug,
        title: mission.title,
        description: mission.description,
        context: mission.context,
        isOffline: mission.is_offline,
        status: (_a = mission.status) !== null && _a !== void 0 ? _a : "draft",
        locale: (_b = mission.locale) !== null && _b !== void 0 ? _b : "zh-HK",
        ageMin: (_d = (_c = mission.age_min) === null || _c === void 0 ? void 0 : _c.toString()) !== null && _d !== void 0 ? _d : "",
        ageMax: (_f = (_e = mission.age_max) === null || _e === void 0 ? void 0 : _e.toString()) !== null && _f !== void 0 ? _f : "",
        difficulty: (_g = mission.difficulty) !== null && _g !== void 0 ? _g : "",
        surface: (_h = mission.surface) !== null && _h !== void 0 ? _h : "parent",
        sortOrder: String((_j = mission.sort_order) !== null && _j !== void 0 ? _j : 0),
        selectionTags: ((_k = mission.selection_tags) !== null && _k !== void 0 ? _k : []).join(", "),
        targetWords: ((_l = mission.target_words) !== null && _l !== void 0 ? _l : []).join("\n"),
        conversationPrompts: ((_m = mission.conversation_prompts) !== null && _m !== void 0 ? _m : []).join("\n"),
        catalogMetadata: mission.catalog_metadata
            ? JSON.stringify(mission.catalog_metadata, null, 2)
            : "",
        isActive: mission.is_active,
    };
}
function parseListInput(value) {
    return value
        .split(/\n|,/)
        .map(function (entry) { return entry.trim(); })
        .filter(Boolean);
}
function buildMissionPayload(form) {
    var parsedMetadata = null;
    if (form.catalogMetadata.trim()) {
        parsedMetadata = JSON.parse(form.catalogMetadata);
    }
    return {
        slug: form.slug.trim(),
        title: form.title.trim(),
        description: form.description.trim(),
        context: form.context,
        is_offline: form.isOffline,
        status: form.status,
        locale: form.locale.trim() || "zh-HK",
        age_min: form.ageMin ? Number(form.ageMin) : null,
        age_max: form.ageMax ? Number(form.ageMax) : null,
        difficulty: form.difficulty.trim() || null,
        surface: form.surface,
        sort_order: Number(form.sortOrder || 0),
        selection_tags: parseListInput(form.selectionTags),
        catalog_metadata: parsedMetadata,
        target_words: parseListInput(form.targetWords),
        conversation_prompts: parseListInput(form.conversationPrompts),
        is_active: form.isActive,
    };
}
function getStatusLabel(status) {
    var _a, _b;
    return (_b = (_a = STATUS_OPTIONS.find(function (option) { return option.value === status; })) === null || _a === void 0 ? void 0 : _a.label) !== null && _b !== void 0 ? _b : "草稿";
}
function getSurfaceLabel(surface) {
    var _a, _b;
    return (_b = (_a = SURFACE_OPTIONS.find(function (option) { return option.value === surface; })) === null || _a === void 0 ? void 0 : _a.label) !== null && _b !== void 0 ? _b : "家長端";
}
function AdminPage() {
    var _a = (0, auth_context_1.useAuth)(), user = _a.user, authLoading = _a.loading;
    var toast = (0, use_toast_1.useToast)().toast;
    var _b = (0, react_1.useState)([]), missions = _b[0], setMissions = _b[1];
    var _c = (0, react_1.useState)(null), selectedMissionId = _c[0], setSelectedMissionId = _c[1];
    var _d = (0, react_1.useState)(createEmptyMissionForm()), form = _d[0], setForm = _d[1];
    var _e = (0, react_1.useState)(false), loading = _e[0], setLoading = _e[1];
    var _f = (0, react_1.useState)(false), saving = _f[0], setSaving = _f[1];
    var _g = (0, react_1.useState)(null), error = _g[0], setError = _g[1];
    var _h = (0, react_1.useState)(""), searchQuery = _h[0], setSearchQuery = _h[1];
    var _j = (0, react_1.useState)("all"), statusFilter = _j[0], setStatusFilter = _j[1];
    (0, react_1.useEffect)(function () {
        if (!user || user.role !== "admin") {
            return;
        }
        void loadMissions();
    }, [user]);
    function loadMissions(nextSelectedMissionId) {
        return __awaiter(this, void 0, void 0, function () {
            var catalog, targetMissionId_1, selectedMission, loadError_1;
            var _a, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        setLoading(true);
                        setError(null);
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 3, 4, 5]);
                        return [4 /*yield*/, (0, missions_1.listAdminMissions)(true)];
                    case 2:
                        catalog = _d.sent();
                        setMissions(catalog);
                        targetMissionId_1 = (_c = (_a = nextSelectedMissionId !== null && nextSelectedMissionId !== void 0 ? nextSelectedMissionId : selectedMissionId) !== null && _a !== void 0 ? _a : (_b = catalog[0]) === null || _b === void 0 ? void 0 : _b.id) !== null && _c !== void 0 ? _c : null;
                        setSelectedMissionId(targetMissionId_1);
                        selectedMission = catalog.find(function (mission) { return mission.id === targetMissionId_1; });
                        setForm(selectedMission ? missionToForm(selectedMission) : createEmptyMissionForm());
                        return [3 /*break*/, 5];
                    case 3:
                        loadError_1 = _d.sent();
                        console.error("Failed to load admin missions:", loadError_1);
                        setError("未能載入任務目錄，請確認你正使用管理員帳號。 ");
                        return [3 /*break*/, 5];
                    case 4:
                        setLoading(false);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }
    function handleSelectMission(mission) {
        setSelectedMissionId(mission.id);
        setForm(missionToForm(mission));
    }
    function handleCreateNew() {
        setSelectedMissionId(null);
        setForm(createEmptyMissionForm());
    }
    function updateForm(key, value) {
        setForm(function (current) {
            var _a;
            return (__assign(__assign({}, current), (_a = {}, _a[key] = value, _a)));
        });
    }
    function handleSave() {
        return __awaiter(this, void 0, void 0, function () {
            var payload, savedMission, saveError_1, description;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        setSaving(true);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, 8, 9]);
                        payload = buildMissionPayload(form);
                        savedMission = void 0;
                        if (!selectedMissionId) return [3 /*break*/, 3];
                        return [4 /*yield*/, (0, missions_1.updateAdminMission)(selectedMissionId, payload)];
                    case 2:
                        savedMission = _a.sent();
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, (0, missions_1.createAdminMission)(payload)];
                    case 4:
                        savedMission = _a.sent();
                        _a.label = 5;
                    case 5: return [4 /*yield*/, loadMissions(savedMission.id)];
                    case 6:
                        _a.sent();
                        toast({
                            title: selectedMissionId ? "任務已更新" : "任務已建立",
                            description: "".concat(savedMission.title, " \u5DF2\u5132\u5B58\u5230\u4EFB\u52D9\u76EE\u9304\u3002"),
                        });
                        return [3 /*break*/, 9];
                    case 7:
                        saveError_1 = _a.sent();
                        console.error("Failed to save mission:", saveError_1);
                        description = saveError_1 instanceof Error && saveError_1.message
                            ? saveError_1.message
                            : "請檢查欄位內容後再試。";
                        toast({
                            title: "儲存失敗",
                            description: description,
                            variant: "destructive",
                        });
                        return [3 /*break*/, 9];
                    case 8:
                        setSaving(false);
                        return [7 /*endfinally*/];
                    case 9: return [2 /*return*/];
                }
            });
        });
    }
    var filteredMissions = missions.filter(function (mission) {
        var matchesStatus = statusFilter === "all" || mission.status === statusFilter;
        var matchesQuery = searchQuery.trim().length === 0 ||
            mission.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            mission.slug.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesQuery;
    });
    var draftCount = missions.filter(function (mission) { return mission.status === "draft"; }).length;
    var publishedCount = missions.filter(function (mission) { return mission.status === "published"; }).length;
    var archivedCount = missions.filter(function (mission) { return mission.status === "archived"; }).length;
    if (authLoading) {
        return (<CozyPageWrapper_1.default type="dashboard" hideThemeToggle>
        <div className="container mx-auto max-w-6xl px-4 py-8">
          <card_1.Card className="rounded-4xl border-white/60 bg-white/85 shadow-sm backdrop-blur-md">
            <card_1.CardContent className="flex items-center justify-center gap-3 py-12 text-slate-600">
              <lucide_react_1.Loader2 className="h-5 w-5 animate-spin"/>
              正在驗證管理員身份...
            </card_1.CardContent>
          </card_1.Card>
        </div>
      </CozyPageWrapper_1.default>);
    }
    if (!user) {
        return (<CozyPageWrapper_1.default type="dashboard" hideThemeToggle>
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <card_1.Card className="rounded-4xl border-white/60 bg-white/85 shadow-sm backdrop-blur-md">
            <card_1.CardContent className="space-y-4 py-10 text-center">
              <lucide_react_1.Lock className="mx-auto h-10 w-10 text-slate-400"/>
              <div className="space-y-2">
                <h1 className="text-2xl font-black text-slate-800">需要先登入</h1>
                <p className="text-sm font-medium text-slate-500">
                  `/admin` 僅供管理員使用，請先登入對應帳號。
                </p>
              </div>
            </card_1.CardContent>
          </card_1.Card>
        </div>
      </CozyPageWrapper_1.default>);
    }
    if (user.role !== "admin") {
        return (<CozyPageWrapper_1.default type="dashboard" hideThemeToggle>
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <card_1.Card className="rounded-4xl border-white/60 bg-white/85 shadow-sm backdrop-blur-md">
            <card_1.CardContent className="space-y-4 py-10 text-center">
              <lucide_react_1.Shield className="mx-auto h-10 w-10 text-rose-400"/>
              <div className="space-y-2">
                <h1 className="text-2xl font-black text-slate-800">沒有管理員權限</h1>
                <p className="text-sm font-medium text-slate-500">
                  目前帳號角色為 {user.role}，需要 `admin` 角色才能使用內容管理後台。
                </p>
              </div>
            </card_1.CardContent>
          </card_1.Card>
        </div>
      </CozyPageWrapper_1.default>);
    }
    return (<CozyPageWrapper_1.default type="dashboard" hideThemeToggle>
      <div className="container mx-auto max-w-7xl px-4 py-8 pb-24">
        <div className="mb-6 overflow-hidden rounded-[36px] border border-white/60 bg-white/85 shadow-sm backdrop-blur-md">
          <div className="bg-linear-to-r from-amber-100 via-orange-50 to-sky-100 px-6 py-6 md:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-black uppercase tracking-[0.24em] text-slate-500 shadow-sm">
                  <lucide_react_1.Shield className="h-3.5 w-3.5 text-orange-500"/>
                  Admin Console
                </div>
                <div>
                  <h1 className="text-3xl font-black tracking-tight text-slate-800 md:text-4xl">
                    內容管理後台
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm font-medium text-slate-600 md:text-base">
                    先從任務目錄開始管理，之後可在同一後台逐步加入精選中文詞彙、主題分類與其他內容編輯工具。
                  </p>
                </div>
              </div>

              <button_1.Button type="button" onClick={function () { return void loadMissions(); }} disabled={loading} className="h-11 rounded-full bg-slate-800 px-5 font-bold text-white hover:bg-slate-700">
                {loading ? (<lucide_react_1.Loader2 className="mr-2 h-4 w-4 animate-spin"/>) : (<lucide_react_1.RefreshCw className="mr-2 h-4 w-4"/>)}
                重新整理
              </button_1.Button>
            </div>
          </div>

          <div className="grid gap-4 border-t border-white/70 bg-white/70 px-6 py-5 md:grid-cols-3 md:px-8">
            <card_1.Card className="rounded-[28px] border-none bg-slate-900 text-white shadow-sm">
              <card_1.CardContent className="flex items-center justify-between py-6">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-white/60">
                    任務目錄
                  </p>
                  <p className="mt-3 text-3xl font-black">{missions.length}</p>
                </div>
                <lucide_react_1.Target className="h-10 w-10 text-amber-300"/>
              </card_1.CardContent>
            </card_1.Card>

            <card_1.Card className="rounded-[28px] border-none bg-emerald-50 shadow-sm">
              <card_1.CardContent className="flex items-center justify-between py-6">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-600/70">
                    已發佈
                  </p>
                  <p className="mt-3 text-3xl font-black text-emerald-700">{publishedCount}</p>
                </div>
                <lucide_react_1.Sparkles className="h-10 w-10 text-emerald-500"/>
              </card_1.CardContent>
            </card_1.Card>

            <card_1.Card className="rounded-[28px] border-none bg-amber-50 shadow-sm">
              <card_1.CardContent className="flex items-center justify-between py-6">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-600/70">
                    草稿 / 封存
                  </p>
                  <p className="mt-3 text-3xl font-black text-amber-700">{draftCount + archivedCount}</p>
                </div>
                <lucide_react_1.Tags className="h-10 w-10 text-amber-500"/>
              </card_1.CardContent>
            </card_1.Card>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <card_1.Card className="rounded-[28px] border-none bg-white/85 shadow-sm backdrop-blur-md">
            <card_1.CardHeader className="pb-0">
              <card_1.CardTitle className="flex items-center gap-3 text-slate-800">
                <lucide_react_1.Target className="h-5 w-5 text-orange-500"/>
                任務目錄
              </card_1.CardTitle>
              <card_1.CardDescription>已啟用，可建立與編輯 mission catalog。</card_1.CardDescription>
            </card_1.CardHeader>
          </card_1.Card>
          <card_1.Card className="rounded-[28px] border-dashed border-slate-200 bg-white/70 shadow-sm backdrop-blur-md">
            <card_1.CardHeader className="pb-0">
              <card_1.CardTitle className="flex items-center gap-3 text-slate-700">
                <lucide_react_1.BookOpen className="h-5 w-5 text-sky-500"/>
                精選中文詞彙
              </card_1.CardTitle>
              <card_1.CardDescription>下一步可接上現有 vocabulary API 做人工策展。</card_1.CardDescription>
            </card_1.CardHeader>
          </card_1.Card>
          <card_1.Card className="rounded-[28px] border-dashed border-slate-200 bg-white/70 shadow-sm backdrop-blur-md">
            <card_1.CardHeader className="pb-0">
              <card_1.CardTitle className="flex items-center gap-3 text-slate-700">
                <lucide_react_1.Tags className="h-5 w-5 text-violet-500"/>
                主題與分類
              </card_1.CardTitle>
              <card_1.CardDescription>之後可在這裡管理分類、標籤與內容排序規則。</card_1.CardDescription>
            </card_1.CardHeader>
          </card_1.Card>
        </div>

        {error && (<alert_1.Alert className="mb-6 rounded-3xl border-amber-200 bg-amber-50 text-amber-800">
            <alert_1.AlertDescription>{error}</alert_1.AlertDescription>
          </alert_1.Alert>)}

        <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
          <card_1.Card className="rounded-4xl border-none bg-white/85 shadow-sm backdrop-blur-md">
            <card_1.CardHeader className="space-y-4 border-b border-slate-100 pb-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <card_1.CardTitle className="text-2xl font-black text-slate-800">任務清單</card_1.CardTitle>
                  <card_1.CardDescription className="mt-1">
                    搜尋、檢視及選擇任務以進行編輯。
                  </card_1.CardDescription>
                </div>
                <button_1.Button type="button" onClick={handleCreateNew} className="h-11 rounded-full bg-orange-500 px-5 font-bold text-white hover:bg-orange-400">
                  <lucide_react_1.Plus className="mr-2 h-4 w-4"/>
                  新增任務
                </button_1.Button>
              </div>

              <div className="grid gap-3 md:grid-cols-[1fr,180px]">
                <input_1.Input value={searchQuery} onChange={function (event) { return setSearchQuery(event.target.value); }} placeholder="搜尋標題或 slug" className="h-11 rounded-2xl border-slate-200 bg-slate-50"/>
                <select_1.Select value={statusFilter} onValueChange={function (value) { return setStatusFilter(value); }}>
                  <select_1.SelectTrigger className="h-11 w-full rounded-2xl border-slate-200 bg-slate-50">
                    <select_1.SelectValue placeholder="全部狀態"/>
                  </select_1.SelectTrigger>
                  <select_1.SelectContent>
                    <select_1.SelectItem value="all">全部狀態</select_1.SelectItem>
                    {STATUS_OPTIONS.map(function (option) { return (<select_1.SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </select_1.SelectItem>); })}
                  </select_1.SelectContent>
                </select_1.Select>
              </div>
            </card_1.CardHeader>

            <card_1.CardContent className="pt-5">
              {loading ? (<div className="flex items-center justify-center gap-3 py-14 text-slate-500">
                  <lucide_react_1.Loader2 className="h-5 w-5 animate-spin"/>
                  正在載入任務目錄...
                </div>) : filteredMissions.length === 0 ? (<div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-slate-500">
                  目前沒有符合條件的任務。
                </div>) : (<div className="max-h-155 overflow-y-auto rounded-3xl border border-slate-100">
                  <table_1.Table>
                    <table_1.TableHeader>
                      <table_1.TableRow>
                        <table_1.TableHead>標題</table_1.TableHead>
                        <table_1.TableHead>狀態</table_1.TableHead>
                        <table_1.TableHead>介面</table_1.TableHead>
                        <table_1.TableHead>排序</table_1.TableHead>
                      </table_1.TableRow>
                    </table_1.TableHeader>
                    <table_1.TableBody>
                      {filteredMissions.map(function (mission) {
                var _a;
                var isSelected = mission.id === selectedMissionId;
                return (<table_1.TableRow key={mission.id} onClick={function () { return handleSelectMission(mission); }} className={(0, utils_1.cn)("cursor-pointer", isSelected && "bg-orange-50 hover:bg-orange-50")}>
                            <table_1.TableCell className="max-w-75 whitespace-normal py-4">
                              <div>
                                <p className="font-black text-slate-800">{mission.title}</p>
                                <p className="mt-1 text-xs font-medium text-slate-500">
                                  /{mission.slug}
                                </p>
                              </div>
                            </table_1.TableCell>
                            <table_1.TableCell>
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                                {getStatusLabel(mission.status)}
                              </span>
                            </table_1.TableCell>
                            <table_1.TableCell>
                              <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700">
                                {getSurfaceLabel(mission.surface)}
                              </span>
                            </table_1.TableCell>
                            <table_1.TableCell className="font-bold text-slate-600">
                              {(_a = mission.sort_order) !== null && _a !== void 0 ? _a : 0}
                            </table_1.TableCell>
                          </table_1.TableRow>);
            })}
                    </table_1.TableBody>
                  </table_1.Table>
                </div>)}
            </card_1.CardContent>
          </card_1.Card>

          <card_1.Card className="rounded-4xl border-none bg-white/85 shadow-sm backdrop-blur-md">
            <card_1.CardHeader className="space-y-2 border-b border-slate-100 pb-5">
              <card_1.CardTitle className="text-2xl font-black text-slate-800">
                {selectedMissionId ? "編輯任務" : "建立新任務"}
              </card_1.CardTitle>
              <card_1.CardDescription>
                編輯 catalog 欄位後即可影響後續任務分派與家長端顯示。
              </card_1.CardDescription>
            </card_1.CardHeader>

            <card_1.CardContent className="space-y-5 pt-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label_1.Label htmlFor="mission-title">標題</label_1.Label>
                  <input_1.Input id="mission-title" value={form.title} onChange={function (event) { return updateForm("title", event.target.value); }} className="h-11 rounded-2xl border-slate-200"/>
                </div>
                <div className="space-y-2">
                  <label_1.Label htmlFor="mission-slug">Slug</label_1.Label>
                  <input_1.Input id="mission-slug" value={form.slug} onChange={function (event) { return updateForm("slug", event.target.value); }} placeholder="mealtime-name-game" className="h-11 rounded-2xl border-slate-200"/>
                </div>
              </div>

              <div className="space-y-2">
                <label_1.Label htmlFor="mission-description">描述</label_1.Label>
                <textarea_1.Textarea id="mission-description" value={form.description} onChange={function (event) { return updateForm("description", event.target.value); }} className="min-h-24 rounded-2xl border-slate-200"/>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label_1.Label>情境</label_1.Label>
                  <select_1.Select value={form.context} onValueChange={function (value) { return updateForm("context", value); }}>
                    <select_1.SelectTrigger className="h-11 w-full rounded-2xl border-slate-200">
                      <select_1.SelectValue />
                    </select_1.SelectTrigger>
                    <select_1.SelectContent>
                      {CONTEXT_OPTIONS.map(function (option) { return (<select_1.SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </select_1.SelectItem>); })}
                    </select_1.SelectContent>
                  </select_1.Select>
                </div>
                <div className="space-y-2">
                  <label_1.Label>狀態</label_1.Label>
                  <select_1.Select value={form.status} onValueChange={function (value) { return updateForm("status", value); }}>
                    <select_1.SelectTrigger className="h-11 w-full rounded-2xl border-slate-200">
                      <select_1.SelectValue />
                    </select_1.SelectTrigger>
                    <select_1.SelectContent>
                      {STATUS_OPTIONS.map(function (option) { return (<select_1.SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </select_1.SelectItem>); })}
                    </select_1.SelectContent>
                  </select_1.Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label_1.Label>顯示介面</label_1.Label>
                  <select_1.Select value={form.surface} onValueChange={function (value) { return updateForm("surface", value); }}>
                    <select_1.SelectTrigger className="h-11 w-full rounded-2xl border-slate-200">
                      <select_1.SelectValue />
                    </select_1.SelectTrigger>
                    <select_1.SelectContent>
                      {SURFACE_OPTIONS.map(function (option) { return (<select_1.SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </select_1.SelectItem>); })}
                    </select_1.SelectContent>
                  </select_1.Select>
                </div>
                <div className="space-y-2">
                  <label_1.Label htmlFor="mission-locale">Locale</label_1.Label>
                  <input_1.Input id="mission-locale" value={form.locale} onChange={function (event) { return updateForm("locale", event.target.value); }} className="h-11 rounded-2xl border-slate-200"/>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label_1.Label htmlFor="age-min">最低年齡</label_1.Label>
                  <input_1.Input id="age-min" type="number" min={0} value={form.ageMin} onChange={function (event) { return updateForm("ageMin", event.target.value); }} className="h-11 rounded-2xl border-slate-200"/>
                </div>
                <div className="space-y-2">
                  <label_1.Label htmlFor="age-max">最高年齡</label_1.Label>
                  <input_1.Input id="age-max" type="number" min={0} value={form.ageMax} onChange={function (event) { return updateForm("ageMax", event.target.value); }} className="h-11 rounded-2xl border-slate-200"/>
                </div>
                <div className="space-y-2">
                  <label_1.Label htmlFor="sort-order">排序</label_1.Label>
                  <input_1.Input id="sort-order" type="number" value={form.sortOrder} onChange={function (event) { return updateForm("sortOrder", event.target.value); }} className="h-11 rounded-2xl border-slate-200"/>
                </div>
              </div>

              <div className="space-y-2">
                <label_1.Label htmlFor="difficulty">難度標籤</label_1.Label>
                <input_1.Input id="difficulty" value={form.difficulty} onChange={function (event) { return updateForm("difficulty", event.target.value); }} placeholder="easy / medium / hard" className="h-11 rounded-2xl border-slate-200"/>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label_1.Label htmlFor="target-words">目標詞彙</label_1.Label>
                  <textarea_1.Textarea id="target-words" value={form.targetWords} onChange={function (event) { return updateForm("targetWords", event.target.value); }} placeholder="每行一個詞彙，或使用逗號分隔" className="min-h-28 rounded-2xl border-slate-200"/>
                </div>
                <div className="space-y-2">
                  <label_1.Label htmlFor="conversation-prompts">對話提示</label_1.Label>
                  <textarea_1.Textarea id="conversation-prompts" value={form.conversationPrompts} onChange={function (event) { return updateForm("conversationPrompts", event.target.value); }} placeholder="每行一條提示句" className="min-h-28 rounded-2xl border-slate-200"/>
                </div>
              </div>

              <div className="space-y-2">
                <label_1.Label htmlFor="selection-tags">選擇標籤</label_1.Label>
                <input_1.Input id="selection-tags" value={form.selectionTags} onChange={function (event) { return updateForm("selectionTags", event.target.value); }} placeholder="例如: family, routine, speaking" className="h-11 rounded-2xl border-slate-200"/>
              </div>

              <div className="space-y-2">
                <label_1.Label htmlFor="catalog-metadata">Catalog Metadata JSON</label_1.Label>
                <textarea_1.Textarea id="catalog-metadata" value={form.catalogMetadata} onChange={function (event) { return updateForm("catalogMetadata", event.target.value); }} placeholder='{"theme": "family", "estimated_minutes": 5}' className="min-h-28 rounded-2xl border-slate-200 font-mono text-sm"/>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div>
                    <p className="font-bold text-slate-700">離線任務</p>
                    <p className="text-xs text-slate-500">家長生活任務或實境活動</p>
                  </div>
                  <switch_1.Switch checked={form.isOffline} onCheckedChange={function (checked) { return updateForm("isOffline", checked); }}/>
                </div>

                <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div>
                    <p className="font-bold text-slate-700">啟用任務</p>
                    <p className="text-xs text-slate-500">停用後不再參與分派與顯示</p>
                  </div>
                  <switch_1.Switch checked={form.isActive} onCheckedChange={function (checked) { return updateForm("isActive", checked); }}/>
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 md:flex-row md:justify-end">
                <button_1.Button type="button" onClick={handleCreateNew} className="h-11 rounded-full bg-slate-100 px-5 font-bold text-slate-700 hover:bg-slate-200">
                  <lucide_react_1.Plus className="mr-2 h-4 w-4"/>
                  清空表單
                </button_1.Button>
                <button_1.Button type="button" onClick={function () { return void handleSave(); }} disabled={saving} className="h-11 rounded-full bg-emerald-500 px-5 font-bold text-white hover:bg-emerald-400">
                  {saving ? (<lucide_react_1.Loader2 className="mr-2 h-4 w-4 animate-spin"/>) : (<lucide_react_1.Save className="mr-2 h-4 w-4"/>)}
                  {selectedMissionId ? "儲存修改" : "建立任務"}
                </button_1.Button>
              </div>
            </card_1.CardContent>
          </card_1.Card>
        </div>
      </div>
    </CozyPageWrapper_1.default>);
}
