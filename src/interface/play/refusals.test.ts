import { expect, it } from 'vitest';
import { Game } from '../../game';
import { POWERS_BALANCED } from '../../rules/rules';
import { parseSq } from '../../rules/engine';
import { DraftTurn } from './turn';
import { refusalForTap } from './refusals';
const fixture = (fen: string) => { const game = new Game('RNBQKBNR', { kings: [null, null] }); game.load(game.context.fromFen(fen)); return new DraftTurn(game); };
it.each([
 ['7k/7p/8/8/8/8/8/KR6 w - - 0 1', null, 'c4', 'Select one of your pieces first.'],
 ['7k/7p/8/8/8/8/1g6/KR6 w - - 0 1', 'b1', 'b2', 'Only a king can capture the Guard.'],
 ['7k/7p/8/8/8/8/1n6/KG6 w - - 0 1', 'b1', 'b2', 'The Guard cannot capture; choose an empty square.'],
 ['7k/7p/8/8/8/8/1n6/KA6 w - - 0 1', 'b1', 'b2', 'The Archer cannot shoot there: use two squares straight or on a forward diagonal.'],
 ['7k/7p/8/8/8/8/1O6/Kg6 w - - 0 1', 'b2', 'b1', 'The Ogre cannot push off the board; the piece stays.'],
 ['7k/6O1/8/8/8/8/7P/K7 w - - 0 1', 'g7', 'h8', 'The Ogre cannot push a king.'],
 ['7k/7p/8/8/8/8/8/KL6 w - - 0 1', 'b1', 'h8', 'The Paladin cannot capture a king or give check.'],
] as const)('copy-table refusals keep one true cause: %s %s %s', (fen, from, to, reason) => {
 const draft = fixture(fen); expect(refusalForTap(draft, from ? parseSq(from) : null, parseSq(to))).toBe(reason);
});
it('king safety appears only for an unsafe candidate', () => {
 const pinned = fixture('1r5k/7p/8/8/8/8/1R6/1K6 w - - 0 1');
 expect(refusalForTap(pinned, parseSq('b2'), parseSq('c2'))).toBe('Your king is attacked after that action. Choose a safe target.');
 for(let square=0;square<64;square++)expect(refusalForTap(pinned,null,square)).toBe('Select one of your pieces first.');
 const blocked = fixture('7k/7p/8/8/8/8/1P6/KR6 w - - 0 1');
 expect(refusalForTap(blocked, parseSq('b1'), parseSq('b4'))).toBe('The Rook cannot move there: its rank or file must be clear. Tap a ringed target.');
 expect(refusalForTap(blocked, parseSq('b1'), parseSq('b4'))).not.toMatch(/king.*safe/);
});
it('armed and frozen refusals use the current action role', () => {
 const game = new Game('RNBQKBNR', { ...POWERS_BALANCED, kings: [{ king: 'Frost', power: 'Freeze' }, null] });
 const draft = new DraftTurn(game); draft.arm('freeze');
 expect(refusalForTap(draft, null, parseSq('e8'))).toContain('Freeze cannot stop a king');
 expect(refusalForTap(draft, null, parseSq('a2'))).toContain('Freeze needs an enemy');
 const frozen = fixture('7k/7p/8/8/8/8/8/KN6 w - - 0 1');
 frozen.game.load({ ...frozen.now, marks: [undefined, { sq: parseSq('b1') }] });
 const marked = new Game('RNBQKBNR', { ...POWERS_BALANCED, kings: [null, { king: 'Frost', power: 'Freeze' }] }); marked.load(frozen.now);
 expect(refusalForTap(new DraftTurn(marked), parseSq('b1'), parseSq('c3'))).toBe('The Knight cannot move: Freeze ends after its next turn.');
});
it('closed turns and quiet follow-ups give a safe next step', () => {
 const draft=fixture('7k/7p/8/8/8/8/P7/K7 w - - 0 1');draft.stage(draft.at(parseSq('a2'),parseSq('a3'))[0]);
 expect(refusalForTap(draft,parseSq('a2'),parseSq('a4'))).toBe('Your move is ready. Tap End turn, or Undo to change it.');
 const game=new Game('RNBQKBNR',{...POWERS_BALANCED,kings:[{king:'Flame',power:'Haste'},null]});game.load(game.context.fromFen('7k/7p/8/8/3p4/8/8/KN6 w - - 0 1'));
 const haste=new DraftTurn(game);haste.arm('haste');haste.stage(haste.at(parseSq('b1'),parseSq('c3'))[0]);
 expect(refusalForTap(haste,parseSq('c3'),parseSq('d4'))).toBe('This step cannot capture. Tap a ringed empty square, or select End turn.');
});
it('Burn and Mirror do not use an Archer shooting refusal', () => {
 const game=new Game('RNBQKBNR',{...POWERS_BALANCED,kings:[null,null],hands:[['Burn','MirrorB'],[]]});game.load(game.context.fromFen('7k/7p/8/8/3p4/8/1A6/K7 w - - 0 1'));
 const draft=new DraftTurn(game);draft.arm('burn');expect(refusalForTap(draft,parseSq('b2'),parseSq('c3'))).toBe('Burn needs an enemy in its capture zone on a clear queen’s line. Tap a ringed enemy piece.');
 draft.arm('mirrorb');expect(refusalForTap(draft,parseSq('b2'),parseSq('c3'))).toBe('Mirror needs an enemy in its capture zone on a clear queen’s line. Tap a ringed enemy piece.');
 expect(draft.armed).toBe('mirrorb');
 const ogre=new Game('RNBQKBNR',{...POWERS_BALANCED,kings:[null,null],hands:[['Burn'],[]]});ogre.load(ogre.context.fromFen('7k/6O1/8/4p3/8/8/5P2/K7 w - - 0 1'));const armed=new DraftTurn(ogre);armed.arm('burn');
 expect(refusalForTap(armed,parseSq('g7'),parseSq('h8'))).toBe('Burn needs an enemy in its capture zone on a clear queen’s line. Tap a ringed enemy piece.');
});
it('a wrong next bite keeps the chain and its legal continuation', () => {
 const draft=fixture('7k/7p/5p2/4p3/3S4/8/8/K7 w - - 0 1');draft.bite(parseSq('d4'),parseSq('e5'));
 const before=structuredClone(draft.position);expect(refusalForTap(draft,parseSq('d4'),parseSq('g5'))).toBe('Each next Beast step must capture an adjacent enemy. Tap a ringed enemy piece.');expect(draft.position).toEqual(before);expect(draft.targets(parseSq('d4'))).toContain(parseSq('f6'));
});
