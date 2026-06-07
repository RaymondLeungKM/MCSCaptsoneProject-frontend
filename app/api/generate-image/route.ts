import { NextResponse } from "next/server";
import { lookupEmoji } from "@/lib/word-emoji";
import * as fs from "fs";
import * as path from "path";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/* ── Env ─────────────────────────────────────────────────────────────── */

const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || "";
const CF_API_TOKEN =
  process.env.CLOUDFLARE_AI_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN || "";
const CF_MODEL = "@cf/black-forest-labs/flux-2-klein-9b";
const SILICONFLOW_API_KEY = process.env.SILICONFLOW_API_KEY || "";
const SILICONFLOW_MODEL = "Kwai-Kolors/Kolors";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const CF_AI_GATEWAY_ID = process.env.CLOUDFLARE_AI_GATEWAY_ID || process.env.CF_AI_GATEWAY_SLUG || "";
const CF_AI_GATEWAY_TOKEN =
  process.env.CLOUDFLARE_AI_GATEWAY_TOKEN || process.env.CLOUDFLARE_AI_API_TOKEN || "";

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
  拖鞋: "slippers",
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
  return AbortSignal.timeout(ms);
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
    prompt: `a single ${w}, highly detailed, photorealistic RAW photograph, centered on a pure white seamless background. High-end product photography, soft studio lighting, shot on DSLR, 85mm lens, f/8 aperture, razor-sharp focus, visible natural textures, 8k resolution. Clean and bright, no text, no label.`,
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
) {
  const emoji = lookupEmoji(word, wordCantonese) ?? "🎨";
  return new NextResponse(buildEmojiSvg(emoji, word, category), {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
      "X-Image-Source": source,
    },
  });
}

/* ── Cloudflare Workers AI call ──────────────────────────────────────── */

interface GenerateOptions {
  provider?: ImageProvider;
  model?: string;
  guidance?: number;
  numSteps?: number;
}

interface GeneratedImageResult {
  buffer: Buffer;
  mimeType: string;
}

/* Models that require multipart form data instead of JSON */
const MULTIPART_MODELS = new Set([
  "@cf/black-forest-labs/flux-2-dev",
  "@cf/black-forest-labs/flux-2-klein-9b",
  "@cf/black-forest-labs/flux-2-klein-4b",
]);

/* Models that only accept { prompt } JSON (no guidance, num_steps, etc.) */
const SIMPLE_JSON_MODELS = new Set([
  "google/nano-banana-2",
  "@cf/lykon/dreamshaper-8-lcm",
]);

/* Models that break with long negative prompts — skip negative_prompt for these */
const SKIP_NEG_PROMPT_MODELS = new Set([
  "@cf/lykon/dreamshaper-8-lcm",
]);

async function generateWithCloudflare(
  imagePrompt: ImagePrompt,
  options: GenerateOptions = {},
): Promise<GeneratedImageResult | null> {
  if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
    console.warn(
      "[generate-image] Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN",
    );
    return null;
  }

  const model = options.model || CF_MODEL;
  const guidance = options.guidance ?? 7.5;
  const numSteps = options.numSteps ?? 4;

  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/${model}`;
  const useMultipart = MULTIPART_MODELS.has(model);

  try {
    let res: Response;

    if (useMultipart) {
      // Newer models (FLUX.2, Leonardo) require multipart form data
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
        signal: withTimeoutSignal(180_000),
      });
    } else if (SIMPLE_JSON_MODELS.has(model)) {
      // Google Nano models → only accept { prompt } with no extra params
      res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${CF_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: imagePrompt.prompt,
        }),
        signal: withTimeoutSignal(60_000),
      });
    } else {
      // Classic models use JSON body
      const skipNegPrompt = SKIP_NEG_PROMPT_MODELS.has(model);
      const jsonBody: Record<string, unknown> = {
        prompt: imagePrompt.prompt,
        width: 512,
        height: 512,
        guidance,
        num_steps: numSteps,
      };
      if (!skipNegPrompt && imagePrompt.negative_prompt) {
        jsonBody.negative_prompt = imagePrompt.negative_prompt;
      }
      res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${CF_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(jsonBody),
        signal: withTimeoutSignal(60_000),
      });
    }

    if (!res.ok) {
      console.error(
        `[generate-image] Cloudflare error ${res.status}: ${await res.text().catch(() => "")}`,
      );
      return null;
    }

    // SDXL-Lightning returns raw image bytes via REST API
    // But some CF models may return JSON { result: { image: "<base64>" } }
    const contentType = res.headers.get("content-type") || "";
    let imageBuffer: Buffer;
    let mimeType = "image/jpeg";

    if (contentType.includes("image/")) {
      // Raw binary image response
      const arrayBuf = await res.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuf);
      mimeType = contentType.split(";")[0] || mimeType;
    } else {
      // JSON response (base64-encoded image)
      const json = (await res.json()) as { result?: { image?: string } };
      const b64 = json?.result?.image;
      if (!b64) {
        console.error(
          "[generate-image] Cloudflare JSON response missing result.image",
        );
        return null;
      }
      imageBuffer = Buffer.from(b64, "base64");
    }

    if (imageBuffer.byteLength < 1000) {
      console.error("[generate-image] Cloudflare response too small or empty");
      return null;
    }

    return { buffer: imageBuffer, mimeType };
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      console.error(`[generate-image] Cloudflare request aborted (timeout) for model: ${model}`);
    } else {
      console.error("[generate-image] Cloudflare fetch error:", err);
    }
    return null;
  }
}

function buildPositiveImagePrompt(imagePrompt: ImagePrompt): string {
  const negativePrompt = imagePrompt.negative_prompt.trim();
  if (!negativePrompt) {
    return imagePrompt.prompt;
  }

  return `${imagePrompt.prompt}\n\nAvoid the following elements: ${negativePrompt}.`;
}

function normalizeImageMimeType(contentType: string | null, fallback = "image/png"): string {
  const normalized = contentType?.split(";")[0]?.trim().toLowerCase() || "";
  if (normalized.startsWith("image/")) {
    return normalized;
  }
  return fallback;
}

async function generateWithSiliconFlow(
  imagePrompt: ImagePrompt,
  options: GenerateOptions = {},
): Promise<GeneratedImageResult | null> {
  if (!SILICONFLOW_API_KEY) {
    console.warn("[generate-image] Missing SILICONFLOW_API_KEY");
    return null;
  }

  const model = options.model || SILICONFLOW_MODEL;

  try {
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
      console.error(
        `[generate-image] SiliconFlow error ${res.status}: ${await res.text().catch(() => "")}`,
      );
      return null;
    }

    const json = (await res.json()) as {
      images?: Array<{ url?: string }>;
    };
    const imageUrl = json.images?.[0]?.url;
    if (!imageUrl) {
      console.error("[generate-image] SiliconFlow response missing image URL");
      return null;
    }

    const imageRes = await fetch(imageUrl, {
      signal: withTimeoutSignal(60_000),
    });
    if (!imageRes.ok) {
      console.error(`[generate-image] SiliconFlow image fetch failed ${imageRes.status}`);
      return null;
    }

    const arrayBuf = await imageRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);
    if (buffer.byteLength < 1000) {
      console.error("[generate-image] SiliconFlow response too small or empty");
      return null;
    }

    return {
      buffer,
      mimeType: normalizeImageMimeType(imageRes.headers.get("content-type"), "image/png"),
    };
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      console.error(`[generate-image] SiliconFlow request aborted (timeout) for model: ${model}`);
    } else {
      console.error("[generate-image] SiliconFlow fetch error:", err);
    }
    return null;
  }
}

function buildGeminiRequest(model: string): { url: string; headers: Record<string, string> } | null {
  const normalizedModel = model.replace(/^models\//, "");

  // Direct Gemini API → requires GEMINI_API_KEY
  if (GEMINI_API_KEY) {
    return {
      url: `https://generativelanguage.googleapis.com/v1beta/models/${normalizedModel}:generateContent?key=${GEMINI_API_KEY}`,
      headers: { "Content-Type": "application/json" },
    };
  }

  // Cloudflare AI Gateway fallback → proxies Google AI Studio
  if (CF_ACCOUNT_ID && CF_AI_GATEWAY_ID && CF_AI_GATEWAY_TOKEN) {
    console.log(`[generate-image] Using Cloudflare AI Gateway for Gemini model: ${normalizedModel}`);
    return {
      url: `https://gateway.ai.cloudflare.com/v1/${CF_ACCOUNT_ID}/${CF_AI_GATEWAY_ID}/google-ai-studio/v1beta/models/${normalizedModel}:generateContent`,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${CF_AI_GATEWAY_TOKEN}`,
      },
    };
  }

  console.warn("[generate-image] No GEMINI_API_KEY or Cloudflare AI Gateway configured");
  return null;
}

async function generateWithGemini(
  imagePrompt: ImagePrompt,
  options: GenerateOptions = {},
): Promise<GeneratedImageResult | null> {
  const model = options.model || GEMINI_MODEL;
  const request = buildGeminiRequest(model);

  if (!request) {
    return null;
  }

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
        generationConfig: {
          responseModalities: ["IMAGE"],
          imageConfig: {
            aspectRatio: "1:1",
          },
        },
      }),
      signal: withTimeoutSignal(60_000),
    });

    if (!res.ok) {
      console.error(
        `[generate-image] Gemini error ${res.status}: ${await res.text().catch(() => "")}`,
      );
      return null;
    }

    const json = (await res.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{
            inlineData?: { mimeType?: string; data?: string };
            inline_data?: { mime_type?: string; data?: string };
          }>;
        };
      }>;
      promptFeedback?: { blockReason?: string };
    };

    if (json.promptFeedback?.blockReason) {
      console.error(`[generate-image] Gemini blocked prompt: ${json.promptFeedback.blockReason}`);
      return null;
    }

    for (const candidate of json.candidates ?? []) {
      for (const part of candidate.content?.parts ?? []) {
        const inline = part.inlineData ?? part.inline_data;
        const mimeType =
          (inline && "mimeType" in inline ? inline.mimeType : undefined) ??
          (inline && "mime_type" in inline ? inline.mime_type : undefined) ??
          "image/png";
        if (inline?.data) {
          const buffer = Buffer.from(inline.data, "base64");
          if (buffer.byteLength < 1000) {
            continue;
          }

          return {
            buffer,
            mimeType: normalizeImageMimeType(mimeType, "image/png"),
          };
        }
      }
    }

    console.error("[generate-image] Gemini response did not include an image");
    return null;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      console.error(`[generate-image] Gemini request aborted (timeout) for model: ${model}`);
    } else {
      console.error("[generate-image] Gemini fetch error:", err);
    }
    return null;
  }
}

function resolveProvider(providerOverride: string, modelOverride: string): ImageProvider {
  if (providerOverride === "gemini") {
    return "gemini";
  }
  if (providerOverride === "siliconflow") {
    return "siliconflow";
  }
  if (modelOverride === GEMINI_MODEL || modelOverride === "gemini-3.1-flash-image-preview") {
    return "gemini";
  }
  if (modelOverride === SILICONFLOW_MODEL) {
    return "siliconflow";
  }
  // Google image models → route through Gemini/Cloudflare AI Gateway
  if (
    modelOverride.startsWith("gemini-") ||
    modelOverride.startsWith("google/")
  ) {
    return "gemini";
  }
  return "cloudflare";
}

/* ── Route handler ───────────────────────────────────────────────────── */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
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
  const provider = resolveProvider(providerOverride, modelOverride);

  // Placeholder mode — return emoji SVG instantly (for loading states)
  if (searchParams.get("placeholder") === "1") {
    return emojiSvgResponse(word, wordCantonese, category, "emoji-placeholder");
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

    const modelUsed =
      modelOverride ||
      (provider === "gemini"
        ? GEMINI_MODEL
        : provider === "siliconflow"
          ? SILICONFLOW_MODEL
          : CF_MODEL);
    console.log(`using model ${modelUsed}`);

    const imageResult =
      provider === "gemini"
        ? await generateWithGemini(imagePrompt, genOptions)
        : provider === "siliconflow"
          ? await generateWithSiliconFlow(imagePrompt, genOptions)
          : await generateWithCloudflare(imagePrompt, genOptions);

    if (imageResult && imageResult.buffer.byteLength > 1000) {
      // In normal mode, save to disk cache. In test mode, skip caching.
      if (!testMode) {
        saveToDiskCache(cacheKey, imageResult.buffer);
      }

      const sourceHeader =
        provider === "gemini"
          ? `gemini:${modelUsed.replace(/^models\//, "")}`
          : provider === "siliconflow"
            ? `siliconflow:${modelUsed.split("/").pop()?.toLowerCase() || "unknown"}`
            : `cloudflare:${modelUsed.split("/").pop()}`;

      return new NextResponse(toResponseBytes(imageResult.buffer), {
        headers: {
          "Content-Type": imageResult.mimeType,
          "Cache-Control": testMode
            ? "no-store"
            : "public, max-age=604800, immutable",
          "X-Image-Source": sourceHeader,
          "X-Prompt": imagePrompt.prompt.slice(0, 200),
          "X-Model": modelUsed,
        },
      });
    }

    // 4. Provider unavailable → fall back to emoji
    console.warn(
      `[generate-image] ${provider} returned no image, falling back to emoji`,
    );
    return emojiSvgResponse(
      word,
      wordCantonese,
      category,
      `emoji-fallback-${provider}-fail`,
    );
  } catch (err) {
    console.error("[generate-image] Unexpected error:", err);
    return emojiSvgResponse(
      word,
      wordCantonese,
      category,
      `emoji-fallback-${provider}-error`,
    );
  }
}
