"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getAnalyticsCharts, getWordsByDate } from "@/lib/api/parent-dashboard";
import { WordDetailsModal } from "@/components/modals/word-details-modal";
import { cn } from "@/lib/utils";
import type { Word } from "@/lib/types";

interface LearningCalendarProps {
  childId: string;
}

interface WordData {
  id: string;
  word: string;
  word_cantonese?: string;
  jyutping?: string;
  image_url?: string;
  category: string;
  category_cantonese?: string;
  definition: string;
  definition_cantonese?: string;
  exposure_count: number;
  used_actively: boolean;
  mastery_confidence: number;
  created_at?: string;
}

export function LearningCalendar({ childId }: LearningCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [wordsPerDay, setWordsPerDay] = useState<Record<string, number>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedDateWords, setSelectedDateWords] = useState<WordData[]>([]);
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Load calendar data for current month
  useEffect(() => {
    loadMonthData();
  }, [childId, currentDate]);

  const loadMonthData = async () => {
    setLoading(true);
    try {
      // Get data for the past 30 days to cover the visible month
      const charts = await getAnalyticsCharts(childId, "month");
      
      // Build map of date -> word count
      const dateMap: Record<string, number> = {};
      charts.time_series.dates.forEach((date, idx) => {
        dateMap[date] = charts.time_series.words_learned[idx];
      });
      
      setWordsPerDay(dateMap);
    } catch (error) {
      console.error("Failed to load calendar data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadDateWords = async (dateStr: string) => {
    setDetailsLoading(true);
    setSelectedDate(dateStr);
    try {
      const response = await getWordsByDate(childId, dateStr);
      setSelectedDateWords(response.words);
    } catch (error) {
      console.error("Failed to load words for date:", error);
      setSelectedDateWords([]);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleWordClick = (wordData: WordData) => {
    // Convert WordData to Word type
    const word: Word = {
      id: wordData.id,
      word: wordData.word,
      word_cantonese: wordData.word_cantonese,
      jyutping: wordData.jyutping,
      image: wordData.image_url || "",
      category: wordData.category,
      categoryName: wordData.category,
      category_name_cantonese: wordData.category_cantonese,
      pronunciation: "",
      definition: wordData.definition,
      definition_cantonese: wordData.definition_cantonese,
      example: "",
      difficulty: "easy",
      mastered: wordData.exposure_count >= 6,
      exposureCount: wordData.exposure_count,
      contexts: [],
      relatedWords: [],
    };
    setSelectedWord(word);
    setModalOpen(true);
  };

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDate(null);
  };

  const nextMonth = () => {
    const today = new Date();
    const nextMonthDate = new Date(year, month + 1, 1);
    // Don't allow navigating to future months
    if (nextMonthDate <= today) {
      setCurrentDate(nextMonthDate);
      setSelectedDate(null);
    }
  };

  const canGoNext = () => {
    const today = new Date();
    const nextMonthDate = new Date(year, month + 1, 1);
    return nextMonthDate <= today;
  };

  // Generate calendar grid
  const calendarDays = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="aspect-square" />);
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    date.setHours(0, 0, 0, 0);
    const dateStr = date.toISOString().split("T")[0];
    const wordCount = wordsPerDay[dateStr] || 0;
    const isToday = date.getTime() === today.getTime();
    const isFuture = date > today;
    const isSelected = selectedDate === dateStr;

    calendarDays.push(
      <button
        key={day}
        onClick={() => !isFuture && loadDateWords(dateStr)}
        disabled={isFuture}
        className={cn(
          "aspect-square p-2 rounded-lg text-sm transition-all border-2",
          isFuture
            ? "border-transparent bg-muted/30 text-muted-foreground cursor-not-allowed"
            : "border-transparent hover:border-primary/30 hover:bg-muted cursor-pointer",
          isToday && "border-primary bg-primary/5",
          isSelected && "border-primary bg-primary/10",
          wordCount > 0 && !isFuture && "font-semibold"
        )}
      >
        <div className="flex flex-col items-center justify-center h-full gap-1">
          <span>{day}</span>
          {wordCount > 0 && !isFuture && (
            <Badge
              variant="secondary"
              className="h-5 px-1.5 text-xs bg-mint text-mint-foreground"
            >
              {wordCount}
            </Badge>
          )}
        </div>
      </button>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Calendar */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Learning Calendar</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={previousMonth}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[120px] text-center">
                {currentDate.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={nextMonth}
                disabled={!canGoNext()}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <>
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div
                    key={day}
                    className="text-center text-xs font-semibold text-muted-foreground py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>
              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">{calendarDays}</div>
              {/* Legend */}
              <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
                <p>Click on a date to see words learned that day</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Selected Date Words */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {selectedDate
                ? `Words Learned on ${new Date(selectedDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                : "Select a Date"}
            </CardTitle>
            {selectedDate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDate(null)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!selectedDate ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Click on a calendar date to view words learned that day
              </p>
            </div>
          ) : detailsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : selectedDateWords.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No words learned on this day</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {selectedDateWords.map((wordData) => (
                <div
                  key={wordData.id}
                  onClick={() => handleWordClick(wordData)}
                  className="flex items-center gap-3 p-3 rounded-lg border-2 hover:border-primary/50 cursor-pointer transition-all hover:shadow-md"
                >
                  {/* Image */}
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <img
                      src={wordData.image_url || "/placeholder.svg"}
                      alt={wordData.word}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder.svg";
                      }}
                    />
                  </div>
                  
                  {/* Word Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-foreground">{wordData.word}</h4>
                    {wordData.word_cantonese && (
                      <p className="text-sm text-muted-foreground">
                        {wordData.word_cantonese}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {wordData.category}
                      </Badge>
                      {wordData.used_actively && (
                        <Badge variant="outline" className="text-xs bg-mint/20 text-mint border-mint">
                          Active Use
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Word Details Modal */}
      <WordDetailsModal
        word={selectedWord}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}
