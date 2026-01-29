'use client';

import { Home, BookOpen, Gamepad2, Trophy, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'learn', icon: BookOpen, label: 'Learn' },
  { id: 'games', icon: Gamepad2, label: 'Games' },
  { id: 'rewards', icon: Trophy, label: 'Rewards' },
  { id: 'profile', icon: User, label: 'Me' },
];

export function ChildNavigation({ activeTab, onTabChange }: NavigationProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t-4 border-primary/20 px-4 py-2 z-50 safe-area-inset-bottom">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                'flex flex-col items-center gap-1 p-2 rounded-2xl transition-all duration-300 min-w-[64px]',
                isActive 
                  ? 'bg-primary text-primary-foreground scale-110 shadow-lg' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className={cn('w-7 h-7', isActive && 'animate-bounce')} strokeWidth={2.5} />
              <span className={cn('text-xs font-bold', isActive ? 'text-primary-foreground' : 'text-muted-foreground')}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
