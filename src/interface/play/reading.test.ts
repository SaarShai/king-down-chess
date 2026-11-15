import { describe, expect, it } from 'vitest';
import { Game } from '../../game';
import { POWERS_BALANCED } from '../../rules/rules';
import { KINGS, TAG_POWER, parseSq, type PowerName, type PowerTag } from '../../rules/engine';
import { DraftTurn } from './turn';
import { rulesOf } from './saved';
import { pieces, armedStep, cancelLine, checkLines, choiceLabel, choicePrompt, effectGroups, freeLine, opponentLines, readingText, selectionLines, stateDescriptions, text } from './texts';

// Stage "reading" (launch decisions 17 to 22): the text rules of the reading area.
const tagOf = (card: string) => (Object.keys(TAG_POWER) as PowerTag[]).find(tag => TAG_POWER[tag] === card)!;
const cardsGame = (fen: string, hand: string[]) => {
  const game = new Game('RNBQKBNR', rulesOf('cards', [{ king: 'Spirit', power: 'HolyLight' }, { king: 'Shadow', power: 'DeathTouch' }], [hand as never, hand as never]));
  game.load(game.context.fromFen(fen)); return game;
};

describe('effect groups (decision 18)', () => {
  it('keep both owners apart and every affected square in the detail', () => {
    const game = new Game('RNBQKBNR', { ...POWERS_BALANCED, kings: [{ king: 'Spirit', power: 'HolyLight' }, { king: 'Spirit', power: 'HolyLight' }] });
    game.load(game.context.fromFen('3pkp2/4p3/8/8/8/4P3/3PKP2/8 w - - 0 1'));
    const groups = effectGroups(game.context, game.pos);
    expect(groups.map(group => group.summary)).toEqual(['You: Holy Light protects 3 pieces.', 'Computer: Holy Light protects 3 pieces.']);
    const lines = stateDescriptions(game.context, game.pos);
    expect(groups.flatMap(group => group.details)).toEqual(lines);
    expect(groups[0].details.flatMap(detail => detail.squares).sort()).toEqual(['d2', 'f2', 'e3'].map(parseSq).sort());
    expect(groups[1].details.flatMap(detail => detail.squares).sort()).toEqual(['d8', 'f8', 'e7'].map(parseSq).sort());
  });

  it('follow a moved piece and leave no old square', () => {
    const game = new Game('RNBQKBNR', { ...POWERS_BALANCED, kings: [{ king: 'Spirit', power: 'HolyLight' }, null] });
    game.load(game.context.fromFen('7k/7p/8/8/3P4/2PKP3/3P4/8 w - - 0 1'));
    expect(effectGroups(game.context, game.pos)[0].summary).toBe('You: Holy Light protects 4 pieces.');
    const moved = game.context.makeMove(game.pos, game.legal.find(m => m.from === parseSq('d4') && m.to === parseSq('d5'))!);
    const [group] = effectGroups(game.context, moved);
    expect(group.summary).toBe('You: Holy Light protects 3 pieces.');
    expect(group.details.map(detail => detail.line).join(' ')).not.toMatch(/d4|d5/);
  });

  it('keeps Guard rules and check out of the effects groups', () => {
    const game = new Game('RNBQKBNR', { kings: [null, null] });
    game.load(game.context.fromFen('6gk/7p/8/8/8/8/r7/KG6 w - - 0 1'));
    const groups = effectGroups(game.context, game.pos);
    expect(groups).toEqual([]);
    expect(stateDescriptions(game.context, game.pos).some(state => state.line.startsWith('Guard on '))).toBe(false);
    expect(JSON.stringify(groups)).not.toContain('Check');
    expect(stateDescriptions(game.context, game.pos).some(state => state.line.startsWith('Check: '))).toBe(true);
  });
});

describe('the selected piece (decisions 18 and 22)', () => {
  it('shows the exact Freeze line with its duration, for the side whose turn it is', () => {
    const game = new Game('RNBQKBNR', { ...POWERS_BALANCED, kings: [{ king: 'Frost', power: 'Freeze' }, null] });
    game.load(game.context.fromFen('7k/7p/n7/8/8/8/7P/K7 w - - 0 1'));
    const draft = new DraftTurn(game); draft.arm('freeze'); draft.stage(draft.at(parseSq('a6'), parseSq('a6'))[0]);
    draft.stage(draft.legal.find(m => m.from === parseSq('h2') && m.to === parseSq('h3'))!);
    // The staged move passes the turn in the draft, but the turn is not final: the line keeps "the computer's next turn".
    expect(selectionLines(game.context, draft.position, parseSq('a6'), draft.base.turn)).toEqual(['Frozen: the computer’s Knight on a6 cannot move on the computer’s next turn.']);
    expect(stateDescriptions(game.context, draft.position)[0].line).toContain('on this turn');
  });

  it('keeps the Mercy pawn exception', () => {
    const game = new Game('RNBQKBNR', { ...POWERS_BALANCED, mercyAura: true, mercyAuraPawnsTake: true, kings: [{ king: 'Spirit', power: 'Mercy' }, null] });
    game.load(game.context.fromFen('7k/7p/8/8/8/8/3N4/3K4 w - - 0 1'));
    expect(selectionLines(game.context, game.pos, parseSq('d2'))).toEqual(['Mercy: your Knight on d2 cannot be captured, except by a pawn, while beside the King on d1.']);
  });

  it('names an always-on power that changes how the piece moves, with its owner', () => {
    const game = new Game('RNBQKBNR', { ...POWERS_BALANCED, kings: [{ king: 'Spirit', power: 'Mercy' }, { king: 'Shadow', power: 'Darkness' }] });
    game.load(game.context.fromFen('7k/6p1/8/8/8/8/8/3K4 w - - 0 1'));
    expect(selectionLines(game.context, game.pos, parseSq('d1'))).toContain('Your Mercy: this King steps up to two squares.');
    expect(selectionLines(game.context, game.pos, parseSq('g7'))).toEqual(['The computer’s Darkness: this Pawn steps diagonally too, but captures only straight ahead.']);
    expect(selectionLines(game.context, game.pos, parseSq('h8'))).toEqual([]);
  });
});

describe('check (decision 22)', () => {
  it('names the attacked side for each viewer, before and after a staged move', () => {
    const game = new Game('RNBQKBNR', { kings: [null, null] });
    game.load(game.context.fromFen('4k3/7p/8/8/8/8/8/R3K3 w - - 0 1'));
    expect(checkLines(game.context, game.pos)).toEqual({ mine: false, lines: [] });
    const after = game.context.makeMove(game.pos, game.legal.find(m => m.from === parseSq('a1') && m.to === parseSq('a8'))!);
    expect(checkLines(game.context, after, 0)).toEqual({ mine: false, lines: ['Check: your Rook on a8 attacks the computer’s King on e8.'] });
    expect(checkLines(game.context, after, 1)).toEqual({ mine: true, lines: ['Check: the computer’s Rook on a8 attacks your King on e8.'] });
  });

  it('names each attacker of a double check', () => {
    const game = new Game('RNBQKBNR', { kings: [null, null] });
    game.load(game.context.fromFen('4k3/8/8/8/8/1n6/r7/K7 w - - 0 1'));
    const check = checkLines(game.context, game.pos);
    expect(check.mine).toBe(true);
    expect([...check.lines].sort()).toEqual(['Check: the computer’s Knight on b3 attacks your King on a1.', 'Check: the computer’s Rook on a2 attacks your King on a1.']);
  });
});

describe('armed powers and cards (decision 19)', () => {
  it('name the real actor, then the target', () => {
    const fire = cardsGame('6nk/7p/8/8/8/8/N6P/K7 w - - 0 1', ['FireStarter', 'Curse', 'Freeze', 'Salvation']);
    const draft = new DraftTurn(fire); draft.arm(tagOf('FireStarter'));
    expect(armedStep(draft.armedMoves, draft.now, null)).toBe(readingText.pickOwn);
    expect(armedStep(draft.armedMoves, draft.now, parseSq('a2'))).toBe(text.armed);
    draft.arm(tagOf('FireStarter')); draft.arm(tagOf('Curse'));
    expect(armedStep(draft.armedMoves, draft.now, null)).toBe(readingText.pickEnemy);
    draft.arm(tagOf('Curse')); draft.arm(tagOf('Freeze'));
    expect(armedStep(draft.armedMoves, draft.now, null)).toBe(text.armed);
  });

  it('cancel words follow the kind of thing', () => {
    expect(cancelLine('card')).toBe('You cancel the card.');
    expect(cancelLine('power')).toBe('You cancel the power.');
  });

  it('the computer’s power reads in the third person', () => {
    for (const power of Object.values(KINGS).flat() as PowerName[]) {
      expect(opponentLines[power]).toMatch(/computer/);
      expect(opponentLines[power]).not.toMatch(/^(Protect|Your|Move|Stop)/);
    }
  });
});

describe('a free action (decision 20)', () => {
  it('offers only the legal next steps', () => {
    expect(freeLine('Freeze', true, true)).toBe('Move a piece, or end with Freeze.');
    expect(freeLine('Freeze', true, false)).toBe('Select End turn to end with Freeze.');
    expect(freeLine('Ice Wall', false, true)).toBe('Move a piece to keep your king safe.');
    const game = new Game('RNBQKBNR', { ...POWERS_BALANCED, kings: [{ king: 'Frost', power: 'Freeze' }, null] });
    game.load(game.context.fromFen('7k/7p/n7/8/8/8/7P/K7 w - - 0 1'));
    const draft = new DraftTurn(game); draft.arm('freeze'); draft.stage(draft.at(parseSq('a6'), parseSq('a6'))[0]);
    expect(draft.now.free && draft.open && draft.canFinish).toBe(true);
    expect(draft.legal.some(m => !m.pass)).toBe(true);
  });
});

describe('choices at one square (decision 22)', () => {
  it('use short labels and one prompt', () => {
    const game = new Game('RNBQKBNR', { kings: [null, null] });
    game.load(game.context.fromFen('7k/P6p/8/8/8/8/8/K7 w - - 0 1'));
    const promotions = game.legal.filter(m => m.from === parseSq('a7') && m.promo);
    expect(promotions.length).toBeGreaterThan(1);
    expect(choicePrompt(promotions)).toBe(readingText.newPiece);
    for (const move of promotions) expect(choiceLabel(game.pos, move)).toBe(pieces[move.promo!].name);
    expect(choicePrompt([{ from: 1, to: 2, captures: [2] }, { from: 1, to: 2, captures: [], shove: { from: 2, to: 3 } }] as never)).toBe('Capture or push?');
    expect(choiceLabel(game.pos, { from: 4, to: 4, captures: [], power: 'salvation', drop: 7 } as never)).toBe('Archer');
  });
});
