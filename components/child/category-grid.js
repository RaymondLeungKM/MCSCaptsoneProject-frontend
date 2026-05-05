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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryGrid = CategoryGrid;
var react_1 = require("react");
var utils_1 = require("@/lib/utils");
var language_utils_1 = require("@/lib/language-utils");
var lucide_react_1 = require("lucide-react");
var vocabulary_1 = require("@/lib/api/vocabulary");
var use_word_audio_1 = require("@/hooks/use-word-audio");
var word_detail_modal_1 = require("@/components/modals/word-detail-modal");
// 🎨 Vivid Pastel Colors for the Cards
var getColorClass = function (color) {
    var c = (color === null || color === void 0 ? void 0 : color.toLowerCase()) || "blue";
    var map = {
        red: "bg-red-100 text-red-600 border-red-300 hover:bg-red-200 hover:scale-105",
        blue: "bg-blue-100 text-blue-600 border-blue-300 hover:bg-blue-200 hover:scale-105",
        green: "bg-green-100 text-green-600 border-green-300 hover:bg-green-200 hover:scale-105",
        yellow: "bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200 hover:scale-105",
        purple: "bg-purple-100 text-purple-600 border-purple-300 hover:bg-purple-200 hover:scale-105",
        orange: "bg-orange-100 text-orange-600 border-orange-300 hover:bg-orange-200 hover:scale-105",
        pink: "bg-pink-100 text-pink-600 border-pink-300 hover:bg-pink-200 hover:scale-105",
        teal: "bg-teal-100 text-teal-600 border-teal-300 hover:bg-teal-200 hover:scale-105",
    };
    return map[c] || map.blue;
};
// Resolve an image value: if it looks like a URL, return it; otherwise treat as emoji
var isImageUrl = function (value) {
    return !!value && (value.startsWith("http") || value.startsWith("/"));
};
function CategoryGrid(_a) {
    var categories = _a.categories, onCategorySelect = _a.onCategorySelect, onWordSelect = _a.onWordSelect, _b = _a.languagePreference, languagePreference = _b === void 0 ? "cantonese" : _b, childId = _a.childId, onWordLearned = _a.onWordLearned;
    var _c = (0, react_1.useState)(null), selectedCategory = _c[0], setSelectedCategory = _c[1];
    var _d = (0, react_1.useState)([]), categoryWords = _d[0], setCategoryWords = _d[1];
    var _e = (0, react_1.useState)(false), isLoadingWords = _e[0], setIsLoadingWords = _e[1];
    var _f = (0, react_1.useState)(null), wordsError = _f[0], setWordsError = _f[1];
    var _g = (0, react_1.useState)(null), selectedWord = _g[0], setSelectedWord = _g[1];
    var _h = (0, use_word_audio_1.useWordAudio)(), playWord = _h.playWord, isPlaying = _h.isPlaying, isAudioLoading = _h.isLoading;
    // Fetch words (with progress when childId is available) whenever a category is selected
    (0, react_1.useEffect)(function () {
        if (!selectedCategory)
            return;
        var cancelled = false;
        setIsLoadingWords(true);
        setWordsError(null);
        setCategoryWords([]);
        // For "My Collection" category, only fetch words uploaded by this specific child
        var isMyCollection = selectedCategory.name === "My Collection";
        var fetchFn = childId
            ? (0, vocabulary_1.getWordsWithProgress)(childId, selectedCategory.id, isMyCollection).then(function (responses) { return responses.map(function (r) { return (0, vocabulary_1.toWord)(r, r.progress); }); })
            : (0, vocabulary_1.getWords)({ category: selectedCategory.id, limit: 50 }).then(function (responses) { return responses.map(function (r) { return (0, vocabulary_1.toWord)(r); }); });
        fetchFn
            .then(function (words) {
            if (!cancelled)
                setCategoryWords(words);
        })
            .catch(function () {
            if (!cancelled)
                setWordsError("載入詞語失敗，請稍後再試。");
        })
            .finally(function () {
            if (!cancelled)
                setIsLoadingWords(false);
        });
        return function () {
            cancelled = true;
        };
    }, [selectedCategory, languagePreference, childId]);
    // Called by WordDetailModal when progress changes — update the local word's state immediately
    var handleProgressUpdate = function (wordId, mastered, exposureCount) {
        setCategoryWords(function (prev) {
            return prev.map(function (w) {
                return w.id === wordId ? __assign(__assign({}, w), { mastered: mastered, exposureCount: exposureCount }) : w;
            });
        });
        // Refresh profile stats on any progress update (today_progress + mastered count)
        onWordLearned === null || onWordLearned === void 0 ? void 0 : onWordLearned();
    };
    var handleCategoryClick = function (category) {
        if (onCategorySelect) {
            // External handler provided (e.g., navigate to learn tab)
            onCategorySelect(category);
        }
        else {
            // Internal mode: show words inline
            setSelectedCategory(category);
        }
    };
    var handleWordActivate = function (word) {
        if (onWordSelect) {
            onWordSelect(word);
        }
        else {
            setSelectedWord(word);
        }
    };
    var handleWordCardKeyDown = function (event, word) {
        if (event.target !== event.currentTarget) {
            return;
        }
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleWordActivate(word);
        }
    };
    var handlePlayWord = function (e, word) {
        e.stopPropagation();
        void playWord(word, { languagePreference: languagePreference, speechRate: 0.75 });
    };
    var headerText = "探索主題";
    var subHeaderText = "選擇一個主題開始學習";
    // ── WORD LIST VIEW ──────────────────────────────────────────────────────────
    if (selectedCategory) {
        var catName = (0, language_utils_1.getCategoryName)(selectedCategory, languagePreference);
        var colorClass_1 = getColorClass(selectedCategory.color);
        // Extract just the bg color for image bg (e.g. "bg-blue-100")
        var bgColorClass_1 = colorClass_1.split(" ")[0];
        return (<>
        <word_detail_modal_1.WordDetailModal word={selectedWord} onClose={function () { return setSelectedWord(null); }} languagePreference={languagePreference} childId={childId} onProgressUpdate={handleProgressUpdate}/>
        <div className="bg-white/80 backdrop-blur-md rounded-[40px] p-6 md:p-8 shadow-sm border border-white/50 w-full animate-in fade-in slide-in-from-right-4 duration-300">
          {/* Header – Back Button */}
          <div className="flex items-center gap-3 mb-6">
            <button onClick={function () { return setSelectedCategory(null); }} className="bg-white/70 hover:bg-white p-2 rounded-2xl shadow-sm border border-white/60 transition-all hover:scale-105 active:scale-95" aria-label="返回">
              <lucide_react_1.ArrowLeft className="w-5 h-5 text-slate-600"/>
            </button>

            <div className="flex items-center gap-2.5">
              <span className="text-3xl">{selectedCategory.icon}</span>
              <div>
                <h2 className="text-2xl font-black text-slate-700 tracking-tight leading-tight">
                  {catName}
                </h2>
                <p className="text-xs font-bold text-slate-400">
                  {isLoadingWords
                ? "載入中…"
                : "".concat(categoryWords.length, " \u500B\u8A5E\u8A9E")}
                </p>
              </div>
            </div>
          </div>

          {/* Loading Skeletons */}
          {isLoadingWords && (<div className="grid grid-cols-2 gap-4">
              {__spreadArray([], Array(6), true).map(function (_, i) { return (<div key={i} className="h-40 rounded-[28px] bg-slate-100 animate-pulse"/>); })}
            </div>)}

          {/* Error */}
          {wordsError && !isLoadingWords && (<div className="text-center py-12">
              <p className="text-4xl mb-3">😕</p>
              <p className="text-slate-500 font-bold text-sm">{wordsError}</p>
            </div>)}

          {/* Empty */}
          {!isLoadingWords && !wordsError && categoryWords.length === 0 && (<div className="text-center py-12">
              <p className="text-5xl mb-3">🔍</p>
              <p className="text-slate-500 font-bold text-sm">暫時還沒有詞語</p>
            </div>)}

          {/* Word Grid */}
          {!isLoadingWords && categoryWords.length > 0 && (<div className="grid grid-cols-2 gap-4">
              {categoryWords.map(function (word) {
                    var wordText = (0, language_utils_1.getWordText)(word, languagePreference);
                    return (<div key={word.id} role="button" tabIndex={0} onClick={function () { return handleWordActivate(word); }} onKeyDown={function (event) { return handleWordCardKeyDown(event, word); }} className={(0, utils_1.cn)("group relative flex flex-col items-center justify-start p-4 h-44 rounded-[28px] border-[3px]", "cursor-pointer transition-all duration-300 shadow-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white", colorClass_1, word.mastered && "ring-2 ring-green-400 ring-offset-1")}>
                    {/* Mastered badge */}
                    {word.mastered && (<div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-green-400 flex items-center justify-center shadow-sm">
                        <lucide_react_1.Check className="w-3.5 h-3.5 text-white" strokeWidth={3}/>
                      </div>)}
                    {/* Image / Emoji */}
                    <div className={(0, utils_1.cn)("w-20 h-20 rounded-2xl flex items-center justify-center mb-2 overflow-hidden shrink-0", bgColorClass_1, "border-2 border-white/60 shadow-sm")}>
                      {isImageUrl(word.image) ? (<img src={word.image} alt={word.word} className="w-full h-full object-cover" onError={function (e) {
                                e.target.style.display =
                                    "none";
                            }}/>) : (<span className="text-4xl">{word.image || "📝"}</span>)}
                    </div>

                    {/* Word Label */}
                    <span className="text-base font-black tracking-tight text-center leading-tight">
                      {wordText}
                    </span>

                    {/* Jyutping */}
                    {word.jyutping && (<span className="mt-1 px-2 py-0.5 rounded-full bg-white/40 text-[10px] font-bold tracking-wide">
                        {word.jyutping}
                      </span>)}

                    {/* Audio Button */}
                    <button type="button" onClick={function (e) { return handlePlayWord(e, word); }} className="absolute bottom-3 right-3 bg-white/70 hover:bg-white rounded-full p-1.5 shadow-sm transition-all duration-200 hover:scale-110" aria-label={"\u64AD\u653E ".concat(word.word_cantonese || word.word)}>
                      <lucide_react_1.Volume2 className={(0, utils_1.cn)("w-4 h-4", (isPlaying || isAudioLoading) && "animate-pulse")}/>
                    </button>
                  </div>);
                })}
            </div>)}
        </div>
      </>);
    }
    // ── CATEGORY GRID VIEW ──────────────────────────────────────────────────────
    return (<>
      <word_detail_modal_1.WordDetailModal word={selectedWord} onClose={function () { return setSelectedWord(null); }} languagePreference={languagePreference} childId={childId} onProgressUpdate={handleProgressUpdate}/>
      <div className="bg-white/80 backdrop-blur-md rounded-[40px] p-6 md:p-8 shadow-sm border border-white/50 w-full">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-yellow-400 p-2.5 rounded-2xl shadow-sm rotate-3">
            <lucide_react_1.Sparkles className="w-6 h-6 text-white fill-white"/>
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-700 tracking-tight">
              {headerText}
            </h2>
            <p className="text-sm font-bold text-slate-400">{subHeaderText}</p>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-4">
          {categories.map(function (category) {
            var categoryName = (0, language_utils_1.getCategoryName)(category, languagePreference);
            var colorClasses = getColorClass(category.color);
            return (<button key={category.id} onClick={function () { return handleCategoryClick(category); }} className={(0, utils_1.cn)("group relative flex flex-col items-center justify-center p-4 h-44 rounded-4xl border-[3px]", "transition-all duration-300 shadow-sm", colorClasses)}>
                {/* Icon */}
                <span className="text-5xl mb-3 drop-shadow-sm filter transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                  {category.icon}
                </span>

                {/* Name */}
                <span className="text-lg font-black tracking-tight text-center leading-tight">
                  {categoryName}
                </span>

                {/* Word Count Tag */}
                <span className="mt-2 px-2.5 py-1 rounded-full bg-white/40 text-[10px] font-black uppercase tracking-wide">
                  {category.wordCount} 詞語
                </span>

                {/* Play Button Indicator (appears on hover) */}
                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                  <div className="bg-white rounded-full p-1.5 shadow-sm">
                    <lucide_react_1.Play className="w-4 h-4 fill-current"/>
                  </div>
                </div>
              </button>);
        })}
        </div>
      </div>
    </>);
}
