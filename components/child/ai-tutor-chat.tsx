"use client";

/**
 * AI Tutor Chat – Epic 8.2.4
 *
 * A parent-supervised conversational chat interface where children can ask
 * «小博士» (Little Scholar) questions about Cantonese vocabulary.
 *
 * Safety:
 *  - Requires parent login (handled at the route level)
 *  - Backend system prompt restricts topics strictly to vocabulary
 *  - All messages are shown to the parent in the same view
 */
import React, { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Sparkles, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TutorChatMessage } from "@/lib/types";
import { sendTutorMessage } from "@/lib/api/word-personalization";

// ---------------------------------------------------------------------------
// Suggested starter questions
// ---------------------------------------------------------------------------
const STARTERS = [
  "「蘋果」係咩意思？",
  "點解貓叫做「貓」？",
  "「快樂」用粵語點讀？",
  "「學校」同「幼稚園」有咩分別？",
  "幫我造一個用「朋友」的句子",
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
interface MessageBubbleProps {
  message: TutorChatMessage;
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  return (
    <div
      className={cn(
        "flex items-end gap-2",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm",
          isUser ? "bg-indigo-400" : "bg-amber-400",
        )}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm font-semibold shadow-sm",
          isUser
            ? "bg-indigo-500 text-white rounded-br-sm"
            : "bg-white text-slate-800 rounded-bl-sm border border-slate-100",
        )}
      >
        {message.content}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
interface AITutorChatProps {
  childId: string;
  contextWordId?: string;
  className?: string;
}

export function AITutorChat({
  childId,
  contextWordId,
  className,
}: AITutorChatProps) {
  const [history, setHistory] = useState<TutorChatMessage[]>([
    {
      role: "assistant",
      content: "你好！我係小博士 👋 你想問我關於廣東話詞彙嘅咩問題？",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, loading]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      const userMsg: TutorChatMessage = { role: "user", content: trimmed };
      setHistory((prev) => [...prev, userMsg]);
      setInput("");
      setLoading(true);
      setError(null);

      try {
        // Only include last 8 turns in history sent to backend
        const historyToSend = [...history, userMsg].slice(-8);
        const response = await sendTutorMessage(
          childId,
          trimmed,
          contextWordId,
          historyToSend,
        );
        setHistory((prev) => [
          ...prev,
          { role: "assistant", content: response.answer },
        ]);
      } catch {
        setError("唔好意思，暫時無法連接。請稍後再試。");
      } finally {
        setLoading(false);
        inputRef.current?.focus();
      }
    },
    [childId, contextWordId, history, loading],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      sendMessage(input);
    },
    [input, sendMessage],
  );

  const handleClear = useCallback(() => {
    setHistory([
      {
        role: "assistant",
        content: "你好！我係小博士 👋 你想問我關於廣東話詞彙嘅咩問題？",
      },
    ]);
    setError(null);
  }, []);

  return (
    <div
      className={cn(
        "flex flex-col bg-gradient-to-b from-amber-50 to-white rounded-3xl border border-amber-100 overflow-hidden shadow-lg",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-amber-400 text-white">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          <span className="font-bold text-base">小博士 AI 助手</span>
        </div>
        <button
          onClick={handleClear}
          className="hover:bg-amber-500 rounded-full p-1.5 transition-colors"
          title="清除對話"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Safety notice */}
      <div className="px-4 py-2 bg-amber-50 border-b border-amber-100">
        <p className="child-tab-copy !text-xs !text-amber-700">
          🔒 家長監控模式 | 只回答廣東話詞彙問題
        </p>
      </div>

      {/* Messages area */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0"
        style={{ maxHeight: "320px" }}
      >
        {history.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}

        {/* Loading bubble */}
        {loading && (
          <div className="flex items-end gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-white shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-amber-300 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-amber-300 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-amber-300 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="child-tab-copy !text-xs !text-center !text-red-500">
            {error}
          </p>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Starter questions */}
      {history.length <= 1 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          {STARTERS.map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-full px-3 py-1.5 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 px-4 py-3 border-t border-amber-100 bg-white"
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="問小博士一個問題…"
          disabled={loading}
          className="flex-1 text-sm rounded-full border border-slate-200 px-4 py-2 focus:outline-none focus:border-amber-400 disabled:opacity-50 transition-colors"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className={cn(
            "w-9 h-9 rounded-full flex items-center justify-center text-white shadow-sm transition-all",
            input.trim() && !loading
              ? "bg-amber-400 hover:bg-amber-500 active:scale-95"
              : "bg-slate-200 cursor-not-allowed",
          )}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
