import type { PowerName } from './rules/engine';

/** The first active rank supplies the two-line context (spec §4.9). */
export type Voice = 'you' | 'White' | 'Black';
export interface ContextState {
  voice: Voice;
  review?: string; result?: string; refusal?: string; link?: string;
  armed?: PowerName; armedLine?: string; armedRefusal?: string; chain?: boolean; canStop?: boolean;
  read?: string; readNote?: string; midWay?: boolean; free?: boolean;
  powerUse?: boolean;
  selected?: string; stagedEnd?: string; waiting?: boolean; check?: boolean; checkCause?: string;
  computer?: boolean; lesson?: string; lessonNote?: string; lessonLearned?: string; asset?: string;
  turnLine?: string; teach?: string;
  previously?: string; previouslyDetail?: string; previouslyBefore?: string; seeAgain?: boolean;
}
export interface ContextLine { rank: string; line: string; note: string; actions: string[]; before?: string }
export function contextLine(s: ContextState): ContextLine {
  const line = (rank: string, words: string, note = '', actions: string[] = []): ContextLine => ({ rank, line: words, note, actions });
  if (s.review) return line('review', s.review, s.readNote,  ['back-to-game']);
  const read = [s.read, s.readNote].filter(Boolean).join(' ');
  if (s.result) return line('result', s.result, read);
  if (s.refusal) return line('refusal', s.refusal, read);
  if (s.link) return line('link', s.link, read || s.checkCause);
  if (s.armed) {
    const words: Partial<Record<PowerName, [string, string]>> = {
      Freeze: ['Select an enemy piece.', 'Freeze lasts one turn.'],
      IceWall: ['Select one of your pieces.', 'Ice Wall lasts one turn.'],
      Sacrifice: ['Select one of your pawns.', 'Bring back a lost piece there.'],
      Haste: ['Move a piece.', 'It can move again.'],
    };
    const [instruction, cause] = words[s.armed] ?? ['Choose a piece, then a marked square.', ''];
    // A refused tap keeps the armed power's line and Cancel; the refusal leads the note (playtest F-103).
    return line('armed', s.armedLine || instruction, [s.armedRefusal, s.armedLine ? instruction : cause].filter(Boolean).join(' '), ['power-cancel']);
  }
  if (s.chain) return line('chain', s.canStop ? 'Bite again, or stop here.' : 'Bite again.', `The chain ends when no more bites are available${s.canStop ? ', or when you select Stop here' : ''}.`, s.canStop ? ['stop-chain'] : []);
  if (s.read) return line('read', s.read, s.readNote, s.powerUse ? ['power-use'] : []);
  if (!s.lesson && s.midWay) return line('mid-way', s.turnLine || (s.free ? 'Make your move, or select End turn.' : 'Move it again, or select End turn.'));
  // A lesson keeps its task in view while its piece is selected.
  if (!s.lesson && s.selected) return line('selected', s.selected, s.readNote);
  if (!s.lesson && s.stagedEnd) return line('staged-end', s.turnLine || `${s.stagedEnd} Select End turn to finish.`);
  if (!s.lesson && s.waiting) return line('waiting', s.turnLine || `${s.check ? 'Check. ' : ''}Your turn is ready.`, s.turnLine ? '' : 'Select End turn, or Undo.');
  if (s.previously) return { ...line('previously', `Previously: ${s.previously}`, s.previouslyDetail, s.seeAgain ? ['see-again'] : []), before: s.previouslyBefore ? `You: ${s.previouslyBefore}` : '' };
  if (!s.lesson && s.computer) return line('computer', 'Their move.', s.checkCause);
  if (!s.lesson && s.check) return line('check', s.voice === 'you' ? 'Check! Your move.' : `Check! ${s.voice} to move.`, s.checkCause);
  if (s.lesson) {
    if (s.lessonLearned) return line('lesson', `${s.lessonLearned} learned.`);
    const task = s.lessonNote || s.lesson, end = task.indexOf('. ');
    return line('lesson', end < 0 ? task : task.slice(0, end + 1), end < 0 ? '' : task.slice(end + 2));
  }
  if (s.asset) return line('asset', s.asset);
  return line('your-move', s.voice === 'you' ? 'Your move.' : `${s.voice} to move.`, s.teach, s.teach ? ['first-lesson'] : []);
}
