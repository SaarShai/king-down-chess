// The section numbers (§) in this file cite revision 3 of the Workshop doc:
// docs/visual-design/workshop/WORKSHOP-revision-3-2026-10-07.md.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { judge } from './judge';
import { BLANK, PRESETS, fromPreset, presetOf, validName, type PieceDesign, type Rule, type When } from './model';
import { copyName } from './names';
import { KEY, MAX, deleteDesign, loadShelf, saveDesign } from './store';
import { designText, describe as words, esc, lineParts, partsText, ruleText } from './text';
import { BLOCKS, EVENT_WHENS, MORE_WHENS, TOP_WHENS, whenChoices } from './vocab';

/** Every rule of every block, with every pill value and every When it allows. */
const ALL_RULES: Rule[] = BLOCKS.flatMap(b => [...TOP_WHENS, ...MORE_WHENS, ...EVENT_WHENS, { on: 'takes' } as When].filter(b.whens)
  .flatMap(when => (b.pill ? b.pill.choices.map(([v]) => ({ ...b.rule.does, [b.pill!.key]: v })) : [b.rule.does]).map(does => ({ when, does } as Rule))));

describe('text (§8.4.9)', () => {
  it('says a piece that takes only by a "moves like" rule takes as its rules say, not nothing (review F12)', () => {
    const d = { ...fromPreset(BLANK), rules: [{ when: { on: 'zone', zone: 'capital' }, does: { a: 'movesLike', as: 'queen' } } as Rule] };
    expect(words(d).takes).toBe('only as its rules say.');
    expect(words(d).summary).toMatch(/^Moves only as its rules say\. Takes only as its rules say\. /);
  });

  it('pins the preset sentences', () => {
    const s = (k: string) => words(presetOf(k)).summary;
    expect(s('pawn')).toBe('Moves like a pawn. Takes 1 square diagonally forward. On its start rank, it may also step 2 squares straight ahead, over an empty square, to an empty square. When it reaches the last rank, it becomes a piece you choose: queen, rook, bishop or knight.');
    expect(s('knight')).toBe('Moves in an L, like a knight. Takes the same squares.');
    expect(s('bishop')).toBe('Moves like a bishop. Takes the same squares.');
    expect(s('rook')).toBe('Moves like a rook. Takes the same squares.');
    expect(s('queen')).toBe('Moves like a queen. Takes the same squares.');
    expect(s('archer')).toBe('Moves 1 square any way, like a king. Shoots without moving: 2 squares straight or 2 squares diagonally forward.');
    expect(s('paladin')).toBe('Moves like a queen. Takes the same squares. Its lines pass over its own pieces. When it takes a piece, not a pawn, it is removed too. It cannot take a king.');
    expect(s('guard')).toBe('Moves 1 square any way, like a king. Takes nothing. Only a king can take it. It cannot be taken by anything but a king.');
    expect(s('maester')).toBe('Moves 1 square any way, like a king. Takes the same squares. It may swap places with a friend next to it (not a king).');
    expect(s('beast')).toBe('Moves 1 square any way, like a king. Takes the same squares. When it takes by moving, it may take again from the new square (not a king).');
    expect(s('ogre')).toBe('Moves 1 square any way, like a king. Takes the same squares. It may push a piece next to it 1 square straight away, onto an empty square, and follow it. Never a king.');
    expect(ruleText({ when: { on: 'zone', zone: 'capital' }, does: { a: 'movesLike', as: 'queen' } })).toBe('On a center square, it also moves and takes like a queen.');
  });

  it('uses no engineering word, ends each sentence with a period and keeps it to 120 characters', () => {
    const ENGINEERING = /\b(trigger|shackle|spawn|promotion|mark|arrival|leaper|rider|symmetry|orbit|atom|centipawn|elo|fingerprint)s?\b/i;
    const texts: string[] = [...ALL_RULES.map(ruleText), ...ALL_RULES.map(r => partsText(lineParts(r).say)), ...BLOCKS.flatMap(b => [b.example])];
    for (const p of PRESETS) {
      const v = judge(p);
      texts.push(words(p).summary, v.line, v.like, ...v.why, ...v.flags.map(f => f.line));
    }
    for (const r of ALL_RULES) {
      const d = { ...presetOf('rook'), rules: [r] }, v = judge(d);
      texts.push(words(d).summary, v.line, ...v.why);
    }
    for (const t of texts) {
      expect(t, t).not.toMatch(ENGINEERING);
      for (const s of t.split(/(?<=[.?])\s+(?=[A-Z0-9“])/)) {
        expect(s.length, s).toBeLessThanOrEqual(120);
        expect(s, s).toMatch(/[.?]$/);
      }
    }
  });

  it('writes the short line of each rule with its pill, and the When pill after the chip (spec decision 38)', () => {
    const line = (r: Rule) => [partsText(lineParts(r).after), partsText(lineParts(r).line)].filter(Boolean).join(' | ');
    expect(presetOf('pawn').rules.map(line)).toEqual(['steps 2 straight ahead', 'becomes a piece you choose']);
    expect(presetOf('paladin').rules.map(line)).toEqual(['its lines pass over its own pieces', 'a piece, not a pawn | it is removed too', 'cannot take a king']);
    expect(partsText(lineParts(presetOf('pawn').rules[1]).say)).toBe('It becomes a piece you choose.');
  });

  it('escapes names', () => {
    expect(esc(`<img src=x onerror="a()">'&`)).toBe('&#60;img src=x onerror=&#34;a()&#34;&#62;&#39;&#38;');
  });
});

describe('vocab (§8.4.10)', () => {
  it('cites a MATRIX row that exists for every block', () => {
    const matrix = readFileSync(new URL('../../docs/MATRIX.md', import.meta.url), 'utf8');
    for (const b of BLOCKS) expect(matrix, b.matrix).toContain(`| ${b.matrix.startsWith('C3') || b.matrix === 'Last rank' ? '' : '**'}${b.matrix}`);
  });

  it('gives each block a seal label of 14 characters or fewer', () => {
    for (const b of BLOCKS) expect(b.label, b.a).toMatch(/^.{1,14}$/u);
  });
});

describe('whenChoices (Proving Ground ticket 03)', () => {
  it('gives "steps 2" always and the three zones it allows, two of them on top', () => {
    expect(whenChoices('step2')).toEqual({ top: [{ on: 'always' }, { on: 'zone', zone: 'enemyHalf' }], more: [{ on: 'zone', zone: 'ownHalf' }, { on: 'zone', zone: 'startRank' }] });
  });

  it('gives "becomes" its two events, and "takes again" and "removed too" no choice', () => {
    expect(whenChoices('becomes')).toEqual({ top: [{ on: 'reaches', zone: 'lastRank' }, { on: 'firstTake' }], more: [] });
    expect(whenChoices('chain')).toEqual({ top: [], more: [] });
    expect(whenChoices('removedAfter')).toEqual({ top: [], more: [] });
  });

  it('gives "moves like" every state, with "always" first (it adds to Moves)', () => {
    expect(whenChoices('movesLike')).toEqual({ top: [...TOP_WHENS], more: [...MORE_WHENS] });
    expect(whenChoices('movesLike').top[0]).toEqual({ on: 'always' });
  });
});

describe('store (§8.4.12)', () => {
  const mem = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), m }; };
  const design = (n: number): PieceDesign => ({ ...fromPreset(presetOf('knight')), id: `d${n}`, name: `D${n}`, letter: 'D', updated: 1000 + n });

  it('works when storage throws or is missing', () => {
    const broken = { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('full'); } };
    expect(loadShelf(broken).designs).toEqual([]);
    expect(saveDesign(design(1), broken)).toBe('failed');
    expect(deleteDesign('d1', broken)).toBe(false);
    expect(loadShelf(null).designs).toEqual([]);
    const bad = mem();
    bad.setItem(KEY, '{not json');
    expect(loadShelf(bad).designs).toEqual([]);
  });

  it('keeps the newest first; a full shelf refuses a new design and drops nothing', () => {
    const s = mem();
    for (let n = 1; n <= MAX; n++) expect(saveDesign(design(n), s)).toBe('saved');
    expect(saveDesign(design(MAX + 1), s)).toBe('full');
    const list = loadShelf(s).designs;
    expect(list).toHaveLength(MAX);
    expect(list[0].id).toBe(`d${MAX}`);
    expect(list.at(-1)!.id).toBe('d1');
    // A design already on the shelf still saves, and moves to the front.
    expect(saveDesign({ ...design(10), updated: 9999 }, s)).toBe('saved');
    expect(loadShelf(s).designs[0].id).toBe('d10');
    expect(loadShelf(s).designs).toHaveLength(MAX);
    expect(deleteDesign('d10', s)).toBe(true);
    expect(loadShelf(s).designs.some(d => d.id === 'd10')).toBe(false);
    expect(saveDesign(design(MAX + 1), s)).toBe('saved');
  });

  it('skips a damaged entry, keeps it in storage, and the judge never sees it', () => {
    const s = mem();
    s.setItem(KEY, JSON.stringify({ v: 1, designs: [{ kind: 'piece', id: 'broken' }, { ...design(1), squares: [{ x: 9, y: 0, mark: 'both' }] }, design(2)] }));
    expect(loadShelf(s)).toMatchObject({ bad: 2 });
    expect(loadShelf(s).designs.map(d => d.id)).toEqual(['d2']);
    for (const d of loadShelf(s).designs) expect(() => judge(d)).not.toThrow();
    expect(saveDesign(design(3), s)).toBe('saved');
    expect(deleteDesign('d2', s)).toBe(true);
    const raw = JSON.parse(s.m.get(KEY)!).designs as { id: string }[];
    expect(raw.map(d => d.id)).toEqual(['d3', 'broken', 'd1']);
  });
});

describe('the design menu (Proving Ground ticket 07)', () => {
  it('Copy as text gives the sentences, a MATRIX row and the link', () => {
    const d: PieceDesign = { ...fromPreset(BLANK), name: 'Rook Rider', letter: 'D', lines: ['n', 'e', 's', 'w'],
      squares: [{ x: 1, y: 2, mark: 'both' }, { x: -1, y: 2, mark: 'both' }] };
    const t = designText(d, judge(d, false), 'https://example.test/?design=abc').split('\n');
    expect(t[0]).toBe('Rook Rider');
    expect(t[1]).toBe(`Moves: ${words(d).moves}`);
    expect(t).toContain(`Takes: ${words(d).takes}`);
    expect(t.at(-3)).toMatch(/^\| Rook Rider \| piece \| squares: moves .*; takes .* \| \d+\.\d\d \| [a-z ]+ \|$/);
    expect(t.at(-1)).toBe('https://example.test/?design=abc');
  });

  it('names a copy with the next free number, within 18 letters', () => {
    expect(copyName('My Pawn', [])).toBe('My Pawn');
    expect(copyName('My Pawn', ['My Pawn'])).toBe('My Pawn 2');
    expect(copyName('My Pawn 2', ['My Pawn', 'My Pawn 2'])).toBe('My Pawn 3');
    // An 18-letter name stays whole while it is free; only a number cuts it.
    expect(copyName('Wandering Champion', [])).toBe('Wandering Champion');
    const long = copyName('Wandering Champion', ['Wandering Champion']);
    expect(long).toBe('Wandering Champi 2');
    expect(validName(long)).toBe(true);
  });
});
