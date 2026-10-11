// The card face and its reach diagram (docs/specs/workshop-proving-ground, ticket 08).
import { describe, expect, it } from 'vitest';
import { faceHtml } from './face';
import { bandOf, judge } from './judge';
import { diagram } from './marks';
import { BLANK, canonical, fromPreset, presetOf, type PieceDesign, type Rule } from './model';
import { pawns, ruleText } from './text';

const design = (key: string, more: Partial<PieceDesign> = {}): PieceDesign => ({ ...fromPreset(presetOf(key)), name: presetOf(key).name, letter: 'D', ...more });
const face = (d: PieceDesign): string => faceHtml(d, judge(d, false), 'ui/pieces/x-w.webp');
/** The marks of a diagram: "x,y kind [cond]" for each tile, "line dir [cond]" for each rail. */
const marks = (svg: string): string[] => [...svg.matchAll(/<g data-(?:xy="([^"]+)" data-k="(\w+)"|k="line" data-dir="(\w+)")( data-cond="1")?>/g)]
  .map(([, xy, k, dir, cond]) => `${xy ? `${xy} ${k}` : `line ${dir}`}${cond ? ' cond' : ''}`).sort();
const text = (html: string): string => html.replace(/<title>.*?<\/title>/g, '').replace(/<[^>]+>/g, '');

describe('the reach diagram (marks.js diagram)', () => {
  it('marks each square kind and each line', () => {
    const d = { ...fromPreset(BLANK), lines: ['n' as const], squares: [
      { x: 1, y: 1, mark: 'move' as const }, { x: -1, y: 1, mark: 'take' as const }, { x: 1, y: -1, mark: 'both' as const },
      { x: 2, y: 0, mark: 'shoot' as const }, { x: -2, y: 0, mark: 'moveShoot' as const }] };
    expect(marks(diagram(d, { s: 34 }))).toEqual(['-1,1 take', '-2,0 moveshot', '1,-1 both', '1,1 move', '2,0 shot', 'line n']);
  });

  it('draws "steps 2" and "also moves like" as only sometimes, and "passes over" as a bridge on each line', () => {
    expect(marks(diagram(design('pawn'), { s: 34 }))).toEqual(['-1,1 take', '0,1 move', '0,2 move cond', '1,1 take']);
    const queen: Rule = { when: { on: 'zone', zone: 'capital' }, does: { a: 'movesLike', as: 'queen' } };
    expect(marks(diagram({ ...fromPreset(BLANK), rules: [queen] }, { s: 34 }))).toEqual(['e', 'n', 'ne', 'nw', 's', 'se', 'sw', 'w'].map(l => `line ${l} cond`));
    // A painted square stays as it is; a design with lines keeps them (designPattern, binder-and-table.html:776).
    const knight: Rule = { when: { on: 'always' }, does: { a: 'movesLike', as: 'knight' } };
    expect(marks(diagram({ ...design('rook'), squares: [{ x: 1, y: 2, mark: 'move' }], rules: [knight] }, { s: 34 })))
      .toEqual(['-1,-2 both cond', '-1,2 both cond', '-2,-1 both cond', '-2,1 both cond', '1,-2 both cond', '1,2 move', '2,-1 both cond', '2,1 both cond', 'line e', 'line n', 'line s', 'line w']);
    const bridges = (d: PieceDesign) => (diagram(d, { s: 34 }).match(/stroke-dasharray="6 4"/g) ?? []).length;
    expect([bridges(design('paladin')), bridges(design('queen'))]).toEqual([8, 0]);
  });

  it('puts the body icon in the centre, or a disc for a token, and draws the squares only when asked', () => {
    expect(diagram(design('paladin'), { s: 34 })).toMatch(/<image href="[^"]*ui\/icons\/paladin\.svg"/);
    expect(diagram(fromPreset(BLANK), { s: 34 })).not.toMatch(/<image/);
    expect((diagram(design('rook'), { s: 96 / 7, cells: true }).match(/<rect x="[\d.]+" y="[\d.]+" width="13.71" height="13.71"/g) ?? []).length).toBe(49);
    expect(diagram(design('rook'), { s: 34 })).toMatch(/^<svg width="238" height="238" viewBox="0 0 238 238"/);
  });
});

describe('the card face (ticket 08)', () => {
  it('shows the name, the figure, the diagram and each rule as a seal with its sentence', () => {
    const d = design('paladin'), html = face(d);
    expect(html).toContain('<b>Paladin</b>');
    expect(html).toContain('<img src="ui/pieces/x-w.webp" alt="">');
    expect(html).toContain('aria-label="Reach diagram"');
    const rows = [...html.matchAll(/<li>(.*?)<\/li>/g)].map(([, li]) => li);
    expect(rows.map(li => (li.match(/class="kd-seal"/g) ?? []).length)).toEqual([1, 1, 1]);
    expect(rows.map(text)).toEqual(canonical(d).rules.map(ruleText));
    expect(rows.map(text)).toEqual(['Its lines pass over its own pieces.', 'It cannot take a king.', 'When it takes a piece, not a pawn, it is removed too.']);
    expect(text(face(design('knight')))).toContain('No rules. Only its moves.');
  });

  it('says the worth in pawns and the band word', () => {
    for (const key of ['pawn', 'queen', 'paladin', 'guard']) {
      const d = design(key), v = judge(d, false);
      expect(text(face(d))).toContain(`About ${pawns(v.worth.point)} · ${bandOf(v)}`);
    }
    expect(text(face(design('pawn')))).toContain('About 1 pawn · The unit of worth');
  });

  it('holds no control', () => {
    for (const key of ['pawn', 'archer', 'paladin', 'ogre']) expect(face(design(key))).not.toMatch(/<(button|input|select|textarea)\b/);
  });
});
