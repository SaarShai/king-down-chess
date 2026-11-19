import { afterEach, expect, it, vi } from 'vitest';
import { GameRules } from '../../game-rules';
import { A, B, G, K, KINGS, L, M, N, O, P, Q, R, S, type PieceType } from '../../rules/engine';
import { POWERS_BALANCED } from '../../rules/rules';
import { RELEASED_CARDS } from '../../content/cards';
import { diagramFor, learningEntry, type LearnSubject } from './learning';
import { effectEndLines, opponentLines, pieces, resultText } from './texts';
import { Game } from '../../game';
import { DraftTurn } from './turn';
import { refusalForTap } from './refusals';
import { parseSq } from '../../rules/engine';
import { markHintSeen, readHints, resetHints } from './hints';

const context = new GameRules(POWERS_BALANCED);
const pieceLimit: Record<number, RegExp> = {
  [P]: /last rank/, [N]: /jump over pieces/, [B]: /block the path/, [R]: /block the path/, [Q]: /block it/,
  [K]: /safe.*Only a king.*Guard/, [A]: /two squares.*over pieces/,
  [S]: /each later chain step must capture/, [G]: /without capture.*only a king/, [M]: /king safe/,
  [O]: /never push a king or off the board/, [L]: /over own pieces.*non-pawn capture removes both/,
};
const resourceLimit: Record<string, RegExp> = {
  Freeze: /(not|except) the king.*(able to attack|still attacks)/, IceWall: /not the king.*push still works/,
  Strike: /no pawn, king or capture/, Haste: /neither move captures/, Flight: /empty square in your half.*no king/,
  Sacrifice: /no pawn, Guard or king/, March: /any rank.*path stays clear/, Leap: /own pawns, not other pieces/,
  HolyLight: /beside the king, not on its diagonals/, Mercy: /shelter.*except by pawns/,
  DeathTouch: /two ahead or back.*never move/, Darkness: /capture only straight ahead/,
  Salvation: /back rank.*no pawn, Guard or king/, MirrorB: /that card stays/,
  Firewall: /next enemy turn.*push works/, EarthQuake: /kings and blocked or edge pieces stay/,
  Burn: /d4, e4, d5 or e5.*no pawn or king/, FireStarter: /enemy back rank.*no pawn or king/,
  Control: /different adjacent own type.*no pawn or king/, Rally: /different pieces.*neither move captures/,
  MorphP: /Knight or Bishop.*stays/, Mimic: /not capture.*no pawn or king/, Vault: /exactly one piece/,
  Curse: /empty square.*no king or last-rank pawn/, SkyLift: /different own types.*no pawn or king/,
};
const subjects: LearnSubject[] = [
  ...Object.keys(pieces).map(type => ({ kind: 'piece' as const, type: +type as PieceType })),
  ...Object.values(KINGS).flat().map(id => ({ kind: 'power' as const, id })),
  ...RELEASED_CARDS.map(card => ({ kind: 'card' as const, id: card.id })),
];
it.each(subjects)('V1: the short rule states the main exception: $kind $id $type', subject => {
  const entry = learningEntry(subject, context);
  const limit = subject.kind === 'card' && subject.id === 'March' ? /off its start rank.*two empty squares/ : subject.kind === 'piece' ? pieceLimit[subject.type] : resourceLimit[subject.id];
  expect(entry.short).toMatch(limit);
  expect(entry.full.length).toBeGreaterThan(20);
});
it.each([0, 1] as const)('V5: the Pawn words and legal example follow Darkness on side %s', side => {
  const kings = [...context.rules.kings] as [typeof context.rules.kings[0], typeof context.rules.kings[1]];
  kings[side] = { king: 'Shadow', power: 'Darkness' };
  const rules = new GameRules({ ...POWERS_BALANCED, kings });
  const subject: LearnSubject = { kind: 'piece', type: P };
  const entry = learningEntry(subject, rules, undefined, side);
  expect(entry.short).toContain('capture only straight ahead');
  expect(entry.full).toContain('Capture only straight ahead.');
  expect(entry.full).not.toMatch(/Capture[s]? .*diagonal/i);
  const demo = diagramFor(subject, side, rules), frame = demo.frames[0];
  expect(demo.text).toContain('captures straight forward');
  expect(frame.move!.captures).toEqual([frame.move!.to]);
  expect(frame.move!.from % 8).toBe(frame.move!.to % 8);
  expect(demo.rules.legalMoves(frame.before)).toContainEqual(frame.move);
});
it('V3: an expired Firewall gives one count for each source', () => {
  const demo = diagramFor({ kind: 'card', id: 'Firewall' }), before = demo.frames[0].after;
  const after = { ...before, marks: undefined }, move = { from: 0, to: 0, captures: [], pass: true as const };
  expect(effectEndLines(demo.rules, before, move, after)).toEqual(['Firewall ends for 3 of your pieces.']);
  expect(effectEndLines(demo.rules, before, move, after, 1)).toEqual(["Firewall ends for 3 of the opponent's pieces."]);
});
afterEach(() => vi.unstubAllGlobals());
it('T3: the Symbols hint uses the existing once-only store and Reset hints', () => {
  const values = new Map<string, string>();
  vi.stubGlobal('localStorage', { getItem: (k: string) => values.get(k) ?? null, setItem: (k: string, v: string) => values.set(k, v), removeItem: (k: string) => values.delete(k) });
  resetHints(); markHintSeen('view:symbols');
  expect(readHints().has('view:symbols')).toBe(true);
  resetHints(); expect(readHints().has('view:symbols')).toBe(false);
});

it('V5: a refused Pawn tap also uses the active Darkness capture rule', () => {
  const game = new Game('RNBQKBNR', { ...POWERS_BALANCED, kings: [{ king: 'Shadow', power: 'Darkness' }, null] });
  game.load(game.context.fromFen('7k/7p/8/8/8/8/P7/7K w - - 0 1'));
  expect(refusalForTap(new DraftTurn(game), parseSq('a2'), parseSq('h3'))).toContain('capture straight ahead');
});

it.each(Object.values(KINGS).flat())('the computer preview keeps the limit of %s', power => {
  expect(opponentLines[power]).toMatch(power === 'Flight' ? /empty square in its half.*no king/ : resourceLimit[power]);
  expect(opponentLines[power]).not.toMatch(/\b(your|you)\b/i);
});
it.each([0, 1] as const)('King help and its legal example use the power on side %s', side => {
  for (const power of ['Mercy', 'Darkness', 'DeathTouch'] as const) {
    const kings = [...context.rules.kings] as [typeof context.rules.kings[0], typeof context.rules.kings[1]];
    kings[side] = { king: power === 'Mercy' ? 'Spirit' : 'Shadow', power };
    const rules = new GameRules({ ...POWERS_BALANCED, kings }), subject: LearnSubject = { kind: 'piece', type: K };
    const entry = learningEntry(subject, rules, undefined, side), demo = diagramFor(subject, side, rules), frame = demo.frames[0], move = frame.move!;
    expect(entry.short).not.toBe(pieces[K].short);
    expect(entry.full).toMatch(power === 'Mercy' ? /1–2 squares/ : power === 'Darkness' ? /two squares/ : /without moving/);
    expect(entry.limits).toContain(power === 'Mercy' ? 'except by pawns' : power === 'Darkness' ? 'empty' : 'without moving');
    expect(demo.rules.rules.kings[side]?.power).toBe(power);
    expect(demo.rules.legalMoves(frame.before)).toContainEqual(move);
    if (power === 'DeathTouch') { expect(move.from).toBe(move.to); expect(move.captures).toHaveLength(1); }
    else expect(Math.max(Math.abs(move.from % 8 - move.to % 8), Math.abs((move.from >> 3) - (move.to >> 3)))).toBe(2);
  }
});

it('reads the winning side and the result cause from the final game state', () => {
  expect(resultText('checkmate', false, 1)).toEqual({ title: 'You win', cause: 'Checkmate.' });
  expect(resultText('checkmate', false, 1, 1)).toEqual({ title: 'The computer wins', cause: 'Checkmate.' });
  expect(resultText('playing', true, 0)).toEqual({ title: 'The computer wins', cause: 'You resign.' });
  expect(resultText('drawMaterial', false, 0)).toEqual({ title: 'Draw', cause: 'Insufficient material.' });
});
