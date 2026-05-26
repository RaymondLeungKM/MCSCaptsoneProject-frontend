"use client";

import { useState, useRef, useCallback } from "react";
import { lookupEmojiOrFallback } from "@/lib/word-emoji";
import {
  isBackendImageUrl,
  resolveBackendAssetUrl,
} from "@/lib/backend-assets";

interface CartoonWordImageProps {
  wordId: string;
  word: string;
  wordCantonese?: string;
  category: string;
  existingImageUrl?: string;
  /** Extra classes on the outer wrapper (must include sizing, e.g. w-full h-full) */
  className?: string;
  /** Tailwind font-size class for the placeholder emoji */
  emojiSize?: string;
  /** Gradient classes for the placeholder background */
  placeholderBg?: string;
  /** Show the word label overlaid on bottom */
  showLabel?: boolean;
}

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 2000;

/**
 * Renders a word's cartoon image.
 *
 * When images have been pre-loaded during the game loading screen, the browser
 * serves the <img> from its cache and onLoad fires almost instantly — so the
 * user never sees a placeholder at all.
 */
export function CartoonWordImage({
  wordId,
  word,
  wordCantonese,
  category,
  existingImageUrl,
  className = "w-full h-full",
  emojiSize = "text-5xl",
  placeholderBg = "bg-gradient-to-br from-violet-100 to-pink-50",
  showLabel = true,
}: CartoonWordImageProps) {
  const [realLoaded, setRealLoaded] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  const retriesRef = useRef(0);
  const [imgKey, setImgKey] = useState(0); // bump to force reload

  const emoji = lookupEmojiOrFallback(word, wordCantonese);

  // Games should only use image URLs already stored for the word in the DB.
  // Guard against emoji/non-URL values being stored in image_url (causes 404s).
  const hasStoredImage = isBackendImageUrl(existingImageUrl);
  const imgUrl = hasStoredImage ? resolveBackendAssetUrl(existingImageUrl) : "";

  const label = wordCantonese || word;

  const handleError = useCallback(() => {
    if (retriesRef.current < MAX_RETRIES) {
      retriesRef.current += 1;
      // Retry after a delay
      setTimeout(() => {
        setImgKey((k) => k + 1);
      }, RETRY_DELAY_MS);
    } else {
      setGaveUp(true);
    }
  }, []);

  const showPlaceholder = !imgUrl || !realLoaded || gaveUp;
  const shouldShowEmojiFallback = !imgUrl || gaveUp;
  const imageSrc = imgUrl
    ? `${imgUrl}${imgKey > 0 ? `${imgUrl.includes("?") ? "&" : "?"}_r=${imgKey}` : ""}`
    : "";

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* ── Loading / fallback placeholder ── */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-300 ${
          realLoaded && !gaveUp
            ? "opacity-0 pointer-events-none"
            : "opacity-100"
        } ${placeholderBg}`}
      >
        {shouldShowEmojiFallback ? (
          <span className={`${emojiSize} drop-shadow-sm`}>{emoji}</span>
        ) : (
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 border-3 border-purple-300 border-t-purple-500 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* ── Real image (stored backend photo only) ── */}
      {imgUrl && !gaveUp && (
        <img
          key={imgKey}
          src={imageSrc}
          alt={label}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            realLoaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setRealLoaded(true)}
          onError={handleError}
          loading="eager"
          crossOrigin="anonymous"
        />
      )}

      {/* ── Word label overlay ── */}
      {showLabel && (
        <div className="absolute bottom-1.5 left-1.5 right-1.5 rounded-full bg-black/50 backdrop-blur-sm px-3 py-1.5">
          <p className="text-sm text-white font-black truncate text-center drop-shadow-sm">
            {label}
          </p>
        </div>
      )}
    </div>
  );
}
