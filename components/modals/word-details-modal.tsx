"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Volume2, Star, Check, Clock, User, Calendar as CalendarIcon } from "lucide-react";
import { useSpeech } from "@/hooks/use-speech";
import type { Word } from "@/lib/types";
import { cn } from "@/lib/utils";

interface WordDetailsModalProps {
  word: Word | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  createdByChild?: boolean;
  createdAt?: string;
  lastPracticed?: string;
}

export function WordDetailsModal({ 
  word, 
  open, 
  onOpenChange,
  createdByChild = false,
  createdAt,
  lastPracticed
}: WordDetailsModalProps) {
  const { speak } = useSpeech();

  if (!word) return null;

  const playWord = (text: string, isCantonese: boolean = false) => {
    speak(text, {
      rate: isCantonese ? 0.7 : 0.8,
      pitch: 1.1,
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric", 
      year: "numeric" 
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Word Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Word Image */}
          {word.image && (
            <div className="relative w-full h-48 rounded-xl overflow-hidden bg-muted">
              <img
                src={word.image}
                alt={word.word}
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder.svg";
                }}
              />
            </div>
          )}

          {/* Main Word Info */}
          <div className="space-y-4">
            {/* English */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="text-3xl font-bold text-foreground">{word.word}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => playWord(word.word, false)}
                  className="p-2"
                >
                  <Volume2 className="w-5 h-5" />
                </Button>
              </div>
              {word.pronunciation && (
                <p className="text-sm text-muted-foreground italic">/{word.pronunciation}/</p>
              )}
            </div>

            {/* Cantonese */}
            {word.word_cantonese && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-3xl font-bold text-foreground">{word.word_cantonese}</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => playWord(word.word_cantonese || "", true)}
                    className="p-2"
                  >
                    <Volume2 className="w-5 h-5" />
                  </Button>
                </div>
                {word.jyutping && (
                  <p className="text-sm text-muted-foreground italic">{word.jyutping}</p>
                )}
              </div>
            )}

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="capitalize">
                {word.difficulty}
              </Badge>
              <Badge 
                variant="outline"
                className={cn(
                  word.mastered ? "bg-mint/20 text-mint border-mint" : "bg-sunny/20 text-sunny border-sunny"
                )}
              >
                {word.mastered ? (
                  <><Check className="w-3 h-3 mr-1" /> Mastered</>
                ) : (
                  <><Clock className="w-3 h-3 mr-1" /> Learning</>
                )}
              </Badge>
              {createdByChild && (
                <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">
                  <User className="w-3 h-3 mr-1" /> Child Created
                </Badge>
              )}
              <Badge variant="outline">
                {word.categoryName || word.category}
              </Badge>
            </div>
          </div>

          {/* Progress */}
          <div className="p-4 bg-muted rounded-xl">
            <h4 className="font-semibold mb-3">Learning Progress</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Exposures</span>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {[...Array(6)].map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "w-4 h-4",
                          i < word.exposureCount
                            ? "text-sunny fill-sunny"
                            : "text-muted"
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium">{word.exposureCount}/6</span>
                </div>
              </div>
              
              {lastPracticed && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Last Practiced</span>
                  <span className="text-sm font-medium">{formatDate(lastPracticed)}</span>
                </div>
              )}
              
              {createdAt && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Added On</span>
                  <span className="text-sm font-medium">{formatDate(createdAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Definition */}
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold mb-2">Definition</h4>
              <p className="text-foreground">{word.definition}</p>
              {word.definition_cantonese && (
                <p className="text-foreground mt-1">{word.definition_cantonese}</p>
              )}
            </div>

            {/* Example */}
            <div>
              <h4 className="font-semibold mb-2">Example</h4>
              <p className="text-foreground italic">&ldquo;{word.example}&rdquo;</p>
              {word.example_cantonese && (
                <p className="text-foreground italic mt-1">&ldquo;{word.example_cantonese}&rdquo;</p>
              )}
            </div>

            {/* Physical Action */}
            {word.physicalAction && (
              <div>
                <h4 className="font-semibold mb-2">Physical Action</h4>
                <p className="text-foreground">{word.physicalAction}</p>
              </div>
            )}
          </div>

          {/* Related Words */}
          {word.relatedWords && word.relatedWords.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Related Words</h4>
              <div className="flex flex-wrap gap-2">
                {word.relatedWords.map((related, idx) => (
                  <Badge key={idx} variant="secondary">
                    {related}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
