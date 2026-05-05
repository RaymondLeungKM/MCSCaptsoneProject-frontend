"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X, Volume2, Star, RotateCcw, Zap, HelpCircle } from "lucide-react";
import confetti from "canvas-confetti";
import { getWords, getCapturedWords } from "@/lib/api/vocabulary";
import { recordGameSession } from "@/lib/api/games";
import { useWordAudio } from "@/hooks/use-word-audio";
import { Confetti } from "./confetti";
import { CartoonWordImage } from "./cartoon-word-image";
import { preloadGameImages } from "@/lib/cartoon-image";
import type { WordResponse } from "@/lib/api/vocabulary";
import type { Word } from "@/lib/types";
import { isValidJyutping } from "@/lib/language-utils";

/* ── Props ── */
interface WordBuilderGameProps {
  childId: string;
  onClose: () => void;
}

/* ── Constants ── */
const TOTAL_ROUNDS = 8;
const MAX_WRONG_BEFORE_HINT = 2;
const HINT_MESSAGE_DURATION_MS = 1800;

const FALLBACK_BG = [
  "from-pink-200 to-rose-100",
  "from-sky-200 to-cyan-100",
  "from-violet-200 to-purple-100",
  "from-amber-200 to-yellow-100",
  "from-emerald-200 to-green-100",
  "from-orange-200 to-amber-100",
];

/* ── Helpers ── */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function hashKey(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i += 1)
    h = (h * 31 + value.charCodeAt(i)) >>> 0;
  return h;
}

function getFallbackBg(wordId: string): string {
  return FALLBACK_BG[hashKey(wordId) % FALLBACK_BG.length];
}

function calcStars(score: number, total: number): number {
  return score >= 7 ? 3 : score >= 5 ? 2 : 1;
}

function wordResponseToWord(w: WordResponse): Word {
  return {
    id: w.id,
    word: w.word,
    word_cantonese: w.word_cantonese,
    jyutping: w.jyutping,
    image: w.image_url || "",
    category: w.category,
    categoryName: w.category_name,
    category_name_cantonese: w.category_name_cantonese,
    pronunciation: w.pronunciation || "",
    definition: w.definition,
    definition_cantonese: w.definition_cantonese,
    example: w.example,
    example_cantonese: w.example_cantonese,
    difficulty: w.difficulty,
    mastered: false,
    exposureCount: w.total_exposures || 0,
    audio_url: w.audio_url,
    audio_url_english: w.audio_url_english,
    contexts: w.contexts || [],
    relatedWords: w.related_words || [],
  };
}

/** Check if a word has valid Cantonese data for this game */
function hasCantoData(w: WordResponse): boolean {
  return !!(
    w.image_url &&
    w.word_cantonese &&
    w.word_cantonese.trim() !== "" &&
    w.jyutping &&
    isValidJyutping(w.jyutping) &&
    // Exclude fallback where word_cantonese === English word
    w.word_cantonese !== w.word
  );
}

/**
 * Pick distractor characters from other words in the pool, avoiding duplicates
 * with the target word's characters.
 */
function pickDistractors(
  targetChars: string[],
  allWords: WordResponse[],
  count: number,
): string[] {
  const targetSet = new Set(targetChars);
  const candidates: string[] = [];
  for (const w of allWords) {
    if (!w.word_cantonese) continue;
    for (const ch of w.word_cantonese) {
      if (!targetSet.has(ch) && !candidates.includes(ch)) {
        candidates.push(ch);
      }
    }
  }
  // Fallback: if not enough distractors from pool, just use fewer
  return shuffle(candidates).slice(0, count);
}

/* ── Component ── */
export function WordBuilderGame({ childId, onClose }: WordBuilderGameProps) {
  // Word pool
  const [words, setWords] = useState<WordResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState({ loaded: 0, total: 0 });

  // Round state
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [currentWord, setCurrentWord] = useState<WordResponse | null>(null);

  // Character tiles & slots
  const [targetChars, setTargetChars] = useState<string[]>([]);
  const [jyutpingSyllables, setJyutpingSyllables] = useState<string[]>([]);
  const [tiles, setTiles] = useState<{ char: string; id: string; used: boolean }[]>([]);
  const [slots, setSlots] = useState<(string | null)[]>([]);

  // Feedback state
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [highlightedHintIndex, setHighlightedHintIndex] = useState<number | null>(null);
  const [revealedHintIndexes, setRevealedHintIndexes] = useState<number[]>([]);
  const [shaking, setShaking] = useState(false);
  const [correctFlash, setCorrectFlash] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [xpEarned, setXpEarned] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Audio
  const { playWord, isPlaying } = useWordAudio();

  // Tracking refs
  const startTimeRef = useRef(Date.now());
  const wordsSeen = useRef<string[]>([]);
  const wordsCorrect = useRef<string[]>([]);
  const firstTryRef = useRef(true); // no wrong attempts this round
  const hintMessageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHintMessageTimeout = () => {
    if (hintMessageTimeoutRef.current) {
      clearTimeout(hintMessageTimeoutRef.current);
      hintMessageTimeoutRef.current = null;
    }
  };

  const triggerHintMessage = () => {
    setShowHint(true);
    clearHintMessageTimeout();
    hintMessageTimeoutRef.current = setTimeout(() => {
      setShowHint(false);
      hintMessageTimeoutRef.current = null;
    }, HINT_MESSAGE_DURATION_MS);
  };

  /* ── Load words: captured first, then system backfill ── */
  useEffect(() => {
    void (async () => {
      try {
        // 1. Try child's camera-captured words first
        let captured: WordResponse[] = [];
        try {
          captured = await getCapturedWords(childId, { limit: 200 });
        } catch {
          // No captured words or API error — continue
        }
        const validCaptured = captured.filter(hasCantoData);

        let pool: WordResponse[] = [];

        if (validCaptured.length >= TOTAL_ROUNDS) {
          // Enough camera-captured words
          pool = shuffle(validCaptured).slice(0, TOTAL_ROUNDS);
        } else {
          // Backfill with system words
          const systemWords = await getWords({
            childId,
            includeExternal: false,
            limit: 200,
          });
          const validSystem = systemWords.filter(hasCantoData);

          // Prefer multi-char words first (more interesting for character arrangement)
          const capturedShuffled = shuffle(validCaptured);
          const systemShuffled = shuffle(validSystem).filter(
            (sw) => !capturedShuffled.find((cw) => cw.id === sw.id),
          );
          // Sort: 2+ char words first, then 1-char
          const sortByCharCount = (a: WordResponse, b: WordResponse) => {
            const aLen = (a.word_cantonese || "").length;
            const bLen = (b.word_cantonese || "").length;
            if (aLen >= 2 && bLen < 2) return -1;
            if (bLen >= 2 && aLen < 2) return 1;
            return 0;
          };
          const combined = [
            ...capturedShuffled.sort(sortByCharCount),
            ...systemShuffled.sort(sortByCharCount),
          ];
          pool = combined.slice(0, TOTAL_ROUNDS);
        }

        // Pre-load images
        if (pool.length > 0) {
          await preloadGameImages(
            pool.map((w) => ({
              id: w.id,
              word: w.word,
              word_cantonese: w.word_cantonese,
              category: w.category,
              category_name: w.category_name,
              image_url: w.image_url,
            })),
            (loaded, total) => setLoadProgress({ loaded, total }),
          );
        }

        setWords(pool);
      } catch (err) {
        console.error("Failed to load words for Word Builder:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [childId]);

  /* ── Setup a round ── */
  const setupRound = useCallback(
    (wordPool: WordResponse[], roundIndex: number) => {
      if (roundIndex >= TOTAL_ROUNDS || roundIndex >= wordPool.length) return;
      const word = wordPool[roundIndex];
      setCurrentWord(word);

      const chars = (word.word_cantonese || "").split("");
      setTargetChars(chars);

      // Split jyutping by spaces to match chars
      const jp = (word.jyutping || "").split(/\s+/).filter(Boolean);
      setJyutpingSyllables(jp);

      // Create tiles: correct chars + distractors
      const distractorCount = 2;
      const distractors = pickDistractors(chars, wordPool, distractorCount);
      const allChars = shuffle([...chars, ...distractors]);
      setTiles(
        allChars.map((ch, i) => ({
          char: ch,
          id: `tile-${roundIndex}-${i}`,
          used: false,
        })),
      );

      // Empty slots
      setSlots(new Array(chars.length).fill(null));
      setWrongAttempts(0);
      setShowHint(false);
      setHighlightedHintIndex(null);
      setRevealedHintIndexes([]);
      clearHintMessageTimeout();
      setShaking(false);
      setCorrectFlash(false);
      firstTryRef.current = true;
    },
    [],
  );

  // Setup first round when words are loaded
  useEffect(() => {
    if (words.length > 0 && !isGameOver) setupRound(words, round);
  }, [words]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => clearHintMessageTimeout(), []);

  // Auto-play Cantonese audio when round changes
  useEffect(() => {
    if (!currentWord || loading) return;
    const timer = setTimeout(() => {
      void playWord(wordResponseToWord(currentWord), {
        languagePreference: "cantonese",
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [currentWord, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Tile tap: place character in next empty slot ── */
  const handleTileTap = (tileId: string) => {
    if (correctFlash || shaking) return;

    const tileIndex = tiles.findIndex((t) => t.id === tileId);
    if (tileIndex === -1 || tiles[tileIndex].used) return;

    const nextSlot = slots.indexOf(null);
    if (nextSlot === -1) return; // all slots filled

    const tappedChar = tiles[tileIndex].char;
    const hintedChar =
      highlightedHintIndex !== null ? targetChars[highlightedHintIndex] : null;

    if (showHint) {
      setShowHint(false);
      clearHintMessageTimeout();
    }

    if (hintedChar && tappedChar === hintedChar && highlightedHintIndex === nextSlot) {
      setHighlightedHintIndex(null);
      setRevealedHintIndexes([]);
    }

    // Mark tile as used
    setTiles((prev) =>
      prev.map((t) => (t.id === tileId ? { ...t, used: true } : t)),
    );

    // Place char in slot
    const newSlots = [...slots];
    newSlots[nextSlot] = tileId;
    setSlots(newSlots);

    // Check if all slots are now filled
    const allFilled = newSlots.every((s) => s !== null);
    if (allFilled) {
      // Evaluate answer
      const answer = newSlots.map((sid) => {
        const tile = tiles.find((t) => t.id === sid) || { char: "" };
        // But we just updated tiles - need to use current tiles state
        return sid ? (tiles.find((t) => t.id === sid)?.char || "") : "";
      });

      const correct = answer.join("") === targetChars.join("");

      if (correct) {
        handleCorrect();
      } else {
        handleWrong();
      }
    }
  };

  /* ── Slot tap: remove character from slot ── */
  const handleSlotTap = (slotIndex: number) => {
    if (correctFlash || shaking) return;
    const tileId = slots[slotIndex];
    if (!tileId) return;

    // Free the tile
    setTiles((prev) =>
      prev.map((t) => (t.id === tileId ? { ...t, used: false } : t)),
    );

    // Clear slot
    const newSlots = [...slots];
    newSlots[slotIndex] = null;
    setSlots(newSlots);
  };

  /* ── Correct answer ── */
  const handleCorrect = () => {
    if (!currentWord) return;
    wordsSeen.current = [...wordsSeen.current, currentWord.id];

    if (firstTryRef.current) {
      setScore((s) => s + 1);
      wordsCorrect.current = [...wordsCorrect.current, currentWord.id];
    }

    setCorrectFlash(true);
    
    // Realistic confetti burst - shorter duration
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
      ticks: 100,
      gravity: 1.5,
      colors: ['#22c55e', '#10b981', '#ffffff', '#3b82f6', '#f59e0b']
    });

    // Replay audio on correct
    void playWord(wordResponseToWord(currentWord), {
      languagePreference: "cantonese",
    });

    // Advance to next round
    setTimeout(() => {
      confetti.reset(); // Clear existing confetti before next question
      setCorrectFlash(false);
      const nextRound = round + 1;
      if (nextRound >= TOTAL_ROUNDS || nextRound >= words.length) {
        setIsGameOver(true);
      } else {
        setRound(nextRound);
        setupRound(words, nextRound);
      }
    }, 1500);
  };

  /* ── Wrong answer ── */
  const handleWrong = () => {
    firstTryRef.current = false;
    const newWrong = wrongAttempts + 1;
    setWrongAttempts(newWrong);

    // Also add to seen if first wrong
    if (currentWord && !wordsSeen.current.includes(currentWord.id)) {
      wordsSeen.current = [...wordsSeen.current, currentWord.id];
    }

    // Shake animation then preserve correct slots and escalate hints.
    setShaking(true);
    setTimeout(() => {
      setShaking(false);

      const slotChars = slots.map((slotId) =>
        slotId ? (tiles.find((tile) => tile.id === slotId)?.char ?? "") : "",
      );

      const nextSlots = [...slots];
      const keptTileIds = new Set<string>();

      slotChars.forEach((char, index) => {
        const slotId = nextSlots[index];
        if (slotId && char === targetChars[index]) {
          keptTileIds.add(slotId);
          return;
        }
        nextSlots[index] = null;
      });

      let nextTiles = tiles.map((tile) => ({
        ...tile,
        used: keptTileIds.has(tile.id),
      }));

      let nextHintIndex = nextSlots.findIndex((slotId, index) => {
        if (!slotId) return true;
        const char = nextTiles.find((tile) => tile.id === slotId)?.char ?? "";
        return char !== targetChars[index];
      });

      if (nextHintIndex === -1) {
        nextHintIndex = targetChars.findIndex((_, index) => !nextSlots[index]);
      }

      if (newWrong >= MAX_WRONG_BEFORE_HINT && nextHintIndex !== -1) {
        triggerHintMessage();
        setRevealedHintIndexes((prev) =>
          prev.includes(nextHintIndex) ? prev : [...prev, nextHintIndex],
        );
      }

      if (newWrong >= MAX_WRONG_BEFORE_HINT && nextHintIndex !== -1) {
        setHighlightedHintIndex(nextHintIndex);
      } else {
        setHighlightedHintIndex(null);
      }

      setTiles(nextTiles);
      setSlots(nextSlots);

      // Replay audio after reset so child hears the word again
      if (currentWord) {
        void playWord(wordResponseToWord(currentWord), { languagePreference: "cantonese" });
      }
    }, 600);
  };

  /* ── Replay audio ── */
  const handleReplay = () => {
    if (!currentWord) return;
    void playWord(wordResponseToWord(currentWord), {
      languagePreference: "cantonese",
    });
  };

  /* ── Save session ── */
  const saveSession = useCallback(
    async (finalScore: number) => {
      setSaving(true);
      const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
      const stars = calcStars(finalScore, TOTAL_ROUNDS);
      try {
        const resp = await recordGameSession("word-builder", {
          child_id: childId,
          score: finalScore,
          max_score: TOTAL_ROUNDS,
          duration_seconds: duration,
          words_seen: wordsSeen.current,
          words_correct: wordsCorrect.current,
          stars,
        });
        setXpEarned(resp?.xp_earned ?? null);
      } catch (err) {
        console.error("Failed to save game session:", err);
      }
      setSaving(false);
    },
    [childId],
  );

  // Save when game ends
  useEffect(() => {
    if (isGameOver && words.length > 0) void saveSession(score);
  }, [isGameOver]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Restart ── */
  const restart = () => {
    const reshuffled = shuffle(words);
    setWords(reshuffled);
    setRound(0);
    setScore(0);
    setIsGameOver(false);
    setXpEarned(null);
    wordsSeen.current = [];
    wordsCorrect.current = [];
    startTimeRef.current = Date.now();
  };

  /* ── Get the character placed in a slot ── */
  const getSlotChar = (slotIndex: number): string => {
    const tileId = slots[slotIndex];
    if (!tileId) return "";
    return tiles.find((t) => t.id === tileId)?.char || "";
  };

  const effectiveRounds = Math.min(TOTAL_ROUNDS, words.length);

  /* ═══════════════════════ RENDER ═══════════════════════ */

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="fixed inset-0 z-[60] bg-gradient-to-b from-green-100 to-emerald-100 flex items-center justify-center">
        <div className="relative flex flex-col items-center gap-4">
          <p className="text-slate-600 font-black text-lg">準備緊…</p>
          {loadProgress.total > 0 && (
            <div className="w-48 mt-3">
              <div className="h-2 bg-green-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.round((loadProgress.loaded / loadProgress.total) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-green-400 text-center mt-1">
                載入圖片 {loadProgress.loaded}/{loadProgress.total}
              </p>
            </div>
          )}
          {/* Pulsing dots */}
          <div className="flex gap-2 mt-2">
            <span className="w-3 h-3 rounded-full bg-green-400 animate-dot-1" />
            <span className="w-3 h-3 rounded-full bg-green-500 animate-dot-2" />
            <span className="w-3 h-3 rounded-full bg-green-400 animate-dot-3" />
          </div>
        </div>
      </div>
    );
  }

  /* ── No words available ── */
  if (words.length === 0) {
    return (
      <div className="fixed inset-0 z-[60] bg-gradient-to-b from-green-100 to-emerald-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-[40px] p-8 text-center max-w-sm w-full shadow-2xl">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-2xl font-black text-slate-700 mb-2">
            未有足夠嘅詞語
          </h2>
          <p className="text-slate-500 mb-6">
            試下用相機影下嘢學多啲生字先！
          </p>
          <button
            onClick={onClose}
            className="bg-green-500 text-white rounded-2xl py-3 px-8 font-bold shadow-md active:scale-95 transition-transform"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  /* ── Game Over ── */
  if (isGameOver) {
    const stars = calcStars(score, effectiveRounds);
    const encouragement =
      stars === 3 ? "挑戰成功！你超啓婷！🏆" :
      stars === 2 ? "做得好！繼續加油唤！🌟" :
                   "唔緊要，繼續練習會得啓💪";
    return (
      <div className="fixed inset-0 z-[60] bg-gradient-to-b from-green-100 to-emerald-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-[40px] p-8 text-center max-w-sm w-full shadow-2xl">
          <div className="text-7xl mb-3">
            {stars === 3 ? "🏆" : stars === 2 ? "🌟" : "⭐"}
          </div>
          <h2 className="text-3xl font-black text-slate-700 mb-1">完成！</h2>
          <p className="text-lg font-bold text-slate-500 mb-3">{encouragement}</p>
          <div className="flex justify-center gap-2 mb-4">
            {Array.from({ length: 3 }, (_, i) => (
              <Star
                key={i}
                className={`w-9 h-9 ${i < stars ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`}
              />
            ))}
          </div>
          {xpEarned != null && xpEarned > 0 && (
            <div className="inline-flex items-center gap-1.5 bg-yellow-100 text-yellow-700 font-black px-4 py-1.5 rounded-full mb-4 text-base animate-pop-in">
              <Zap className="w-4 h-4" /> +{xpEarned} XP
            </div>
          )}
          {saving && <p className="text-slate-400 text-sm mb-4">儲存中…</p>}
          <div className="flex gap-3">
            <button
              onClick={restart}
              className="flex-1 bg-green-500 text-white rounded-2xl py-3 font-bold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-transform"
            >
              <RotateCcw className="w-4 h-4" /> 再玩一次
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 text-slate-600 rounded-2xl py-3 font-bold active:scale-95 transition-transform"
            >
              離開
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Playing ── */
  return (
    <div className="fixed inset-0 z-[60] bg-gradient-to-b from-green-100 to-emerald-100 flex flex-col">
      <Confetti active={showConfetti} />
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-16 pb-3">
        <button
          onClick={onClose}
          className="w-10 h-10 bg-white/70 rounded-full flex items-center justify-center shadow-sm"
        >
          <X className="w-5 h-5 text-slate-600" />
        </button>
        <div className="bg-white/70 backdrop-blur-sm px-4 py-1.5 rounded-full font-bold text-slate-700 shadow-sm">
          {round + 1} / {effectiveRounds}
        </div>
        <div className="bg-green-500 px-4 py-1.5 rounded-full font-bold text-white shadow-sm">
          ⭐ {score}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mx-4 h-2 bg-white/50 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500 rounded-full transition-all duration-500"
          style={{ width: `${(round / effectiveRounds) * 100}%` }}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 gap-6 overflow-y-auto">
        {/* Image + Audio */}
        {currentWord && (
          <div className="flex flex-col items-center gap-5">
            {/* Instruction */}
            <p className="text-slate-700 font-black text-2xl text-center">
              聽粵語讀音，砌出正確嘅字！
            </p>

            {/* Cartoon image */}
            <div className="w-48 h-48 rounded-3xl overflow-hidden shadow-lg border-4 border-white/70">
              <CartoonWordImage
                wordId={currentWord.id}
                word={currentWord.word}
                wordCantonese={currentWord.word_cantonese}
                category={currentWord.category}
                existingImageUrl={currentWord.image_url}
                className="w-full h-full"
                emojiSize="text-6xl"
                placeholderBg={`bg-gradient-to-br ${getFallbackBg(currentWord.id)}`}
                showLabel={false}
              />
            </div>

            {/* Audio replay button */}
            <button
              onClick={handleReplay}
              className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center transition-all active:scale-90 active:translate-y-1 active:shadow-none ${
                isPlaying
                  ? "bg-gradient-to-b from-green-400 to-green-500 scale-110 animate-pulse shadow-[0_4px_0_#15803d]"
                  : "bg-gradient-to-b from-green-400 to-green-600 shadow-[0_4px_0_#15803d,0_6px_12px_rgba(21,128,61,0.3)]"
              }`}
            >
              <Volume2 className="w-8 h-8 text-white drop-shadow" />
            </button>
          </div>
        )}

        {/* Answer Slots */}
        <div
          className={`flex gap-4 justify-center ${shaking ? "animate-shake" : ""}`}
        >
          {targetChars.map((_, i) => {
            const filled = slots[i] !== null;
            const char = getSlotChar(i);
            return (
              <div key={i} className="flex flex-col items-center gap-2">
                <button
                  onClick={() => handleSlotTap(i)}
                  className={`w-20 h-20 rounded-2xl flex items-center justify-center text-4xl font-black transition-all duration-200 ${
                    correctFlash
                      ? "bg-green-400 text-white border-4 border-green-500 scale-110 shadow-[0_4px_0_#15803d]"
                      : highlightedHintIndex === i && !filled
                        ? "bg-green-50 text-transparent border-4 border-dashed border-green-400 shadow-[0_0_0_6px_rgba(74,222,128,0.16)] animate-pulse"
                      : filled
                        ? "bg-white text-slate-800 border-4 border-green-300 shadow-[0_6px_0_#86efac] active:scale-95 active:translate-y-1 active:shadow-none"
                        : "bg-white/50 text-transparent border-4 border-dashed border-green-300"
                  }`}
                >
                  {filled ? char : ""}
                </button>
                {/* Jyutping hint */}
                {revealedHintIndexes.includes(i) && jyutpingSyllables[i] && (
                  <span className="text-sm font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full animate-pop-in">
                    {jyutpingSyllables[i]}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Hint indicator */}
        {wrongAttempts > 0 && !showHint && (
          <p className="text-base text-slate-500 font-bold flex items-center gap-1.5 bg-white/50 px-4 py-1.5 rounded-full">
            <HelpCircle className="w-4 h-4" />
            再試 {MAX_WRONG_BEFORE_HINT - wrongAttempts} 次就有拼音提示
          </p>
        )}

        {showHint && (
          <p className="text-base text-green-600 font-black flex items-center gap-1.5 animate-pop-in bg-green-50 px-4 py-1.5 rounded-full border border-green-200">
            <HelpCircle className="w-4 h-4" />
            已保留正確答案，請按發光嘅字卡放入下一格！
          </p>
        )}

        {/* Correct feedback */}
        {correctFlash && currentWord && (
          <div className="text-3xl font-black text-green-600 animate-bounce-short flex items-center gap-3 bg-white/80 px-6 py-2 rounded-full shadow-lg">
            🎉 {currentWord.word_cantonese}
            {currentWord.jyutping && (
              <span className="text-xl font-bold text-green-500">
                ({currentWord.jyutping})
              </span>
            )}
          </div>
        )}

        {/* Character Tiles */}
        <div className="flex flex-wrap gap-4 justify-center max-w-md pt-4">
          {tiles.map((tile) => {
            const hintedChar =
              highlightedHintIndex !== null ? targetChars[highlightedHintIndex] : null;
            const isHintedTile =
              hintedChar !== null && tile.char === hintedChar && !tile.used;
            return (
              <button
                key={tile.id}
                onClick={() => handleTileTap(tile.id)}
                disabled={tile.used || correctFlash || shaking}
                className={`w-20 h-20 rounded-2xl flex items-center justify-center text-4xl font-black transition-all duration-200 ${
                  tile.used
                    ? "bg-gray-100 text-gray-300 border-4 border-gray-200 scale-90"
                    : isHintedTile
                      ? "bg-green-50 text-slate-800 border-4 border-green-400 shadow-[0_8px_0_#4ade80] animate-pulse hover:border-green-500"
                      : "bg-white text-slate-800 border-4 border-emerald-200 shadow-[0_8px_0_#a7f3d0] active:scale-90 active:translate-y-1 active:shadow-none hover:border-emerald-400"
                }`}
              >
                {tile.char}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
