"use client";

import { useState } from "react";
import { Check, Circle, Plus, Lightbulb, Clock, MapPin, Utensils, Moon, Flag, Target } from "lucide-react";
import type { DailyMission } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface MissionsTabProps {
  missions: DailyMission[];
}

// Translated Suggested Missions
const suggestedMissions = [
  {
    title: "早晨習慣",
    description: "刷牙洗面嗰陣練習生字",
    icon: Clock,
    color: "text-orange-400",
    bg: "bg-orange-50",
    words: ["牙刷", "毛巾", "鏡"],
  },
  {
    title: "返學途中",
    description: "說出沿途見到的事物",
    icon: MapPin,
    color: "text-green-500",
    bg: "bg-green-50",
    words: ["樹", "巴士", "雀仔"],
  },
  {
    title: "食飯時間",
    description: "認識餐具同食物名稱",
    icon: Utensils,
    color: "text-red-400",
    bg: "bg-red-50",
    words: ["匙羹", "碗", "菜"],
  },
  {
    title: "睡前故事",
    description: "一同閱讀，溫習新學的詞語",
    icon: Moon,
    color: "text-indigo-400",
    bg: "bg-indigo-50",
    words: ["月亮", "發夢", "訓覺"],
  },
];

export function MissionsTab({ missions }: MissionsTabProps) {
  // Mock data for display if missions prop is empty (for visualization)
  const initialMissions = missions.length > 0 ? missions : [
    { id: "1", title: "超市大冒險", description: "帶小朋友到超市認識詞語", targetWord: "蘋果", context: "請小朋友幫忙找蘋果", completed: false },
    { id: "2", title: "顏色偵探", description: "找出家中藍色的物件", targetWord: "藍色", context: "指著藍色物件大聲朗讀", completed: true },
  ];

  const [localMissions, setLocalMissions] = useState(initialMissions);

  const toggleMission = (id: string) => {
    setLocalMissions((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, completed: !m.completed } : m
      )
    );
  };

  const completedCount = localMissions.filter((m) => m.completed).length;
  const progressPercent = (completedCount / localMissions.length) * 100;

  return (
    <div className="space-y-6 font-zen">
      
      {/* 1. MISSION PROGRESS CARD */}
      <Card className="rounded-[32px] border-2 border-gray-100 shadow-sm bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-black text-gray-700">
            <Flag className="w-6 h-6 text-[#FF9800]" />
            今日線下任務
          </CardTitle>
          <CardDescription className="text-gray-500 font-bold">
            將學習融入日常生活，與小朋友一同完成任務！
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Progress Bar */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden border border-gray-200">
              <div 
                className="bg-[#66BB6A] h-full rounded-full transition-all duration-500 ease-out shadow-[inset_0_-2px_4px_rgba(0,0,0,0.1)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-lg font-black text-[#66BB6A]">
              {completedCount}/{localMissions.length}
            </span>
          </div>

          {/* Mission List */}
          <div className="space-y-4">
            {localMissions.map((mission) => (
              <div
                key={mission.id}
                onClick={() => toggleMission(mission.id)}
                className={cn(
                  "p-5 rounded-[24px] border-2 transition-all cursor-pointer group shadow-[0_4px_0_rgba(0,0,0,0.02)]",
                  mission.completed 
                    ? "border-[#A5D6A7] bg-[#E8F5E9]" // Green when done
                    : "border-gray-100 bg-white hover:border-[#FFCC80] hover:shadow-md" // White default
                )}
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox Button */}
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 transition-all",
                      mission.completed 
                        ? "bg-[#66BB6A] text-white shadow-sm" 
                        : "bg-gray-100 border-2 border-gray-300 group-hover:border-[#FF9800]"
                    )}
                  >
                    {mission.completed && <Check className="w-5 h-5 stroke-[3]" />}
                  </div>

                  {/* Text Content */}
                  <div className="flex-1">
                    <h3 className={cn(
                      "text-lg font-black transition-colors",
                      mission.completed ? "text-[#388E3C] line-through decoration-2" : "text-gray-700"
                    )}>
                      {mission.title}
                    </h3>
                    <p className="text-sm font-bold text-gray-400 mt-1">
                      {mission.description}
                    </p>
                    
                    {/* Mission Details Box */}
                    <div className={cn(
                      "mt-3 p-4 rounded-[16px] flex flex-col gap-2",
                      mission.completed ? "bg-white/50" : "bg-[#F5F7F8]"
                    )}>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Target className="w-4 h-4 text-[#29B6F6]" />
                        <span>目標生字: <strong className="text-gray-800">{mission.targetWord}</strong></span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-gray-600">
                        <Lightbulb className="w-4 h-4 text-[#FF9800] mt-0.5" />
                        <span>如何進行： <strong className="text-gray-800">{mission.context}</strong></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 2. SUGGESTED ACTIVITIES CARD */}
      <Card className="rounded-[32px] border-2 border-gray-100 shadow-sm bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-black text-gray-700">
            <Lightbulb className="w-6 h-6 text-[#FFCA28]" />
            更多建議活動
          </CardTitle>
          <CardDescription className="text-gray-500 font-bold">
            在不同時段，均可與小朋友一起練習詞語。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            {suggestedMissions.map((mission, index) => {
              const Icon = mission.icon;
              return (
                <div
                  key={index}
                  className="p-5 rounded-[24px] border-2 border-transparent bg-[#FAFAFA] hover:border-[#E1F5FE] hover:bg-white hover:shadow-sm transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0", mission.bg)}>
                      <Icon className={cn("w-6 h-6", mission.color)} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-black text-gray-700 text-lg">{mission.title}</h4>
                      <p className="text-xs font-bold text-gray-400 mb-3">{mission.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {mission.words.map((word) => (
                          <span 
                            key={word}
                            className="text-[10px] font-bold bg-white border border-gray-200 px-2 py-1 rounded-full text-gray-500 shadow-sm"
                          >
                            {word}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 3. LEARNING TIP */}
      <Card className="rounded-[24px] border-none bg-[#E1F5FE] shadow-sm">
        <CardContent className="p-5 flex gap-4 items-start">
           <div className="bg-white p-2 rounded-full shadow-sm flex-shrink-0">
             <Lightbulb className="w-6 h-6 text-[#29B6F6]" />
           </div>
           <div>
             <h3 className="font-black text-[#0277BD] mb-1">為何線下任務如此重要？</h3>
             <p className="text-sm font-bold text-[#546E7A] leading-relaxed">
               研究顯示，當小朋友將在屏幕學到的詞語應用到現實生活，學習效果最為理想。這些任務有助您在日常互動中鹞固記憶。
             </p>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}