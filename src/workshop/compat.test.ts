// Golden fixtures (docs/specs/workshop-proving-ground/issues/01-proving-ground-view.md): share codes and
// stored entries that the Workshop of 2026-10-10 made, kept as literal text. A change to the link format,
// the rule order of canonical() or the stored form cannot break an old link or an old save in silence.
import { describe, expect, it } from 'vitest';
import { designCode, keyOf, parseDesign, validStored, type PieceDesign } from './model';
import { KEY, loadShelf } from './store';

type Source = Pick<PieceDesign, 'name' | 'look' | 'letter' | 'squares' | 'lines' | 'rules'>;
/** The hand-made link of the W12 sample (docs/specs/web-redesign/samples/W12.mjs): its keys are not in designCode order. */
const W12: [string, Source] = ['eyJraW5kIjoicGllY2UiLCJuYW1lIjoiUm9vayBSaWRlciIsImxvb2siOnsiZmlndXJlIjoiYW50bGVyLWd1YXJkaWFuIiwiYm9keSI6InRva2VuIiwiYXV0byI6dHJ1ZSwiZ2xvdyI6bnVsbCwiYXJteSI6MH0sImxldHRlciI6IkQiLCJzcXVhcmVzIjpbeyJ4IjoxLCJ5IjoyLCJtYXJrIjoiYm90aCJ9LHsieCI6LTEsInkiOjIsIm1hcmsiOiJib3RoIn1dLCJsaW5lcyI6WyJuIiwiZSIsInMiLCJ3Il0sInJ1bGVzIjpbXX0',
    { name: 'Rook Rider', look: { figure: 'antler-guardian', body: 'token', auto: true, glow: null, army: 0 }, letter: 'D', squares: [{ x: 1, y: 2, mark: 'both' }, { x: -1, y: 2, mark: 'both' }], lines: ['n', 'e', 's', 'w'], rules: [] }];
/** Codes that designCode made: each mark, each of the 10 blocks (with each kind of When), a glow, a token, a figure. */
const MADE: [string, Source][] = [
  // marks
  ['eyJraW5kIjoicGllY2UiLCJzcXVhcmVzIjpbeyJ4IjoyLCJ5IjotMiwibWFyayI6Im1vdmVTaG9vdCJ9LHsieCI6LTEsInkiOjEsIm1hcmsiOiJib3RoIn0seyJ4IjowLCJ5IjoxLCJtYXJrIjoibW92ZSJ9LHsieCI6MSwieSI6MSwibWFyayI6InRha2UifSx7IngiOjAsInkiOjMsIm1hcmsiOiJzaG9vdCJ9XSwibGluZXMiOltdLCJydWxlcyI6W3siZG9lcyI6eyJhIjoibW92ZXNMaWtlIiwiYXMiOiJyb29rIn0sIndoZW4iOnsibiI6MTAsIm9uIjoiZnJvbU1vdmUifX0seyJkb2VzIjp7ImEiOiJiZWNvbWVzIiwiaW50byI6ImNob2ljZSJ9LCJ3aGVuIjp7Im9uIjoicmVhY2hlcyIsInpvbmUiOiJsYXN0UmFuayJ9fV0sIm5hbWUiOiJGaXZlIE1hcmtzIiwibG9vayI6eyJib2R5IjoiTiIsImF1dG8iOmZhbHNlLCJnbG93IjpudWxsLCJhcm15IjowfSwibGV0dGVyIjoiRiJ9',
    { name: 'Five Marks', look: { body: 'N', auto: false, glow: null, army: 0 }, letter: 'F', squares: [{ x: 2, y: -2, mark: 'moveShoot' }, { x: -1, y: 1, mark: 'both' }, { x: 0, y: 1, mark: 'move' }, { x: 1, y: 1, mark: 'take' }, { x: 0, y: 3, mark: 'shoot' }], lines: [], rules: [{ does: { a: 'movesLike', as: 'rook' }, when: { n: 10, on: 'fromMove' } }, { does: { a: 'becomes', into: 'choice' }, when: { on: 'reaches', zone: 'lastRank' } }] }],
  // step2
  ['eyJraW5kIjoicGllY2UiLCJzcXVhcmVzIjpbeyJ4IjowLCJ5IjoxLCJtYXJrIjoibW92ZSJ9XSwibGluZXMiOltdLCJydWxlcyI6W3siZG9lcyI6eyJhIjoic3RlcDIifSwid2hlbiI6eyJvbiI6InpvbmUiLCJ6b25lIjoic3RhcnRSYW5rIn19XSwibmFtZSI6IkJsb2NrIDEiLCJsb29rIjp7ImJvZHkiOiJQIiwiYXV0byI6ZmFsc2UsImdsb3ciOm51bGwsImFybXkiOjB9LCJsZXR0ZXIiOiJEIn0',
    { name: 'Block 1', look: { body: 'P', auto: false, glow: null, army: 0 }, letter: 'D', squares: [{ x: 0, y: 1, mark: 'move' }], lines: [], rules: [{ does: { a: 'step2' }, when: { on: 'zone', zone: 'startRank' } }] }],
  // movesLike
  ['eyJraW5kIjoicGllY2UiLCJzcXVhcmVzIjpbeyJ4IjowLCJ5IjoxLCJtYXJrIjoibW92ZSJ9XSwibGluZXMiOltdLCJydWxlcyI6W3siZG9lcyI6eyJhIjoibW92ZXNMaWtlIiwiYXMiOiJrbmlnaHQifSwid2hlbiI6eyJvbiI6Im5lYXIiLCJ3aG8iOiJraW5nIn19XSwibmFtZSI6IkJsb2NrIDIiLCJsb29rIjp7ImJvZHkiOiJSIiwiYXV0byI6ZmFsc2UsImdsb3ciOm51bGwsImFybXkiOjB9LCJsZXR0ZXIiOiJEIn0',
    { name: 'Block 2', look: { body: 'R', auto: false, glow: null, army: 0 }, letter: 'D', squares: [{ x: 0, y: 1, mark: 'move' }], lines: [], rules: [{ does: { a: 'movesLike', as: 'knight' }, when: { on: 'near', who: 'king' } }] }],
  // linesPass
  ['eyJraW5kIjoicGllY2UiLCJzcXVhcmVzIjpbXSwibGluZXMiOlsibiIsInMiXSwicnVsZXMiOlt7ImRvZXMiOnsiYSI6ImxpbmVzUGFzcyIsIm92ZXIiOiJhbnkifSwid2hlbiI6eyJvbiI6ImFsd2F5cyJ9fV0sIm5hbWUiOiJCbG9jayAzIiwibG9vayI6eyJib2R5IjoiUiIsImF1dG8iOmZhbHNlLCJnbG93IjpudWxsLCJhcm15IjowfSwibGV0dGVyIjoiRCJ9',
    { name: 'Block 3', look: { body: 'R', auto: false, glow: null, army: 0 }, letter: 'D', squares: [], lines: ['n', 's'], rules: [{ does: { a: 'linesPass', over: 'any' }, when: { on: 'always' } }] }],
  // chain
  ['eyJraW5kIjoicGllY2UiLCJzcXVhcmVzIjpbeyJ4IjotMSwieSI6MSwibWFyayI6ImJvdGgifSx7IngiOjEsInkiOjEsIm1hcmsiOiJib3RoIn1dLCJsaW5lcyI6W10sInJ1bGVzIjpbeyJkb2VzIjp7ImEiOiJjaGFpbiJ9LCJ3aGVuIjp7Im9uIjoidGFrZXMifX1dLCJuYW1lIjoiQmxvY2sgNCIsImxvb2siOnsiYm9keSI6IlMiLCJhdXRvIjpmYWxzZSwiZ2xvdyI6bnVsbCwiYXJteSI6MH0sImxldHRlciI6IkQifQ',
    { name: 'Block 4', look: { body: 'S', auto: false, glow: null, army: 0 }, letter: 'D', squares: [{ x: -1, y: 1, mark: 'both' }, { x: 1, y: 1, mark: 'both' }], lines: [], rules: [{ does: { a: 'chain' }, when: { on: 'takes' } }] }],
  // cannotBeTaken
  ['eyJraW5kIjoicGllY2UiLCJzcXVhcmVzIjpbeyJ4IjowLCJ5IjotMSwibWFyayI6Im1vdmUifSx7IngiOjAsInkiOjEsIm1hcmsiOiJtb3ZlIn1dLCJsaW5lcyI6W10sInJ1bGVzIjpbeyJkb2VzIjp7ImEiOiJjYW5ub3RCZVRha2VuIiwiYnkiOiJhbGxCdXRLaW5nIn0sIndoZW4iOnsibiI6MTAsIm9uIjoiYmVmb3JlTW92ZSJ9fV0sIm5hbWUiOiJCbG9jayA1IiwibG9vayI6eyJib2R5IjoiRyIsImF1dG8iOmZhbHNlLCJnbG93IjpudWxsLCJhcm15IjowfSwibGV0dGVyIjoiRCJ9',
    { name: 'Block 5', look: { body: 'G', auto: false, glow: null, army: 0 }, letter: 'D', squares: [{ x: 0, y: -1, mark: 'move' }, { x: 0, y: 1, mark: 'move' }], lines: [], rules: [{ does: { a: 'cannotBeTaken', by: 'allButKing' }, when: { n: 10, on: 'beforeMove' } }] }],
  // push
  ['eyJraW5kIjoicGllY2UiLCJzcXVhcmVzIjpbeyJ4IjowLCJ5IjoxLCJtYXJrIjoiYm90aCJ9XSwibGluZXMiOltdLCJydWxlcyI6W3siZG9lcyI6eyJhIjoicHVzaCIsInRoZW4iOiJzdGF5In0sIndoZW4iOnsib24iOiJ6b25lIiwiem9uZSI6ImVuZW15SGFsZiJ9fV0sIm5hbWUiOiJCbG9jayA2IiwibG9vayI6eyJib2R5IjoiTyIsImF1dG8iOmZhbHNlLCJnbG93IjpudWxsLCJhcm15IjowfSwibGV0dGVyIjoiRCJ9',
    { name: 'Block 6', look: { body: 'O', auto: false, glow: null, army: 0 }, letter: 'D', squares: [{ x: 0, y: 1, mark: 'both' }], lines: [], rules: [{ does: { a: 'push', then: 'stay' }, when: { on: 'zone', zone: 'enemyHalf' } }] }],
  // swap
  ['eyJraW5kIjoicGllY2UiLCJzcXVhcmVzIjpbeyJ4IjoxLCJ5IjowLCJtYXJrIjoiYm90aCJ9XSwibGluZXMiOltdLCJydWxlcyI6W3siZG9lcyI6eyJhIjoic3dhcCIsIndpdGgiOiJlbmVteSJ9LCJ3aGVuIjp7Im9uIjoiem9uZSIsInpvbmUiOiJvd25IYWxmIn19XSwibmFtZSI6IkJsb2NrIDciLCJsb29rIjp7ImJvZHkiOiJNIiwiYXV0byI6ZmFsc2UsImdsb3ciOm51bGwsImFybXkiOjB9LCJsZXR0ZXIiOiJEIn0',
    { name: 'Block 7', look: { body: 'M', auto: false, glow: null, army: 0 }, letter: 'D', squares: [{ x: 1, y: 0, mark: 'both' }], lines: [], rules: [{ does: { a: 'swap', with: 'enemy' }, when: { on: 'zone', zone: 'ownHalf' } }] }],
  // becomes
  ['eyJraW5kIjoicGllY2UiLCJzcXVhcmVzIjpbeyJ4IjowLCJ5IjoxLCJtYXJrIjoibW92ZSJ9LHsieCI6MSwieSI6MSwibWFyayI6InRha2UifV0sImxpbmVzIjpbXSwicnVsZXMiOlt7ImRvZXMiOnsiYSI6ImJlY29tZXMiLCJpbnRvIjoiQSJ9LCJ3aGVuIjp7Im9uIjoiZmlyc3RUYWtlIn19XSwibmFtZSI6IkJsb2NrIDgiLCJsb29rIjp7ImJvZHkiOiJQIiwiYXV0byI6ZmFsc2UsImdsb3ciOm51bGwsImFybXkiOjB9LCJsZXR0ZXIiOiJEIn0',
    { name: 'Block 8', look: { body: 'P', auto: false, glow: null, army: 0 }, letter: 'D', squares: [{ x: 0, y: 1, mark: 'move' }, { x: 1, y: 1, mark: 'take' }], lines: [], rules: [{ does: { a: 'becomes', into: 'A' }, when: { on: 'firstTake' } }] }],
  // cannotTake
  ['eyJraW5kIjoicGllY2UiLCJzcXVhcmVzIjpbXSwibGluZXMiOlsibmUiLCJudyJdLCJydWxlcyI6W3siZG9lcyI6eyJhIjoiY2Fubm90VGFrZSIsIndoYXQiOiJwYXducyJ9LCJ3aGVuIjp7Im9uIjoibmVhciIsIndobyI6ImVuZW15In19XSwibmFtZSI6IkJsb2NrIDkiLCJsb29rIjp7ImJvZHkiOiJCIiwiYXV0byI6ZmFsc2UsImdsb3ciOm51bGwsImFybXkiOjB9LCJsZXR0ZXIiOiJEIn0',
    { name: 'Block 9', look: { body: 'B', auto: false, glow: null, army: 0 }, letter: 'D', squares: [], lines: ['ne', 'nw'], rules: [{ does: { a: 'cannotTake', what: 'pawns' }, when: { on: 'near', who: 'enemy' } }] }],
  // removedAfter
  ['eyJraW5kIjoicGllY2UiLCJzcXVhcmVzIjpbXSwibGluZXMiOlsiZSIsInciXSwicnVsZXMiOlt7ImRvZXMiOnsiYSI6InJlbW92ZWRBZnRlciIsIndoYXQiOiJhbnkifSwid2hlbiI6eyJvbiI6InRha2VzIn19XSwibmFtZSI6IkJsb2NrIDEwIiwibG9vayI6eyJib2R5IjoiTCIsImF1dG8iOmZhbHNlLCJnbG93IjpudWxsLCJhcm15IjowfSwibGV0dGVyIjoiRCJ9',
    { name: 'Block 10', look: { body: 'L', auto: false, glow: null, army: 0 }, letter: 'D', squares: [], lines: ['e', 'w'], rules: [{ does: { a: 'removedAfter', what: 'any' }, when: { on: 'takes' } }] }],
  // glow
  ['eyJraW5kIjoicGllY2UiLCJzcXVhcmVzIjpbXSwibGluZXMiOlsibmUiLCJzZSIsInN3IiwibnciXSwicnVsZXMiOlt7ImRvZXMiOnsiYSI6Im1vdmVzTGlrZSIsImFzIjoia2luZyJ9LCJ3aGVuIjp7Im9uIjoiYWZ0ZXJGaXJzdENhcHR1cmUifX1dLCJuYW1lIjoiRnJvc3QgTGFuY2VyIiwibG9vayI6eyJib2R5IjoiUiIsImF1dG8iOmZhbHNlLCJnbG93IjoiRnJvc3QiLCJhcm15IjowfSwibGV0dGVyIjoiSCJ9',
    { name: 'Frost Lancer', look: { body: 'R', auto: false, glow: 'Frost', army: 0 }, letter: 'H', squares: [], lines: ['ne', 'se', 'sw', 'nw'], rules: [{ does: { a: 'movesLike', as: 'king' }, when: { on: 'afterFirstCapture' } }] }],
  // token
  ['eyJraW5kIjoicGllY2UiLCJzcXVhcmVzIjpbeyJ4IjotMSwieSI6LTIsIm1hcmsiOiJib3RoIn0seyJ4IjoxLCJ5IjotMiwibWFyayI6ImJvdGgifSx7IngiOi0yLCJ5IjotMSwibWFyayI6ImJvdGgifSx7IngiOjIsInkiOi0xLCJtYXJrIjoiYm90aCJ9LHsieCI6LTIsInkiOjEsIm1hcmsiOiJib3RoIn0seyJ4IjoyLCJ5IjoxLCJtYXJrIjoiYm90aCJ9LHsieCI6LTEsInkiOjIsIm1hcmsiOiJib3RoIn0seyJ4IjoxLCJ5IjoyLCJtYXJrIjoiYm90aCJ9XSwibGluZXMiOltdLCJydWxlcyI6W3siZG9lcyI6eyJhIjoibW92ZXNMaWtlIiwiYXMiOiJxdWVlbiJ9LCJ3aGVuIjp7ImNhcmQiOiJhbnkiLCJvbiI6ImFmdGVyQ2FyZCJ9fV0sIm5hbWUiOiJXaXNwIiwibG9vayI6eyJib2R5IjoidG9rZW4iLCJhdXRvIjp0cnVlLCJnbG93IjpudWxsLCJhcm15IjowfSwibGV0dGVyIjoiVyJ9',
    { name: 'Wisp', look: { body: 'token', auto: true, glow: null, army: 0 }, letter: 'W', squares: [{ x: -1, y: -2, mark: 'both' }, { x: 1, y: -2, mark: 'both' }, { x: -2, y: -1, mark: 'both' }, { x: 2, y: -1, mark: 'both' }, { x: -2, y: 1, mark: 'both' }, { x: 2, y: 1, mark: 'both' }, { x: -1, y: 2, mark: 'both' }, { x: 1, y: 2, mark: 'both' }], lines: [], rules: [{ does: { a: 'movesLike', as: 'queen' }, when: { card: 'any', on: 'afterCard' } }] }],
  // figure
  ['eyJraW5kIjoicGllY2UiLCJzcXVhcmVzIjpbeyJ4IjotMSwieSI6LTEsIm1hcmsiOiJtb3ZlIn0seyJ4IjowLCJ5IjotMSwibWFyayI6Im1vdmUifSx7IngiOjEsInkiOi0xLCJtYXJrIjoibW92ZSJ9LHsieCI6LTEsInkiOjAsIm1hcmsiOiJtb3ZlIn0seyJ4IjoxLCJ5IjowLCJtYXJrIjoibW92ZSJ9LHsieCI6LTEsInkiOjEsIm1hcmsiOiJtb3ZlIn0seyJ4IjowLCJ5IjoxLCJtYXJrIjoibW92ZSJ9LHsieCI6MSwieSI6MSwibWFyayI6Im1vdmUifV0sImxpbmVzIjpbIm4iLCJlIiwicyIsInciXSwicnVsZXMiOlt7ImRvZXMiOnsiYSI6Im1vdmVzTGlrZSIsImFzIjoiYmlzaG9wIn0sIndoZW4iOnsib24iOiJuZWFyIiwid2hvIjoiTSJ9fV0sIm5hbWUiOiJSYW0ncyBXYXJkICh5b3VycykiLCJsb29rIjp7ImJvZHkiOiJ0b2tlbiIsImF1dG8iOmZhbHNlLCJnbG93IjpudWxsLCJhcm15IjoxLCJmaWd1cmUiOiJyYW0tYmFzdGlvbiJ9LCJsZXR0ZXIiOiJYIn0',
    { name: "Ram's Ward (yours)", look: { body: 'token', auto: false, glow: null, army: 1, figure: 'ram-bastion' }, letter: 'X', squares: [{ x: -1, y: -1, mark: 'move' }, { x: 0, y: -1, mark: 'move' }, { x: 1, y: -1, mark: 'move' }, { x: -1, y: 0, mark: 'move' }, { x: 1, y: 0, mark: 'move' }, { x: -1, y: 1, mark: 'move' }, { x: 0, y: 1, mark: 'move' }, { x: 1, y: 1, mark: 'move' }], lines: ['n', 'e', 's', 'w'], rules: [{ does: { a: 'movesLike', as: 'bishop' }, when: { on: 'near', who: 'M' } }] }],
];
/** A kingdown.workshop value as saveDesign writes it: an entry with no figure, one saved before ownLetter, and a damaged one (y: 4). */
const STORED = '{"v":1,"designs":[{"v":1,"kind":"piece","id":"golden-a","name":"Jumper","named":true,"look":{"body":"N","auto":false,"glow":null,"army":0},"letter":"J","ownLetter":true,"squares":[{"x":1,"y":2,"mark":"both"},{"x":-1,"y":2,"mark":"both"},{"x":1,"y":-2,"mark":"both"},{"x":-1,"y":-2,"mark":"both"},{"x":2,"y":1,"mark":"both"},{"x":-2,"y":1,"mark":"both"},{"x":2,"y":-1,"mark":"both"},{"x":-2,"y":-1,"mark":"both"}],"lines":[],"rules":[],"from":["knight"],"updated":1760000000000},{"v":1,"kind":"piece","id":"golden-b","name":"Old Ward","named":false,"look":{"body":"token","auto":true,"glow":"Shadow","army":1,"figure":"ram-bastion"},"letter":"U","squares":[{"x":0,"y":1,"mark":"move"}],"lines":["ne","nw"],"rules":[{"when":{"on":"zone","zone":"capital"},"does":{"a":"movesLike","as":"queen"}}],"from":[],"updated":1759000000000},{"v":1,"kind":"piece","id":"golden-c","name":"Broken","named":true,"look":{"body":"R","auto":false,"glow":null,"army":0},"letter":"Z","ownLetter":true,"squares":[{"x":0,"y":4,"mark":"move"}],"lines":[],"rules":[],"from":[],"updated":1758000000000}]}';

describe('old share codes', () => {
  it('each code reads as the design it came from', () => {
    for (const [code, src] of [W12, ...MADE]) {
      const d = parseDesign(code);
      expect(d, src.name).not.toBeNull();
      expect([keyOf(d!), d!.name, d!.look, d!.letter], src.name).toEqual([keyOf(src), src.name, src.look, src.letter]);
    }
  });

  it('each code that designCode made gives the same code again', () => {
    for (const [code, src] of MADE) expect(designCode(parseDesign(code)!), src.name).toBe(code);
  });
});

describe('old stored designs', () => {
  it('reads each whole entry and counts the damaged one', () => {
    expect((JSON.parse(STORED).designs as unknown[]).map(validStored)).toEqual([true, true, false]);
    const shelf = loadShelf({ getItem: k => (k === KEY ? STORED : null), setItem: () => {} });
    expect([shelf.designs.map(d => d.id), shelf.bad]).toEqual([['golden-a', 'golden-b'], 1]);
  });
});
