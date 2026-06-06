import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { lookupEmoji } from "@/lib/word-emoji";
import { Resolver } from "node:dns/promises";
import * as fs from "fs";
import * as https from "node:https";
import * as path from "path";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/* ── Env ─────────────────────────────────────────────────────────────── */

const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || "";
const CF_API_TOKEN =
  process.env.CLOUDFLARE_AI_API_TOKEN ||
  process.env.CLOUDFLARE_API_TOKEN ||
  "";
const CF_AI_GATEWAY_SLUG =
  process.env.CLOUDFLARE_AI_GATEWAY_ID ||
  process.env.CLOUDFLARE_AI_GATEWAY_NAME ||
  "";
const CF_AI_GATEWAY_TOKEN = process.env.CLOUDFLARE_AI_GATEWAY_TOKEN || "";
const CF_LOCAL_PREVIEW_WORKER_URL =
  process.env.CLOUDFLARE_PREVIEW_WORKER_URL || "";
const CF_MODEL = "google/nano-banana-2";
const SILICONFLOW_API_KEY = process.env.SILICONFLOW_API_KEY || "";
const SILICONFLOW_MODEL = "Kwai-Kolors/Kolors";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
type ImageProvider = "cloudflare" | "gemini" | "siliconflow";

/* ── Disk-based image cache ──────────────────────────────────────────── */

const CACHE_DIR = path.join(process.cwd(), "public", "images", "words");

function getCacheKey(word: string, wordCantonese: string): string {
  return (wordCantonese || word || "object")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]/g, "_");
}

function getCachedImage(cacheKey: string): Buffer | null {
  try {
    const filePath = path.join(CACHE_DIR, `${cacheKey}.jpg`);
    if (fs.existsSync(filePath)) return fs.readFileSync(filePath);
  } catch {
    /* cache miss */
  }
  return null;
}

function saveToDiskCache(cacheKey: string, imageBuffer: Buffer): void {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(path.join(CACHE_DIR, `${cacheKey}.jpg`), imageBuffer);
  } catch (err) {
    console.warn("[generate-image] Failed to write disk cache:", err);
  }
}

/* ── Cantonese → English dictionary (~200 words, tangible objects) ──── */

const CANTONESE_TO_ENGLISH: Record<string, string> = {
  // ── Animals (18) ──
  貓: "cat",
  狗: "dog",
  大象: "elephant",
  獅子: "lion",
  蝴蝶: "butterfly",
  魚: "fish",
  雀仔: "bird",
  兔仔: "rabbit",
  猴子: "monkey",
  龜: "turtle",
  熊貓: "panda",
  牛: "cow",
  鯊魚: "shark",
  企鵝: "penguin",
  鹿: "deer",
  馬: "horse",
  豬: "pig",
  羊: "sheep",

  // ── Food (20) ──
  蘋果: "apple",
  香蕉: "banana",
  飯: "rice bowl",
  麵: "noodles",
  雞蛋: "egg",
  奶: "milk",
  麵包: "bread",
  水: "water bottle",
  橙: "orange",
  紅蘿蔔: "carrot",
  薄餅: "pizza",
  雪糕: "ice cream",
  蛋糕: "cake",
  西瓜: "watermelon",
  多士: "toast",
  曲奇: "cookie",
  糖: "candy",
  朱古力: "chocolate",
  薯條: "french fries",
  壽司: "sushi",

  // ── Fruits & Vegetables (12) ──
  提子: "grapes",
  芒果: "mango",
  菠蘿: "pineapple",
  士多啤梨: "strawberry",
  粟米: "corn",
  番茄: "tomato",
  薯仔: "potato",
  青瓜: "cucumber",
  蘑菇: "mushroom",
  洋蔥: "onion",
  檸檬: "lemon",
  荔枝: "lychee",

  // ── Toys (12) ──
  波: "ball",
  公仔: "doll",
  熊仔: "teddy bear",
  積木: "building blocks",
  機械人: "toy robot",
  風箏: "kite",
  氣球: "balloon",
  鼓: "drum",
  拼圖: "jigsaw puzzle",
  砌圖: "jigsaw puzzle",
  跳繩: "jump rope",
  滑板車: "scooter",
  陀螺: "spinning top",

  // ── Nature (10) ──
  樹: "tree",
  花: "flower",
  太陽: "sun",
  雨: "rain",
  月亮: "moon",
  星星: "star",
  雲: "cloud",
  風: "wind",
  草: "grass",
  山: "mountain",

  // ── Stationery (12) ──
  鉛筆: "pencil",
  蠟筆: "crayon",
  剪刀: "scissors",
  間尺: "ruler",
  擦膠: "eraser",
  紙: "paper",
  膠水: "glue stick",
  筆: "pen",
  釘書機: "stapler",
  膠紙: "tape roll",
  萬字夾: "paper clip",
  顏色筆: "marker pen",

  // ── Transportation (10) ──
  車: "car",
  巴士: "bus",
  飛機: "airplane",
  火車: "train",
  單車: "bicycle",
  船: "sailboat",
  直升機: "helicopter",
  的士: "taxi",
  地鐵: "subway train",
  救護車: "ambulance",

  // ── Places (12) ──
  屋企: "house",
  學校: "school",
  公園: "park",
  舖頭: "store",
  沙灘: "beach",
  圖書館: "library",
  醫院: "hospital",
  餐廳: "restaurant",
  超市: "supermarket",
  機場: "airport",
  動物園: "zoo",
  游泳池: "swimming pool",

  // ── Household Objects (15) ──
  杯: "cup",
  匙羹: "spoon",
  書: "book",
  凳: "chair",
  枱: "table",
  書包: "backpack",
  遮: "umbrella",
  鐘: "clock",
  鎖匙: "key",
  牙刷: "toothbrush",
  枕頭: "pillow",
  被: "blanket",
  花瓶: "vase",
  蠟燭: "candle",
  掃把: "broom",

  // ── Kitchen & Tableware (10) ──
  碟: "plate",
  碗: "bowl",
  叉: "fork",
  刀: "knife",
  煲: "pot",
  鑊: "wok",
  砧板: "cutting board",
  微波爐: "microwave",
  雪櫃: "fridge",
  焗爐: "oven",

  // ── Bathroom & Hygiene (8) ──
  毛巾: "towel",
  梘液: "soap dispenser",
  洗頭水: "shampoo bottle",
  廁紙: "toilet paper roll",
  鏡: "mirror",
  浴缸: "bathtub",
  花灑: "shower head",
  棉花棒: "cotton swab",

  // ── Electronics (8) ──
  電話: "smartphone",
  電腦: "laptop",
  相機: "camera",
  電視: "television",
  耳機: "headphones",
  遙控器: "remote control",
  手錶: "wristwatch",
  電燈: "desk lamp",

  // ── Clothing (12) ──
  衫: "shirt",
  褲: "pants",
  鞋: "sneakers",
  帽: "hat",
  襪: "socks",
  裙: "dress",
  褸: "jacket",
  眼鏡: "glasses",
  手套: "gloves",
  圍巾: "scarf",
  拖鞋: "house slippers",
  泳衣: "swimsuit",
};

/* ── Helpers ─────────────────────────────────────────────────────────── */

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function hashSeed(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) {
    h = (h * 31 + value.charCodeAt(i)) >>> 0;
  }
  return h % 1_000_000_000;
}

function isLikelyEnglish(value: string): boolean {
  return /^[a-zA-Z0-9\s'\-_.]+$/.test(value.trim());
}

function withTimeoutSignal(ms: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

const CLOUDFLARE_IMAGE_RETRY_DELAYS_MS = [300, 1200] as const;

function isRetriableCloudflareImageError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();

  return (
    message.includes("too small or empty") ||
    message.includes("fetch failed") ||
    message.includes("network") ||
    message.includes("timed out") ||
    /cloudflare error (408|409|429|5\d\d)\b/.test(message)
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function retryCloudflareImageGeneration<T>(
  model: string,
  run: () => Promise<T>,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= CLOUDFLARE_IMAGE_RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      return await run();
    } catch (error) {
      lastError = error;

      if (
        attempt === CLOUDFLARE_IMAGE_RETRY_DELAYS_MS.length ||
        !isRetriableCloudflareImageError(error)
      ) {
        throw error;
      }

      console.warn(
        `[generate-image] Retrying Cloudflare image generation for ${model} after transient error on attempt ${attempt + 1}:`,
        error,
      );
      await delay(CLOUDFLARE_IMAGE_RETRY_DELAYS_MS[attempt]);
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`Cloudflare image generation failed for ${model}`);
}

function sanitizeHeaderValue(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function toResponseBytes(buffer: Buffer): ArrayBuffer {
  return Uint8Array.from(buffer).buffer;
}

/** Translate via local dictionary first, then Google Translate as fallback */
function translateToEnglish(sourceWord: string): string | Promise<string> {
  const trimmed = sourceWord.trim();
  if (!trimmed) return "object";
  if (isLikelyEnglish(trimmed)) return trimmed.toLowerCase();

  // Local dictionary lookup (instant, no network)
  const local = CANTONESE_TO_ENGLISH[trimmed];
  if (local) return local;

  // Async fallback: Google Translate (2-second timeout)
  return (async () => {
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(trimmed)}`;
      const res = await fetch(url, {
        method: "GET",
        cache: "no-store",
        signal: withTimeoutSignal(2000),
      });
      if (!res.ok) return trimmed.toLowerCase();
      const data: unknown = await res.json();
      if (!Array.isArray(data) || !Array.isArray(data[0]))
        return trimmed.toLowerCase();
      const translated = (data[0] as unknown[])
        .map((seg) => (Array.isArray(seg) ? seg[0] : null))
        .filter((v): v is string => typeof v === "string")
        .join(" ")
        .trim()
        .toLowerCase();
      return translated || trimmed.toLowerCase();
    } catch {
      return trimmed.toLowerCase();
    }
  })();
}

/* ── Prompt builder ──────────────────────────────────────────────────── */

interface ImagePrompt {
  prompt: string;
  negative_prompt: string;
}

function buildPrompt(wordEnglish: string): ImagePrompt {
  const w = (wordEnglish || "object").trim().toLowerCase();
  return {
    prompt: `a single ${w}, highly detailed, photorealistic RAW photograph of a single {word}, centered on a pure white seamless background. High-end product photography, soft studio lighting, shot on DSLR, 85mm lens, f/8 aperture, razor-sharp focus, visible natural textures, 8k resolution. Clean and bright, no text, no label.`,
    negative_prompt:
      "cartoon, emoji, vector, flat, illustration, drawing, sketch, anime, manga, 3D render, text, letters, words, watermark, blurry, noisy, multiple objects, busy background, human, person, fingers, hands, face on object, anthropomorphic, dark, moody, scary",
  };
}

/* ── Emoji SVG fallback ──────────────────────────────────────────────── */

const BG_GRADIENTS = [
  ["#f7f3ff", "#e8f7ff"],
  ["#fff1f2", "#fce7f3"],
  ["#fef9c3", "#fff7ed"],
  ["#dcfce7", "#f0fdf4"],
  ["#e0f2fe", "#dbeafe"],
  ["#fae8ff", "#f5f3ff"],
  ["#fef3c7", "#fde68a"],
  ["#ccfbf1", "#d1fae5"],
];

function buildEmojiSvg(emoji: string, word: string, category: string): string {
  const safeEmoji = escapeXml(emoji);
  const idx = hashSeed(word + category) % BG_GRADIENTS.length;
  const [c1, c2] = BG_GRADIENTS[idx];
  return `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/>
  </linearGradient></defs>
  <rect width="512" height="512" rx="48" fill="url(#bg)"/>
  <circle cx="256" cy="240" r="140" fill="#ffffff" opacity="0.65"/>
  <text x="256" y="270" font-size="180" text-anchor="middle" dominant-baseline="middle">${safeEmoji}</text>
</svg>`;
}

function emojiSvgResponse(
  word: string,
  wordCantonese: string,
  category: string,
  source: string,
  errorMessage?: string,
) {
  const emoji = lookupEmoji(word, wordCantonese) ?? "🎨";
  const safeErrorMessage = errorMessage
    ? sanitizeHeaderValue(errorMessage).slice(0, 500)
    : undefined;
  return new NextResponse(buildEmojiSvg(emoji, word, category), {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Image-Source": source,
      ...(safeErrorMessage ? { "X-Image-Error": safeErrorMessage } : {}),
    },
  });
}

/* ── Cloudflare Workers AI call ──────────────────────────────────────── */

interface GenerateOptions {
  provider?: ImageProvider;
  model?: string;
  guidance?: number;
  numSteps?: number;
  aspectRatio?: string;
  outputFormat?: string;
  resolution?: string;
}

interface CloudflareGenerateResult {
  buffer: Buffer;
  mimeType: string;
}

interface CloudflareAiBinding {
  run<TOutput = unknown>(
    model: string,
    input: Record<string, unknown>,
    options?: {
      gateway?: {
        id: string;
      };
    },
  ): Promise<TOutput>;
}

interface CloudflareAiBindingImageResult {
  image?: string;
  result?: {
    image?: string;
  };
  error?: string;
  errors?: Array<{
    message?: string;
    code?: number | string;
  }>;
}

interface GeminiInlineData {
  data?: string;
  mimeType?: string;
  mime_type?: string;
}

interface GeminiPart {
  inlineData?: GeminiInlineData;
  inline_data?: GeminiInlineData;
  text?: string;
}

interface GeminiCandidate {
  content?: { parts?: GeminiPart[] };
  finishReason?: string;
  finishMessage?: string;
}

interface GeminiGenerateResponse {
  candidates?: GeminiCandidate[];
  promptFeedback?: { blockReason?: string };
}

interface SiliconFlowGenerateResponse {
  images?: Array<{
    url?: string;
  }>;
}

/* Models that require multipart form data instead of JSON */
const MULTIPART_MODELS = new Set([
  "@cf/black-forest-labs/flux-2-dev",
  "@cf/black-forest-labs/flux-2-klein-9b",
  "@cf/black-forest-labs/flux-2-klein-4b",
]);

const WORKERS_AI_GATEWAY_MODELS = new Set(["google/nano-banana-2"]);

const GEMINI_IMAGE_MODELS_WITH_RESOLUTION = new Set([
  "gemini-3.1-flash-image-preview",
  "gemini-3-pro-image-preview",
]);

function normalizeModelName(model: string): string {
  return model.replace(/^models\//, "");
}

function isGeminiImageModelWithResolution(model: string): boolean {
  return GEMINI_IMAGE_MODELS_WITH_RESOLUTION.has(normalizeModelName(model));
}

function buildGeminiGenerationConfig(
  model: string,
  options: GenerateOptions,
): Record<string, unknown> {
  const imageConfig: Record<string, string> = {
    aspectRatio: options.aspectRatio || "1:1",
  };

  if (isGeminiImageModelWithResolution(model)) {
    imageConfig.imageSize = options.resolution || "1K";
  }

  return {
    responseModalities: ["IMAGE"],
    imageConfig,
  };
}

function isWorkersAiGatewayModel(model: string): boolean {
  return WORKERS_AI_GATEWAY_MODELS.has(model);
}

function buildPositiveImagePrompt(imagePrompt: ImagePrompt): string {
  const negativePrompt = imagePrompt.negative_prompt.trim();
  if (!negativePrompt) {
    return imagePrompt.prompt;
  }

  return `${imagePrompt.prompt}\n\nKeep the image child-friendly and avoid the following elements: ${negativePrompt}.`;
}

function getCloudflareAiBinding(): CloudflareAiBinding | null {
  try {
    const { env } = getCloudflareContext();
    return (env as { AI?: CloudflareAiBinding }).AI ?? null;
  } catch {
    return null;
  }
}

function detectImageMimeType(buffer: Buffer): string {
  if (buffer.byteLength >= 12) {
    if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    ) {
      return "image/png";
    }

    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return "image/jpeg";
    }

    if (
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46 &&
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50
    ) {
      return "image/webp";
    }

    if (
      buffer[0] === 0x47 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x38
    ) {
      return "image/gif";
    }
  }

  return "image/png";
}

function normalizeImageMimeType(mimeType: string | null | undefined, buffer: Buffer): string {
  const normalized = mimeType?.split(";")[0]?.trim().toLowerCase() || "";

  if (normalized.startsWith("image/") && normalized !== "application/octet-stream") {
    return normalized;
  }

  return detectImageMimeType(buffer);
}

async function readCloudflareImageValue(
  imageValue: string,
): Promise<CloudflareGenerateResult> {
  if (/^https?:\/\//i.test(imageValue)) {
    const imageRes = await fetch(imageValue, {
      signal: withTimeoutSignal(60_000),
    });
    if (!imageRes.ok) {
      throw new Error(`Cloudflare image fetch failed ${imageRes.status}`);
    }

    const arrayBuf = await imageRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);
    return {
      buffer,
      mimeType: normalizeImageMimeType(imageRes.headers.get("content-type"), buffer),
    };
  }

  const buffer = Buffer.from(imageValue, "base64");
  return {
    buffer,
    mimeType: normalizeImageMimeType(undefined, buffer),
  };
}

async function readCloudflareImageResult(
  res: Response,
): Promise<CloudflareGenerateResult> {
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("image/")) {
    const arrayBuf = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);
    return {
      buffer,
      mimeType: normalizeImageMimeType(contentType, buffer),
    };
  }

  const json = (await res.json()) as {
    result?: { image?: string };
    image?: string;
    errors?: Array<{ message?: string }>;
  };
  const imageValue = json?.result?.image || json?.image;

  if (!imageValue) {
    const errorMessage = json.errors?.map((error) => error.message).find(Boolean);
    throw new Error(errorMessage || "Cloudflare JSON response missing image output");
  }

  return readCloudflareImageValue(imageValue);
}

async function generateWithCloudflareBinding(
  model: string,
  imagePrompt: ImagePrompt,
  options: GenerateOptions = {},
): Promise<CloudflareGenerateResult> {
  return retryCloudflareImageGeneration(model, async () => {
    const ai = getCloudflareAiBinding();
    if (!ai) {
      throw new Error(
        "Cloudflare AI binding unavailable. Configure the OpenNext Cloudflare adapter and an AI binding named AI.",
      );
    }

    const result = await ai.run<CloudflareAiBindingImageResult>(
      model,
      {
        prompt: buildPositiveImagePrompt(imagePrompt),
        aspect_ratio: options.aspectRatio || "1:1",
        output_format: options.outputFormat || "png",
        resolution: options.resolution || "1K",
      },
      {
        gateway: {
          id: CF_AI_GATEWAY_SLUG || "default",
        },
      },
    );

    const imageValue = result?.image || result?.result?.image;

    if (!imageValue) {
      const bindingError =
        result?.error ||
        result?.errors?.map((error) => error.message || String(error.code)).find(Boolean);
      const bindingKeys =
        result && typeof result === "object" ? Object.keys(result).join(",") : typeof result;

      throw new Error(
        bindingError
          ? `Cloudflare AI binding error: ${bindingError}`
          : `Cloudflare AI binding response missing image output (keys: ${bindingKeys || "none"})`,
      );
    }

    const imageResult = await readCloudflareImageValue(imageValue);
    if (imageResult.buffer.byteLength === 0) {
      throw new Error("Cloudflare binding response too small or empty");
    }

    return imageResult;
  });
}

async function generateWithCloudflare(
  imagePrompt: ImagePrompt,
  options: GenerateOptions = {},
): Promise<CloudflareGenerateResult> {
  const model = options.model || CF_MODEL;
  const guidance = options.guidance ?? 7.5;
  const numSteps = options.numSteps ?? 4;
  const aspectRatio = options.aspectRatio || "1:1";
  const outputFormat = options.outputFormat || "png";
  const resolution = options.resolution || "1K";

  if (isWorkersAiGatewayModel(model)) {
    if (getCloudflareAiBinding()) {
      return generateWithCloudflareBinding(model, imagePrompt, options);
    }

    if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
      throw new Error(
        "Missing CLOUDFLARE_ACCOUNT_ID and a Cloudflare AI API token (CLOUDFLARE_AI_API_TOKEN or CLOUDFLARE_API_TOKEN) for Cloudflare HTTP fallback. Configure the AI binding to avoid account token usage.",
      );
    }

    if (!CF_AI_GATEWAY_SLUG) {
      throw new Error(
        "Missing CLOUDFLARE_AI_GATEWAY_ID or CLOUDFLARE_AI_GATEWAY_NAME for Workers AI gateway models.",
      );
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${CF_API_TOKEN}`,
      "Content-Type": "application/json",
    };
    if (CF_AI_GATEWAY_TOKEN) {
      headers["cf-aig-authorization"] = `Bearer ${CF_AI_GATEWAY_TOKEN}`;
    }

    return retryCloudflareImageGeneration(model, async () => {
      const res = await fetch(
        `https://gateway.ai.cloudflare.com/v1/${CF_ACCOUNT_ID}/${CF_AI_GATEWAY_SLUG}/workers-ai/${model}`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            prompt: buildPositiveImagePrompt(imagePrompt),
            aspect_ratio: aspectRatio,
            output_format: outputFormat,
            resolution,
          }),
          signal: withTimeoutSignal(90_000),
        },
      );

      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        throw new Error(`Cloudflare error ${res.status}: ${errorText.slice(0, 300)}`);
      }

      const imageResult = await readCloudflareImageResult(res);
      if (imageResult.buffer.byteLength === 0) {
        throw new Error("Cloudflare response too small or empty");
      }

      return imageResult;
    });
  }

  if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
    throw new Error(
      "Missing CLOUDFLARE_ACCOUNT_ID and a Cloudflare AI API token (CLOUDFLARE_AI_API_TOKEN or CLOUDFLARE_API_TOKEN)",
    );
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/${model}`;
  const useMultipart = MULTIPART_MODELS.has(model);

  try {
    return retryCloudflareImageGeneration(model, async () => {
      let res: Response;

      if (useMultipart) {
        const form = new FormData();
        form.append("prompt", imagePrompt.prompt);
        if (imagePrompt.negative_prompt)
          form.append("negative_prompt", imagePrompt.negative_prompt);
        form.append("width", "512");
        form.append("height", "512");
        form.append("guidance", String(guidance));
        form.append("num_steps", String(numSteps));

        res = await fetch(url, {
          method: "POST",
          headers: { Authorization: `Bearer ${CF_API_TOKEN}` },
          body: form,
          signal: withTimeoutSignal(60_000),
        });
      } else {
        res = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${CF_API_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: imagePrompt.prompt,
            negative_prompt: imagePrompt.negative_prompt,
            width: 512,
            height: 512,
            guidance,
            num_steps: numSteps,
          }),
          signal: withTimeoutSignal(30_000),
        });
      }

      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        throw new Error(`Cloudflare error ${res.status}: ${errorText.slice(0, 300)}`);
      }

      const imageResult = await readCloudflareImageResult(res);

      if (imageResult.buffer.byteLength === 0) {
        throw new Error("Cloudflare response too small or empty");
      }

      return imageResult;
    });
  } catch (err) {
    console.error("[generate-image] Cloudflare fetch error:", err);
    throw err;
  }
}

async function generateWithSiliconFlow(
  imagePrompt: ImagePrompt,
  options: GenerateOptions = {},
): Promise<CloudflareGenerateResult> {
  const model = options.model || SILICONFLOW_MODEL;

  if (!SILICONFLOW_API_KEY) {
    throw new Error("Missing SILICONFLOW_API_KEY for Silicon Flow image generation");
  }

  const res = await fetch("https://api.siliconflow.cn/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SILICONFLOW_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt: imagePrompt.prompt,
      negative_prompt: imagePrompt.negative_prompt,
      image_size: "1024x1024",
      batch_size: 1,
      num_inference_steps: options.numSteps ?? 20,
      guidance_scale: options.guidance ?? 7.5,
    }),
    signal: withTimeoutSignal(60_000),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`Silicon Flow error ${res.status}: ${errorText.slice(0, 300)}`);
  }

  const json = (await res.json()) as SiliconFlowGenerateResponse;
  const imageUrl = json.images?.[0]?.url;

  if (!imageUrl) {
    throw new Error("Silicon Flow response did not include an image URL");
  }

  const imageRes = await fetch(imageUrl, {
    signal: withTimeoutSignal(60_000),
  });

  if (!imageRes.ok) {
    throw new Error(`Silicon Flow image fetch failed ${imageRes.status}`);
  }

  const arrayBuf = await imageRes.arrayBuffer();
  const buffer = Buffer.from(arrayBuf);

  if (buffer.byteLength === 0) {
    throw new Error("Silicon Flow response too small or empty");
  }

  return {
    buffer,
    mimeType: normalizeImageMimeType(imageRes.headers.get("content-type"), buffer),
  };
}

function buildGeminiRequest(model: string): {
  url: string;
  headers: Record<string, string>;
} {
  const normalizedModel = normalizeModelName(model);

  if (CF_ACCOUNT_ID && CF_AI_GATEWAY_SLUG && CF_AI_GATEWAY_TOKEN) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "cf-aig-authorization": `Bearer ${CF_AI_GATEWAY_TOKEN}`,
    };

    if (GEMINI_API_KEY) {
      headers["x-goog-api-key"] = GEMINI_API_KEY;
    }

    return {
      url: `https://gateway.ai.cloudflare.com/v1/${CF_ACCOUNT_ID}/${CF_AI_GATEWAY_SLUG}/google-ai-studio/v1beta/models/${normalizedModel}:generateContent`,
      headers,
    };
  }

  if (!GEMINI_API_KEY) {
    throw new Error(
      "Missing Gemini credentials. Set GEMINI_API_KEY or GOOGLE_API_KEY, or configure CLOUDFLARE_AI_GATEWAY_ID/CLOUDFLARE_AI_GATEWAY_NAME and CLOUDFLARE_AI_GATEWAY_TOKEN with a stored Google AI Studio key.",
    );
  }

  return {
    url: `https://generativelanguage.googleapis.com/v1beta/models/${normalizedModel}:generateContent?key=${GEMINI_API_KEY}`,
    headers: {
      "Content-Type": "application/json",
    },
  };
}

async function generateWithGemini(
  imagePrompt: ImagePrompt,
  options: GenerateOptions = {},
): Promise<{ buffer: Buffer; mimeType: string }> {
  const model = options.model || GEMINI_MODEL;
  const request = buildGeminiRequest(model);
  const generationConfig = buildGeminiGenerationConfig(model, options);

  try {
    const res = await fetch(request.url, {
      method: "POST",
      headers: request.headers,
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: buildPositiveImagePrompt(imagePrompt) }],
          },
        ],
        generationConfig,
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_LOW_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_LOW_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_LOW_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_LOW_AND_ABOVE",
          },
        ],
      }),
      signal: withTimeoutSignal(60_000),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      throw new Error(`Gemini error ${res.status}: ${errorText.slice(0, 300)}`);
    }

    const json = (await res.json()) as GeminiGenerateResponse;
    if (json.promptFeedback?.blockReason) {
      throw new Error(`Gemini blocked prompt: ${json.promptFeedback.blockReason}`);
    }

    const candidates = json.candidates ?? [];
    for (const candidate of candidates) {
      const parts = candidate.content?.parts ?? [];
      for (const part of parts) {
        const inline = part.inlineData ?? part.inline_data;
        const mimeType = inline?.mimeType ?? inline?.mime_type ?? "";
        if (mimeType.startsWith("image/") && inline?.data) {
          return {
            buffer: Buffer.from(inline.data, "base64"),
            mimeType,
          };
        }
      }
    }

    const finishMessage = candidates
      .map((candidate) =>
        [candidate.finishReason, candidate.finishMessage].filter(Boolean).join(": ")
      )
      .find(Boolean);

    throw new Error(finishMessage || "Gemini response did not include an image");
  } catch (err) {
    console.error("[generate-image] Gemini fetch error:", err);
    throw err;
  }
}

function resolveProvider(
  providerOverride: string,
  modelOverride: string,
): ImageProvider {
  if (providerOverride === "gemini") {
    return "gemini";
  }
  if (providerOverride === "siliconflow") {
    return "siliconflow";
  }
  if (providerOverride === "cloudflare") {
    return "cloudflare";
  }
  const normalizedModel = modelOverride.trim().toLowerCase();
  if (normalizedModel.startsWith("gemini-")) {
    return "gemini";
  }
  if (
    normalizedModel === SILICONFLOW_MODEL.toLowerCase() ||
    normalizedModel.endsWith("/kolors")
  ) {
    return "siliconflow";
  }
  return "cloudflare";
}

async function proxyToPreviewWorker(request: Request): Promise<NextResponse> {
  if (!CF_LOCAL_PREVIEW_WORKER_URL) {
    throw new Error(
      "Missing CLOUDFLARE_PREVIEW_WORKER_URL for local Nano Banana preview proxy.",
    );
  }

  const upstreamUrl = new URL("/api/generate-image", CF_LOCAL_PREVIEW_WORKER_URL);
  upstreamUrl.search = new URL(request.url).search;

  const acceptHeader = request.headers.get("accept") || "*/*";
  const upstreamResponse = await fetchPreviewWorker(upstreamUrl, acceptHeader);
  const headers = new Headers();

  for (const headerName of [
    "content-type",
    "cache-control",
    "x-image-source",
    "x-image-error",
    "x-model",
    "x-image-proxy-resolver",
    "x-preview-worker-ip",
  ]) {
    const headerValue = upstreamResponse.headers.get(headerName);
    if (headerValue) {
      headers.set(headerName, headerValue);
    }
  }

  headers.set("X-Image-Proxy", "cloudflare-preview-worker");

  return new NextResponse(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers,
  });
}

function isDnsLookupError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    const errorText = String(error);
    return errorText.includes("ENOTFOUND") || errorText.includes("EAI_AGAIN");
  }

  const errorWithCause = error as Error & {
    cause?: {
      code?: string;
      message?: string;
      errno?: number | string;
      syscall?: string;
      hostname?: string;
    };
  };

  const errorFields = [
    error.name,
    error.message,
    errorWithCause.cause?.code,
    errorWithCause.cause?.message,
    String(errorWithCause.cause?.errno ?? ""),
    errorWithCause.cause?.syscall,
    errorWithCause.cause?.hostname,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    errorFields.includes("ENOTFOUND") ||
    errorFields.includes("EAI_AGAIN") ||
    errorFields.includes("getaddrinfo")
  );
}

async function fetchPreviewWorker(
  upstreamUrl: URL,
  acceptHeader: string,
): Promise<{
  status: number;
  headers: Headers;
  body: ArrayBuffer;
}> {
  try {
    const response = await fetch(upstreamUrl, {
      method: "GET",
      headers: {
        Accept: acceptHeader,
      },
      cache: "no-store",
      signal: withTimeoutSignal(120_000),
    });

    return {
      status: response.status,
      headers: response.headers,
      body: await response.arrayBuffer(),
    };
  } catch (error) {
    if (!isDnsLookupError(error)) {
      throw error;
    }

    return fetchPreviewWorkerThroughPublicDns(upstreamUrl, acceptHeader);
  }
}

async function fetchPreviewWorkerThroughPublicDns(
  upstreamUrl: URL,
  acceptHeader: string,
): Promise<{
  status: number;
  headers: Headers;
  body: ArrayBuffer;
}> {
  const resolver = new Resolver();
  resolver.setServers(["1.1.1.1", "1.0.0.1"]);

  const resolvedAddresses = await resolver.resolve4(upstreamUrl.hostname);
  const previewWorkerIp = resolvedAddresses[0];

  if (!previewWorkerIp) {
    throw new Error(
      `Could not resolve preview worker hostname ${upstreamUrl.hostname} via public DNS.`,
    );
  }

  const proxyResponse = await new Promise<{
    status: number;
    headers: Headers;
    body: ArrayBuffer;
  }>((resolve, reject) => {
    const request = https.request(
      {
        host: previewWorkerIp,
        servername: upstreamUrl.hostname,
        port: upstreamUrl.port ? Number(upstreamUrl.port) : 443,
        method: "GET",
        path: `${upstreamUrl.pathname}${upstreamUrl.search}`,
        headers: {
          Accept: acceptHeader,
          Host: upstreamUrl.hostname,
        },
      },
      (response) => {
        const headers = new Headers();
        const chunks: Buffer[] = [];

        for (const [headerName, headerValue] of Object.entries(response.headers)) {
          if (!headerValue) {
            continue;
          }

          headers.set(
            headerName,
            Array.isArray(headerValue) ? headerValue.join(", ") : headerValue,
          );
        }

        headers.set("x-image-proxy-resolver", "public-dns");
        headers.set("x-preview-worker-ip", previewWorkerIp);

        response.on("data", (chunk) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });
        response.on("end", () => {
          const bodyBuffer = Buffer.concat(chunks);
          resolve({
            status: response.statusCode || 500,
            headers,
            body: bodyBuffer.buffer.slice(
              bodyBuffer.byteOffset,
              bodyBuffer.byteOffset + bodyBuffer.byteLength,
            ) as ArrayBuffer,
          });
        });
        response.on("error", reject);
      },
    );

    request.setTimeout(120_000, () => {
      request.destroy(new Error("Preview worker proxy timed out"));
    });
    request.on("error", reject);
    request.end();
  });

  return proxyResponse;
}

/* ── Route handler ───────────────────────────────────────────────────── */

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const { searchParams } = requestUrl;
  const word = searchParams.get("word") || "Object";
  const wordCantonese = searchParams.get("wordCantonese") || "";
  const category = searchParams.get("category") || "Kids Vocabulary";
  const wordId = searchParams.get("wordId") || word;

  // ── Test-mode overrides (from the tester page) ──
  const testMode = searchParams.get("testMode") === "1";
  const providerOverride = searchParams.get("provider") || "";
  const modelOverride = searchParams.get("model") || "";
  const promptOverride = searchParams.get("promptOverride") || "";
  const negPromptOverride = searchParams.get("negPromptOverride") || "";
  const guidanceOverride = searchParams.has("guidance")
    ? parseFloat(searchParams.get("guidance")!)
    : undefined;
  const stepsOverride = searchParams.has("numSteps")
    ? parseInt(searchParams.get("numSteps")!, 10)
    : undefined;
  const aspectRatioOverride = searchParams.get("aspectRatio") || undefined;
  const outputFormatOverride = searchParams.get("outputFormat") || undefined;
  const resolutionOverride = searchParams.get("resolution") || undefined;
  const provider = resolveProvider(providerOverride, modelOverride);
  const modelUsed =
    modelOverride ||
    (provider === "gemini"
      ? GEMINI_MODEL
      : provider === "siliconflow"
        ? SILICONFLOW_MODEL
        : CF_MODEL);

  // Placeholder mode — return emoji SVG instantly (for loading states)
  if (searchParams.get("placeholder") === "1") {
    return emojiSvgResponse(word, wordCantonese, category, "emoji-placeholder");
  }

  if (
    process.env.NODE_ENV === "development" &&
    testMode &&
    provider === "cloudflare" &&
    modelUsed === CF_MODEL &&
    CF_LOCAL_PREVIEW_WORKER_URL &&
    !getCloudflareAiBinding() &&
    !requestUrl.href.startsWith(CF_LOCAL_PREVIEW_WORKER_URL)
  ) {
    return proxyToPreviewWorker(request);
  }

  // ── Step 0: Check disk cache first (skip in test mode for fresh generation) ──
  const cacheKey = getCacheKey(word, wordCantonese);
  if (!testMode) {
    const cachedImage = getCachedImage(cacheKey);
    if (cachedImage) {
      return new NextResponse(toResponseBytes(cachedImage), {
        headers: {
          "Content-Type": "image/jpeg",
          "Cache-Control": "public, max-age=604800, immutable",
          "X-Image-Source": "disk-cache",
        },
      });
    }
  }

  try {
    // 1. Translate word to English (dictionary first, Google Translate fallback)
    const source = wordCantonese || word;
    const translated = await Promise.resolve(translateToEnglish(source));

    // 2. Build the image prompt (with negative_prompt for SDXL)
    let imagePrompt: ImagePrompt;
    if (testMode && promptOverride) {
      // In test mode, use the user's custom prompt template
      // Replace {word} placeholder with the translated English word
      imagePrompt = {
        prompt: promptOverride.replace(/\{word\}/g, translated),
        negative_prompt:
          negPromptOverride || buildPrompt(translated).negative_prompt,
      };
    } else {
      imagePrompt = buildPrompt(translated);
    }

    // 3. Generate with Cloudflare Workers AI
    const genOptions: GenerateOptions = { provider };
    if (modelOverride) genOptions.model = modelOverride;
    if (guidanceOverride !== undefined && !isNaN(guidanceOverride))
      genOptions.guidance = guidanceOverride;
    if (stepsOverride !== undefined && !isNaN(stepsOverride))
      genOptions.numSteps = stepsOverride;
    if (aspectRatioOverride) genOptions.aspectRatio = aspectRatioOverride;
    if (outputFormatOverride) genOptions.outputFormat = outputFormatOverride;
    if (resolutionOverride) genOptions.resolution = resolutionOverride;

    let imageBytes: Buffer;
    let responseContentType = "image/jpeg";
    if (provider === "gemini") {
      const geminiImage = await generateWithGemini(imagePrompt, genOptions);
      imageBytes = geminiImage.buffer;
      responseContentType = geminiImage.mimeType;
    } else if (provider === "siliconflow") {
      const siliconFlowImage = await generateWithSiliconFlow(imagePrompt, genOptions);
      imageBytes = siliconFlowImage.buffer;
      responseContentType = siliconFlowImage.mimeType;
    } else {
      const cloudflareImage = await generateWithCloudflare(imagePrompt, genOptions);
      imageBytes = cloudflareImage.buffer;
      responseContentType = cloudflareImage.mimeType;
    }

    console.log(`using model ${modelUsed}`);

    // In normal mode, save provider output to disk cache. Test mode and Gemini stay uncached.
    if (!testMode && provider !== "gemini") {
      saveToDiskCache(cacheKey, imageBytes);
    }

    const sourceHeader =
      provider === "gemini"
        ? `gemini:${modelUsed.replace(/^models\//, "")}`
        : provider === "siliconflow"
          ? `siliconflow:${modelUsed.split("/").pop()?.toLowerCase() || "unknown"}`
          : `cloudflare:${modelUsed.split("/").pop()}`;

    return new NextResponse(toResponseBytes(imageBytes), {
      headers: {
        "Content-Type": responseContentType,
        "Cache-Control": testMode
          ? "no-store"
          : "public, max-age=604800, immutable",
        "X-Image-Source": sourceHeader,
        "X-Prompt": sanitizeHeaderValue(imagePrompt.prompt).slice(0, 200),
        "X-Model": modelUsed,
      },
    });
  } catch (err) {
    console.error("[generate-image] Unexpected error:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return emojiSvgResponse(
      word,
      wordCantonese,
      category,
      "emoji-fallback-error",
      errorMessage,
    );
  }
}
