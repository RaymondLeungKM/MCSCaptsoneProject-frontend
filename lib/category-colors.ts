export const CATEGORY_COLOR_PALETTE = [
  "bg-sunny",
  "bg-coral",
  "bg-sky",
  "bg-mint",
  "bg-lavender",
  "bg-rose-400",
  "bg-amber-400",
  "bg-teal-400",
  "bg-indigo-400",
  "bg-emerald-400",
  "bg-pink-400",
  "bg-cyan-400",
];

const CATEGORY_COLOR_MAP: Record<string, string> = {
  animals: "bg-sunny",
  animal: "bg-sunny",
  food: "bg-coral",
  foods: "bg-coral",
  colors: "bg-sky",
  colour: "bg-sky",
  nature: "bg-mint",
  plants: "bg-mint",
  family: "bg-lavender",
  people: "bg-lavender",
  vehicles: "bg-amber-400",
  transport: "bg-amber-400",
  "vehicles transport": "bg-amber-400",
  body: "bg-rose-400",
  "body parts": "bg-rose-400",
  clothing: "bg-pink-400",
  clothes: "bg-pink-400",
  home: "bg-teal-400",
  house: "bg-teal-400",
  numbers: "bg-indigo-400",
  counting: "bg-indigo-400",
  shapes: "bg-cyan-400",
  general: "bg-slate-400",
  other: "bg-slate-400",
  gray: "bg-slate-400",
  grey: "bg-slate-400",
};

const CATEGORY_COLOR_NAME_SET = new Set(
  CATEGORY_COLOR_PALETTE.map((color) => color.replace(/^bg-/, "")),
);

function normalizeCategoryName(name: string) {
  return name
    .toLowerCase()
    .replace(/[\/]+/g, " ")
    .replace(/&/g, "and")
    .replace(/\s+/g, " ")
    .trim();
}

function looksLikeTailwindColor(value: string) {
  return /^[a-z]+-\d{2,3}(\/\d{1,3})?$/.test(value);
}

function normalizeColorToken(value: string) {
  const normalized = value.toLowerCase().trim();
  if (
    normalized === "bg-gray" ||
    normalized === "gray" ||
    normalized === "grey"
  ) {
    return "bg-slate-400";
  }
  return value;
}

export function resolveCategoryColor(
  color: string | null | undefined,
  name: string,
  index = 0,
) {
  const trimmed = color?.trim();
  if (trimmed) {
    const normalizedColor = normalizeColorToken(trimmed);

    if (normalizedColor.startsWith("bg-")) {
      return normalizedColor;
    }

    if (CATEGORY_COLOR_NAME_SET.has(normalizedColor)) {
      return `bg-${normalizedColor}`;
    }

    if (looksLikeTailwindColor(normalizedColor)) {
      return `bg-${normalizedColor}`;
    }
  }

  const normalizedName = normalizeCategoryName(name);
  if (CATEGORY_COLOR_MAP[normalizedName]) {
    return CATEGORY_COLOR_MAP[normalizedName];
  }

  const paletteIndex =
    CATEGORY_COLOR_PALETTE.length > 0
      ? index % CATEGORY_COLOR_PALETTE.length
      : 0;
  return CATEGORY_COLOR_PALETTE[paletteIndex] || "bg-sunny";
}
