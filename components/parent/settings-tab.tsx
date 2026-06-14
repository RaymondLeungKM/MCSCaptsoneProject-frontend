"use client";

import { useEffect, useState } from "react";
import {
  Brain,
  User,
  Users,
  Target,
  Bell,
  Shield,
  Palette,
  Save,
  Settings,
  Clock,
  Globe2,
  Loader2,
  Lock,
  ShieldCheck,
  Trash2,
  SlidersHorizontal,
  BellRing,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Lightbulb,
} from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { updateChild, toChildProfile } from "@/lib/api/children";
import {
  getParentalControls,
  updateParentalControls,
} from "@/lib/api/parent-dashboard";
import { getReviewQueue } from "@/lib/api/phase8";
import { getCategories } from "@/lib/api/vocabulary";
import { getAuthToken } from "@/lib/api/client";
import {
  DEFAULT_REVISION_QUESTION_COUNT,
  getRevisionQuestionCount,
  setRevisionQuestionCount,
} from "@/lib/revision-preferences";
import type {
  ChildProfile,
  LanguagePreference,
  ParentalControl,
} from "@/lib/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ParentalControlsSettings } from "./parental-controls";
import { cn } from "@/lib/utils";
import {
  clearStoredParentPin,
  getStoredParentPin,
  setStoredParentPin,
} from "@/components/modals/parent-pin-modal";

const MONTH_OPTIONS = [
  { value: "1", label: "1 月" },
  { value: "2", label: "2 月" },
  { value: "3", label: "3 月" },
  { value: "4", label: "4 月" },
  { value: "5", label: "5 月" },
  { value: "6", label: "6 月" },
  { value: "7", label: "7 月" },
  { value: "8", label: "8 月" },
  { value: "9", label: "9 月" },
  { value: "10", label: "10 月" },
  { value: "11", label: "11 月" },
  { value: "12", label: "12 月" },
];

const LEARNING_STYLE_OPTIONS: Array<{
  value: ChildProfile["learningStyle"];
  label: string;
  emoji: string;
  description: string;
}> = [
  {
    value: "visual",
    label: "視覺型",
    emoji: "👀",
    description: "偏好圖片、顏色提示和視覺配對。",
  },
  {
    value: "auditory",
    label: "聽覺型",
    emoji: "👂",
    description: "偏好聽故事、跟讀和聲音提示。",
  },
  {
    value: "kinesthetic",
    label: "動覺型",
    emoji: "🤸",
    description: "偏好動作、實物和互動遊戲。",
  },
  {
    value: "mixed",
    label: "混合型",
    emoji: "🎨",
    description: "交替使用多種學習方式最有效。",
  },
];

const PREFERRED_TIME_OPTIONS: Array<{
  value: ChildProfile["preferredTimeOfDay"];
  label: string;
  description: string;
}> = [
  {
    value: "morning",
    label: "早上",
    description: "適合精神剛開始集中時做一段清爽短練習。",
  },
  {
    value: "afternoon",
    label: "下午",
    description: "適合午睡後或活動間安排互動式詞彙練習。",
  },
  {
    value: "evening",
    label: "晚上",
    description: "適合晚餐後或睡前做輕鬆複習與對話練習。",
  },
];

const LANGUAGE_PREFERENCE_OPTIONS: Array<{
  value: LanguagePreference;
  label: string;
  description: string;
}> = [
  {
    value: "cantonese",
    label: "粵語",
    description: "以粵語為主，貼近孩子平日的生活語境。",
  },
  // {
  //   value: "english",
  //   label: "英文",
  //   description: "以英文為主，幫助孩子集中建立英文詞彙。",
  // },
  // {
  //   value: "bilingual",
  //   label: "雙語",
  //   description: "同時呈現廣東話與英文，方便對照和轉換。",
  // },
];

const MIN_ATTENTION_SPAN = 5;
const MAX_ATTENTION_SPAN = 30;
const DEFAULT_ATTENTION_SPAN = 15;

function normalizeAttentionSpan(value?: number | null) {
  return Math.min(
    Math.max(value ?? DEFAULT_ATTENTION_SPAN, MIN_ATTENTION_SPAN),
    MAX_ATTENTION_SPAN,
  );
}

interface SettingsTabProps {
  profile: ChildProfile;
  onProfileUpdated?: (profile: ChildProfile) => void;
}

interface InterestOption {
  id: string;
  label: string;
  icon: string;
}

const FALLBACK_INTEREST_OPTIONS: InterestOption[] = [
  { id: "Animals", label: "動物", icon: "🦁" },
  { id: "Food", label: "食物", icon: "🍎" },
  { id: "Colors", label: "顏色", icon: "🎨" },
  { id: "Nature", label: "大自然", icon: "🌳" },
  { id: "Vehicles", label: "交通工具", icon: "🚗" },
  { id: "Family", label: "家庭", icon: "👨‍👩‍👧" },
  { id: "Space", label: "太空", icon: "🚀" },
  { id: "Music", label: "音樂", icon: "🎵" },
];

function buildDefaultParentalControls(childId: string): ParentalControl {
  return {
    id: `default-${childId}`,
    child_id: childId,
    enabled_categories: [],
    disabled_categories: [],
    max_difficulty: "hard",
    min_difficulty: "easy",
    daily_screen_time_limit: null,
    screen_time_warning_threshold: 20,
    tts_voice: "default",
    tts_speech_rate: 0.8,
    enable_bilingual_mode: false,
    show_jyutping: true,
    game_difficulty_multiplier: 1,
    enable_time_limits: false,
    safe_mode_enabled: false,
    require_parent_unlock: false,
    daily_reminder_enabled: true,
    daily_reminder_time: "18:00",
    bedtime_story_reminder: true,
    weekly_report_enabled: true,
    achievement_notifications: true,
  };
}

function mergeInterestOptions(
  baseOptions: InterestOption[],
  selectedInterests: string[],
): InterestOption[] {
  const optionMap = new Map(baseOptions.map((option) => [option.id, option]));

  for (const interest of selectedInterests) {
    if (!optionMap.has(interest)) {
      optionMap.set(interest, {
        id: interest,
        label: interest,
        icon: "✨",
      });
    }
  }

  return Array.from(optionMap.values());
}

export function SettingsTab({ profile, onProfileUpdated }: SettingsTabProps) {
  const { toast } = useToast();
  const isMockData =
    !profile.id ||
    profile.id === "1" ||
    profile.id === "mock-child-id" ||
    profile.id.length < 10;

  const [name, setName] = useState(profile.name);
  const [age, setAge] = useState(profile.age);
  const [birthMonth, setBirthMonth] = useState<number | null>(
    profile.birthMonth ?? null,
  );
  const [dailyGoal, setDailyGoal] = useState(profile.dailyGoal);
  const [attentionSpan, setAttentionSpan] = useState(
    normalizeAttentionSpan(profile.attentionSpan),
  );
  const [learningStyle, setLearningStyle] = useState<
    ChildProfile["learningStyle"]
  >(profile.learningStyle);
  const [languagePreference, setLanguagePreference] =
    useState<LanguagePreference>(profile.languagePreference ?? "cantonese");
  const [preferredTimeOfDay, setPreferredTimeOfDay] = useState<
    ChildProfile["preferredTimeOfDay"]
  >(profile.preferredTimeOfDay);
  const [interests, setInterests] = useState(profile.interests);
  const [notifications, setNotifications] = useState(true);
  const [reminderTime, setReminderTime] = useState("18:00");
  const [screenTimeLimit, setScreenTimeLimit] = useState(30);
  const [parentalControls, setParentalControls] = useState(true);
  const [communitySharing, setCommunitySharing] = useState(
    profile.communityEnabled ?? false,
  );
  const [storedParentPin, setStoredParentPinState] = useState<string | null>(
    null,
  );
  const [pinDraft, setPinDraft] = useState("");
  const [confirmPinDraft, setConfirmPinDraft] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [editingPin, setEditingPin] = useState(false);
  const [dueCards, setDueCards] = useState<number | null>(null);
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachSaving, setCoachSaving] = useState(false);
  const [revisionQuestionCount, setRevisionQuestionCountState] = useState(
    DEFAULT_REVISION_QUESTION_COUNT,
  );
  const [reminderWindow, setReminderWindow] = useState("18:00");

  const handleCommunitySharingChange = async (enabled: boolean) => {
    setCommunitySharing(enabled);
    if (!isMockData) {
      try {
        await updateChild(profile.id, { community_sharing_enabled: enabled });
      } catch {
        // Revert on failure
        setCommunitySharing(!enabled);
      }
    }
  };
  const [interestOptions, setInterestOptions] = useState<InterestOption[]>(
    mergeInterestOptions(FALLBACK_INTEREST_OPTIONS, profile.interests),
  );
  const [settingsLoading, setSettingsLoading] = useState(!isMockData);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(profile.name);
    setAge(profile.age);
    setBirthMonth(profile.birthMonth ?? null);
    setDailyGoal(profile.dailyGoal);
    setAttentionSpan(normalizeAttentionSpan(profile.attentionSpan));
    setLearningStyle(profile.learningStyle);
    setLanguagePreference(profile.languagePreference ?? "cantonese");
    setPreferredTimeOfDay(profile.preferredTimeOfDay);
    setInterests(profile.interests);
    setInterestOptions((prev) => mergeInterestOptions(prev, profile.interests));
  }, [profile]);

  useEffect(() => {
    setStoredParentPinState(getStoredParentPin());
  }, []);

  useEffect(() => {
    if (isMockData) {
      setSettingsLoading(false);
      return;
    }

    let cancelled = false;

    async function loadSettings() {
      setSettingsLoading(true);

      try {
        const [controls, categories] = await Promise.all([
          getParentalControls(profile.id),
          getCategories(profile.id),
        ]);

        if (cancelled) {
          return;
        }

        setNotifications(controls.daily_reminder_enabled);
        setReminderTime(controls.daily_reminder_time || "18:00");
        setParentalControls(controls.enable_time_limits);
        setScreenTimeLimit(controls.daily_screen_time_limit ?? 30);

        if (categories.length > 0) {
          const mappedOptions = categories.map((category) => ({
            id: category.name,
            label: category.name_cantonese || category.name,
            icon: category.icon || "📚",
          }));

          setInterestOptions(
            mergeInterestOptions(mappedOptions, profile.interests),
          );
        }
      } catch (error) {
        console.error("Failed to load settings tab data:", error);
        if (!cancelled) {
          const defaults = buildDefaultParentalControls(profile.id);
          setNotifications(defaults.daily_reminder_enabled);
          setReminderTime(defaults.daily_reminder_time);
          setParentalControls(defaults.enable_time_limits);
          setScreenTimeLimit(defaults.daily_screen_time_limit ?? 30);
          toast({
            title: "載入部分設定失敗",
            description: "已使用預設值，你仍可修改並重新儲存。",
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) {
          setSettingsLoading(false);
        }
      }
    }

    void loadSettings();

    return () => {
      cancelled = true;
    };
  }, [isMockData, profile.id, profile.interests, toast]);

  useEffect(() => {
    setRevisionQuestionCountState(getRevisionQuestionCount(profile.id));
  }, [profile.id]);

  useEffect(() => {
    if (!getAuthToken()) {
      setDueCards(0);
      return;
    }

    let cancelled = false;

    void (async () => {
      setCoachLoading(true);
      try {
        const [queue, controls] = await Promise.all([
          getReviewQueue(profile.id, 30, 8),
          getParentalControls(profile.id),
        ]);

        if (cancelled) {
          return;
        }

        setDueCards(
          queue.total_due ?? queue.cards.filter((card) => !card.is_new).length,
        );
        setReminderWindow(controls.daily_reminder_time || "18:00");
      } catch {
        if (!cancelled) {
          setDueCards(0);
        }
      } finally {
        if (!cancelled) {
          setCoachLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [profile.id]);

  const toggleInterest = (interestId: string) => {
    setInterests((prev) =>
      prev.includes(interestId)
        ? prev.filter((interest) => interest !== interestId)
        : [...prev, interestId],
    );
  };

  const handleSaveCoachPreferences = async () => {
    setRevisionQuestionCount(profile.id, revisionQuestionCount);

    if (!getAuthToken()) {
      return;
    }

    setCoachSaving(true);
    try {
      await updateParentalControls(profile.id, {
        daily_reminder_time: reminderWindow,
      });
    } finally {
      setCoachSaving(false);
    }
  };

  const handleSave = async () => {
    if (isMockData) {
      onProfileUpdated?.({
        ...profile,
        name: name.trim() || profile.name,
        age,
        birthMonth,
        dailyGoal,
        attentionSpan,
        interests,
        learningStyle,
        languagePreference,
        preferredTimeOfDay,
        communityEnabled: communitySharing,
      });

      toast({
        title: "示範模式",
        description: "設定已暫存在此頁面，但未寫入後端。",
      });
      return;
    }

    setSaving(true);

    try {
      const [updatedChild, updatedControls] = await Promise.all([
        updateChild(profile.id, {
          name: name.trim(),
          age,
          birth_month: birthMonth,
          daily_goal: dailyGoal,
          learning_style: learningStyle,
          attention_span: attentionSpan,
          language_preference: languagePreference,
          preferred_time_of_day: preferredTimeOfDay,
          interests,
        }),
        updateParentalControls(profile.id, {
          daily_reminder_enabled: notifications,
          daily_reminder_time: reminderTime,
          enable_time_limits: parentalControls,
          daily_screen_time_limit: parentalControls ? screenTimeLimit : null,
        }),
      ]);

      const nextProfile = toChildProfile(updatedChild);

      setName(nextProfile.name);
      setAge(nextProfile.age);
      setBirthMonth(nextProfile.birthMonth ?? null);
      setDailyGoal(nextProfile.dailyGoal);
      setAttentionSpan(normalizeAttentionSpan(nextProfile.attentionSpan));
      setLearningStyle(nextProfile.learningStyle);
      setLanguagePreference(nextProfile.languagePreference ?? "cantonese");
      setPreferredTimeOfDay(nextProfile.preferredTimeOfDay);
      setInterests(nextProfile.interests);
      setInterestOptions((prev) =>
        mergeInterestOptions(prev, nextProfile.interests),
      );

      setNotifications(updatedControls.daily_reminder_enabled);
      setReminderTime(updatedControls.daily_reminder_time || "18:00");
      setParentalControls(updatedControls.enable_time_limits);
      setScreenTimeLimit(updatedControls.daily_screen_time_limit ?? 30);

      onProfileUpdated?.({
        ...nextProfile,
        communityEnabled: communitySharing,
      });

      toast({
        title: "設定已儲存",
        description: "家長中心設定已成功更新。",
      });
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast({
        title: "儲存失敗",
        description: "未能更新設定，請稍後再試。",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const resetPinForm = () => {
    setPinDraft("");
    setConfirmPinDraft("");
    setPinError(null);
    setEditingPin(false);
  };

  const handleSaveParentPin = () => {
    const normalizedPin = pinDraft.trim();

    if (!/^\d{4,6}$/.test(normalizedPin)) {
      setPinError("請設定 4 至 6 位數字 PIN。");
      return;
    }

    if (normalizedPin !== confirmPinDraft.trim()) {
      setPinError("兩次輸入的 PIN 不一致。");
      return;
    }

    setStoredParentPin(normalizedPin);
    setStoredParentPinState(normalizedPin);
    resetPinForm();
    toast({
      title: "家長 PIN 已更新",
      description: "之後切換到家長模式時會使用這組 PIN。",
    });
  };

  const handleRemoveParentPin = () => {
    clearStoredParentPin();
    setStoredParentPinState(null);
    resetPinForm();
    toast({
      title: "已移除家長 PIN",
      description: "這部裝置上的家長模式鎖已清除。",
    });
  };

  return (
    <div className="space-y-8 w-full p-4 md:p-6 bg-white/50 backdrop-blur-sm rounded-4xl">
      <div className="text-center space-y-3 mb-4">
        <div className="inline-flex items-center justify-center p-3 bg-linear-to-br from-slate-100 to-gray-200 rounded-2xl mb-2 shadow-sm">
          <Settings className="w-8 h-8 text-slate-600 animate-spin-slow" />
        </div>
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">
          {profile.name} 的設定
        </h2>
        <p className="text-slate-500 font-medium">
          打造最適合小朋友的個人化學習體驗
        </p>
      </div>

      {settingsLoading && !isMockData && (
        <div className="flex items-center justify-center gap-3 rounded-3xl bg-white px-4 py-5 text-slate-500 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin" />
          正在載入設定...
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-white rounded-[28px] h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-slate-700 text-xl">
              <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
                <User className="w-5 h-5" />
              </div>
              小朋友檔案
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-600 font-bold">
                名字
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="輸入小朋友名字"
                className="rounded-xl border-slate-200 focus:ring-blue-200 h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age" className="text-slate-600 font-bold">
                年齡
              </Label>
              <Input
                id="age"
                type="number"
                min={2}
                max={7}
                value={age}
                onChange={(event) => setAge(Number(event.target.value))}
                className="rounded-xl border-slate-200 focus:ring-blue-200 h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birth-month" className="text-slate-600 font-bold">
                出生月份（選填）
              </Label>
              <div className="relative">
                <select
                  id="birth-month"
                  value={birthMonth?.toString() ?? ""}
                  onChange={(event) =>
                    setBirthMonth(
                      event.target.value ? Number(event.target.value) : null,
                    )
                  }
                  className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">未設定</option>
                  {MONTH_OPTIONS.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                  ▼
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white rounded-[28px] h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-slate-700 text-xl">
              <div className="p-2 bg-green-100 rounded-xl text-green-600">
                <Target className="w-5 h-5" />
              </div>
              每日目標
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-slate-600 font-bold">每日目標詞彙</Label>
                <span className="font-black text-green-600 text-lg bg-green-50 px-3 py-1 rounded-lg">
                  {dailyGoal} 個
                </span>
              </div>
              <Slider
                value={[dailyGoal]}
                onValueChange={([value]) => setDailyGoal(value)}
                min={1}
                max={10}
                step={1}
                className="py-4"
              />
              <p className="text-xs text-slate-400 bg-slate-50 p-3 rounded-xl leading-relaxed">
                💡 建議幼兒每天學習 3-5 個新詞彙，以保持學習興趣並加深記憶。
              </p>
            </div>

            <div className="border-t border-slate-100 pt-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 rounded-xl text-amber-600 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <Label className="text-slate-600 font-bold">專注時間</Label>
                    <span className="font-black text-amber-600 text-lg bg-amber-50 px-3 py-1 rounded-lg">
                      {attentionSpan} 分鐘
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    系統會盡量把活動長度控制在這個範圍內，減少疲勞並保持投入感。
                  </p>
                </div>
              </div>

              <Slider
                value={[attentionSpan]}
                onValueChange={([value]) => setAttentionSpan(value)}
                min={MIN_ATTENTION_SPAN}
                max={MAX_ATTENTION_SPAN}
                step={1}
                disabled={settingsLoading}
                className="py-4"
              />
              <div className="flex items-center justify-between text-xs font-medium text-slate-400">
                <span>{MIN_ATTENTION_SPAN} 分鐘</span>
                <span>{MAX_ATTENTION_SPAN} 分鐘</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white rounded-[28px] h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-slate-700 text-xl">
              <div className="p-2 bg-purple-100 rounded-xl text-purple-600">
                <Brain className="w-5 h-5" />
              </div>
              學習偏好
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="text-2xl leading-none">👀</div>
                <div>
                  <Label className="text-slate-600 font-bold">學習風格</Label>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    選擇目前最貼近孩子的學習偏好。
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {LEARNING_STYLE_OPTIONS.map((option) => {
                  const isSelected = learningStyle === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      disabled={settingsLoading}
                      onClick={() => setLearningStyle(option.value)}
                      className={cn(
                        "rounded-2xl border p-3 text-left transition-all",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-200",
                        settingsLoading && "cursor-not-allowed opacity-60",
                        isSelected
                          ? "border-violet-300 bg-violet-50 shadow-sm"
                          : "border-slate-200 bg-slate-50 hover:border-violet-200 hover:bg-violet-50/40",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div className="text-xl leading-none">
                          {option.emoji}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">
                            {option.label}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-5 space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-sky-100 rounded-xl text-sky-600 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <Label className="text-slate-600 font-bold text-sm">
                    偏好練習時段
                  </Label>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    影響短練習建議
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {PREFERRED_TIME_OPTIONS.map((option) => {
                  const isSelected = preferredTimeOfDay === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      disabled={settingsLoading}
                      onClick={() => setPreferredTimeOfDay(option.value)}
                      className={cn(
                        "rounded-2xl border p-3 text-left text-sm transition-all",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200",
                        settingsLoading && "cursor-not-allowed opacity-60",
                        isSelected
                          ? "border-sky-300 bg-sky-50 shadow-sm"
                          : "border-slate-200 bg-slate-50 hover:border-sky-200 hover:bg-sky-50/40",
                      )}
                    >
                      <p className="font-bold text-slate-800">{option.label}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-5 space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-cyan-100 rounded-xl text-cyan-600 shrink-0">
                  <Globe2 className="w-5 h-5" />
                </div>
                <div>
                  <Label className="text-slate-600 font-bold text-sm">
                    語言模式
                  </Label>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    孩子頁面顯示語言
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {LANGUAGE_PREFERENCE_OPTIONS.map((option) => {
                  const isSelected = languagePreference === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      disabled={settingsLoading}
                      onClick={() => setLanguagePreference(option.value)}
                      className={cn(
                        "rounded-2xl border p-3 text-left text-sm transition-all",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200",
                        settingsLoading && "cursor-not-allowed opacity-60",
                        isSelected
                          ? "border-cyan-300 bg-cyan-50 shadow-sm"
                          : "border-slate-200 bg-slate-50 hover:border-cyan-200 hover:bg-cyan-50/40",
                      )}
                    >
                      <p className="font-bold text-slate-800">{option.label}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm bg-white rounded-[28px]">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-slate-700 text-xl">
            <div className="p-2 bg-yellow-100 rounded-xl text-yellow-600">
              <Palette className="w-5 h-5" />
            </div>
            興趣偏好
          </CardTitle>
          <CardDescription className="text-slate-400 pl-12">
            選擇小朋友喜歡的主題，我們會優先推薦相關內容。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {interestOptions.map((interest) => {
              const isSelected = interests.includes(interest.id);

              return (
                <button
                  key={interest.id}
                  type="button"
                  onClick={() => toggleInterest(interest.id)}
                  className={cn(
                    "px-4 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 border-2",
                    isSelected
                      ? "bg-yellow-100 text-yellow-800 border-yellow-200 shadow-sm transform scale-105"
                      : "bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100",
                  )}
                >
                  <span className="text-base">{interest.icon}</span>
                  {interest.label}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-none shadow-sm bg-white rounded-[28px] h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-slate-700 text-xl">
              <div className="p-2 bg-purple-100 rounded-xl text-purple-600">
                <Bell className="w-5 h-5" />
              </div>
              通知提醒
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
              <div>
                <p className="font-bold text-slate-700">每日練習提醒</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  定時接收通知，養成好習慣
                </p>
              </div>
              <Switch
                checked={notifications}
                onCheckedChange={setNotifications}
                disabled={settingsLoading}
              />
            </div>

            {notifications && (
              <div className="space-y-2 px-1">
                <Label
                  htmlFor="reminder-time"
                  className="text-slate-600 font-bold"
                >
                  提醒時間
                </Label>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <Input
                    id="reminder-time"
                    type="time"
                    value={reminderTime}
                    onChange={(event) => setReminderTime(event.target.value)}
                    disabled={settingsLoading}
                    className="rounded-xl border-slate-200 h-11 w-full font-medium text-slate-700"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white rounded-[28px] h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-slate-700 text-xl">
              <div className="p-2 bg-red-100 rounded-xl text-red-600">
                <Shield className="w-5 h-5" />
              </div>
              家長監護
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
              <div>
                <p className="font-bold text-slate-700">螢幕時間限制</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  限制每日使用 App 的時間
                </p>
              </div>
              <Switch
                checked={parentalControls}
                onCheckedChange={setParentalControls}
                disabled={settingsLoading}
              />
            </div>

            {parentalControls && (
              <div className="space-y-4 px-1">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-600 font-bold">每日上限</Label>
                  <span className="font-black text-red-600 text-lg bg-red-50 px-3 py-1 rounded-lg">
                    {screenTimeLimit} 分鐘
                  </span>
                </div>
                <Slider
                  value={[screenTimeLimit]}
                  onValueChange={([value]) => setScreenTimeLimit(value)}
                  min={10}
                  max={60}
                  step={5}
                  disabled={settingsLoading}
                  className="py-4"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm bg-white rounded-[28px]">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-slate-700 text-xl">
            <div className="p-2 bg-amber-100 rounded-xl text-amber-600">
              <Lock className="w-5 h-5" />
            </div>
            家長 PIN 設定
          </CardTitle>
          <CardDescription className="text-slate-400 pl-12">
            切換到家長模式時需要輸入 PIN，避免小朋友誤進管理頁面。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between rounded-2xl bg-amber-50 px-4 py-4">
            <div className="space-y-1">
              <p className="font-bold text-slate-700">目前狀態</p>
              <p className="text-xs text-slate-500">
                {storedParentPin
                  ? "這部裝置已設定家長 PIN。"
                  : "尚未設定家長 PIN，可在此新增。"}
              </p>
            </div>
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-black",
                storedParentPin
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-500",
              )}
            >
              {storedParentPin ? (
                <ShieldCheck className="h-4 w-4" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
              {storedParentPin ? "已啟用" : "未設定"}
            </span>
          </div>

          {editingPin ? (
            <div className="grid gap-4 rounded-3xl border border-slate-100 bg-slate-50/80 p-4">
              <div className="space-y-2">
                <Label
                  htmlFor="parent-mode-pin"
                  className="text-slate-600 font-bold"
                >
                  {storedParentPin ? "新 PIN" : "設定 PIN"}
                </Label>
                <Input
                  id="parent-mode-pin"
                  type="password"
                  inputMode="numeric"
                  placeholder="輸入 4 至 6 位數字"
                  value={pinDraft}
                  onChange={(event) => {
                    setPinDraft(event.target.value);
                    setPinError(null);
                  }}
                  className="h-11 rounded-xl border-slate-200 text-center tracking-[0.35em]"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="parent-mode-pin-confirm"
                  className="text-slate-600 font-bold"
                >
                  確認 PIN
                </Label>
                <Input
                  id="parent-mode-pin-confirm"
                  type="password"
                  inputMode="numeric"
                  placeholder="再次輸入 PIN"
                  value={confirmPinDraft}
                  onChange={(event) => {
                    setConfirmPinDraft(event.target.value);
                    setPinError(null);
                  }}
                  className="h-11 rounded-xl border-slate-200 text-center tracking-[0.35em]"
                />
              </div>

              {pinError && (
                <p className="text-sm font-medium text-rose-500">{pinError}</p>
              )}

              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  onClick={handleSaveParentPin}
                  className="rounded-full bg-slate-800 px-5 font-bold text-white hover:bg-slate-700"
                >
                  儲存 PIN
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetPinForm}
                  className="rounded-full px-5 font-bold"
                >
                  取消
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={() => setEditingPin(true)}
                className="rounded-full bg-amber-500 px-5 font-bold text-white hover:bg-amber-600"
              >
                {storedParentPin ? "更改 PIN" : "設定 PIN"}
              </Button>
              {storedParentPin && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRemoveParentPin}
                  className="rounded-full border-rose-200 px-5 font-bold text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  移除 PIN
                </Button>
              )}
            </div>
          )}

          <p className="text-xs leading-relaxed text-slate-500">
            PIN
            只會儲存在目前這部裝置上。若你常用平板或手機讓小朋友學習，建議在該裝置也設定同一組
            PIN。
          </p>
        </CardContent>
      </Card>

      {/* Community Sharing */}
      <Card className="border-none shadow-sm bg-white rounded-[28px]">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-slate-700 text-xl">
            <div className="p-2 bg-teal-100 rounded-xl text-teal-600">
              <Users className="w-5 h-5" />
            </div>
            社區詞彙分享
          </CardTitle>
          <CardDescription className="text-slate-400 text-xs pl-12">
            Community Vocabulary Sharing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
            <div>
              <p className="font-bold text-slate-700">分享至社區</p>
              <p className="text-xs text-slate-500 mt-0.5">
                將小朋友拍攝嘅詞彙圖片分享到社區（不會顯示個人資料）
              </p>
            </div>
            <Switch
              checked={communitySharing}
              onCheckedChange={handleCommunitySharingChange}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-4xl border-2 border-slate-100 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-black text-slate-700">
            <SlidersHorizontal className="h-5 w-5 text-indigo-500" />
            複習教練面板
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-3 md:grid-cols-3">
            <MiniMetric
              icon={<Calendar className="h-4 w-4 text-indigo-500" />}
              label="待複習卡"
              value={coachLoading ? "載入中..." : `${dueCards ?? 0} 張`}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-3 rounded-3xl bg-slate-50 p-4">
              <p className="text-sm font-black text-slate-700">偏好調節</p>
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                  Revision Questions
                </p>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((count) => (
                    <Button
                      key={count}
                      type="button"
                      size="sm"
                      variant={
                        revisionQuestionCount === count ? "default" : "outline"
                      }
                      className="rounded-full"
                      onClick={() => setRevisionQuestionCountState(count)}
                    >
                      {count} 題
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                  Reminder Window
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="time"
                    value={reminderWindow}
                    onChange={(event) => setReminderWindow(event.target.value)}
                    className="h-9 rounded-full border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700"
                  />
                </div>
              </div>

              <Button
                type="button"
                onClick={() => void handleSaveCoachPreferences()}
                disabled={coachSaving || !getAuthToken()}
                className="rounded-full"
              >
                {coachSaving ? "儲存中..." : "儲存複習偏好"}
              </Button>
            </div>

            <div className="space-y-3 rounded-3xl bg-linear-to-br from-amber-50 to-white p-4 ring-1 ring-amber-100">
              <p className="flex items-center gap-2 text-sm font-black text-slate-700">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                複習建議
              </p>
              <div className="rounded-2xl bg-white px-3 py-2 text-sm font-medium leading-6 text-slate-600">
                每日複習有助於鞏固記憶。建議在固定時間進行複習練習。
              </div>
              <div className="rounded-2xl bg-white px-3 py-2 text-sm font-medium leading-6 text-slate-600">
                分段完成複習更容易維持孩子的專注力。
              </div>
              <div className="rounded-2xl bg-white px-3 py-2 text-sm font-medium leading-6 text-slate-600">
                結合多感官提示（圖片、動作、實物）可提升複習效果。
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="sticky bottom-4 z-10 pt-4">
        <Button
          onClick={handleSave}
          disabled={saving || settingsLoading}
          className="w-full h-14 text-lg font-bold gap-2 rounded-full shadow-xl shadow-blue-200 bg-linear-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
          size="lg"
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {saving ? "儲存中..." : "儲存所有設定"}
        </Button>
      </div>
    </div>
  );
}

function MiniMetric({
  icon,
  label,
  value,
  className,
  labelClassName,
  valueClassName,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
}) {
  return (
    <div className={cn("rounded-3xl bg-slate-50 p-4", className)}>
      <div className="mb-3 inline-flex rounded-2xl bg-white p-2 shadow-sm">
        {icon}
      </div>
      <p
        className={cn(
          "text-xs font-bold uppercase tracking-[0.18em] text-slate-400",
          labelClassName,
        )}
      >
        {label}
      </p>
      <p
        className={cn("mt-1 text-lg font-black text-slate-800", valueClassName)}
      >
        {value}
      </p>
    </div>
  );
}
