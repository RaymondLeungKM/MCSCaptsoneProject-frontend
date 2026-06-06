"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff, RotateCcw, Star, Volume2, X, Zap } from "lucide-react";
import confetti from "canvas-confetti";
import { API_BASE_URL } from "@/lib/api/client";
import { getWords } from "@/lib/api/vocabulary";
import { recordGameSession } from "@/lib/api/games";
import { Confetti } from "./confetti";
import { CartoonWordImage } from "./cartoon-word-image";
import { preloadGameImages } from "@/lib/cartoon-image";
import { isValidJyutping } from "@/lib/language-utils";
import { useWordAudio } from "@/hooks/use-word-audio";
import type { WordResponse } from "@/lib/api/vocabulary";
import type { Word } from "@/lib/types";

interface SpeakingGameProps {
  childId: string;
  onClose: () => void;
}

type RoundResult = "correct" | "partial" | "incorrect" | null;
type MicErrorKind = "permission" | "device" | "network" | "unknown" | null;

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
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

function scoreTranscript(heard: string, target: string): RoundResult {
  if (!heard) return "incorrect";
  
  // Normalize by removing basic punctuation and common filler/mismatch characters
  // but keeping actual Cantonese/CJK characters intact for comparison
  const normalize = (str: string) => 
    str.trim().toLowerCase()
      .replace(/[.,!?。，！？、\s]/g, "");

  const h = normalize(heard);
  const t = normalize(target);
  
  if (!h) return "incorrect";
  
  // 1. Direct match or containment (Very strong)
  if (h === t || h.includes(t) || t.includes(h)) return "correct";
  
  // 2. Fuzzy match based on individual character presence (Good for spoken phrases)
  const targetChars = [...t];
  const heardChars = new Set([...h]);
  const matchedChars = targetChars.filter(c => heardChars.has(c));
  const overlapRatio = matchedChars.length / targetChars.length;
  
  if (overlapRatio >= 0.75) return "correct";
  if (overlapRatio >= 0.45) return "partial";
  
  return "incorrect";
}

function getPreferredRecordingMimeType(): string | undefined {
  if (typeof window === "undefined" || typeof MediaRecorder === "undefined") return undefined;
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/wav"];
  return candidates.find((c) => MediaRecorder.isTypeSupported(c));
}

function getAudioExtension(mimeType: string): string {
  if (mimeType.includes("wav")) return ".wav";
  if (mimeType.includes("mp4") || mimeType.includes("m4a")) return ".m4a";
  return ".webm";
}

const TOTAL_ROUNDS = 8;

export function SpeakingGame({ childId, onClose }: SpeakingGameProps) {
  const [words, setWords] = useState<WordResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState({ loaded: 0, total: 0 });

  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState<RoundResult>(null);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [micError, setMicError] = useState<string | null>(null);
  const [micErrorKind, setMicErrorKind] = useState<MicErrorKind>(null);
  const [micPermissionGranted, setMicPermissionGranted] = useState(false);
  const [practiceMode, setPracticeMode] = useState(false);
  const [practiceModeMessage, setPracticeModeMessage] = useState<string | null>(null);
  const [preferBackendStt, setPreferBackendStt] = useState(false);
  const [isBackendRecording, setIsBackendRecording] = useState(false);
  const [isBackendValidating, setIsBackendValidating] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [xpEarned, setXpEarned] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  // Duolingo-style hint escalation
  const [wrongAttemptsThisRound, setWrongAttemptsThisRound] = useState(0);
  const [showJyutping, setShowJyutping] = useState(false);
  const recognitionRef = useRef<any>(null);
  const autoStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backendRecorderRef = useRef<MediaRecorder | null>(null);
  const backendStreamRef = useRef<MediaStream | null>(null);
  const backendChunksRef = useRef<Blob[]>([]);
  const backendStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { playWord, isPlaying } = useWordAudio();
  const startTimeRef = useRef<number>(Date.now());
  const wordsSeenRef = useRef<string[]>([]);
  const wordsCorrectRef = useRef<string[]>([]);

  const requestMicrophoneAccess = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicPermissionGranted(false);
      setMicErrorKind("device");
      setMicError("搵唔到麥克風，試下插返入或者允許使用 🎤");
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setMicPermissionGranted(true);
      setMicError(null);
      setMicErrorKind(null);
      return true;
    } catch (err: any) {
      console.warn("[SpeakingGame] Mic permission denied:", err);
      setMicPermissionGranted(false);

      if (err?.name === "NotAllowedError") {
        setMicErrorKind("permission");
        setMicError("需要允許使用麥克風先可以玩呢個遊戲 🎤");
      } else {
        setMicErrorKind("device");
        setMicError("搵唔到麥克風，試下插返入或者允許使用 🎤");
      }

      return false;
    }
  }, []);

  useEffect(() => {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) {
      setSpeechSupported(false);
      // Try the backend Whisper endpoint instead of jumping to practice mode.
      setPreferBackendStt(true);
    }
    void requestMicrophoneAccess();
  }, [requestMicrophoneAccess]);

  useEffect(() => {
    void (async () => {
      const data = await getWords({
        childId,
        includeExternal: true,
        includeMongodb: true,
        limit: 200,
      });
      const selected = shuffle(data.filter((w) => w.image_url && w.word_cantonese && w.word_cantonese.trim() !== "" && w.word_cantonese !== w.word && isValidJyutping(w.jyutping))).slice(0, TOTAL_ROUNDS);

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

      setWords(selected);
      setLoading(false);
    })();
  }, []);

  const currentWord = words[round];

  const playCurrentWord = useCallback(() => {
    if (!currentWord) return;
    void playWord(wordResponseToWord(currentWord), {
      languagePreference: "cantonese",
    });
  }, [currentWord, playWord]);

  // Auto-play when round changes
  useEffect(() => {
    if (!currentWord || loading) return;
    const timer = setTimeout(playCurrentWord, 500);
    return () => clearTimeout(timer);
  }, [currentWord, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  const nextRound = useCallback(() => {
    setResult(null);
    setTranscript("");
    setWrongAttemptsThisRound(0);
    setShowJyutping(false);
    setRound((r) => r + 1);
  }, []);

  const markCurrentWordSeen = useCallback((wasCorrect: boolean) => {
    if (!currentWord) return;

    if (!wordsSeenRef.current.includes(currentWord.id)) {
      wordsSeenRef.current = [...wordsSeenRef.current, currentWord.id];
    }

    if (wasCorrect && !wordsCorrectRef.current.includes(currentWord.id)) {
      wordsCorrectRef.current = [...wordsCorrectRef.current, currentWord.id];
    }
  }, [currentWord]);

  const handleCorrectRound = useCallback(() => {
    markCurrentWordSeen(true);
    setScore((s) => s + 1);

    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
      ticks: 100,
      gravity: 1.5,
      colors: ['#f97316', '#fbbf24', '#3b82f6', '#10b981', '#ffffff']
    });

    setTimeout(() => {
      confetti.reset();
      nextRound();
    }, 1500);
  }, [markCurrentWordSeen, nextRound]);

  const activatePracticeMode = useCallback((message: string) => {
    setIsListening(false);
    setMicError(null);
    setMicErrorKind(null);
    setPracticeMode(true);
    setPracticeModeMessage(message);
  }, []);

  const handlePracticeSuccess = useCallback(() => {
    setResult("correct");
    handleCorrectRound();
  }, [handleCorrectRound]);

  const handlePracticeSkip = useCallback(() => {
    markCurrentWordSeen(false);
    setResult(null);
    setTranscript("");
    nextRound();
  }, [markCurrentWordSeen, nextRound]);

  const applyTranscriptResult = useCallback((heard: string) => {
    const trimmed = (heard || "").trim();
    setTranscript(trimmed);
    setMicError(null);
    setMicErrorKind(null);

    const target = currentWord?.word_cantonese || currentWord?.word || "";
    const r: RoundResult = trimmed ? scoreTranscript(trimmed, target) : "incorrect";
    setResult(r);

    if (r === "correct") {
      handleCorrectRound();
      return;
    }

    markCurrentWordSeen(false);
    setWrongAttemptsThisRound((prev) => {
      const newCount = prev + 1;
      if (newCount >= 2) setShowJyutping(true);
      if (newCount >= 4) {
        setTimeout(() => { nextRound(); }, 1800);
      } else {
        setTimeout(() => { void playCurrentWord(); }, 400);
        setTimeout(() => { void playCurrentWord(); }, 1400);
        setTimeout(() => { setResult(null); setTranscript(""); }, 2200);
      }
      return newCount;
    });
  }, [currentWord, handleCorrectRound, markCurrentWordSeen, nextRound, playCurrentWord]);

  const validateWithBackend = useCallback(async (audioBlob: Blob, mimeType: string): Promise<boolean> => {
    if (!currentWord) return false;
    try {
      setIsBackendValidating(true);
      const ext = getAudioExtension(mimeType);
      const form = new FormData();
      form.append("audio", audioBlob, `speaking${ext}`);
      form.append("word_cantonese", currentWord.word_cantonese || "");
      form.append("jyutping", currentWord.jyutping || "");
      form.append("word_id", currentWord.id);
      form.append("language", "yue");
      const resp = await fetch(`${API_BASE_URL}/audio/validate-pronunciation`, {
        method: "POST",
        body: form,
      });
      if (!resp.ok) return false;
      const data = await resp.json();
      const heard = typeof data?.heard === "string" ? data.heard : "";
      applyTranscriptResult(heard);
      return true;
    } catch (err) {
      console.warn("[SpeakingGame] backend STT failed:", err);
      return false;
    } finally {
      setIsBackendValidating(false);
    }
  }, [applyTranscriptResult, currentWord]);

  const recordAndValidateBackend = useCallback(async (): Promise<boolean> => {
    if (typeof MediaRecorder === "undefined") return false;
    if (!currentWord) return false;

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err: any) {
      if (err?.name === "NotAllowedError") {
        setMicErrorKind("permission");
        setMicError("需要允許使用麥克風先可以玩呢個遊戲 🎤");
      } else {
        setMicErrorKind("device");
        setMicError("搵唔到麥克風，試下插返入或者允許使用 🎤");
      }
      return false;
    }

    const mimeType = getPreferredRecordingMimeType() || "audio/webm";
    let recorder: MediaRecorder;
    try {
      recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    } catch {
      stream.getTracks().forEach((t) => t.stop());
      return false;
    }

    backendRecorderRef.current = recorder;
    backendStreamRef.current = stream;
    backendChunksRef.current = [];

    return await new Promise<boolean>((resolve) => {
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) backendChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        if (backendStopTimerRef.current) {
          clearTimeout(backendStopTimerRef.current);
          backendStopTimerRef.current = null;
        }
        stream.getTracks().forEach((t) => t.stop());
        backendStreamRef.current = null;
        backendRecorderRef.current = null;
        const blob = new Blob(backendChunksRef.current, { type: mimeType });
        backendChunksRef.current = [];
        setIsBackendRecording(false);
        if (blob.size === 0) { resolve(false); return; }
        const ok = await validateWithBackend(blob, mimeType);
        resolve(ok);
      };
      setIsBackendRecording(true);
      setMicError(null);
      setMicErrorKind(null);
      try {
        recorder.start();
      } catch {
        setIsBackendRecording(false);
        stream.getTracks().forEach((t) => t.stop());
        resolve(false);
        return;
      }
      backendStopTimerRef.current = setTimeout(() => {
        try { if (recorder.state !== "inactive") recorder.stop(); } catch {}
      }, 4000);
    });
  }, [currentWord, validateWithBackend]);

  const stopBackendRecording = useCallback(() => {
    if (backendStopTimerRef.current) {
      clearTimeout(backendStopTimerRef.current);
      backendStopTimerRef.current = null;
    }
    const rec = backendRecorderRef.current;
    if (rec && rec.state !== "inactive") {
      try { rec.stop(); } catch {}
    }
  }, []);

  const startListening = useCallback(async () => {
    if (preferBackendStt) {
      const granted = micPermissionGranted || (await requestMicrophoneAccess());
      if (!granted) return;
      const ok = await recordAndValidateBackend();
      if (!ok) {
        activatePracticeMode("語音服務暫時用唔到，已切換到練習模式 🌐");
      }
      return;
    }

    if (!speechSupported) return;

    if (!micPermissionGranted) {
      const granted = await requestMicrophoneAccess();
      if (!granted) return;
    }

    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) {
      setSpeechSupported(false);
      return;
    }

    setMicError(null);
    setMicErrorKind(null);
    setPracticeMode(false);
    setPracticeModeMessage(null);

    const recognition = new SR();
    recognitionRef.current = recognition;

    recognition.lang = "zh-HK";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 5;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => {
      setIsListening(false);
      if (autoStopTimerRef.current) clearTimeout(autoStopTimerRef.current);
    };

    recognition.onresult = (event: any) => {
      const alternatives: string[] = Array.from(
        { length: event.results[0].length },
        (_, i) => event.results[0][i].transcript,
      );

      setMicError(null);
      setMicErrorKind(null);

      // Let's take the best alternative but also scan all alternatives
      // for the target word to be more forgiving.
      const bestHeard = event.results[0][0].transcript;
      const anyAlternativeMatches = alternatives.some((alt) => {
        const res = scoreTranscript(alt, currentWord?.word_cantonese || currentWord?.word || "");
        return res === "correct";
      });

      setTranscript(bestHeard);

      const target = currentWord?.word_cantonese || currentWord?.word || "";
      let r = scoreTranscript(bestHeard, target);

      if (r !== "correct" && anyAlternativeMatches) {
        r = "correct";
      }

      setResult(r);

      if (r === "correct") {
        handleCorrectRound();
      } else {
        markCurrentWordSeen(false);
        setWrongAttemptsThisRound((prev) => {
          const newCount = prev + 1;
          if (newCount >= 2) setShowJyutping(true);
          if (newCount >= 4) {
            setTimeout(() => {
              nextRound();
            }, 1800);
          } else {
            setTimeout(() => {
              void playCurrentWord();
            }, 400);
            setTimeout(() => {
              void playCurrentWord();
            }, 1400);
            setTimeout(() => {
              setResult(null);
              setTranscript("");
            }, 2200);
          }
          return newCount;
        });
      }
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      if (autoStopTimerRef.current) clearTimeout(autoStopTimerRef.current);

      const errorType = event?.error || "";
      switch (errorType) {
        case "not-allowed":
          setMicErrorKind("permission");
          setMicError("需要允許使用麥克風先可以玩呢個遊戲 🎤");
          break;
        case "audio-capture":
          setMicErrorKind("device");
          setMicError("搵唔到麥克風，試下插返入或者允許使用 🎤");
          break;
        case "no-speech":
          setMicErrorKind(null);
          setTranscript("");
          break;
        case "network":
          // Browser-level network (typical Edge/Chromium failure). Switch to backend
          // STT immediately and re-record so Edge can score like Safari.
          setPreferBackendStt(true);
          void (async () => {
            const ok = await recordAndValidateBackend();
            if (!ok) activatePracticeMode("語音服務暫時連線唔到，已切換到練習模式 🌐");
          })();
          break;
        case "aborted":
          setMicErrorKind(null);
          break;
        default:
          setPreferBackendStt(true);
          void (async () => {
            const ok = await recordAndValidateBackend();
            if (!ok) activatePracticeMode("語音功能暫時用唔到，已切換到練習模式 🎤");
          })();
          break;
      }
    };

    try {
      recognition.start();
    } catch (err) {
      console.warn("[SpeakingGame] Failed to start recognition:", err);
      activatePracticeMode("語音功能暫時用唔到，已切換到練習模式 🎤");
      return;
    }

    autoStopTimerRef.current = setTimeout(() => {
      recognitionRef.current?.stop();
    }, 5000);
  }, [activatePracticeMode, currentWord, handleCorrectRound, markCurrentWordSeen, micPermissionGranted, nextRound, playCurrentWord, preferBackendStt, recordAndValidateBackend, requestMicrophoneAccess, speechSupported]);

  const handleMicRetry = useCallback(() => {
    void startListening();
  }, [startListening]);

  const handleResumeVoiceMode = useCallback(() => {
    setPracticeMode(false);
    setPracticeModeMessage(null);
    void startListening();
  }, [startListening]);

  const toggleListening = () => {
    if (preferBackendStt) {
      if (isBackendRecording) { stopBackendRecording(); return; }
      if (isBackendValidating) return;
      void startListening();
      return;
    }

    if (!speechSupported) return;

    // If already listening, stop
    if (isListening) {
      recognitionRef.current?.stop();
      if (autoStopTimerRef.current) clearTimeout(autoStopTimerRef.current);
      return;
    }
    void startListening();
  };

  const isGameOver = round >= TOTAL_ROUNDS || round >= words.length;
  const finalScore = Math.round(score);
  const canUseVoice = speechSupported || preferBackendStt;
  const showPracticePanel = !canUseVoice || practiceMode;
  const micActive = isListening || isBackendRecording;
  const practicePanelMessage = !canUseVoice
    ? "此設備未支援語音識別，已切換到練習模式 🎤"
    : (practiceModeMessage || "語音功能暫時用唔到，已切換到練習模式 🎤");

  const restart = () => {
    setWords((prev) => shuffle(prev));
    setRound(0);
    setScore(0);
    setResult(null);
    setTranscript("");
    setPracticeMode(false);
    setPracticeModeMessage(null);
    setMicError(null);
    setMicErrorKind(null);
    // Keep preferBackendStt sticky: if browser SR failed once, keep using backend.
    setXpEarned(null);
    wordsSeenRef.current = [];
    wordsCorrectRef.current = [];
    startTimeRef.current = Date.now();
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="fixed inset-0 z-[60] bg-gradient-to-b from-orange-100 to-amber-100 flex items-center justify-center">
        <div className="relative flex flex-col items-center gap-4">
          <p className="child-tab-section-title !text-lg !text-slate-600">準備緊…</p>
          {loadProgress.total > 0 && (
            <div className="w-48 mt-3">
              <div className="h-2 bg-orange-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.round((loadProgress.loaded / loadProgress.total) * 100)}%` }}
                />
              </div>
              <p className="child-tab-copy !mt-1 !text-center !text-xs !text-orange-400">
                載入圖片 {loadProgress.loaded}/{loadProgress.total}
              </p>
            </div>
          )}
          {/* Pulsing dots */}
          <div className="flex gap-2 mt-2">
            <span className="w-3 h-3 rounded-full bg-orange-400 animate-dot-1" />
            <span className="w-3 h-3 rounded-full bg-orange-500 animate-dot-2" />
            <span className="w-3 h-3 rounded-full bg-orange-400 animate-dot-3" />
          </div>
        </div>
      </div>
    );
  }

  /* ── Game Over ── */
  if (isGameOver) {
    const stars = finalScore >= 7 ? 3 : finalScore >= 5 ? 2 : 1;
    const encouragement =
      stars === 3 ? "你個發音超正！繼續保持！🏆" :
      stars === 2 ? "做得好！多練習會更好！🌟" :
                   "唔緊要，繼續加油！⭐";
    // Save session once (when saving is still false and xpEarned is null)
    if (!saving && xpEarned === null) {
      setSaving(true);
      void recordGameSession("speaking", {
        child_id: childId,
        score: finalScore,
        max_score: TOTAL_ROUNDS,
        duration_seconds: Math.round((Date.now() - startTimeRef.current) / 1000),
        words_seen: wordsSeenRef.current,
        words_correct: wordsCorrectRef.current,
        stars,
      }).then((resp) => {
        setXpEarned(resp?.xp_earned ?? 0);
        setSaving(false);
      });
    }
    return (
      <div className="fixed inset-0 z-[60] bg-gradient-to-b from-orange-100 to-amber-100 flex items-center justify-center p-6">
        <Confetti active={true} count={30} />
        <div className="bg-white rounded-[40px] p-8 text-center max-w-sm w-full shadow-2xl">
          <div className="text-7xl mb-3">
            {stars === 3 ? "🏆" : stars === 2 ? "🌟" : "⭐"}
          </div>
          <h2 className="child-tab-section-title !mb-1 !text-3xl !text-slate-700">完成！</h2>
          <p className="child-tab-section-copy !mb-3 !text-lg !font-bold">{encouragement}</p>
          <div className="flex justify-center gap-2 mb-4">
            {Array.from({ length: 3 }, (_, i) => (
              <Star
                key={i}
                className={`w-9 h-9 ${i < stars ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`}
              />
            ))}
          </div>
          {xpEarned != null && xpEarned > 0 && (
            <div className="child-tab-chip mb-4 !bg-yellow-100 !text-base !text-yellow-700 animate-pop-in">
              <Zap className="w-4 h-4" /> +{xpEarned} XP
            </div>
          )}
          {saving && <p className="child-tab-copy !mb-4 !text-sm !text-slate-400">儲存中…</p>}
          <div className="flex gap-3">
            <button
              onClick={restart}
              className="flex-1 bg-orange-500 text-white rounded-2xl py-3 font-bold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-transform"
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
    <div className="fixed inset-0 z-[60] bg-gradient-to-b from-orange-100 to-amber-100 flex flex-col">
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
        <div className="bg-orange-500 px-4 py-1.5 rounded-full font-bold text-white shadow-sm">
          ⭐ {finalScore}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mx-4 h-2 bg-white/50 rounded-full overflow-hidden">
        <div
          className="h-full bg-orange-500 rounded-full transition-all duration-500"
          style={{ width: `${(round / TOTAL_ROUNDS) * 100}%` }}
        />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col items-center justify-start pt-4 px-6 gap-4 overflow-y-auto pb-10">
        {/* Instruction */}
        <p className="child-tab-section-title !mt-0 !text-2xl !text-center !text-slate-700">
          聽聲音，讀出圖片
        </p>

        {/* Picture card */}
        <div className="bg-white rounded-[40px] p-4 text-center shadow-xl w-full max-w-sm border-4 border-orange-200">
          {currentWord ? (
            <CartoonWordImage
              wordId={currentWord.id}
              word={currentWord.word}
              wordCantonese={currentWord.word_cantonese}
              category={currentWord.category}
              existingImageUrl={currentWord.image_url}
              className="w-full h-[160px] rounded-3xl"
              emojiSize="text-7xl"
              placeholderBg="bg-orange-50"
              showLabel={false}
            />
          ) : (
            <div className="w-full h-[160px] rounded-3xl bg-orange-50 flex items-center justify-center text-7xl">
              🎨
            </div>
          )}
          
          {/* Jyutping hint (shown after 2nd wrong attempt) */}
          {showJyutping && currentWord?.jyutping && (
            <div className="mt-3 bg-orange-50 rounded-2xl px-4 py-2 animate-pop-in">
              <p className="child-tab-caption !text-slate-400">拼音（提示）</p>
              <p className="child-tab-section-title !mt-0 !text-2xl !text-orange-600">{currentWord.jyutping}</p>
            </div>
          )}

          {/* Audio replay button */}
          <button
            onClick={playCurrentWord}
            className={`mt-3 w-14 h-14 rounded-full flex items-center justify-center mx-auto transition-all active:scale-90 active:translate-y-1 active:shadow-none ${isPlaying ? "bg-gradient-to-b from-orange-400 to-orange-500 scale-110 animate-pulse shadow-[0_4px_0_#c2410c]" : "bg-gradient-to-b from-orange-400 to-orange-600 shadow-[0_4px_0_#c2410c,0_6px_12px_rgba(194,65,12,0.3)]"}`}
          >
            <Volume2
              className="w-8 h-8 text-white drop-shadow"
            />
          </button>
        </div>

        {/* Mic error banner */}
        {micError && (
          <div className="bg-amber-50 rounded-3xl p-4 text-center w-full max-w-xs">
            <p className="child-tab-card-copy !mb-3 !text-sm !font-bold !text-amber-700">
              {micError}
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={handleMicRetry}
                className="bg-orange-500 text-white px-5 py-2 rounded-xl font-bold text-sm active:scale-95 transition-transform"
              >
                {micErrorKind === "network" ? "🎤 再試發音" : "🔄 再試一次"}
              </button>
              {micErrorKind === "network" && (
                <button
                  onClick={() => {
                    setMicError(null);
                    setMicErrorKind(null);
                    setTranscript("");
                    setResult(null);
                    nextRound();
                  }}
                  className="bg-white text-slate-600 px-5 py-2 rounded-xl font-bold text-sm active:scale-95 transition-transform"
                >
                  下一題
                </button>
              )}
            </div>
          </div>
        )}

        {/* Practice mode fallback when live recognition is unavailable */}
        {showPracticePanel && !micError && !result && (
          <div className="bg-amber-50 rounded-3xl p-5 text-center w-full max-w-sm border border-amber-200 shadow-sm">
            <p className="child-tab-card-copy !mb-4 !font-bold !text-amber-700">
              {practicePanelMessage}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={playCurrentWord}
                className="bg-white text-orange-600 px-5 py-2 rounded-xl font-bold text-sm active:scale-95 transition-transform"
              >
                🔊 再聽一次
              </button>
              <button
                onClick={handlePracticeSuccess}
                className="bg-orange-500 text-white px-5 py-2 rounded-xl font-bold text-sm active:scale-95 transition-transform"
              >
                ✅ 我讀到啦
              </button>
              <button
                onClick={handlePracticeSkip}
                className="bg-white text-slate-600 px-5 py-2 rounded-xl font-bold text-sm active:scale-95 transition-transform"
              >
                下一題
              </button>
            </div>
            {speechSupported && (
              <button
                onClick={handleResumeVoiceMode}
                className="mt-3 text-xs font-bold text-amber-700 underline underline-offset-4"
              >
                試返語音
              </button>
            )}
          </div>
        )}

        {/* Microphone button — click to toggle */}
        {canUseVoice && !showPracticePanel && !result && !micError && (
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={toggleListening}
              disabled={isBackendValidating}
            className={`w-[80px] h-[80px] rounded-full flex items-center justify-center shadow-xl transition-all select-none
                ${micActive
                  ? "bg-gradient-to-b from-red-400 to-red-600 scale-110 animate-pulse shadow-[0_6px_0_#991b1b]"
                  : "bg-gradient-to-b from-orange-400 to-orange-600 active:scale-90 active:translate-y-1 active:shadow-none shadow-[0_8px_0_#c2410c]"}
                ${isBackendValidating ? "opacity-70 cursor-wait" : ""}`}
            >
              {micActive ? (
                <MicOff className="w-8 h-8 text-white" />
              ) : (
                <Mic className="w-8 h-8 text-white" />
              )}
            </button>
            {micActive ? (
              <div className="flex items-end gap-1.5 h-10">
                {[1,2,3,4,5,6].map((n) => (
                  <div key={n} className="wave-bar w-2.5 bg-red-400 rounded-full" />
                ))}
              </div>
            ) : isBackendValidating ? (
              <p className="child-tab-section-title !mt-0 !text-lg !text-slate-700 bg-white/50 px-6 py-2 rounded-full border-2 border-orange-200">
                識別中… 🌐
              </p>
            ) : (
              <p className="child-tab-section-title !mt-0 !text-xl !text-slate-700 bg-white/50 px-6 py-2 rounded-full border-2 border-orange-200">
                {preferBackendStt ? "按麥克風，大聲讀出嚟！ 🌐" : "撳麥克風，大聲讀出嚟！"}
              </p>
            )}
          </div>
        )}

        {/* Transcript display */}
        {transcript && (
          <div
            className={`rounded-full px-6 py-2 text-center shadow-md animate-pop-in ${
              result === "correct"
                ? "bg-green-100 border-2 border-green-200"
                : result === "partial" || result === "incorrect"
                  ? "bg-amber-50 border-2 border-amber-200"
                  : "bg-white/80 border-2 border-orange-100"
            }`}
          >
            <p className="child-tab-section-title !mt-0 !text-lg !text-slate-700">
              聽到：「{transcript}」
            </p>
          </div>
        )}

        {/* Result feedback container with enhanced animations */}
        <div className="h-20 flex items-center justify-center relative w-full overflow-hidden">
        {result && (
          <div
            className={`child-tab-section-title !mt-0 !text-3xl py-3 px-10 rounded-full shadow-2xl bg-white/95 border-4 transition-all duration-300
              ${
                result === "correct"
                  ? "text-green-600 border-green-300 animate-[bounce_0.6s_ease-in-out] shadow-green-200/50"
                  : result === "partial"
                    ? "text-yellow-600 border-yellow-300 animate-[shake_0.4s_ease-in-out] shadow-yellow-200/50"
                    : "text-red-500 border-red-300 animate-[shake_0.4s_ease-in-out] shadow-red-200/50"
              }`}
          >
            {result === "correct" ? (
              <div className="flex items-center gap-3">
                <div className="relative">
                  <span className="inline-block animate-[spin_3s_linear_infinite]">⭐</span>
                  <div className="absolute inset-0 animate-ping opacity-70">⭐</div>
                </div>
                <span>太棒了！</span>
                <div className="relative">
                  <span className="inline-block animate-[spin_3s_linear_infinite_reverse]">⭐</span>
                  <div className="absolute inset-0 animate-ping opacity-70">⭐</div>
                </div>
              </div>
            ) : result === "partial" ? (
              <div className="flex items-center gap-2">
                <span>👍 差小小，再試下！</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span>再聽一次，再試試！ 🔈</span>
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
