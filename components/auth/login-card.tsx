"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login as apiLogin } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type LoginCardProps = {
  redirectTo?: string;
  title?: string;
  description?: string;
  submitLabel?: string;
  showRegisterLink?: boolean;
};

export function LoginCard({
  redirectTo = "/parent",
  title = "歡迎回來!",
  description = "追蹤小朋友的學習足跡",
  submitLabel = "查看進度",
  showRegisterLink = true,
}: LoginCardProps) {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const auth = await apiLogin({ email, password });
      await login(auth.access_token);
      router.replace(redirectTo);
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "登入失敗。請檢查電郵和密碼，或確保伺服器已啟動。",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-[420px] border-none bg-white/95 shadow-2xl backdrop-blur-md rounded-[40px] overflow-hidden transform hover:scale-[1.01] transition-all">
      <CardHeader className="pb-2 pt-12 text-center">
        <CardTitle className="mb-3 text-4xl font-black tracking-tight text-orange-500 drop-shadow-sm">
          {title}
        </CardTitle>
        <CardDescription className="text-base font-bold text-slate-400">
          {description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 p-8">
        {error && (
          <Alert
            variant="destructive"
            className="rounded-2xl border-red-100 bg-red-50 font-bold text-red-600"
          >
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Label className="ml-1 text-xs font-extrabold text-slate-600">
              登入電郵
            </Label>
            <Input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="h-14 rounded-2xl border-none bg-[#F0FDF4] px-4 text-slate-600 focus-visible:ring-2 focus-visible:ring-blue-300"
            />
          </div>

          <div className="space-y-2">
            <Label className="ml-1 text-xs font-extrabold text-slate-600">
              密碼
            </Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="h-14 rounded-2xl border-none bg-[#F0FDF4] px-4 text-slate-600 focus-visible:ring-2 focus-visible:ring-blue-300"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="h-14 w-full rounded-full bg-[#38BDF8] text-xl font-black text-white shadow-lg shadow-blue-200/50 transition-all active:scale-95 hover:bg-[#0284C7]"
          >
            {isLoading ? "登入中..." : submitLabel}
          </Button>
        </form>

        {showRegisterLink && (
          <div className="pt-2 text-center">
            <p className="text-sm font-bold text-slate-400">
              新朋友?{" "}
              <Link
                href="/register"
                className="text-[#38BDF8] transition-colors hover:text-[#0284C7] hover:underline"
              >
                建立新帳戶
              </Link>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
