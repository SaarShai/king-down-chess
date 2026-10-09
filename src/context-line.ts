import type { PowerName } from './rules/engine';

/** The first active rank supplies the two-line context (spec §4.9). */
export type Voice = 'you' | 'White' | 'Black';
export interface ContextState {
  voice: Voice;
  review?: string; result?: string; refusal?: string; link?: string;
  armed?: PowerName; armedLine?: string; chain?: boolean; canStop?: boolean;
  read?: string; readNote?: string; midWay?: boolean; free?: boolean;
  powerUse?: boolean;
  selected?: string; stagedEnd?: string; waiting?: boolean; check?: boolean; checkCause?: string;
  computer?: boolean; lesson?: string; lessonNote?: string; asset?: string;
  turnLine?: string;
}
export interface ContextLine { rank: string; line: string; note: string; actions: string[] }
export function contextLine(s: ContextState): ContextLine {
  const line = (rank: string, words: string, note = '', actions: string[] = []): ContextLine => ({ rank, line: words, note, actions });
  if (s.review) return line('review', s.review, s.readNote,  ['back-to-game']);
  const read = [s.read, s.readNote].filter(Boolean).join(' ');
  if (s.result) return line('result', s.result, read);
  if (s.refusal) return line('refusal', s.refusal, read);
  if (s.link) return line('link', s.link, read);
  if (s.armed) {
    const words: Partial<Record<PowerName, [string, string]>> = {
      Freeze: ['Tap an enemy piece.', 'Freeze lasts one turn.'],
      IceWall: ['Tap one of your pieces.', 'Ice Wall lasts one turn.'],
      Sacrifice: ['Tap one of your pawns.', 'Bring back a lost piece there.'],
      Haste: ['Move a piece.', 'It can move again.'],
    };
    const [instruction, cause] = words[s.armed] ?? ['Choose a piece, then a marked square.', ''];
    return line('armed', s.armedLine || instruction, s.armedLine ? instruction : cause, ['power-cancel']);
  }
  if (s.chain) return line('chain', s.canStop ? 'Bite again, or stop here.' : 'Bite again.', s.readNote, s.canStop ? ['stop-chain'] : []);
  if (s.read) return line('read', s.read, s.readNote, s.powerUse ? ['power-use'] : []);
  if (!s.lesson && s.midWay) return line('mid-way', s.turnLine || (s.free ? 'Make your move, or tap End turn.' : 'Move it again, or tap End turn.'));
  if (s.selected) return line('selected', s.selected, s.readNote);
  if (!s.lesson && s.stagedEnd) return line('staged-end', s.turnLine || `${s.stagedEnd} Tap End turn to finish.`);
  if (!s.lesson && s.waiting) return line('waiting', s.turnLine || `${s.check ? 'Check. ' : ''}Your turn is ready.`, s.turnLine ? '' : 'Tap End turn, or Undo.');
  if (!s.lesson && s.check) return line('check', s.voice === 'you' ? 'Check! Your move.' : `Check! ${s.voice} to move.`, s.checkCause);
  if (!s.lesson && s.computer) return line('computer', 'Their move.');
  if (s.lesson) {
    const task = s.lessonNote || s.lesson, end = task.indexOf('. ');
    return line('lesson', end < 0 ? task : task.slice(0, end + 1), end < 0 ? '' : task.slice(end + 2));
  }
  if (s.asset) return line('asset', s.asset);
  return line('your-move', s.voice === 'you' ? 'Your move.' : `${s.voice} to move.`);
}
