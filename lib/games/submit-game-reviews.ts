/**
 * Report mini-game results back to the SM-2 spaced-repetition engine.
 *
 * After a game ends, each word the child practiced is submitted as a review
 * with a quality rating (0-5), which advances the backend SM-2 schedule
 * (interval / easiness / next_review). Only words that came from the review
 * queue are submitted by default, so we don't create SR cards for random
 * backfill words the child hasn't formally started.
 *
 * Fails silently per word (mirrors recordGameSession) so a network error never
 * blocks the game UI.
 */
import { submitReview } from "@/lib/api/word-personalization";

export interface GameWordResult {
  wordId: string;
  /** Whether the child got this word right. */
  correct: boolean;
  /** Optional: answered quickly / first-try (bumps quality to "easy"). */
  fast?: boolean;
  /** Optional: needed a retry before getting it (lowers quality to "hard"). */
  retried?: boolean;
  /** Whether this word came from the SM-2 review queue (see selectGameWords). */
  fromReviewQueue?: boolean;
}

type Quality = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * Map a game outcome to an SM-2 quality rating (0-5):
 *   incorrect          -> 1 (Again / lapse)
 *   correct but retried -> 2 (Hard)
 *   correct             -> 3 (Good)
 *   correct + fast      -> 4 (Easy)
 */
function toQuality(result: GameWordResult): Quality {
  if (!result.correct) return 1;
  if (result.retried) return 2;
  if (result.fast) return 4;
  return 3;
}

/**
 * Submit per-word review results after a game ends.
 *
 * @param onlyReviewWords when true (default), only words sourced from the
 *        review queue are submitted to SM-2.
 */
export async function submitGameReviews(
  childId: string,
  results: GameWordResult[],
  onlyReviewWords = true,
): Promise<void> {
  const seen = new Set<string>();
  const toSubmit = results.filter((r) => {
    if (!r.wordId || seen.has(r.wordId)) return false;
    if (onlyReviewWords && !r.fromReviewQueue) return false;
    seen.add(r.wordId);
    return true;
  });

  await Promise.all(
    toSubmit.map((r) =>
      submitReview(childId, r.wordId, toQuality(r)).catch(() => undefined),
    ),
  );
}
