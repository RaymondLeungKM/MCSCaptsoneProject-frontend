"use client";

import { useEffect, useState } from "react";
import {
  User,
  Users,
  Target,
  Bell,
  Shield,
  Palette,
  Save,
  Settings,
  Clock,
  Loader2,
} from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { updateChild, toChildProfile } from "@/lib/api/children";
import {
  getParentalControls,
  updateParentalControls,
} from "@/lib/api/parent-dashboard";
import { getCategories } from "@/lib/api/vocabulary";
import type { ChildProfile, ParentalControl } from "@/lib/types";
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
  const [dailyGoal, setDailyGoal] = useState(profile.dailyGoal);
  const [interests, setInterests] = useState(profile.interests);
  const [notifications, setNotifications] = useState(true);
  const [reminderTime, setReminderTime] = useState("18:00");
  const [screenTimeLimit, setScreenTimeLimit] = useState(30);
  const [parentalControls, setParentalControls] = useState(true);
  const [communitySharing, setCommunitySharing] = useState(profile.communityEnabled ?? false);

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
    setDailyGoal(profile.dailyGoal);
    setInterests(profile.interests);
    setInterestOptions((prev) => mergeInterestOptions(prev, profile.interests));
  }, [profile]);

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

  const toggleInterest = (interestId: string) => {
    setInterests((prev) =>
      prev.includes(interestId)
        ? prev.filter((interest) => interest !== interestId)
        : [...prev, interestId],
    );
  };

  const handleSave = async () => {
    if (isMockData) {
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
          daily_goal: dailyGoal,
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
      setDailyGoal(nextProfile.dailyGoal);
      setInterests(nextProfile.interests);
      setInterestOptions((prev) =>
        mergeInterestOptions(prev, nextProfile.interests),
      );

      setNotifications(updatedControls.daily_reminder_enabled);
      setReminderTime(updatedControls.daily_reminder_time || "18:00");
      setParentalControls(updatedControls.enable_time_limits);
      setScreenTimeLimit(updatedControls.daily_screen_time_limit ?? 30);

      onProfileUpdated?.(nextProfile);

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white rounded-[28px] h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-slate-700 text-xl">
              <div className="p-2 bg-green-100 rounded-xl text-green-600">
                <Target className="w-5 h-5" />
              </div>
              學習目標
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
