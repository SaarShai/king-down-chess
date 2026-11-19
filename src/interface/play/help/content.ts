import { GameRules } from '../../../game-rules';
import { ALWAYS_ON } from '../../../match/setup';
import type { Color, PieceType, PowerName } from '../../../rules/engine';
import { learningNotes } from '../learning-content';
import { learningEntry, type LearnSubject } from '../learning';
import { pieces, text } from '../texts';

export type HelpSubject = LearnSubject | { kind: 'turn' } | { kind: 'frozen'; type: PieceType };
const defaultRules = new GameRules();

export function alwaysOnLabel(power: PowerName): string {
  return ALWAYS_ON.includes(power) ? text.alwaysOnShort : '';
}

export function helpTopic(subject: HelpSubject, rules = defaultRules, side: Color = 0) {
  if (subject.kind === 'turn') return { name: text.ready.slice(0, -1), line: text.choose, detail: text.staged, badge: '' };
  if (subject.kind === 'frozen') {
    const entry = learningEntry({ kind: 'piece', type: subject.type }, rules, undefined, side);
    return { name: pieces[subject.type].name, line: entry.short, detail: learningNotes.Freeze[0], badge: 'Frozen' };
  }
  const entry = learningEntry(subject, rules, undefined, side);
  return { name: entry.name, line: entry.short, detail: entry.full, badge: subject.kind === 'power' ? alwaysOnLabel(subject.id) : '' };
}
