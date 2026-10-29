import type { LessonStore } from './lesson-shelf';
import { canWriteLocal } from './account/local';

export type LessonProgress = LessonStore & Record<string, unknown>;

export function readLessonStore(raw: string | null): LessonProgress {
  try {
    const value: unknown = JSON.parse(raw ?? '{}');
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    const store = value as Record<string, unknown>;
    return { ...store, done: Array.isArray(store.done) ? store.done.filter((name): name is string => typeof name === 'string') : [] };
  } catch { return {}; }
}

export function completeLesson(store: LessonProgress, name: string): LessonProgress {
  const done = store.done ?? [];
  return done.includes(name) ? store : { ...store, done: [...done, name] };
}

/** Lessons done, by name, in localStorage `kingdown.lessons`. */
export function progress(): LessonProgress {
  try { return canWriteLocal(localStorage) ? readLessonStore(localStorage.getItem('kingdown.lessons')) : {}; }
  catch { return {}; }
}

export function recordLesson(name: string): boolean {
  try {
    if (!canWriteLocal(localStorage)) return false;
    const store = progress(), next = completeLesson(store, name);
    if (next !== store) localStorage.setItem('kingdown.lessons', JSON.stringify(next));
    return true;
  } catch { return false; }
}
