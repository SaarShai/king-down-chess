import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { Game } from '../../game';
import { RELEASED_CARDS } from '../../content/cards';
import { KINGS, parseSq } from '../../rules/engine';
import { DraftTurn } from './turn';
import { rulesOf } from './saved';
import { refusalForTap } from './refusals';
import { diagramFor, stepLine, type LearnSubject } from './learning';
import { text } from './texts';

// Repair of the lane "reading" (the checks check-play.md and check-code.md): the rules that a unit test can read.
// The browser record (runs/tools/launch-readingb/browser.mjs) proves the page rules of the same repair.
const read = (name: string) => readFileSync(new URL(name, import.meta.url), 'utf8');
const subjects: LearnSubject[] = [
  ...Object.values(KINGS).flat().map(id => ({ kind: 'power' as const, id })),
  ...RELEASED_CARDS.map(card => ({ kind: 'card' as const, id: card.id })),
];

describe.each([0, 1] as const)('the full rule of each power and card for side %i', side => {
  // The computer's cards (option b1) open their rule for side 1: Sky Lift had no legal example there (check "play" fault 1).
  it.each(subjects)('$kind $id has a move diagram', subject => {
    const diagram = diagramFor(subject, side);
    expect(diagram.frames.length).toBeGreaterThan(0);
    expect(diagram.side).toBe(side);
  });
});

it('a tap on a piece with no legal action names that fact (check "play" fault 12)', () => {
  const game = new Game('RNBQKBNR', rulesOf('pieces', [null, null], [[], []])), draft = new DraftTurn(game);
  for (const square of ['a1', 'c1', 'd1', 'e1']) expect(refusalForTap(draft, parseSq(square), parseSq(square)), square).toBe(text.noMoves);
  // A target that the piece cannot reach keeps its own reason.
  expect(refusalForTap(draft, parseSq('a1'), parseSq('a5'))).toBe('The Rook cannot move there: its rank or file must be clear. Tap a ringed target.');
});

it('the first-time step of a free power or card says what is possible next (reading decision 20; check "code" fault 2)', () => {
  const free: LearnSubject[] = [{ kind: 'power', id: 'Freeze' }, { kind: 'power', id: 'IceWall' }, { kind: 'card', id: 'Firewall' }];
  for (const subject of free) expect(stepLine(subject), JSON.stringify(subject)).toMatch(/ Then move a piece, or select End turn\.$/);
});

it('the reading area has no dead rules or probes (check "code" fault 5)', () => {
  const css = read('./play.css') + read('./reading-b.css'), main = read('./main.ts');
  for (const name of ['play-current', 'play-more', 'learn-compact', 'safe-probe']) {
    expect(css, name).not.toContain(`.${name}`);
    expect(main, name).not.toContain(name);
  }
});
