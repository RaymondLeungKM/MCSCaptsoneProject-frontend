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
        "flex items-center gap-5 p-5 rounded-[32px] border-4",
        "hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md",
        styles // Apply dynamic color styles
      )}
      aria-label={`開始 ${game.name}`}
    >
      {/* Icon Box */}
      <div className="w-20 h-20 rounded-[24px] bg-white flex items-center justify-center text-4xl shadow-sm group-hover:scale-110 transition-transform duration-300">
        {game.icon}
      </div>
      
      {/* Text Content */}
      <div className="flex-1 min-w-0">
        <h3 className="font-black text-slate-700 text-xl tracking-tight mb-1">
          {game.name}
        </h3>
        <p className="text-sm font-bold opacity-70 leading-tight line-clamp-2">
          {game.description}
        </p>
      </div>

      {/* Play Button (Right Arrow) */}
      <div className="w-12 h-12 rounded-full bg-white/60 flex items-center justify-center shadow-sm group-hover:bg-white group-hover:text-[#38BDF8] transition-colors">
        <Play className="w-6 h-6 fill-current ml-1" />
      </div>

      {/* Decorative Badge (Optional - shows "New" or "Hot") */}
      {game.id === 'quiz' && (
         <div className="absolute -top-3 -right-2 bg-yellow-400 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-sm rotate-6">
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
    <div className="bg-white/80 backdrop-blur-md rounded-[40px] p-6 md:p-8 shadow-sm border border-white/50 w-full">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-400 p-2.5 rounded-2xl shadow-sm -rotate-3">
          <Gamepad2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-700 tracking-tight">
             好玩遁戲
          </h2>
          <p className="text-sm font-bold text-slate-400">
             邊玩邊學！
          </p>
        </div>
      </div>
      
      {/* Game List Grid */}
      <div className="flex flex-col gap-4">
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