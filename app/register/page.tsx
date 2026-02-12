"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
// Import your new wrapper
import CozyPageWrapper from "@/components/CozyPageWrapper"; 
// Note: You might need to adjust your import path for register API
import { register } from "@/lib/api"; 

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Assuming your register API takes name, email, password
      await register({ name, email, password });
      router.push("/login"); // Redirect to login after success
    } catch (err: any) {
      setError(err.message || "註冊失敗，請稍後再試。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <CozyPageWrapper>
      <Card className="w-full bg-white/95 backdrop-blur-md rounded-[48px] shadow-[0_20px_40px_rgba(0,0,0,0.05)] border-4 border-white">
        
        <CardHeader className="space-y-2 pt-10 pb-2 text-center items-center">
          <h1 className="text-5xl font-black text-[#FF9800] tracking-widest drop-shadow-sm">
            加入冒險!
          </h1>
          <p className="text-[#90A4AE] font-bold text-lg tracking-wide">
            建立家長帳戶
          </p>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 px-8">
            {error && (
              <Alert variant="destructive" className="rounded-2xl border-red-100 bg-red-50 text-red-500 font-bold">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Name Field */}
            <div className="space-y-2">
              <Label className="text-[#546E7A] font-black text-sm ml-4 uppercase tracking-widest">
                家長稱呼
              </Label>
              <Input
                placeholder="例如: 陳大文"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="rounded-full bg-[#F1F8E9] border-none h-14 px-6 text-lg text-[#37474F] font-bold placeholder:text-[#B0BEC5] focus-visible:ring-2 focus-visible:ring-[#29B6F6] transition-all"
              />
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label className="text-[#546E7A] font-black text-sm ml-4 uppercase tracking-widest">
                電郵
              </Label>
              <Input
                type="email"
                placeholder="name@family.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="rounded-full bg-[#F1F8E9] border-none h-14 px-6 text-lg text-[#37474F] font-bold placeholder:text-[#B0BEC5] focus-visible:ring-2 focus-visible:ring-[#29B6F6] transition-all"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label className="text-[#546E7A] font-black text-sm ml-4 uppercase tracking-widest">
                設定密碼
              </Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="rounded-full bg-[#F1F8E9] border-none h-14 px-6 text-lg text-[#37474F] font-bold placeholder:text-[#B0BEC5] focus-visible:ring-2 focus-visible:ring-[#29B6F6] transition-all"
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 pb-10 px-8 pt-2">
            <Button 
              type="submit" 
              className="w-full bg-[#29B6F6] hover:bg-[#039BE5] text-white font-black text-2xl pt-2 pb-3 rounded-full h-16 shadow-[0_6px_0_#0288D1] active:shadow-none active:translate-y-[6px] transition-all hover:scale-[1.02]" 
              disabled={loading}
            >
              {loading ? "處理中..." : "建立帳戶"}
            </Button>

            <div className="text-center font-bold text-[#90A4AE]">
              已經有帳戶?{" "}
              <Link href="/login" className="text-[#29B6F6] hover:underline underline-offset-4">
                立即登入
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </CozyPageWrapper>
  );
}