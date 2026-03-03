"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Shield, Clock, Volume2, Gamepad2, Bell, Save } from "lucide-react";
import type { ParentalControl } from "@/lib/types";
import {
  getParentalControls,
  updateParentalControls,
} from "@/lib/api/parent-dashboard";

interface ParentalControlsSettingsProps {
  childId: string;
}

export function ParentalControlsSettings({
  childId,
}: ParentalControlsSettingsProps) {
  const [settings, setSettings] = useState<ParentalControl | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, [childId]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await getParentalControls(childId);
      setSettings(data);
    } catch (error) {
      console.error("Failed to load settings:", error);
      toast({
        title: "Error",
        description: "Failed to load parental control settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const updated = await updateParentalControls(childId, settings);
      setSettings(updated);
      toast({
        title: "Success",
        description: "Parental control settings updated successfully",
      });
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = <K extends keyof ParentalControl>(
    key: K,
    value: ParentalControl[K],
  ) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">暫時沒有可用設定</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Content Filtering */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold">內容筛選</h3>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="max-difficulty">難度上限</Label>
            <Select
              value={settings.max_difficulty}
              onValueChange={(value: any) =>
                updateSetting("max_difficulty", value)
              }
            >
              <SelectTrigger id="max-difficulty">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">初級</SelectItem>
                <SelectItem value="medium">中級</SelectItem>
                <SelectItem value="hard">進階</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="min-difficulty">難度下限</Label>
            <Select
              value={settings.min_difficulty}
              onValueChange={(value: any) =>
                updateSetting("min_difficulty", value)
              }
            >
              <SelectTrigger id="min-difficulty">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">初級</SelectItem>
                <SelectItem value="medium">中級</SelectItem>
                <SelectItem value="hard">進階</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="safe-mode">安全模式</Label>
            <Switch
              id="safe-mode"
              checked={settings.safe_mode_enabled}
              onCheckedChange={(checked) =>
                updateSetting("safe_mode_enabled", checked)
              }
            />
          </div>
        </div>
      </Card>

      {/* Screen Time */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="h-5 w-5 text-orange-500" />
          <h3 className="text-lg font-semibold">使用時間管理</h3>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="screen-time-limit">
              每日使用時限（分鐘）
            </Label>
            <Input
              id="screen-time-limit"
              type="number"
              value={settings.daily_screen_time_limit || ""}
              onChange={(e) =>
                updateSetting(
                  "daily_screen_time_limit",
                  e.target.value ? parseInt(e.target.value) : undefined,
                )
              }
              placeholder="無限制"
            />
            <p className="text-xs text-muted-foreground mt-1">
              留空表示無限制
            </p>
          </div>

          <div>
            <Label htmlFor="warning-threshold">
              提示閾値（分鐘）
            </Label>
            <Input
              id="warning-threshold"
              type="number"
              value={settings.screen_time_warning_threshold}
              onChange={(e) =>
                updateSetting(
                  "screen_time_warning_threshold",
                  parseInt(e.target.value) || 20,
                )
              }
            />
          </div>
        </div>
      </Card>

      {/* Learning Preferences */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Volume2 className="h-5 w-5 text-purple-500" />
          <h3 className="text-lg font-semibold">學習偉好</h3>
        </div>

        <div className="space-y-4">
          <div>
            <Label>語速：{settings.tts_speech_rate.toFixed(1)}x</Label>
            <Slider
              value={[settings.tts_speech_rate]}
              onValueChange={([value]) =>
                updateSetting("tts_speech_rate", value)
              }
              min={0.5}
              max={2.0}
              step={0.1}
              className="mt-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>較慢</span>
              <span>較快</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="bilingual-mode">開啟雙語模式</Label>
            <Switch
              id="bilingual-mode"
              checked={settings.enable_bilingual_mode}
              onCheckedChange={(checked) =>
                updateSetting("enable_bilingual_mode", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="show-jyutping">顯示粤語拼音</Label>
            <Switch
              id="show-jyutping"
              checked={settings.show_jyutping}
              onCheckedChange={(checked) =>
                updateSetting("show_jyutping", checked)
              }
            />
          </div>
        </div>
      </Card>

      {/* Game Settings */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Gamepad2 className="h-5 w-5 text-green-500" />
          <h3 className="text-lg font-semibold">遲戲設定</h3>
        </div>

        <div className="space-y-4">
          <div>
            <Label>
              遲戲難度倍率：{settings.game_difficulty_multiplier.toFixed(1)}x
            </Label>
            <Slider
              value={[settings.game_difficulty_multiplier]}
              onValueChange={([value]) =>
                updateSetting("game_difficulty_multiplier", value)
              }
              min={0.5}
              max={2.0}
              step={0.1}
              className="mt-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>較易</span>
              <span>較難</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="time-limits">開啟遲戲時間限制</Label>
            <Switch
              id="time-limits"
              checked={settings.enable_time_limits}
              onCheckedChange={(checked) =>
                updateSetting("enable_time_limits", checked)
              }
            />
          </div>
        </div>
      </Card>

      {/* Notifications */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="h-5 w-5 text-yellow-500" />
          <h3 className="text-lg font-semibold">通知與提醒</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="daily-reminder">每日練習提醒</Label>
            <Switch
              id="daily-reminder"
              checked={settings.daily_reminder_enabled}
              onCheckedChange={(checked) =>
                updateSetting("daily_reminder_enabled", checked)
              }
            />
          </div>

          {settings.daily_reminder_enabled && (
            <div>
              <Label htmlFor="reminder-time">提醒時間</Label>
              <Input
                id="reminder-time"
                type="time"
                value={settings.daily_reminder_time}
                onChange={(e) =>
                  updateSetting("daily_reminder_time", e.target.value)
                }
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <Label htmlFor="bedtime-reminder">睡前故事提醒</Label>
            <Switch
              id="bedtime-reminder"
              checked={settings.bedtime_story_reminder}
              onCheckedChange={(checked) =>
                updateSetting("bedtime_story_reminder", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="weekly-report">每週進度報告</Label>
            <Switch
              id="weekly-report"
              checked={settings.weekly_report_enabled}
              onCheckedChange={(checked) =>
                updateSetting("weekly_report_enabled", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="achievement-notif">成就通知</Label>
            <Switch
              id="achievement-notif"
              checked={settings.achievement_notifications}
              onCheckedChange={(checked) =>
                updateSetting("achievement_notifications", checked)
              }
            />
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          size="lg"
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          {saving ? "儲存中..." : "儲存設定"}
        </Button>
      </div>
    </div>
  );
}
