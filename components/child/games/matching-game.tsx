"use client";

import { useEffect, useRef, useState } from "react";
import { X, RotateCcw, Star, Timer, Zap } from "lucide-react";
import { getWords } from "@/lib/api/vocabulary";
import { recordGameSession } from "@/lib/api/games";
import { Confetti } from "./confetti";
import { CartoonWordImage } from "./cartoon-word-image";
import { preloadGameImages } from "@/lib/cartoon-image";
import { isValidJyutping } from "@/lib/language-utils";
import type { WordResponse } from "@/lib/api/vocabulary";

interface MatchingGameProps {
  childId: string;
  onClose: () => void;
}

interface Card {
  id: string;
  wordId: string;
  type: "image-a" | "image-b";
  word: WordResponse;
  matched: boolean;
}

const FALLBACK_BG = [
  "from-pink-200 to-rose-100",
  "from-sky-200 to-cyan-100",
  "from-violet-200 to-purple-100",
  "from-amber-200 to-yellow-100",
  "from-emerald-200 to-green-100",
  "from-orange-200 to-amber-100",
];

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function hashKey(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) h = (h * 31 + value.charCodeAt(i)) >>> 0;
  return h;
}

function getFallbackBg(wordId: string): string {
  return FALLBACK_BG[hashKey(wordId) % FALLBACK_BG.length];
}

const PAIR_COUNT = 6;

export function MatchingGame({ childId, onClose }: MatchingGameProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState({ loaded: 0, total: 0 });

  const [flipped, setFlipped] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [matchedCount, setMatchedCount] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [checking, setChecking] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [wrongPair, setWrongPair] = useState<string[]>([]);
  const [celebratePair, setCelebratePair] = useState<string[]>([]);
  const [matchConfetti, setMatchConfetti] = useState(false);
  const [xpEarned, setXpEarned] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const startTimeRef = useRef<number>(Date.now());
  const wordsSeenRef = useRef<string[]>([]);
  const wordsCorrectRef = useRef<string[]>([]);

  // Timer
  useEffect(() => {
    if (gameOver || loading) return;
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [gameOver, loading]);

  const initGame = async () => {
    setLoading(true);
    const data = await getWords({
      childId,
      includeExternal: true,
      includeMongodb: true,
      limit: 200,
    });
    const filtered = data.filter(
      (w) =>
        w.image_url &&
        w.word_cantonese &&
        w.word_cantonese.trim() !== "" &&
        w.word_cantonese !== w.word &&
        isValidJyutping(w.jyutping),
    );
    const selected = shuffle(filtered).slice(0, PAIR_COUNT);

    // Pre-load images

    await preloadGameImages(
      selected.map((w) => ({
        id: w.id,
        word: w.word,
        word_cantonese: w.word_cantonese,
        category: w.category,
        category_name: w.category_name,
        image_url: w.image_url,
      })),
      (loaded, total) => setLoadProgress({ loaded, total }),
    );

    const newCards: Card[] = shuffle([
      ...selected.map((w) => ({
        id: `a-${w.id}`,
        wordId: w.id,
        type: "image-a" as const,
        word: w,
        matched: false,
      })),
      ...selected.map((w) => ({
        id: `b-${w.id}`,
        wordId: w.id,
        type: "image-b" as const,
        word: w,
        matched: false,
      })),
    ]);
    setCards(newCards);
    setFlipped([]);
    setMoves(0);
    setMatchedCount(0);
    setGameOver(false);
    setSeconds(0);
    setWrongPair([]);
    setCelebratePair([]);
    setXpEarned(null);
    wordsSeenRef.current = [];
    wordsCorrectRef.current = [];
    startTimeRef.current = Date.now();
    setLoading(false);
  };

  useEffect(() => {
    void initGame();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFlip = (cardId: string) => {
    if (checking) return;
    const card = cards.find((c) => c.id === cardId);
    if (!card || card.matched || flipped.includes(cardId)) return;

    const newFlipped = [...flipped, cardId];

    if (newFlipped.length < 2) {
      setFlipped(newFlipped);
      return;
    }

    // Two cards flipped — check match
    setFlipped(newFlipped);
    setMoves((m) => m + 1);
    setChecking(true);

    const [id1, id2] = newFlipped;
    const c1 = cards.find((c) => c.id === id1)!;
    const c2 = cards.find((c) => c.id === id2)!;

    if (c1.wordId === c2.wordId && c1.type !== c2.type) {
      // Match!
      setTimeout(() => {
        setCards((prev) =>
          prev.map((c) =>
            newFlipped.includes(c.id) ? { ...c, matched: true } : c,
          ),
        );
        const newMatchedCount = matchedCount + 1;
        setMatchedCount(newMatchedCount);
        // Track word progress
        if (!wordsSeenRef.current.includes(c1.wordId)) {
          wordsSeenRef.current = [...wordsSeenRef.current, c1.wordId];
        }
        wordsCorrectRef.current = [...wordsCorrectRef.current, c1.wordId];
        setCelebratePair(newFlipped);
        setTimeout(() => setCelebratePair([]), 700);
        setMatchConfetti(true);
        setTimeout(() => setMatchConfetti(false), 1100);
        setFlipped([]);
        setChecking(false);
        if (newMatchedCount >= PAIR_COUNT) {
          setGameOver(true);
          // Save session
          const finalSeconds = seconds;
          const finalMoves = moves + 1;
          const stars = finalSeconds <= 30 && finalMoves <= 8 ? 3 : finalSeconds <= 60 && finalMoves <= 12 ? 2 : 1;
          setSaving(true);
          void recordGameSession("matching", {
            child_id: childId,
            score: PAIR_COUNT,
            max_score: PAIR_COUNT,
            duration_seconds: Math.round((Date.now() - startTimeRef.current) / 1000),
            words_seen: wordsSeenRef.current,
            words_correct: wordsCorrectRef.current,
            stars,
          }).then((resp) => {
            setXpEarned(resp?.xp_earned ?? null);
            setSaving(false);
          });
        }
      }, 600);
    } else {
      // No match — shake then hide
      setWrongPair(newFlipped);
      // Track seen words
      [c1, c2].forEach((c) => {
        if (!wordsSeenRef.current.includes(c.wordId)) {
          wordsSeenRef.current = [...wordsSeenRef.current, c.wordId];
        }
      });
      setTimeout(() => {
        setFlipped([]);
        setWrongPair([]);
        setChecking(false);
      }, 1000);
    }
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)
      .toString()
      .padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const stars = gameOver
    ? seconds <= 30 && moves <= 8
      ? 3
      : seconds <= 60 && moves <= 12
        ? 2
        : 1
    : 0;

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="fixed inset-0 z-[60] bg-gradient-to-b from-blue-100 to-cyan-100 flex items-center justify-center">
        <div className="relative flex flex-col items-center gap-4">
          <p className="text-slate-600 font-black text-lg">準備緊…</p>
          {loadProgress.total > 0 && (
            <div className="w-48 mt-3">
              <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.round((loadProgress.loaded / loadProgress.total) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-blue-400 text-center mt-1">
                載入圖片 {loadProgress.loaded}/{loadProgress.total}
              </p>
            </div>
          )}
          {/* Pulsing dots */}
          <div className="flex gap-2 mt-2">
            <span className="w-3 h-3 rounded-full bg-blue-400 animate-dot-1" />
            <span className="w-3 h-3 rounded-full bg-blue-500 animate-dot-2" />
            <span className="w-3 h-3 rounded-full bg-blue-400 animate-dot-3" />
          </div>
        </div>
      </div>
    );
  }

  /* ── Game Over ── */
  if (gameOver) {
    return (
      <div className="fixed inset-0 z-[60] bg-gradient-to-b from-blue-100 to-cyan-100 flex items-center justify-center p-6">
        <Confetti active={true} count={30} />
        <div className="bg-white rounded-[40px] p-8 text-center max-w-sm w-full shadow-2xl">
          <div className="text-7xl mb-3">
            {stars === 3 ? "🏆" : stars === 2 ? "🌟" : "⭐"}
          </div>
          <h2 className="text-3xl font-black text-slate-700 mb-4">完成！</h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-blue-50 rounded-2xl p-3">
              <div className="text-3xl font-black text-blue-600">{moves}</div>
              <div className="text-sm text-slate-500 font-bold">步數</div>
            </div>
            <div className="bg-cyan-50 rounded-2xl p-3">
              <div className="text-3xl font-black text-cyan-600">
                {formatTime(seconds)}
              </div>
              <div className="text-sm text-slate-500 font-bold">時間</div>
            </div>
          </div>
          <div className="flex justify-center gap-2 mb-3">
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
              onClick={() => void initGame()}
              className="flex-1 bg-blue-500 text-white rounded-2xl py-3 font-bold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-transform"
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

  /* ── Game ── */
  return (
    <div className="fixed inset-0 z-[60] bg-gradient-to-b from-blue-100 to-cyan-100 flex flex-col">
      <Confetti active={matchConfetti} />
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-16 pb-3">
        <button
          onClick={onClose}
          className="w-10 h-10 bg-white/70 rounded-full flex items-center justify-center shadow-sm"
        >
          <X className="w-5 h-5 text-slate-600" />
        </button>
        <div className="flex items-center gap-2">
          <div className="bg-white/70 backdrop-blur-sm px-3 py-1.5 rounded-full font-bold text-slate-700 shadow-sm flex items-center gap-1.5">
            <Timer className="w-4 h-4" />
            {formatTime(seconds)}
          </div>
          <div className="bg-blue-500 px-3 py-1.5 rounded-full font-bold text-white shadow-sm">
            {matchedCount}/{PAIR_COUNT}
          </div>
        </div>
        <div className="bg-white/70 backdrop-blur-sm px-3 py-1.5 rounded-full font-bold text-slate-700 shadow-sm">
          {moves} 步
        </div>
      </div>

      {/* Instruction */}
      <p className="text-center text-slate-600 font-bold text-sm mx-4 mb-1">
        翻開卡片，找出配對！
      </p>

      {/* Card grid — 3 cols on phones, 4 cols from sm up = 12 cards */}
      <div className="flex-1 flex items-center justify-center px-3 sm:px-4 pb-6">
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3 w-full max-w-md">
          {cards.map((card) => {
            const isFlipped = card.matched || flipped.includes(card.id);
            const isWrong = wrongPair.includes(card.id);
            const isCelebrate = celebratePair.includes(card.id);

            return (
              <button
                key={card.id}
                onClick={() => handleFlip(card.id)}
                disabled={card.matched || checking}
                className={`card-scene aspect-square rounded-2xl transition-all duration-300 shadow-md relative
                  ${card.matched ? "opacity-75 scale-95 cursor-default" : "active:scale-90"}
                  ${isWrong ? "animate-shake" : ""}
                  ${isCelebrate ? "animate-match-pop" : ""}`}
              >
                <div className={`card-inner ${isFlipped ? "flipped" : ""}`}>
                  <div className="card-face bg-gradient-to-br from-blue-400 to-blue-500 rounded-2xl flex items-center justify-center border-2 border-white/40">
                    <span className="text-2xl">🧩</span>
                  </div>

                  <div
                    className={`card-face card-face-back w-full h-full rounded-2xl overflow-hidden border-3 ${
                      card.matched ? "border-green-400 ring-4 ring-green-200/70" : "border-blue-300"
                    }`}
                  >
                    <CartoonWordImage
                      wordId={card.word.id}
                      word={card.word.word}
                      wordCantonese={card.word.word_cantonese}
                      category={card.word.category}
                      existingImageUrl={card.word.image_url}
                      className="w-full h-full"
                      emojiSize="text-3xl"
                      placeholderBg={`bg-gradient-to-br ${getFallbackBg(card.wordId)}`}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
