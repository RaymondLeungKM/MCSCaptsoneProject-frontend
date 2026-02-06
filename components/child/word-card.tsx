import React from "react";
import { Word, LanguagePreference } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Volume2 } from "lucide-react";

interface WordCardProps {
  word: Word;
  languagePreference: LanguagePreference;
  onPlayAudio?: () => void;
  onClick?: () => void;
  className?: string;
}

export function WordCard({
  word,
  languagePreference,
  onPlayAudio,
  onClick,
  className = "",
}: WordCardProps) {
  const showCantonese =
    languagePreference === "cantonese" || languagePreference === "bilingual";
  const showEnglish =
    languagePreference === "english" || languagePreference === "bilingual";

  return (
    <Card
      className={`
        relative overflow-hidden transition-all duration-300 hover:shadow-lg
        cursor-pointer group ${className}
      `}
      onClick={onClick}
    >
      {/* Progress indicator for mastered words */}
      {word.mastered && (
        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
          ✓ Mastered
        </div>
      )}

      <div className="p-6 space-y-4">
        {/* Image/Icon */}
        <div className="flex justify-center">
          {word.image && word.image.startsWith("http") ? (
            <img
              src={word.image}
              alt={word.word}
              className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-lg"
            />
          ) : (
            <div className="text-6xl sm:text-7xl">{word.image || "📝"}</div>
          )}
        </div>

        {/* Word Display */}
        <div className="text-center space-y-2">
          {/* Cantonese Word (Primary if Cantonese mode) */}
          {showCantonese && word.word_cantonese && (
            <div>
              <h3 className="text-3xl sm:text-4xl font-bold text-primary">
                {word.word_cantonese}
              </h3>
              {word.jyutping && (
                <p className="text-sm sm:text-base text-muted-foreground mt-1">
                  {word.jyutping}
                </p>
              )}
            </div>
          )}

          {/* English Word (shown below in bilingual mode) */}
          {showEnglish && (
            <h4
              className={`
                font-semibold
                ${languagePreference === "bilingual" ? "text-xl text-muted-foreground" : "text-3xl sm:text-4xl text-primary"}
              `}
            >
              {word.word}
            </h4>
          )}

          {/* Audio Button */}
          {(word.audio_url || word.audio_url_english) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onPlayAudio?.();
              }}
              className="mx-auto mt-2"
            >
              <Volume2 className="w-4 h-4 mr-2" />
              Play Sound
            </Button>
          )}
        </div>

        {/* Definition */}
        <div className="space-y-2 text-center border-t pt-4">
          {showCantonese && word.definition_cantonese && (
            <p className="text-base font-medium text-foreground">
              {word.definition_cantonese}
            </p>
          )}
          {showEnglish && (
            <p
              className={`
                text-sm
                ${languagePreference === "bilingual" ? "text-muted-foreground" : "text-foreground"}
              `}
            >
              {word.definition}
            </p>
          )}
        </div>

        {/* Example Sentence */}
        {(showCantonese && word.example_cantonese) ||
        (showEnglish && word.example) ? (
          <div className="bg-accent/30 rounded-lg p-3 space-y-1">
            <p className="text-xs font-semibold text-muted-foreground">
              Example:
            </p>
            {showCantonese && word.example_cantonese && (
              <p className="text-sm font-medium">{word.example_cantonese}</p>
            )}
            {showEnglish && (
              <p
                className={`
                  text-xs
                  ${languagePreference === "bilingual" ? "text-muted-foreground italic" : "text-sm"}
                `}
              >
                {word.example}
              </p>
            )}
          </div>
        ) : null}

        {/* Physical Action (if available) */}
        {word.physicalAction && (
          <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3">
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">
              🙌 Try this action:
            </p>
            <p className="text-sm text-blue-900 dark:text-blue-100">
              {word.physicalAction}
            </p>
          </div>
        )}

        {/* Exposure Count */}
        <div className="flex justify-between items-center text-xs text-muted-foreground pt-2">
          <span>Difficulty: {word.difficulty}</span>
          <span>Practiced: {word.exposureCount} times</span>
        </div>
      </div>
    </Card>
  );
}

export default WordCard;
