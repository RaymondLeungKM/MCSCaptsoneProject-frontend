"use client";

import { Button } from "@/components/ui/button";
import { VoiceRecognitionTester } from "@/components/testing/voice-recognition-tester";

export default function TestSpeechPage() {
  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold">Speech Test Page</h1>
        <VoiceRecognitionTester />

        <div className="flex gap-4">
          <Button
            onClick={() => (window.location.href = "/")}
            variant="outline"
          >
            ← Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
