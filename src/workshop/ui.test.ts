import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { figureHtml, gaugeHtml, modelHtml } from './art';
import { figureById } from './figures';
import { judge, whyHead } from './judge';
import { CRIMSON, lookOf, lookWords } from './look';
import { BLANK, ORTHO, PRESETS, fromPreset, presetOf, type PieceDesign, type Rule, type When } from './model';
import { KEY, MAX, deleteDesign, loadDesigns, loadShelf, saveDesign } from './store';
import { describe as words, esc, ruleText } from './text';
import { BLOCKS, EVENT_WHENS, MORE_WHENS, TOP_WHENS } from './vocab';

const chain: Rule = { when: { on: 'takes' }, does: { a: 'chain' } };
const noKing: Rule = { when: { on: 'always' }, does: { a: 'cannotTake', what: 'king' } };
const rook = (...rules: Rule[]): PieceDesign => ({ ...fromPreset(presetOf('rook')), rules, letter: 'D' });
const look = (d: PieceDesign) => lookOf(d, judge(d));

/** Every rule of every block, with every pill value and every When it allows. */
const ALL_RULES: Rule[] = BLOCKS.flatMap(b => [...TOP_WHENS, ...MORE_WHENS, ...EVENT_WHENS, { on: 'takes' } as When].filter(b.whens)
  .flatMap(when => (b.pill ? b.pill.choices.map(([v]) => ({ ...b.rule.does, [b.pill!.key]: v })) : [b.rule.does]).map(does => ({ when, does } as Rule))));

describe('text (§8.4.9)', () => {
  it('pins the preset sentences', () => {
    const s = (k: string) => words(presetOf(k)).summary;
    expect(s('pawn')).toBe('Moves like a pawn. Takes 1 square diagonally forward. On its start rank, it may also step 2 squares straight ahead, over an empty square, to an empty square. When it reaches the last rank, it becomes a piece you choose: queen, rook, bishop or knight.');
    expect(s('knight')).toBe('Moves in an L, like a knight. Takes the same squares.');
    expect(s('bishop')).toBe('Moves like a bishop. Takes the same squares.');
    expect(s('rook')).toBe('Moves like a rook. Takes the same squares.');
    expect(s('queen')).toBe('Moves like a queen. Takes the same squares.');
    expect(s('archer')).toBe('Moves 1 square any way, like a king. Shoots without moving: 1 square diagonally, 2 squares straight or 2 squares diagonally forward.');
    expect(s('paladin')).toBe('Moves like a queen. Takes the same squares. Its lines pass over its own pieces. When it takes a piece, not a pawn, it is removed too. It cannot take a king.');
    expect(s('guard')).toBe('Moves 1 square any way, like a king. Takes nothing. Only a king can take it. It cannot be taken by anything but a king.');
    expect(s('maester')).toBe('Moves 1 square any way, like a king. Takes the same squares. It may swap places with a friend next to it (not a king).');
    expect(s('beast')).toBe('Moves 1 square any way, like a king. Takes the same squares. When it takes by moving, it may take again from the new square (not a king).');
    expect(s('ogre')).toBe('Moves 1 square any way, like a king. Takes the same squares. It may push a piece next to it 1 square straight away, onto an empty square, and follow it. Never a king.');
    expect(ruleText({ when: { on: 'zone', zone: 'capital' }, does: { a: 'movesLike', as: 'queen' } })).toBe('On a center square, it also moves and takes like a queen.');
  });

  it('uses no engineering word, ends each sentence with a period and keeps it to 120 characters', () => {
    const ENGINEERING = /\b(trigger|shackle|spawn|promotion|mark|arrival|leaper|rider|symmetry|orbit|atom|centipawn|elo|fingerprint)s?\b/i;
    const texts: string[] = [...ALL_RULES.map(ruleText), ...BLOCKS.flatMap(b => [b.example])];
    for (const p of PRESETS) {
      const v = judge(p);
      texts.push(words(p).summary, v.line, v.like, whyHead(v), ...v.why, ...v.flags.map(f => f.line));
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

  it('escapes names', () => {
    expect(esc(`<img src=x onerror="a()">'&`)).toBe('&#60;img src=x onerror=&#34;a()&#34;&#62;&#39;&#38;');
  });
});

describe('vocab (§8.4.10)', () => {
  it('cites a MATRIX row that exists for every block', () => {
    const matrix = readFileSync(new URL('../../docs/MATRIX.md', import.meta.url), 'utf8');
    for (const b of BLOCKS) expect(matrix, b.matrix).toContain(`| ${b.matrix.startsWith('C3') || b.matrix === 'Last rank' ? '' : '**'}${b.matrix}`);
  });
});

describe('art (§8.4.11)', () => {
  it('draws the card: the bare figure and the thermometer', () => {
    const l = look(rook(chain));
    // The artwork stands alone, even for a saved design with a glow.
    const m = modelHtml(look({ ...rook(chain), look: { ...rook().look, glow: 'Flame' } }));
    expect(m).toBe(`<div class="ws-model ws-bare"><img class="ws-fig" src="/ui/workshop/${l.figure}-w.webp" alt="" decoding="async" /></div>`);
    expect(figureHtml({ figure: l.figure, army: 1 }, 'tb-me')).toBe(`<img class="tb-me" src="/ui/workshop/${l.figure}-b.webp" alt="" decoding="async" />`);
    const g = gaugeHtml(judge(presetOf('rook')));
    expect(g).toMatch(/role="meter"[^>]*aria-valuenow="4"/);
    expect(g).toContain('ws-thermometer');
    expect(g).not.toContain('g-gem');
  });

  it('dresses the model from the verdict (lookOf)', () => {
    const r = look(rook());
    expect([r.metal, r.cracks]).toEqual(['gold', 'none']);
    const c = look(rook(chain));
    expect([c.metal, c.cracks, c.rim, c.chain]).toEqual(['cracked', 'cracked', CRIMSON, true]);
    const n = look(rook(chain, noKing));
    expect([n.metal, n.noTake]).toEqual(['hairline', 'king']);
    expect(look({ ...fromPreset(presetOf('guard')), letter: 'D' }).sheathed).toBe(true);
    const t = look({ ...fromPreset(BLANK), squares: presetOf('maester').squares, rules: [{ when: { on: 'zone', zone: 'capital' }, does: { a: 'movesLike', as: 'queen' } }], letter: 'D' });
    expect([t.body, t.ghost, t.zone, t.ghostLines.length]).toEqual(['M', 'Q', 'capital', 8]);
    expect(t.marks.every(m => !m.hatched)).toBe(true);
    expect(look({ ...rook(), lines: [...ORTHO].slice(0, 2) }).lines).toEqual(['n', 'e']);
  });

  it('names in the hidden summary only what the card shows', () => {
    const l = look({ ...rook(chain), look: { ...rook().look, glow: 'Flame', army: 1 } });
    expect(lookWords(l)).toBe(`${figureById(l.figure)!.name} look, charcoal.`);
    for (const d of [rook(), rook(chain), rook(chain, noKing)]) expect(lookWords(look(d))).not.toMatch(/plinth|floor|rim|glow|crack/i);
  });
});

describe('store (§8.4.12)', () => {
  const mem = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), m }; };
  const design = (n: number): PieceDesign => ({ ...fromPreset(presetOf('knight')), id: `d${n}`, name: `D${n}`, letter: 'D', updated: 1000 + n });

  it('works when storage throws or is missing', () => {
    const broken = { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('full'); } };
    expect(loadDesigns(broken)).toEqual([]);
    expect(saveDesign(design(1), broken)).toBe('failed');
    expect(deleteDesign('d1', broken)).toBe(false);
    expect(loadDesigns(null)).toEqual([]);
    const bad = mem();
    bad.setItem(KEY, '{not json');
    expect(loadDesigns(bad)).toEqual([]);
  });

  it('keeps the newest first; a full shelf refuses a new design and drops nothing', () => {
    const s = mem();
    for (let n = 1; n <= MAX; n++) expect(saveDesign(design(n), s)).toBe('saved');
    expect(saveDesign(design(MAX + 1), s)).toBe('full');
    const list = loadDesigns(s);
    expect(list).toHaveLength(MAX);
    expect(list[0].id).toBe(`d${MAX}`);
    expect(list.at(-1)!.id).toBe('d1');
    // A design already on the shelf still saves, and moves to the front.
    expect(saveDesign({ ...design(10), updated: 9999 }, s)).toBe('saved');
    expect(loadDesigns(s)[0].id).toBe('d10');
    expect(loadDesigns(s)).toHaveLength(MAX);
    expect(deleteDesign('d10', s)).toBe(true);
    expect(loadDesigns(s).some(d => d.id === 'd10')).toBe(false);
    expect(saveDesign(design(MAX + 1), s)).toBe('saved');
  });

  it('skips a damaged entry, keeps it in storage, and the judge never sees it', () => {
    const s = mem();
    s.setItem(KEY, JSON.stringify({ v: 1, designs: [{ kind: 'piece', id: 'broken' }, { ...design(1), squares: [{ x: 9, y: 0, mark: 'both' }] }, design(2)] }));
    expect(loadShelf(s)).toMatchObject({ bad: 2 });
    expect(loadDesigns(s).map(d => d.id)).toEqual(['d2']);
    for (const d of loadDesigns(s)) expect(() => judge(d)).not.toThrow();
    expect(saveDesign(design(3), s)).toBe('saved');
    expect(deleteDesign('d2', s)).toBe(true);
    const raw = JSON.parse(s.m.get(KEY)!).designs as { id: string }[];
    expect(raw.map(d => d.id)).toEqual(['d3', 'broken', 'd1']);
  });
});
