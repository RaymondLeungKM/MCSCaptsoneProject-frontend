"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Volume2, Sparkles, Loader2 } from "lucide-react";
import { LanguagePreference } from "@/lib/types";
import { useSpeech } from "@/hooks/use-speech";

interface GeneratedSentence {
  id: number;
  sentence: string;
  sentence_english: string;
  jyutping: string;
  context: string;
  difficulty: string;
  created_at: string;
}

interface AISentencesProps {
  wordId: string;
  languagePreference: LanguagePreference;
}

export function AISentences({ wordId, languagePreference }: AISentencesProps) {
  const [sentences, setSentences] = useState<GeneratedSentence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const { speak } = useSpeech();

  const showCantonese =
    languagePreference === "cantonese" || languagePreference === "bilingual";
  const showEnglish =
    languagePreference === "english" || languagePreference === "bilingual";

  useEffect(() => {
    async function fetchSentences() {
      try {
        setLoading(true);
        const response = await fetch(
          `http://localhost:8000/api/v1/vocabulary/${wordId}/sentences`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch sentences");
        }

        const data = await response.json();
        setSentences(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching AI sentences:", err);
        setError("Could not load sentences");
      } finally {
        setLoading(false);
      }
    }

    fetchSentences();
  }, [wordId]);

  const playSentence = (sentence: GeneratedSentence) => {
    const textToSpeak =
      languagePreference === "english"
        ? sentence.sentence_english
        : sentence.sentence;

    setPlayingId(sentence.id);
    speak(textToSpeak, {
      rate: 0.7,
      pitch: 1.1,
      onEnd: () => setPlayingId(null),
      onError: () => setPlayingId(null),
    });
  };

  if (loading) {
    return (
      <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
        <div className="flex items-center justify-center gap-2 text-purple-700 dark:text-purple-300">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading AI sentences...</span>
        </div>
      </Card>
    );
  }

  if (error || sentences.length === 0) {
    return null; // Don't show anything if no sentences available
  }

  return (
    <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-200 dark:border-purple-800">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h4 className="font-semibold text-purple-900 dark:text-purple-100">
            Example Sentences
          </h4>
          <span className="text-xs bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 px-2 py-1 rounded-full">
            {sentences.length} sentences
          </span>
        </div>

        {/* Sentences List */}
        <div className="space-y-3">
          {sentences.map((sent, index) => (
            <div
              key={sent.id}
              className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-purple-100 dark:border-purple-800 hover:border-purple-300 dark:hover:border-purple-600 transition-colors"
            >
              <div className="flex items-start gap-2">
                {/* Sentence Number */}
                <div className="flex-shrink-0 w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </div>

                {/* Content */}
                <div className="flex-1 space-y-1">
                  {/* Cantonese Sentence */}
                  {showCantonese && (
                    <div>
                      <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                        {sent.sentence}
                      </p>
                      {sent.jyutping && (
                        <p className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">
                          {sent.jyutping}
                        </p>
                      )}
                    </div>
                  )}

                  {/* English Translation */}
                  {showEnglish && (
                    <p
                      className={`text-sm ${
                        languagePreference === "bilingual"
                          ? "text-gray-600 dark:text-gray-400 italic"
                          : "text-gray-900 dark:text-gray-100"
                      }`}
                    >
                      {sent.sentence_english}
                    </p>
                  )}

                  {/* Context Badge */}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded">
                      📍 {sent.context}
                    </span>
                    <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded">
                      {sent.difficulty}
                    </span>
                  </div>
                </div>

                {/* Play Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => playSentence(sent)}
                  disabled={playingId === sent.id}
                  className="flex-shrink-0"
                >
                  <Volume2
                    className={`w-4 h-4 ${
                      playingId === sent.id
                        ? "text-purple-600 animate-pulse"
                        : "text-gray-500"
                    }`}
                  />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
