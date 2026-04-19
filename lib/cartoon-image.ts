const BACKEND_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/v1\/?$/, "") ||
  "http://localhost:8000";

export interface CartoonImageInput {
  wordId: string;
  word?: string;
  wordCantonese?: string;
  category?: string;
  existingImageUrl?: string;
}

export function getAiCartoonImageUrl(input: CartoonImageInput): string;
export function getAiCartoonImageUrl(word: string, category?: string): string;
export function getAiCartoonImageUrl(
  inputOrWord: CartoonImageInput | string,
  category = "kids",
): string {
  const input: CartoonImageInput =
    typeof inputOrWord === "string"
      ? {
          wordId: inputOrWord,
          word: inputOrWord,
          category,
        }
      : inputOrWord;

  const encodedWord = encodeURIComponent((input.word || "object").trim());
  const cantoneseParam = input.wordCantonese
    ? `&word_cantonese=${encodeURIComponent(input.wordCantonese)}`
    : "";
  const categoryParam = input.category
    ? `&category=${encodeURIComponent(input.category)}`
    : "";
  const wordIdParam = `&word_id=${encodeURIComponent(input.wordId)}`;

  return `${BACKEND_BASE}/api/v1/images/generate?word=${encodedWord}${cantoneseParam}${categoryParam}${wordIdParam}`;
}

/**
 * Pre-load images for a batch of words.
 * Fires all requests in parallel; the browser will cache responses (7-day header).
 * Returns once all images have loaded (or failed), so the game can start
 * with images already in the browser cache — no loading placeholders needed.
 *
 * @param onProgress called with (loaded, total) for each image that finishes
 * @param timeoutMs  per-image timeout (default 60 s)
 */
export function preloadGameImages(
  words: {
    id: string;
    word: string;
    word_cantonese?: string;
    category: string;
    category_name?: string;
    image_url?: string;
  }[],
  onProgress?: (loaded: number, total: number) => void,
  timeoutMs = 60_000,
): Promise<void> {
  let loaded = 0;
  const total = words.length;

  const promises = words.map((w) => {
    return new Promise<void>((resolve) => {
      // If the backend already stored an image URL, preload that directly.
      // This avoids going through generate-image which re-generates and may fail.
      const url = w.image_url && w.image_url.trim()
        ? w.image_url
        : getAiCartoonImageUrl({
            wordId: w.id,
            word: w.word,
            wordCantonese: w.word_cantonese || "",
            category: w.category_name || w.category || "",
          });
      const img = new Image();
      const done = () => {
        loaded += 1;
        onProgress?.(loaded, total);
        resolve();
      };
      img.onload = done;
      img.onerror = done; // don't block the game on failures
      img.src = url;
      setTimeout(done, timeoutMs); // safety timeout
    });
  });

  return Promise.all(promises).then(() => {});
}

export const getCartoonImageUrl = getAiCartoonImageUrl;