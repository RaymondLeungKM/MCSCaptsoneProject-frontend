"use client";

import { type ChangeEvent, useEffect, useRef, useState } from "react";
import {
  CheckCircle,
  Loader2,
  Mic,
  Square,
  Volume2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { API_BASE_URL } from "@/lib/api/client";
import { getWords, type WordResponse } from "@/lib/api/vocabulary";
import { useSpeech } from "@/lib/speech";
import { cn } from "@/lib/utils";

type PronunciationModel = {
  provider: string;
  id: string;
  name: string;
  default: boolean;
  enabled: boolean;
  notes?: string;
  availability?: string;
};

type PronunciationModelsResponse = {
  default_provider: string;
  default_model: string;
  provider_defaults?: Record<string, string>;
  models: PronunciationModel[];
};

type PronunciationTestResponse = {
  result: "correct" | "partial" | "incorrect" | null;
  heard: string;
  confidence: number;
  target: string;
  jyutping: string;
  word_id: string;
  provider: string;
  model: string;
  elapsed_ms: number;
  recognitionLanguage?: string;
  languageLabel?: string;
};

type LanguagePreset = {
  id: string;
  label: string;
  speechSynthesisLang: string;
  recognitionLanguage: string;
  browserRecognitionLang: string;
  sampleSentence: string;
  sampleWord: string;
  defaultTarget: string;
  defaultHint: string;
  targetPlaceholder: string;
  hintPlaceholder: string;
};

const LANGUAGE_PRESETS: LanguagePreset[] = [
  {
    id: "cantonese",
    label: "Cantonese",
    speechSynthesisLang: "yue-Hant-HK",
    recognitionLanguage: "yue",
    browserRecognitionLang: "zh-HK",
    sampleSentence: "你好，這是一個測試。",
    sampleWord: "大象",
    defaultTarget: "大象",
    defaultHint: "daai6 zoeng6",
    targetPlaceholder: "大象",
    hintPlaceholder: "daai6 zoeng6",
  },
  {
    id: "mandarin",
    label: "Mandarin",
    speechSynthesisLang: "zh-CN",
    recognitionLanguage: "zh",
    browserRecognitionLang: "zh-CN",
    sampleSentence: "你好，这是一个测试。",
    sampleWord: "大象",
    defaultTarget: "大象",
    defaultHint: "",
    targetPlaceholder: "大象",
    hintPlaceholder: "Optional pinyin hint",
  },
  {
    id: "english",
    label: "English",
    speechSynthesisLang: "en-US",
    recognitionLanguage: "en",
    browserRecognitionLang: "en-US",
    sampleSentence: "Hello, this is a test.",
    sampleWord: "elephant",
    defaultTarget: "elephant",
    defaultHint: "",
    targetPlaceholder: "elephant",
    hintPlaceholder: "Optional phonetic hint",
  },
];

const DEFAULT_LANGUAGE_PRESET = LANGUAGE_PRESETS[0];
const DRILL_HISTORY_STORAGE_KEY = "voice-recognition-drill-history-v1";
const DRILL_SESSION_WORD_COUNT = 10;
const MAX_DRILL_HISTORY = 12;
const RECOGNITION_TEST_TIMEOUT_MS = 45_000;

type DrillWord = {
  id: string;
  englishText: string;
  targetText: string;
  hint: string;
  category: string;
};

type DrillRoundResult = {
  index: number;
  wordId: string;
  englishText: string;
  expectedText: string;
  heardText: string;
  hint: string;
  category: string;
  result: "correct" | "partial" | "incorrect";
};

type DrillSessionResult = {
  id: string;
  createdAt: string;
  languageId: string;
  languageLabel: string;
  totalWords: number;
  correctCount: number;
  partialCount: number;
  incorrectCount: number;
  rounds: DrillRoundResult[];
};

function normalizeDrillRounds(rounds: DrillRoundResult[]): DrillRoundResult[] {
  const uniqueRounds = new Map<number, DrillRoundResult>();

  for (const round of rounds) {
    if (!uniqueRounds.has(round.index)) {
      uniqueRounds.set(round.index, round);
    }
  }

  return Array.from(uniqueRounds.values())
    .sort((left, right) => left.index - right.index)
    .slice(0, DRILL_SESSION_WORD_COUNT);
}

function normalizeDrillSession(session: DrillSessionResult): DrillSessionResult {
  const rounds = normalizeDrillRounds(Array.isArray(session.rounds) ? session.rounds : []);

  return {
    ...session,
    totalWords: rounds.length,
    correctCount: rounds.filter((round) => round.result === "correct").length,
    partialCount: rounds.filter((round) => round.result === "partial").length,
    incorrectCount: rounds.filter((round) => round.result === "incorrect").length,
    rounds,
  };
}

const FALLBACK_DRILL_WORDS: Array<
  Pick<WordResponse, "id" | "word" | "word_cantonese" | "jyutping" | "category">
> = [
  { id: "fallback-cat", word: "cat", word_cantonese: "貓", jyutping: "maau1", category: "Animals" },
  { id: "fallback-dog", word: "dog", word_cantonese: "狗", jyutping: "gau2", category: "Animals" },
  { id: "fallback-elephant", word: "elephant", word_cantonese: "大象", jyutping: "daai6 zoeng6", category: "Animals" },
  { id: "fallback-bird", word: "bird", word_cantonese: "雀仔", jyutping: "zoek3 zai2", category: "Animals" },
  { id: "fallback-apple", word: "apple", word_cantonese: "蘋果", jyutping: "ping4 gwo2", category: "Food" },
  { id: "fallback-banana", word: "banana", word_cantonese: "香蕉", jyutping: "hoeng1 ziu1", category: "Food" },
  { id: "fallback-cake", word: "cake", word_cantonese: "蛋糕", jyutping: "daan6 gou1", category: "Food" },
  { id: "fallback-bread", word: "bread", word_cantonese: "麵包", jyutping: "min6 baau1", category: "Food" },
  { id: "fallback-car", word: "car", word_cantonese: "車", jyutping: "ce1", category: "Transport" },
  { id: "fallback-bus", word: "bus", word_cantonese: "巴士", jyutping: "baa1 si2", category: "Transport" },
  { id: "fallback-train", word: "train", word_cantonese: "火車", jyutping: "fo2 ce1", category: "Transport" },
  { id: "fallback-plane", word: "airplane", word_cantonese: "飛機", jyutping: "fei1 gei1", category: "Transport" },
  { id: "fallback-book", word: "book", word_cantonese: "書", jyutping: "syu1", category: "Household" },
  { id: "fallback-chair", word: "chair", word_cantonese: "椅", jyutping: "ji2", category: "Household" },
  { id: "fallback-ball", word: "ball", word_cantonese: "波", jyutping: "bo1", category: "Toys" },
  { id: "fallback-kite", word: "kite", word_cantonese: "風箏", jyutping: "fung1 zang1", category: "Toys" },
  { id: "fallback-star", word: "star", word_cantonese: "星星", jyutping: "sing1 sing1", category: "Nature" },
  { id: "fallback-tree", word: "tree", word_cantonese: "樹", jyutping: "syu6", category: "Nature" },
  { id: "fallback-flower", word: "flower", word_cantonese: "花", jyutping: "faa1", category: "Nature" },
  { id: "fallback-sun", word: "sun", word_cantonese: "太陽", jyutping: "taai3 joeng4", category: "Nature" },
];

function getLanguagePreset(languageId: string): LanguagePreset {
  return LANGUAGE_PRESETS.find((preset) => preset.id === languageId) ?? DEFAULT_LANGUAGE_PRESET;
}

function shuffleItems<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
}

function normalizeComparableText(value: string): string {
  return value.trim().toLowerCase().replace(/[.,!?。，！？、\s]/g, "");
}

function scoreRecognizedText(
  heardText: string,
  expectedText: string,
): "correct" | "partial" | "incorrect" {
  const heard = normalizeComparableText(heardText);
  const expected = normalizeComparableText(expectedText);

  if (!heard || !expected) {
    return "incorrect";
  }

  if (heard === expected || heard.includes(expected) || expected.includes(heard)) {
    return "correct";
  }

  const expectedChars = [...expected];
  const heardChars = new Set([...heard]);
  const matchedChars = expectedChars.filter((character) => heardChars.has(character));
  const overlapRatio = matchedChars.length / expectedChars.length;

  if (overlapRatio >= 0.75) {
    return "correct";
  }

  if (overlapRatio >= 0.45) {
    return "partial";
  }

  return "incorrect";
}

function toDrillWord(source: Pick<WordResponse, "id" | "word" | "word_cantonese" | "jyutping" | "category">, preset: LanguagePreset): DrillWord | null {
  const targetText =
    preset.id === "english"
      ? (source.word || "").trim()
      : (source.word_cantonese || source.word || "").trim();

  if (!targetText) {
    return null;
  }

  return {
    id: String(source.id),
    englishText: (source.word || "").trim(),
    targetText,
    hint: preset.id === "cantonese" ? (source.jyutping || "").trim() : "",
    category: source.category || "General",
  };
}

function buildDrillWordPool(
  words: Array<Pick<WordResponse, "id" | "word" | "word_cantonese" | "jyutping" | "category">>,
  preset: LanguagePreset,
): DrillWord[] {
  const uniqueWords = new Map<string, DrillWord>();

  for (const word of words) {
    const drillWord = toDrillWord(word, preset);
    if (!drillWord) {
      continue;
    }

    const key = normalizeComparableText(drillWord.targetText);
    if (!key || uniqueWords.has(key)) {
      continue;
    }

    uniqueWords.set(key, drillWord);
  }

  return Array.from(uniqueWords.values());
}

type BrowserSpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onresult: ((event: any) => void) | null;
  start: () => void;
  stop: () => void;
};

type BrowserSpeechRecognitionCtor = new () => BrowserSpeechRecognitionInstance;

function getBrowserSpeechRecognitionCtor(): BrowserSpeechRecognitionCtor | null {
  if (typeof window === "undefined") {
    return null;
  }

  return ((window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition ||
    null) as BrowserSpeechRecognitionCtor | null;
}

function getPreferredRecordingMimeType(): string | undefined {
  if (typeof window === "undefined" || typeof MediaRecorder === "undefined") {
    return undefined;
  }

  // Prefer wav > webm so the Hugging Face inference router receives a format
  // it accepts. MP4/AAC (the macOS Chrome default) triggers a 400 from the HF
  // ASR endpoint. audio/mp4 is kept as a final fallback for providers that
  // can handle it (e.g. Cloudflare Workers AI).
  const candidates = [
    "audio/wav",
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
  ];

  return candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate));
}

function getAudioExtension(mimeType: string): string {
  if (mimeType.includes("wav")) {
    return ".wav";
  }

  if (mimeType.includes("mp4") || mimeType.includes("m4a")) {
    return ".m4a";
  }

  return ".webm";
}

type VoiceRecognitionTesterProps = {
  className?: string;
};

export function VoiceRecognitionTester({ className }: VoiceRecognitionTesterProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [lastError, setLastError] = useState<string>("");
  const [lastSuccess, setLastSuccess] = useState<string>("");
  const [isMounted, setIsMounted] = useState(false);
  const [voiceCount, setVoiceCount] = useState(0);
  const [micSupported, setMicSupported] = useState(false);
  const [browserRecognitionSupported, setBrowserRecognitionSupported] = useState(false);
  const [backendStatus, setBackendStatus] = useState("");
  const [backendError, setBackendError] = useState("");
  const [modelsLoading, setModelsLoading] = useState(false);
  const [recognitionModels, setRecognitionModels] = useState<PronunciationModel[]>([]);
  const [selectedProvider, setSelectedProvider] = useState("huggingface");
  const [selectedModel, setSelectedModel] = useState("openai/whisper-large-v3");
  const [customModel, setCustomModel] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState(DEFAULT_LANGUAGE_PRESET.id);
  const [wordCantonese, setWordCantonese] = useState(DEFAULT_LANGUAGE_PRESET.defaultTarget);
  const [jyutping, setJyutping] = useState(DEFAULT_LANGUAGE_PRESET.defaultHint);
  const [recognitionError, setRecognitionError] = useState("");
  const [recognitionResult, setRecognitionResult] =
    useState<PronunciationTestResponse | null>(null);
  const [isLiveListening, setIsLiveListening] = useState(false);
  const [liveRecognitionText, setLiveRecognitionText] = useState("");
  const [liveRecognitionError, setLiveRecognitionError] = useState("");
  const [drillHistory, setDrillHistory] = useState<DrillSessionResult[]>([]);
  const [latestDrillSession, setLatestDrillSession] = useState<DrillSessionResult | null>(null);
  const [drillWords, setDrillWords] = useState<DrillWord[]>([]);
  const [drillRounds, setDrillRounds] = useState<DrillRoundResult[]>([]);
  const [drillCurrentIndex, setDrillCurrentIndex] = useState(0);
  const [drillFeedback, setDrillFeedback] = useState("");
  const [drillLastHeard, setDrillLastHeard] = useState("");
  const [drillPoolLoading, setDrillPoolLoading] = useState(false);
  const [drillPoolError, setDrillPoolError] = useState("");
  const [isDrillActive, setIsDrillActive] = useState(false);
  const [isDrillPlaying, setIsDrillPlaying] = useState(false);
  const [isDrillListening, setIsDrillListening] = useState(false);
  const [isResolvingDrillRound, setIsResolvingDrillRound] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmittingRecognition, setIsSubmittingRecognition] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [uploadedAudioFile, setUploadedAudioFile] = useState<File | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState("");
  const [recordingMimeType, setRecordingMimeType] = useState("audio/webm");

  // ── Side-by-side comparison state ────────────────────────────────────────
  const [cmpIsRecording, setCmpIsRecording] = useState(false);
  const [cmpAudio, setCmpAudio] = useState<Blob | null>(null);
  const [cmpAudioPreviewUrl, setCmpAudioPreviewUrl] = useState("");
  const [cmpRecordingMimeType, setCmpRecordingMimeType] = useState("audio/webm");
  const [cmpTarget, setCmpTarget] = useState("大象");
  const [cmpHint, setCmpHint] = useState("daai6 zoeng6");
  const [cmpBrowserLang, setCmpBrowserLang] = useState("zh-HK");
  const [cmpRunning, setCmpRunning] = useState(false);
  const [cmpBrowserResult, setCmpBrowserResult] = useState<{ heard: string; latencyMs: number } | null>(null);
  const [cmpWhisperResult, setCmpWhisperResult] = useState<PronunciationTestResponse | null>(null);
  const [cmpBrowserStatus, setCmpBrowserStatus] = useState<"idle" | "listening" | "done" | "error">("idle");
  const [cmpWhisperStatus, setCmpWhisperStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [cmpBrowserError, setCmpBrowserError] = useState("");
  const [cmpWhisperError, setCmpWhisperError] = useState("");
  const cmpRecorderRef = useRef<MediaRecorder | null>(null);
  const cmpStreamRef = useRef<MediaStream | null>(null);
  const cmpChunksRef = useRef<Blob[]>([]);
  const cmpRecognitionRef = useRef<BrowserSpeechRecognitionInstance | null>(null);

  const liveRecognitionRef = useRef<BrowserSpeechRecognitionInstance | null>(null);
  const drillRecognitionRef = useRef<BrowserSpeechRecognitionInstance | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const previousLanguageRef = useRef(DEFAULT_LANGUAGE_PRESET.id);
  const drillStartedAtRef = useRef<string | null>(null);
  const drillAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const drillRoundLockRef = useRef(false);
  const { speak, stop, isAvailable } = useSpeech();

  const enabledModels = recognitionModels.filter((model) => model.enabled);
  const selectedConfiguredModel =
    recognitionModels.find(
      (model) => model.id === selectedModel && model.provider === selectedProvider,
    ) ?? recognitionModels.find((model) => model.id === selectedModel);
  const enabledProviders = new Set(enabledModels.map((model) => model.provider));
  const hasEnabledSelectedProvider = enabledProviders.has(selectedProvider);
  const hasEnabledRecognitionModel = customModel.trim()
    ? hasEnabledSelectedProvider
    : Boolean(selectedConfiguredModel?.enabled);
  const effectiveModel = customModel.trim() || selectedModel;
  const activeModelNotes = customModel.trim()
    ? `Custom model id will be sent to the ${selectedProvider} provider.`
    : selectedConfiguredModel?.notes || "";
  const activeAvailability = customModel.trim()
    ? hasEnabledSelectedProvider
      ? ""
      : `The ${selectedProvider} provider is not configured on the backend.`
    : selectedConfiguredModel?.availability || "";
  const selectedLanguagePreset = getLanguagePreset(selectedLanguage);
  const recognizedText = recognitionResult?.heard?.trim() || "";
  const currentDrillWord = isDrillActive ? drillWords[drillCurrentIndex] ?? null : null;
  const drillCorrectCount = drillRounds.filter((round) => round.result === "correct").length;

  const persistDrillHistory = (nextHistory: DrillSessionResult[]) => {
    const normalizedHistory = nextHistory.map(normalizeDrillSession);
    setDrillHistory(normalizedHistory);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DRILL_HISTORY_STORAGE_KEY, JSON.stringify(normalizedHistory));
    }
  };

  const clearDrillAdvanceTimer = () => {
    if (drillAdvanceTimerRef.current) {
      clearTimeout(drillAdvanceTimerRef.current);
      drillAdvanceTimerRef.current = null;
    }
  };

  const setDrillRoundLocked = (locked: boolean) => {
    drillRoundLockRef.current = locked;
    setIsResolvingDrillRound(locked);
  };

  useEffect(() => {
    setIsMounted(true);

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setVoiceCount(window.speechSynthesis.getVoices().length);

      const updateVoices = () => {
        setVoiceCount(window.speechSynthesis.getVoices().length);
      };

      window.speechSynthesis.onvoiceschanged = updateVoices;

      return () => {
        window.speechSynthesis.onvoiceschanged = null;
      };
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setMicSupported(
      Boolean(
        typeof window.navigator.mediaDevices?.getUserMedia === "function" &&
          typeof window.MediaRecorder !== "undefined",
      ),
    );
    setBrowserRecognitionSupported(Boolean(getBrowserSpeechRecognitionCtor()));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const rawHistory = window.localStorage.getItem(DRILL_HISTORY_STORAGE_KEY);
      if (!rawHistory) {
        return;
      }

      const parsedHistory = JSON.parse(rawHistory) as DrillSessionResult[];
      if (Array.isArray(parsedHistory)) {
        const normalizedHistory = parsedHistory.map(normalizeDrillSession);
        setDrillHistory(normalizedHistory);
        window.localStorage.setItem(
          DRILL_HISTORY_STORAGE_KEY,
          JSON.stringify(normalizedHistory),
        );
      }
    } catch {
      window.localStorage.removeItem(DRILL_HISTORY_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadRecognitionModels() {
      setModelsLoading(true);
      setBackendError("");

      try {
        const response = await fetch(`${API_BASE_URL}/audio/pronunciation-models`, {
          cache: "no-store",
        });

        const data = (await response.json()) as PronunciationModelsResponse & {
          detail?: string;
        };

        if (!response.ok) {
          throw new Error(data.detail || `Failed to load models (${response.status})`);
        }

        if (cancelled) {
          return;
        }

        const models = data.models || [];
        setRecognitionModels(models);

        const defaultSelection =
          models.find((model) => model.default && model.enabled) ||
          models.find((model) => model.enabled) ||
          models.find((model) => model.default) ||
          models[0];

        if (defaultSelection) {
          setSelectedProvider(defaultSelection.provider);
          setSelectedModel(defaultSelection.id);
        } else {
          setSelectedProvider(data.default_provider || "huggingface");
          setSelectedModel(data.default_model || "openai/whisper-large-v3");
        }

        if (models.some((model) => model.enabled)) {
          setBackendStatus(
            "Backend pronunciation test API is available. Choose a model and submit audio to compare results.",
          );
        } else {
          setBackendStatus(
            "No speech API keys are configured. Set HUGGINGFACE_API_TOKEN (free, included models support Cantonese) or CLOUDFLARE_AI_API_TOKEN in the backend .env to enable recognition models, then restart the backend.",
          );
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        setBackendError(
          error instanceof Error ? error.message : "Failed to load recognition models.",
        );
      } finally {
        if (!cancelled) {
          setModelsLoading(false);
        }
      }
    }

    loadRecognitionModels();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const selectedSource = uploadedAudioFile ?? recordedAudio;
    if (!selectedSource) {
      setAudioPreviewUrl("");
      return;
    }

    const nextUrl = URL.createObjectURL(selectedSource);
    setAudioPreviewUrl(nextUrl);

    return () => {
      URL.revokeObjectURL(nextUrl);
    };
  }, [recordedAudio, uploadedAudioFile]);

  useEffect(() => {
    const matchingModel = recognitionModels.find((model) => model.id === selectedModel);
    if (matchingModel) {
      setSelectedProvider(matchingModel.provider);
    }
  }, [recognitionModels, selectedModel]);

  useEffect(() => {
    if (previousLanguageRef.current === selectedLanguage) {
      return;
    }

    const previousPreset = getLanguagePreset(previousLanguageRef.current);
    const shouldUpdateTarget = !wordCantonese.trim() || wordCantonese === previousPreset.defaultTarget;
    const shouldUpdateHint = !jyutping.trim() || jyutping === previousPreset.defaultHint;

    previousLanguageRef.current = selectedLanguage;

    if (shouldUpdateTarget) {
      setWordCantonese(selectedLanguagePreset.defaultTarget);
    }

    if (shouldUpdateHint) {
      setJyutping(selectedLanguagePreset.defaultHint);
    }
  }, [selectedLanguage, selectedLanguagePreset, wordCantonese, jyutping]);

  useEffect(() => {
    return () => {
      liveRecognitionRef.current?.stop();
      drillRecognitionRef.current?.stop();
      cmpRecognitionRef.current?.stop();
      clearDrillAdvanceTimer();
      recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
      streamRef.current?.getTracks().forEach((track) => track.stop());
      cmpRecorderRef.current?.stream.getTracks().forEach((track) => track.stop());
      cmpStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const testBasicSpeech = () => {
    setLastError("");
    setLastSuccess("");

    speak(selectedLanguagePreset.sampleSentence, {
      rate: 0.8,
      pitch: 1.0,
      lang: selectedLanguagePreset.speechSynthesisLang,
      onStart: () => {
        setIsPlaying(true);
        setLastSuccess(`${selectedLanguagePreset.label} sample started.`);
      },
      onEnd: () => {
        setIsPlaying(false);
        setLastSuccess(`${selectedLanguagePreset.label} sample completed.`);
      },
      onError: (error) => {
        setIsPlaying(false);
        setLastError(`Error: ${error}`);
      },
    });
  };

  const testWord = () => {
    setLastError("");
    setLastSuccess("");

    speak(wordCantonese.trim() || selectedLanguagePreset.sampleWord, {
      rate: 0.7,
      pitch: 1.2,
      lang: selectedLanguagePreset.speechSynthesisLang,
      onStart: () => {
        setIsPlaying(true);
        setLastSuccess("Target word playback started.");
      },
      onEnd: () => {
        setIsPlaying(false);
        setLastSuccess("Target word playback completed.");
      },
      onError: (error) => {
        setIsPlaying(false);
        setLastError(`Error: ${error}`);
      },
    });
  };

  const stopSpeech = () => {
    stop();
    setIsPlaying(false);
    setLastSuccess("Speech stopped");
  };

  const startLiveRecognition = () => {
    setLiveRecognitionError("");

    const SpeechRecognitionCtor = getBrowserSpeechRecognitionCtor();
    if (!SpeechRecognitionCtor) {
      setLiveRecognitionError("Live browser speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    liveRecognitionRef.current = recognition;
    setLiveRecognitionText("");

    recognition.lang = selectedLanguagePreset.browserRecognitionLang;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 5;

    recognition.onstart = () => {
      setIsLiveListening(true);
      setLastSuccess("");
    };

    recognition.onend = () => {
      setIsLiveListening(false);
    };

    recognition.onresult = (event) => {
      const bestHeard = event?.results?.[0]?.[0]?.transcript?.trim() || "";
      setLiveRecognitionText(bestHeard);
      setLastSuccess(
        bestHeard
          ? `Live recognition captured: ${bestHeard}`
          : "Live recognition finished with an empty transcript.",
      );
    };

    recognition.onerror = (event) => {
      setIsLiveListening(false);

      switch (event?.error) {
        case "not-allowed":
          setLiveRecognitionError("Microphone permission is required for live speech recognition.");
          break;
        case "audio-capture":
          setLiveRecognitionError("No microphone was found for live speech recognition.");
          break;
        case "no-speech":
          setLiveRecognitionError("No speech was detected. Try again and speak after the listener starts.");
          break;
        case "network":
          setLiveRecognitionError("Browser speech recognition hit a network error.");
          break;
        case "aborted":
          break;
        default:
          setLiveRecognitionError("Live speech recognition failed. Try again.");
          break;
      }
    };

    recognition.start();
  };

  const stopLiveRecognition = () => {
    liveRecognitionRef.current?.stop();
  };

  const clearLiveRecognition = () => {
    setLiveRecognitionText("");
    setLiveRecognitionError("");
  };

  const playDrillWord = (word: DrillWord) => {
    setDrillFeedback("");
    setDrillLastHeard("");
    setLastError("");
    setDrillRoundLocked(true);

    speak(word.targetText, {
      rate: 0.7,
      pitch: 1.1,
      lang: selectedLanguagePreset.speechSynthesisLang,
      onStart: () => {
        setIsDrillPlaying(true);
      },
      onEnd: () => {
        setIsDrillPlaying(false);
        setDrillRoundLocked(false);
        setDrillFeedback("The tester spoke the word. Repeat it, then start answer listening.");
      },
      onError: (error) => {
        setIsDrillPlaying(false);
        setDrillRoundLocked(false);
        setDrillPoolError(`Failed to play the drill word: ${error}`);
      },
    });
  };

  const finalizeDrillSession = (finalRounds: DrillRoundResult[]) => {
    const sessionResult: DrillSessionResult = {
      id: `voice-drill-${Date.now()}`,
      createdAt: drillStartedAtRef.current || new Date().toISOString(),
      languageId: selectedLanguagePreset.id,
      languageLabel: selectedLanguagePreset.label,
      totalWords: finalRounds.length,
      correctCount: finalRounds.filter((round) => round.result === "correct").length,
      partialCount: finalRounds.filter((round) => round.result === "partial").length,
      incorrectCount: finalRounds.filter((round) => round.result === "incorrect").length,
      rounds: finalRounds,
    };

    const nextHistory = [sessionResult, ...drillHistory].slice(0, MAX_DRILL_HISTORY);
    persistDrillHistory(nextHistory);
    setLatestDrillSession(sessionResult);
    setIsDrillActive(false);
    setIsDrillListening(false);
    setIsDrillPlaying(false);
    setDrillRoundLocked(false);
    setDrillFeedback(
      `10-word session finished. ${sessionResult.correctCount}/${sessionResult.totalWords} recognized correctly.`,
    );
    setDrillWords([]);
    setDrillRounds([]);
    setDrillCurrentIndex(0);
    drillStartedAtRef.current = null;
  };

  const handleDrillRoundResult = (heardText: string) => {
    if (!currentDrillWord || drillRoundLockRef.current) {
      return;
    }

    setDrillRoundLocked(true);

    const roundResult: DrillRoundResult = {
      index: drillCurrentIndex,
      wordId: currentDrillWord.id,
      englishText: currentDrillWord.englishText,
      expectedText: currentDrillWord.targetText,
      heardText,
      hint: currentDrillWord.hint,
      category: currentDrillWord.category,
      result: scoreRecognizedText(heardText, currentDrillWord.targetText),
    };

    const nextRounds = [...drillRounds, roundResult];
    setDrillRounds(nextRounds);
    setDrillLastHeard(heardText);
    setDrillFeedback(
      roundResult.result === "correct"
        ? `Correct. Recognized: ${heardText}`
        : roundResult.result === "partial"
          ? `Partial match. Recognized: ${heardText}`
          : `Incorrect. Recognized: ${heardText || "(empty)"}`,
    );

    if (drillCurrentIndex >= drillWords.length - 1) {
      finalizeDrillSession(nextRounds);
      return;
    }

    const nextIndex = drillCurrentIndex + 1;
    clearDrillAdvanceTimer();
    drillAdvanceTimerRef.current = setTimeout(() => {
      setDrillCurrentIndex(nextIndex);
      setDrillLastHeard("");
      playDrillWord(drillWords[nextIndex]);
    }, 1400);
  };

  const startDrillAnswerRecognition = () => {
    if (!currentDrillWord || drillRoundLockRef.current) {
      return;
    }

    const SpeechRecognitionCtor = getBrowserSpeechRecognitionCtor();
    if (!SpeechRecognitionCtor) {
      setDrillPoolError("Browser speech recognition is not available for the 10-word drill.");
      return;
    }

    liveRecognitionRef.current?.stop();
    setIsLiveListening(false);
    setLiveRecognitionError("");
    setDrillPoolError("");
    setDrillLastHeard("");

    const recognition = new SpeechRecognitionCtor();
    drillRecognitionRef.current = recognition;
    recognition.lang = selectedLanguagePreset.browserRecognitionLang;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 5;

    recognition.onstart = () => {
      setIsDrillListening(true);
      setDrillFeedback("");
    };

    recognition.onend = () => {
      setIsDrillListening(false);
    };

    recognition.onresult = (event) => {
      const bestHeard = event?.results?.[0]?.[0]?.transcript?.trim() || "";
      handleDrillRoundResult(bestHeard);
    };

    recognition.onerror = (event) => {
      setIsDrillListening(false);

      switch (event?.error) {
        case "not-allowed":
          setDrillPoolError("Microphone permission is required to answer the drill.");
          break;
        case "audio-capture":
          setDrillPoolError("No microphone was found for the drill.");
          break;
        case "no-speech":
          setDrillPoolError("No speech was detected. Try the same word again.");
          break;
        case "network":
          setDrillPoolError("Browser speech recognition hit a network error during the drill.");
          break;
        case "aborted":
          break;
        default:
          setDrillPoolError("The drill could not capture your answer. Try again.");
          break;
      }
    };

    recognition.start();
  };

  const markCurrentDrillWordIncorrect = () => {
    handleDrillRoundResult("");
  };

  const cancelDrillSession = () => {
    drillRecognitionRef.current?.stop();
    clearDrillAdvanceTimer();
    setIsDrillActive(false);
    setIsDrillListening(false);
    setIsDrillPlaying(false);
    setDrillRoundLocked(false);
    setDrillWords([]);
    setDrillRounds([]);
    setDrillCurrentIndex(0);
    setDrillFeedback("10-word session cancelled.");
    setDrillLastHeard("");
    drillStartedAtRef.current = null;
  };

  const deleteDrillSession = (sessionId: string) => {
    const nextHistory = drillHistory.filter((session) => session.id !== sessionId);
    persistDrillHistory(nextHistory);
    if (latestDrillSession?.id === sessionId) {
      setLatestDrillSession(nextHistory[0] ?? null);
    }
  };

  const startRecognitionDrill = async () => {
    setDrillPoolLoading(true);
    setDrillPoolError("");
    setDrillFeedback("");
    setLatestDrillSession(null);
    clearDrillAdvanceTimer();
    liveRecognitionRef.current?.stop();
    setIsLiveListening(false);

    try {
      let wordPool: DrillWord[] = [];

      try {
        const fetchedWords = await getWords({ limit: 250 });
        wordPool = buildDrillWordPool(fetchedWords, selectedLanguagePreset);
      } catch {
        wordPool = [];
      }

      const fallbackPool = buildDrillWordPool(FALLBACK_DRILL_WORDS, selectedLanguagePreset);
      const mergedPool = buildDrillWordPool(
        [...wordPool, ...fallbackPool].map((word) => ({
          id: word.id,
          word: word.englishText,
          word_cantonese: word.targetText,
          jyutping: word.hint,
          category: word.category,
        })),
        selectedLanguagePreset,
      );

      if (mergedPool.length < DRILL_SESSION_WORD_COUNT) {
        throw new Error("Not enough words are available to build a 10-word test session.");
      }

      const sessionWords = shuffleItems(mergedPool).slice(0, DRILL_SESSION_WORD_COUNT);
      setDrillWords(sessionWords);
      setDrillRounds([]);
      setDrillCurrentIndex(0);
      setDrillLastHeard("");
      setIsDrillActive(true);
      setDrillRoundLocked(false);
      drillStartedAtRef.current = new Date().toISOString();
      playDrillWord(sessionWords[0]);
    } catch (error) {
      setDrillPoolError(
        error instanceof Error ? error.message : "Unable to build the 10-word drill session.",
      );
    } finally {
      setDrillPoolLoading(false);
    }
  };

  const startRecording = async () => {
    setRecognitionError("");
    setRecognitionResult(null);

    if (!micSupported) {
      setRecognitionError("Microphone recording is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferredMimeType = getPreferredRecordingMimeType();
      const recorder = preferredMimeType
        ? new MediaRecorder(stream, { mimeType: preferredMimeType })
        : new MediaRecorder(stream);

      setRecordingMimeType(recorder.mimeType || preferredMimeType || "audio/webm");
      streamRef.current = stream;
      recorderRef.current = recorder;
      chunksRef.current = [];
      setUploadedAudioFile(null);
      setRecordedAudio(null);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        setRecognitionError("Recording failed. Please try again.");
        setIsRecording(false);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, {
          type: recorder.mimeType || preferredMimeType || "audio/webm",
        });

        setRecordedAudio(audioBlob);
        setIsRecording(false);
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      };

      recorder.start();
      setIsRecording(true);
    } catch (error) {
      setRecognitionError(
        error instanceof Error ? error.message : "Microphone access was denied.",
      );
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (!recorderRef.current || recorderRef.current.state === "inactive") {
      return;
    }

    recorderRef.current.stop();
  };

  const clearRecognitionAudio = () => {
    setRecordedAudio(null);
    setUploadedAudioFile(null);
    setRecognitionResult(null);
    setRecognitionError("");
  };

  const handleAudioUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setUploadedAudioFile(file);
    setRecordedAudio(null);
    setRecognitionResult(null);
    setRecognitionError("");
  };

  const runRecognitionTest = async () => {
    setRecognitionError("");
    setRecognitionResult(null);

    const audioSource = uploadedAudioFile ?? recordedAudio;
    if (!audioSource) {
      setRecognitionError("Record or upload an audio sample before testing.");
      return;
    }

    if (!effectiveModel) {
      setRecognitionError("Choose a model or enter a custom model id.");
      return;
    }

    setIsSubmittingRecognition(true);

    try {
      const form = new FormData();
      const audioFile =
        audioSource instanceof File
          ? audioSource
          : new File(
              [audioSource],
              `pronunciation-test${getAudioExtension(audioSource.type || recordingMimeType)}`,
              { type: audioSource.type || recordingMimeType || "audio/webm" },
            );

      form.append("audio", audioFile);
      form.append("word_cantonese", wordCantonese);
      form.append("jyutping", jyutping);
      form.append("provider", selectedProvider);
      form.append("model", effectiveModel);
      form.append("language", selectedLanguagePreset.recognitionLanguage);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), RECOGNITION_TEST_TIMEOUT_MS);
      const response = await fetch(`${API_BASE_URL}/audio/test-pronunciation`, {
        method: "POST",
        body: form,
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));

      const data = (await response.json().catch(() => ({
        detail: `Recognition test failed (${response.status})`,
      }))) as PronunciationTestResponse & { detail?: string };

      if (!response.ok) {
        throw new Error(data.detail || `Recognition test failed (${response.status})`);
      }

      setRecognitionResult({
        ...data,
        recognitionLanguage: selectedLanguagePreset.recognitionLanguage,
        languageLabel: selectedLanguagePreset.label,
      });
      setBackendStatus(
        `Tested ${data.provider}/${data.model} in ${data.elapsed_ms} ms using ${selectedLanguagePreset.label}.`,
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setRecognitionError(
          "Recognition test timed out. Please try again, or switch to another model/provider.",
        );
        return;
      }
      setRecognitionError(
        error instanceof Error ? error.message : "Recognition test failed.",
      );
    } finally {
      setIsSubmittingRecognition(false);
    }
  };

  // Revoke comparison preview URL on change
  useEffect(() => {
    if (!cmpAudio) {
      setCmpAudioPreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(cmpAudio);
    setCmpAudioPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [cmpAudio]);

  const startCmpRecording = async () => {
    setCmpBrowserResult(null);
    setCmpWhisperResult(null);
    setCmpBrowserStatus("idle");
    setCmpWhisperStatus("idle");
    setCmpBrowserError("");
    setCmpWhisperError("");
    setCmpAudio(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferredMimeType = getPreferredRecordingMimeType();
      const recorder = preferredMimeType
        ? new MediaRecorder(stream, { mimeType: preferredMimeType })
        : new MediaRecorder(stream);

      setCmpRecordingMimeType(recorder.mimeType || preferredMimeType || "audio/webm");
      cmpStreamRef.current = stream;
      cmpRecorderRef.current = recorder;
      cmpChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) cmpChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(cmpChunksRef.current, {
          type: recorder.mimeType || preferredMimeType || "audio/webm",
        });
        setCmpAudio(blob);
        setCmpIsRecording(false);
        stream.getTracks().forEach((t) => t.stop());
        cmpStreamRef.current = null;
      };
      recorder.onerror = () => { setCmpIsRecording(false); };
      recorder.start();
      setCmpIsRecording(true);
    } catch { setCmpIsRecording(false); }
  };

  const stopCmpRecording = () => {
    if (cmpRecorderRef.current && cmpRecorderRef.current.state !== "inactive") {
      cmpRecorderRef.current.stop();
    }
  };

  const runComparison = async () => {
    if (!cmpAudio) return;
    setCmpRunning(true);
    setCmpBrowserResult(null);
    setCmpWhisperResult(null);
    setCmpBrowserError("");
    setCmpWhisperError("");
    setCmpBrowserStatus("idle");
    setCmpWhisperStatus("idle");

    // ── Browser Web Speech API (runs live on the mic, not the recording) ────
    const browserPromise = new Promise<void>((resolve) => {
      const SpeechRecognitionCtor = getBrowserSpeechRecognitionCtor();
      if (!SpeechRecognitionCtor) {
        setCmpBrowserError("Web Speech API not supported in this browser.");
        setCmpBrowserStatus("error");
        resolve();
        return;
      }
      const recognition = new SpeechRecognitionCtor();
      cmpRecognitionRef.current = recognition;
      recognition.lang = cmpBrowserLang;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      const startMs = Date.now();
      setCmpBrowserStatus("listening");
      recognition.onresult = (event: any) => {
        const heard = event?.results?.[0]?.[0]?.transcript?.trim() || "";
        setCmpBrowserResult({ heard, latencyMs: Date.now() - startMs });
        setCmpBrowserStatus("done");
        resolve();
      };
      recognition.onerror = (event: any) => {
        const msg = event?.error === "no-speech"
          ? "No speech detected by browser."
          : `Browser error: ${event?.error ?? "unknown"}`;
        setCmpBrowserError(msg);
        setCmpBrowserStatus("error");
        resolve();
      };
      recognition.onend = () => resolve();
      recognition.start();
    });

    // ── Cloudflare Whisper Turbo (sends the recording to the backend) ────────
    const whisperPromise = (async () => {
      const turboModel =
        recognitionModels.find((m) => m.id === "@cf/openai/whisper-large-v3-turbo" && m.enabled) ??
        recognitionModels.find((m) => m.provider === "cloudflare" && m.enabled);
      if (!turboModel) {
        setCmpWhisperError("Cloudflare Whisper Turbo is not enabled. Check CLOUDFLARE_AI_API_TOKEN in the backend .env.");
        setCmpWhisperStatus("error");
        return;
      }
      setCmpWhisperStatus("running");
      try {
        const ext = getAudioExtension(cmpAudio.type || cmpRecordingMimeType);
        const file = new File([cmpAudio], `cmp${ext}`, { type: cmpAudio.type || cmpRecordingMimeType });
        const form = new FormData();
        form.append("audio", file);
        form.append("word_cantonese", cmpTarget);
        form.append("jyutping", cmpHint);
        form.append("provider", turboModel.provider);
        form.append("model", turboModel.id);
        form.append("language", "yue");
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), RECOGNITION_TEST_TIMEOUT_MS);
        const resp = await fetch(`${API_BASE_URL}/audio/test-pronunciation`, {
          method: "POST", body: form, signal: controller.signal,
        }).finally(() => clearTimeout(tid));
        const data = await resp.json() as PronunciationTestResponse & { detail?: string };
        if (!resp.ok) throw new Error(data.detail || `Backend error ${resp.status}`);
        setCmpWhisperResult(data);
        setCmpWhisperStatus("done");
      } catch (err) {
        setCmpWhisperError(
          err instanceof DOMException && err.name === "AbortError"
            ? "Whisper request timed out."
            : err instanceof Error ? err.message : "Whisper test failed.",
        );
        setCmpWhisperStatus("error");
      }
    })();

    await Promise.all([browserPromise, whisperPromise]);
    setCmpRunning(false);
  };

  return (
    <div className={cn("space-y-6", className)}>
      <Card>
        <CardHeader>
          <CardTitle>Browser Compatibility</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            {!isMounted ? (
              <span className="text-muted-foreground">Checking...</span>
            ) : isAvailable() ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>Speech synthesis is available in your browser</span>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-red-500" />
                <span>Speech synthesis is not available</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isMounted ? (
              <span className="text-muted-foreground">Checking microphone...</span>
            ) : micSupported ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>Microphone capture is available for recognition testing</span>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-red-500" />
                <span>Microphone capture is not available in this browser</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isMounted ? (
              <span className="text-muted-foreground">Checking live recognition...</span>
            ) : browserRecognitionSupported ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>Browser live speech recognition is available</span>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-red-500" />
                <span>Browser live speech recognition is not available</span>
              </>
            )}
          </div>

          <div className="rounded-lg border p-4 text-sm">
            <p className="font-medium">Backend recognition tester</p>
            {modelsLoading ? (
              <p className="mt-2 text-muted-foreground">Loading backend model status...</p>
            ) : backendError ? (
              <p className="mt-2 text-red-600">{backendError}</p>
            ) : (
              <p className="mt-2 text-muted-foreground">{backendStatus}</p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="language-preset">Language Setting</Label>
              <select
                id="language-preset"
                value={selectedLanguage}
                onChange={(event) => setSelectedLanguage(event.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                disabled={isDrillActive}
              >
                {LANGUAGE_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-lg border p-4 text-sm text-muted-foreground">
              <p>
                Speech synthesis voice: <span className="font-medium text-foreground">{selectedLanguagePreset.speechSynthesisLang}</span>
              </p>
              <p className="mt-1">
                Recognition language: <span className="font-medium text-foreground">{selectedLanguagePreset.recognitionLanguage}</span>
              </p>
            </div>
          </div>

          {isMounted && (
            <div className="text-sm text-muted-foreground mt-4">
              <p>User Agent: {window.navigator.userAgent}</p>
              <p className="mt-2">Voices available: {voiceCount}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Speech Playback Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-amber-50 p-4 text-sm text-amber-900">
            These buttons only play audio. They do not listen to your microphone.
          </div>

          <div className="rounded-lg border bg-slate-50 p-4 text-sm text-slate-600">
            <p>
              Current language: <span className="font-medium text-slate-900">{selectedLanguagePreset.label}</span>
            </p>
            <p className="mt-1">
              Current target word: <span className="font-medium text-slate-900">{wordCantonese.trim() || selectedLanguagePreset.sampleWord}</span>
            </p>
          </div>

          <div className="flex gap-3">
            <Button onClick={testBasicSpeech} disabled={isPlaying} size="lg">
              <Volume2 className="w-5 h-5 mr-2" />
              Play Sample Sentence
            </Button>

            <Button
              onClick={testWord}
              disabled={isPlaying}
              size="lg"
              variant="secondary"
            >
              <Volume2 className="w-5 h-5 mr-2" />
              Play Target Word
            </Button>

            <Button
              onClick={stopSpeech}
              disabled={!isPlaying}
              size="lg"
              variant="destructive"
            >
              Stop Speech
            </Button>
          </div>

          {isPlaying && (
            <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <p className="text-blue-900 dark:text-blue-100 font-medium">
                🔊 Speaking...
              </p>
            </div>
          )}

          {lastSuccess && (
            <div className="p-4 bg-green-100 dark:bg-green-900 rounded-lg">
              <p className="text-green-900 dark:text-green-100">
                ✓ {lastSuccess}
              </p>
            </div>
          )}

          {lastError && (
            <div className="p-4 bg-red-100 dark:bg-red-900 rounded-lg">
              <p className="text-red-900 dark:text-red-100">✗ {lastError}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Live Microphone Recognition</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-slate-50 p-4 text-sm text-slate-600">
            <p>
              This listens to your speech directly in the browser and shows the recognized word or phrase right away.
            </p>
            <p className="mt-1">
              Recognition locale: <span className="font-medium text-slate-900">{selectedLanguagePreset.browserRecognitionLang}</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={startLiveRecognition}
              disabled={isLiveListening || !browserRecognitionSupported || isDrillActive}
            >
              <Mic className="w-4 h-4 mr-2" />
              Start Live Recognition
            </Button>

            <Button
              onClick={stopLiveRecognition}
              disabled={!isLiveListening}
              variant="secondary"
            >
              <Square className="w-4 h-4 mr-2" />
              Stop Listening
            </Button>

            <Button
              onClick={clearLiveRecognition}
              disabled={(!liveRecognitionText && !liveRecognitionError) || isLiveListening}
              variant="outline"
            >
              Clear Live Result
            </Button>
          </div>

          {isLiveListening && (
            <div className="rounded-lg bg-blue-100 p-4 text-blue-900">
              Listening now. Speak into your microphone.
            </div>
          )}

          {liveRecognitionError && (
            <div className="rounded-lg bg-red-100 p-4 text-red-900">
              {liveRecognitionError}
            </div>
          )}

          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-medium text-emerald-700">Recognized word / text</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-950">
              {liveRecognitionText || "Start live recognition, then speak into your microphone."}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>10-Word Recognition Playground</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border bg-slate-50 p-4 text-sm text-slate-600">
            <p>
              Start a session and the tester will say 10 random words one by one. Repeat each word out loud and use browser recognition to check whether it was recognized correctly.
            </p>
            <p className="mt-1">
              Each completed run is saved as a session result below so you can review it again or delete it.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={startRecognitionDrill}
              disabled={drillPoolLoading || isDrillActive || !browserRecognitionSupported}
            >
              {drillPoolLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Building 10-Word Session
                </>
              ) : (
                "Start 10-Word Session"
              )}
            </Button>

            <Button onClick={cancelDrillSession} disabled={!isDrillActive} variant="outline">
              Cancel Session
            </Button>
          </div>

          {drillPoolError && (
            <div className="rounded-lg bg-red-100 p-4 text-red-900">{drillPoolError}</div>
          )}

          {drillFeedback && (
            <div className="rounded-lg bg-blue-100 p-4 text-blue-900">{drillFeedback}</div>
          )}

          {isDrillActive && currentDrillWord && (
            <div className="space-y-4 rounded-xl border p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Current round</p>
                  <p className="text-lg font-semibold">
                    {drillCurrentIndex + 1} / {drillWords.length}
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">
                  Correct so far: {drillCorrectCount}
                </div>
              </div>

              <div className="rounded-lg border bg-slate-50 p-4 text-sm text-slate-600">
                The expected word is hidden during the session. Replay it if needed, then answer it with your microphone.
              </div>

              <div className="flex flex-wrap gap-3">
                <Button onClick={() => playDrillWord(currentDrillWord)} disabled={isDrillPlaying} variant="secondary">
                  <Volume2 className="w-4 h-4 mr-2" />
                  Replay Current Word
                </Button>

                <Button
                  onClick={startDrillAnswerRecognition}
                  disabled={isDrillListening || isDrillPlaying || isResolvingDrillRound || !browserRecognitionSupported}
                >
                  <Mic className="w-4 h-4 mr-2" />
                  Start Answer Listening
                </Button>

                <Button
                  onClick={markCurrentDrillWordIncorrect}
                  disabled={isDrillListening || isDrillPlaying || isResolvingDrillRound}
                  variant="outline"
                >
                  Mark Incorrect / Skip
                </Button>
              </div>

              {isDrillPlaying && (
                <div className="rounded-lg bg-amber-50 p-4 text-amber-900">
                  Playing the current drill word.
                </div>
              )}

              {isDrillListening && (
                <div className="rounded-lg bg-emerald-100 p-4 text-emerald-900">
                  Listening for your answer now. Speak the word clearly.
                </div>
              )}

              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm font-medium text-emerald-700">Recognized answer</p>
                <p className="mt-2 text-2xl font-semibold text-emerald-950">
                  {drillLastHeard || "No answer captured yet for this round."}
                </p>
              </div>
            </div>
          )}

          {latestDrillSession && !isDrillActive && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-medium text-emerald-700">Latest session result</p>
              <p className="mt-2 text-lg font-semibold text-emerald-950">
                {latestDrillSession.correctCount}/{latestDrillSession.totalWords} correct
              </p>
              <p className="mt-1 text-sm text-emerald-800">
                {latestDrillSession.languageLabel} · {new Date(latestDrillSession.createdAt).toLocaleString()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Drill Session History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {drillHistory.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              No saved drill sessions yet. Complete a 10-word session to review the results here.
            </div>
          ) : (
            drillHistory.map((session) => (
              <div key={session.id} className="rounded-xl border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{session.languageLabel} session</p>
                    <p className="text-lg font-semibold">
                      {session.correctCount}/{session.totalWords} correct
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(session.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => deleteDrillSession(session.id)}>
                    Delete Session
                  </Button>
                </div>

                <details className="mt-4 rounded-lg border bg-slate-50 p-4">
                  <summary className="cursor-pointer text-sm font-medium text-slate-800">
                    Review session details
                  </summary>
                  <div className="mt-4 space-y-3">
                    {session.rounds.map((round, roundListIndex) => (
                      <div key={`${session.id}-${round.wordId}-${round.index}-${roundListIndex}`} className="rounded-lg border bg-white p-3 text-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-medium">Round {round.index + 1}</p>
                          <p className="capitalize text-muted-foreground">{round.result}</p>
                        </div>
                        <p className="mt-2 text-muted-foreground">
                          Expected: <span className="font-medium text-foreground">{round.expectedText}</span>
                        </p>
                        <p className="text-muted-foreground">
                          Recognized: <span className="font-medium text-foreground">{round.heardText || "(empty)"}</span>
                        </p>
                        <p className="text-muted-foreground">
                          English: <span className="font-medium text-foreground">{round.englishText || "Not provided"}</span>
                        </p>
                        {round.hint && (
                          <p className="text-muted-foreground">
                            Hint: <span className="font-medium text-foreground">{round.hint}</span>
                          </p>
                        )}
                        <p className="text-muted-foreground">
                          Category: <span className="font-medium text-foreground">{round.category}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Side-by-Side Comparison</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-lg border bg-slate-50 p-4 text-sm text-slate-600">
            Record once, then run both the <span className="font-medium text-slate-900">browser Web Speech API</span> (works in Safari, Chrome, Edge, and Android Chrome) and <span className="font-medium text-slate-900">Cloudflare Whisper Large v3 Turbo</span> at the same time. The browser listens live from the mic while Whisper processes the saved recording.
            <span className="mt-1 block text-slate-500">Chrome / Edge / Android Chrome use <code className="rounded bg-slate-200 px-1">webkitSpeechRecognition</code>. Safari uses <code className="rounded bg-slate-200 px-1">SpeechRecognition</code>. Both accept the same BCP-47 language tags below.</span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cmp-target">Target word</Label>
              <Input
                id="cmp-target"
                value={cmpTarget}
                onChange={(e) => setCmpTarget(e.target.value)}
                placeholder="大象"
                disabled={cmpRunning}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cmp-hint">Pronunciation hint (jyutping)</Label>
              <Input
                id="cmp-hint"
                value={cmpHint}
                onChange={(e) => setCmpHint(e.target.value)}
                placeholder="daai6 zoeng6"
                disabled={cmpRunning}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="cmp-browser-lang">Browser recognition language</Label>
              <select
                id="cmp-browser-lang"
                value={cmpBrowserLang}
                onChange={(e) => setCmpBrowserLang(e.target.value)}
                disabled={cmpRunning}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
              >
                <option value="zh-HK">zh-HK — Cantonese (Hong Kong) · recommended for Chrome/Edge/Android</option>
                <option value="yue-Hant-HK">yue-Hant-HK — Cantonese (Safari extended tag)</option>
                <option value="zh-TW">zh-TW — Traditional Chinese (Taiwan) · fallback</option>
                <option value="zh-CN">zh-CN — Simplified Chinese (Mandarin)</option>
              </select>
              <p className="text-xs text-muted-foreground">
                Chrome / Edge / Android Chrome all recognise <code className="rounded bg-slate-100 px-1">zh-HK</code> as Cantonese.
                Safari may also accept <code className="rounded bg-slate-100 px-1">yue-Hant-HK</code>.
              </p>
            </div>
          </div>

          {/* Recording controls */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={startCmpRecording}
              disabled={cmpIsRecording || cmpRunning || !micSupported}
            >
              <Mic className="w-4 h-4 mr-2" />
              {cmpIsRecording ? "Recording…" : "Start Recording"}
            </Button>
            <Button
              onClick={stopCmpRecording}
              disabled={!cmpIsRecording}
              variant="secondary"
            >
              <Square className="w-4 h-4 mr-2" />
              Stop Recording
            </Button>
          </div>

          {cmpIsRecording && (
            <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              Recording — stop when done speaking, then click Run Comparison.
            </div>
          )}

          {cmpAudioPreviewUrl && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Your recording</p>
              <audio controls src={cmpAudioPreviewUrl} className="w-full" />
            </div>
          )}

          {/* Run button */}
          <Button
            onClick={runComparison}
            disabled={!cmpAudio || cmpIsRecording || cmpRunning || !browserRecognitionSupported}
            className="w-full"
          >
            {cmpRunning ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Running Comparison…</>
            ) : (
              "Run Comparison"
            )}
          </Button>

          {!browserRecognitionSupported && (
            <p className="text-sm text-amber-700">Web Speech API is not available in this browser.</p>
          )}

          {/* Results side by side */}
          {(cmpBrowserStatus !== "idle" || cmpWhisperStatus !== "idle") && (
            <div className="grid gap-4 md:grid-cols-2">
              {/* Browser column */}
              <div className={cn(
                "rounded-xl border p-4 space-y-2",
                cmpBrowserStatus === "done" && "border-blue-300 bg-blue-50",
                cmpBrowserStatus === "error" && "border-red-300 bg-red-50",
                cmpBrowserStatus === "listening" && "border-amber-300 bg-amber-50",
              )}>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">
                    {cmpBrowserStatus === "listening" ? (
                      <><Loader2 className="inline w-3 h-3 mr-1 animate-spin" />Browser listening…</>
                    ) : (
                      typeof window !== "undefined" && (window as any).SpeechRecognition && !(window as any).webkitSpeechRecognition
                        ? "Firefox / Standard Web Speech API"
                        : typeof window !== "undefined" && (window as any).webkitSpeechRecognition
                          ? "Chrome / Edge / Safari (webkitSpeechRecognition)"
                          : "Browser Web Speech API"
                    )}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">lang: {cmpBrowserLang}</p>
                {cmpBrowserStatus === "done" && cmpBrowserResult && (
                  <>
                    <p className="text-2xl font-bold mt-1">{cmpBrowserResult.heard || "(empty)"}</p>
                    <p className="text-xs text-muted-foreground">{cmpBrowserResult.latencyMs} ms</p>
                    <p className={cn(
                      "text-sm font-medium capitalize",
                      scoreRecognizedText(cmpBrowserResult.heard, cmpTarget) === "correct" && "text-green-700",
                      scoreRecognizedText(cmpBrowserResult.heard, cmpTarget) === "partial" && "text-amber-700",
                      scoreRecognizedText(cmpBrowserResult.heard, cmpTarget) === "incorrect" && "text-red-700",
                    )}>
                      {scoreRecognizedText(cmpBrowserResult.heard, cmpTarget)}
                    </p>
                  </>
                )}
                {cmpBrowserStatus === "error" && (
                  <p className="text-sm text-red-700">{cmpBrowserError}</p>
                )}
              </div>

              {/* Whisper column */}
              <div className={cn(
                "rounded-xl border p-4 space-y-2",
                cmpWhisperStatus === "done" && "border-emerald-300 bg-emerald-50",
                cmpWhisperStatus === "error" && "border-red-300 bg-red-50",
                cmpWhisperStatus === "running" && "border-amber-300 bg-amber-50",
              )}>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">
                    {cmpWhisperStatus === "running" ? (
                      <><Loader2 className="inline w-3 h-3 mr-1 animate-spin" />Whisper processing…</>
                    ) : "Cloudflare Whisper Large v3 Turbo"}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">lang: yue (Cantonese)</p>
                {cmpWhisperStatus === "done" && cmpWhisperResult && (
                  <>
                    <p className="text-2xl font-bold mt-1">{cmpWhisperResult.heard || "(empty)"}</p>
                    <p className="text-xs text-muted-foreground">{cmpWhisperResult.elapsed_ms} ms</p>
                    <p className={cn(
                      "text-sm font-medium capitalize",
                      cmpWhisperResult.result === "correct" && "text-green-700",
                      cmpWhisperResult.result === "partial" && "text-amber-700",
                      cmpWhisperResult.result === "incorrect" && "text-red-700",
                    )}>
                      {cmpWhisperResult.result ?? "transcribed"}
                    </p>
                  </>
                )}
                {cmpWhisperStatus === "error" && (
                  <p className="text-sm text-red-700">{cmpWhisperError}</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pronunciation Model Tester</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border bg-slate-50 p-4 text-sm text-slate-600">
            This section compares backend recognition models. Record or upload audio first, then send it to the selected model.
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="word-cantonese">Target word or phrase</Label>
              <Input
                id="word-cantonese"
                value={wordCantonese}
                onChange={(event) => setWordCantonese(event.target.value)}
                placeholder={selectedLanguagePreset.targetPlaceholder}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jyutping">Pronunciation hint</Label>
              <Input
                id="jyutping"
                value={jyutping}
                onChange={(event) => setJyutping(event.target.value)}
                placeholder={selectedLanguagePreset.hintPlaceholder}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model-select">Configured model</Label>
              <select
                id="model-select"
                value={selectedModel}
                onChange={(event) => setSelectedModel(event.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                disabled={modelsLoading || recognitionModels.length === 0}
              >
                {recognitionModels.length === 0 ? (
                  <option value="">No models reported by backend</option>
                ) : (
                  recognitionModels.map((model) => (
                    <option key={`${model.provider}-${model.id}`} value={model.id}>
                      {model.name}
                      {model.enabled ? "" : " (disabled)"}
                    </option>
                  ))
                )}
              </select>
              {recognitionModels.length > 0 && (
                <div className="space-y-1 rounded-lg border bg-slate-50 p-3 text-xs text-slate-600">
                  <p>
                    <span className="font-medium text-slate-900">Provider:</span> {selectedProvider}
                  </p>
                  {activeModelNotes && <p>{activeModelNotes}</p>}
                  {activeAvailability && <p className="text-amber-700">{activeAvailability}</p>}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom-model">Custom model override</Label>
              <Input
                id="custom-model"
                value={customModel}
                onChange={(event) => setCustomModel(event.target.value)}
                placeholder="Optional: enter a specific model id"
              />
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-4 rounded-xl border p-4">
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={startRecording}
                  disabled={isRecording || isSubmittingRecognition || !micSupported}
                >
                  <Mic className="w-4 h-4 mr-2" />
                  Start Recording for Model Test
                </Button>

                <Button
                  onClick={stopRecording}
                  disabled={!isRecording}
                  variant="secondary"
                >
                  <Square className="w-4 h-4 mr-2" />
                  Stop Recording
                </Button>

                <Button
                  onClick={clearRecognitionAudio}
                  disabled={(!recordedAudio && !uploadedAudioFile) || isRecording}
                  variant="outline"
                >
                  Clear Audio
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="audio-upload">Or upload an audio clip</Label>
                <Input
                  id="audio-upload"
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioUpload}
                  disabled={isRecording || isSubmittingRecognition}
                />
              </div>

              {isRecording && (
                <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                  Recording in progress. Stop recording when you are done speaking.
                </div>
              )}

              {audioPreviewUrl && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                  "Run Backend Model Test"
                  </p>
                  <audio controls src={audioPreviewUrl} className="w-full" />
                </div>
              )}
            </div>

            <div className="space-y-4 rounded-xl border p-4">
              <div>
                <p className="text-sm font-medium">Test endpoint</p>
                <p className="text-sm text-muted-foreground">
                  POST {API_BASE_URL}/audio/test-pronunciation
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Recognition language: {selectedLanguagePreset.recognitionLanguage}
                </p>
              </div>

              <Button
                onClick={runRecognitionTest}
                disabled={
                  isRecording ||
                  isSubmittingRecognition ||
                  (!recordedAudio && !uploadedAudioFile) ||
                  !hasEnabledRecognitionModel
                }
                className="w-full"
              >
                {isSubmittingRecognition ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testing Model
                  </>
                ) : (
                  "Run Recognition Test"
                )}
              </Button>

              {!hasEnabledRecognitionModel && !modelsLoading && !backendError && (
                <p className="text-sm text-amber-700">
                  {activeAvailability || `No enabled backend model is currently available for ${selectedProvider}. Configure that backend provider first.`}
                </p>
              )}

              <div className="text-sm text-muted-foreground">
                Active model: {effectiveModel || "None"}
              </div>
            </div>
          </div>

          {recognitionError && (
            <div className="rounded-lg bg-red-100 p-4 text-red-900">
              {recognitionError}
            </div>
          )}

          {recognitionResult && (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm font-medium text-emerald-700">Recognized word / text</p>
                <p className="mt-2 text-2xl font-semibold text-emerald-950">
                  {recognizedText || "(empty transcript)"}
                </p>
                <p className="mt-2 text-sm text-emerald-800">
                  Language: {recognitionResult.languageLabel || selectedLanguagePreset.label} ({recognitionResult.recognitionLanguage || selectedLanguagePreset.recognitionLanguage})
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border p-4">
                  <p className="text-sm font-medium text-muted-foreground">Recognition Details</p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Target: {recognitionResult.target || "Not provided"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Pronunciation hint: {recognitionResult.jyutping || "Not provided"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Result: <span className="font-medium capitalize text-foreground">{recognitionResult.result || "transcribed"}</span>
                  </p>
                </div>

                <div className="rounded-xl border p-4">
                  <p className="text-sm font-medium text-muted-foreground">Model Details</p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Confidence: {recognitionResult.confidence}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Model: {recognitionResult.provider}/{recognitionResult.model}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Latency: {recognitionResult.elapsed_ms} ms
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Browser Console</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Open your browser's developer console (F12 or right-click →
            Inspect) to see detailed speech logs with [Speech] prefix.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}