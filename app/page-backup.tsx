"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ChildNavigation } from "@/components/child/navigation";
import { ProfileHeader } from "@/components/child/profile-header";
import { WordOfTheDay } from "@/components/child/word-of-the-day";
import { CategoryGrid } from "@/components/child/category-grid";
import { GamesList } from "@/components/child/game-card";
import { StoriesList } from "@/components/child/story-card";
import { useAuth } from "@/lib/auth-context";
import { useApi } from "@/hooks/use-api";
import { 
  getChildren, 
  getCategories, 
  getWordsWithProgress, 
  getWordOfTheDay,
  toWord,
  toCategory 
} from "@/lib/api";
import { games, stories } from "@/lib/mock-data";
import type { Word, Category, Game, Story } from "@/lib/types";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

// Import views
import { LearnView } from "@/components/views/learn-view";
import { GamesView } from "@/components/views/games-view";
import { KinestheticGamesView } from "@/components/views/kinesthetic-games";
import { RewardsView } from "@/components/views/rewards-view";
import { ProfileView } from "@/components/views/profile-view";
import { WordLearningModal } from "@/components/modals/word-learning-modal";
import { StoryReaderModal } from "@/components/modals/story-reader-modal";
import { DialogicStoryModal } from "@/components/modals/dialogic-story-modal";

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  
  const [activeTab, setActiveTab] = useState("home");
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  conLoad data from API
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
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
  
  async function loadData() {
    setLoading(true);
    setError(null);
    
    try {
      // Load children profiles
      const childrenData = await getChildren();
      
      if (childrenData.length === 0) {
        router.push('/create-child');
        return;
      }
      
      setChildren(childrenData);
      const firstChild = childrenData[0];
      setSelectedChild(firstChild);
      
      // Load categories
      const categoriesData = await getCategories();
      setCategories(categoriesData.map(toCategory));
      
      // Load words with progress
      const wordsData = await getWordsWithProgress(firstChild.id);
      setWords(wordsData.map((w: any) => toWord(w, w.progress)));
      
      // Load word of the day
      try {
        const wordOfDayData = await getWordOfTheDay(firstChild.id);
        const word = wordsData.find((w: any) => w.id === wordOfDayData.word_id);
        if (word) {
          setWordOfDay(toWord(word, word.progress));
        }
      } catch (err) {
        console.error('Failed to load word of the day:', err);
        // Use first word as fallback
        if (wordsData.length > 0) {
          setWordOfDay(toWord(wordsData[0], wordsData[0].progress));
        }
      }
      {selectedChild && <ProfileHeader profile={selectedChild} />}
            {wordOfDay && <WordOfTheDay word={wordOfDay} onLearnMore={handleLearnWord} />}
            <StoriesList stories={stories} onReadStory={handleReadStory} />
            <CategoryGrid
              categories={categories}
              onCategorySelect={handleCategorySelect}
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
          />
        );
      case "games":
        return <GamesView games={games} words={words} />;
      case "rewards":
        return selectedChild ? <RewardsView profile={selectedChild} /> : null;
      case "profile":
        return selectedChild ? <ProfileView profile={selectedChild} /> : null

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
          onBack={() => setSelectedGame(null)}
        />
      );
    }

    switch (activeTab) {
      case "home":
        return (
          <div className="flex flex-col gap-6">
            <ProfileHeader profile={childProfile} />
            <WordOfTheDay word={todaysWords[0]} onLearnMore={handleLearnWord} />
            <StoriesList stories={stories} onReadStory={handleReadStory} />
            <CategoryGrid
              categories={categories}
              onCategorySelect={handleCategorySelect}
            />
            <GamesList games={games} onPlayGame={handlePlayGame} />
          </div>
        );
      case "learn":
        return (
          <LearnView categories={categories} onSelectWord={handleLearnWord} />
        );
      case "games":
        return <GamesView games={games} />;
      case "rewards":
        return <RewardsView profile={childProfile} />;
      case "profile":
        return <ProfileView profile={childProfile} />;
      default:
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
          <Button 
            onClick={loadData} 
            className="w-full mt-4"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main
        className={`max-w-lg mx-auto px-4 pt-4 ${hideNav ? "pb-4" : "pb-24"}`}
      >
        {renderContent()}
      </main>

      {!hideNav && (
        <ChildNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      )}

      {selectedWord && (
        <WordLearningModal
          word={selectedWord}
          onClose={() => setSelectedWord(null)}
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
    </div>
  );
}
