import type { Category, LanguagePreference, Word } from "./types";

const CHILD_TEXT_FALLBACKS: Record<string, string> = {
  apple: "蘋果",
  banana: "香蕉",
  ball: "波",
  bath: "洗澡",
  "bath time": "洗澡時間",
  bath_time: "洗澡時間",
  bathroom: "浴室",
  beach: "沙灘",
  bedtime: "睡前",
  bedroom: "睡房",
  bird: "鳥",
  big: "大",
  bitter: "苦",
  book: "書",
  bus: "巴士",
  car: "車",
  cat: "貓",
  chicken: "雞",
  classroom: "課室",
  cold: "凍",
  cow: "牛",
  crunchy: "脆",
  dog: "狗",
  dry: "乾",
  duck: "鴨",
  easy: "簡單",
  family: "家庭",
  farm: "農場",
  fish: "魚",
  food: "食物",
  forest: "森林",
  friend: "朋友",
  fruit: "水果",
  general: "一般",
  glue: "膠水",
  hard: "難",
  home: "家",
  horse: "馬",
  hot: "熱",
  indoor: "室內",
  indoors: "室內",
  kitchen: "廚房",
  long: "長",
  meal: "用餐",
  "meal time": "用餐時間",
  mealtime: "用餐時間",
  meal_time: "用餐時間",
  mirror: "鏡",
  nature: "大自然",
  ocean: "海洋",
  outdoor: "戶外",
  outdoors: "戶外",
  panda: "熊貓",
  park: "公園",
  pencil: "鉛筆",
  pig: "豬",
  playground: "遊樂場",
  rabbit: "兔仔",
  round: "圓",
  school: "學校",
  shampoo: "洗頭水",
  sheep: "羊",
  shopping: "購物",
  short: "短",
  shower: "花灑",
  sky: "天空",
  small: "細",
  smooth: "滑",
  soft: "柔軟",
  sour: "酸",
  spicy: "辣",
  street: "街道",
  sweet: "甜",
  teacher: "老師",
  towel: "毛巾",
  toy: "玩具",
  toys: "玩具",
  tropical: "熱帶",
  warm: "暖",
  water: "水",
  wave: "波浪",
  wet: "濕",
  zoo: "動物園",
};

function normalizeChildText(value?: string | null): string {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/["'`]/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function toChildFriendlyDisplayText(value?: string | null): string | null {
  const trimmed = (value ?? "").trim();
  if (!trimmed) {
    return null;
  }

  if (/[^\x00-\x7F]/.test(trimmed)) {
    return trimmed;
  }

  const normalized = normalizeChildText(trimmed);
  return CHILD_TEXT_FALLBACKS[normalized] || null;
}

function normalizeSentenceCandidate(value?: string | null): string {
  return (value ?? "").replace(/["'`]/g, "").trim();
}

function isWordOnlySentence(candidate: string | undefined, word: Word): boolean {
  const normalizedCandidate = normalizeSentenceCandidate(candidate);
  const normalizedEnglishWord = normalizeSentenceCandidate(word.word);
  const normalizedCantoneseWord = normalizeSentenceCandidate(
    word.word_cantonese || word.word,
  );

  return (
    !normalizedCandidate ||
    normalizedCandidate === normalizedEnglishWord ||
    normalizedCandidate === normalizedCantoneseWord
  );
}

function buildFallbackCantoneseExample(word: Word): string {
  const displayWord =
    word.word_cantonese || toChildFriendlyDisplayText(word.word) || word.word;
  return `我哋今日一齊學${displayWord}，再用佢講一個完整句子。`;
}

function buildFallbackEnglishExample(word: Word): string {
  const displayWord = (word.word || word.word_cantonese || "this word").trim();
  return `Today we are learning ${displayWord}, and we can use it in a full sentence.`;
}

export function getWordText(
  word: Word,
  language: LanguagePreference = "cantonese",
): string {
  switch (language) {
    case "cantonese":
      return (
        word.word_cantonese || toChildFriendlyDisplayText(word.word) || word.word
      );
    case "bilingual":
      return word.word_cantonese
        ? `${word.word_cantonese} ${toChildFriendlyDisplayText(word.word) || word.word}`
        : toChildFriendlyDisplayText(word.word) || word.word;
    case "english":
    default:
      return word.word;
  }
}

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

export function getExample(
  word: Word,
  language: LanguagePreference = "cantonese",
): string {
  const cantoneseExample = isWordOnlySentence(word.example_cantonese, word)
    ? buildFallbackCantoneseExample(word)
    : (word.example_cantonese || "").trim();
  const englishExample = isWordOnlySentence(word.example, word)
    ? buildFallbackEnglishExample(word)
    : (word.example || "").trim();

  switch (language) {
    case "cantonese":
      return cantoneseExample;
    case "bilingual":
      return `${cantoneseExample} / ${englishExample}`;
    case "english":
    default:
      return englishExample;
  }
}

export function getCategoryName(
  category: Category,
  language: LanguagePreference = "cantonese",
): string {
  switch (language) {
    case "cantonese":
      return (
        category.name_cantonese ||
        toChildFriendlyDisplayText(category.name) ||
        category.name
      );
    case "bilingual":
      return category.name_cantonese
        ? `${category.name_cantonese} ${toChildFriendlyDisplayText(category.name) || category.name}`
        : toChildFriendlyDisplayText(category.name) || category.name;
    case "english":
    default:
      return category.name;
  }
}

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

export function getAudioUrl(
  word: Word,
  language: LanguagePreference = "cantonese",
): string | undefined {
  switch (language) {
    case "cantonese":
    case "bilingual":
      return word.audio_url || undefined;
    case "english":
    default:
      return word.audio_url_english || undefined;
  }
}

export function getSpeechText(
  word: Word,
  language: LanguagePreference = "cantonese",
): string {
  switch (language) {
    case "cantonese":
      return word.word_cantonese || toChildFriendlyDisplayText(word.word) || word.word;
    case "english":
      return word.word;
    case "bilingual":
      return word.word_cantonese || toChildFriendlyDisplayText(word.word) || word.word;
    default:
      return word.word;
  }
}

export function isValidJyutping(jyutping?: string): boolean {
  if (!jyutping || jyutping.trim() === "") {
    return false;
  }

  const hasToneDigit = /[1-6]/.test(jyutping);
  const hasPinyinDiacritic = /[\u0101\u00e1\u01ce\u00e0\u014d\u00f3\u01d2\u016b\u00fa\u01d4\u00f9\u012b\u00ed\u01d0\u00ec\u0113\u00e9\u011b\u00e8\u01d6\u01d8\u01da\u01dc]/i.test(
    jyutping,
  );

  return hasToneDigit && !hasPinyinDiacritic;
}