"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Brain,
  CheckCircle2,
  Loader2,
  Volume2,
} from "lucide-react";
import type { ChildProfile, ReviewQueue, ReviewResult } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getReviewQueue, submitReview } from "@/lib/api/phase8";
import { useSpeech } from "@/lib/speech";
import {
  DEFAULT_REVISION_QUESTION_COUNT,
  getRevisionQuestionCount,
} from "@/lib/revision-preferences";

interface RevisionLabViewProps {
  profile: ChildProfile;
  onPlayAudio?: (url: string) => void;
}

type ChallengeState = {
  options: string[];
  correctOption: string;
};

function shuffleArray<T>(values: T[]): T[] {
  const next = [...values];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const temp = next[index];
    next[index] = next[swapIndex];
    next[swapIndex] = temp;
  }
  return next;
}

function getCardLabel(card: ReviewQueue["cards"][number]): string {
  return card.word_cantonese?.trim() || card.word?.trim() || "(未知詞語)";
}

function buildChallenge(
  queue: ReviewQueue,
  cardIndex: number,
): ChallengeState | null {
  const currentCard = queue.cards[cardIndex];
  if (!currentCard) {
    return null;
  }

  const correctOption = getCardLabel(currentCard);
  const distractors = queue.cards
    .filter((card, index) => index !== cardIndex)
    .map((card) => getCardLabel(card))
    .filter((label) => label && label !== correctOption);

  const uniqueDistractors = Array.from(new Set(distractors));
  const pickedDistractors = shuffleArray(uniqueDistractors).slice(0, 3);
  const options = shuffleArray([correctOption, ...pickedDistractors]);

  if (options.length < 2) {
    return null;
  }

  return { options, correctOption };
}

function StatusCard({
  title,
  description,
  tone,
  icon: Icon,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  tone: string;
  icon: typeof Brain;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-4xl border border-white/70 bg-linear-to-br from-white via-sky-50/70 to-indigo-100/70 p-8 text-center shadow-[0_16px_40px_rgba(30,58,138,0.14)] backdrop-blur-md">
      <div className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full bg-yellow-200/60 blur-xl" />
      <div className="pointer-events-none absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-sky-200/60 blur-xl" />
      <div className="pointer-events-none absolute right-6 top-5 text-xl opacity-70">
        ✨
      </div>
      <div className="pointer-events-none absolute left-6 top-7 text-lg opacity-60">
        ⭐
      </div>
      <div
        className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ring-4 ring-white/70 ${tone}`}
      >
        <Icon className="h-8 w-8" />
      </div>
      <h2 className="mt-5 text-2xl font-black text-slate-800">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm font-semibold text-slate-500">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button
          type="button"
          className="mt-5 rounded-full bg-linear-to-r from-sky-500 to-indigo-500 px-6 font-black text-white shadow-sm hover:from-sky-600 hover:to-indigo-600"
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export function RevisionLabView({
  profile,
  onPlayAudio,
}: RevisionLabViewProps) {
  const { speak, isAvailable } = useSpeech();
  const [queue, setQueue] = useState<ReviewQueue | null>(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<ReviewResult | null>(null);
  const [sessionQuestionTarget, setSessionQuestionTarget] = useState(
    DEFAULT_REVISION_QUESTION_COUNT,
  );

  const [attemptCount, setAttemptCount] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isResolved, setIsResolved] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [derivedQuality, setDerivedQuality] = useState<0 | 1 | 2 | 3 | 4 | 5>(
    2,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    setLastResult(null);

    try {
      const targetCards = getRevisionQuestionCount(profile.id);
      setSessionQuestionTarget(targetCards);
      const reviewQueue = await getReviewQueue(
        profile.id,
        targetCards,
        targetCards,
      );
      setQueue(reviewQueue);
      setCardIndex(0);
    } catch {
      setError("無法載入複習卡。請稍後再試。");
    } finally {
      setLoading(false);
    }
  }, [profile.id]);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  const challenge = useMemo(() => {
    if (!queue) {
      return null;
    }

    return buildChallenge(queue, cardIndex);
  }, [queue, cardIndex]);

  useEffect(() => {
    setAttemptCount(0);
    setSelectedOption(null);
    setIsResolved(false);
    setIsCorrect(false);
    setDerivedQuality(2);
  }, [cardIndex]);

  const currentCard = queue?.cards[cardIndex] ?? null;

  const handleOptionSelect = useCallback(
    (option: string) => {
      if (!challenge || isResolved) {
        return;
      }

      setSelectedOption(option);
      const correct = option === challenge.correctOption;

      if (correct) {
        setIsCorrect(true);
        setIsResolved(true);
        setDerivedQuality(attemptCount === 0 ? 4 : 3);
        return;
      }

      if (attemptCount === 0) {
        setAttemptCount(1);
        return;
      }

      setIsCorrect(false);
      setIsResolved(true);
      setDerivedQuality(1);
    },
    [attemptCount, challenge, isResolved],
  );

  const handleContinue = useCallback(async () => {
    if (!queue || !currentCard || !isResolved || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitReview(
        profile.id,
        currentCard.word_id,
        derivedQuality,
      );
      setLastResult(result);
    } catch {
      setLastResult({
        word_id: currentCard.word_id,
        new_interval: 1,
        easiness_factor: 2.5,
        next_review: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        is_graduated: false,
        message: "已記錄本次結果，繼續下一張。",
      });
    } finally {
      setIsSubmitting(false);
      setCardIndex((index) => index + 1);
    }
  }, [
    currentCard,
    derivedQuality,
    isResolved,
    isSubmitting,
    profile.id,
    queue,
  ]);

  const speechText =
    currentCard?.word_cantonese?.trim() || currentCard?.word?.trim() || "";

  const handlePlayWordAudio = useCallback(() => {
    if (!speechText) {
      return;
    }

    const started = speak(speechText, {
      rate: 0.82,
      pitch: 1.08,
      lang: "yue-Hant-HK",
    });

    // Fallback path only when native speech cannot start.
    if (!started && onPlayAudio && currentCard?.audio_url) {
      onPlayAudio(currentCard.audio_url);
    }
  }, [currentCard?.audio_url, onPlayAudio, speak, speechText]);

  if (loading) {
    return (
      <StatusCard
        title="載入複習中"
        description="正在準備今天的測驗。"
        tone="bg-indigo-100 text-indigo-600"
        icon={Loader2}
      />
    );
  }

  if (error) {
    return (
      <StatusCard
        title="複習暫時不可用"
        description={error}
        tone="bg-rose-100 text-rose-500"
        icon={AlertCircle}
        actionLabel="重新載入"
        onAction={() => void loadQueue()}
      />
    );
  }

  if (!queue || queue.cards.length === 0) {
    return (
      <StatusCard
        title="今天暫時沒有複習卡"
        description="太好了，今天需要重溫的詞語已經完成。"
        tone="bg-emerald-100 text-emerald-600"
        icon={CheckCircle2}
        actionLabel="重新檢查"
        onAction={() => void loadQueue()}
      />
    );
  }

  if (cardIndex >= queue.cards.length) {
    return (
      <StatusCard
        title="本輪複習完成"
        description={`做得好，${profile.name} 已完成 ${queue.cards.length} 題測驗。`}
        tone="bg-emerald-100 text-emerald-600"
        icon={CheckCircle2}
        actionLabel="再來一輪"
        onAction={() => void loadQueue()}
      />
    );
  }

  if (!currentCard || !challenge) {
    return (
      <StatusCard
        title="測驗資料不足"
        description="目前選項不足以生成測驗，請稍後再試。"
        tone="bg-amber-100 text-amber-700"
        icon={AlertCircle}
        actionLabel="重新載入"
        onAction={() => void loadQueue()}
      />
    );
  }

  const completedCards = cardIndex;
  const progressValue = Math.min(
    Math.round((completedCards / queue.cards.length) * 100),
    100,
  );

  const promptText =
    currentCard.definition_cantonese?.trim() || "請選出正確的詞語";

  return (
    <section className="relative space-y-4 overflow-hidden rounded-4xl bg-linear-to-b from-sky-900/80 via-blue-900/80 to-indigo-900/80 p-4 sm:p-5">
      <div className="pointer-events-none absolute -left-14 top-20 h-32 w-32 rounded-full bg-sky-300/20 blur-md" />
      <div className="pointer-events-none absolute -right-10 bottom-16 h-36 w-36 rounded-full bg-indigo-200/20 blur-md" />
      <div className="pointer-events-none absolute left-5 top-6 text-xl">
        ⭐
      </div>
      <div className="pointer-events-none absolute right-7 top-10 text-lg">
        ✨
      </div>
      <div className="pointer-events-none absolute bottom-7 left-8 text-xl">
        🌟
      </div>

      <div className="relative rounded-[1.75rem] border border-white/70 bg-white/88 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.16)] backdrop-blur-md">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-800">複習小測驗 🎯</h2>
          <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-black text-indigo-600">
            {cardIndex + 1}/{queue.cards.length}
          </span>
        </div>
        <Progress
          value={progressValue}
          className="h-3 rounded-full bg-slate-100"
          indicatorClassName="bg-linear-to-r from-yellow-400 via-sky-400 to-indigo-500"
        />
        <p className="mt-2 text-xs font-semibold text-slate-500">
          本輪目標 {sessionQuestionTarget} 題，答對得越快，系統越相信你已掌握！
        </p>
      </div>

      {lastResult && (
        <div className="relative rounded-2xl border border-indigo-200 bg-linear-to-r from-indigo-50 to-sky-50 px-4 py-3 text-center text-sm font-bold text-indigo-700 shadow-sm">
          <span className="pointer-events-none absolute -right-1 -top-2 text-base">
            💬
          </span>
          {lastResult.message}
        </div>
      )}

      <div className="relative rounded-[1.75rem] border border-white/70 bg-white/90 p-5 shadow-[0_12px_28px_rgba(15,23,42,0.16)] backdrop-blur-sm space-y-4">
        <div className="pointer-events-none absolute right-4 top-4 text-lg opacity-70">
          🧠
        </div>
        <div className="space-y-1">
          <p className="text-xs font-black tracking-wide text-indigo-500">
            題目
          </p>
          <p className="text-lg font-black text-slate-700 leading-relaxed">
            {promptText}
          </p>
          {speechText && (
            <div className="pt-1">
              <Button
                type="button"
                variant="outline"
                className="rounded-full border-sky-200 bg-white font-black text-sky-700 hover:bg-sky-50 disabled:opacity-60"
                onClick={handlePlayWordAudio}
                disabled={!isAvailable()}
              >
                <Volume2 className="mr-2 h-4 w-4" />
                {isAvailable() ? "播放發音" : "語音不可用"}
              </Button>
            </div>
          )}
          {attemptCount > 0 && !isResolved && (
            <p className="text-sm font-bold text-rose-500">
              再試一次，你一定得！💪
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-2">
          {challenge.options.map((option) => {
            const isChosen = selectedOption === option;
            const isRight = option === challenge.correctOption;

            const tone = isResolved
              ? isRight
                ? "border-emerald-300 bg-emerald-50 text-emerald-700 shadow-[0_0_0_2px_rgba(16,185,129,0.15)]"
                : isChosen
                  ? "border-rose-300 bg-rose-50 text-rose-700"
                  : "border-slate-200 bg-white text-slate-600"
              : isChosen
                ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                : "border-slate-200 bg-white text-slate-700 hover:border-sky-200 hover:bg-sky-50/50";

            return (
              <button
                key={option}
                type="button"
                onClick={() => handleOptionSelect(option)}
                disabled={isResolved}
                className={`rounded-2xl border px-4 py-3 text-left text-lg font-black transition duration-200 active:scale-[0.98] ${tone}`}
              >
                {option}
              </button>
            );
          })}
        </div>

        {isResolved && (
          <div className="rounded-2xl border border-slate-200 bg-linear-to-br from-slate-50 to-sky-50 p-4 space-y-3">
            <p
              className={`text-base font-black ${
                isCorrect ? "text-emerald-600" : "text-amber-600"
              }`}
            >
              {isCorrect
                ? "答對了，超叻！🎉"
                : `正確答案：${challenge.correctOption}`}
            </p>

            <div className="text-sm text-slate-600 space-y-1">
              <p className="font-black text-slate-700 text-base">
                {getCardLabel(currentCard)}
              </p>
              {currentCard.jyutping && <p>{currentCard.jyutping}</p>}
              {currentCard.definition_cantonese && (
                <p>{currentCard.definition_cantonese}</p>
              )}
            </div>

            <Button
              type="button"
              className="w-full rounded-full bg-linear-to-r from-indigo-500 via-sky-500 to-cyan-500 font-black text-white shadow-sm hover:from-indigo-600 hover:via-sky-600 hover:to-cyan-600"
              onClick={() => void handleContinue()}
              disabled={isSubmitting}
            >
              {isSubmitting ? "記錄中..." : "下一題"}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
