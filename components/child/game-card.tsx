'use client';

import { Play } from 'lucide-react';
import type { Game } from '@/lib/types';
import { cn } from '@/lib/utils';

interface GameCardProps {
  game: Game;
  onPlay: (game: Game) => void;
}

export function GameCard({ game, onPlay }: GameCardProps) {
  return (
    <button
      onClick={() => onPlay(game)}
      className={cn(
        'flex items-center gap-4 p-4 rounded-2xl w-full text-left',
        'border-4 border-transparent transition-all duration-200',
        'hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg',
        game.color,
        'hover:border-foreground/20'
      )}
      aria-label={`Play ${game.name}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-card/50 flex items-center justify-center text-3xl shadow-inner">
        {game.icon}
      </div>
      
      <div className="flex-1">
        <h3 className="font-bold text-foreground text-lg">{game.name}</h3>
        <p className="text-sm text-foreground/70">{game.description}</p>
      </div>

      <div className="w-10 h-10 rounded-full bg-card flex items-center justify-center shadow-md">
        <Play className="w-5 h-5 text-primary fill-primary" />
      </div>
    </button>
  );
}

interface GamesListProps {
  games: Game[];
  onPlayGame: (game: Game) => void;
}

export function GamesList({ games, onPlayGame }: GamesListProps) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🎮</span>
        <h2 className="text-lg font-bold text-foreground">Fun Games</h2>
      </div>
      
      <div className="flex flex-col gap-3">
        {games.map((game) => (
          <GameCard key={game.id} game={game} onPlay={onPlayGame} />
        ))}
      </div>
    </section>
  );
}
