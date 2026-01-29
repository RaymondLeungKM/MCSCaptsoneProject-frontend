"use client";

import { useState, useEffect } from "react";
import { Volume2, CheckCircle, XCircle } from "lucide-react";
import { useSpeech } from "@/lib/speech";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestSpeechPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [lastError, setLastError] = useState<string>("");
  const [lastSuccess, setLastSuccess] = useState<string>("");
  const [isMounted, setIsMounted] = useState(false);
  const [voiceCount, setVoiceCount] = useState(0);
  const { speak, stop, isAvailable } = useSpeech();

  // Only check availability after mounting to avoid hydration errors
  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setVoiceCount(window.speechSynthesis.getVoices().length);
      // Update voice count when they load
      const updateVoices = () => {
        setVoiceCount(window.speechSynthesis.getVoices().length);
      };
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  const testBasicSpeech = () => {
    setLastError("");
    setLastSuccess("");

    speak("Hello, this is a test", {
      rate: 0.8,
      pitch: 1.0,
      onStart: () => {
        setIsPlaying(true);
        setLastSuccess("Speech started successfully!");
      },
      onEnd: () => {
        setIsPlaying(false);
        setLastSuccess("Speech completed!");
      },
      onError: (error) => {
        setIsPlaying(false);
        setLastError(`Error: ${error}`);
      },
    });
  };

  const testWord = () => {
    setLastError("");
    setLastSuccess("");

    speak("Elephant", {
      rate: 0.7,
      pitch: 1.2,
      onStart: () => {
        setIsPlaying(true);
        setLastSuccess("Word speech started!");
      },
      onEnd: () => {
        setIsPlaying(false);
        setLastSuccess("Word speech completed!");
      },
      onError: (error) => {
        setIsPlaying(false);
        setLastError(`Error: ${error}`);
      },
    });
  };

  const stopSpeech = () => {
    stop();
    setIsPlaying(false);
    setLastSuccess("Speech stopped");
  };

  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold">Speech Synthesis Test Page</h1>

        <Card>
          <CardHeader>
            <CardTitle>Browser Compatibility</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              {!isMounted ? (
                <span className="text-muted-foreground">Checking...</span>
              ) : isAvailable() ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Speech Synthesis is available in your browser</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-red-500" />
                  <span>Speech Synthesis is NOT available</span>
                </>
              )}
            </div>
            {isMounted && (
              <div className="text-sm text-muted-foreground mt-4">
                <p>User Agent: {window.navigator.userAgent}</p>
                <p className="mt-2">Voices available: {voiceCount}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Button onClick={testBasicSpeech} disabled={isPlaying} size="lg">
                <Volume2 className="w-5 h-5 mr-2" />
                Test Basic Speech
              </Button>

              <Button
                onClick={testWord}
                disabled={isPlaying}
                size="lg"
                variant="secondary"
              >
                <Volume2 className="w-5 h-5 mr-2" />
                Test Word "Elephant"
              </Button>

              <Button
                onClick={stopSpeech}
                disabled={!isPlaying}
                size="lg"
                variant="destructive"
              >
                Stop Speech
              </Button>
            </div>

            {isPlaying && (
              <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <p className="text-blue-900 dark:text-blue-100 font-medium">
                  🔊 Speaking...
                </p>
              </div>
            )}

            {lastSuccess && (
              <div className="p-4 bg-green-100 dark:bg-green-900 rounded-lg">
                <p className="text-green-900 dark:text-green-100">
                  ✓ {lastSuccess}
                </p>
              </div>
            )}

            {lastError && (
              <div className="p-4 bg-red-100 dark:bg-red-900 rounded-lg">
                <p className="text-red-900 dark:text-red-100">✗ {lastError}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Browser Console</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Open your browser's developer console (F12 or right-click →
              Inspect) to see detailed speech logs with [Speech] prefix.
            </p>
          </CardContent>
        </Card>

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
