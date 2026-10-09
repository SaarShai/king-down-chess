/** The first active rank supplies the two-line context (spec §4.9). */
export type Voice = 'you' | 'White' | 'Black';
export interface ContextState {
  voice: Voice;
  review?: string; result?: string; refusal?: string; link?: string;
  armed?: string; chain?: boolean; canStop?: boolean;
  read?: string; readNote?: string; midWay?: boolean; free?: boolean;
  selected?: string; stagedEnd?: string; waiting?: boolean; check?: boolean;
  computer?: boolean; lesson?: string; lessonNote?: string; asset?: string;
  turnLine?: string;
}
export interface ContextLine { rank: string; line: string; note: string; actions: string[] }
export function contextLine(s: ContextState): ContextLine {
  const line = (rank: string, words: string, note = '', actions: string[] = []): ContextLine => ({ rank, line: words, note, actions });
  if (s.review) return line('review', s.review, s.readNote,  ['back-to-game']);
  if (s.result) return line('result', s.result, s.read);
  if (s.refusal) return line('refusal', s.refusal, s.read);
  if (s.link) return line('link', s.link, s.read);
  if (s.armed) return line('armed', s.armed);
  if (s.chain) return line('chain', s.canStop ? 'Bite again, or stop here.' : 'Bite again.', s.readNote, s.canStop ? ['stop-chain'] : []);
  if (s.read) return line('read', s.read, s.readNote);
  if (!s.lesson && s.midWay) return line('mid-way', s.turnLine || (s.free ? 'Make your move, or tap End turn.' : 'Move it again, or tap End turn.'));
  if (s.selected) return line('selected', s.selected, s.readNote);
  if (!s.lesson && s.stagedEnd) return line('staged-end', s.turnLine || `${s.stagedEnd} Tap End turn to finish.`);
  if (!s.lesson && s.waiting) return line('waiting', s.turnLine || `${s.check ? 'Check. ' : ''}Your turn is ready.`, s.turnLine ? '' : 'Tap End turn, or Undo.');
  if (!s.lesson && s.check) return line('check', s.voice === 'you' ? 'Check! Your move.' : `Check! ${s.voice} to move.`);
  if (!s.lesson && s.computer) return line('computer', 'Their move.');
  if (s.lesson) return line('lesson', s.lesson, s.lessonNote);
  if (s.asset) return line('asset', s.asset);
  return line('your-move', s.voice === 'you' ? 'Your move.' : `${s.voice} to move.`);
}
