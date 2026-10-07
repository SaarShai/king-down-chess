// The section numbers (§) in this file cite revision 3 of the Workshop doc:
// docs/visual-design/workshop/WORKSHOP-revision-3-2026-10-07.md.
import { describe, expect, it } from 'vitest';
import { judge } from './judge';
import { BLANK, DIRS, KING_STEP, KNIGHT_JUMP, MAX_CODE, ORTHO, PRESETS, setMark, designCode, empty, fromPreset, keyOf, likeAlways, limit, mix, parseDesign, presetOf, validName, type PieceDesign, type Rule } from './model';
import { autoName, letterFollows, letterOf, saveName } from './names';
import { describe as words, squareList } from './text';
import { BLOCKS, blockOf, validDoes, whenOk } from './vocab';
import { KEY, loadDesigns } from './store';

const named = (d: PieceDesign, name = 'Test piece'): PieceDesign => ({ ...d, name, letter: letterOf(name) });
const code = (o: unknown): string => btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const raw = (d: PieceDesign) => ({ kind: 'piece', squares: d.squares, lines: d.lines, rules: d.rules, name: d.name, look: d.look, letter: d.letter });
const AL = { on: 'always' } as const;

describe('the canonical form (§8.4.3)', () => {
  it('gives a preset, the same shape painted on Blank, and a renamed copy one key and one note', () => {
    const preset = fromPreset(presetOf('knight'));
    const painted = { ...fromPreset(BLANK), squares: [...KNIGHT_JUMP()].reverse() };
    const renamed = { ...named(fromPreset(presetOf('knight')), 'Jumper'), look: { body: 'G' as const, auto: false, glow: 'Frost' as const, army: 1 as const } };
    expect(keyOf(painted)).toBe(keyOf(preset));
    expect(keyOf(renamed)).toBe(keyOf(preset));
    expect(judge(painted).note).toBe('Measured in computer games: 3.16.');
    expect(judge(renamed).note).toBe(judge(preset).note);
    // The order of lines and rules does not matter either.
    const p = presetOf('paladin');
    expect(keyOf({ ...p, lines: [...p.lines].reverse(), rules: [...p.rules].reverse() })).toBe(keyOf(p));
  });
});

describe('validation (§8.4.8, §4.9)', () => {
  it('round-trips every preset through its share code', () => {
    for (const p of PRESETS) {
      const d = named(fromPreset(p), p.name);
      const back = parseDesign(designCode(d))!;
      expect(back, p.key).not.toBeNull();
      expect([keyOf(back), back.name, back.letter, back.look]).toEqual([keyOf(d), d.name, d.letter, d.look]);
    }
  });

  it('round-trips the largest design the editor can make', () => {
    const rules: Rule[] = [
      { when: { on: 'afterCard', card: 'any' }, does: { a: 'movesLike', as: 'bishop' } },
      { when: { on: 'zone', zone: 'enemyHalf' }, does: { a: 'linesPass', over: 'any' } },
      { when: { on: 'reaches', zone: 'lastRank' }, does: { a: 'becomes', into: 'choice' } },
    ];
    const squares = [];
    for (let x = -3; x <= 3; x++) for (let y = -3; y <= 3; y++) if (x || y) squares.push({ x, y, mark: 'moveShoot' as const });
    // 18 letters of 4 bytes each, the longest name in bytes.
    const d: PieceDesign = { ...fromPreset(BLANK), name: '𝐀'.repeat(18), letter: 'Z', squares, lines: [...DIRS], rules, look: { body: 'token', auto: false, glow: 'Stratus', army: 1 } };
    expect(validName(d.name)).toBe(true);
    expect(limit(d)).toBeNull();
    const c = designCode(d);
    expect(c.length).toBeLessThanOrEqual(MAX_CODE);
    expect(keyOf(parseDesign(c)!)).toBe(keyOf(d));
  });

  it('refuses bad values, kings, oversize codes, (0, 0) and blocked shapes', () => {
    const k = named(fromPreset(presetOf('knight')));
    const bad = (f: (o: ReturnType<typeof raw>) => unknown) => parseDesign(code(f(raw(k))));
    expect(bad(o => o)).not.toBeNull();
    expect(parseDesign('x'.repeat(MAX_CODE + 1))).toBeNull();
    expect(parseDesign('not a code!')).toBeNull();
    expect(bad(o => ({ ...o, extra: 1 }))).toBeNull();
    expect(bad(o => ({ ...o, kind: 'card' }))).toBeNull();
    expect(bad(o => ({ ...o, name: '<script>' }))).toBeNull();
    expect(bad(o => ({ ...o, letter: 'K' }))).toBeNull(); // the engine's letters
    expect(bad(o => ({ ...o, look: { ...o.look, body: 'K' } }))).toBeNull(); // H11: no king body
    expect(bad(o => ({ ...o, squares: [...o.squares, { x: 0, y: 0, mark: 'both' }] }))).toBeNull();
    expect(bad(o => ({ ...o, squares: [...o.squares, { x: 4, y: 0, mark: 'both' }] }))).toBeNull(); // H4
    expect(bad(o => ({ ...o, squares: [...o.squares, { x: 1, y: 2, mark: 'move' }] }))).toBeNull(); // twice
    expect(bad(o => ({ ...o, squares: [{ x: 1, y: 0, mark: 'fly' }] }))).toBeNull();
    expect(bad(o => ({ ...o, lines: ['up'] }))).toBeNull();
    expect(bad(o => ({ ...o, squares: [], lines: [] }))).toBeNull(); // H3
    expect(bad(o => ({ ...o, rules: [{ when: AL, does: { a: 'cannotBeTaken', by: 'allButKing' } }] }))).toBeNull(); // H2b
    expect(bad(o => ({ ...o, rules: [{ when: AL, does: { a: 'cannotBeTaken', by: 'all' } }] }))).toBeNull(); // H2
    expect(bad(o => ({ ...o, rules: [{ when: { on: 'reaches', zone: 'capital' }, does: { a: 'becomes', into: 'Q' } }] }))).toBeNull(); // H12
    expect(bad(o => ({ ...o, rules: [{ when: AL, does: { a: 'becomes', into: 'K' } }] }))).toBeNull();
    expect(bad(o => ({ ...o, rules: [{ when: { on: 'takes' }, does: { a: 'chain' } }, { when: { on: 'takes' }, does: { a: 'chain' } }] }))).toBeNull(); // H8
  });

  it('refuses each hard limit H1-H12 that build 1a can meet', () => {
    // H1, H11: no pill offers a king as a target, a "becomes" choice of king, pawn or beast.
    expect(validDoes({ a: 'swap', with: 'king' })).toBe(false);
    expect(validDoes({ a: 'push', then: 'king' })).toBe(false);
    for (const into of ['K', 'P', 'S']) expect(validDoes({ a: 'becomes', into })).toBe(false);
    // H2: "cannot be taken" stops at "by anything but a king".
    expect(blockOf('cannotBeTaken').pill!.choices.map(c => c[0])).toEqual(['pawns', 'allButKing']);
    // H2b: only on a piece that takes nothing.
    const guard = presetOf('guard');
    expect(limit(guard)).toBeNull();
    expect(limit({ ...guard, squares: KING_STEP('both') })).toMatch(/^Only a king can take this piece/);
    // H3.
    expect(empty(fromPreset(BLANK))).toBe(true);
    expect(empty({ squares: [], lines: [], rules: [{ when: { on: 'zone', zone: 'startRank' }, does: { a: 'step2' } }] })).toBe(false);
    // H7: a rule must change this design.
    expect(blockOf('linesPass').needs!({ squares: KING_STEP('both'), lines: [], rules: [] })).toBe('Paint a line first.');
    expect(blockOf('chain').needs!({ squares: KING_STEP('move'), lines: [], rules: [] })).toMatch(/takes on by moving/);
    expect(blockOf('cannotTake').needs!(guard)).toBe('It takes nothing already.');
    // H8: at most 3 rules, no ability twice.
    const four: Rule[] = [...presetOf('paladin').rules, { when: AL, does: { a: 'swap', with: 'friend' } }];
    expect(limit({ squares: [], lines: [...ORTHO], rules: four })).toMatch(/^3 of 3 rules/);
    expect(limit({ squares: [], lines: [...ORTHO], rules: [four[0], { when: { on: 'zone', zone: 'capital' }, does: { a: 'linesPass', over: 'any' } }] })).toBe('Already in this piece.');
    // H12: "becomes" only on the last rank or the first take.
    const bec = blockOf('becomes');
    expect(whenOk({ when: { on: 'firstTake' }, does: { a: 'becomes', into: 'Q' } })).toBe(true);
    expect(whenOk({ when: { on: 'zone', zone: 'capital' }, does: { a: 'becomes', into: 'Q' } })).toBe(false);
    expect(BLOCKS.every(b => whenOk(b.rule))).toBe(true);
    expect(bec.whens({ on: 'always' })).toBe(false);
  });

  it('mixes two pieces: Knight + Guard leaves the immunity out (W2)', () => {
    const { design, left } = mix(presetOf('knight'), presetOf('guard'));
    expect(design.rules).toEqual([]);
    expect(left).toEqual(['only a king can take it (a piece that takes cannot have it)']);
    const nr = mix(presetOf('knight'), presetOf('rook')).design;
    expect(nr.rules).toEqual([{ when: { on: 'zone', zone: 'enemyHalf' }, does: { a: 'movesLike', as: 'rook' } }]);
    expect(nr.from).toEqual(['knight', 'rook']);
  });

  it('"Always" for "also moves like" keeps every move and take, or is not offered', () => {
    const plain = { squares: [{ x: 0, y: 1, mark: 'move' as const }, { x: 1, y: 1, mark: 'take' as const }], lines: [], rules: [] };
    expect(likeAlways(plain, 'king')!.squares.find(s => s.x === 1 && s.y === 1)!.mark).toBe('both');
    expect(likeAlways(plain, 'rook')!.lines).toEqual([...ORTHO]);
    // A shot on a king square cannot also take by moving there: the stored marks cannot say both, so no "Always".
    expect(likeAlways(presetOf('archer'), 'king')).toBeNull();
    expect(likeAlways({ ...plain, squares: [{ x: 1, y: 1, mark: 'moveShoot' }] }, 'king')).toBeNull();
    expect(likeAlways(presetOf('archer'), 'rook')).not.toBeNull();
  });

  it('names: no pool name twice, and a free letter', () => {
    expect(saveName('Knight')).toBe('Knight (yours)');
    expect(saveName(' Hungry Rider ')).toBe('Hungry Rider');
    expect(letterOf('Hungry Rider')).toBe('H');
    expect(letterOf('Rook')).toBe('D');
    expect(autoName({ ...fromPreset(presetOf('knight')), rules: [{ when: { on: 'takes' }, does: { a: 'chain' } }] })).toBe('Hungry Rider');
  });

  it('the letter follows the name until the player chooses one, even a letter that matches the name', () => {
    const d = named(fromPreset(presetOf('knight')), 'Hungry Rider');
    expect(letterFollows(d)).toBe(true);
    expect(letterFollows({ ...d, ownLetter: true })).toBe(false); // H is the name's letter, but the player chose it
    // A design saved before the setting: the letter follows while it matches the name.
    expect(letterFollows({ ...d, ownLetter: undefined })).toBe(true);
    expect(letterFollows({ ...d, ownLetter: undefined, letter: 'Z' })).toBe(false);
  });

  it('still loads a stored design and a share code that hold a glow (Surprise me no longer adds one)', () => {
    const d = { ...named(fromPreset(presetOf('knight'))), id: 'g1', updated: 1, look: { ...fromPreset(presetOf('knight')).look, glow: 'Flame' as const } };
    expect(parseDesign(code(raw(d)))?.look.glow).toBe('Flame');
    const m = new Map([[KEY, JSON.stringify({ v: 1, designs: [d] })]]);
    expect(loadDesigns({ getItem: k => m.get(k) ?? null, setItem: () => {} }).map(x => [x.id, x.look.glow])).toEqual([['g1', 'Flame']]);
  });

  it('lists every square exactly, for the saved card', () => {
    const l = squareList({ squares: [{ x: 1, y: 2, mark: 'both' }, { x: -1, y: 2, mark: 'shoot' }], lines: ['n'] });
    expect(l).toEqual(['2 forward, 1 left: shoot', '2 forward, 1 right: move and take', 'Slides straight ahead']);
    const many = { squares: [...KING_STEP('both'), ...KNIGHT_JUMP().slice(0, 3), { x: 3, y: 3, mark: 'move' as const }, { x: 0, y: 2, mark: 'move' as const }], lines: [], rules: [] };
    expect(words(many).moves).not.toMatch(/picture/);
  });
});

describe('separate move and take channels', () => {
  it('adds and removes moves without changing takes or shots', () => {
    expect(setMark('take', 'move', true)).toBe('both');
    expect(setMark('both', 'move', false)).toBe('take');
    expect(setMark('shoot', 'move', true)).toBe('moveShoot');
    expect(setMark('moveShoot', 'move', false)).toBe('shoot');
  });
  it('adds, removes and switches takes without changing movement', () => {
    expect(setMark('move', 'take', true)).toBe('both');
    expect(setMark('both', 'take', false)).toBe('move');
    expect(setMark('both', 'shoot', true)).toBe('moveShoot');
    expect(setMark('moveShoot', 'shoot', false)).toBe('move');
    expect(setMark(undefined, 'take', true)).toBe('take');
    expect(setMark('take', 'take', false)).toBeNull();
  });
});
