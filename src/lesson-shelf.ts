import { LESSONS } from './lessons';
import { DEFAULT_RULES } from './rules/rules';
import { POOL } from './rules/setup';

export interface LessonStore {
  readonly done?: readonly string[];
}

export interface ShelfPiece {
  name: string;
  line: string;
  lesson: number;
  status: 'Learned' | 'Next' | 'Bonus' | '';
}

// Lessons use today's default rules, even when the kept game uses an older preset.
const LINES: Record<string, string> = {
  Archer: 'Shoots without moving',
  Beast: DEFAULT_RULES.beastChains ? 'Can bite again after a bite' : 'One bite per turn',
  Maester: 'Swaps with a friend',
  Ogre: 'Shoves a neighbour',
  Guard: DEFAULT_RULES.guardImmune ? 'Only a king takes it' : 'Blocks the enemy',
  Paladin: DEFAULT_RULES.paladinJumpsFriends ? 'Jumps over its own pieces' : 'Moves like a queen',
};

/** Saved lesson names set the shelf state; the shelf and boards keep one order. */
export function lessonShelf(store: LessonStore): { pieces: ShelfPiece[]; next: ShelfPiece | null } {
  const done = store.done ?? [], order = LESSONS.map(l => l.name);
  const nextName = order.find(name => !done.includes(name));
  const pieces: ShelfPiece[] = order.map(name => ({
    name,
    line: LINES[name],
    lesson: LESSONS.findIndex(l => l.name === name),
    status: done.includes(name) ? 'Learned'
      : name === 'Paladin' && !POOL.includes('L') ? 'Bonus'
      : name === nextName ? 'Next' : '',
  }));
  return { pieces, next: pieces.find(p => p.name === nextName) ?? null };
}
