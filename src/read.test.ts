import { afterEach, expect, it } from 'vitest';
import { A, DEFAULT_RULES, parseSq, setRules, type ArcherShots } from './rules/engine';
import { fromFen } from './rules/setup';
import { pieceGuide, guideTypes, reachOf, readText, readTap, unmarkedTap, whyNot } from './read';

const at = parseSq;
afterEach(() => setRules(DEFAULT_RULES));

it('reads an enemy knight from its own side without changing the position', () => {
  const pos = fromFen('7k/8/8/8/3n4/8/8/K7 w - - 0 1');
  const before = structuredClone(pos);
  expect([...reachOf(pos, at('d4')).step].sort()).toEqual(['b3', 'b5', 'c2', 'c6', 'e2', 'e6', 'f3', 'f5'].map(at).sort());
  expect(pos).toEqual(before);
});

it('reads the first guide sentence and the piece name', () => {
  const pos = fromFen('7k/8/8/8/3R4/8/8/K7 w - - 0 1');
  expect(readText(pos, at('d4'))).toBe('rook · Moves any distance orthogonally.');
});

it('reads Frozen and Ice Wall from both live mark slots', () => {
  setRules({ kings: [{ king: 'Frost', power: 'Freeze' }, { king: 'Frost', power: 'IceWall' }] });
  const pos = fromFen('7k/8/8/4n3/3R4/8/8/K7 w - - 0 1');
  pos.marks = [{ sq: at('e5') }, { sq: at('e5') }];
  expect(readText(pos, at('e5'))).toBe('knight · Moves in an L, over any piece.\nFrozen · Ice Wall');
  pos.marks = [{ sq: at('e5'), left: 0 }, { sq: at('e5'), left: 0 }];
  expect(readText(pos, at('e5'))).not.toMatch(/Frozen|Ice Wall/);
});

it('keeps every short read sentence within eight words', () => {
  for (let t = 1; t <= 15; t++) {
    const pos = fromFen('7k/8/8/8/8/8/8/K7 w - - 0 1');
    pos.board[at('d4')] = t;
    expect(readText(pos, at('d4')).split(' · ')[1].split(/\s+/).length, String(t)).toBeLessThanOrEqual(8);
  }
});

it('names the Guard refusal in eight words', () => {
  const pos = fromFen('7k/8/8/4g3/3R4/8/8/K7 w - - 0 1');
  expect(whyNot(pos, at('d4'), at('e5'))).toBe('Only a king can take a guard.');
});

it('names the Ice Wall refusal', () => {
  setRules({ kings: [null, { king: 'Frost', power: 'IceWall' }] });
  const pos = fromFen('7k/8/8/3p4/3R4/8/8/K7 w - - 0 1');
  pos.marks = [undefined, { sq: at('d5') }];
  expect(whyNot(pos, at('d4'), at('d5'))).toBe('Ice Wall: nothing can take it now.');
});

it('names Holy Light shelter and respects its side-only reach', () => {
  setRules({ kings: [null, { king: 'Spirit', power: 'HolyLight' }], holyLightShelter: true, holyLightShelterOrtho: true });
  const pos = fromFen('8/8/3k4/3p4/3R4/8/8/K7 w - - 0 1');
  expect(whyNot(pos, at('d4'), at('d5'))).toBe('Holy Light: this piece cannot be taken.');
});

it('names Mercy and leaves the pawn exception in force', () => {
  setRules({ kings: [null, { king: 'Spirit', power: 'Mercy' }], mercyAura: true, mercyAuraPawnsTake: true });
  const pos = fromFen('8/8/3k4/3p4/3R4/8/8/K7 w - - 0 1');
  expect(whyNot(pos, at('d4'), at('d5'))).toBe('Only a pawn can take beside Mercy.');
});

it('names a frozen own piece', () => {
  setRules({ kings: [null, { king: 'Frost', power: 'Freeze' }] });
  const pos = fromFen('7k/8/8/8/3R4/8/8/K7 w - - 0 1');
  pos.marks = [undefined, { sq: at('d4') }];
  expect(whyNot(pos, at('d4'), at('d5'))).toBe('Frozen: it cannot move this turn.');
});

it('keeps the state words on a second short line', () => {
  setRules({ kings: [null, { king: 'Frost', power: 'Freeze' }] });
  const pos = fromFen('7k/8/8/8/3Q4/8/8/K7 w - - 0 1');
  pos.marks = [undefined, { sq: at('d4') }];
  const lines = readText(pos, at('d4')).split('\n');
  expect(lines).toEqual(['queen · Moves any distance in a straight line.', 'Frozen']);
});

it.each(['haste', 'strike'] as const)('names the quiet %s power', tag => {
  setRules({ kings: [{ king: 'Shadow', power: tag === 'haste' ? 'Haste' : 'Strike' }, null], hasteCaptures: false, strikeCaptures: false });
  const pos = fromFen('7k/8/8/3p4/3R4/8/8/K7 w - - 0 1');
  expect(whyNot(pos, at('d4'), at('d5'), tag)).toBe(`${tag === 'haste' ? 'Haste' : 'Strike'} cannot take this turn.`);
});

it('names a move that leaves the king in check', () => {
  const pos = fromFen('4r2k/8/8/8/8/8/4R3/4K3 w - - 0 1');
  expect(whyNot(pos, at('e2'), at('d2'))).toBe('That leaves your king in check.');
});

it.each([
  ['P', 1], ['N', 8], ['B', 13], ['R', 14], ['Q', 27], ['K', 8], ['A', 8], ['L', 27],
  ['G', 8], ['M', 8], ['S', 8], ['O', 8], ['C', 14], ['V', 8], ['T', 27],
] as const)('reads the ordinary %s reach under the live rules', (letter, count) => {
  const pos = fromFen(`8/7k/8/8/3${letter}4/8/${letter === 'K' ? '8' : 'K7'}/8 w - - 0 1`);
  expect(reachOf(pos, at('d4')).step.size).toBe(count);
});

it('keeps legal pin limits and gives no frozen attack probe', () => {
  const pos = fromFen('4r2k/8/8/8/8/8/4R3/4K3 w - - 0 1');
  expect(reachOf(pos, at('e2')).step.has(at('d2'))).toBe(false);
  setRules({ kings: [null, { king: 'Frost', power: 'Freeze' }] });
  pos.marks = [undefined, { sq: at('e2') }];
  expect(reachOf(pos, at('e2')).step.size).toBe(0);
  expect(reachOf(pos, at('a4')).step.size).toBe(0);
});

it('clears a held turn without offering armed moves or a reserve drop', () => {
  setRules({ kings: [{ king: 'Shadow', power: 'Haste' }, null], guardReserve: 'rank1' });
  const pos = fromFen('7k/8/8/8/3R4/8/8/K7 w - - 0 1');
  pos.haste = at('a1'); pos.free = true; pos.waiting = [1, 0];
  const before = structuredClone(pos);
  const reach = reachOf(pos, at('d4'));
  expect(reach.step.size).toBe(14);
  expect(reach.step.has(at('d4'))).toBe(false);
  expect(pos).toEqual(before);
});

it('reads Archer shots and Ogre shove landings under the live rules', () => {
  const pos = fromFen('7k/8/5p2/8/3A4/8/8/K7 w - - 0 1');
  expect([...reachOf(pos, at('d4')).shot]).toEqual([at('f6')]);
  const ogre = fromFen('7k/8/8/4g3/3O4/8/8/K7 w - - 0 1');
  expect(reachOf(ogre, at('d4')).push).toEqual([{ from: at('e5'), to: at('f6') }]);
  expect(reachOf(ogre, at('d4')).take.size).toBe(0);
});

it('keeps counted March and Leap targets among the ordinary reach', () => {
  setRules({ kings: [{ king: 'Mud', power: 'March' }, null], marchUses: 3 });
  const pawn = fromFen('7k/8/8/8/3P4/8/8/K7 w - - 0 1');
  expect([...reachOf(pawn, at('d4')).step].sort()).toEqual(['d5', 'd6'].map(at).sort());
  setRules({ kings: [{ king: 'Mud', power: 'Leap' }, null], leapUses: 3 });
  const rook = fromFen('7k/8/8/3P4/3R4/8/8/K7 w - - 0 1');
  expect(reachOf(rook, at('d4')).step.has(at('d6'))).toBe(true);
  expect(reachOf(rook, at('d4')).step.has(at('d5'))).toBe(false);
});

it('names a king at the end of a bite chain', () => {
  const pos = fromFen('8/8/5k2/4p3/3S4/8/8/K7 w - - 0 1');
  expect(whyNot(pos, at('d4'), at('f6'), null, [at('e5')])).toBe('A bite chain cannot take a king.');
});

it('does not offer takes through Guard, Ice Wall, Holy Light or Mercy', () => {
  const guard = fromFen('7k/8/8/4p3/3G4/8/8/K7 w - - 0 1');
  expect(reachOf(guard, at('d4')).take.size).toBe(0);
  for (const power of ['IceWall', 'HolyLight', 'Mercy'] as const) {
    setRules({ kings: [null, { king: power === 'IceWall' ? 'Frost' : 'Spirit', power }], holyLightShelter: true, mercyAura: true, mercyAuraPawnsTake: true });
    const pos = fromFen('8/8/3k4/3p4/3R4/8/8/K7 w - - 0 1');
    if (power === 'IceWall') pos.marks = [undefined, { sq: at('d5') }];
    expect(reachOf(pos, at('d4')).take.size, power).toBe(0);
  }
});

it('keeps a selected piece when an enemy is read', () => {
  const pos = fromFen('7k/8/n7/8/4P3/8/8/K7 w - - 0 1');
  expect(readTap(pos, at('a6'), at('e4'), null, true)).toEqual({ selected: at('e4'), inspected: at('a6') });
  expect(readTap(pos, at('a6'), at('e4'), at('a6'), true)).toEqual({ selected: at('e4'), inspected: null });
  expect(readTap(pos, at('b6'), at('e4'), at('a6'), true)).toEqual({ selected: null, inspected: null });
});

it('selects an own movable piece and reads without a move role', () => {
  const pos = fromFen('7k/8/n7/8/4P3/8/8/K7 w - - 0 1');
  expect(readTap(pos, at('e4'), null, at('a6'), true)).toEqual({ selected: at('e4'), inspected: null });
  expect(readTap(pos, at('e4'), at('e4'), null, true)).toEqual({ selected: null, inspected: null });
  expect(readTap(pos, at('e4'), null, null, false)).toEqual({ selected: null, inspected: at('e4') });
});

it('keeps a Beast chain after a wrong tap, and reads a refused target', () => {
  const pos = fromFen('7k/8/n7/8/4P3/8/8/K7 w - - 0 1');
  expect(unmarkedTap(pos, at('a6'), at('e4'), null, [at('d5')])).toEqual({ selected: at('e4'), inspected: null, pending: [at('d5')], notice: 'Tap a marked piece, or stop here.' });
  expect(unmarkedTap(pos, at('a6'), at('e4'), null, [])).toEqual({ selected: at('e4'), inspected: at('a6'), pending: [], notice: 'The pawn cannot take the knight on a6.' });
});

it('names no legal move and an unmarked empty destination', () => {
  const pos = fromFen('4k3/4r3/8/8/8/8/4B3/4K3 w - - 0 1');
  expect(unmarkedTap(pos, at('e2'), null, null, []).notice).toBe('This bishop has no legal move.');
  expect(unmarkedTap(pos, at('d3'), at('e2'), null, []).notice).toBe('That leaves your king in check.');
});

it('lists the lab pieces in the position that the Guide reads', () => {
  const shown = fromFen('7k/8/8/8/8/8/8/KCVT4 w - - 0 1');
  expect(guideTypes(shown)).toEqual(expect.arrayContaining([13, 14, 15]));
});

it('describes the released far2 shots and marks their legal squares', () => {
  setRules({ archerShots: 'far2' });
  const pos = fromFen('7k/8/1p1p1p2/4p3/1p1A1p2/8/3p4/K7 w - - 0 1');
  expect(pieceGuide(A).captures).toBe('Shoots without moving. It takes an enemy 2 squares away in a straight line, or 2 squares away on a forward diagonal. The shot goes over pieces.');
  expect([...reachOf(pos, at('d4')).shot].sort()).toEqual(['b4', 'f4', 'd2', 'd6', 'b6', 'f6'].map(at).sort());
});

const archerReadings: Record<ArcherShots, string> = {
  classic: 'Shoots near diagonals or 2 squares straight.',
  plusDiag2: 'Shoots also on distant backward diagonals.',
  ring2: 'Shoots anywhere on the second ring.',
  forward3: 'Shoots only ahead, without moving.',
  plusDiagFwd2: 'Shoots also on distant forward diagonals.',
  plusDiagFwd2Clear: 'Far forward diagonal shots need an empty middle.',
  fwd2NoBack: 'Shoots forward diagonals, never straight back.',
  fwd2NoSide: 'Shoots forward diagonals, never sideways.',
  far2: 'Shoots 2 squares straight or diagonally forward.',
  over2: 'Shoots distant enemies only over a piece.',
  nearOver2: 'Shoots near diagonals; distant shots need a piece.',
  fwdNearOver2: 'Shoots forward diagonals; far shots need a piece.',
};
it.each(Object.entries(archerReadings))('reads the %s Archer act from the live rules', (shots, words) => {
  setRules({ archerShots: shots as ArcherShots });
  const pos = fromFen('7k/8/8/8/3A4/8/8/K7 w - - 0 1');
  expect(readText(pos, at('d4'))).toBe(`archer · ${words}`);
  expect(words.split(/\s+/).length).toBeLessThanOrEqual(8);
});

it.each([
  ['L', 'paladin · Jumps over its own pieces.'],
  ['G', 'guard · Only a king can take it.'],
  ['M', 'maester · Swaps places with your own piece.'],
  ['S', 'beast · Can bite again after a bite.'],
  ['O', 'ogre · Can shove a neighbour.'],
  ['C', 'catapult · Takes beyond an enemy piece.'],
  ['V', 'reaver · Can step after a take.'],
  ['T', 'templar · Moves like a queen on capital squares.'],
])('reads the %s special act', (letter, words) => {
  const pos = fromFen(`7k/8/8/8/3${letter}4/8/8/K7 w - - 0 1`);
  expect(readText(pos, at('d4'))).toBe(words);
});
