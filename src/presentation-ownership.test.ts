import { afterEach, expect, it } from 'vitest';
import { GameRules } from './game-rules';
import { A, RULES, T, parseRule, parseSq, setRules } from './rules/engine';
import { cursorText } from './cursor-text';
import { marksModel, railsOf } from './marks-model';
import { checkCause, checkersOf, describeMove, threatsIn } from './move-text';
import { pieceGuide, pieceStates, pieceTitle, reachOf, readText, unmarkedTap, whyNot } from './read';
import { frozenPieces } from './render/frost';
import { PRESETS, designCode, fromPreset } from './workshop/model';

const at = parseSq;
afterEach(() => setRules());

it('keeps two design owners names in titles, reads, refusals, speech and move descriptions', () => {
  const owners = ['Old Ward', 'New Ward'].map(name => new GameRules(parseRule(`design=${designCode({ ...fromPreset(PRESETS.find(p => p.key === 'rook')!), name, letter: 'Y' })}`)));
  const pos = owners[0].fromFen('7k/8/8/8/3T4/8/8/K7 w - - 0 1');
  setRules({});
  const ambient = structuredClone(RULES);
  for (const i of [0, 1, 0]) {
    const owner = owners[i], name = ['Old Ward', 'New Ward'][i];
    expect(pieceTitle(owner, T)).toBe(`White ${name}.`);
    expect(readText(owner, pos, at('d4'))).toBe(`${name} · Moves like a rook.`);
    expect(whyNot(owner, pos, at('d4'), at('e5'))).toBe(`${name} cannot reach e5.`);
    expect(cursorText(owner, pos, at('d4'), at('d4'), true)).toBe(`d4, white ${name}, selected`);
    expect(describeMove(owner, pos, { from: at('d4'), to: at('d5'), captures: [] })).toBe(`White ${name} d4 to d5.`);
  }
  expect(RULES).toEqual(ambient);
});

it('keeps two owners mark meanings in read states, refusals, legal reach and frost', () => {
  const freeze = new GameRules({ kings: [null, { king: 'Frost', power: 'Freeze' }] });
  const wall = new GameRules({ kings: [null, { king: 'Frost', power: 'IceWall' }] });
  const pos = freeze.fromFen('7k/8/8/8/3R4/8/8/K7 w - - 0 1');
  pos.marks = [undefined, { sq: at('d4'), left: 2 }];
  setRules({});
  const ambient = structuredClone(RULES);
  for (const owner of [freeze, wall, freeze]) {
    const frozen = owner === freeze;
    expect(pieceStates(owner, pos, at('d4'))).toEqual(frozen ? ['Frozen'] : []);
    expect(frozenPieces(owner, pos)).toEqual(frozen ? [{ sq: at('d4'), turns: 2 }] : []);
    expect(reachOf(owner, pos, at('d4')).step.size > 0).toBe(!frozen);
    expect(unmarkedTap(owner, pos, at('d4'), null, null, []).notice).toBe(frozen ? 'Frozen: it cannot move this turn.' : '');
    expect(whyNot(owner, pos, at('d4'), at('d5'))).toBe(frozen ? 'Frozen: it cannot move this turn.' : 'That leaves your king in check.');
  }
  expect(RULES).toEqual(ambient);
});

it('keeps two owners generated check and capture paths outside the ambient rules', () => {
  const classic = new GameRules({ archerShots: 'classic' });
  const far = new GameRules({ archerShots: 'far2' });
  const check = classic.fromFen('7k/8/8/8/8/3a4/4K3/8 w - - 0 1');
  const take = classic.fromFen('7k/8/8/8/8/3a4/4R3/K7 w - - 0 1');
  setRules({ archerChecks: false });
  const ambient = structuredClone(RULES);
  for (const owner of [classic, far, classic]) {
    const attacks = owner === classic;
    expect(checkersOf(owner, check)).toEqual(attacks ? [{ sq: at('d3'), king: at('e2'), path: 'straight' }] : []);
    expect(checkCause(owner, check)).toBe(attacks ? 'Their archer can shoot your king.' : '');
    expect(threatsIn(owner, take)).toEqual(attacks ? [{ from: at('d3'), to: at('e2') }] : []);
    expect(pieceGuide(owner, A).captures).toContain(attacks ? 'diagonally adjacent' : 'forward diagonal');
  }
  expect(RULES).toEqual(ambient);
});

it('keeps each owners designed rails with its generated move marks', () => {
  const owners = ['rook', 'bishop'].map(key => new GameRules(parseRule(`design=${designCode({ ...fromPreset(PRESETS.find(p => p.key === key)!), name: 'Owned Piece', letter: 'Y' })}`)));
  const pos = owners[0].fromFen('1k6/8/8/8/3T4/8/8/1K6 w - - 0 1');
  setRules({});
  const ambient = structuredClone(RULES);
  for (const i of [0, 1, 0]) {
    const owner = owners[i], marks = marksModel(owner.legalMoves(pos).filter(m => m.from === at('d4')));
    const rails = railsOf(owner.rules.design, pos.board, at('d4'), [...marks.moves, ...marks.captures], marks.captures);
    expect(rails.map(r => r.to).sort()).toEqual((i === 0 ? ['d8', 'h4', 'd1', 'a4'] : ['h8', 'g1', 'a1', 'a7']).map(at).sort());
    expect(rails.every(r => r.end === 'arrow')).toBe(true);
  }
  expect(RULES).toEqual(ambient);
});
