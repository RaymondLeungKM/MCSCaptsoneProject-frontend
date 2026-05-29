"use client";

import { Play, Sparkles, Trophy, Gamepad2 } from 'lucide-react';
import type { Game, LanguagePreference } from '@/lib/types';
import { cn } from '@/lib/utils';

// --- 1. COLOR MAPPING HELPER ---
// Maps simple color names to our "Cozy" design system classes
const getGameColorStyles = (color: string) => {
  const c = color?.toLowerCase() || "blue";
  const map: Record<string, string> = {
    purple: "bg-purple-50 border-purple-200 hover:bg-purple-100 hover:border-purple-300 text-purple-600",
    blue: "bg-blue-50 border-blue-200 hover:bg-blue-100 hover:border-blue-300 text-blue-600",
    green: "bg-green-50 border-green-200 hover:bg-green-100 hover:border-green-300 text-green-600",
    orange: "bg-orange-50 border-orange-200 hover:bg-orange-100 hover:border-orange-300 text-orange-600",
    pink: "bg-pink-50 border-pink-200 hover:bg-pink-100 hover:border-pink-300 text-pink-600",
    yellow: "bg-yellow-50 border-yellow-200 hover:bg-yellow-100 hover:border-yellow-300 text-yellow-600",
  };
  return map[c] || map.blue;
};

interface GameCardProps {
  game: Game;
  onPlay: (game: Game) => void;
  languagePreference?: LanguagePreference;
}

export function GameCard({ game, onPlay }: GameCardProps) {
  const styles = getGameColorStyles(game.color);

  return (
    <button
      onClick={() => onPlay(game)}
      className={cn(
        "group relative w-full text-left transition-all duration-300",
        "flex items-center gap-2.5 p-3 rounded-2xl border-2 sm:gap-5 sm:p-5 sm:rounded-[32px] sm:border-4",
        "hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md",
        styles // Apply dynamic color styles
      )}
      aria-label={`開始 ${game.name}`}
    >
      {/* Icon Box */}
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm transition-transform duration-300 group-hover:scale-110 sm:h-24 sm:w-24 sm:rounded-[24px] sm:text-6xl">
        {game.icon}
      </div>
      
      {/* Text Content */}
      <div className="flex-1 min-w-0">
        <h3 className="mb-0.5 text-base font-black tracking-tight text-slate-700 sm:mb-1 sm:text-3xl">
          {game.name}
        </h3>
        <p className="line-clamp-2 text-xs font-bold leading-tight opacity-70 sm:text-xl">
          {game.description}
        </p>
      </div>

      {/* Play Button (Right Arrow) */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/60 shadow-sm transition-colors group-hover:bg-white group-hover:text-[#38BDF8] sm:h-12 sm:w-12">
        <Play className="ml-0.5 h-4 w-4 fill-current sm:ml-1 sm:h-6 sm:w-6" />
      </div>

      {/* Decorative Badge (Optional - shows "New" or "Hot") */}
      {game.id === 'quiz' && (
        <div className="absolute -top-2 -right-1 rounded-full bg-yellow-400 px-2.5 py-0.5 text-[9px] font-black text-white shadow-sm rotate-6 sm:-top-3 sm:-right-2 sm:px-3 sm:py-1 sm:text-[10px]">
            熱門
         </div>
      )}
    </button>
  );
}

// --- 2. LIST COMPONENT ---

interface GamesListProps {
  games: Game[];
  onPlayGame: (game: Game) => void;
  languagePreference?: LanguagePreference;
}

export function GamesList({ games, onPlayGame, languagePreference = "cantonese" }: GamesListProps) {
  return (
    // Wrapped in the white glass card to ensure visibility on dark backgrounds
    <div className="w-full rounded-3xl border border-white/50 bg-white/80 p-3 shadow-sm backdrop-blur-md sm:rounded-[40px] sm:p-6 md:p-8">
      
      {/* Header */}
      <div className="mb-3 flex items-center gap-2 sm:mb-6 sm:gap-3">
        <div className="-rotate-3 rounded-lg bg-blue-400 p-1.5 shadow-sm sm:rounded-2xl sm:p-2.5">
          <Gamepad2 className="h-4 w-4 text-white sm:h-6 sm:w-6" />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-black tracking-tight text-slate-700 sm:text-3xl">
             好玩遊戲
          </h2>
          <p className="text-xs font-bold text-slate-400 sm:text-base">
             邊玩邊學！
          </p>
        </div>
      </div>
      
      {/* Game List Grid */}
      <div className="flex flex-col gap-3 sm:gap-4">
        {games.map((game) => (
          <GameCard 
            key={game.id} 
            game={game} 
            onPlay={onPlayGame} 
            languagePreference={languagePreference}
          />
        ))}
      </div>
    </div>
  );
}