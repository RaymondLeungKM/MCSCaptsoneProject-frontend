"use client";

import { useState } from "react";
import { Shield, Camera, Mic, BarChart2, Users, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitConsent } from "@/lib/api/consent";

interface PrivacyConsentModalProps {
  onConsented: () => void;
}

export function PrivacyConsentModal({ onConsented }: PrivacyConsentModalProps) {
  const [consentCamera, setConsentCamera] = useState(true);
  const [consentMicrophone, setConsentMicrophone] = useState(true);
  const [consentAnalytics, setConsentAnalytics] = useState(true);
  const [communitySharing, setCommunitySharing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await submitConsent({
        consent_camera: consentCamera,
        consent_microphone: consentMicrophone,
        consent_analytics: consentAnalytics,
        community_sharing_enabled: communitySharing,
      });
      onConsented();
    } catch {
      setError("出現錯誤，請再試。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    /* Full-screen backdrop */
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 px-8 py-6 text-white text-center">
          <div className="flex justify-center mb-3">
            <Shield className="w-12 h-12" />
          </div>
          <h1 className="text-2xl font-bold mb-1">私隱同意聲明</h1>
          <p className="text-sm text-indigo-100">Privacy Consent</p>
        </div>

        {/* Body */}
        <div className="px-8 py-6 space-y-5">
          <p className="text-gray-600 text-sm leading-relaxed">
            我哋重視您小朋友嘅私隱。請閱讀並選擇您同意嘅項目，然後按「同意並繼續」。
          </p>

          {/* Consent items */}
          <div className="space-y-3">
            {/* Camera — locked ON (required for core feature) */}
            <ConsentRow
              icon={<Camera className="w-5 h-5 text-amber-500" />}
              title="相機 Camera"
              description="用相機拍攝物件以學習廣東話詞彙 (必須)"
              checked={consentCamera}
              locked
              onChange={setConsentCamera}
            />

            {/* Microphone */}
            <ConsentRow
              icon={<Mic className="w-5 h-5 text-rose-500" />}
              title="麥克風 Microphone"
              description="錄音以幫助語音練習及評估"
              checked={consentMicrophone}
              onChange={setConsentMicrophone}
            />

            {/* Analytics */}
            <ConsentRow
              icon={<BarChart2 className="w-5 h-5 text-blue-500" />}
              title="分析數據 Analytics"
              description="收集學習數據以改善個人化學習體驗"
              checked={consentAnalytics}
              onChange={setConsentAnalytics}
            />

            {/* Community sharing — opt-in, default OFF */}
            <ConsentRow
              icon={<Users className="w-5 h-5 text-teal-500" />}
              title="社區分享 Community Sharing"
              description="分享小朋友拍攝嘅詞彙圖片到社區（不會顯示個人資料）"
              checked={communitySharing}
              onChange={setCommunitySharing}
            />
          </div>

          {error && (
            <p className="text-rose-500 text-sm text-center">{error}</p>
          )}

          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full rounded-2xl py-3 text-base font-bold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
          >
            {submitting ? "請稍等…" : "同意並繼續 Agree & Continue"}
          </Button>

          <p className="text-xs text-gray-400 text-center leading-relaxed">
            本應用符合 COPPA 兒童私隱保護法規。您隨時可在「家長設定」更改上述選項。
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------- internal helper ---------- */

interface ConsentRowProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  locked?: boolean;
  onChange: (v: boolean) => void;
}

function ConsentRow({ icon, title, description, checked, locked, onChange }: ConsentRowProps) {
  return (
    <div
      className={`flex items-start gap-3 rounded-2xl p-4 border transition-colors ${
        checked ? "bg-indigo-50 border-indigo-200" : "bg-gray-50 border-gray-200"
      }`}
    >
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 text-sm">{title}</p>
        <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{description}</p>
        {locked && (
          <p className="text-amber-500 text-xs mt-0.5">此項為必要功能，無法關閉</p>
        )}
      </div>
      <button
        type="button"
        aria-pressed={checked}
        disabled={locked}
        onClick={() => !locked && onChange(!checked)}
        className={`shrink-0 mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
          checked
            ? "bg-indigo-500 border-indigo-500"
            : "bg-white border-gray-300"
        } ${locked ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
      >
        {checked && <CheckCircle className="w-4 h-4 text-white" />}
      </button>
    </div>
  );
}
