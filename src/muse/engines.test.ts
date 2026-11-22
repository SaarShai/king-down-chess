// The word tools read games that archived engines saved (engines/*.save.json) with the current rules (position.ts).
// Each saved move must stay legal, read as a sentence (as `sentences()` in tools.ts does) and reach its saved position.
// Each archive holds the same two moves (Nb1-c3, a7-a6), so only a large break fails there. The cards-only save of
// engine e58d7d37 adds a Freeze, a king move and a pawn's Strike capture.
import { readdirSync, readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import type { MatchSave } from '../match';
import { describeMove } from '../move-text';
import { toFen } from '../rules/setup';
import { boardWords } from './board-words';
import { board } from './position';

const saves = [...readdirSync('engines').filter(file => file.endsWith('.save.json')).map(file => `engines/${file}`), 'src/match/fixtures/cards-only-e58d7d37.save.json'];

it.each(saves)('reads the saved game %s in words', file => {
  const save: MatchSave = JSON.parse(readFileSync(file, 'utf8'));
  let fen = save.initialFen;
  for (const { lan, fen: after } of save.commands) {
    const { context, pos, moves } = board(save.rules, fen, [lan]);
    expect(moves.map(m => m.lan), `${lan} from ${fen}`).toEqual([lan]);
    expect(describeMove(context, pos, moves[0].move, true)).toMatch(/\.$/);
    expect(toFen(context.makeMove(pos, moves[0].move))).toBe(after);
    expect(boardWords(save.rules, after, 0).grid).toBeTruthy();
    fen = after;
  }
});
