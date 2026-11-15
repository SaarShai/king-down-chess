import { expect, it } from 'vitest';
import { GameRules } from '../../game-rules';
import { POWERS_BALANCED, type Rules } from '../../rules/rules';
import { G, parseSq, type Move } from '../../rules/engine';
import { PLAIN as C } from '../../render/plain-marks';
import { actorMarks, mergeMarks, previewMarks, resultMarks, stateMarks } from './marks';

const sq = parseSq;
function fixture(fen: string, over: Partial<Rules> = {}) {
  const rules = new GameRules({ ...POWERS_BALANCED, kings: [null, null], ...over }), pos = rules.fromFen(fen);
  const move = (from: string, to: string, match: (m: Move) => boolean = () => true) => {
    const m = rules.legalMoves(pos).find(m => m.from === sq(from) && (m.shove?.from ?? (m.from === m.to && m.captures.length ? m.captures[0] : m.to)) === sq(to) && match(m));
    expect(m, `${from} to ${to}`).toBeTruthy(); return m!;
  };
  return { rules, pos, move };
}
it('Move: every legal square has a ring; focus has the path and wider ring', () => {
  const f = fixture('7k/7p/8/8/8/8/4P3/K7 w - - 0 1'), moves = f.rules.legalMoves(f.pos).filter(m => m.from === sq('e2'));
  const p = previewMarks(f.rules, f.pos, moves, sq('e4'));
  expect(p.rings).toEqual(expect.arrayContaining([expect.objectContaining({ square: sq('e2'), role: 'actor', color: C.actor, width: 1.1, size: 1.12 }), expect.objectContaining({ square: sq('e4'), role: 'focus', width: 1.25, size: .78 }), expect.objectContaining({ square: sq('e3'), width: .9 })]));
  expect(p.paths).toEqual([{ squares: [sq('e2'), sq('e4')], color: C.move }]);
});
it('Capture: the target uses Enemy; the result keeps a trail and a foot ring', () => {
  const f = fixture('7k/7p/8/8/8/3p4/4P3/K7 w - - 0 1'), m = f.move('e2','d3');
  expect(previewMarks(f.rules,f.pos,[m]).rings[0]).toMatchObject({ color:C.enemy, size:1.12 });
  const p = resultMarks(f.rules.makeMove(f.pos,m),[{before:f.pos,move:m}]);
  expect(p.rings).toEqual(expect.arrayContaining([expect.objectContaining({square:sq('e2'),role:'trail',dash:[4,5]}),expect.objectContaining({square:sq('d3'),color:C.last})]));
});
it('Archer: the shot arcs to the enemy, then marks the empty square while the actor stays', () => {
  const f=fixture('7k/7p/8/8/3p4/3P4/3A4/K7 w - - 0 1'),m=f.move('d2','d4',m=>m.from===m.to);
  expect(previewMarks(f.rules,f.pos,[m]).paths).toEqual([{squares:[sq('d2'),sq('d4')],color:C.enemy,arc:true,dash:[2,7]}]);
  const after=f.rules.makeMove(f.pos,m); expect(after.board[sq('d2')]).toBeTruthy();
  expect(resultMarks(after,[{before:f.pos,move:m}]).rings[0]).toMatchObject({square:sq('d4'),color:C.last,dash:[3,4],size:.78});
});
it('Ogre: the push starts at the victim and ends at the dashed landing', () => {
  const f=fixture('7k/7p/8/4p3/3O4/8/8/K7 w - - 0 1'),m=f.move('d4','e5',m=>!!m.shove),p=previewMarks(f.rules,f.pos,[m]);
  expect(p.paths).toEqual([{squares:[sq('e5'),sq('f6')],color:C.enemy}]);
  expect(p.rings).toContainEqual(expect.objectContaining({square:sq('f6'),role:'landing',dash:[5,5]}));
  expect(resultMarks(f.rules.makeMove(f.pos,m),[{before:f.pos,move:m}]).rings).toContainEqual(expect.objectContaining({square:sq('f6'),color:C.enemy}));
});
it('Maester: the swap has two Friend heads and two Friend result rings', () => {
  const f=fixture('7k/7p/8/8/3MP3/8/8/K7 w - - 0 1'),m=f.move('d4','e4',m=>!!m.swap);
  expect(previewMarks(f.rules,f.pos,[m]).paths).toEqual([{squares:[sq('d4'),sq('e4')],color:C.friend},{squares:[sq('e4'),sq('d4')],color:C.friend}]);
  expect(resultMarks(f.rules.makeMove(f.pos,m),[{before:f.pos,move:m}]).rings.map(r=>r.color)).toEqual([C.friend,C.friend]);
});
it.each([['Freeze','freeze','a6'],['IceWall','ward','a2']] as const)('%s: targets and lasting state use Ice; expired state has no ring', (power,tag,target) => {
  const f=fixture('7k/7p/n7/8/8/8/P7/K7 w - - 0 1',{kings:[{king:'Frost',power},null]}),m=f.rules.legalMoves(f.pos).find(m=>m.power===tag&&m.from===sq(target))!;
  expect(m).toBeTruthy(); expect(previewMarks(f.rules,f.pos,[m]).rings).toEqual([expect.objectContaining({color:C.ice})]);
  const after=f.rules.makeMove(f.pos,m);expect(stateMarks(f.rules,after).rings).toContainEqual(expect.objectContaining({square:sq(target),color:C.ice,width:1.25}));
  const ended={...after,marks:undefined}; expect(stateMarks(f.rules,ended).rings).toEqual([]);
});
it('Haste: one route has two steps; after the first step only number 2 remains', () => {
  const f=fixture('7k/7p/8/8/8/8/7P/KN6 w - - 0 1',{kings:[{king:'Flame',power:'Haste'},null]}),m=f.move('b1','c3',m=>m.power==='haste');
  const p=previewMarks(f.rules,f.pos,[m]); expect(p.steps.map(s=>s.number)).toEqual([1,2]); expect(p.paths[0].squares).toHaveLength(3); expect(p.rings).toContainEqual(expect.objectContaining({dash:[5,5]}));
  const after=f.rules.makeMove(f.pos,m),next=f.rules.legalMoves(after).filter(m=>!m.pass);
  expect(previewMarks(f.rules,after,next).steps.map(s=>s.number)).toEqual([2]);
  const second=next.find(m=>m.from===sq('c3')&&m.to===sq('d5'))!;
  const result=resultMarks(f.rules.makeMove(after,second),[{before:f.pos,move:m},{before:after,move:second}]);
  expect(result.rings.filter(r=>r.square===sq('c3')).map(r=>r.dash)).toEqual([[4,5]]);
});
it('Check: the attacker path and king ring remain until the king is safe', () => {
  const f=fixture('7k/7p/8/8/8/8/r7/K7 w - - 0 1'),p=stateMarks(f.rules,f.pos);
  expect(p.paths).toContainEqual({squares:[sq('a2'),sq('a1')],color:C.enemy});expect(p.rings).toContainEqual(expect.objectContaining({square:sq('a1'),width:1.25}));
  const m=f.move('a1','b1');expect(stateMarks(f.rules,f.rules.makeMove(f.pos,m)).paths).toEqual([]);
});
it('Last move: the route and result remain independent of a new selection', () => {
  const f=fixture('7k/7p/8/8/8/8/P7/K7 w - - 0 1'),m=f.move('a2','a3'),after=f.rules.makeMove(f.pos,m),actions=[{before:f.pos,move:m}];
  const p=resultMarks(after,actions);previewMarks(f.rules,after,[]);expect(resultMarks(after,actions)).toEqual(p);expect(p.paths[0].squares).toEqual([sq('a2'),sq('a3')]);
});
it('Beast: the route uses all captures, then only the remaining targets', () => {
  const f=fixture('7k/7p/5p2/4p3/3S4/8/8/K7 w - - 0 1'),m=f.rules.legalMoves(f.pos).find(m=>m.captures.length===2)!;
  expect(m).toBeTruthy();const p=previewMarks(f.rules,f.pos,[m]);expect(p.paths[0]).toEqual({squares:[sq('d4'),sq('e5'),sq('f6')],color:C.enemy});
  expect(p.rings).toContainEqual(expect.objectContaining({square:sq('f6'),dash:[5,5]}));
  expect(previewMarks(f.rules,f.pos,[m],sq('f6'),[sq('e5')]).paths[0].squares).toEqual([sq('e5'),sq('f6')]);
  expect(resultMarks(f.rules.makeMove(f.pos,m),[{before:f.pos,move:m}]).rings.filter(r=>r.role==='trail').map(r=>r.square)).toEqual([sq('d4'),sq('e5')]);
});
it('Paladin: the route uses a dashed arc', () => {
  const f=fixture('7k/7p/8/8/8/8/3P4/K2L4 w - - 0 1'),m=f.move('d1','d3');
  expect(previewMarks(f.rules,f.pos,[m]).paths[0]).toMatchObject({arc:true,dash:[2,7],color:C.move});
});
it('Guard: the drop has no actor ring and uses Holy before and after', () => {
  const f=fixture('7k/7p/8/8/8/8/P7/K7 w - - 0 1 g1.0',{guardReserve:'any'}),m=f.rules.legalMoves(f.pos).find(m=>m.drop===G)!;
  expect(m).toBeTruthy();const p=previewMarks(f.rules,f.pos,[m]);expect(p.rings).toHaveLength(1);expect(p.rings[0]).toMatchObject({color:C.holy});
  expect(stateMarks(f.rules,f.rules.makeMove(f.pos,m)).rings).toContainEqual(expect.objectContaining({square:m.to,color:C.holy,width:1.25}));
});
it('Flight: every legal empty destination gets a Move ring', () => {
  const f=fixture('7k/7p/8/8/8/8/P7/K7 w - - 0 1',{kings:[{king:'Stratus',power:'Flight'},null]}),moves=f.rules.legalMoves(f.pos).filter(m=>m.power==='flight'&&m.from===sq('a2'));
  expect(moves.length).toBeGreaterThan(10);const p=previewMarks(f.rules,f.pos,moves);expect(p.rings.filter(r=>r.role!=='actor')).toHaveLength(moves.length);expect(p.rings.filter(r=>r.role!=='actor').every(r=>r.color===C.move&&r.size===.78)).toBe(true);
});
it('Death Touch: the king stays, the Shadow path ends at the enemy, then a dashed ring stays', () => {
  const f=fixture('7k/7p/8/8/8/8/1n6/K7 w - - 0 1',{kings:[{king:'Shadow',power:'DeathTouch'},null]}),m=f.move('a1','b2',m=>m.from===m.to);
  expect(previewMarks(f.rules,f.pos,[m]).paths[0]).toEqual({squares:[sq('a1'),sq('b2')],color:C.shadow});
  expect(resultMarks(f.rules.makeMove(f.pos,m),[{before:f.pos,move:m}]).rings[0]).toMatchObject({square:sq('b2'),dash:[3,4]});
});
it('Darkness: diagonal steps use Move and a straight capture uses Shadow', () => {
  const f=fixture('7k/7p/8/8/8/4n3/4P3/K7 w - - 0 1',{kings:[{king:'Shadow',power:'Darkness'},null]}),moves=f.rules.legalMoves(f.pos).filter(m=>m.from===sq('e2')),p=previewMarks(f.rules,f.pos,moves,sq('e3'));
  expect(p.rings).toContainEqual(expect.objectContaining({square:sq('e3'),color:C.shadow}));expect(p.rings).toContainEqual(expect.objectContaining({square:sq('d3'),color:C.move}));
});
it('Holy Light: the four own neighbours use Holy with no diagonal or wrapped file', () => {
  const f=fixture('7k/7p/8/8/3P4/2PKP3/3P4/8 w - - 0 1',{kings:[{king:'Spirit',power:'HolyLight'},null]});
  expect(stateMarks(f.rules,f.pos).rings.filter(r=>r.color===C.holy).map(r=>r.square).sort((a,b)=>a-b)).toEqual(['d2','c3','e3','d4'].map(sq).sort((a,b)=>a-b));
});
it('Burn: the card target is Ember; the result has a dashed Ember ring', () => {
  const f=fixture('7k/7p/8/8/3p4/8/3N4/K7 w - - 0 1',{hands:[['Burn'],[]]}),m=f.move('d2','d4',m=>m.power==='burn');
  expect(previewMarks(f.rules,f.pos,[m]).rings[0]).toMatchObject({color:C.ember});expect(resultMarks(f.rules.makeMove(f.pos,m),[{before:f.pos,move:m}]).rings).toContainEqual(expect.objectContaining({square:sq('d4'),color:C.ember,dash:[3,4]}));
});
it('does not put undefined squares in a finished chain or draw a pass result', () => {
  const f=fixture('7k/7p/8/8/8/8/P7/K7 w - - 0 1');expect(previewMarks(f.rules,f.pos,[]).rings).toEqual([]);expect(resultMarks(f.pos,[{before:f.pos,move:{from:8,to:8,captures:[],pass:true}}])).toEqual({rings:[],paths:[],steps:[]});
});

it('Guard: the standing Guard keeps a large Holy ring', () => { const f=fixture('7k/7p/8/8/3G4/8/8/K7 w - - 0 1'); expect(stateMarks(f.rules,f.pos).rings).toContainEqual(expect.objectContaining({square:sq('d4'),color:C.holy,width:1.25,role:'state'})); });
it('an armed move marks only pieces that can act until the player chooses one', () => {
  const f=fixture('7k/7p/8/8/8/8/P7/K7 w - - 0 1',{kings:[{king:'Stratus',power:'Flight'},null]});
  const moves=f.rules.legalMoves(f.pos).filter(m=>m.power==='flight'),p=actorMarks(f.pos,moves,sq('a2'));
  expect(p.paths).toEqual([]);expect(p.rings).toEqual([expect.objectContaining({square:sq('a2'),color:C.move,role:'focus',width:1.25})]);
});
it('keeps the chosen ring visible above the same piece protection ring without changing the inputs', () => {
  const f=fixture('7k/7p/8/8/3P4/2PKP3/3P4/8 w - - 0 1',{kings:[{king:'Spirit',power:'HolyLight'},null]});
  const moves=f.rules.legalMoves(f.pos).filter(m=>m.from===sq('d4')),preview=previewMarks(f.rules,f.pos,moves),state=stateMarks(f.rules,f.pos),before=structuredClone(preview);
  const merged=mergeMarks(preview,state);expect(merged.rings.at(-1)).toMatchObject({square:sq('d4'),role:'actor',color:C.actor});expect(preview).toEqual(before);
});
it('shows a chosen piece with no action, but keeps the Guard exception', () => {
  const f=fixture('7k/7p/8/8/8/P7/P7/K7 w - - 0 1');
  expect(previewMarks(f.rules,f.pos,[],undefined,[],sq('a2')).rings).toEqual([expect.objectContaining({square:sq('a2'),color:C.actor,role:'actor'})]);
  const guard=fixture('7k/7p/8/8/3G4/8/8/K7 w - - 0 1');expect(previewMarks(guard.rules,guard.pos,[],undefined,[],sq('d4')).rings).toEqual([]);
});

it.each([
  ['IceWall', 'ward', 'a2', 'a2', 'a3', '7k/7p/n7/8/8/8/P7/K7 w - - 0 1', ['a3']],
  ['Freeze', 'freeze', 'a6', 'a5', 'a6', '7k/7p/n7/R7/8/8/P7/K7 w - - 0 1', []],
] as const)('%s: merged results follow the marked piece and remove a captured mark', (power, tag, target, from, to, fen, expected) => {
  const f = fixture(fen, { kings: [{ king: 'Frost', power }, null] });
  const first = f.rules.legalMoves(f.pos).find(m => m.power === tag && m.from === sq(target))!;
  expect(first).toBeTruthy();
  const marked = f.rules.makeMove(f.pos, first);
  const second = f.rules.legalMoves(marked).find(m => !m.power && m.from === sq(from) && m.to === sq(to))!;
  expect(second).toBeTruthy();
  const after = f.rules.makeMove(marked, second);
  const combined = mergeMarks(resultMarks(after, [{ before: f.pos, move: first }, { before: marked, move: second }]), stateMarks(f.rules, after));
  expect(combined.rings.filter(r => r.color === C.ice).map(r => r.square)).toEqual(expected.map(sq));
  expect(combined.rings).toContainEqual(expect.objectContaining({ square: sq(from), color: C.last, role: 'trail' }));
});
