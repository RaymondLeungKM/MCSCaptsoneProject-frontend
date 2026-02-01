"use client";

// Force dynamic rendering so query params (view, hideNav) are always respected
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ChildNavigation } from "@/components/child/navigation";
import { ProfileHeader } from "@/components/child/profile-header";
import { WordOfTheDay } from "@/components/child/word-of-the-day";
import { CategoryGrid } from "@/components/child/category-grid";
import { GamesList } from "@/components/child/game-card";
import { StoriesList } from "@/components/child/story-card";
import { useAuth } from "@/lib/auth-context";
import {
  getChildren,
  getCategories,
  getWordsWithProgress,
  getWordOfTheDay,
  toWord,
  toCategory,
  toChildProfile,
  updateChild,
} from "@/lib/api";
import { games, stories } from "@/lib/mock-data";
import type {
  Word,
  Category,
  Game,
  Story,
  ChildProfile,
  LanguagePreference,
} from "@/lib/types";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { iframeBridge } from "@/lib/iframe-bridge";

// Import views
import { LearnView } from "@/components/views/learn-view";
import { GamesView } from "@/components/views/games-view";
import { KinestheticGamesView } from "@/components/views/kinesthetic-games";
import { RewardsView } from "@/components/views/rewards-view";
import { ProfileView } from "@/components/views/profile-view";
import { WordLearningModal } from "@/components/modals/word-learning-modal";
import { StoryReaderModal } from "@/components/modals/story-reader-modal";
import { DialogicStoryModal } from "@/components/modals/dialogic-story-modal";
import { LanguageSelector } from "@/components/language-selector";
import { BedtimeStoryGenerator } from "@/components/child/bedtime-story";
import { BedtimeStoryReader } from "@/components/modals/bedtime-story-reader";
import type { GeneratedStory } from "@/lib/types";

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState("home");
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [useDialogicReading, setUseDialogicReading] = useState(true);
  const [hideNav, setHideNav] = useState(false);
  const [selectedBedtimeStory, setSelectedBedtimeStory] =
    useState<GeneratedStory | null>(null);

  // API data states
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [selectedChild, setSelectedChild] = useState<ChildProfile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [words, setWords] = useState<Word[]>([]);
  const [wordOfDay, setWordOfDay] = useState<Word | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data from API
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else {
        loadData();
      }
    }
  }, [user, authLoading, router]);

  // Handle query parameters
  useEffect(() => {
    // Handle view parameter (tab to display)
    const viewParam = searchParams.get("view") || searchParams.get("tab");
    if (
      viewParam &&
      ["home", "learn", "games", "rewards", "profile"].includes(viewParam)
    ) {
      setActiveTab(viewParam);
    }

    // Handle hideNav parameter
    const hideNavParam = searchParams.get("hideNav");
    if (hideNavParam === "true" || hideNavParam === "1") {
      setHideNav(true);
    }
  }, [searchParams]);

  // Setup iframe communication with mobile app
  useEffect(() => {
    console.log(
      "[HomePage] Setting up iframe bridge, isInIframe:",
      iframeBridge.isInIframe(),
    );

    // Listen for messages from mobile app
    const unsubscribeWordLearned = iframeBridge.on(
      "WORD_LEARNED",
      async (message: any) => {
        console.log("[HomePage] Received WORD_LEARNED from app:", message);

        if (!selectedChild) {
          console.warn(
            "[HomePage] No selected child, cannot record word learning",
          );
          return;
        }

        try {
          // Call the external word learning endpoint directly on the backend
          console.log("[HomePage] Sending word learning request:", {
            word: message.word,
            child_id: selectedChild.id,
            source: message.source || "object_detection",
          });

          const API_URL =
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
          const response = await fetch(
            `${API_URL}/vocabulary/external/word-learned`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                word: message.word,
                word_id: message.wordId,
                child_id: selectedChild.id,
                timestamp: message.timestamp || new Date().toISOString(),
                source: message.source || "object_detection",
                confidence: message.confidence,
                image_url: message.imageUrl,
                metadata: message.metadata,
              }),
            },
          );

          console.log(
            "[HomePage] Response status:",
            response.status,
            response.statusText,
          );

          if (!response.ok) {
            const errorText = await response.text();
            console.error("[HomePage] Raw error response:", errorText);

            let errorData;
            try {
              errorData = JSON.parse(errorText);
            } catch (e) {
              errorData = { detail: errorText || response.statusText };
            }

            console.error("[HomePage] Failed to record word learning:", {
              status: response.status,
              statusText: response.statusText,
              error: errorData,
            });
            throw new Error(
              `Failed to record word learning: ${response.status} ${errorData.error || errorData.detail || response.statusText}`,
            );
          }

          const result = await response.json();
          console.log("[HomePage] Word learning recorded:", result);

          // If word_data is included, show the word learning modal
          if (result.word_data) {
            console.log(
              "[HomePage] Opening word learning modal for:",
              result.word_data.word,
            );
            // Transform backend response (snake_case) to frontend format (camelCase)
            const wordData = {
              ...result.word_data,
              categoryName: result.word_data.category_name,
              physicalAction: result.word_data.physical_action,
              imageUrl: result.word_data.image_url,
              audioUrl: result.word_data.audio_url,
              relatedWords: result.word_data.related_words,
              totalExposures: result.word_data.total_exposures,
              successRate: result.word_data.success_rate,
              createdAt: result.word_data.created_at,
              exposureCount: result.exposure_count,
              mastered: false,
            };
            setSelectedWord(wordData);
          }

          // Refresh child data to update stats
          await refreshChildData();

          // Notify app of progress update
          iframeBridge.sendToApp({
            type: "PROGRESS_UPDATED",
            childId: selectedChild.id,
            xp: result.total_xp,
            level: result.level,
            wordsLearned: result.words_learned,
            todayProgress: selectedChild.todayProgress + 1,
          });
        } catch (error) {
          console.error("[HomePage] Failed to record word learning:", error);
        }
      },
    );

    const unsubscribeSetUser = iframeBridge.on(
      "SET_USER",
      async (message: any) => {
        console.log("[HomePage] Received SET_USER from app:", message);

        // If mobile app provides user/child ID, we can use it to select the child
        if (message.childId && children.length > 0) {
          const child = children.find((c) => c.id === message.childId);
          if (child) {
            setSelectedChild(child);
            console.log("[HomePage] Selected child from app:", child.name);
          }
        }
      },
    );

    const unsubscribeSyncProgress = iframeBridge.on(
      "SYNC_PROGRESS",
      async (message: any) => {
        console.log("[HomePage] Received SYNC_PROGRESS from app:", message);
        await refreshChildData();
      },
    );

    // Cleanup listeners on unmount
    return () => {
      unsubscribeWordLearned();
      unsubscribeSetUser();
      unsubscribeSyncProgress();
    };
  }, [selectedChild, children]);

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      // Load children profiles
      const childrenData = await getChildren();

      if (childrenData.length === 0) {
        router.push("/create-child");
        return;
      }

      const childrenProfiles = childrenData.map(toChildProfile);
      setChildren(childrenProfiles);
      setSelectedChild(childrenProfiles[0]);

      // Load categories
      const categoriesData = await getCategories();
      setCategories(categoriesData.map(toCategory));

      // Load words with progress
      const wordsData = await getWordsWithProgress(childrenProfiles[0].id);
      setWords(wordsData.map((w: any) => toWord(w, w.progress)));

      // Load word of the day
      try {
        const wordOfDayData = await getWordOfTheDay(childrenProfiles[0].id);
        const word = wordsData.find((w: any) => w.id === wordOfDayData.word_id);
        if (word) {
          setWordOfDay(toWord(word, word.progress));
        }
      } catch (err) {
        console.error("Failed to load word of the day:", err);
        // Use first word as fallback
        if (wordsData.length > 0) {
          setWordOfDay(toWord(wordsData[0], wordsData[0].progress));
        }
      }
    } catch (err: any) {
      console.error("Failed to load data:", err);
      setError(err.message || "Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function refreshChildData() {
    // Refresh child data without showing loading spinner
    if (!selectedChild) {
      console.log("No selected child, skipping refresh");
      return;
    }

    console.log("Refreshing child data...");
    try {
      const childrenData = await getChildren();
      const childrenProfiles = childrenData.map(toChildProfile);
      setChildren(childrenProfiles);

      // Update selected child with fresh data
      const updatedChild = childrenProfiles.find(
        (c) => c.id === selectedChild.id,
      );
      if (updatedChild) {
        console.log("Updated child stats:", {
          level: updatedChild.level,
          xp: updatedChild.xp,
          wordsLearned: updatedChild.wordsLearned,
          todayProgress: updatedChild.todayProgress,
        });
        setSelectedChild(updatedChild);

        // Notify mobile app of progress update
        iframeBridge.sendToApp({
          type: "PROGRESS_UPDATED",
          childId: updatedChild.id,
          xp: updatedChild.xp,
          level: updatedChild.level,
          wordsLearned: updatedChild.wordsLearned,
          todayProgress: updatedChild.todayProgress,
        });
      }

      // Refresh words with progress
      const wordsData = await getWordsWithProgress(selectedChild.id);
      setWords(wordsData.map((w: any) => toWord(w, w.progress)));

      console.log("Child data refreshed successfully");
    } catch (err) {
      console.error("Failed to refresh child data:", err);
    }
  }

  const handleLanguageChange = async (language: LanguagePreference) => {
    if (!selectedChild) return;

    console.log("[Language] Changing to:", language);
    console.log(
      "[Language] Current child language:",
      selectedChild.languagePreference,
    );

    try {
      await updateChild(selectedChild.id, {
        language_preference: language,
      });

      // Update local state
      const updatedChild = { ...selectedChild, languagePreference: language };
      console.log("[Language] Updated to:", updatedChild.languagePreference);
      setSelectedChild(updatedChild);
      setChildren(
        children.map((c) => (c.id === selectedChild.id ? updatedChild : c)),
      );
    } catch (err) {
      console.error("Failed to update language preference:", err);
    }
  };

  const handleLearnWord = (word: Word) => {
    setSelectedWord(word);
  };

  const handleCategorySelect = (category: Category) => {
    console.log("[v0] Selected category:", category.name);
    setActiveTab("learn");
  };

  const handlePlayGame = (game: Game) => {
    console.log("[v0] Playing game:", game.name);
    // Kinesthetic games use different view
    if (game.physicalActivity) {
      setSelectedGame(game);
    } else {
      setActiveTab("games");
    }
  };

  const handleReadStory = (story: Story) => {
    setSelectedStory(story);
  };

  const renderContent = () => {
    // If kinesthetic game is selected, show that view
    if (selectedGame) {
      return (
        <KinestheticGamesView
          game={selectedGame}
          words={words}
          onBack={() => setSelectedGame(null)}
          languagePreference={selectedChild?.languagePreference || "cantonese"}
        />
      );
    }

    switch (activeTab) {
      case "home":
        return (
          <div className="flex flex-col gap-6">
            {selectedChild && (
              <ProfileHeader
                key={`${selectedChild.id}-${selectedChild.xp}-${selectedChild.wordsLearned}`}
                profile={selectedChild}
              />
            )}
            {wordOfDay && (
              <WordOfTheDay
                word={wordOfDay}
                onLearnMore={handleLearnWord}
                languagePreference={
                  selectedChild?.languagePreference || "cantonese"
                }
              />
            )}
            <StoriesList stories={stories} onReadStory={handleReadStory} />
            {selectedChild && (
              <BedtimeStoryGenerator
                childId={selectedChild.id}
                childName={selectedChild.name}
                languagePreference={
                  selectedChild.languagePreference || "cantonese"
                }
                onStoryGenerated={setSelectedBedtimeStory}
              />
            )}
            <CategoryGrid
              categories={categories}
              onCategorySelect={handleCategorySelect}
              languagePreference={
                selectedChild?.languagePreference || "cantonese"
              }
            />
            <GamesList games={games} onPlayGame={handlePlayGame} />
          </div>
        );
      case "learn":
        return (
          <LearnView
            categories={categories}
            words={words}
            onSelectWord={handleLearnWord}
            languagePreference={
              selectedChild?.languagePreference || "cantonese"
            }
          />
        );
      case "games":
        return (
          <GamesView
            games={games}
            words={words}
            languagePreference={
              selectedChild?.languagePreference || "cantonese"
            }
          />
        );
      case "rewards":
        return selectedChild ? <RewardsView profile={selectedChild} /> : null;
      case "profile":
        return selectedChild ? <ProfileView profile={selectedChild} /> : null;
      default:
        return null;
    }
  };

  // Show loading spinner while checking auth
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Spinner className="w-12 h-12 mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in (will redirect)
  if (!user) {
    return null;
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={loadData} className="w-full mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="max-w-lg mx-auto px-4 py-2">
          <LanguageSelector
            currentLanguage={selectedChild?.languagePreference || "cantonese"}
            onChange={handleLanguageChange}
          />
        </div>
      </div>
      <main
        className={`max-w-lg mx-auto px-4 pt-4 ${hideNav ? "pb-4" : "pb-24"}`}
      >
        {renderContent()}
      </main>

      {!hideNav && (
        <ChildNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      )}

      {selectedWord && selectedChild && (
        <WordLearningModal
          word={selectedWord}
          onClose={() => setSelectedWord(null)}
          onComplete={refreshChildData}
          childId={selectedChild.id}
          languagePreference={selectedChild.languagePreference || "cantonese"}
        />
      )}

      {selectedStory && useDialogicReading && (
        <DialogicStoryModal
          story={selectedStory}
          onClose={() => setSelectedStory(null)}
        />
      )}

      {selectedStory && !useDialogicReading && (
        <StoryReaderModal
          story={selectedStory}
          onClose={() => setSelectedStory(null)}
        />
      )}

      {selectedBedtimeStory && selectedChild && (
        <BedtimeStoryReader
          story={selectedBedtimeStory}
          onClose={() => setSelectedBedtimeStory(null)}
          languagePreference={selectedChild.languagePreference || "cantonese"}
        />
      )}
    </div>
  );
}
