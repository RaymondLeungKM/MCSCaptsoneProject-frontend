"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X, Volume2, Star, RotateCcw, Zap } from "lucide-react";
import confetti from "canvas-confetti";
import { getWords } from "@/lib/api/vocabulary";
import { recordGameSession } from "@/lib/api/games";
import { useWordAudio } from "@/hooks/use-word-audio";
import { Confetti } from "./confetti";
import { CartoonWordImage } from "./cartoon-word-image";
import { preloadGameImages } from "@/lib/cartoon-image";
import type { WordResponse } from "@/lib/api/vocabulary";
import type { Word } from "@/lib/types";
import { isValidJyutping } from "@/lib/language-utils";

interface QuizGameProps {
  childId: string;
  onClose: () => void;
}

const FALLBACK_BG = [
  "from-pink-200 to-rose-100",
  "from-sky-200 to-cyan-100",
  "from-violet-200 to-purple-100",
  "from-amber-200 to-yellow-100",
  "from-emerald-200 to-green-100",
  "from-orange-200 to-amber-100",
];

function calcStars(score: number, total: number): number {
  const pct = score / total;
  return pct >= 0.9 ? 3 : pct >= 0.6 ? 2 : 1;
}

const TOTAL_ROUNDS = 10;

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

function playCorrectAnswerChime() {
  if (typeof window === "undefined") {
    return;
  }

  const AudioContextCtor =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextCtor) {
    return;
  }

  try {
    const audioContext = new AudioContextCtor();
    const gainNode = audioContext.createGain();
    gainNode.connect(audioContext.destination);
    gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.14, audioContext.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.65);

    const notes = [659.25, 783.99, 987.77];
    notes.forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(
        frequency,
        audioContext.currentTime + index * 0.11,
      );
      oscillator.connect(gainNode);
      oscillator.start(audioContext.currentTime + index * 0.11);
      oscillator.stop(audioContext.currentTime + index * 0.11 + 0.22);
    });

    window.setTimeout(() => {
      void audioContext.close().catch(() => undefined);
    }, 900);
  } catch {
    // Ignore browsers that block synthesized audio until a stronger gesture is available.
  }
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

type MascotMood = "idle" | "excited" | "sad" | "thinking" | "celebrating";

const MOOD_ANIMATION: Record<MascotMood, string> = {
  idle: "animate-mascot-bob",
  excited: "animate-mascot-jump",
  sad: "animate-mascot-sad",
  thinking: "animate-mascot-tilt",
  celebrating: "animate-mascot-dance",
};

const MOOD_BUBBLE: Record<MascotMood, string | null> = {
  idle: null,
  excited: "你好叻！🌟",
  sad: "再試試！💪",
  thinking: "諗諗吓…",
  celebrating: "你最叻！🎉",
};

function MascotPanda({ mood, size = 110 }: { mood: MascotMood; size?: number }) {
  const bubble = MOOD_BUBBLE[mood];
  const anim = MOOD_ANIMATION[mood];

  // Mouth path per mood
  const mouthPath =
    mood === "celebrating"
      ? "M 34 74 Q 50 86 66 74"         // huge grin
      : mood === "excited"
      ? "M 36 72 Q 50 82 64 72"         // big smile
      : mood === "sad"
      ? "M 36 78 Q 50 70 64 78"         // frown
      : mood === "thinking"
      ? "M 38 74 Q 50 77 62 74"         // slight smile
      : "M 37 73 Q 50 80 63 73";        // idle normal smile

  // Eyes per mood — happy ones slightly squint
  const eyeOpenY: Record<MascotMood, number> = {
    idle: 0, excited: 2, sad: -3, thinking: 0, celebrating: 3,
  };
  const eyeDelta = eyeOpenY[mood];
  // Eyebrow tilt for sad/thinking
  const browLeft  = mood === "sad"      ? "M 24 48 Q 34 44 38 46"
                  : mood === "thinking" ? "M 24 47 Q 34 46 38 47"
                  :                       "M 24 48 Q 34 45 38 47";
  const browRight = mood === "sad"      ? "M 62 46 Q 66 44 76 48"
                  : mood === "thinking" ? "M 62 47 Q 66 46 76 47"
                  :                       "M 62 47 Q 66 45 76 48";

  return (
    <div className="relative flex flex-col items-center select-none">
      {bubble && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white rounded-2xl px-3 py-1.5 shadow-lg border-2 border-purple-200 text-sm font-black text-slate-700 whitespace-nowrap animate-pop-in z-10">
          {bubble}
          <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 text-purple-300 text-base leading-none">▼</span>
        </div>
      )}
      <div className={anim} style={{ width: size, height: Math.round(size * 1.22) }}>
        {/* 100×122 internal coordinate space */}
        <svg width={size} height={Math.round(size * 1.22)} viewBox="0 0 100 122" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* ── Purple star hat ── */}
          <ellipse cx="50" cy="7" rx="22" ry="8" fill="#a855f7" opacity="0.25"/>
          <polygon points="50,0 53.8,11 65,11 56,18 59,29 50,22 41,29 44,18 35,11 46.2,11" fill="#facc15" stroke="#f59e0b" strokeWidth="0.8"/>
          {/* ── Ears ── */}
          <circle cx="20" cy="28" r="17" fill="#1e293b"/>
          <circle cx="20" cy="28" r="9"  fill="#334155"/>
          <circle cx="80" cy="28" r="17" fill="#1e293b"/>
          <circle cx="80" cy="28" r="9"  fill="#334155"/>
          {/* ── Head ── */}
          <circle cx="50" cy="52" r="36" fill="white" stroke="#e2e8f0" strokeWidth="1.5"/>
          {/* ── Body ── */}
          <ellipse cx="50" cy="103" rx="26" ry="19" fill="white" stroke="#e2e8f0" strokeWidth="1.2"/>
          {/* tummy patch */}
          <ellipse cx="50" cy="104" rx="16" ry="12" fill="#f8fafc"/>
          {/* ── Arms / paws ── */}
          <ellipse cx="17" cy="96" rx="11" ry="7" fill="#1e293b" transform="rotate(-30 17 96)"/>
          <ellipse cx="15" cy="101" rx="7" ry="5"  fill="#374151" transform="rotate(-30 15 101)"/>
          <ellipse cx="83" cy="96" rx="11" ry="7" fill="#1e293b" transform="rotate(30 83 96)"/>
          <ellipse cx="85" cy="101" rx="7" ry="5"  fill="#374151" transform="rotate(30 85 101)"/>
          {/* ── Feet ── */}
          <ellipse cx="34" cy="118" rx="12" ry="7" fill="#1e293b"/>
          <ellipse cx="66" cy="118" rx="12" ry="7" fill="#1e293b"/>
          {/* ── Eye patches ── */}
          <ellipse cx="33" cy={52 + eyeDelta} rx="13" ry="12" fill="#1e293b"/>
          <ellipse cx="67" cy={52 + eyeDelta} rx="13" ry="12" fill="#1e293b"/>
          {/* ── Eyes white ── */}
          <circle cx="33" cy={52 + eyeDelta} r="8" fill="white"/>
          <circle cx="67" cy={52 + eyeDelta} r="8" fill="white"/>
          {/* ── Pupils ── */}
          <circle cx="34.5" cy={53 + eyeDelta} r="5" fill="#0f172a"/>
          <circle cx="68.5" cy={53 + eyeDelta} r="5" fill="#0f172a"/>
          {/* ── Iris shine ── */}
          <circle cx="36.5" cy={50.5 + eyeDelta} r="1.8" fill="white"/>
          <circle cx="70.5" cy={50.5 + eyeDelta} r="1.8" fill="white"/>
          {/* ── Eyebrows ── */}
          <path d={browLeft}  stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
          <path d={browRight} stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
          {/* ── Nose ── */}
          <ellipse cx="50" cy="63" rx="5.5" ry="3.5" fill="#1e293b"/>
          {/* ── Mouth ── */}
          <path d={mouthPath} stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
          {/* ── Blush ── */}
          <circle cx="15" cy="62" r="9" fill="#fda4af" opacity="0.5"/>
          <circle cx="85" cy="62" r="9" fill="#fda4af" opacity="0.5"/>
          {/* ── Belly button dot ── */}
          <circle cx="50" cy="107" r="2" fill="#e2e8f0"/>
        </svg>
      </div>
    </div>
  );
}

export function QuizGame({ childId, onClose }: QuizGameProps) {
  const [words, setWords] = useState<WordResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState({ loaded: 0, total: 0 });
  const [mascotMood, setMascotMood] = useState<MascotMood>("idle");

  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [correctWord, setCorrectWord] = useState<WordResponse | null>(null);
  const [options, setOptions] = useState<WordResponse[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  // Duolingo-style: track wrong attempts per round
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false); // highlight correct tile
  const [showConfetti, setShowConfetti] = useState(false);
  const [xpEarned, setXpEarned] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const { playWord, isPlaying } = useWordAudio();
  const startTimeRef = useRef<number>(Date.now());
  const wordsSeen = useRef<string[]>([]);
  const wordsCorrect = useRef<string[]>([]);

  useEffect(() => {
    void (async () => {

      const data = await getWords({
        childId,
        includeExternal: true,
        includeMongodb: true,
        limit: 200,
      });
      const filtered = data.filter((w) => w.image_url && w.word_cantonese && w.word_cantonese.trim() !== "" && w.word_cantonese !== w.word && isValidJyutping(w.jyutping));
      // Prioritise words the child captured themselves (with their own photos)
      const captured = shuffle(filtered.filter((w) => !!w.created_by_child_id));
      const defaults = shuffle(filtered.filter((w) => !w.created_by_child_id));
      const capturedSlots = Math.min(captured.length, 10);
      const selected = [...captured.slice(0, capturedSlots), ...defaults].slice(0, 20);

      // Pre-load all images so they appear instantly in the game

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

      setWords(selected);
      setLoading(false);
    })();
  }, []);

  const setupRound = useCallback(
    (wordPool: WordResponse[], roundIndex: number) => {
      if (roundIndex >= TOTAL_ROUNDS || roundIndex >= wordPool.length) return;
      const correct = wordPool[roundIndex];
      const others = shuffle(
        wordPool.filter((w) => w.id !== correct.id),
      ).slice(0, 3);
      setCorrectWord(correct);
      setOptions(shuffle([correct, ...others]));
      setSelected(null);
      setWrongAttempts(0);
      setShowAnswer(false);
    },
    [],
  );

  useEffect(() => {
    if (words.length > 0) setupRound(words, round);
  }, [words, round, setupRound]);

  // Auto-play audio for each new round
  useEffect(() => {
    if (!correctWord || loading) return;
    const timer = setTimeout(() => {
      void playWord(wordResponseToWord(correctWord), {
        languagePreference: "cantonese",
      });
    }, 700);
    return () => clearTimeout(timer);
  }, [correctWord, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleReplay = () => {
    if (!correctWord) return;
    void playWord(wordResponseToWord(correctWord), {
      languagePreference: "cantonese",
    });
  };

  const advanceRound = () => {
    confetti.reset();
    setMascotMood("idle");
    const nextRound = round + 1;
    if (nextRound >= TOTAL_ROUNDS || nextRound >= words.length) {
      setRound(TOTAL_ROUNDS);
    } else {
      setRound(nextRound);
    }
  };

  const handleSelect = (wordId: string) => {
    if (!correctWord) return;
    // Once the correct answer is highlighted, only allow tapping the correct tile
    if (showAnswer && wordId !== correctWord.id) return;
    // Already locked on a wrong attempt that's animating — ignore rapid taps
    if (selected && selected !== correctWord.id) return;

    const isCorrect = wordId === correctWord.id;

    if (isCorrect) {
      setSelected(wordId);
      if (!wordsSeen.current.includes(correctWord.id))
        wordsSeen.current = [...wordsSeen.current, correctWord.id];
      // Only award score if child got it right on first try
      if (wrongAttempts === 0) {
        setScore((s) => s + 1);
        wordsCorrect.current = [...wordsCorrect.current, correctWord.id];
      }
      setMascotMood("excited");
      playCorrectAnswerChime();
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        ticks: 100,
        gravity: 1.5,
        colors: ['#a855f7', '#ec4899', '#3b82f6', '#22c55e', '#eab308'],
      });
      setTimeout(advanceRound, 1300);
    } else {
      // Wrong tap
      const newWrong = wrongAttempts + 1;
      setWrongAttempts(newWrong);
      if (!wordsSeen.current.includes(correctWord.id))
        wordsSeen.current = [...wordsSeen.current, correctWord.id];

      // Show shake on wrong tile briefly
      setSelected(wordId);
      setMascotMood("sad");

      // Replay audio to give another chance
      void playWord(wordResponseToWord(correctWord), { languagePreference: "cantonese" });

      setTimeout(() => {
        setSelected(null);
        setMascotMood("idle");
        // After 2nd wrong: reveal correct answer and wait for child to tap it
        if (newWrong >= 2) {
          setShowAnswer(true);
        }
      }, 800);
    }
  };

  const saveSession = useCallback(async (finalScore: number) => {
    setSaving(true);
    const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
    const stars = calcStars(finalScore, TOTAL_ROUNDS);
    const resp = await recordGameSession("quiz", {
      child_id: childId,
      score: finalScore,
      max_score: TOTAL_ROUNDS,
      duration_seconds: duration,
      words_seen: wordsSeen.current,
      words_correct: wordsCorrect.current,
      stars,
    });
    setXpEarned(resp?.xp_earned ?? null);
    setSaving(false);
  }, [childId]);

  useEffect(() => {
    if (round >= TOTAL_ROUNDS && words.length > 0) void saveSession(score);
  }, [round]); // eslint-disable-line react-hooks/exhaustive-deps

  const restart = () => {
    const reshuffled = shuffle(words);
    setWords(reshuffled);
    setRound(0);
    setScore(0);
    setSelected(null);
    setXpEarned(null);
    setMascotMood("idle");
    wordsSeen.current = [];
    wordsCorrect.current = [];
    startTimeRef.current = Date.now();
  };

  const isGameOver = round >= TOTAL_ROUNDS;

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="fixed inset-0 z-[60] bg-gradient-to-b from-purple-100 to-indigo-100 flex items-center justify-center">
        <div className="relative flex flex-col items-center gap-4">
          <p className="text-slate-600 font-black text-lg">準備緊…</p>
          {loadProgress.total > 0 && (
            <div className="w-48 mt-3">
              <div className="h-2 bg-purple-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.round((loadProgress.loaded / loadProgress.total) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-purple-400 text-center mt-1">
                載入圖片 {loadProgress.loaded}/{loadProgress.total}
              </p>
            </div>
          )}
          {/* Pulsing dots */}
          <div className="flex gap-2 mt-2">
            <span className="w-3 h-3 rounded-full bg-purple-400 animate-dot-1" />
            <span className="w-3 h-3 rounded-full bg-purple-500 animate-dot-2" />
            <span className="w-3 h-3 rounded-full bg-purple-400 animate-dot-3" />
          </div>
        </div>
      </div>
    );
  }

  /* ── Game Over ── */
  if (isGameOver) {
    const stars = calcStars(score, TOTAL_ROUNDS);
    const encouragement =
      stars === 3 ? "你最叻！繼續保持！🏆" :
      stars === 2 ? "做得好！再練習會更好！🌟" :
                   "唔緊要，繼續加油！⭐";

    setTimeout(() => {
      confetti({
        particleCount: stars >= 2 ? 150 : 60,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#a855f7', '#3b82f6', '#fbbf24'],
      });
    }, 300);

    return (
      <div className="fixed inset-0 z-[60] bg-gradient-to-b from-purple-100 to-indigo-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-[40px] p-8 text-center max-w-sm w-full shadow-2xl">
          <h2 className="text-3xl font-black text-slate-700 mb-4">完成！</h2>
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
          <div className="flex gap-4">
            <button
              onClick={restart}
              className="flex-1 bg-gradient-to-b from-purple-400 to-purple-600 text-white rounded-2xl py-3 font-bold flex items-center justify-center gap-2 shadow-[0_6px_0_#6b21a8] active:translate-y-1 active:shadow-none transition-all"
            >
              <RotateCcw className="w-5 h-5" /> 再玩一次
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 text-slate-600 rounded-2xl py-3 font-bold active:scale-95 transition-transform border-b-4 border-gray-300"
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
    <div className="fixed inset-0 z-[60] bg-gradient-to-b from-purple-100 to-indigo-100 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-16 pb-3">
        <button
          onClick={onClose}
          className="w-10 h-10 bg-white/70 rounded-full flex items-center justify-center shadow-sm"
        >
          <X className="w-5 h-5 text-slate-600" />
        </button>
        <div className="bg-white/70 backdrop-blur-sm px-4 py-1.5 rounded-full font-bold text-slate-700 shadow-sm">
          {round + 1} / {TOTAL_ROUNDS}
        </div>
        <div className="bg-purple-500 px-4 py-1.5 rounded-full font-bold text-white shadow-sm">
          ⭐ {score}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mx-4 h-2 bg-white/50 rounded-full overflow-hidden">
        <div
          className="h-full bg-purple-500 rounded-full transition-all duration-500"
          style={{ width: `${(round / TOTAL_ROUNDS) * 100}%` }}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 gap-4 py-2 overflow-y-auto min-h-0">
        {/* Audio prompt */}
        <div className="flex flex-col items-center gap-2 shrink-0">
          <p className="text-slate-700 font-black text-xl text-center bg-white/50 px-5 py-1.5 rounded-full border-2 border-purple-200 shadow-sm">
            聽聲音，選出正確的圖片！
          </p>
          <button
            onClick={handleReplay}
            className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center transition-all active:scale-90 active:translate-y-1 active:shadow-none ${
              isPlaying
                ? "bg-gradient-to-b from-purple-400 to-purple-500 scale-110 animate-pulse shadow-[0_4px_0_#6b21a8]"
                : "bg-gradient-to-b from-purple-400 to-purple-600 shadow-[0_4px_0_#6b21a8,0_6px_12px_rgba(107,33,168,0.2)]"
            }`}
          >
            <Volume2 className="w-7 h-7 text-white drop-shadow-md" />
          </button>
        </div>

        {/* 2×2 image grid */}
        <div className="grid grid-cols-2 gap-4 w-full max-w-sm shrink-0">
          {options.map((opt) => {
            const isCorrect = opt.id === correctWord?.id;
            const isSelected = selected === opt.id;
            // Show green glow on correct tile once showAnswer is active
            const isHighlighted = showAnswer && isCorrect;

            let borderClass = "border-4 border-white shadow-[0_6px_0_rgba(0,0,0,0.08)]";
            if (isSelected && isCorrect)
              borderClass = "border-4 border-green-400 shadow-[0_6px_0_#22c55e]";
            else if (isSelected && !isCorrect)
              borderClass = "border-4 border-red-400 shadow-[0_6px_0_#ef4444]";
            else if (isHighlighted)
              borderClass = "border-4 border-green-400 shadow-[0_6px_0_#22c55e] animate-pulse";

            // Dim non-highlighted tiles when answer is revealed
            const dimmed = showAnswer && !isCorrect ? "opacity-40" : "";

            return (
              <button
                key={opt.id}
                onClick={() => handleSelect(opt.id)}
                disabled={false}
                className={`group relative aspect-square rounded-[32px] overflow-hidden bg-white/90 transition-all hover:scale-[1.02] active:scale-95 active:translate-y-1 active:shadow-none ${borderClass} ${dimmed} ${isSelected && isCorrect ? "animate-correct-celebrate" : ""}`}
              >
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />
                <CartoonWordImage
                  wordId={opt.id}
                  word={opt.word}
                  wordCantonese={opt.word_cantonese}
                  category={opt.category}
                  existingImageUrl={opt.image_url}
                  className="w-full h-full p-1"
                  emojiSize="text-4xl"
                  placeholderBg={`bg-gradient-to-br ${getFallbackBg(opt.id)}`}
                />
              </button>
            );
          })}
        </div>

        {/* Feedback text */}
        {selected && (
          <div
            className={`text-2xl font-black py-1.5 px-6 rounded-full shadow-lg bg-white/90 border-2 animate-pop-in shrink-0 ${
              selected === correctWord?.id 
                ? "text-green-600 border-green-200" 
                : "text-red-500 border-red-200"
            }`}
          >
            {selected === correctWord?.id
              ? "🎉 答對了！"
              : `❌ 是「${correctWord?.word_cantonese || correctWord?.word}」`}
          </div>
        )}
      </div>
    </div>
  );
}
