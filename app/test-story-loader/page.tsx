"use client";

import { useState } from "react";
import { StoryGeneratingAnimation } from "@/components/child/story-generating-animation";
import { Button } from "@/components/ui/button";

export default function TestStoryLoaderPage() {
  const [isVisible, setIsVisible] = useState(true);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f8fff6_0%,#dff9f2_52%,#c9f2ff_100%)]">
      <StoryGeneratingAnimation isVisible={isVisible} />

      <div className="relative z-[60] mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-4 px-6 py-10 text-center">
        <span className="rounded-full bg-white/85 px-4 py-2 text-sm font-black text-emerald-700 shadow-sm">
          Loader QA Route
        </span>
        <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
          Story Loader Preview
        </h1>
        <p className="max-w-2xl text-base font-medium leading-7 text-slate-700 sm:text-lg">
          Use this page to review the story-generation overlay without auth or API latency.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 rounded-full bg-white/85 px-4 py-3 shadow-lg backdrop-blur">
          <Button onClick={() => setIsVisible(true)} className="rounded-full px-5">
            Show Loader
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsVisible(false)}
            className="rounded-full px-5"
          >
            Hide Loader
          </Button>
        </div>
      </div>
    </div>
  );
}
