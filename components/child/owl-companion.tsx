"use client";

import type { ReactElement } from "react";
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { CartoonCat, CartoonDog, CartoonOwl } from "./cartoon-characters";
import { X } from "lucide-react";

type MascotTier = {
  id: "owl" | "dog" | "cat";
  unlockLevel: number;
  name: string;
  accent: string;
  bubbleBorder: string;
  bubbleText: string;
  dot: string;
  prompt: string;
  unlockMessage: string;
  messages: string[];
  render: (size: number) => ReactElement;
};

const MASCOT_TIERS: MascotTier[] = [
  {
    id: "owl",
    unlockLevel: 1,
    name: "Ollie",
    accent: "rgba(139, 92, 246, 0.22)",
    bubbleBorder: "#c4b5fd",
    bubbleText: "#6d28d9",
    dot: "#facc15",
    prompt: "點擊貓頭鷹獲得鼓勵",
    unlockMessage: "貓頭鷹老師會陪你開始學習旅程。",
    messages: [
      "你做得好好呀！繼續加油！",
      "學廣東話好好玩架！",
      "日日練習，你變得越嚟越叻！",
      "今日學咗幾多個詞彙呀？",
      "每個新詞彙都係寶藏嚟著！",
    ],
    render: (size) => <CartoonOwl size={size} animate="float" />,
  },
  {
    id: "dog",
    unlockLevel: 3,
    name: "Bingo",
    accent: "rgba(251, 146, 60, 0.24)",
    bubbleBorder: "#fdba74",
    bubbleText: "#c2410c",
    dot: "#fb923c",
    prompt: "點擊小狗獲得鼓勵",
    unlockMessage: "Lv.3 解鎖小狗 Bingo！之後會陪你一齊衝關。",
    messages: [
      "汪！再試一次，你就會成功啦！",
      "你今日好有衝勁，我陪你一齊學！",
      "大聲讀出嚟，發音會越嚟越靚！",
      "做完呢關，我哋一齊去下一級！",
    ],
    render: (size) => <CartoonDog size={size} animate="float" />,
  },
  {
    id: "cat",
    unlockLevel: 6,
    name: "Mimi",
    accent: "rgba(244, 114, 182, 0.22)",
    bubbleBorder: "#f9a8d4",
    bubbleText: "#be185d",
    dot: "#fb7185",
    prompt: "點擊小貓獲得鼓勵",
    unlockMessage: "Lv.6 解鎖小貓 Mimi！你已經升到進階學習隊伍。",
    messages: [
      "喵！你而家越學越快，真係好叻！",
      "記住節奏慢慢講，會更清楚呀！",
      "你已經解鎖新朋友啦，繼續努力！",
      "我最鍾意睇你完成挑戰嗰一刻！",
    ],
    render: (size) => <CartoonCat size={size} animate="float" />,
  },
];

interface OwlCompanionProps {
  level?: number;
}

export function OwlCompanion({ level = 1 }: OwlCompanionProps) {
  const [showBubble, setShowBubble] = useState(false);
  const [msgIdx, setMsgIdx] = useState(0);
  const [unlockMessage, setUnlockMessage] = useState<string | null>(null);
  const previousMascotIdRef = useRef<string | null>(null);

  const activeMascot = useMemo(() => {
    return [...MASCOT_TIERS]
      .reverse()
      .find((tier) => level >= tier.unlockLevel) ?? MASCOT_TIERS[0];
  }, [level]);

  useEffect(() => {
    setMsgIdx(0);
  }, [activeMascot.id]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storageKey = `mascot-unlock:${activeMascot.id}`;
    const firstAppearance = previousMascotIdRef.current !== activeMascot.id;
    previousMascotIdRef.current = activeMascot.id;

    if (
      activeMascot.unlockLevel > 1 &&
      firstAppearance &&
      !window.localStorage.getItem(storageKey)
    ) {
      window.localStorage.setItem(storageKey, "seen");
      setUnlockMessage(activeMascot.unlockMessage);
      setShowBubble(true);
    }
  }, [activeMascot]);

  const handleOwlClick = useCallback(() => {
    setUnlockMessage(null);
    setShowBubble(true);
    setMsgIdx((prev) => (prev + 1) % activeMascot.messages.length);

    // Trigger haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate([10, 20, 10]);
    }
  }, [activeMascot.messages.length]);

  const bubbleMessage =
    unlockMessage ?? activeMascot.messages[msgIdx % activeMascot.messages.length];

  return (
    <>
      <style>{`
        @keyframes mascot-bubble-pop {
          0% {
            transform: translate3d(0, 14px, 0) scale(0.92);
            opacity: 0;
          }
          60% {
            transform: translate3d(0, -4px, 0) scale(1.02);
            opacity: 1;
          }
          100% {
            transform: translate3d(0, 0, 0) scale(1);
            opacity: 1;
          }
        }
        @keyframes mascot-idle-float {
          0%, 100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(0, -6px, 0) scale(1.025);
          }
        }
        @keyframes mascot-ring-pulse {
          0%, 100% {
            opacity: 0.42;
            transform: scale(0.96);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.04);
          }
        }
        @keyframes mascot-dot-bob {
          0%, 100% {
            transform: translate3d(0, 0, 0) scale(1);
            opacity: 0.82;
          }
          50% {
            transform: translate3d(0, -4px, 0) scale(1.08);
            opacity: 1;
          }
        }
      `}</style>

      <div className="fixed bottom-32 right-3 z-40 flex flex-col items-end gap-3 pointer-events-none">
        {showBubble && (
          <div
            className="pointer-events-auto bg-white rounded-3xl px-5 py-4 max-w-[220px] relative"
            style={{
              animation: "mascot-bubble-pop 260ms cubic-bezier(0.22, 1, 0.36, 1) forwards",
              transformOrigin: "bottom right",
              border: `2px solid ${activeMascot.bubbleBorder}`,
              boxShadow: "0 18px 32px rgba(15, 23, 42, 0.18)",
              willChange: "transform, opacity",
            }}
          >
            <button
              onClick={() => {
                setUnlockMessage(null);
                setShowBubble(false);
              }}
              className="absolute top-2.5 right-2.5 w-5 h-5 flex items-center justify-center text-slate-300 hover:text-slate-500 transition-colors hover:scale-110"
              aria-label="關閉"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <p
              className="font-black text-lg leading-snug text-center pr-2"
              style={{ color: activeMascot.bubbleText }}
            >
              {bubbleMessage}
            </p>
            <div
              className="absolute -bottom-2.5 right-8 w-4 h-4 bg-white rotate-45"
              style={{
                borderRight: `2px solid ${activeMascot.bubbleBorder}`,
                borderBottom: `2px solid ${activeMascot.bubbleBorder}`,
              }}
            />
          </div>
        )}

        <button
          onClick={handleOwlClick}
          className="pointer-events-auto relative flex items-center justify-center cursor-pointer active:scale-95 transition-transform duration-200"
          style={{
            width: 88,
            height: 88,
            animation: "mascot-idle-float 2.8s ease-in-out infinite",
            willChange: "transform",
          }}
          aria-label={activeMascot.prompt}
        >
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `radial-gradient(circle, ${activeMascot.accent} 0%, rgba(255,255,255,0) 72%)`,
              animation: "mascot-ring-pulse 2.6s ease-in-out infinite",
              willChange: "transform, opacity",
            }}
          />
          {!showBubble && (
            <span
              className="absolute top-1 right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm"
              style={{
                backgroundColor: activeMascot.dot,
                animation: "mascot-dot-bob 1.6s ease-in-out infinite",
                willChange: "transform, opacity",
              }}
            />
          )}
          <div
            className="relative rounded-full bg-white/16 backdrop-blur-[2px]"
            style={{
              boxShadow: "0 14px 28px rgba(15, 23, 42, 0.18)",
            }}
          >
            {activeMascot.render(78)}
          </div>
        </button>
      </div>
    </>
  );
}
