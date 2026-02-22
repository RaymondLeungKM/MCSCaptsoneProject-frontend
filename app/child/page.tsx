"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Baby, Construction, Book, Sparkles } from "lucide-react";
import CozyPageWrapper from "@/components/CozyPageWrapper";

// --- COMPONENTS ---
import { ProfileHeader } from "@/components/child/profile-header";
import { DailyWordsViewer } from "@/components/child/daily-words-viewer";
import { CategoryGrid } from "@/components/child/category-grid";
import { BedtimeStoryGenerator } from "@/components/child/bedtime-story";
import { GamesList } from "@/components/child/game-card";
import { ChildNavigation } from "@/components/child/navigation";
import { StoryCard } from "@/components/child/story-card"; // Import Story Card

import { BedtimeStoryReader } from "@/components/modals/bedtime-story-reader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-context";
import {
  getCategories,
  getChildren,
  toCategory,
  toChildProfile,
} from "@/lib/api";
import { getChildStories, getStory } from "@/lib/api/bedtime-stories";
import { startLearningSession, endLearningSession } from "@/lib/api/progress";
import type { Category, ChildProfile, Game, GeneratedStory } from "@/lib/types";
import type { Story as StoryCardStory } from "@/components/child/story-card";
import { API_BASE_URL } from "@/lib/api/client";

// --- MOCK STORY DATA ---
// Adapted to fit both Reader and Card format
const MOCK_STORY: GeneratedStory = {
  id: "test-story-1",
  child_id: "test-child-1",
  title: "小月亮的冒險",
  title_english: "The Little Moon's Adventure",
  generated_at: new Date().toISOString(),
  story_text: "從前，有一個小月亮，他非常想去地球看看。",
  story_text_ssml: "<speak>從前，有一個小月亮，他非常想去地球看看。</speak>",
  featured_words: ["月亮", "星星"],
  audio_filename: "",
  reading_time_minutes: 5,
  difficulty_level: "easy",
  is_favorite: false,
  parent_approved: true,
  created_at: new Date().toISOString(),
  content_cantonese:
    "從前，有一個小月亮，他非常想去地球看看。有一天，他看到了一顆流星，於是問道：「流星哥哥，你可以帶我去地球嗎？」流星說：「當然可以！抓緊了！」於是，他們飛過了銀河，看到了許多星星。最後，小月亮降落在一個安靜的湖面上，他看到了自己的倒影，覺得非常開心。",
  content_english:
    "Once upon a time, there was a little moon who really wanted to visit Earth. One day, he saw a shooting star and asked, 'Brother Meteor, can you take me to Earth?' The meteor said, 'Of course! Hold on tight!' So, they flew across the galaxy and saw many stars. Finally, the little moon landed on a quiet lake. He saw his own reflection and felt very happy.",
  jyutping: "cung4 cin4, jau5 jat1 go3 siu2 jyut6 loeng6...",
  cultural_references: ["中秋節 (Mid-Autumn)", "玉兔 (Moon Rabbit)"],
  word_usage: { "月亮 (Moon)": "3次", "星星 (Star)": "2次" },
  generation_date: new Date().toISOString(),
  read_count: 0,
  ai_model: "mock",
};

const EMPTY_STORY: GeneratedStory = {
  ...MOCK_STORY,
  id: "empty-story",
  title: "暫時未有故事",
  content_cantonese: "你可以先按『生成故事』，創作第一個睡前故事。",
  content_english: "You can generate your first bedtime story.",
  generated_at: new Date().toISOString(),
  generation_date: new Date().toISOString(),
  created_at: new Date().toISOString(),
};

const GAMES_DATA: Game[] = [
  {
    id: "quiz",
    name: "單字大挑戰",
    description: "聽聲音，選出正確的圖片！",
    icon: "🎯",
    color: "purple",
    type: "matching",
    physicalActivity: false,
    multiSensory: true,
    parentParticipation: false,
  },
  {
    id: "matching",
    name: "配對遊戲",
    description: "找出相關聯的卡片。",
    icon: "🧩",
    color: "blue",
    type: "matching",
    physicalActivity: false,
    multiSensory: true,
    parentParticipation: false,
  },
  {
    id: "speaking",
    name: "發音練習",
    description: "大聲讀出單字，贏取獎勵！",
    icon: "🎤",
    color: "orange",
    type: "pronunciation",
    physicalActivity: false,
    multiSensory: true,
    parentParticipation: false,
  },
];

export default function ChildDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("home");
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const [profile, setProfile] = useState<ChildProfile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stories, setStories] = useState<GeneratedStory[]>([]);
  const [selectedStory, setSelectedStory] = useState<GeneratedStory | null>(
    null,
  );
  const [storiesLoading, setStoriesLoading] = useState(false);
  const [storiesError, setStoriesError] = useState<string | null>(null);
  const [playingStoryId, setPlayingStoryId] = useState<string | null>(null);
  const [storyAudioLoadingId, setStoryAudioLoadingId] = useState<string | null>(
    null,
  );
  const storyAudioRef = useRef<HTMLAudioElement | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileRefreshKey, setProfileRefreshKey] = useState(0);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
        return;
      }
      void loadDashboardData();
    }
  }, [authLoading, user, router]);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const children = await getChildren();

      if (!children.length) {
        setError("未找到小朋友資料，請先建立小朋友檔案。");
        setLoading(false);
        return;
      }

      const selectedChild = toChildProfile(children[0]);
      setProfile(selectedChild);

      // Start learning session (fire-and-forget, don't block UI)
      startLearningSession({
        child_id: selectedChild.id,
        start_time: new Date().toISOString(),
      })
        .then((session) => {
          sessionIdRef.current = session.id;
          console.log("[Session] Started:", session.id);
        })
        .catch((e) => console.warn("[Session] Could not start:", e));

      const categoryResponses = await getCategories();
      setCategories(
        categoryResponses.map((category, index) => toCategory(category, index)),
      );

      await loadStories(selectedChild.id);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("載入資料失敗，請稍後再試。");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadStories = async (childId: string) => {
    setStoriesLoading(true);
    setStoriesError(null);
    try {
      const response = await getChildStories(childId, 20);
      setStories(response || []);
    } catch (err) {
      if (err instanceof Error) {
        setStoriesError(err.message);
      } else {
        setStoriesError("載入故事失敗，請稍後再試。");
      }
      setStories([]);
    } finally {
      setStoriesLoading(false);
    }
  };

  const toStoryCard = (story: GeneratedStory): StoryCardStory => ({
    id: story.id,
    title: story.title,
    duration: `${story.reading_time_minutes || 5} min`,
    completed: (story.read_count || 0) > 0,
    color: "blue",
    emoji: "📖",
  });

  const resolveAudioUrl = (audioUrl: string): string => {
    if (audioUrl.startsWith("http://") || audioUrl.startsWith("https://")) {
      return audioUrl;
    }
    const backendOrigin = API_BASE_URL.replace(/\/api\/v1\/?$/, "");
    return `${backendOrigin}${audioUrl.startsWith("/") ? "" : "/"}${audioUrl}`;
  };

  const stopStoryAudio = () => {
    if (storyAudioRef.current) {
      storyAudioRef.current.pause();
      storyAudioRef.current.currentTime = 0;
      storyAudioRef.current = null;
    }
    setPlayingStoryId(null);
    setStoryAudioLoadingId(null);
  };

  const handlePlayStoryAudio = async (storyId: string) => {
    const targetStory = stories.find((story) => story.id === storyId);
    if (!targetStory?.audio_url) {
      return;
    }

    if (playingStoryId === storyId) {
      stopStoryAudio();
      return;
    }

    stopStoryAudio();
    setStoryAudioLoadingId(storyId);

    try {
      const audio = new Audio(resolveAudioUrl(targetStory.audio_url));
      storyAudioRef.current = audio;

      audio.onplay = () => {
        setStoryAudioLoadingId(null);
        setPlayingStoryId(storyId);
      };
      audio.onended = () => setPlayingStoryId(null);
      audio.onerror = () => {
        setPlayingStoryId(null);
        setStoryAudioLoadingId(null);
      };

      await audio.play();
    } catch {
      setPlayingStoryId(null);
      setStoryAudioLoadingId(null);
    }
  };

  useEffect(() => {
    return () => {
      stopStoryAudio();
      // End learning session on unmount
      if (sessionIdRef.current) {
        const sessionId = sessionIdRef.current;
        sessionIdRef.current = null;
        endLearningSession(sessionId, {
          end_time: new Date().toISOString(),
          words_encountered: [],
          activities_completed: [],
          engagement_level: "medium",
          interactions_count: 0,
        }).catch((e) => console.warn("[Session] Could not end:", e));
      }
    };
  }, []);

  const handleReadStory = async (storyId: string) => {
    if (!profile) return;
    try {
      const existing = stories.find((s) => s.id === storyId);
      if (existing?.content_cantonese) {
        setSelectedStory(existing);
        setIsReaderOpen(true);
        return;
      }

      const fullStory = await getStory(profile.id, storyId);
      setSelectedStory(fullStory);
      setIsReaderOpen(true);
    } catch (err) {
      if (err instanceof Error) {
        setStoriesError(err.message);
      } else {
        setStoriesError("讀取故事失敗，請稍後再試。");
      }
    }
  };

  const handleStoryGenerated = (story: GeneratedStory) => {
    setStories((prev) => [story, ...prev.filter((s) => s.id !== story.id)]);
    setSelectedStory(story);
    setIsReaderOpen(true);
  };

  if (authLoading || loading) {
    return (
      <CozyPageWrapper type="center">
        <div className="w-full max-w-4xl min-h-screen pb-32 relative z-10 px-4">
          <div className="py-6 space-y-6">
            <Skeleton className="h-44 w-full rounded-4xl" />
            <Skeleton className="h-72 w-full rounded-[40px]" />
          </div>
        </div>
      </CozyPageWrapper>
    );
  }

  if (!profile) {
    return (
      <CozyPageWrapper type="center">
        <div className="w-full max-w-4xl min-h-screen pb-32 relative z-10 px-4 py-8">
          <Alert variant="destructive" className="rounded-2xl">
            <AlertDescription>
              {error || "目前沒有可用的小朋友資料。"}
            </AlertDescription>
          </Alert>
          <div className="mt-4 flex gap-3">
            <Button onClick={() => router.push("/create-child")}>
              建立小朋友檔案
            </Button>
            <Button variant="outline" onClick={() => void loadDashboardData()}>
              重新載入
            </Button>
          </div>
        </div>
      </CozyPageWrapper>
    );
  }

  return (
    <CozyPageWrapper type="center">
      <div className="w-full max-w-4xl min-h-screen pb-32 relative z-10 px-4">
        {/* --- HEADER --- */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-4 py-6">
          <ProfileHeader childId={profile.id} refreshKey={profileRefreshKey} />

          <Link
            href="/parent"
            className="bg-white/70 backdrop-blur-md hover:bg-white/90 text-slate-800 px-6 py-3.5 rounded-full font-black text-sm md:text-lg shadow-lg shadow-blue-900/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 border-4 border-white/60 group"
          >
            <Baby className="w-6 h-6 text-[#38BDF8]" />
            <span className="hidden md:inline">家長中心</span>
            <LogOut className="w-5 h-5 text-slate-500 group-hover:translate-x-1 transition-transform" />
          </Link>
        </header>

        {/* --- MAIN CONTENT AREA --- */}
        <main className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {activeTab === "home" && (
            <section className="space-y-6">
              <DailyWordsViewer
                childId={profile.id}
                childName={profile.name}
                languagePreference={profile.languagePreference || "bilingual"}
                onWordLearned={() => setProfileRefreshKey((k) => k + 1)}
              />
            </section>
          )}

          {activeTab === "learn" && (
            <section className="px-2">
              <CategoryGrid
                categories={categories}
                languagePreference={profile.languagePreference || "bilingual"}
                childId={profile.id}
                onWordLearned={() => setProfileRefreshKey((k) => k + 1)}
              />
            </section>
          )}

          {activeTab === "games" && (
            <section className="px-2">
              <GamesList
                games={GAMES_DATA}
                onPlayGame={(game) => console.log("Playing:", game.name)}
              />
            </section>
          )}

          {/* ✨ STORIES TAB: Updated with "My Stories" Shelf ✨ */}
          {activeTab === "stories" && (
            <div className="space-y-8">
              {/* 1. Generator */}
              <section className="bg-white/60 backdrop-blur-md rounded-4xl p-2 shadow-sm border border-white/50">
                <BedtimeStoryGenerator
                  childId={profile.id}
                  childName={profile.name}
                  languagePreference={profile.languagePreference || "bilingual"}
                  onStoryGenerated={handleStoryGenerated}
                />
              </section>

              {/* 2. My Stories Shelf (New Placement for Reader) */}
              <section className="px-2">
                <div className="flex items-center gap-3 mb-4 pl-2">
                  <div className="bg-blue-400 p-2 rounded-xl -rotate-3 shadow-sm">
                    <Book className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-700">
                    我的故事書
                  </h2>
                </div>

                {storiesError && (
                  <Alert variant="destructive" className="mb-3 rounded-2xl">
                    <AlertDescription>{storiesError}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                  {!storiesLoading &&
                    stories.length > 0 &&
                    stories.map((story) => (
                      <StoryCard
                        key={story.id}
                        story={toStoryCard(story)}
                        onRead={(cardStory) =>
                          void handleReadStory(cardStory.id)
                        }
                        onPlayAudio={
                          story.audio_url
                            ? () => void handlePlayStoryAudio(story.id)
                            : undefined
                        }
                        isAudioPlaying={playingStoryId === story.id}
                        isAudioLoading={storyAudioLoadingId === story.id}
                      />
                    ))}

                  {!storiesLoading && stories.length === 0 && (
                    <div className="min-w-45 h-70 rounded-4xl border-4 border-dashed border-white/50 flex flex-col items-center justify-center text-slate-400 bg-white/20">
                      <Sparkles className="w-8 h-8 mb-2 opacity-50" />
                      <span className="font-bold text-sm">生成第一個故事</span>
                    </div>
                  )}

                  {storiesLoading && (
                    <div className="min-w-45 h-70 rounded-4xl border-4 border-dashed border-white/50 flex flex-col items-center justify-center text-slate-400 bg-white/20">
                      <span className="font-bold text-sm">載入故事中...</span>
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}

          {(activeTab === "rewards" || activeTab === "profile") && (
            <section className="bg-white/80 backdrop-blur-md rounded-[40px] p-12 text-center border border-white/50 shadow-sm">
              <div className="bg-yellow-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <Construction className="w-10 h-10 text-yellow-600" />
              </div>
              <h2 className="text-2xl font-black text-slate-700 mb-2">
                Coming Soon!
              </h2>
              <p className="text-slate-500 font-bold">
                這個功能即將推出，敬請期待！
              </p>
            </section>
          )}
        </main>

        <ChildNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Modal */}
        <BedtimeStoryReader
          isOpen={isReaderOpen}
          onClose={() => setIsReaderOpen(false)}
          story={selectedStory || EMPTY_STORY}
          languagePreference="bilingual"
          onComplete={() => {
            if (profile) {
              void loadStories(profile.id);
            }
          }}
        />
      </div>
    </CozyPageWrapper>
  );
}
