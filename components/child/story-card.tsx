'use client';

import { Clock, CheckCircle, Play } from 'lucide-react';
import type { Story } from '@/lib/types';
import { cn } from '@/lib/utils';

interface StoryCardProps {
  story: Story;
  onRead: (story: Story) => void;
}

export function StoryCard({ story, onRead }: StoryCardProps) {
  const storyEmojis: Record<string, string> = {
    'The Hungry Caterpillar': '🐛',
    'Colors All Around': '🌈',
    'Animal Friends': '🦊',
  };

  return (
    <button
      onClick={() => onRead(story)}
      className={cn(
        'relative flex flex-col rounded-3xl overflow-hidden min-w-[180px] w-[180px]',
        'border-4 border-transparent transition-all duration-200',
        'hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl',
        story.completed ? 'border-mint' : 'hover:border-primary/30'
      )}
    >
      {/* Cover Image Placeholder */}
      <div className={cn(
        'h-32 flex items-center justify-center text-6xl',
        story.completed ? 'bg-mint/30' : 'bg-sky/30'
      )}>
        {storyEmojis[story.title] || '📖'}
      </div>

      {/* Info */}
      <div className="p-3 bg-card">
        <h3 className="font-bold text-foreground text-sm line-clamp-1 text-left">
          {story.title}
        </h3>
        <div className="flex items-center justify-between mt-2">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {story.duration}
          </span>
          {story.completed ? (
            <CheckCircle className="w-5 h-5 text-mint" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
              <Play className="w-3 h-3 text-primary-foreground fill-primary-foreground" />
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

interface StoriesListProps {
  stories: Story[];
  onReadStory: (story: Story) => void;
}

export function StoriesList({ stories, onReadStory }: StoriesListProps) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">📚</span>
        <h2 className="text-lg font-bold text-foreground">Story Time</h2>
      </div>
      
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {stories.map((story) => (
          <StoryCard key={story.id} story={story} onRead={onReadStory} />
        ))}
      </div>
    </section>
  );
}
