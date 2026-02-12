"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
// Import your new wrapper
import CozyPageWrapper from "@/components/CozyPageWrapper";
// Note: You might need to adjust your import path for register API
import { register } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    // Validation
    if (!fullName || !email || !password || !confirmPassword) {
      setError("所有欄位都是必須的");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("密碼不相符");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("密碼需要至少6個字符");
      setLoading(false);
      return;
    }

    try {
      await register({
        full_name: fullName,
        email,
        password,
      });
      setSuccess("帳戶建立成功！正在轉向登入...");
      setTimeout(() => {
        router.push("/login");
      }, 1500);
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
              <Alert
                variant="destructive"
                className="rounded-2xl border-red-100 bg-red-50 text-red-500 font-bold"
              >
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="rounded-2xl border-green-100 bg-green-50 text-green-600 font-bold">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {/* Name Field */}
            <div className="space-y-2">
              <Label className="text-[#546E7A] font-black text-sm ml-4 uppercase tracking-widest">
                家長稱呼
              </Label>
              <Input
                placeholder="例如: 陳大文"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
                required
                className="rounded-full bg-[#F1F8E9] border-none h-14 px-6 text-lg text-[#37474F] font-bold placeholder:text-[#B0BEC5] focus-visible:ring-2 focus-visible:ring-[#29B6F6] transition-all disabled:opacity-50"
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
                disabled={loading}
                required
                className="rounded-full bg-[#F1F8E9] border-none h-14 px-6 text-lg text-[#37474F] font-bold placeholder:text-[#B0BEC5] focus-visible:ring-2 focus-visible:ring-[#29B6F6] transition-all disabled:opacity-50"
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
                disabled={loading}
                required
                className="rounded-full bg-[#F1F8E9] border-none h-14 px-6 text-lg text-[#37474F] font-bold placeholder:text-[#B0BEC5] focus-visible:ring-2 focus-visible:ring-[#29B6F6] transition-all disabled:opacity-50"
              />
              <p className="text-xs text-[#90A4AE] font-bold ml-4 mt-1">
                至少6個字符
              </p>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label className="text-[#546E7A] font-black text-sm ml-4 uppercase tracking-widest">
                確認密碼
              </Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
                className="rounded-full bg-[#F1F8E9] border-none h-14 px-6 text-lg text-[#37474F] font-bold placeholder:text-[#B0BEC5] focus-visible:ring-2 focus-visible:ring-[#29B6F6] transition-all disabled:opacity-50"
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 pb-10 px-8 pt-2">
            <Button
              type="submit"
              className="w-full bg-[#29B6F6] hover:bg-[#039BE5] text-white font-black text-2xl pt-2 pb-3 rounded-full h-16 shadow-[0_6px_0_#0288D1] active:shadow-none active:translate-y-[6px] transition-all hover:scale-[1.02] disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "處理中..." : "建立帳戶"}
            </Button>

            <div className="text-center font-bold text-[#90A4AE]">
              已經有帳戶?{" "}
              <Link
                href="/login"
                className="text-[#29B6F6] hover:underline underline-offset-4"
              >
                立即登入
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </CozyPageWrapper>
  );
}
