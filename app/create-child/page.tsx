"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import CozyPageWrapper from "@/components/CozyPageWrapper";

export default function CreateChildPage() {
  const router = useRouter();
  const [childName, setChildName] = useState("");
  const [age, setAge] = useState("");
  const [avatar, setAvatar] = useState("👦"); 
  const [style, setStyle] = useState("mixed");
  const [loading, setLoading] = useState(false);

  const avatars = ["👦", "👧", "🧑", "🐻", "🐰", "🦁"];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // Add your API logic here
    console.log({ childName, age, avatar, style });
    
    setTimeout(() => {
        router.push("/"); 
    }, 1000);
  }

  return (
    <CozyPageWrapper>
      <Card className="w-full bg-white/95 backdrop-blur-md rounded-[48px] shadow-[0_20px_40px_rgba(0,0,0,0.05)] border-4 border-white">
        
        <CardHeader className="space-y-1 pt-10 pb-2 text-center">
          <h1 className="text-4xl font-black text-[#FF9800] tracking-widest drop-shadow-sm">
            邊個去冒險?
          </h1>
          <p className="text-[#90A4AE] font-bold text-base">
            建立小朋友專屬檔案
          </p>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5 px-8">
            
            {/* 1. Name Input */}
            <div className="space-y-2">
              <Label className="text-[#546E7A] font-black text-xs ml-4 uppercase tracking-widest">
                小朋友暱稱 / 名字
              </Label>
              <Input
                placeholder="例如: 軒軒"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                required
                className="rounded-full bg-[#F1F8E9] border-none h-12 px-6 text-lg text-[#37474F] font-bold placeholder:text-[#B0BEC5] focus-visible:ring-2 focus-visible:ring-[#66BB6A] transition-all"
              />
            </div>

            {/* 2. Age & Learning Style */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#546E7A] font-black text-xs ml-3 uppercase">
                  年齡
                </Label>
                <div className="relative">
                  <select 
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full rounded-full bg-[#F1F8E9] h-12 px-4 text-[#37474F] font-bold appearance-none cursor-pointer focus:ring-2 focus:ring-[#66BB6A] outline-none border-none"
                  >
                    <option value="" disabled>選擇</option>
                    {[2,3,4,5,6,7,8,9,10,11,12].map(num => (
                      <option key={num} value={num}>{num} 歲</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-3.5 pointer-events-none text-[#90A4AE] text-xs">▼</div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[#546E7A] font-black text-xs ml-3 uppercase">
                  學習風格
                </Label>
                <div className="relative">
                   <select 
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    className="w-full rounded-full bg-[#F1F8E9] h-12 px-4 text-[#37474F] font-bold appearance-none cursor-pointer focus:ring-2 focus:ring-[#66BB6A] outline-none border-none"
                  >
                    <option value="visual">👀 睇圖 (Visual)</option>
                    <option value="auditory">👂 聽聲 (Auditory)</option>
                    {/* Added Kinesthetic Option */}
                    <option value="kinesthetic">🏃‍♂️ 郁動 (Kinesthetic)</option>
                    <option value="mixed">✨ 混合 (Mixed)</option>
                  </select>
                   <div className="absolute right-4 top-3.5 pointer-events-none text-[#90A4AE] text-xs">▼</div>
                </div>
              </div>
            </div>

            {/* 3. Avatar Selection */}
            <div className="space-y-3">
              <Label className="text-[#546E7A] font-black text-xs ml-4 uppercase tracking-widest">
                選擇冒險頭像
              </Label>
              <div className="flex justify-between gap-2">
                {avatars.map((char) => (
                  <button
                    key={char}
                    type="button"
                    onClick={() => setAvatar(char)}
                    className={`text-3xl w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      avatar === char 
                        ? "bg-[#FFF3E0] scale-125 shadow-md border-2 border-orange-300" 
                        : "bg-transparent hover:bg-gray-50 opacity-60 hover:opacity-100"
                    }`}
                  >
                    {char}
                  </button>
                ))}
              </div>
            </div>

          </CardContent>

          <CardFooter className="pb-10 px-8 pt-2">
            <Button 
              type="submit" 
              className="w-full bg-[#66BB6A] hover:bg-[#57A65B] text-white font-black text-2xl pt-2 pb-3 rounded-full h-16 shadow-[0_6px_0_#388E3C] active:shadow-none active:translate-y-[6px] transition-all" 
              disabled={loading}
            >
              {loading ? "設定中..." : "完成設定"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </CozyPageWrapper>
  );
}