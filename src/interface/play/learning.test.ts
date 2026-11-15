import { expect, it } from 'vitest';
import { Game } from '../../game';
import { GameRules } from '../../game-rules';
import { A, K, KINGS, P, type PieceType } from '../../rules/engine';
import { RELEASED_CARDS } from '../../content/cards';
import { POWERS_BALANCED } from '../../rules/rules';
import { pieces, powerLines } from './texts';
import { guideEntries } from './guide';
import { DraftTurn } from './turn';
import { diagramFor, firstMinute, learningEntry, stepLine, type LearnSubject } from './learning';
const context = new GameRules(POWERS_BALANCED);
const subjects: LearnSubject[] = [
  ...Object.keys(pieces).map(type => ({ kind: 'piece' as const, type: +type as PieceType })),
  ...Object.values(KINGS).flat().map(id => ({ kind: 'power' as const, id })),
  ...RELEASED_CARDS.map(card => ({ kind: 'card' as const, id: card.id })),
];
it('first-minute help follows real moves and restored drafts', () => {
  const game = new Game('RNBQKBNR', { ...POWERS_BALANCED, kings: [{ king: 'Frost', power: 'Freeze' }, null] });
  const draft = new DraftTurn(game); expect(firstMinute(draft)).toBe(true);
  draft.stage(draft.legal.find(m => m.power === 'freeze')!); expect(firstMinute(draft)).toBe(true);
  draft.stage(draft.legal.find(m => !m.pass)!); expect(firstMinute(draft)).toBe(false);
  draft.undo(); expect(firstMinute(draft)).toBe(true);
  draft.undo(); draft.stage(draft.legal.find(m => !m.power && !m.pass)!); expect(firstMinute(draft)).toBe(false);
  draft.commit(); expect(firstMinute(new DraftTurn(game))).toBe(false);
});
it.each(subjects)('all released subjects have complete learning content: $kind $id $type', subject => {
  const entry = learningEntry(subject, context);
  expect(entry.key).toMatch(/^(piece|power|card):/);
  expect(entry.short).toBe(subject.kind === 'piece' ? pieces[subject.type].short : powerLines[subject.id]);
  const section = subject.kind === 'piece' ? 'Pieces' : subject.kind === 'power' ? 'Kings and powers' : 'Cards';
  expect(entry.full).toBe(guideEntries(section).find(item => item.id === String(subject.kind === 'piece' ? subject.type : subject.id))!.full);
  expect(entry.limits.length).toBeGreaterThan(15); expect(entry.against.length).toBeGreaterThan(12);
  const diagram = diagramFor(subject); expect(diagram.frames.length).toBeGreaterThan(0);
  for (const frame of diagram.frames) if (frame.move) {
    expect(diagram.rules.legalMoves(frame.before)).toContainEqual(frame.move);
    expect(diagram.rules.makeMove(frame.before, frame.move)).toEqual(frame.after);
  }
  expect(diagram.text.length).toBeGreaterThan(15);
  if (subject.kind === 'card' || subject.kind === 'power' && entry.uses !== 'Always on') expect(stepLine(subject).length).toBeGreaterThan(15);
});
it('panels read the active rules and preserve approved copy', () => {
  expect(learningEntry({ kind: 'piece', type: P }, context).full).toContain('No en passant');
  expect(learningEntry({ kind: 'piece', type: K }, new GameRules({ classicChess: true })).full).not.toContain('No castling');
  expect(learningEntry({ kind: 'power', id: 'Freeze' }, context).uses).toBe('1 use per game');
  expect(learningEntry({ kind: 'power', id: 'IceWall' }, context).uses).toBe('2 uses per game');
  expect(learningEntry({ kind: 'power', id: 'Mercy' }, context).full).toContain('except by pawns');
  expect(learningEntry({ kind: 'card', id: 'Vault' }, context).name).toBe('Hop');
  expect(stepLine({ kind: 'card', id: 'March' })).toContain('Tap');
  const darkness = new GameRules({ ...POWERS_BALANCED, kings: [{ king: 'Shadow', power: 'Darkness' }, null] });
  expect(learningEntry({ kind: 'piece', type: P }, darkness).limits).toContain('Darkness overrides the base pawn rule');
  expect(learningEntry({ kind: 'card', id: 'March' }, darkness).limits).toContain('With Darkness, pawns capture only straight ahead.');
  expect(learningEntry({ kind: 'card', id: 'Flight' }, context).limits).toContain('cannot land on your back rank');
  expect(learningEntry({ kind: 'card', id: 'EarthQuake' }, context).limits).toContain('A pawn cannot land on rank 1 or 8.');
  expect(learningEntry({ kind: 'piece', type: A }, context).isNew).toBe(true);
});
it('diagram frames use real back ranks and both sides', () => {
  const holy = diagramFor({ kind: 'power', id: 'HolyLight' });
  expect(holy.frames[0].move).toBeDefined();
  expect(holy.frames[0].before.board).not.toEqual(holy.frames[0].after.board);
  expect(diagramFor({ kind: 'card', id: 'FireStarter' }).frames[0].move!.to >> 3).toBe(7);
  expect(diagramFor({ kind: 'card', id: 'FireStarter' }, 1).frames[0].move!.to >> 3).toBe(0);
  const a = diagramFor({ kind: 'piece', type: A }), b = diagramFor({ kind: 'piece', type: A });
  a.frames[0].before.board.fill(0); expect(b.frames[0].before.board.some(Boolean)).toBe(true);
});
