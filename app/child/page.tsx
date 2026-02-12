"use client";

import { useState } from "react";
import Link from "next/link";
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

// --- DATA ---
import { childProfile, words, categories } from "@/lib/mock-data";

// --- MOCK STORY DATA ---
// Adapted to fit both Reader and Card format
const MOCK_STORY = {
  id: "test-story-1",
  title: "小月亮的冒險",
  title_english: "The Little Moon's Adventure",
  content_cantonese: "從前，有一個小月亮，他非常想去地球看看。有一天，他看到了一顆流星，於是問道：「流星哥哥，你可以帶我去地球嗎？」流星說：「當然可以！抓緊了！」於是，他們飛過了銀河，看到了許多星星。最後，小月亮降落在一個安靜的湖面上，他看到了自己的倒影，覺得非常開心。",
  content_english: "Once upon a time, there was a little moon who really wanted to visit Earth. One day, he saw a shooting star and asked, 'Brother Meteor, can you take me to Earth?' The meteor said, 'Of course! Hold on tight!' So, they flew across the galaxy and saw many stars. Finally, the little moon landed on a quiet lake. He saw his own reflection and felt very happy.",
  jyutping: "cung4 cin4, jau5 jat1 go3 siu2 jyut6 loeng6...",
  cultural_references: ["中秋節 (Mid-Autumn)", "玉兔 (Moon Rabbit)"],
  word_usage: { "月亮 (Moon)": "3次", "星星 (Star)": "2次" },
  generation_date: new Date().toISOString(),
  read_count: 0,
  // Card specific props
  duration: "5 min",
  completed: false,
  color: "blue",
  emoji: "🌙"
};

const GAMES_DATA = [
  { id: "quiz", name: "單字大挑戰", description: "聽聲音，選出正確的圖片！", icon: "🎯", color: "purple", path: "/child/games/quiz" },
  { id: "matching", name: "配對遊戲", description: "找出相關聯的卡片。", icon: "🧩", color: "blue", path: "/child/games/match" },
  { id: "speaking", name: "發音練習", description: "大聲讀出單字，贏取獎勵！", icon: "🎤", color: "orange", path: "/child/games/speak" }
];

export default function ChildDashboard() {
  const [activeTab, setActiveTab] = useState("home");
  const [isReaderOpen, setIsReaderOpen] = useState(false);

  return (
    <CozyPageWrapper type="center">
      <div className="w-full max-w-4xl min-h-screen pb-32 relative z-10 px-4">
        
        {/* --- HEADER --- */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-4 py-6">
          <ProfileHeader profile={childProfile} />
          
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
               <DailyWordsViewer words={words.slice(0, 3)} />
            </section>
          )}

          {activeTab === "learn" && (
            <section className="px-2">
              <CategoryGrid categories={categories} />
            </section>
          )}

          {activeTab === "games" && (
            <section className="px-2">
              <GamesList games={GAMES_DATA} onPlayGame={(game) => console.log("Playing:", game.name)} />
            </section>
          )}

          {/* ✨ STORIES TAB: Updated with "My Stories" Shelf ✨ */}
          {activeTab === "stories" && (
             <div className="space-y-8">
                {/* 1. Generator */}
                <section className="bg-white/60 backdrop-blur-md rounded-[32px] p-2 shadow-sm border border-white/50">
                   <BedtimeStoryGenerator />
                </section>

                {/* 2. My Stories Shelf (New Placement for Reader) */}
                <section className="px-2">
                   <div className="flex items-center gap-3 mb-4 pl-2">
                      <div className="bg-blue-400 p-2 rounded-xl -rotate-3 shadow-sm">
                         <Book className="w-5 h-5 text-white" />
                      </div>
                      <h2 className="text-2xl font-black text-slate-700">我的故事書</h2>
                   </div>
                   
                   <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                      {/* The Mock Story Card */}
                      <StoryCard 
                        story={MOCK_STORY} 
                        onRead={() => setIsReaderOpen(true)} 
                      />
                      
                      {/* Placeholder for Empty State / More */}
                      <div className="min-w-[180px] h-[280px] rounded-[32px] border-4 border-dashed border-white/50 flex flex-col items-center justify-center text-slate-400 bg-white/20">
                         <Sparkles className="w-8 h-8 mb-2 opacity-50" />
                         <span className="font-bold text-sm">生成更多故事...</span>
                      </div>
                   </div>
                </section>
             </div>
          )}

          {(activeTab === "rewards" || activeTab === "profile") && (
             <section className="bg-white/80 backdrop-blur-md rounded-[40px] p-12 text-center border border-white/50 shadow-sm">
                <div className="bg-yellow-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <Construction className="w-10 h-10 text-yellow-600" />
                </div>
                <h2 className="text-2xl font-black text-slate-700 mb-2">Coming Soon!</h2>
                <p className="text-slate-500 font-bold">這個功能即將推出，敬請期待！</p>
             </section>
          )}

        </main>

        <ChildNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Modal */}
        <BedtimeStoryReader 
          isOpen={isReaderOpen}
          onClose={() => setIsReaderOpen(false)}
          story={MOCK_STORY}
          languagePreference="bilingual"
        />

      </div>
    </CozyPageWrapper>
  );
}