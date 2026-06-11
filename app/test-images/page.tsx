"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ImageIcon,
  Zap,
  Shuffle,
  Mic,
  Paintbrush,
  Settings2,
  Trash2,
  Download,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  BarChart3,
  Layers,
  SlidersHorizontal,
} from "lucide-react";
import { VoiceRecognitionTester } from "@/components/testing/voice-recognition-tester";

type ImageProvider = "cloudflare" | "gemini" | "siliconflow";
const PRODUCTION_PROMPT_KEY = "production-watercolor";

const FACE_CATEGORIES = new Set([
  "animals",
  "animal",
  "pets",
  "pet",
  "people",
  "person",
  "family",
  "characters",
]);

const PROMPT_QUANTIFIERS: Record<string, string> = {
  "toilet paper": "a roll of toilet paper",
  "paper towel": "a roll of paper towel",
  tape: "a roll of tape",
  ribbon: "a roll of ribbon",
  scissors: "a pair of scissors",
  glasses: "a pair of glasses",
  sunglasses: "a pair of sunglasses",
  shoes: "a pair of shoes",
  socks: "a pair of socks",
  pants: "a pair of pants",
  trousers: "a pair of trousers",
  chopsticks: "a pair of chopsticks",
  gloves: "a pair of gloves",
  grapes: "a bunch of grapes",
  bananas: "a bunch of bananas",
  flowers: "a bunch of flowers",
  bread: "a loaf of bread",
  water: "a glass of water",
  juice: "a glass of juice",
  milk: "a glass of milk",
  soap: "a bar of soap",
  toothpaste: "a tube of toothpaste",
  rice: "a bowl of rice",
  noodles: "a bowl of noodles",
  cereal: "a bowl of cereal",
};

const PRODUCTION_FACE_PROMPT_TEMPLATE =
  "A high-quality cute cartoon watercolor illustration of {nounPhrase} for a children's vocabulary flashcard. Soft watercolor tones in warm pastels with gentle ink outlines. The {bareWord} is centered, filling about 70% of the frame, on a plain cream paper background with a soft shadow beneath. No text, no labels, no watermarks.";

const PRODUCTION_INANIMATE_PROMPT_TEMPLATE =
  "A high-quality cartoon watercolor illustration of {nounPhrase} for a children's vocabulary flashcard. The {bareWord} is a plain inanimate object with no face, no eyes, no mouth, no expression, and no anthropomorphic features whatsoever. Soft watercolor tones in warm pastels with gentle ink outlines. The {bareWord} is centered, filling about 70% of the frame, on a plain cream paper background with a soft shadow beneath. No text, no labels, no watermarks. Just the object.";

const PRODUCTION_BASE_NEGATIVE_PROMPT =
  "photo, photograph, realistic, 3D render, scary, violent, gore, text, letters, labels, watermark, blurry, signature, dark background, busy background, multiple objects, adult, mature, deformed, ugly, low quality";

const PRODUCTION_INANIMATE_NEGATIVE_PROMPT =
  "face, eyes, mouth, smile, expression, kawaii face, cute face, anthropomorphic, cartoon face, googly eyes, eye, eyeball, emoji face, emoticon, character face, " +
  PRODUCTION_BASE_NEGATIVE_PROMPT;

/* ═══════════════════════════════════════════════════════════════════════
   MODELS
   ═══════════════════════════════════════════════════════════════════════ */

const MODELS: Record<
  string,
  {
    id: string;
    name: string;
    steps: number;
    guidance: number;
    desc: string;
    provider?: "cloudflare" | "gemini" | "siliconflow";
    supportsTuning?: boolean;
  }
> = {
  "sdxl-lightning": {
    id: "@cf/bytedance/stable-diffusion-xl-lightning",
    name: "SDXL-Lightning",
    steps: 4,
    guidance: 7.5,
    desc: "Fast 4-step, good balance",
  },
  "sdxl-base": {
    id: "@cf/stabilityai/stable-diffusion-xl-base-1.0",
    name: "SDXL Base 1.0",
    steps: 20,
    guidance: 7.5,
    desc: "High quality, slower",
  },
  dreamshaper: {
    id: "@cf/lykon/dreamshaper-8-lcm",
    name: "DreamShaper 8",
    steps: 8,
    guidance: 7.5,
    desc: "Creative / artistic",
  },
  flux: {
    id: "@cf/black-forest-labs/flux-1-schnell",
    name: "FLUX.1 Schnell",
    steps: 4,
    guidance: 7.5,
    desc: "Newest, often best",
  },
  "flux-2-dev": {
    id: "@cf/black-forest-labs/flux-2-dev",
    name: "FLUX.2 Dev",
    steps: 20,
    guidance: 7.5,
    desc: "High quality, multi-ref",
  },
  "flux-2-klein-9b": {
    id: "@cf/black-forest-labs/flux-2-klein-9b",
    name: "FLUX.2 Klein 9B",
    steps: 4,
    guidance: 7.5,
    desc: "Ultra-fast 9B distilled",
  },
  "flux-2-klein-4b": {
    id: "@cf/black-forest-labs/flux-2-klein-4b",
    name: "FLUX.2 Klein 4B",
    steps: 4,
    guidance: 7.5,
    desc: "Ultra-fast 4B distilled",
  },
  "lucid-origin": {
    id: "@cf/leonardo/lucid-origin",
    name: "Leonardo Lucid Origin",
    steps: 8,
    guidance: 7.5,
    desc: "Prompt-responsive, versatile",
  },
  "phoenix": {
    id: "@cf/leonardo/phoenix-1.0",
    name: "Leonardo Phoenix 1.0",
    steps: 8,
    guidance: 7.5,
    desc: "Coherent text, prompt adherent",
  },
  kolor: {
    id: "Kwai-Kolors/Kolors",
    name: "Kolor",
    steps: 20,
    guidance: 7.5,
    desc: "Kwai Kolors via Silicon Flow",
    provider: "siliconflow",
    supportsTuning: true,
  },
  "google-nano-banana-2": {
    id: "google/nano-banana-2",
    name: "Google Nano Banana 2",
    steps: 1,
    guidance: 1,
    desc: "Cloudflare proxied model via Workers AI gateway",
    supportsTuning: false,
  },
  "gemini-2.5-flash-image": {
    id: "gemini-2.5-flash-image",
    name: "Gemini 2.5 Flash Image",
    steps: 1,
    guidance: 1,
    desc: "Google Gemini Nano Banana",
    provider: "gemini",
    supportsTuning: false,
  },
  "gemini-3.1-flash-image-preview": {
    id: "gemini-3.1-flash-image-preview",
    name: "Gemini 3.1 Flash Image",
    steps: 1,
    guidance: 1,
    desc: "Google Gemini Nano Banana 2 preview",
    provider: "gemini",
    supportsTuning: false,
  },
};

/* ═══════════════════════════════════════════════════════════════════════
   PROMPT PRESETS
   ═══════════════════════════════════════════════════════════════════════ */

const PROMPTS: Record<
  string,
  { name: string; prompt: string; negPrompt: string; emoji: string }
> = {
  [PRODUCTION_PROMPT_KEY]: {
    name: "Production Watercolor",
    emoji: "🖌️",
    prompt: PRODUCTION_INANIMATE_PROMPT_TEMPLATE,
    negPrompt: PRODUCTION_INANIMATE_NEGATIVE_PROMPT,
  },
  realistic: {
    name: "Realistic Photo",
    emoji: "📸",
    prompt:
      "a single {word}, realistic, high quality product photo, centered on a pure white background, soft studio lighting, clean and bright, children educational flashcard, clear and recognizable, no text, no label",
    negPrompt:
      "cartoon, emoji, vector, flat, illustration, drawing, sketch, anime, manga, 3D render, text, letters, words, watermark, blurry, noisy, multiple objects, busy background, human, person, fingers, hands, face on object, anthropomorphic, dark, moody, scary",
  },
  kawaii: {
    name: "Kawaii Cartoon",
    emoji: "🧸",
    prompt:
      "a cute kawaii {word}, chibi style, adorable round shape, pastel colors, simple clean illustration, white background, children sticker design, no text",
    negPrompt:
      "realistic, photograph, dark, scary, complex background, text, letters, watermark, human, person",
  },
  duolingo: {
    name: "Duolingo Style",
    emoji: "🦉",
    prompt:
      "a {word}, cute simple illustration, bold outlines, flat bright colors, friendly cartoon style like Duolingo, white background, educational flashcard, no text, no label",
    negPrompt:
      "realistic, photograph, 3D, dark, scary, complex shading, text, letters, watermark, human face",
  },
  flat: {
    name: "Flat Icon",
    emoji: "🎯",
    prompt:
      "a {word} flat design icon, minimal vector style, solid colors, centered on white background, clean simple shapes, app icon style, no text",
    negPrompt:
      "realistic, photograph, 3D, shadow, gradient, complex, detailed, text, letters, busy background",
  },
  watercolor: {
    name: "Watercolor",
    emoji: "🎨",
    prompt:
      "a beautiful watercolor painting of a {word}, soft delicate brushstrokes, gentle pastel colors, white paper background, children book illustration style, artistic, no text",
    negPrompt:
      "photograph, digital, harsh colors, dark, scary, text, letters, watermark, multiple objects",
  },
  "3d-clay": {
    name: "3D Clay / Pixar",
    emoji: "🏺",
    prompt:
      "a {word}, cute 3D rendered object, soft lighting, clay material, rounded shapes, centered on light gray background, Pixar style, children friendly, no text",
    negPrompt:
      "flat, 2D, sketch, photograph, dark, scary, text, letters, watermark, realistic texture",
  },
  "pixel-art": {
    name: "Pixel Art",
    emoji: "👾",
    prompt:
      "a {word} in pixel art style, 16-bit retro game sprite, clean pixels, bright colors, white background, centered, cute, no text",
    negPrompt:
      "realistic, photograph, blurry, smooth, gradient, text, letters, 3D, dark",
  },
  "line-art": {
    name: "Line Art",
    emoji: "✏️",
    prompt:
      "a {word}, minimal line art drawing, single continuous line, black ink on white background, simple elegant, centered, no text",
    negPrompt:
      "color, realistic, photograph, complex, detailed shading, text, letters, multiple objects, busy",
  },
};

const MODEL_KEYS = Object.keys(MODELS);
const PROMPT_KEYS = Object.keys(PROMPTS);
const IMAGE_REQUEST_TIMEOUT_MS = 90000;
const EVALUATION_REQUEST_TIMEOUT_MS = 60000;
const CUSTOM_PROMPT_KEY = "__custom_prompt";
const DEFAULT_COMPARE_MODEL_KEYS = MODEL_KEYS;

/* ═══════════════════════════════════════════════════════════════════════
   TEST WORDS
   ═══════════════════════════════════════════════════════════════════════ */

type Word = { en: string; cn: string; cat: string };

const WORD_GROUPS: Record<string, Word[]> = {
  Animals: [
    { en: "cat", cn: "貓", cat: "Animals" },
    { en: "dog", cn: "狗", cat: "Animals" },
    { en: "elephant", cn: "大象", cat: "Animals" },
    { en: "butterfly", cn: "蝴蝶", cat: "Animals" },
    { en: "panda", cn: "熊貓", cat: "Animals" },
    { en: "penguin", cn: "企鵝", cat: "Animals" },
  ],
  Food: [
    { en: "apple", cn: "蘋果", cat: "Food" },
    { en: "pizza", cn: "薄餅", cat: "Food" },
    { en: "ice cream", cn: "雪糕", cat: "Food" },
    { en: "banana", cn: "香蕉", cat: "Food" },
    { en: "cake", cn: "蛋糕", cat: "Food" },
    { en: "sushi", cn: "壽司", cat: "Food" },
  ],
  Transport: [
    { en: "car", cn: "車", cat: "Transport" },
    { en: "airplane", cn: "飛機", cat: "Transport" },
    { en: "bicycle", cn: "單車", cat: "Transport" },
    { en: "bus", cn: "巴士", cat: "Transport" },
    { en: "train", cn: "火車", cat: "Transport" },
  ],
  Toys: [
    { en: "teddy bear", cn: "熊仔", cat: "Toys" },
    { en: "balloon", cn: "氣球", cat: "Toys" },
    { en: "ball", cn: "波", cat: "Toys" },
    { en: "kite", cn: "風箏", cat: "Toys" },
  ],
  Nature: [
    { en: "tree", cn: "樹", cat: "Nature" },
    { en: "flower", cn: "花", cat: "Nature" },
    { en: "sun", cn: "太陽", cat: "Nature" },
    { en: "star", cn: "星星", cat: "Nature" },
  ],
  Household: [
    { en: "book", cn: "書", cat: "Household" },
    { en: "umbrella", cn: "遮", cat: "Household" },
    { en: "cup", cn: "杯", cat: "Household" },
    { en: "clock", cn: "鐘", cat: "Household" },
    { en: "camera", cn: "相機", cat: "Household" },
  ],
  Clothing: [
    { en: "hat", cn: "帽", cat: "Clothing" },
    { en: "sneakers", cn: "鞋", cat: "Clothing" },
    { en: "glasses", cn: "眼鏡", cat: "Clothing" },
  ],
};

const ALL_WORDS = Object.values(WORD_GROUPS).flat();

function getPromptWordValue(word: Word): string {
  return (word.en || "object").trim().toLowerCase() || "object";
}

function getNounPhrase(word: Word): string {
  const promptWord = getPromptWordValue(word);
  if (PROMPT_QUANTIFIERS[promptWord]) {
    return PROMPT_QUANTIFIERS[promptWord];
  }

  const article = promptWord[0] && "aeiou".includes(promptWord[0]) ? "an" : "a";
  return `${article} ${promptWord}`;
}

function getBareWord(nounPhrase: string): string {
  let bareWord = nounPhrase;
  for (const prefix of [
    "a bunch of ",
    "a pair of ",
    "a roll of ",
    "a loaf of ",
    "a glass of ",
    "a piece of ",
    "a slice of ",
    "a set of ",
    "a bar of ",
    "a tube of ",
    "a bag of ",
    "a box of ",
    "an ",
    "a ",
  ]) {
    if (bareWord.startsWith(prefix)) {
      return bareWord.slice(prefix.length);
    }
  }

  return bareWord;
}

function wordHasFace(word: Word): boolean {
  return FACE_CATEGORIES.has((word.cat || "").trim().toLowerCase());
}

function buildProductionPromptText(word: Word): string {
  const nounPhrase = getNounPhrase(word);
  const bareWord = getBareWord(nounPhrase);
  const template = wordHasFace(word)
    ? PRODUCTION_FACE_PROMPT_TEMPLATE
    : PRODUCTION_INANIMATE_PROMPT_TEMPLATE;

  return template
    .replace(/{nounPhrase}/g, nounPhrase)
    .replace(/{bareWord}/g, bareWord)
    .replace(/{word}/g, getPromptWordValue(word));
}

function buildProductionNegativePrompt(word: Word): string {
  return wordHasFace(word)
    ? PRODUCTION_BASE_NEGATIVE_PROMPT
    : PRODUCTION_INANIMATE_NEGATIVE_PROMPT;
}

function resolvePromptTemplate(template: string, word: Word): string {
  const nounPhrase = getNounPhrase(word);
  const bareWord = getBareWord(nounPhrase);

  return template
    .replace(/{nounPhrase}/g, nounPhrase)
    .replace(/{bareWord}/g, bareWord)
    .replace(/{word}/g, getPromptWordValue(word));
}

function isProductionTemplate(prompt: string, negPrompt: string): boolean {
  return (
    prompt.trim() === PRODUCTION_INANIMATE_PROMPT_TEMPLATE &&
    negPrompt.trim() === PRODUCTION_INANIMATE_NEGATIVE_PROMPT
  );
}

function getModelProvider(modelKey: string): ImageProvider {
  return MODELS[modelKey]?.provider ?? "cloudflare";
}

function modelSupportsTuning(modelKey: string): boolean {
  return MODELS[modelKey]?.supportsTuning ?? getModelProvider(modelKey) === "cloudflare";
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ═══════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════ */

interface ImageResult {
  id: string;
  word: Word;
  modelKey: string;
  modelId?: string;
  modelLabel?: string;
  provider?: ImageProvider;
  promptKey: string;
  promptLabel?: string;
  promptText: string;
  negativePromptText: string;
  guidance: number;
  steps: number;
  status: "pending" | "loading" | "done" | "error";
  imageUrl?: string;
  source?: string;
  elapsed?: number;
  error?: string;
  tag?: string;
  evaluation?: ImageEvaluation;
}

interface ImageEvaluationScores {
  promptAdherence: number;
  subjectCorrectness: number;
  singleObjectClarity: number;
  backgroundSimplicity: number;
  textFreeOutput: number;
  childSafety: number;
  visualQuality: number;
  styleFit: number;
}

interface ImageEvaluation {
  status: "loading" | "done" | "error";
  weightedScore?: number;
  hardFail?: boolean;
  summary?: string;
  issues?: string[];
  scores?: ImageEvaluationScores;
  judgeModel?: string;
  evaluatedAt?: string;
  error?: string;
}

interface ImageEvaluationResponse {
  weightedScore: number;
  hardFail: boolean;
  summary: string;
  issues: string[];
  scores: ImageEvaluationScores;
  judgeModel: string;
  evaluatedAt: string;
}

interface ModelSummaryAccumulator {
  modelKey: string;
  modelName: string;
  provider: ImageProvider;
  sampleCount: number;
  successCount: number;
  latencies: number[];
  weightedScores: number[];
  evaluatedCount: number;
  passCount: number;
  hardFailCount: number;
}

interface ModelSummary {
  modelKey: string;
  modelName: string;
  provider: ImageProvider;
  sampleCount: number;
  successCount: number;
  successRate: number;
  averageLatency: number | null;
  averageWeightedScore: number | null;
  evaluatedCount: number;
  passRate: number | null;
  hardFailCount: number;
  latencyScore: number;
  rankingScore: number | null;
}

const MODEL_RANKING_WEIGHTS = {
  evaluation: 0.7,
  successRate: 0.2,
  latency: 0.1,
} as const;

function roundToOne(value: number): number {
  return Math.round(value * 10) / 10;
}

function average(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  return roundToOne(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function buildLatencyScore(
  averageLatency: number | null,
  fastestLatency: number | null,
): number {
  if (!averageLatency || !fastestLatency) {
    return 0;
  }

  return roundToOne(Math.min(100, (fastestLatency / averageLatency) * 100));
}

function arrayBufferToBase64(arrayBuffer: ArrayBuffer): string {
  const bytes = new Uint8Array(arrayBuffer);
  const chunkSize = 0x8000;
  let binary = "";

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

/* ═══════════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════════ */

export default function TestImagesPage() {
  // ── State ──
  const [results, setResults] = useState<ImageResult[]>([]);
  const [selectedModel, setSelectedModel] = useState("google-nano-banana-2");
  const [comparePromptModel, setComparePromptModel] = useState("kolor");
  const [selectedPrompt, setSelectedPrompt] = useState(PRODUCTION_PROMPT_KEY);
  const [customPrompt, setCustomPrompt] = useState(PROMPTS[PRODUCTION_PROMPT_KEY].prompt);
  const [customNegPrompt, setCustomNegPrompt] = useState(
    PROMPTS[PRODUCTION_PROMPT_KEY].negPrompt
  );
  const [guidance, setGuidance] = useState(7.5);
  const [steps, setSteps] = useState(4);
  const [singleWord, setSingleWord] = useState("");
  const [wordCategory, setWordCategory] = useState("all");
  const [selectedCompareModels, setSelectedCompareModels] = useState<string[]>(
    DEFAULT_COMPARE_MODEL_KEYS
  );
  const [enableImageEvaluation, setEnableImageEvaluation] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [gridCols, setGridCols] = useState(4);
  const [toolTab, setToolTab] = useState("images");
  const [activeTab, setActiveTab] = useState("quick");
  const abortRef = useRef<AbortController | null>(null);
  const selectedModelSupportsTuning = modelSupportsTuning(selectedModel);
  const compareModelKeys = MODEL_KEYS.filter((modelKey) =>
    selectedCompareModels.includes(modelKey)
  );
  const compareModelCount = compareModelKeys.length;

  // Stats
  const pending = results.filter((r) => r.status === "pending" || r.status === "loading").length;
  const done = results.filter((r) => r.status === "done").length;
  const failed = results.filter((r) => r.status === "error").length;
  const evaluationPending = results.filter((r) => r.evaluation?.status === "loading").length;
  const evaluationDone = results.filter((r) => r.evaluation?.status === "done").length;
  const evaluationFailed = results.filter((r) => r.evaluation?.status === "error").length;
  const avgTime =
    done > 0
      ? results
          .filter((r) => r.status === "done" && r.elapsed)
          .reduce((sum, r) => sum + (r.elapsed ?? 0), 0) / done
      : 0;
  const fastestSuccessfulLatency = results.reduce<number | null>((minLatency, result) => {
    if (result.status !== "done" || typeof result.elapsed !== "number") {
      return minLatency;
    }

    return minLatency === null ? result.elapsed : Math.min(minLatency, result.elapsed);
  }, null);
  const modelSummaries: ModelSummary[] = Array.from(
    results.reduce<Map<string, ModelSummaryAccumulator>>((map, result) => {
      const existing =
        map.get(result.modelKey) ??
        {
          modelKey: result.modelKey,
          modelName: result.modelLabel ?? MODELS[result.modelKey]?.name ?? result.modelKey,
          provider: result.provider ?? getModelProvider(result.modelKey),
          sampleCount: 0,
          successCount: 0,
          latencies: [],
          weightedScores: [],
          evaluatedCount: 0,
          passCount: 0,
          hardFailCount: 0,
        };

      existing.sampleCount += 1;

      if (result.status === "done") {
        existing.successCount += 1;
        if (typeof result.elapsed === "number") {
          existing.latencies.push(result.elapsed);
        }
      }

      if (result.evaluation?.status === "done" && result.evaluation.scores) {
        existing.evaluatedCount += 1;
        if (typeof result.evaluation.weightedScore === "number") {
          existing.weightedScores.push(result.evaluation.weightedScore);
        }

        if (result.evaluation.hardFail) {
          existing.hardFailCount += 1;
        } else {
          existing.passCount += 1;
        }
      }

      map.set(result.modelKey, existing);
      return map;
    }, new Map<string, ModelSummaryAccumulator>()).values(),
  )
    .map((summary): ModelSummary => {
      const averageLatency = average(summary.latencies);
      const averageWeightedScore = average(summary.weightedScores);
      const successRate =
        summary.sampleCount > 0 ? summary.successCount / summary.sampleCount : 0;
      const passRate =
        summary.evaluatedCount > 0 ? summary.passCount / summary.evaluatedCount : null;
      const latencyScore = buildLatencyScore(averageLatency, fastestSuccessfulLatency);
      const rankingScore =
        averageWeightedScore === null
          ? null
          : roundToOne(
              averageWeightedScore * MODEL_RANKING_WEIGHTS.evaluation +
                successRate * 100 * MODEL_RANKING_WEIGHTS.successRate +
                latencyScore * MODEL_RANKING_WEIGHTS.latency,
            );

      return {
        modelKey: summary.modelKey,
        modelName: summary.modelName,
        provider: summary.provider,
        sampleCount: summary.sampleCount,
        successCount: summary.successCount,
        successRate,
        averageLatency,
        averageWeightedScore,
        evaluatedCount: summary.evaluatedCount,
        passRate,
        hardFailCount: summary.hardFailCount,
        latencyScore,
        rankingScore,
      };
    })
    .sort((left, right) => {
      if (left.rankingScore !== null && right.rankingScore !== null) {
        return right.rankingScore - left.rankingScore;
      }
      if (left.rankingScore !== null) {
        return -1;
      }
      if (right.rankingScore !== null) {
        return 1;
      }
      return right.successRate - left.successRate;
    });
  const topRankedModel =
    modelSummaries.find((summary) => summary.rankingScore !== null) ?? null;

  // ── Sync prompt text when preset changes ──
  useEffect(() => {
    const p = PROMPTS[selectedPrompt];
    if (p) {
      setCustomPrompt(p.prompt);
      setCustomNegPrompt(p.negPrompt);
    }
  }, [selectedPrompt]);

  // ── Sync steps/guidance when model changes ──
  useEffect(() => {
    const m = MODELS[selectedModel];
    if (m) {
      setSteps(m.steps);
      setGuidance(m.guidance);
    }
  }, [selectedModel]);

  // ── Build API URL ──
  const buildUrl = useCallback(
    (
      word: Word,
      modelKey: string,
      modelId: string | undefined,
      provider: ImageProvider | undefined,
      prompt: string,
      negPrompt: string,
      g: number,
      s: number,
    ) => {
      const resolvedModelId = modelId ?? MODELS[modelKey]?.id;
      const resolvedProvider = provider ?? getModelProvider(modelKey);

      if (!resolvedModelId) {
        throw new Error(`Unknown image model: ${modelKey}`);
      }

      const params = new URLSearchParams({
        word: word.en,
        wordCantonese: word.cn,
        category: "test",
        testMode: "1",
        model: resolvedModelId,
        provider: resolvedProvider,
        promptOverride: prompt,
        negPromptOverride: negPrompt,
        guidance: String(g),
        numSteps: String(s),
      });
      params.set("requestNonce", `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
      return `/api/generate-image?${params}`;
    },
    []
  );

  const evaluateImage = useCallback(
    async (
      result: ImageResult,
      imageBuffer: ArrayBuffer,
      mimeType: string,
      signal?: AbortSignal,
    ) => {
      const requestController = new AbortController();
      const handleBatchAbort = () => requestController.abort();
      const timeoutId = window.setTimeout(() => {
        requestController.abort();
      }, EVALUATION_REQUEST_TIMEOUT_MS);

      if (signal) {
        if (signal.aborted) {
          requestController.abort();
        } else {
          signal.addEventListener("abort", handleBatchAbort, { once: true });
        }
      }

      try {
        const res = await fetch("/api/evaluate-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            word: result.word.en,
            wordCantonese: result.word.cn,
            modelKey: result.modelKey,
            modelLabel: result.modelLabel ?? MODELS[result.modelKey]?.name ?? result.modelKey,
            promptKey: result.promptKey,
            promptLabel:
              PROMPTS[result.promptKey]?.name ?? result.promptLabel ?? result.promptKey,
            promptText: result.promptText,
            negativePromptText: result.negativePromptText,
            source: result.source,
            mimeType,
            imageBase64: arrayBufferToBase64(imageBuffer),
          }),
          signal: requestController.signal,
        });

        const responseText = await res.text();
        const responseBody = responseText
          ? (() => {
              try {
                return JSON.parse(responseText) as unknown;
              } catch {
                return { detail: responseText };
              }
            })()
          : null;

        if (!res.ok) {
          const detail =
            responseBody &&
            typeof responseBody === "object" &&
            "detail" in responseBody &&
            typeof (responseBody as { detail?: unknown }).detail === "string"
              ? (responseBody as { detail: string }).detail
              : `HTTP ${res.status}`;

          throw new Error(detail);
        }

        if (!responseBody || typeof responseBody !== "object") {
          throw new Error("Image evaluation returned an empty response");
        }

        const evaluation = responseBody as ImageEvaluationResponse;

        setResults((prev) =>
          prev.map((entry) =>
            entry.id === result.id
              ? {
                  ...entry,
                  evaluation: {
                    status: "done" as const,
                    ...evaluation,
                  },
                }
              : entry,
          ),
        );
      } catch (error) {
        if (signal?.aborted) {
          return;
        }

        const errorMessage =
          requestController.signal.aborted
            ? `Timed out after ${EVALUATION_REQUEST_TIMEOUT_MS / 1000}s waiting for image evaluation.`
            : error instanceof Error
              ? error.message
              : "Unknown evaluation error";

        setResults((prev) =>
          prev.map((entry) =>
            entry.id === result.id
              ? {
                  ...entry,
                  evaluation: {
                    status: "error" as const,
                    error: errorMessage,
                  },
                }
              : entry,
          ),
        );
      } finally {
        window.clearTimeout(timeoutId);
        signal?.removeEventListener("abort", handleBatchAbort);
      }
    },
    [],
  );

  // ── Fetch a single image ──
  const fetchImage = useCallback(
    async (result: ImageResult, signal?: AbortSignal) => {
      const url = buildUrl(
        result.word,
        result.modelKey,
        result.modelId,
        result.provider,
        result.promptText,
        result.negativePromptText,
        result.guidance,
        result.steps
      );

      setResults((prev) =>
        prev.map((r) => (r.id === result.id ? { ...r, status: "loading" as const } : r))
      );

      const t0 = Date.now();
      const requestController = new AbortController();
      const handleBatchAbort = () => requestController.abort();
      const timeoutId = window.setTimeout(() => {
        requestController.abort();
      }, IMAGE_REQUEST_TIMEOUT_MS);

      if (signal) {
        if (signal.aborted) {
          requestController.abort();
        } else {
          signal.addEventListener("abort", handleBatchAbort, { once: true });
        }
      }

      try {
        const res = await fetch(url, { signal: requestController.signal });
        const elapsed = (Date.now() - t0) / 1000;
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const source = res.headers.get("X-Image-Source") ?? "unknown";
        const upstreamError = res.headers.get("X-Image-Error");
        const expectedProvider = result.provider ?? getModelProvider(result.modelKey);

        if (!source.startsWith(`${expectedProvider}:`)) {
          throw new Error(
            upstreamError
              ? `${source}: ${upstreamError}`
              : expectedProvider === "gemini"
                ? `Expected live Gemini generation, received ${source}. Configure Gemini credentials or Cloudflare AI Gateway, or check the Gemini model request.`
                : `Expected live Cloudflare generation, received ${source}. Configure Cloudflare credentials or check the model request.`
          );
        }

        const blob = await res.blob();
        const imageBuffer = await blob.arrayBuffer();
        const mimeType = blob.type || res.headers.get("content-type") || "image/png";
        const imageUrl = URL.createObjectURL(blob);

        setResults((prev) =>
          prev.map((r) =>
            r.id === result.id
              ? {
                  ...r,
                  status: "done" as const,
                  imageUrl,
                  source,
                  elapsed,
                  evaluation: enableImageEvaluation
                    ? { status: "loading" as const }
                    : undefined,
                }
              : r
          )
        );

        if (enableImageEvaluation && !signal?.aborted) {
          await evaluateImage(
            {
              ...result,
              imageUrl,
              source,
              elapsed,
            },
            imageBuffer,
            mimeType,
            signal,
          );
        }
      } catch (err: unknown) {
        if (signal?.aborted) return;
        const elapsed = (Date.now() - t0) / 1000;
        const errorMessage =
          requestController.signal.aborted
            ? `Timed out after ${IMAGE_REQUEST_TIMEOUT_MS / 1000}s waiting for image generation.`
            : err instanceof Error
              ? err.message
              : "Unknown error";

        setResults((prev) =>
          prev.map((r) =>
            r.id === result.id
              ? {
                  ...r,
                  status: "error" as const,
                  elapsed,
                  error: errorMessage,
                }
              : r
          )
        );
      } finally {
        window.clearTimeout(timeoutId);
        signal?.removeEventListener("abort", handleBatchAbort);
      }
    },
    [buildUrl, enableImageEvaluation, evaluateImage]
  );

  // ── Run a batch of tests (with concurrency control) ──
  const runBatch = useCallback(
    async (specs: Omit<ImageResult, "id" | "status">[]) => {
      const controller = new AbortController();
      abortRef.current = controller;
      setIsRunning(true);

      const newResults: ImageResult[] = specs.map((s, i) => ({
        ...s,
        id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
        status: "pending" as const,
      }));

      setResults(newResults);

      // Concurrent execution with limit of 2
      const sem = { count: 0 };
      const MAX_CONCURRENT = 2;

      const tasks = newResults.map(
        (r) =>
          new Promise<void>(async (resolve) => {
            while (sem.count >= MAX_CONCURRENT) {
              await new Promise((w) => setTimeout(w, 200));
              if (controller.signal.aborted) {
                resolve();
                return;
              }
            }
            if (controller.signal.aborted) {
              resolve();
              return;
            }
            sem.count++;
            await fetchImage(r, controller.signal);
            sem.count--;
            resolve();
          })
      );

      await Promise.all(tasks);
      setIsRunning(false);
    },
    [fetchImage]
  );

  // ── Helpers to build specs ──

  const getWord = (): Word | null => {
    const w = singleWord.trim();
    if (!w) return null;
    const isCN = /[\u4e00-\u9fff]/.test(w);
    // Try to find in dictionary
    const found = ALL_WORDS.find((x) => x.en === w || x.cn === w);
    if (found) return found;
    return isCN ? { en: w, cn: w, cat: "Custom" } : { en: w, cn: "", cat: "Custom" };
  };

  const getWords = (): Word[] => {
    if (wordCategory === "all") return ALL_WORDS;
    if (wordCategory === "random5") return shuffle(ALL_WORDS).slice(0, 5);
    if (wordCategory === "random3") return shuffle(ALL_WORDS).slice(0, 3);
    return WORD_GROUPS[wordCategory] ?? [];
  };

  const buildPresetPromptSpec = useCallback(
    (word: Word, promptKey: string) => {
      const preset = PROMPTS[promptKey];
      if (!preset) {
        return {
          promptKey: CUSTOM_PROMPT_KEY,
          promptLabel: "Custom Prompt",
          promptText: resolvePromptTemplate(customPrompt, word),
          negativePromptText: customNegPrompt,
        };
      }

      if (promptKey === PRODUCTION_PROMPT_KEY) {
        return {
          promptKey,
          promptText: buildProductionPromptText(word),
          negativePromptText: buildProductionNegativePrompt(word),
        };
      }

      return {
        promptKey,
        promptText: resolvePromptTemplate(preset.prompt, word),
        negativePromptText: preset.negPrompt,
      };
    },
    [customNegPrompt, customPrompt]
  );

  const buildCustomPromptSpec = useCallback(
    (word: Word, promptLabel = "Custom Prompt") => {
      if (isProductionTemplate(customPrompt, customNegPrompt)) {
        return {
          promptKey: CUSTOM_PROMPT_KEY,
          promptLabel: `${PROMPTS[PRODUCTION_PROMPT_KEY].name} Start`,
          promptText: buildProductionPromptText(word),
          negativePromptText: buildProductionNegativePrompt(word),
        };
      }

      return {
        promptKey: CUSTOM_PROMPT_KEY,
        promptLabel,
        promptText: resolvePromptTemplate(customPrompt, word),
        negativePromptText: customNegPrompt,
      };
    },
    [customNegPrompt, customPrompt]
  );

  const makeSpec = (
    word: Word,
    modelKey: string,
    promptSpec: Pick<
      ImageResult,
      "promptKey" | "promptLabel" | "promptText" | "negativePromptText"
    >,
    g: number,
    s: number,
    tag?: string,
    overrides?: Partial<Pick<ImageResult, "modelId" | "modelLabel" | "provider">>,
  ) => ({
    word,
    modelKey,
    ...promptSpec,
    guidance: g,
    steps: s,
    tag,
    ...overrides,
  });

  const setCompareModelSelection = useCallback((modelKeys: string[]) => {
    setSelectedCompareModels(
      MODEL_KEYS.filter((modelKey) => modelKeys.includes(modelKey))
    );
  }, []);

  const toggleCompareModel = useCallback((modelKey: string, checked: boolean) => {
    setSelectedCompareModels((prev) =>
      checked
        ? MODEL_KEYS.filter((key) => key === modelKey || prev.includes(key))
        : prev.filter((key) => key !== modelKey)
    );
  }, []);

  // ── Actions ──

  const handleTestSingle = () => {
    const w = getWord();
    if (!w) return alert("Enter a word first");
    runBatch([
      makeSpec(w, selectedModel, buildPresetPromptSpec(w, selectedPrompt), guidance, steps),
    ]);
  };

  const handleTestCustomPrompt = () => {
    const w = getWord();
    if (!w) return alert("Enter a word first");
    runBatch([makeSpec(w, selectedModel, buildCustomPromptSpec(w), guidance, steps)]);
  };

  const handleTestCategory = () => {
    const words = getWords();
    runBatch(
      words.map((w) =>
        makeSpec(w, selectedModel, buildPresetPromptSpec(w, selectedPrompt), guidance, steps)
      )
    );
  };

  const handleCompareModels = () => {
    const w = getWord();
    if (!w) return alert("Enter a word first");
    if (compareModelKeys.length === 0) {
      return alert("Select at least one model for comparison");
    }
    const promptSpec = buildCustomPromptSpec(w, "Custom Compare Prompt");
    const specs = compareModelKeys.map((mk) =>
      makeSpec(w, mk, promptSpec, MODELS[mk].guidance, MODELS[mk].steps)
    );

    setGridCols(Math.min(compareModelKeys.length, 4));
    runBatch(specs);
  };

  const handleComparePrompts = () => {
    const w = getWord();
    if (!w) return alert("Enter a word first");
    const compareModel = MODELS[comparePromptModel];
    if (!compareModel) return alert("Select a valid model for prompt comparison");
    const specs = Object.keys(PROMPTS).map((pk) =>
      makeSpec(
        w,
        comparePromptModel,
        buildPresetPromptSpec(w, pk),
        compareModel.guidance,
        compareModel.steps
      )
    );
    setGridCols(4);
    runBatch(specs);
  };

  const handleCompareGuidance = () => {
    const w = getWord();
    if (!w) return alert("Enter a word first");
    const values = [1, 3, 5, 7.5, 10, 15, 20];
    const specs = values.map((g) =>
      makeSpec(w, selectedModel, buildPresetPromptSpec(w, selectedPrompt), g, steps, `g=${g}`)
    );
    setGridCols(4);
    runBatch(specs);
  };

  const handleCompareSteps = () => {
    const w = getWord();
    if (!w) return alert("Enter a word first");
    const values = [1, 2, 4, 8, 12, 20];
    const specs = values.map((s) =>
      makeSpec(w, selectedModel, buildPresetPromptSpec(w, selectedPrompt), guidance, s, `s=${s}`)
    );
    setGridCols(3);
    runBatch(specs);
  };

  const handleFullMatrix = () => {
    const w = getWord();
    if (!w) return alert("Enter a word first");
    if (compareModelKeys.length === 0) {
      return alert("Select at least one model for comparison");
    }
    const specs: Omit<ImageResult, "id" | "status">[] = [];
    for (const mk of compareModelKeys) {
      for (const pk of Object.keys(PROMPTS)) {
        specs.push(
          makeSpec(w, mk, buildPresetPromptSpec(w, pk), MODELS[mk].guidance, MODELS[mk].steps)
        );
      }
    }

    setGridCols(Object.keys(PROMPTS).length);
    runBatch(specs);
  };

  const handleStop = () => {
    abortRef.current?.abort();
    setIsRunning(false);
  };

  const handleClear = () => {
    results.forEach((r) => {
      if (r.imageUrl) URL.revokeObjectURL(r.imageUrl);
    });
    setResults([]);
  };

  const handleDownloadAll = () => {
    results
      .filter((r) => r.status === "done" && r.imageUrl)
      .forEach((r) => {
        const a = document.createElement("a");
        a.href = r.imageUrl!;
        a.download = `${r.word.en}__${r.modelKey}__${r.promptKey}__g${r.guidance}__s${r.steps}.jpg`;
        a.click();
      });
  };

  // ── Cleanup blob URLs on unmount ──
  useEffect(() => {
    return () => {
      results.forEach((r) => {
        if (r.imageUrl) URL.revokeObjectURL(r.imageUrl);
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ═══════════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════════ */

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-slate-800">Multimodal Test Lab</h1>
          <p className="mt-1 text-sm text-slate-500">
            Compare image generation and voice recognition tools from one shared testing route.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Keep the image comparison workflow intact under one tab and switch to backend pronunciation testing when you need to compare speech models.
          </p>
        </div>

        <Tabs value={toolTab} onValueChange={setToolTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="images" className="gap-2">
              <ImageIcon className="h-4 w-4" />
              Image Generation
            </TabsTrigger>
            <TabsTrigger value="voice" className="gap-2">
              <Mic className="h-4 w-4" />
              Voice Recognition
            </TabsTrigger>
          </TabsList>

          <TabsContent value="images" className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center justify-center gap-2">
                <ImageIcon className="h-7 w-7 text-indigo-500" />
                Image Generation Tester
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Compare Cloudflare Workers AI, Silicon Flow, and Gemini image models, prompt styles, and parameters.
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Only live provider responses such as <span className="font-semibold text-slate-700">cloudflare:*</span>, <span className="font-semibold text-slate-700">siliconflow:*</span>, or <span className="font-semibold text-slate-700">gemini:*</span> count as valid comparisons.
                Fallback images are surfaced as errors so the grid does not hide credential or model issues.
              </p>
            </div>

            <div className="rounded-2xl border bg-white/80 p-4 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-700">LLM image evaluation</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Score every successful image with a multimodal judge for prompt adherence,
                    subject correctness, text-free output, child safety, and flashcard fit. This
                    adds extra latency and Gemini usage.
                  </p>
                </div>
                <div className="flex items-center gap-3 self-start rounded-full border bg-slate-50 px-3 py-2">
                  <div className="text-right">
                    <p className="text-xs font-medium text-slate-700">
                      {enableImageEvaluation ? "Enabled" : "Disabled"}
                    </p>
                    <p className="text-[11px] text-slate-400">Auto-score generated images</p>
                  </div>
                  <Switch
                    checked={enableImageEvaluation}
                    onCheckedChange={setEnableImageEvaluation}
                  />
                </div>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <TabsList className="grid w-full grid-cols-4 max-w-lg mx-auto">
                <TabsTrigger value="quick">Quick Test</TabsTrigger>
                <TabsTrigger value="compare">Compare</TabsTrigger>
                <TabsTrigger value="prompt">Prompt</TabsTrigger>
                <TabsTrigger value="params">Parameters</TabsTrigger>
              </TabsList>

              <TabsContent value="quick">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Zap className="h-4 w-4 text-amber-500" />
                      Quick Test
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-3 items-end">
                      <div className="flex-1 min-w-[140px]">
                        <label className="text-xs font-medium text-slate-500 mb-1 block">
                          Word (English or Chinese)
                        </label>
                        <Input
                          placeholder="cat, 貓, balloon..."
                          value={singleWord}
                          onChange={(e) => setSingleWord(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleTestSingle()}
                        />
                      </div>
                      <div className="min-w-[180px]">
                        <label className="text-xs font-medium text-slate-500 mb-1 block">
                          Model
                        </label>
                        <Select value={selectedModel} onValueChange={setSelectedModel}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(MODELS).map(([k, m]) => (
                              <SelectItem key={k} value={k}>
                                {m.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="min-w-[180px]">
                        <label className="text-xs font-medium text-slate-500 mb-1 block">
                          Prompt Style
                        </label>
                        <Select value={selectedPrompt} onValueChange={setSelectedPrompt}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(PROMPTS).map(([k, p]) => (
                              <SelectItem key={k} value={k}>
                                {p.emoji} {p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={handleTestSingle} disabled={isRunning || !singleWord.trim()}>
                        <Zap className="h-4 w-4 mr-1" /> Generate Single
                      </Button>
                      <div className="flex items-center gap-2">
                        <Select value={wordCategory} onValueChange={setWordCategory}>
                          <SelectTrigger className="w-[160px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Words ({ALL_WORDS.length})</SelectItem>
                            <SelectItem value="random3">Random 3</SelectItem>
                            <SelectItem value="random5">Random 5</SelectItem>
                            {Object.entries(WORD_GROUPS).map(([k, v]) => (
                              <SelectItem key={k} value={k}>
                                {k} ({v.length})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button variant="secondary" onClick={handleTestCategory} disabled={isRunning}>
                          <Layers className="h-4 w-4 mr-1" /> Generate Category
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="compare">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Shuffle className="h-4 w-4 text-indigo-500" />
                      Side-by-Side Comparison
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-3 items-end">
                      <div className="flex-1 min-w-[180px]">
                        <label className="text-xs font-medium text-slate-500 mb-1 block">
                          Word to Compare
                        </label>
                        <Input
                          placeholder="Enter a word..."
                          value={singleWord}
                          onChange={(e) => setSingleWord(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="rounded-lg border bg-slate-50 p-4 space-y-3">
                      <div>
                        <p className="text-xs font-medium text-slate-600">Prompt for model comparison</p>
                        <p className="mt-1 text-xs text-slate-500">
                          `Compare Models` uses the custom prompt you enter here. `Compare Prompts` runs the preset library against the prompt comparison model below, and `Full Matrix` uses the checked models with the preset library.
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          The default starting template is now aligned to the backend Kolors production watercolor prompt builder.
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500 mb-1 block">
                          Prompt <span className="text-slate-400">({"{word}"}, {"{nounPhrase}"}, {"{bareWord}"} tokens supported)</span>
                        </label>
                        <Textarea
                          value={customPrompt}
                          onChange={(e) => setCustomPrompt(e.target.value)}
                          rows={3}
                          className="font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500 mb-1 block">
                          Negative Prompt
                        </label>
                        <Textarea
                          value={customNegPrompt}
                          onChange={(e) => setCustomNegPrompt(e.target.value)}
                          rows={2}
                          className="font-mono text-xs"
                        />
                      </div>
                    </div>
                    <div className="rounded-lg border bg-slate-50 p-4 space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-medium text-slate-600">Models to include in testing</p>
                          <p className="mt-1 text-xs text-slate-500">
                            Pick the built-in models to include for `Compare Models` and `Full Matrix`.
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCompareModelSelection(MODEL_KEYS)}
                            disabled={isRunning}
                          >
                            All
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setCompareModelSelection(
                                MODEL_KEYS.filter(
                                  (modelKey) => getModelProvider(modelKey) === "cloudflare"
                                )
                              )
                            }
                            disabled={isRunning}
                          >
                            Cloudflare
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setCompareModelSelection(
                                MODEL_KEYS.filter(
                                  (modelKey) => getModelProvider(modelKey) === "gemini"
                                )
                              )
                            }
                            disabled={isRunning}
                          >
                            Gemini
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setCompareModelSelection(
                                MODEL_KEYS.filter(
                                  (modelKey) => getModelProvider(modelKey) === "siliconflow"
                                )
                              )
                            }
                            disabled={isRunning}
                          >
                            Silicon Flow
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCompareModelSelection([])}
                            disabled={isRunning || compareModelCount === 0}
                          >
                            Clear
                          </Button>
                        </div>
                      </div>
                      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                        {Object.entries(MODELS).map(([modelKey, model]) => {
                          const checked = compareModelKeys.includes(modelKey);

                          return (
                            <label
                              key={modelKey}
                              className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2 transition-colors ${
                                checked
                                  ? "border-indigo-200 bg-indigo-50/60"
                                  : "border-slate-200 bg-white hover:border-indigo-200"
                              }`}
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(value) =>
                                  toggleCompareModel(modelKey, value === true)
                                }
                                className="mt-0.5"
                              />
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-sm font-medium text-slate-700">
                                    {model.name}
                                  </span>
                                  <Badge variant="outline" className="text-[10px] capitalize">
                                    {getModelProvider(modelKey)}
                                  </Badge>
                                </div>
                                <p className="mt-0.5 text-xs text-slate-500">{model.desc}</p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <label className="text-xs font-medium text-slate-500 mb-1 block">
                            Prompt comparison model
                          </label>
                          <Select value={comparePromptModel} onValueChange={setComparePromptModel}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(MODELS).map(([modelKey, model]) => (
                                <SelectItem key={modelKey} value={modelKey}>
                                  {model.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="rounded-lg border border-dashed border-slate-200 bg-white/80 px-3 py-2">
                          <p className="text-xs font-medium text-slate-600">
                            {compareModelCount} model{compareModelCount === 1 ? "" : "s"} selected
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            `Compare Prompts` runs against {MODELS[comparePromptModel]?.name ?? comparePromptModel}. `Compare Models` and `Full Matrix` use the checked list above.
                          </p>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400">
                      Enter a word above, then click a comparison type below.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={handleCompareModels}
                        disabled={isRunning || !singleWord.trim() || compareModelCount === 0}
                      >
                        <Layers className="h-4 w-4 mr-1" /> Compare {compareModelCount} Models
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={handleComparePrompts}
                        disabled={isRunning || !singleWord.trim()}
                      >
                        <Paintbrush className="h-4 w-4 mr-1" /> Compare {PROMPT_KEYS.length} Prompts
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleFullMatrix}
                        disabled={isRunning || !singleWord.trim() || compareModelCount === 0}
                      >
                        <BarChart3 className="h-4 w-4 mr-1" /> Full Matrix ({compareModelCount}×{PROMPT_KEYS.length} = {compareModelCount * PROMPT_KEYS.length})
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="prompt">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Paintbrush className="h-4 w-4 text-purple-500" />
                      Custom Prompt Editor
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-2 block">
                        Preset Templates
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(PROMPTS).map(([k, p]) => (
                          <button
                            key={k}
                            onClick={() => setSelectedPrompt(k)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                              selectedPrompt === k
                                ? "bg-indigo-500 text-white border-indigo-500"
                                : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50"
                            }`}
                          >
                            {p.emoji} {p.name}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">
                        Prompt <span className="text-slate-400">({"{word}"}, {"{nounPhrase}"}, {"{bareWord}"} tokens supported)</span>
                      </label>
                      <Textarea
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        rows={3}
                        className="font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">
                        Negative Prompt
                      </label>
                      <Textarea
                        value={customNegPrompt}
                        onChange={(e) => setCustomNegPrompt(e.target.value)}
                        rows={2}
                        className="font-mono text-xs"
                      />
                    </div>
                    <div className="flex flex-wrap gap-3 items-end">
                      <div className="flex-1 min-w-[140px]">
                        <label className="text-xs font-medium text-slate-500 mb-1 block">Word</label>
                        <Input
                          placeholder="cat, 蘋果..."
                          value={singleWord}
                          onChange={(e) => setSingleWord(e.target.value)}
                        />
                      </div>
                      <div className="min-w-[180px]">
                        <label className="text-xs font-medium text-slate-500 mb-1 block">Model</label>
                        <Select value={selectedModel} onValueChange={setSelectedModel}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(MODELS).map(([k, m]) => (
                              <SelectItem key={k} value={k}>
                                {m.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={handleTestCustomPrompt} disabled={isRunning || !singleWord.trim()}>
                        <Zap className="h-4 w-4 mr-1" /> Test This Prompt
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="params">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <SlidersHorizontal className="h-4 w-4 text-emerald-500" />
                      Parameter Tuning
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {!selectedModelSupportsTuning && (
                      <p className="text-xs text-slate-500">
                        Gemini uses provider-native image settings in this tester. Guidance and step sweeps apply to Cloudflare models only.
                      </p>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-xs font-medium text-slate-500 mb-2 block">
                          Guidance Scale: <span className="text-indigo-600 font-bold">{guidance}</span>
                          <span className="text-slate-400 ml-1">(higher = stricter prompt adherence)</span>
                        </label>
                        <Slider
                          value={[guidance]}
                          onValueChange={([v]) => setGuidance(v)}
                          min={1}
                          max={20}
                          step={0.5}
                          disabled={!selectedModelSupportsTuning}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500 mb-2 block">
                          Steps: <span className="text-indigo-600 font-bold">{steps}</span>
                          <span className="text-slate-400 ml-1">(more = better quality, slower)</span>
                        </label>
                        <Slider
                          value={[steps]}
                          onValueChange={([v]) => setSteps(v)}
                          min={1}
                          max={30}
                          step={1}
                          disabled={!selectedModelSupportsTuning}
                          className="mt-2"
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 items-end">
                      <div className="flex-1 min-w-[140px]">
                        <label className="text-xs font-medium text-slate-500 mb-1 block">Word</label>
                        <Input
                          placeholder="cat, 蘋果..."
                          value={singleWord}
                          onChange={(e) => setSingleWord(e.target.value)}
                        />
                      </div>
                      <Button onClick={handleTestSingle} disabled={isRunning || !singleWord.trim()}>
                        <Zap className="h-4 w-4 mr-1" /> Test Current Settings
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        onClick={handleCompareGuidance}
                        disabled={isRunning || !singleWord.trim() || !selectedModelSupportsTuning}
                      >
                        <Settings2 className="h-4 w-4 mr-1" /> Sweep Guidance (1→20)
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleCompareSteps}
                        disabled={isRunning || !singleWord.trim() || !selectedModelSupportsTuning}
                      >
                        <Settings2 className="h-4 w-4 mr-1" /> Sweep Steps (1→20)
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {results.length > 0 && (
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-3 shadow-sm">
                <div className="flex items-center gap-4 text-sm">
                  {pending > 0 && (
                    <span className="flex items-center gap-1 text-amber-600">
                      <Loader2 className="h-4 w-4 animate-spin" /> {pending} pending
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" /> {done} done
                  </span>
                  {failed > 0 && (
                    <span className="flex items-center gap-1 text-red-500">
                      <XCircle className="h-4 w-4" /> {failed} failed
                    </span>
                  )}
                  {enableImageEvaluation && evaluationPending > 0 && (
                    <span className="flex items-center gap-1 text-indigo-600">
                      <Loader2 className="h-4 w-4 animate-spin" /> {evaluationPending} evaluating
                    </span>
                  )}
                  {enableImageEvaluation && evaluationDone > 0 && (
                    <span className="flex items-center gap-1 text-sky-600">
                      <CheckCircle2 className="h-4 w-4" /> {evaluationDone} scored
                    </span>
                  )}
                  {enableImageEvaluation && evaluationFailed > 0 && (
                    <span className="flex items-center gap-1 text-rose-500">
                      <XCircle className="h-4 w-4" /> {evaluationFailed} eval failed
                    </span>
                  )}
                  {done > 0 && (
                    <span className="flex items-center gap-1 text-slate-500">
                      <Clock className="h-4 w-4" /> avg {avgTime.toFixed(1)}s
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-400">Columns:</label>
                  <Select value={String(gridCols)} onValueChange={(v) => setGridCols(Number(v))}>
                    <SelectTrigger className="w-[70px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2, 3, 4, 5, 6, 8].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isRunning && (
                    <Button variant="destructive" size="sm" onClick={handleStop}>
                      Stop
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={handleDownloadAll} disabled={done === 0}>
                    <Download className="h-3.5 w-3.5 mr-1" /> Save All
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleClear}>
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Clear
                  </Button>
                </div>
              </div>
            )}

            {results.length > 0 && (
              <Card className="mb-4">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-indigo-500" />
                    Model Ranking Summary
                  </CardTitle>
                  <p className="text-xs text-slate-500">
                    Composite rank = 70% LLM weighted score + 20% success rate + 10% latency
                    score. Latency score is normalized against the fastest successful model in the
                    current batch.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!enableImageEvaluation ? (
                    <p className="text-sm text-slate-500">
                      Enable LLM image evaluation above to generate rubric scores and model
                      ranking.
                    </p>
                  ) : evaluationDone === 0 ? (
                    <p className="text-sm text-slate-500">
                      Ranking will appear after successful images finish evaluation. If this stays
                      empty, check Gemini credentials or the Cloudflare AI Gateway setup.
                    </p>
                  ) : (
                    <>
                      {topRankedModel && topRankedModel.rankingScore !== null && (
                        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4">
                          <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">
                            Current Leader
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold text-slate-800">
                              {topRankedModel.modelName}
                            </h3>
                            <Badge variant="outline" className="capitalize">
                              {topRankedModel.provider}
                            </Badge>
                            <Badge className="bg-indigo-600 text-white hover:bg-indigo-600">
                              {topRankedModel.rankingScore.toFixed(1)} composite
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs text-slate-600">
                            LLM score {topRankedModel.averageWeightedScore?.toFixed(1) ?? "n/a"}
                            /100, success {(topRankedModel.successRate * 100).toFixed(0)}%, avg
                            latency {topRankedModel.averageLatency?.toFixed(1) ?? "n/a"}s.
                          </p>
                        </div>
                      )}

                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[860px] text-sm">
                          <thead>
                            <tr className="border-b text-left text-xs uppercase tracking-wide text-slate-400">
                              <th className="pb-2 pr-4 font-medium">Rank</th>
                              <th className="pb-2 pr-4 font-medium">Model</th>
                              <th className="pb-2 pr-4 font-medium">Composite</th>
                              <th className="pb-2 pr-4 font-medium">LLM</th>
                              <th className="pb-2 pr-4 font-medium">Success</th>
                              <th className="pb-2 pr-4 font-medium">Gate Pass</th>
                              <th className="pb-2 pr-4 font-medium">Latency</th>
                              <th className="pb-2 pr-4 font-medium">Evaluated</th>
                              <th className="pb-2 font-medium">Samples</th>
                            </tr>
                          </thead>
                          <tbody>
                            {modelSummaries.map((summary, index) => (
                              <tr
                                key={summary.modelKey}
                                className="border-b border-slate-100 align-top last:border-b-0"
                              >
                                <td className="py-3 pr-4 text-slate-400">#{index + 1}</td>
                                <td className="py-3 pr-4">
                                  <div className="font-medium text-slate-700">
                                    {summary.modelName}
                                  </div>
                                  <div className="mt-1">
                                    <Badge variant="outline" className="capitalize text-[10px]">
                                      {summary.provider}
                                    </Badge>
                                  </div>
                                </td>
                                <td className="py-3 pr-4 font-semibold text-slate-700">
                                  {summary.rankingScore !== null
                                    ? summary.rankingScore.toFixed(1)
                                    : "Waiting"}
                                </td>
                                <td className="py-3 pr-4 text-slate-600">
                                  {summary.averageWeightedScore !== null
                                    ? `${summary.averageWeightedScore.toFixed(1)}/100`
                                    : "n/a"}
                                </td>
                                <td className="py-3 pr-4 text-slate-600">
                                  {(summary.successRate * 100).toFixed(0)}%
                                </td>
                                <td className="py-3 pr-4 text-slate-600">
                                  {summary.passRate !== null
                                    ? `${(summary.passRate * 100).toFixed(0)}%`
                                    : "n/a"}
                                </td>
                                <td className="py-3 pr-4 text-slate-600">
                                  {summary.averageLatency !== null
                                    ? `${summary.averageLatency.toFixed(1)}s`
                                    : "n/a"}
                                </td>
                                <td className="py-3 pr-4 text-slate-600">
                                  {summary.evaluatedCount}/{summary.sampleCount}
                                </td>
                                <td className="py-3 text-slate-600">{summary.sampleCount}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {results.length > 0 && (
              <div
                className="grid gap-4"
                style={{
                  gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
                }}
              >
                {results.map((r) => (
                  <div
                    key={r.id}
                    className={`group rounded-2xl bg-white shadow-sm overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5 ${
                      r.status === "error" ? "opacity-60" : ""
                    }`}
                  >
                    <div className="relative aspect-square bg-slate-50 overflow-hidden">
                      {r.status === "done" && r.imageUrl ? (
                        <img
                          src={r.imageUrl}
                          alt={r.word.en}
                          className="w-full h-full object-cover"
                        />
                      ) : r.status === "loading" || r.status === "pending" ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                          <Loader2 className="h-10 w-10 animate-spin mb-2" />
                          <span className="text-xs">{r.status === "loading" ? "Generating..." : "Queued"}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-red-400">
                          <XCircle className="h-10 w-10 mb-2" />
                          <span className="text-xs px-3 text-center">{r.error || "Failed"}</span>
                        </div>
                      )}
                      {r.tag && (
                        <div className="absolute top-2 right-2 bg-black/60 text-white text-[11px] font-bold px-2 py-0.5 rounded">
                          {r.tag}
                        </div>
                      )}
                    </div>

                    <div className="p-3">
                      <div className="font-semibold text-sm">
                        {r.word.cn || "—"}{" "}
                        <span className="text-slate-400 font-normal text-xs">{r.word.en}</span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        <Badge
                          variant="secondary"
                          className="text-[10px] bg-purple-50 text-purple-700 border-purple-200"
                        >
                          {r.modelLabel ?? MODELS[r.modelKey]?.name ?? r.modelKey}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="text-[10px] bg-sky-50 text-sky-700 border-sky-200"
                        >
                          {PROMPTS[r.promptKey]
                            ? `${PROMPTS[r.promptKey].emoji} ${PROMPTS[r.promptKey].name}`
                            : r.promptLabel ?? r.promptKey}
                        </Badge>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-[10px]">
                          g={r.guidance}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          s={r.steps}
                        </Badge>
                        {r.elapsed !== undefined && (
                          <Badge variant="outline" className="text-[10px] text-amber-600">
                            {r.elapsed.toFixed(1)}s
                          </Badge>
                        )}
                        {r.source && (
                          <Badge variant="outline" className="text-[10px] text-emerald-600">
                            {r.source}
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1.5 text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                        {r.promptText.slice(0, 120)}…
                      </div>
                      {r.evaluation && (
                        <div className="mt-2 rounded-xl border bg-slate-50 p-2.5">
                          <div className="flex flex-wrap items-center gap-1">
                            <Badge variant="outline" className="text-[10px]">
                              LLM {r.evaluation.status}
                            </Badge>
                            {r.evaluation.status === "done" &&
                              typeof r.evaluation.weightedScore === "number" && (
                                <Badge className="bg-slate-800 text-white hover:bg-slate-800 text-[10px]">
                                  {r.evaluation.weightedScore.toFixed(1)}/100
                                </Badge>
                              )}
                            {r.evaluation.status === "done" && r.evaluation.hardFail && (
                              <Badge className="bg-rose-600 text-white hover:bg-rose-600 text-[10px]">
                                Hard fail
                              </Badge>
                            )}
                          </div>

                          {r.evaluation.status === "loading" && (
                            <p className="mt-1 text-[10px] text-slate-500">
                              Evaluating image quality and flashcard suitability...
                            </p>
                          )}

                          {r.evaluation.status === "error" && (
                            <p className="mt-1 text-[10px] text-rose-500">
                              {r.evaluation.error}
                            </p>
                          )}

                          {r.evaluation.status === "done" && r.evaluation.scores && (
                            <>
                              <div className="mt-1 flex flex-wrap gap-1">
                                <Badge variant="outline" className="text-[10px]">
                                  subject {r.evaluation.scores.subjectCorrectness}/5
                                </Badge>
                                <Badge variant="outline" className="text-[10px]">
                                  safety {r.evaluation.scores.childSafety}/5
                                </Badge>
                                <Badge variant="outline" className="text-[10px]">
                                  no-text {r.evaluation.scores.textFreeOutput}/5
                                </Badge>
                              </div>
                              {r.evaluation.summary && (
                                <p className="mt-1 text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
                                  {r.evaluation.summary}
                                </p>
                              )}
                              {r.evaluation.issues && r.evaluation.issues.length > 0 && (
                                <p className="mt-1 text-[10px] text-amber-700 line-clamp-2 leading-relaxed">
                                  Issues: {r.evaluation.issues.join(", ")}
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {results.length === 0 && (
              <div className="mt-12 text-center text-slate-400">
                <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">No images generated yet</p>
                <p className="text-sm mt-1">
                  Enter a word and click Generate, or use Compare to test multiple models/prompts side by side
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="voice" className="space-y-6">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center justify-center gap-2">
                <Mic className="h-7 w-7 text-emerald-500" />
                Voice Recognition Tester
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Test browser speech playback and compare backend pronunciation models without leaving the same route.
              </p>
            </div>
            <div className="mx-auto max-w-4xl">
              <VoiceRecognitionTester />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
