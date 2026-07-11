/**
 * Personalized word selection for mini-games.
 *
 * Games historically fetched all words via getWords() and shuffled randomly.
 * This helper instead prioritizes words the child actually needs to practice,
 * using the existing backend SM-2 review queue (getReviewQueue). It falls back
 * to random selection when the review queue is empty or too small (e.g. a brand
 * new child), so games never break.
 *
 * Design: the review queue gives PRIORITIZED word IDs (due / weak / etc.). We
 * pull full word records via getWords() (the shape games already render) and
 * order them by the queue's priority, then backfill with remaining random words.
 * Words that came from the review queue are tagged so results can be reported
 * back to SM-2 (see submit-game-reviews.ts).
 */
import { getReviewQueue } from "@/lib/api/word-personalization";
import { getWords, type WordResponse } from "@/lib/api/vocabulary";

export type GameWordRequirement = "image" | "cantonese" | "audio" | "jyutping";

export interface GameWord extends WordResponse {
  /** True when this word came from the SM-2 review queue (vs. random backfill). */
  fromReviewQueue: boolean;
}

function meetsRequirements(
  word: WordResponse,
  requires: GameWordRequirement[],
): boolean {
  return requires.every((req) => {
    switch (req) {
      case "image":
        return Boolean(word.image_url);
      case "cantonese":
        return Boolean(word.word_cantonese);
      case "audio":
        return Boolean(word.audio_url);
      case "jyutping":
        return Boolean(word.jyutping);
      default:
        return true;
    }
  });
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Select words for a mini-game round.
 *
 * @returns up to `count` GameWords, review-priority words first, then random
 *          backfill. Never throws (falls back to random on any queue error).
 */
export async function selectGameWords(opts: {
  childId: string;
  count: number;
  requires?: GameWordRequirement[];
}): Promise<GameWord[]> {
  const { childId, count } = opts;
  const requires = opts.requires ?? [];

  // Pull a generous pool of full word records (the shape games render).
  const pool = await getWords({
    childId,
    includeExternal: true,
    includeMongodb: true,
    limit: 200,
  }).catch(() => [] as WordResponse[]);

  const usable = pool.filter((w) => meetsRequirements(w, requires));
  const byId = new Map(usable.map((w) => [w.id, w]));

  // Ask the SM-2 review queue which words the child should practice.
  let priorityIds: string[] = [];
  try {
    const queue = await getReviewQueue(childId, Math.max(count * 2, 20));
    priorityIds = queue.cards.map((c) => c.word_id);
  } catch {
    priorityIds = [];
  }

  const selected: GameWord[] = [];
  const takenIds = new Set<string>();

  // 1. Review-priority words that we have full usable records for.
  for (const id of priorityIds) {
    if (selected.length >= count) break;
    const word = byId.get(id);
    if (word && !takenIds.has(id)) {
      selected.push({ ...word, fromReviewQueue: true });
      takenIds.add(id);
    }
  }

  // 2. Random backfill from the remaining usable pool.
  if (selected.length < count) {
    const remaining = shuffle(usable.filter((w) => !takenIds.has(w.id)));
    for (const word of remaining) {
      if (selected.length >= count) break;
      selected.push({ ...word, fromReviewQueue: false });
      takenIds.add(word.id);
    }
  }

  return selected;
}
