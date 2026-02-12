"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CozyPageWrapper from "@/components/CozyPageWrapper";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      router.push("/parent"); 
    }, 800);
  };

  return (
    <CozyPageWrapper type="center">
      <Card className="w-full max-w-[420px] border-none shadow-2xl bg-white/95 backdrop-blur-md rounded-[40px] overflow-hidden transform hover:scale-[1.01] transition-transform duration-300">
        <CardHeader className="text-center pb-2 pt-12">
          <CardTitle className="text-4xl font-black text-orange-500 tracking-tight mb-3 drop-shadow-sm">
            歡迎回來!
          </CardTitle>
          <CardDescription className="text-slate-400 font-bold text-base">
            跟進小朋友嘅學習足跡
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-600 font-extrabold ml-1 text-xs tracking-wide">
                家長電郵
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@family.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 rounded-2xl border-none bg-[#F0FDF4] text-slate-600 placeholder:text-slate-300 focus:bg-white focus:ring-2 focus:ring-green-300 transition-all font-medium text-lg px-4"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-600 font-extrabold ml-1 text-xs tracking-wide">
                密碼
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-14 rounded-2xl border-none bg-[#F0FDF4] text-slate-600 placeholder:text-slate-300 focus:bg-white focus:ring-2 focus:ring-green-300 transition-all font-medium text-lg px-4"
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-14 rounded-full text-xl font-black bg-[#38BDF8] hover:bg-[#0EA5E9] shadow-lg shadow-blue-200/50 transition-all mt-4 text-white active:scale-95"
              disabled={isLoading}
            >
              {isLoading ? "登入中..." : "查看進度"}
            </Button>
          </form>

          <div className="text-center">
            <button className="text-slate-400 text-sm font-bold hover:text-blue-500 transition-colors">
              新朋友? <span className="text-[#38BDF8]">建立新帳戶</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </CozyPageWrapper>
  );
}