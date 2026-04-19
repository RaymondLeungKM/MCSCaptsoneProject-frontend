import type { Word, Category, LanguagePreference } from "./types";

/**
 * Get the appropriate word text based on language preference
 */
export function getWordText(
  word: Word,
  language: LanguagePreference = "cantonese",
): string {
  switch (language) {
    case "cantonese":
      return word.word_cantonese || word.word;
    case "bilingual":
      return word.word_cantonese
        ? `${word.word_cantonese} ${word.word}`
        : word.word;
    case "english":
    default:
      return word.word;
  }
}

/**
 * Get the appropriate definition based on language preference
 */
export function getDefinition(
  word: Word,
  language: LanguagePreference = "cantonese",
): string {
  switch (language) {
    case "cantonese":
      return word.definition_cantonese || word.definition;
    case "bilingual":
      return word.definition_cantonese
        ? `${word.definition_cantonese} / ${word.definition}`
        : word.definition;
    case "english":
    default:
      return word.definition;
  }
}

/**
 * Get the appropriate example based on language preference
 */
export function getExample(
  word: Word,
  language: LanguagePreference = "cantonese",
): string {
  switch (language) {
    case "cantonese":
      // If no Cantonese example, create a simple one using the word
      return (
        word.example_cantonese || `我見到${word.word_cantonese || word.word}。`
      );
    case "bilingual":
      return word.example_cantonese
        ? `${word.example_cantonese} / ${word.example}`
        : `${word.word_cantonese || word.word} / ${word.example}`;
    case "english":
    default:
      return word.example;
  }
}

/**
 * Get the appropriate category name based on language preference
 */
export function getCategoryName(
  category: Category,
  language: LanguagePreference = "cantonese",
): string {
  switch (language) {
    case "cantonese":
      return category.name_cantonese || category.name;
    case "bilingual":
      return category.name_cantonese
        ? `${category.name_cantonese} ${category.name}`
        : category.name;
    case "english":
    default:
      return category.name;
  }
}

/**
 * Get pronunciation text (Jyutping for Cantonese, IPA for English)
 */
export function getPronunciation(
  word: Word,
  language: LanguagePreference = "cantonese",
): string | null {
  switch (language) {
    case "cantonese":
      return word.jyutping || null;
    case "bilingual":
      return word.jyutping
        ? `${word.jyutping} / ${word.pronunciation}`
        : word.pronunciation;
    case "english":
    default:
      return word.pronunciation;
  }
}

/**
 * Get the audio URL based on language preference
 */
export function getAudioUrl(
  word: Word,
  language: LanguagePreference = "cantonese",
): string | undefined {
  switch (language) {
    case "cantonese":
    case "bilingual":
      return word.audio_url || word.audio_url_english;
    case "english":
    default:
      return word.audio_url_english || word.audio_url;
  }
}

/**
 * Get the text to speak based on language preference
 */
export function getSpeechText(
  word: Word,
  language: LanguagePreference = "cantonese",
): string {
  // For speech, we typically want just the word, not bilingual format
  switch (language) {
    case "cantonese":
      return word.word_cantonese || word.word;
    case "english":
      return word.word;
    case "bilingual":
      // For bilingual, speak the Cantonese version first
      return word.word_cantonese || word.word;
    default:
      return word.word;
  }
}

/**
 * Validate that a jyutping string is genuine Cantonese romanisation.
 * Real Jyutping always contains tone digits 1-6 (e.g. maau1, faai3 zi2).
 * Mandarin Pinyin uses diacritics (ā á ǎ à etc.) and no tone digits — reject those.
 */
export function isValidJyutping(jyutping?: string): boolean {
  if (!jyutping || jyutping.trim() === "") return false;
  const hasToneDigit = /[1-6]/.test(jyutping);
  const hasPinyinDiacritic = /[\u0101\u00e1\u01ce\u00e0\u014d\u00f3\u01d2\u016b\u00fa\u01d4\u00f9\u012b\u00ed\u01d0\u00ec\u0113\u00e9\u011b\u00e8\u01d6\u01d8\u01da\u01dc]/i.test(jyutping);
  return hasToneDigit && !hasPinyinDiacritic;
}
