const CHILD_TEXT_TRANSLATIONS: Record<string, string> = {
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
  big: "大",
  bitter: "苦",
  book: "書",
  bus: "巴士",
  car: "車",
  cat: "貓",
  classroom: "課室",
  cold: "凍",
  crunchy: "脆",
  dog: "狗",
  dry: "乾",
  easy: "簡單",
  family: "家庭",
  farm: "農場",
  food: "食物",
  forest: "森林",
  friend: "朋友",
  fruit: "水果",
  general: "一般",
  glue: "膠水",
  hard: "難",
  home: "家",
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
  park: "公園",
  pencil: "鉛筆",
  playground: "遊樂場",
  round: "圓",
  school: "學校",
  shampoo: "洗頭水",
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

export function containsChineseText(value?: string | null): boolean {
  return /[\u3400-\u9fff]/.test(value ?? "");
}

function normalizeChildFacingText(value?: string | null): string {
  return (value ?? "")
    .replace(/sample-community[^:\s]*:/gi, "")
    .replace(/[0-9a-f]{8}-[0-9a-f-]{8,}/gi, "")
    .replace(/\b[a-z]:/gi, "")
    .replace(/["'`]/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripLatinFragments(value: string): string {
  return value
    .replace(/\b[A-Za-z][A-Za-z\s-]*\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function translateNormalizedText(normalized: string): string | null {
  if (!normalized) {
    return null;
  }

  const direct = CHILD_TEXT_TRANSLATIONS[normalized];
  if (direct) {
    return direct;
  }

  const tokens = normalized.split(/[\s,/]+/).filter(Boolean);
  if (tokens.length > 1 && tokens.every((token) => CHILD_TEXT_TRANSLATIONS[token])) {
    return tokens.map((token) => CHILD_TEXT_TRANSLATIONS[token]).join("、");
  }

  return null;
}

export function toChildFriendlyText(value?: string | null): string | null {
  const trimmed = (value ?? "").trim();
  if (!trimmed) {
    return null;
  }

  if (containsChineseText(trimmed)) {
    const cleaned = stripLatinFragments(normalizeChildFacingText(trimmed));
    return cleaned || trimmed;
  }

  const normalized = normalizeChildFacingText(trimmed).toLowerCase();
  return translateNormalizedText(normalized);
}

export function toChildFriendlyList(values?: Array<string | null | undefined>): string[] {
  const uniqueValues = new Set<string>();

  for (const value of values ?? []) {
    const translated = toChildFriendlyText(value);
    if (translated) {
      uniqueValues.add(translated);
    }
  }

  return Array.from(uniqueValues);
}