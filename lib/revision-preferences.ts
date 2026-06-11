export const DEFAULT_REVISION_QUESTION_COUNT = 5;
export const MIN_REVISION_QUESTION_COUNT = 1;
export const MAX_REVISION_QUESTION_COUNT = 5;

function getStorageKey(childId: string) {
  return `revision:question-count:${childId}`;
}

function normalizeQuestionCount(value: number) {
  return Math.min(
    MAX_REVISION_QUESTION_COUNT,
    Math.max(MIN_REVISION_QUESTION_COUNT, Math.round(value)),
  );
}

export function getRevisionQuestionCount(childId: string): number {
  if (typeof window === "undefined") {
    return DEFAULT_REVISION_QUESTION_COUNT;
  }

  const raw = window.localStorage.getItem(getStorageKey(childId));
  if (!raw) {
    return DEFAULT_REVISION_QUESTION_COUNT;
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    return DEFAULT_REVISION_QUESTION_COUNT;
  }

  return normalizeQuestionCount(parsed);
}

export function setRevisionQuestionCount(childId: string, count: number) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    getStorageKey(childId),
    String(normalizeQuestionCount(count)),
  );
}
