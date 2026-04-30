import { toOfflineMission } from "./api/missions";
import type { MissionProgressResponse, MissionResponse } from "./api/missions";
import type {
  ChildProfile,
  DailyMission,
  OfflineMission,
  ProgressStats,
} from "./types";

const CONTEXT_LABELS = {
  mealtime: "用餐時間",
  bedtime: "睡前時光",
  playtime: "遊戲時間",
  outdoor: "戶外活動",
  shopping: "購物時間",
  general: "日常對話",
} as const;

const TIME_LABELS = {
  morning: "早上",
  afternoon: "下午",
  evening: "晚上",
} as const;

const LEARNING_STYLE_LABELS = {
  visual: "視覺型",
  auditory: "聽覺型",
  kinesthetic: "動作型",
  mixed: "混合型",
} as const;

const INTEREST_WORD_BANK: Record<string, string[]> = {
  animals: ["貓", "狗", "蝴蝶", "雀仔"],
  food: ["蘋果", "牛奶", "香蕉", "麵包"],
  colors: ["紅色", "藍色", "綠色", "黃色"],
  nature: ["樹", "花", "月亮", "太陽"],
  family: ["媽媽", "爸爸", "姐姐", "弟弟"],
  transportation: ["巴士", "小巴", "火車", "車"],
  "body parts": ["手", "腳", "眼睛", "耳仔"],
  places: ["公園", "屋企", "學校", "超市"],
  actions: ["跳", "跑", "拍手", "唱歌"],
  numbers: ["一", "二", "三", "四"],
  shapes: ["圓形", "星星", "三角形", "正方形"],
  clothing: ["鞋", "帽", "衫", "褲"],
  space: ["月亮", "星星", "火箭", "太空人"],
  vehicles: ["巴士", "車", "火車", "船"],
};

const TIME_CONTEXT_ORDER: Record<
  ChildProfile["preferredTimeOfDay"],
  Array<OfflineMission["context"]>
> = {
  morning: ["mealtime", "outdoor", "general"],
  afternoon: ["playtime", "shopping", "outdoor"],
  evening: ["bedtime", "mealtime", "general"],
};

const STYLE_CONTEXTS: Record<
  ChildProfile["learningStyle"],
  Array<OfflineMission["context"]>
> = {
  visual: ["shopping", "outdoor", "general"],
  auditory: ["bedtime", "general", "mealtime"],
  kinesthetic: ["playtime", "outdoor", "shopping"],
  mixed: ["mealtime", "playtime", "bedtime"],
};

function normalizeKey(value?: string | null): string {
  return (value ?? "").trim().toLowerCase();
}

function uniqueValues(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function isDisplayWord(value?: string | null): value is string {
  if (!value) {
    return false;
  }

  const candidate = value.trim();
  return (
    candidate.length > 0 &&
    candidate.length <= 18 &&
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      candidate,
    )
  );
}

function getGoalRemaining(stats: ProgressStats, profile: ChildProfile): number {
  return Math.max(profile.dailyGoal - profile.todayProgress, 0);
}

function getPreferredContexts(
  profile: ChildProfile,
): Array<OfflineMission["context"]> {
  return uniqueValues([
    ...TIME_CONTEXT_ORDER[profile.preferredTimeOfDay],
    ...STYLE_CONTEXTS[profile.learningStyle],
    "general",
  ]) as Array<OfflineMission["context"]>;
}

function getInterestWords(profile: ChildProfile): string[] {
  return uniqueValues(
    profile.interests.flatMap((interest) => {
      const key = normalizeKey(interest);
      return INTEREST_WORD_BANK[key] ?? [interest];
    }),
  );
}

function buildFocusWords(
  profile: ChildProfile,
  apiMissions: MissionResponse[],
): string[] {
  const apiWords = apiMissions.flatMap((mission) =>
    mission.target_words.filter(isDisplayWord),
  );

  return uniqueValues([
    ...apiWords,
    ...getInterestWords(profile),
    "日常用品",
    "動作",
    "顏色",
  ]);
}

function resolveTargetWords(
  sourceWords: string[],
  fallbackWords: string[],
  count: number = 3,
): string[] {
  const resolved = uniqueValues([
    ...sourceWords.filter(isDisplayWord),
    ...fallbackWords.filter(isDisplayWord),
  ]);

  return resolved.slice(0, count);
}

function sliceFallbackWords(
  fallbackWords: string[],
  startIndex: number,
  count: number,
): string[] {
  const words =
    fallbackWords.length > 0 ? fallbackWords : ["詞語", "顏色", "動作"];
  const result: string[] = [];

  for (let offset = 0; offset < count; offset += 1) {
    result.push(words[(startIndex + offset) % words.length]);
  }

  return uniqueValues(result);
}

function getContextLabel(context: OfflineMission["context"]): string {
  return CONTEXT_LABELS[context] ?? CONTEXT_LABELS.general;
}

function getLearningAction(profile: ChildProfile, leadWord: string): string {
  switch (profile.learningStyle) {
    case "visual":
      return `請 ${profile.name} 先指出「${leadWord}」再描述顏色或外形`;
    case "auditory":
      return `請 ${profile.name} 聽你講一次，然後跟讀「${leadWord}」兩次`;
    case "kinesthetic":
      return `請 ${profile.name} 一邊做動作，一邊講出「${leadWord}」`;
    default:
      return `先看一看、再講一講，最後配一個動作去記住「${leadWord}」`;
  }
}

function buildDailyContext(
  profile: ChildProfile,
  stats: ProgressStats,
  context: OfflineMission["context"],
  leadWord: string,
): string {
  const goalRemaining = getGoalRemaining(stats, profile);
  const goalLine =
    goalRemaining > 0
      ? `今日仲差 ${goalRemaining} 個詞語達標。`
      : "今日目標已完成，適合用輕鬆方式鞏固。";

  return `${goalLine}${getLearningAction(profile, leadWord)}，並在${getContextLabel(
    context,
  )}重複使用。`;
}

function buildConversationPrompts(
  profile: ChildProfile,
  context: OfflineMission["context"],
  targetWords: string[],
): string[] {
  const [firstWord = "詞語", secondWord = firstWord, thirdWord = secondWord] =
    targetWords;
  const bilingualHint =
    profile.languagePreference === "bilingual"
      ? "可以先講廣東話，再一起試英文。"
      : "用自然對話反覆講幾次就足夠。";

  return [
    `指住「${firstWord}」問 ${profile.name}：呢個係乜嘢？`,
    `${getContextLabel(context)}時，再追問「${secondWord}」有咩特徵或者用途？`,
    `最後請 ${profile.name} 自己用「${thirdWord}」講一句短句。${bilingualHint}`,
  ];
}

function missionText(mission: MissionResponse): string {
  return normalizeKey(
    [
      mission.title,
      mission.description,
      mission.context,
      mission.target_words.join(" "),
      mission.conversation_prompts.join(" "),
    ].join(" "),
  );
}

function scoreMission(
  mission: MissionResponse,
  profile: ChildProfile,
  focusWords: string[],
  completed: boolean,
): number {
  const preferredContexts = getPreferredContexts(profile);
  const interestWords = getInterestWords(profile).map(normalizeKey);
  const missionBlob = missionText(mission);

  let score = 0;

  if (preferredContexts.includes(mission.context)) {
    score += 4;
  }

  if (STYLE_CONTEXTS[profile.learningStyle].includes(mission.context)) {
    score += 3;
  }

  if (
    focusWords.some((word) => missionBlob.includes(normalizeKey(word))) ||
    interestWords.some((word) => missionBlob.includes(word))
  ) {
    score += 2;
  }

  if (!completed) {
    score += 2;
  }

  if (profile.attentionSpan <= 10 && mission.context !== "bedtime") {
    score += 1;
  }

  return score;
}

export function getPreferredTimeLabel(profile: ChildProfile): string {
  return TIME_LABELS[profile.preferredTimeOfDay] ?? TIME_LABELS.morning;
}

export function getLearningStyleLabel(profile: ChildProfile): string {
  return (
    LEARNING_STYLE_LABELS[profile.learningStyle] ?? LEARNING_STYLE_LABELS.mixed
  );
}

export function buildPersonalizedDailyMissions({
  profile,
  stats,
  apiMissions = [],
  progress = [],
}: {
  profile: ChildProfile;
  stats: ProgressStats;
  apiMissions?: MissionResponse[];
  progress?: MissionProgressResponse[];
}): DailyMission[] {
  const focusWords = buildFocusWords(profile, apiMissions);
  const progressMap = new Map(progress.map((item) => [item.mission_id, item]));
  const rankedMissions = [...apiMissions].sort(
    (left, right) =>
      scoreMission(
        right,
        profile,
        focusWords,
        progressMap.get(right.id)?.completed ?? false,
      ) -
      scoreMission(
        left,
        profile,
        focusWords,
        progressMap.get(left.id)?.completed ?? false,
      ),
  );

  if (rankedMissions.length > 0) {
    return rankedMissions.slice(0, 3).map((mission, index) => {
      const targetWord =
        resolveTargetWords(
          mission.target_words,
          sliceFallbackWords(focusWords, index, 2),
          1,
        )[0] ??
        focusWords[0] ??
        "詞語";

      return {
        id: mission.id,
        title: mission.title,
        description: `${mission.description} 這項安排會配合 ${profile.name} 在${getPreferredTimeLabel(
          profile,
        )}的專注節奏。`,
        targetWord,
        completed: progressMap.get(mission.id)?.completed ?? false,
        context: buildDailyContext(profile, stats, mission.context, targetWord),
      };
    });
  }

  return getPreferredContexts(profile)
    .slice(0, 3)
    .map((context, index) => {
      const targetWords = sliceFallbackWords(focusWords, index, 3);
      const leadWord = targetWords[0] ?? "詞語";

      return {
        id: `local-daily-${context}-${index}`,
        title: `${getContextLabel(context)}任務`,
        description: `圍繞 ${profile.name} 感興趣的主題，用 ${targetWords.join("、")} 做即時複習。`,
        targetWord: leadWord,
        completed: false,
        context: buildDailyContext(profile, stats, context, leadWord),
      };
    });
}

export function buildPersonalizedOfflineMissions({
  profile,
  stats,
  apiMissions = [],
  progress = [],
}: {
  profile: ChildProfile;
  stats: ProgressStats;
  apiMissions?: MissionResponse[];
  progress?: MissionProgressResponse[];
}): OfflineMission[] {
  const focusWords = buildFocusWords(profile, apiMissions);
  const progressMap = new Map(progress.map((item) => [item.mission_id, item]));
  const rankedMissions = [...apiMissions].sort(
    (left, right) =>
      scoreMission(
        right,
        profile,
        focusWords,
        progressMap.get(right.id)?.completed ?? false,
      ) -
      scoreMission(
        left,
        profile,
        focusWords,
        progressMap.get(left.id)?.completed ?? false,
      ),
  );

  if (rankedMissions.length > 0) {
    return rankedMissions.slice(0, 4).map((mission, index) => {
      const baseMission = toOfflineMission(
        mission,
        progressMap.get(mission.id),
      );
      const targetWords = resolveTargetWords(
        mission.target_words,
        sliceFallbackWords(focusWords, index, 3),
      );

      return {
        ...baseMission,
        targetWords,
        description: `${mission.description} 這項安排特別配合 ${profile.name} 的${getLearningStyleLabel(
          profile,
        )}學習方式。`,
        conversationPrompts:
          mission.conversation_prompts.length > 0
            ? mission.conversation_prompts
            : buildConversationPrompts(profile, mission.context, targetWords),
      };
    });
  }

  return getPreferredContexts(profile)
    .slice(0, 4)
    .map((context, index) => {
      const targetWords = sliceFallbackWords(focusWords, index, 3);

      return {
        id: `local-offline-${context}-${index}`,
        title: `${getContextLabel(context)}練習`,
        description: `配合 ${profile.name} 的興趣和今日進度，將 ${targetWords.join("、")} 放入真實生活對話。`,
        targetWords,
        context,
        completed: getGoalRemaining(stats, profile) === 0 && index === 0,
        conversationPrompts: buildConversationPrompts(
          profile,
          context,
          targetWords,
        ),
      };
    });
}
