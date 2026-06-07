#!/usr/bin/env node

/**
 * verify-models.mjs
 *
 * Calls /api/generate-image for every model with a test word ("cat").
 * Saves results to ../test-images/{modelKey}.{ext}
 * Flags any model that returns an emoji SVG fallback instead of a real image.
 *
 * Usage:
 *   node scripts/verify-models.mjs [baseUrl]
 *   e.g. node scripts/verify-models.mjs http://localhost:3000
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, "..", "test-images");
const BASE_URL = process.argv[2] || "http://localhost:3000";
const CONCURRENCY = 2;

const MODELS = {
  "sdxl-lightning": {
    id: "@cf/bytedance/stable-diffusion-xl-lightning",
    name: "SDXL-Lightning",
    steps: 4,
    guidance: 7.5,
    provider: "cloudflare",
  },
  "sdxl-base": {
    id: "@cf/stabilityai/stable-diffusion-xl-base-1.0",
    name: "SDXL Base 1.0",
    steps: 20,
    guidance: 7.5,
    provider: "cloudflare",
  },
  dreamshaper: {
    id: "@cf/lykon/dreamshaper-8-lcm",
    name: "DreamShaper 8",
    steps: 8,
    guidance: 7.5,
    provider: "cloudflare",
  },
  flux: {
    id: "@cf/black-forest-labs/flux-1-schnell",
    name: "FLUX.1 Schnell",
    steps: 4,
    guidance: 7.5,
    provider: "cloudflare",
  },
  "flux-2-dev": {
    id: "@cf/black-forest-labs/flux-2-dev",
    name: "FLUX.2 Dev",
    steps: 20,
    guidance: 7.5,
    provider: "cloudflare",
  },
  "flux-2-klein-9b": {
    id: "@cf/black-forest-labs/flux-2-klein-9b",
    name: "FLUX.2 Klein 9B",
    steps: 4,
    guidance: 7.5,
    provider: "cloudflare",
  },
  "flux-2-klein-4b": {
    id: "@cf/black-forest-labs/flux-2-klein-4b",
    name: "FLUX.2 Klein 4B",
    steps: 4,
    guidance: 7.5,
    provider: "cloudflare",
  },
  "lucid-origin": {
    id: "@cf/leonardo/lucid-origin",
    name: "Leonardo Lucid Origin",
    steps: 8,
    guidance: 7.5,
    provider: "cloudflare",
  },
  phoenix: {
    id: "@cf/leonardo/phoenix-1.0",
    name: "Leonardo Phoenix 1.0",
    steps: 8,
    guidance: 7.5,
    provider: "cloudflare",
  },
  kolor: {
    id: "Kwai-Kolors/Kolors",
    name: "Kolor (SiliconFlow)",
    steps: 20,
    guidance: 7.5,
    provider: "siliconflow",
  },
  "gemini-2.5-flash-image": {
    id: "gemini-2.5-flash-image",
    name: "Gemini 2.5 Flash Image",
    steps: 1,
    guidance: 1,
    provider: "gemini",
  },
  "gemini-3.1-flash-image-preview": {
    id: "gemini-3.1-flash-image-preview",
    name: "Gemini 3.1 Flash Image",
    steps: 1,
    guidance: 1,
    provider: "gemini",
  },
};

const TEST_WORD = "cat";
const TEST_CANTONESE = "貓";

async function testModel(key, model) {
  const params = new URLSearchParams({
    word: TEST_WORD,
    wordCantonese: TEST_CANTONESE,
    category: "test",
    testMode: "1",
    model: model.id,
    promptOverride: "a single {word}, photorealistic product photo on a pure white background, soft studio lighting, no text",
    negPromptOverride: "cartoon, emoji, vector, illustration, text, watermark, blurry, multiple objects, human",
    guidance: String(model.guidance),
    numSteps: String(model.steps),
    provider: model.provider,
  });

  const url = `${BASE_URL}/api/generate-image?${params}`;
  const t0 = Date.now();

  try {
    const res = await fetch(url);
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    const sourceHeader = res.headers.get("X-Image-Source") || "";
    const contentType = res.headers.get("Content-Type") || "";
    const isEmojiFallback =
      contentType.includes("svg") ||
      sourceHeader.includes("emoji") ||
      sourceHeader.includes("fallback") ||
      sourceHeader.includes("placeholder");

    const buffer = Buffer.from(await res.arrayBuffer());

    if (isEmojiFallback || buffer.byteLength < 2000) {
      const preview = buffer.toString("utf-8").slice(0, 200);
      return {
        key,
        name: model.name,
        status: "FALLBACK",
        elapsed,
        source: sourceHeader,
        detail: `Size: ${buffer.byteLength}B, Preview: ${preview}`,
      };
    }

    // Determine extension from content type
    const ext = contentType.includes("png") ? "png" : "jpg";
    const filename = `${key}.${ext}`;
    const filepath = join(OUTPUT_DIR, filename);
    writeFileSync(filepath, buffer);

    return {
      key,
      name: model.name,
      status: "OK",
      elapsed,
      source: sourceHeader,
      size: buffer.byteLength,
      file: `test-images/${filename}`,
    };
  } catch (err) {
    return {
      key,
      name: model.name,
      status: "ERROR",
      elapsed: ((Date.now() - t0) / 1000).toFixed(1),
      detail: err.message,
    };
  }
}

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log(`\n🔍 Verifying ${Object.keys(MODELS).length} models via ${BASE_URL}/api/generate-image\n`);
  console.log(`Test word: "${TEST_WORD}" | Concurrent: ${CONCURRENCY}\n`);

  const entries = Object.entries(MODELS);
  const results = [];
  const sem = { count: 0 };

  const tasks = entries.map(
    ([key, model]) =>
      new Promise((resolve) => {
        const poll = () => {
          if (sem.count >= CONCURRENCY) {
            setTimeout(poll, 200);
            return;
          }
          sem.count++;
          testModel(key, model).then((r) => {
            results.push(r);
            sem.count--;
            resolve();
          });
        };
        poll();
      })
  );

  await Promise.all(tasks);

  // Sort results
  results.sort((a, b) => a.name.localeCompare(b.name));

  // Print results
  console.log("─".repeat(80));
  let ok = 0, fallback = 0, errors = 0;
  for (const r of results) {
    const icon = r.status === "OK" ? "✅" : r.status === "FALLBACK" ? "⚠️" : "❌";
    console.log(`${icon} ${r.name.padEnd(32)} ${r.status.padEnd(10)} ${r.elapsed}s  ${r.source || ""}`);
    if (r.status === "OK") {
      console.log(`   Saved → ${r.file} (${(r.size / 1024).toFixed(1)}KB)`);
      ok++;
    } else if (r.status === "FALLBACK") {
      console.log(`   ⚠️  FALLBACK: ${r.detail}`);
      fallback++;
    } else {
      console.log(`   ❌ ERROR: ${r.detail}`);
      errors++;
    }
  }

  console.log("─".repeat(80));
  console.log(`\n📊 Summary: ${ok} OK | ${fallback} fallback (emoji) | ${errors} errors`);
  console.log(`📁 Images saved to: ${OUTPUT_DIR}\n`);

  if (fallback > 0 || errors > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
