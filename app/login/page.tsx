"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link"; // Required for the registration link
import CozyPageWrapper from "@/components/CozyPageWrapper";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { login as apiLogin } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/parent");
    }
  }, [authLoading, user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const auth = await apiLogin({ email, password });
      await login(auth.access_token);
      router.replace("/parent");
    } catch (err) {
      // Catches the API error gracefully
      setError(err instanceof Error ? err.message : "登入失敗。請檢查電郵和密碼，或確保伺服器已啟動。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CozyPageWrapper type="center">
      <Card className="w-full max-w-[420px] border-none shadow-2xl bg-white/95 backdrop-blur-md rounded-[40px] overflow-hidden transform hover:scale-[1.01] transition-all">
        <CardHeader className="text-center pb-2 pt-12">
          <CardTitle className="text-4xl font-black text-orange-500 tracking-tight mb-3 drop-shadow-sm">歡迎回來!</CardTitle>
          <CardDescription className="text-slate-400 font-bold text-base">追蹤小朋友的學習足跡</CardDescription>
        </CardHeader>
        
        <CardContent className="p-8 space-y-6">
          {error && (
            <Alert variant="destructive" className="rounded-2xl border-red-100 bg-red-50 text-red-600 font-bold">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-slate-600 font-extrabold ml-1 text-xs">家長電郵</Label>
              <Input 
                type="email" 
                placeholder="name@family.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                className="h-14 rounded-2xl border-none bg-[#F0FDF4] text-slate-600 px-4 focus-visible:ring-2 focus-visible:ring-blue-300" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-600 font-extrabold ml-1 text-xs">密碼</Label>
              <Input 
                type="password" 
                placeholder="••••••••" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                className="h-14 rounded-2xl border-none bg-[#F0FDF4] text-slate-600 px-4 focus-visible:ring-2 focus-visible:ring-blue-300" 
              />
            </div>
            
            <Button type="submit" disabled={isLoading} className="w-full h-14 rounded-full text-xl font-black bg-[#38BDF8] hover:bg-[#0284C7] text-white shadow-lg shadow-blue-200/50 transition-all active:scale-95">
              {isLoading ? "登入中..." : "查看進度"}
            </Button>
          </form>

          {/* MISSING LINK RESTORED HERE */}
          <div className="text-center pt-2">
            <p className="text-slate-400 text-sm font-bold">
              新朋友?{" "}
              <Link href="/register" className="text-[#38BDF8] hover:text-[#0284C7] hover:underline transition-colors">
                建立新帳戶
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </CozyPageWrapper>
  );
}