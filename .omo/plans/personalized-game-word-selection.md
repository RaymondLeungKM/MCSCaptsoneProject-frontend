# Plan: Personalized Word Selection for Mini-Games (SM-2 Review Queue)

## Goal
Make mini-games select vocabulary based on the child's real learning state (spaced
repetition + weakness + due timing) instead of pure random shuffle, by wiring the
games to the **existing** backend SM-2 review-queue engine. Keep the SM-2 engine as
the single source of truth for mastery (do NOT add competing `+= 0.08` mastery math).

## Current State (verified)
- **Live games = 3**: `QuizGame`, `WordBuilderGame`, `SpeakingGame` are imported and
  rendered in `app/child/page.tsx` (lines 38-40, 1827-1836).
- **`MatchingGame` (`matching-game.tsx`) is ORPHANED** — the file exists but is never
  imported/rendered anywhere. It is OUT OF SCOPE (skip it, or delete separately).
- **The 3 live games**: fetch up to 200 words via `getWords()` → `/vocabulary/`, then
  `shuffle(...).slice(0, N)` — **pure random**.
- **Games already report results** via `recordGameSession("<gameId>", {...})` →
  `POST /games/{game_id}/play`, which updates `WordProgress.success_rate` and
  auto-masters at `success_rate >= 0.8 && total_attempts >= 3`.
- **Backend SM-2 engine exists but games ignore it**:
  - `GET /adaptive/{child_id}/review-queue?max_cards=20&max_new=5` →
    `ReviewQueueResponse { cards[], total_due, new_cards_today }`.
  - Each card: `word_id, word, word_cantonese, jyutping, image_url, audio_url,
    definition_cantonese, is_new, queue_reason, easiness_factor, interval,
    next_review`.
  - `POST /adaptive/{child_id}/review { word_id, quality(0-5) }` updates SM-2.
  - Frontend already has `getReviewQueue()` and `submitReview()` in
    `lib/api/word-personalization.ts`.

## Key Architecture Decisions
1. **Word source = review queue, with random fallback.** Games call
   `getReviewQueue(childId, maxCards)` first. If it returns fewer usable cards than
   the game needs (new child, empty queue), **backfill** with `getWords()` random
   selection so games never break.
2. **Mastery source of truth = backend.** Games keep calling `recordGameSession`
   (unchanged) so `WordProgress`/`success_rate` stays correct. ADDITIONALLY, after
   the game ends, submit an SM-2 quality rating per reviewed word via `submitReview`
   so the spaced-repetition schedule advances. Both write to the same backend; no
   new mastery formula is introduced client-side.
3. **Quality mapping (game result → SM-2 quality 0-5):**
   - Correct on first try, fast → `4` (Easy)
   - Correct → `3` (Good)
   - Correct after retry / slow → `2` (Hard)
   - Incorrect / gave up → `1` (Again / lapse)
   (Games that don't track per-word timing use: correct → 3, incorrect → 1.)
4. **Distractors** (quiz / pick-a-picture wrong options) still come from the broader
   word pool (`getWords()`), preferably same-category — this is a Phase 2 nicety, not
   required for Phase 1.
5. **Only usable cards.** A card is usable for a game if it has the fields that game
   needs (e.g. matching/quiz/pick-a-picture need `image_url` + `word_cantonese`;
   speaking needs `word_cantonese`/`jyutping`; listening needs `audio_url`). Filter
   review-queue cards by usability, then backfill.

## Scope
IN: shared word-selection helper, wiring the 4 game components to it, per-word SM-2
submission after game end, graceful fallback, no regressions to `recordGameSession`.
OUT: new backend endpoints, per-modality signal tracking (visual/audio/speaking as
separate counters), the literal `+= 0.08` mastery scheme from the doc tables,
category-aware distractor generation (Phase 2), reward-threshold changes.

---

## Implementation Steps

### Step 1 — Shared selection helper
`lib/games/select-game-words.ts` (new file):
- `export async function selectGameWords(opts: { childId: string; count: number;
  requires: ("image"|"cantonese"|"audio"|"jyutping")[]; }): Promise<GameWord[]>`
- Logic:
  1. `const queue = await getReviewQueue(childId, Math.max(count*2, 20)).catch(() => null)`
  2. Map `queue.cards` → `GameWord` and filter by `requires` (has image_url, etc.).
  3. If usable review words `>= count` → shuffle **lightly within priority order**
     (keep queue ordering as the primary signal; optional small shuffle for variety)
     and take `count`.
  4. Else backfill: `getWords({ childId, includeExternal:true, includeMongodb:true,
     limit:200 })`, filter by `requires`, random-shuffle, take the remaining slots,
     dedupe by `word_id`.
  5. Return exactly `count` (or fewer if the whole corpus is smaller).
- `GameWord` type: normalized shape both sources map to (`id, word, word_cantonese,
  jyutping, image_url, audio_url, definition_cantonese, category, is_new?,
  queue_reason?`). Reuse existing `Word`/`WordResponse` fields.
- Expectation: unit-level correctness — returns `count` items, prioritizes review
  words, never throws on empty queue.

### Step 2 — Per-word SM-2 submission helper
`lib/games/submit-game-reviews.ts` (new file):
- `export async function submitGameReviews(childId: string, results:
  { wordId: string; correct: boolean; fast?: boolean; retried?: boolean }[]):
  Promise<void>`
- Maps each result → quality (see decision 3), calls `submitReview(childId, wordId,
  quality)` per word, wrapped in try/catch so one failure doesn't block others
  (mirror `recordGameSession`'s silent-fail behavior). Only submit for words that were
  sourced from the review queue (skip pure-random backfill words to avoid creating
  SR cards for words the child hasn't formally started — OR allow it; decide via a
  flag `onlyReviewWords=true` default).
- Expectation: called once at game end; never throws to the UI.

### Step 3 — Wire quiz-game.tsx
- Replace `getWords(...) + shuffle + slice(0, TOTAL_ROUNDS)` (round words) with
  `await selectGameWords({ childId, count: TOTAL_ROUNDS, requires: ["image","cantonese"] })`.
- Distractors (wrong options) still from `getWords` pool (unchanged for Phase 1).
- Keep existing `wordsSeenRef` / `wordsCorrectRef` + `recordGameSession`.
- At game end, after `recordGameSession`, call `submitGameReviews(childId, perWord)`.
- Verify: game loads 10 rounds, plays, records session; falls back if queue empty.

### Step 4 — Wire speaking-game.tsx
- `selectGameWords({ childId, count: TOTAL_ROUNDS, requires: ["cantonese"] })`
  (speaking needs the target word; image optional).
- Speaking has no hard correctness → map: attempted → quality 3, skipped → quality 1
  (or omit SM-2 submit for speaking — DECISION D1, default: attempted=3).
- Add `submitGameReviews` at end (guarded by D1).

### Step 5 — Wire word-builder-game.tsx
- `selectGameWords({ childId, count: N, requires: ["cantonese"] })`, preserving the
  existing "prefer camera-captured words" behavior by merging captured words first,
  then review-queue words, then random backfill.
- Add `submitGameReviews` at end (per D1/D2).

### Step 6 — Verify & QA
- `npm run build` clean.
- Manually play EACH of the 3 live games via the test account
  (community.parent.one@example.com) in a browser:
  - Confirm words load (review-first, fallback works for a fresh child).
  - Confirm `POST /adaptive/{child}/review` fires at game end (network tab).
  - Confirm `recordGameSession` still fires (no regression).
  - Confirm no crash when review queue is empty.

---

## Open Decisions (need your call before coding)
- D1: For **speaking** & **word-builder** (no strict right/wrong), should results feed
  SM-2 at all? Default: speaking=attempted→quality 3; word-builder=correct→3/incorrect→1.
- D2: Should pure **random backfill** words also get SM-2 review submissions (creating
  new SR cards), or only words that came from the review queue? Default: only
  review-queue words (safer, avoids inflating the card set).
- D3: Keep a small **variety shuffle** within the review-priority list, or strictly
  follow queue order? Default: light shuffle among the top `count*1.5` for variety.

## Risks / Mitigations
- **Empty/short queue for new children** → fallback to random guarantees playability.
- **Double mastery writes** (`recordGameSession` + `submitReview`) → both target the
  same backend and are complementary (WordProgress vs SM-2 card); not conflicting, but
  confirm no double-counting of `exposure_count` matters. (It doesn't: they update
  different tables.)
- **Extra latency** (review-queue call before game) → queue call is fast; show the
  existing loading state.

## Estimated effort
- 2 new small helper files + edits to the **3 live game components** (quiz, speaking,
  word-builder). MatchingGame is orphaned — skipped. Phase 1 only. ~half a day.
- Phase 2 (category-aware distractors, per-modality signals) is a separate plan.
