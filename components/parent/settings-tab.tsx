"use client";

import { useState } from "react";
import { User, Target, Bell, Shield, Palette, Save, Settings, Clock, Users } from "lucide-react";
import type { ChildProfile } from "@/lib/types";
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
import { updateChild } from "@/lib/api/children";
import { cn } from "@/lib/utils";

interface SettingsTabProps {
  profile: ChildProfile;
}

// Interest Options (Translated)
const INTEREST_OPTIONS = [
  { id: "Animals", label: "動物", icon: "🦁" },
  { id: "Food", label: "食物", icon: "🍎" },
  { id: "Colors", label: "顏色", icon: "🎨" },
  { id: "Nature", label: "大自然", icon: "🌳" },
  { id: "Vehicles", label: "交通工具", icon: "🚗" },
  { id: "Family", label: "家庭", icon: "👨‍👩‍👧" },
  { id: "Space", label: "太空", icon: "🚀" },
  { id: "Music", label: "音樂", icon: "🎵" },
];

export function SettingsTab({ profile }: SettingsTabProps) {
  // If we have a real child ID (not mock), use the parental controls component
  const isMockData =
    !profile.id ||
    profile.id === "1" ||
    profile.id === "mock-child-id" ||
    profile.id.length < 10;

  // --- MOCK STATE ---
  const [name, setName] = useState(profile.name);
  const [age, setAge] = useState(profile.age);
  const [dailyGoal, setDailyGoal] = useState(profile.dailyGoal);
  const [interests, setInterests] = useState(profile.interests);
  const [notifications, setNotifications] = useState(true);
  const [reminderTime, setReminderTime] = useState("09:00");
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

  const toggleInterest = (interestId: string) => {
    setInterests((prev) =>
      prev.includes(interestId)
        ? prev.filter((i) => i !== interestId)
        : [...prev, interestId],
    );
  };

  const handleSave = () => {
    // In a real app, this would save to the database
    console.log("Saving settings:", {
      name,
      age,
      dailyGoal,
      interests,
      notifications,
      reminderTime,
      screenTimeLimit,
      parentalControls,
    });
    alert("設定已儲存！");
  };

  // If real data component exists, render it (Assuming it handles its own UI)
  // For consistency in this demo, I will apply the mock UI style even for the real component wrapper
  if (!isMockData) {
    return (
      <div className="space-y-8 w-full p-4 md:p-6 bg-white/50 backdrop-blur-sm rounded-[32px]">
        <div className="text-center space-y-3 mb-4">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-slate-100 to-gray-200 rounded-2xl mb-2 shadow-sm">
            <Settings className="w-8 h-8 text-slate-600" />
          </div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">
            {profile.name} 的設定
          </h2>
          <p className="text-slate-500 font-medium">
            管理學習偏好與家長監護功能
          </p>
        </div>
        <ParentalControlsSettings childId={profile.id} />
      </div>
    );
  }

  // --- MOCK SETTINGS UI ---
  return (
    <div className="space-y-8 w-full p-4 md:p-6 bg-white/50 backdrop-blur-sm rounded-[32px]">
      
      {/* Header */}
      <div className="text-center space-y-3 mb-4">
        <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-slate-100 to-gray-200 rounded-2xl mb-2 shadow-sm">
          <Settings className="w-8 h-8 text-slate-600 animate-spin-slow" />
        </div>
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">
          {profile.name} 的設定
        </h2>
        <p className="text-slate-500 font-medium">
          打造最適合小朋友的個人化學習體驗
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 1. Child Profile Card */}
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
              <Label htmlFor="name" className="text-slate-600 font-bold">名字</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="輸入小朋友名字"
                className="rounded-xl border-slate-200 focus:ring-blue-200 h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age" className="text-slate-600 font-bold">年齡</Label>
              <Input
                id="age"
                type="number"
                min={2}
                max={7}
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="rounded-xl border-slate-200 focus:ring-blue-200 h-11"
              />
            </div>
          </CardContent>
        </Card>

        {/* 2. Learning Goals Card */}
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

      {/* 3. Interests Card */}
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
            {INTEREST_OPTIONS.map((interest) => {
              const isSelected = interests.includes(interest.id);
              return (
                <button
                  key={interest.id}
                  onClick={() => toggleInterest(interest.id)}
                  className={cn(
                    "px-4 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 border-2",
                    isSelected
                      ? "bg-yellow-100 text-yellow-800 border-yellow-200 shadow-sm transform scale-105"
                      : "bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100"
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
        
        {/* 4. Notifications Card */}
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
              />
            </div>

            {notifications && (
              <div className="space-y-2 px-1">
                <Label htmlFor="reminder-time" className="text-slate-600 font-bold">提醒時間</Label>
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <Input
                        id="reminder-time"
                        type="time"
                        value={reminderTime}
                        onChange={(e) => setReminderTime(e.target.value)}
                        className="rounded-xl border-slate-200 h-11 w-full font-medium text-slate-700"
                    />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 5. Parental Controls Card */}
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
            className="w-full h-14 text-lg font-bold gap-2 rounded-full shadow-xl shadow-blue-200 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transition-all active:scale-[0.98]"
            size="lg"
        >
            <Save className="w-5 h-5" />
            儲存所有設定
        </Button>
      </div>
    </div>
  );
}