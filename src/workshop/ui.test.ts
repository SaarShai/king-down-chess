// The section numbers (§) in this file cite revision 3 of the Workshop doc:
// docs/visual-design/workshop/WORKSHOP-revision-3-2026-10-07.md.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { figureHtml, gaugeHtml, modelHtml } from './art';
import { cardHtml } from './card';
import { figureById, selectedFigure } from './figures';
import { judge, whyHead, type Label } from './judge';
import { lookOf, lookWords } from './look';
import { BLANK, PRESETS, fromPreset, presetOf, type PieceDesign, type Rule, type When } from './model';
import { KEY, MAX, deleteDesign, loadDesigns, loadShelf, saveDesign } from './store';
import { describe as words, esc, ruleText } from './text';
import { BLOCKS, EVENT_WHENS, MORE_WHENS, TOP_WHENS } from './vocab';

const chain: Rule = { when: { on: 'takes' }, does: { a: 'chain' } };
const noKing: Rule = { when: { on: 'always' }, does: { a: 'cannotTake', what: 'king' } };
const rook = (...rules: Rule[]): PieceDesign => ({ ...fromPreset(presetOf('rook')), rules, letter: 'D' });

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
    const l = lookOf(rook(chain));
    // The artwork stands alone, even for a saved design with a glow.
    const m = modelHtml(lookOf({ ...rook(chain), look: { ...rook().look, glow: 'Flame' } }));
    expect(m).toBe(`<div class="ws-model ws-bare"><img class="ws-fig" src="/ui/workshop/${l.figure}-w.webp" alt="" decoding="async" /></div>`);
    expect(figureHtml({ figure: l.figure, army: 1 }, 'tb-me')).toBe(`<img class="tb-me" src="/ui/workshop/${l.figure}-b.webp" alt="" decoding="async" />`);
    const g = gaugeHtml(judge(presetOf('rook')));
    expect(g).toMatch(/role="meter"[^>]*aria-valuenow="4"/);
    expect(g).toContain('ws-thermometer');
    expect(g).not.toContain('g-gem');
  });

  it('gives the thermometer the words of the summary', () => {
    const said = (k: string) => gaugeHtml(judge(presetOf(k))).match(/aria-valuetext="([^"]*)"/)![1];
    expect(said('pawn')).toBe('about 1 pawn, the unit of worth');
    expect(said('knight')).toBe('about 3½ pawns, fair');
  });

  it('shows the bare figure on the card, whatever the verdict or the rules say', () => {
    const guard = { ...fromPreset(presetOf('guard')), letter: 'D' };
    const likeQueen = { ...fromPreset(BLANK), squares: presetOf('maester').squares, rules: [{ when: { on: 'zone', zone: 'capital' }, does: { a: 'movesLike', as: 'queen' } } as Rule], letter: 'D' };
    for (const d of [rook(), rook(chain), rook(chain, noKing), guard, likeQueen])
      expect(modelHtml(lookOf(d))).toBe(`<div class="ws-model ws-bare"><img class="ws-fig" src="/ui/workshop/${selectedFigure(d).id}-w.webp" alt="" decoding="async" /></div>`);
  });

  it('names in the hidden summary only what the card shows', () => {
    const l = lookOf({ ...rook(chain), look: { ...rook().look, glow: 'Flame', army: 1 } });
    expect(lookWords(l)).toBe(`${figureById(l.figure)!.name} look, charcoal.`);
    for (const d of [rook(), rook(chain), rook(chain, noKing)]) expect(lookWords(lookOf(d))).not.toMatch(/plinth|floor|rim|glow|crack/i);
  });
});

describe('the read-only card (web redesign ticket 22)', () => {
  /** The mark classes of one cell of the card's grid: 'move' or 'take'. */
  const cell = (html: string, grid: string, x: number, y: number): string[] => {
    const part = html.split(`data-grid="${grid}"`)[1].split('</div>')[0];
    const m = part.match(new RegExp(`<i class="ws-grid-cell([^"]*)" data-x="${x}" data-y="${y}"`));
    if (!m) throw new Error(`no cell ${x},${y} in the ${grid} grid`);
    return m[1].trim().split(/\s+/).filter(c => c && c !== 'dk');
  };
  const design = (over: Partial<PieceDesign> = {}): PieceDesign => ({ ...fromPreset(BLANK), name: 'Test Piece', letter: 'T', ...over });

  it('draws the move grid and the take grid, 7 by 7, read only, with the marks of each square', () => {
    const d = design({ squares: [{ x: 1, y: 1, mark: 'both' }, { x: -1, y: 1, mark: 'move' }, { x: 0, y: -2, mark: 'shoot' }, { x: 2, y: 2, mark: 'moveShoot' }], lines: ['e'] });
    const html = cardHtml(d, judge(d));
    for (const grid of ['move', 'take']) expect(html.split(`data-grid="${grid}"`)[1].split('</div>')[0].match(/<i class="ws-grid-cell/g)).toHaveLength(49);
    expect(html).not.toMatch(/<button|<input|<select/);
    expect(cell(html, 'move', 1, 1)).toEqual(['c-move']);
    expect(cell(html, 'take', 1, 1)).toEqual(['c-take']);
    expect(cell(html, 'move', -1, 1)).toEqual(['c-move']);
    expect(cell(html, 'take', -1, 1)).toEqual([]);
    expect(cell(html, 'move', 0, -2)).toEqual([]);
    expect(cell(html, 'take', 0, -2)).toEqual(['c-shoot']);
    expect(cell(html, 'move', 2, 2)).toEqual(['c-move']);
    expect(cell(html, 'take', 2, 2)).toEqual(['c-shoot']);
    // A slide line in both grids, with an arrow on the edge square.
    for (const grid of ['move', 'take']) {
      expect(cell(html, grid, 1, 0)).toEqual(['ln', 'ln-e']);
      expect(cell(html, grid, 3, 0)).toEqual(['ln', 'ln-e', 'ln-end']);
      expect(cell(html, grid, -1, 0)).toEqual([]);
    }
  });

  it('reads the move and take patterns beside the grids', () => {
    const d = design({ lines: ['n', 'e', 's', 'w'] });
    const html = cardHtml(d, judge(d));
    expect(html).toContain('<p class="ws-caption">Moves like a rook.</p>');
    expect(html).toContain('<p class="ws-caption">Takes the same squares.</p>');
  });

  /** The text of the first element with this class. */
  const textOf = (html: string, cls: string): string => html.match(new RegExp(`class="${cls}"[^>]*>([^<]*)<`))![1];

  it('shows the band word and the worth line of every band', () => {
    const rook = design({ lines: ['n', 'e', 's', 'w'] }), v = judge(rook);
    const words = (label: Label): string[] => { const html = cardHtml(rook, { ...v, own: '', label }); return [textOf(html, 'ws-learn'), textOf(html, 'ws-worth')]; };
    expect(words('fair')).toEqual(['Fair', 'Estimated worth · 4 pawns']);
    expect(words('possiblyOP')).toEqual(['Possibly overpowered', 'Estimated worth · 4 pawns']);
    expect(words('untestedOP')).toEqual(['Possibly overpowered', 'Estimated worth · 4 pawns']);
    expect(words('likelyOP')).toEqual(['Likely overpowered', 'Estimated worth · 4 pawns']);
    expect(words('possiblyWeak')).toEqual(['Possibly too weak', 'Estimated worth · 4 pawns']);
    expect(words('likelyWeak')).toEqual(['Likely too weak', 'Estimated worth · 4 pawns']);
  });

  it('gives an unchanged Pawn and Queen their own words', () => {
    const own = (key: string): string[] => { const d = { ...fromPreset(presetOf(key)), letter: 'D' }, html = cardHtml(d, judge(d)); return [textOf(html, 'ws-learn'), textOf(html, 'ws-worth')]; };
    expect(own('pawn')).toEqual(['The unit of worth', 'Estimated worth · 1 pawn']);
    expect(own('queen')[0]).toBe('The queen’s worth');
  });

  it('shows the name, the figure, the rules and a hidden summary; a piece with no move and no take has no band', () => {
    const d = design({ name: `Ann's <b>`, look: { ...fromPreset(BLANK).look, figure: 'clay-golem' }, squares: [{ x: 0, y: 1, mark: 'both' }], rules: [chain] });
    const html = cardHtml(d, judge(d));
    expect(textOf(html, 'ws-name-t')).toBe('Ann&#39;s &#60;b&#62;');
    expect(html).toContain('<img class="ws-fig" src="/ui/workshop/clay-golem-w.webp"');
    expect(html.match(/<li>([^<]*)<\/li>/g)).toEqual(['<li>When it takes by moving, it may take again from the new square (not a king).</li>']);
    expect(textOf(html, 'sr-only ws-summary')).toBe('Clay Golem look, ivory. Moves 1 square straight ahead. Takes the same squares. When it takes by moving, it may take again from the new square (not a king). About half a pawn, likely too weak.');
    const blank = cardHtml(design(), judge(design()));
    expect([textOf(blank, 'ws-learn'), textOf(blank, 'ws-worth')]).toEqual(['', 'It has no moves and no takes.']);
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
