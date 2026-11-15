import { expect, it } from 'vitest';
import { Game } from '../../game';
import { POWERS_BALANCED } from '../../rules/rules';
import { A, O, parseSq } from '../../rules/engine';
import { DraftTurn } from './turn';
import { previewMarks } from './marks';
import { effectLines, resultText, stateDescriptions, routeLine, sentence } from './texts';

it('names a power use and its active effect with the turn that ends it', () => {
  const game = new Game('RNBQKBNR', { ...POWERS_BALANCED, kings: [{ king: 'Frost', power: 'Freeze' }, null] });
  game.load(game.context.fromFen('7k/7p/n7/8/8/8/7P/K7 w - - 0 1'));
  const draft = new DraftTurn(game); draft.arm('freeze');
  const [freeze] = draft.at(parseSq('a6'), parseSq('a6')); draft.stage(freeze);
  expect(sentence(game.pos, freeze)).toBe('You use Freeze. The Knight on a6 cannot move on its next turn; it still attacks.');
  expect(sentence(game.pos, freeze, true, true)).toMatch(/^The opponent plays Freeze\. Your Knight on a6/);
  expect(effectLines(draft.position, game.context)).toEqual(['Frozen: the computer’s Knight on a6 cannot move on the computer’s next turn.']);
  draft.commit();
  expect(effectLines(game.pos, game.context)).toEqual(['Frozen: the computer’s Knight on a6 cannot move on this turn.']);
});

it('uses the approved opponent form and correct articles for changed types', () => {
  const game = new Game('RNBQKBNR'); game.load(game.context.fromFen('7k/8/8/8/8/8/8/KANO4 w - - 0 1'));
  for (const [from, name] of [[1, 'Archer'], [2, 'Knight'], [3, 'Ogre']] as const) {
    expect(sentence(game.pos, { from, to: from + 8, captures: [] }, true)).toBe(`The opponent's ${name} moves from ${['', 'b1', 'c1', 'd1'][from]} to ${['', 'b2', 'c2', 'd2'][from]}.`);
  }
  expect(sentence(game.pos, { from: 4, to: 4, captures: [], power: 'salvation', drop: A })).toBe('You use Salvation. Your lost Archer returns on e1.');
  expect(sentence(game.pos, { from: 1, to: 9, captures: [], promo: O })).toContain('becomes an Ogre');
  expect(sentence(game.pos, { from: 1, to: 1, captures: [], power: 'morph', promo: O })).toContain('becomes an Ogre');
});

it('names every Holy Light square and the king that protects it in text and square descriptions', () => {
  const game = new Game('RNBQKBNR', { ...POWERS_BALANCED, kings: [{ king: 'Spirit', power: 'HolyLight' }, null] });
  game.load(game.context.fromFen('7k/7p/8/8/3P4/2PKP3/3P4/8 w - - 0 1'));
  const descriptions = stateDescriptions(game.context, game.pos);
  for (const square of ['d2', 'c3', 'e3', 'd4']) {
    expect(descriptions).toContainEqual({ squares: [parseSq(square)], line: `Holy Light: your Pawn on ${square} cannot be captured while beside the King on d3.` });
  }
  expect(effectLines(game.pos, game.context)).toEqual(descriptions.map(d => d.line));
  const moved = game.context.legalMoves(game.pos).find(m => m.from === parseSq('d4') && m.to === parseSq('d5'))!;
  expect(effectLines(game.context.makeMove(game.pos, moved), game.context).join(' ')).not.toContain('Pawn on d5');
});

it('names the check source and king on both squares, then clears the text when safe', () => {
  const game = new Game('RNBQKBNR', { ...POWERS_BALANCED, kings: [null, null] });
  game.load(game.context.fromFen('7k/7p/8/8/8/8/r7/K7 w - - 0 1'));
  expect(stateDescriptions(game.context, game.pos)).toEqual([{ squares: [parseSq('a2'), parseSq('a1')], line: 'Check: the computer’s Rook on a2 attacks your King on a1.' }]);
  const move = game.legal.find(m => m.from === parseSq('a1') && m.to === parseSq('b1'))!;
  expect(effectLines(game.context.makeMove(game.pos, move), game.context)).toEqual([]);
});

it('describes both drawn Haste steps, then only the remaining step', () => {
  const game = new Game('RNBQKBNR', { ...POWERS_BALANCED, kings: [{ king: 'Flame', power: 'Haste' }, null] });
  game.load(game.context.fromFen('7k/7p/8/8/8/8/7P/KN6 w - - 0 1'));
  const moves = game.legal.filter(m => m.power === 'haste' && m.from === parseSq('b1'));
  expect(routeLine(previewMarks(game.context, game.pos, moves, parseSq('c3')))).toBe('Candidate Haste route. Step 1: c3. Step 2: d5. The second move is optional.');
  const first = moves.find(m => m.to === parseSq('c3'))!, after = game.context.makeMove(game.pos, first);
  expect(routeLine(previewMarks(game.context, after, game.context.legalMoves(after).filter(m => !m.pass), parseSq('d5')))).toBe('Candidate Haste route. Step 2: d5. The second move is optional.');
});

it('special actions use the exact result forms for both mover sides', async () => {
  const { diagramFor } = await import('./learning');
  const { L, K, M, O } = await import('../../rules/engine');
  for (const [type, expected] of [
    [A, 'Your Archer stays on c2 and shoots the Pawn on c4.'],
    [O, 'The Pawn moves to c4 and your Ogre ends on c3.'],
    [M, 'Your Maester ends on c3 and your Rook ends on b2.'],
    [L, 'Your Paladin captures the Knight on d4; both leave the board.'],
  ] as const) {
    const frame = diagramFor({ kind: 'piece', type }).frames[0]; expect(sentence(frame.before, frame.move!)).toBe(expected);
    const dark = diagramFor({ kind: 'piece', type }, 1).frames[0];
    expect(sentence(dark.before, dark.move!, true)).toContain(type === O ? "the opponent's Ogre" : "The opponent's");
  }
  const death = diagramFor({ kind: 'power', id: 'DeathTouch' }).frames[0];
  expect(sentence(death.before, death.move!)).toBe('Your King stays on c2 and captures the Pawn on c4.');
  expect(death.before.board[death.move!.from]).toBe(K);
});
it('all released card effects name their real result and Mirror names the copied effect', async () => {
  const { diagramFor } = await import('./learning');
  const { RELEASED_CARDS } = await import('../../content/cards');
  const facts: Record<string, string> = {
    Freeze: 'The Knight on c4 cannot move', IceWall: 'Your Archer on c3 cannot be captured', Strike: 'Your Guard moves from b2 to d4',
    Haste: 'Your Knight moves from b1 to c3', Flight: 'Your Ogre moves from c5 to b2', Sacrifice: 'Your Pawn on c3 leaves and your lost Rook returns on c3',
    March: 'Your Pawn moves from c3 to c5', Leap: 'Your Rook moves from b1 to b4', Salvation: 'Your lost Bishop returns on c1',
    MirrorB: 'Mirror as Freeze', Firewall: 'Your pieces cannot be captured', EarthQuake: 'The Guard on d3 moves to e3; The Pawn on c4 moves to c5',
    Burn: 'Your Archer captures the Pawn on d4 and ends on d4', FireStarter: 'Your Ogre captures the Rook on b8 and ends on b8',
    Control: 'Your Ogre moves from b2 to b4', Rally: 'Your Pawn moves from b2 to b3', MorphP: 'The Pawn on c3 becomes a Knight and stays on c3',
    Mimic: 'Your Ogre moves from b2 to c4', Vault: 'Your Rook moves from b1 to b4', Curse: "The opponent's Knight moves from c3 to d4", SkyLift: 'Your Archer ends on d4 and your Ogre ends on b2',
  };
  for (const card of RELEASED_CARDS) {
    const frame = diagramFor({ kind: 'card', id: card.id }).frames[0];
    expect(sentence(frame.before, frame.move!, false, true), card.id).toContain(facts[card.id]);
  }
});
it('Beast continuation text follows a legal stop and the last capture', async () => {
  const { biteLine } = await import('./texts');
  const game = new Game('RNBQKBNR');
  expect(biteLine(game.pos, parseSq('c5'), true)).toBe('Your Beast captures on c5; another adjacent capture is optional.');
  expect(biteLine(game.pos, parseSq('c5'))).toBe('Your Beast captures on c5.');
});
it('effect ends follow the marked piece through movement, capture and held turns', async () => {
  const { effectEndLines } = await import('./texts');
  const { diagramFor } = await import('./learning');
  const demo = diagramFor({ kind: 'power', id: 'Freeze' }), mark = demo.frames[0];
  const first = demo.rules.makeMove(mark.after, demo.rules.legalMoves(mark.after).find(m => !m.pass)!);
  const reply = demo.rules.legalMoves(first).find(m => !m.power && !m.pass)!;
  const after = demo.rules.makeMove(first, reply);
  expect(effectEndLines(demo.rules, first, reply, after)).toEqual(["Freeze ends; the opponent's Knight can move again."]);
  const captured = { from: parseSq('c2'), to: parseSq('c4'), captures: [parseSq('c4')] };
  expect(effectEndLines(demo.rules, first, captured, demo.rules.makeMove(first, captured)).join(' ')).toContain("Knight on c4 leaves the board");
  const ward = diagramFor({ kind: 'power', id: 'IceWall' }), wall = ward.frames[0].after;
  const move = ward.rules.legalMoves(wall).find(m => m.from === parseSq('c3') && m.to === parseSq('c2'))!;
  expect(effectEndLines(ward.rules, wall, move, ward.rules.makeMove(wall, move))).toEqual([]);
  const zero = { ...first, marks: [{ sq: parseSq('c4'), left: 0 }, undefined] as const };
  expect(effectEndLines(demo.rules, zero, reply, after)).toEqual([]);
});
it('required, optional and absent Beast continuations use the real draft', async () => {
 const { draftSentences } = await import('./texts');
 const game = new Game('RNBQKBNR');game.load(game.context.fromFen('7k/7p/5p2/4p3/3S4/8/8/K7 w - - 0 1'));
 const draft=new DraftTurn(game);draft.bite(parseSq('d4'),parseSq('e5'));
 expect(draftSentences(draft).at(-1)).toBe('Your Beast captures on e5; another adjacent capture is optional.');
 draft.bite(parseSq('d4'),parseSq('f6'));expect(draftSentences(draft).at(-1)).toBe('Your Beast captures on f6.');
 const required=new Game('RNBQKBNR');required.load(required.context.fromFen('7k/7p/8/r7/1p6/S7/8/K7 w - - 0 1'));
 const chain=new DraftTurn(required);chain.bite(parseSq('a3'),parseSq('b4'));expect(chain.canFinish).toBe(false);expect(draftSentences(chain).at(-1)).toBe('Your Beast captures on b4.');
});
it('a protected piece keeps its mark through a swap and a push', async () => {
 const {diagramFor}=await import('./learning');const {effectEndLines}=await import('./texts');const {GameRules}=await import('../../game-rules');const {M,O}=await import('../../rules/engine');
 for(const type of [M,O] as const){const demo=diagramFor({kind:'piece',type}),frame=demo.frames[0],rules=new GameRules({...POWERS_BALANCED,kings:[{king:'Frost',power:'IceWall'},null]});
  const sq=frame.move!.shove?.from??frame.move!.to,before={...frame.before,marks:[{sq},undefined] as const};const after=rules.makeMove(before,frame.move!);
  expect(effectEndLines(rules,before,frame.move!,after)).toEqual([]);expect(after.marks![0]!.sq).toBe(frame.move!.shove?.to??frame.move!.from);
 }
});
it('Haste holds an effect until the pass for either viewer side', async () => {
 const {diagramFor}=await import('./learning');const {effectEndLines}=await import('./texts');const {GameRules}=await import('../../game-rules');const {R,piece}=await import('../../rules/engine');
 for(const side of [0,1] as const){const demo=diagramFor({kind:'power',id:'Haste'},side),kings=[...demo.rules.rules.kings] as [typeof demo.rules.rules.kings[0],typeof demo.rules.rules.kings[1]];kings[side^1]={king:'Frost',power:'IceWall'};
  const rules=new GameRules({...demo.rules.rules,kings}),sq=parseSq(side?'c4':'c5'),before=structuredClone(demo.frames[0].before);before.board[sq]=piece(R,(side^1) as 0|1);before.marks=side?[{sq},undefined]:[undefined,{sq}];
  const move=rules.legalMoves(before).find(m=>m.power==='haste'&&m.from===demo.frames[0].move!.from&&m.to===demo.frames[0].move!.to)!;const held=rules.makeMove(before,move);
  expect(effectEndLines(rules,before,move,held,side)).toEqual([]);const pass=rules.legalMoves(held).find(m=>m.pass)!;expect(pass).toBeTruthy();expect(effectEndLines(rules,held,pass,rules.makeMove(held,pass),side)).toEqual([`Ice Wall ends for the opponent's Rook on ${side?'c4':'c5'}.`]);
 }
});

it('ownership, check and result text follow a Dark player; the Light default stays', () => {
  const game = new Game('RNBQKBNR', { ...POWERS_BALANCED, kings: [null, { king: 'Frost', power: 'Freeze' }] });
  game.load(game.context.fromFen('k7/p7/8/8/8/N7/7P/7K b - - 0 1'));
  const draft = new DraftTurn(game); draft.arm('freeze');
  const [freeze] = draft.at(parseSq('a3'), parseSq('a3')); draft.stage(freeze);
  expect(sentence(game.pos, freeze)).toBe('You use Freeze. The Knight on a3 cannot move on its next turn; it still attacks.');
  expect(effectLines(draft.position, game.context, 1)).toEqual(['Frozen: the computer’s Knight on a3 cannot move on the computer’s next turn.']);
  expect(effectLines(draft.position, game.context)).toEqual(['Frozen: your Knight on a3 cannot move on your next turn.']);
  const check = new Game('RNBQKBNR', { ...POWERS_BALANCED, kings: [null, null] });
  check.load(check.context.fromFen('k7/R7/8/8/8/8/8/7K b - - 0 1'));
  expect(stateDescriptions(check.context, check.pos, 1)).toEqual([{ squares: [parseSq('a7'), parseSq('a8')], line: 'Check: the computer’s Rook on a7 attacks your King on a8.' }]);
  expect(resultText('checkmate', false, 0, 1).title).toBe('You win');
  expect(resultText('checkmate', false, 1, 1).title).toBe('The computer wins');
  expect(resultText('playing', true, 1, 1)).toEqual({ title: 'The computer wins', cause: 'You resign.' });
  expect(resultText('checkmate', false, 1).title).toBe('You win');
});
