"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  getChildren,
  getCategories,
  getWordsWithProgress,
  getWordOfTheDay,
  toWord,
  toCategory,
} from "@/lib/api";
import { ChildNavigation } from "@/components/child/navigation";
import { ProfileHeader } from "@/components/child/profile-header";
import { WordOfTheDay } from "@/components/child/word-of-the-day";
import { CategoryGrid } from "@/components/child/category-grid";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Word, Category, ChildProfile } from "@/lib/types";

export default function HomePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [children, setChildren] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<any | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [wordOfDay, setWordOfDay] = useState<Word | null>(null);
  const [activeTab, setActiveTab] = useState("home");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else {
        loadData();
      }
    }
  }, [user, authLoading, router]);

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      // Load children profiles
      const childrenData = await getChildren();

      if (childrenData.length === 0) {
        // No children yet - redirect to create child page
        setError(
          "No child profiles found. Please create a child profile first.",
        );
        setLoading(false);
        return;
      }

      setChildren(childrenData);
      const firstChild = childrenData[0];
      setSelectedChild(firstChild);

      // Load categories
      const categoriesData = await getCategories();
      setCategories(categoriesData.map(toCategory));

      // Load word of the day
      try {
        const wordOfDayData = await getWordOfTheDay(firstChild.id);
        // Fetch the full word details
        const wordsData = await getWordsWithProgress(firstChild.id);
        const word = wordsData.find((w: any) => w.id === wordOfDayData.word_id);
        if (word) {
          setWordOfDay(toWord(word, word.progress));
        }
      } catch (err) {
        console.error("Failed to load word of the day:", err);
      }
    } catch (err: any) {
      console.error("Failed to load data:", err);
      setError(err.message || "Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Show loading spinner while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  // Not logged in (will redirect)
  if (!user) {
    return null;
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 via-white to-coral-100">
        <div className="text-center">
          <Spinner className="w-12 h-12 mx-auto mb-4" />
          <p className="text-lg text-gray-600">
            Loading your learning journey...
          </p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 via-white to-coral-100 p-4">
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

  // No child profiles
  if (children.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 via-white to-coral-100 p-4">
        <div className="max-w-md w-full text-center">
          <h2 className="text-2xl font-bold mb-4">Welcome to WordWorld!</h2>
          <p className="text-gray-600 mb-6">
            Let's create your child's profile to get started with their learning
            journey.
          </p>
          <Button
            onClick={() => router.push("/create-child")}
            className="w-full"
          >
            Create Child Profile
          </Button>
        </div>
      </div>
    );
  }

  // Main content
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-white to-coral-100">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {selectedChild && (
          <>
            <ProfileHeader profile={selectedChild} />

            <div className="mt-6 space-y-6">
              {wordOfDay && (
                <WordOfTheDay
                  word={wordOfDay}
                  onStart={() => {
                    /* Handle word learning */
                  }}
                />
              )}

              <div>
                <h2 className="text-2xl font-bold mb-4">Explore Categories</h2>
                <CategoryGrid
                  categories={categories}
                  onCategoryClick={(category) => {
                    // Navigate to category view
                    setActiveTab("learn");
                  }}
                />
              </div>
            </div>
          </>
        )}
      </div>

      <ChildNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
