"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

/* ═══════════════════════════════════════════════════════════════════════
   MODELS
   ═══════════════════════════════════════════════════════════════════════ */

const MODELS: Record<
  string,
  { id: string; name: string; steps: number; guidance: number; desc: string }
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
};

/* ═══════════════════════════════════════════════════════════════════════
   PROMPT PRESETS
   ═══════════════════════════════════════════════════════════════════════ */

const PROMPTS: Record<
  string,
  { name: string; prompt: string; negPrompt: string; emoji: string }
> = {
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
  promptKey: string;
  promptText: string;
  guidance: number;
  steps: number;
  status: "pending" | "loading" | "done" | "error";
  imageUrl?: string;
  source?: string;
  elapsed?: number;
  error?: string;
  tag?: string;
}

/* ═══════════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════════ */

export default function TestImagesPage() {
  // ── State ──
  const [results, setResults] = useState<ImageResult[]>([]);
  const [selectedModel, setSelectedModel] = useState("sdxl-lightning");
  const [selectedPrompt, setSelectedPrompt] = useState("realistic");
  const [customPrompt, setCustomPrompt] = useState(PROMPTS.realistic.prompt);
  const [customNegPrompt, setCustomNegPrompt] = useState(
    PROMPTS.realistic.negPrompt
  );
  const [guidance, setGuidance] = useState(7.5);
  const [steps, setSteps] = useState(4);
  const [singleWord, setSingleWord] = useState("");
  const [wordCategory, setWordCategory] = useState("all");
  const [isRunning, setIsRunning] = useState(false);
  const [gridCols, setGridCols] = useState(4);
  const [activeTab, setActiveTab] = useState("quick");
  const abortRef = useRef<AbortController | null>(null);

  // Stats
  const pending = results.filter((r) => r.status === "pending" || r.status === "loading").length;
  const done = results.filter((r) => r.status === "done").length;
  const failed = results.filter((r) => r.status === "error").length;
  const avgTime =
    done > 0
      ? results
          .filter((r) => r.status === "done" && r.elapsed)
          .reduce((sum, r) => sum + (r.elapsed ?? 0), 0) / done
      : 0;

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
    (word: Word, modelKey: string, prompt: string, negPrompt: string, g: number, s: number) => {
      const params = new URLSearchParams({
        word: word.en,
        wordCantonese: word.cn,
        category: "test",
        testMode: "1",
        model: MODELS[modelKey].id,
        promptOverride: prompt,
        negPromptOverride: negPrompt,
        guidance: String(g),
        numSteps: String(s),
      });
      return `/api/generate-image?${params}`;
    },
    []
  );

  // ── Fetch a single image ──
  const fetchImage = useCallback(
    async (result: ImageResult, signal?: AbortSignal) => {
      const url = buildUrl(
        result.word,
        result.modelKey,
        result.promptText,
        PROMPTS[result.promptKey]?.negPrompt ?? customNegPrompt,
        result.guidance,
        result.steps
      );

      setResults((prev) =>
        prev.map((r) => (r.id === result.id ? { ...r, status: "loading" as const } : r))
      );

      const t0 = Date.now();
      try {
        const res = await fetch(url, { signal });
        const elapsed = (Date.now() - t0) / 1000;
        const source = res.headers.get("X-Image-Source") ?? "unknown";
        const blob = await res.blob();
        const imageUrl = URL.createObjectURL(blob);

        setResults((prev) =>
          prev.map((r) =>
            r.id === result.id
              ? { ...r, status: "done" as const, imageUrl, source, elapsed }
              : r
          )
        );
      } catch (err: unknown) {
        if (signal?.aborted) return;
        const elapsed = (Date.now() - t0) / 1000;
        setResults((prev) =>
          prev.map((r) =>
            r.id === result.id
              ? {
                  ...r,
                  status: "error" as const,
                  elapsed,
                  error: err instanceof Error ? err.message : "Unknown error",
                }
              : r
          )
        );
      }
    },
    [buildUrl, customNegPrompt]
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

  const makeSpec = (word: Word, modelKey: string, promptKey: string, g: number, s: number, tag?: string) => ({
    word,
    modelKey,
    promptKey,
    promptText: (PROMPTS[promptKey]?.prompt ?? customPrompt).replace(/{word}/g, word.en),
    guidance: g,
    steps: s,
    tag,
  });

  // ── Actions ──

  const handleTestSingle = () => {
    const w = getWord();
    if (!w) return alert("Enter a word first");
    runBatch([makeSpec(w, selectedModel, selectedPrompt, guidance, steps)]);
  };

  const handleTestCategory = () => {
    const words = getWords();
    runBatch(words.map((w) => makeSpec(w, selectedModel, selectedPrompt, guidance, steps)));
  };

  const handleCompareModels = () => {
    const w = getWord();
    if (!w) return alert("Enter a word first");
    const specs = Object.keys(MODELS).map((mk) =>
      makeSpec(w, mk, selectedPrompt, MODELS[mk].guidance, MODELS[mk].steps)
    );
    setGridCols(4);
    runBatch(specs);
  };

  const handleComparePrompts = () => {
    const w = getWord();
    if (!w) return alert("Enter a word first");
    const specs = Object.keys(PROMPTS).map((pk) =>
      makeSpec(w, selectedModel, pk, guidance, steps)
    );
    setGridCols(4);
    runBatch(specs);
  };

  const handleCompareGuidance = () => {
    const w = getWord();
    if (!w) return alert("Enter a word first");
    const values = [1, 3, 5, 7.5, 10, 15, 20];
    const specs = values.map((g) =>
      makeSpec(w, selectedModel, selectedPrompt, g, steps, `g=${g}`)
    );
    setGridCols(4);
    runBatch(specs);
  };

  const handleCompareSteps = () => {
    const w = getWord();
    if (!w) return alert("Enter a word first");
    const values = [1, 2, 4, 8, 12, 20];
    const specs = values.map((s) =>
      makeSpec(w, selectedModel, selectedPrompt, guidance, s, `s=${s}`)
    );
    setGridCols(3);
    runBatch(specs);
  };

  const handleFullMatrix = () => {
    const w = getWord();
    if (!w) return alert("Enter a word first");
    const specs: Omit<ImageResult, "id" | "status">[] = [];
    for (const mk of Object.keys(MODELS)) {
      for (const pk of Object.keys(PROMPTS)) {
        specs.push(makeSpec(w, mk, pk, MODELS[mk].guidance, MODELS[mk].steps));
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
        {/* ── Header ── */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-slate-800 flex items-center justify-center gap-2">
            <ImageIcon className="h-8 w-8 text-indigo-500" />
            Image Generation Tester
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Compare Cloudflare Workers AI models, prompt styles, and parameters
          </p>
        </div>

        {/* ── Controls ── */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-4 max-w-lg mx-auto">
            <TabsTrigger value="quick">Quick Test</TabsTrigger>
            <TabsTrigger value="compare">Compare</TabsTrigger>
            <TabsTrigger value="prompt">Prompt</TabsTrigger>
            <TabsTrigger value="params">Parameters</TabsTrigger>
          </TabsList>

          {/* ── Tab: Quick Test ── */}
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

          {/* ── Tab: Compare ── */}
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
                <p className="text-xs text-slate-400">
                  Enter a word above, then click a comparison type below.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleCompareModels} disabled={isRunning || !singleWord.trim()}>
                    <Layers className="h-4 w-4 mr-1" /> Compare 4 Models
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleComparePrompts}
                    disabled={isRunning || !singleWord.trim()}
                  >
                    <Paintbrush className="h-4 w-4 mr-1" /> Compare 8 Prompts
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleFullMatrix}
                    disabled={isRunning || !singleWord.trim()}
                  >
                    <BarChart3 className="h-4 w-4 mr-1" /> Full Matrix (4×8 = 32)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Tab: Prompt Editor ── */}
          <TabsContent value="prompt">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Paintbrush className="h-4 w-4 text-purple-500" />
                  Custom Prompt Editor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Preset chips */}
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
                    Prompt <span className="text-slate-400">({"{word}"} = translated English word)</span>
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
                  <Button onClick={handleTestSingle} disabled={isRunning || !singleWord.trim()}>
                    <Zap className="h-4 w-4 mr-1" /> Test This Prompt
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Tab: Parameters ── */}
          <TabsContent value="params">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-emerald-500" />
                  Parameter Tuning
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
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
                    disabled={isRunning || !singleWord.trim()}
                  >
                    <Settings2 className="h-4 w-4 mr-1" /> Sweep Guidance (1→20)
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCompareSteps}
                    disabled={isRunning || !singleWord.trim()}
                  >
                    <Settings2 className="h-4 w-4 mr-1" /> Sweep Steps (1→20)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ── Status Bar ── */}
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

        {/* ── Results Grid ── */}
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
                {/* Image area */}
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
                  {/* Tag overlay */}
                  {r.tag && (
                    <div className="absolute top-2 right-2 bg-black/60 text-white text-[11px] font-bold px-2 py-0.5 rounded">
                      {r.tag}
                    </div>
                  )}
                </div>

                {/* Info */}
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
                      {MODELS[r.modelKey]?.name ?? r.modelKey}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="text-[10px] bg-sky-50 text-sky-700 border-sky-200"
                    >
                      {PROMPTS[r.promptKey]?.emoji} {PROMPTS[r.promptKey]?.name ?? r.promptKey}
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
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Empty State ── */}
        {results.length === 0 && (
          <div className="mt-12 text-center text-slate-400">
            <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No images generated yet</p>
            <p className="text-sm mt-1">
              Enter a word and click Generate, or use Compare to test multiple models/prompts side by side
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
