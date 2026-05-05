"use client";

import { useEffect, useState } from "react";
import { Lock, Shield, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PARENT_PIN_STORAGE_KEY = "mcs_parent_pin";

export function getStoredParentPin(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(PARENT_PIN_STORAGE_KEY);
}

export function setStoredParentPin(pin: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(PARENT_PIN_STORAGE_KEY, pin.trim());
}

export function clearStoredParentPin(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(PARENT_PIN_STORAGE_KEY);
}

interface ParentPinModalProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function ParentPinModal({ onSuccess, onCancel }: ParentPinModalProps) {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [storedPin, setStoredPin] = useState<string | null>(null);
  const isSetupMode = !storedPin;

  useEffect(() => {
    setStoredPin(getStoredParentPin());
  }, []);

  const handleSubmit = () => {
    const normalizedPin = pin.trim();

    if (isSetupMode) {
      if (!/^\d{4,6}$/.test(normalizedPin)) {
        setError("請設定 4 至 6 位數字 PIN。");
        return;
      }

      if (normalizedPin !== confirmPin.trim()) {
        setError("兩次輸入的 PIN 不一致。");
        return;
      }

      setStoredParentPin(normalizedPin);
      setStoredPin(normalizedPin);
      setPin("");
      setConfirmPin("");
      setError(null);
      onSuccess();
      return;
    }

    if (normalizedPin === storedPin) {
      setPin("");
      setConfirmPin("");
      setError(null);
      onSuccess();
      return;
    }

    setError("PIN 不正確，請再試一次。");
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-[32px] bg-white shadow-2xl">
        <div className="bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 px-6 py-6 text-white">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-white/80">
                  家長驗證
                </p>
                <h1 className="text-2xl font-black tracking-tight">輸入 PIN 碼</h1>
              </div>
            </div>

            <button
              type="button"
              onClick={onCancel}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25"
              aria-label="關閉"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="space-y-5 px-6 py-6">
          <p className="text-sm font-medium leading-6 text-slate-600">
            {isSetupMode
              ? "第一次進入家長中心，請先設定家長 PIN 碼。之後每次切換到家長模式都要輸入這組 PIN。"
              : "請輸入家長 PIN 碼以繼續前往家長中心。這可防止小朋友誤入管理頁面。"}
          </p>

          <div className="space-y-2">
            <label htmlFor="parent-pin" className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
              {isSetupMode ? "設定 PIN" : "PIN"}
            </label>
            <div className="relative">
              <Input
                id="parent-pin"
                value={pin}
                onChange={(event) => {
                  setPin(event.target.value);
                  setError(null);
                }}
                type="password"
                inputMode="numeric"
                placeholder="••••"
                className="h-12 rounded-2xl border-slate-200 pl-11 text-center text-lg tracking-[0.4em]"
                autoFocus
              />
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          {isSetupMode && (
            <div className="space-y-2">
              <label htmlFor="parent-pin-confirm" className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                確認 PIN
              </label>
              <div className="relative">
                <Input
                  id="parent-pin-confirm"
                  value={confirmPin}
                  onChange={(event) => {
                    setConfirmPin(event.target.value);
                    setError(null);
                  }}
                  type="password"
                  inputMode="numeric"
                  placeholder="••••"
                  className="h-12 rounded-2xl border-slate-200 pl-11 text-center text-lg tracking-[0.4em]"
                />
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          )}

          {error && <p className="text-sm font-medium text-rose-500">{error}</p>}

          {isSetupMode && (
            <p className="text-xs font-medium leading-5 text-slate-500">
              建議使用只有家長知道的 4 至 6 位數字。PIN 會儲存在這部裝置上。
            </p>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="h-11 flex-1 rounded-full font-bold"
            >
              取消
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              className="h-11 flex-1 rounded-full bg-slate-800 font-bold text-white hover:bg-slate-700"
            >
              {isSetupMode ? "儲存並繼續" : "確認"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
