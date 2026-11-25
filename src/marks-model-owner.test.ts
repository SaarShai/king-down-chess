import { afterEach, expect, it } from 'vitest';
import { GameRules } from './game-rules';
import { parseRule, parseSq, setRules } from './rules/engine';
import { marksModel, railsOf } from './marks-model';
import { PRESETS, designCode, fromPreset } from './workshop/model';

const at = parseSq;
afterEach(() => setRules());

// On d4 (a capital square) the rails of a designed piece follow its marks even with no design, so that case cannot
// show a lost design. On c3 a designed piece has lines only from its owner's design.
it('draws the rails of a designed piece off the capital from its owner design', () => {
  for (const [key, ends] of [['rook', ['c8', 'h3', 'c1', 'a3']], ['bishop', ['a5', 'h8', 'e1', 'a1']]] as const) {
    const owner = new GameRules(parseRule(`design=${designCode({ ...fromPreset(PRESETS.find(p => p.key === key)!), name: 'Owned Piece', letter: 'Y' })}`));
    const pos = owner.fromFen('1k6/8/8/8/8/2T5/8/1K6 w - - 0 1'), marks = marksModel(owner.legalMoves(pos).filter(m => m.from === at('c3')));
    const rails = railsOf(owner.rules.design, pos.board, at('c3'), [...marks.moves, ...marks.captures], marks.captures);
    expect(rails.map(r => r.to).sort(), `${key} design on c3: railsOf in src/marks-model.ts must take the lines from the design it gets`).toEqual(ends.map(at).sort());
  }
});

