"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Check, Clock, Star, Volume2, ChevronRight, User, Calendar as CalendarIcon } from "lucide-react";
import type { ProgressStats, Word } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useSpeech } from "@/lib/speech";
import { getWordsWithProgress, toWord } from "@/lib/api/vocabulary";
import { getAuthToken } from "@/lib/api/client";
import { WordDetailsModal } from "@/components/modals/word-details-modal";

interface ProgressTabProps {
  childId: string;
  stats: ProgressStats;
  words: Word[];
}

export function ProgressTab({ childId, stats, words }: ProgressTabProps) {
  const [realWords, setRealWords] = useState<Word[]>(words);
  const [realStats, setRealStats] = useState<ProgressStats>(stats);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "mastered" | "learning">("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);
  const [selectedWordMeta, setSelectedWordMeta] = useState<{ createdByChild?: boolean; createdAt?: string; lastPracticed?: string }>({});
  const [modalOpen, setModalOpen] = useState(false);
  const { speak } = useSpeech();

  // Check if we have a real child ID (not mock)
  const isMockData =
    !childId ||
    childId === "1" ||
    childId === "mock-child-id" ||
    childId.length < 10;

  // Fetch real data if we have a real child ID
  useEffect(() => {
    async function loadRealData() {
      if (isMockData) {
        setLoading(false);
        return;
      }

      try {
        const token = getAuthToken();
        if (!token) {
          console.log("No auth token, using mock data");
          setLoading(false);
          return;
        }

        // Fetch all words with progress for this child
        const wordsData = await getWordsWithProgress(childId);
        const loadedWords = wordsData.map((w) => {
          const word = toWord(w, w.progress);
          // Store additional metadata we'll need for the modal
          (word as any)._createdByChildId = w.created_by_child_id;
          (word as any)._createdAt = w.created_at;
          return word;
        });

        // Calculate real stats from loaded words
        const totalWords = loadedWords.length;
        const masteredWords = loadedWords.filter((w) => w.mastered).length;

        setRealWords(loadedWords);
        setRealStats({
          totalWords,
          masteredWords,
          weeklyProgress: [], // Not needed for progress tab
          categoryProgress: [], // Not needed for progress tab
        });

        console.log(`Loaded ${totalWords} words, ${masteredWords} mastered`);
      } catch (error) {
        console.error("Failed to load word progress:", error);
        // Keep using mock data on error
      } finally {
        setLoading(false);
      }
    }

    loadRealData();
  }, [childId, isMockData]);

  const filteredWords = realWords.filter((word) => {
    const matchesSearch = 
      word.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (word.word_cantonese?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter =
      filter === "all" ||
      (filter === "mastered" && word.mastered) ||
      (filter === "learning" && !word.mastered);
    const matchesCategory = selectedCategory === "all" || word.category === selectedCategory;
    return matchesSearch && matchesFilter && matchesCategory;
  });

  // Group words by category for better organization
  const wordsByCategory = filteredWords.reduce((acc, word) => {
    const category = word.categoryName || word.category || "Other";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(word);
    return acc;
  }, {} as Record<string, Word[]>);

  // Get unique categories from all words
  const allCategories = Array.from(
    new Set(realWords.map(word => word.categoryName || word.category || "Other"))
  ).sort();

  const playWord = (wordText: string) => {
    speak(wordText, {
      rate: 0.7,
      pitch: 1.2,
    });
  };

  const handleWordClick = (word: Word) => {
    setSelectedWord(word);
    const wordAny = word as any;
    setSelectedWordMeta({
      createdByChild: !!wordAny._createdByChildId,
      createdAt: wordAny._createdAt,
      lastPracticed: word.lastPracticed?.toString(),
    });
    setModalOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-2">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-foreground">
              {realStats.totalWords}
            </p>
            <p className="text-sm text-muted-foreground">Total Words</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-mint/50">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-mint">
              {realStats.masteredWords}
            </p>
            <p className="text-sm text-muted-foreground">Mastered</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-sunny/50">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-sunny">
              {realStats.totalWords - realStats.masteredWords}
            </p>
            <p className="text-sm text-muted-foreground">In Progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Word List */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-lg">Word Library</CardTitle>
          <div className="flex flex-col gap-3 mt-3">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search words..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            {/* Filters Row */}
            <div className="flex flex-wrap gap-2">
              {/* Status Filter */}
              {(["all", "mastered", "learning"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize",
                    filter === f
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80",
                  )}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedCategory("all")}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                  selectedCategory === "all"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80",
                )}
              >
                All Categories
              </button>
              {allCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(
                    realWords.find(w => (w.categoryName || w.category) === category)?.category || category
                  )}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                    selectedCategory === realWords.find(w => (w.categoryName || w.category) === category)?.category
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80",
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {selectedCategory === "all" ? (
            // Group by category view
            <div className="space-y-6">
              {Object.entries(wordsByCategory).map(([category, categoryWords]) => (
                <div key={category}>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    {category}
                    <Badge variant="outline">{categoryWords.length}</Badge>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {categoryWords.map((word) => (
                      <div
                        key={word.id}
                        onClick={() => handleWordClick(word)}
                        className={cn(
                          "relative flex flex-col p-3 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md",
                          word.mastered ? "border-mint/30 bg-mint/5" : "border-border",
                        )}
                      >
                        {/* Image */}
                        <div className="relative w-full h-32 rounded-lg overflow-hidden bg-muted mb-2">
                          <img
                            src={word.image || "/placeholder.svg"}
                            alt={word.word}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/placeholder.svg";
                            }}
                          />
                          {/* Status Badge */}
                          <div className="absolute top-2 right-2">
                            <div
                              className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center",
                                word.mastered ? "bg-mint" : "bg-sunny/80",
                              )}
                            >
                              {word.mastered ? (
                                <Check className="w-4 h-4 text-white" />
                              ) : (
                                <Clock className="w-4 h-4 text-white" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Word Info */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="font-bold text-foreground">{word.word}</h4>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                playWord(word.word);
                              }}
                              className="p-1 rounded-full hover:bg-muted transition-colors"
                              aria-label={`Listen to ${word.word}`}
                            >
                              <Volume2 className="w-3 h-3 text-muted-foreground" />
                            </button>
                          </div>
                          {word.word_cantonese && (
                            <p className="text-sm text-muted-foreground mb-2">{word.word_cantonese}</p>
                          )}
                          
                          {/* Progress Stars */}
                          <div className="flex gap-0.5 mt-2">
                            {[...Array(6)].map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  "w-3 h-3",
                                  i < word.exposureCount
                                    ? "text-sunny fill-sunny"
                                    : "text-muted",
                                )}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {Object.keys(wordsByCategory).length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No words found matching your search.
                  </p>
                </div>
              )}
            </div>
          ) : (
            // Single category view - same layout
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredWords.map((word) => (
                <div
                  key={word.id}
                  onClick={() => handleWordClick(word)}
                  className={cn(
                    "relative flex flex-col p-3 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md",
                    word.mastered ? "border-mint/30 bg-mint/5" : "border-border",
                  )}
                >
                  {/* Image */}
                  <div className="relative w-full h-32 rounded-lg overflow-hidden bg-muted mb-2">
                    <img
                      src={word.image || "/placeholder.svg"}
                      alt={word.word}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder.svg";
                      }}
                    />
                    {/* Status Badge */}
                    <div className="absolute top-2 right-2">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center",
                          word.mastered ? "bg-mint" : "bg-sunny/80",
                        )}
                      >
                        {word.mastered ? (
                          <Check className="w-4 h-4 text-white" />
                        ) : (
                          <Clock className="w-4 h-4 text-white" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Word Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-bold text-foreground">{word.word}</h4>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          playWord(word.word);
                        }}
                        className="p-1 rounded-full hover:bg-muted transition-colors"
                        aria-label={`Listen to ${word.word}`}
                      >
                        <Volume2 className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </div>
                    {word.word_cantonese && (
                      <p className="text-sm text-muted-foreground mb-2">{word.word_cantonese}</p>
                    )}
                    
                    {/* Progress Stars */}
                    <div className="flex gap-0.5 mt-2">
                      {[...Array(6)].map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "w-3 h-3",
                            i < word.exposureCount
                              ? "text-sunny fill-sunny"
                              : "text-muted",
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              {filteredWords.length === 0 && (
                <div className="col-span-full text-center py-8">
                  <p className="text-muted-foreground">
                    No words found matching your search.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Word Details Modal */}
      <WordDetailsModal 
        word={selectedWord}
        open={modalOpen}
        onOpenChange={setModalOpen}
        createdByChild={selectedWordMeta.createdByChild}
        createdAt={selectedWordMeta.createdAt}
        lastPracticed={selectedWordMeta.lastPracticed}
      />

      {/* Learning Tips */}
      <Card className="border-2 border-sky/30 bg-sky/5">
        <CardContent className="p-4">
          <h3 className="font-bold text-foreground mb-2">Learning Tip</h3>
          <p className="text-sm text-muted-foreground">
            Children typically need 6-12 exposures to a word in different
            contexts before it becomes part of their permanent vocabulary. Keep
            practicing with the words that have fewer stars!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
