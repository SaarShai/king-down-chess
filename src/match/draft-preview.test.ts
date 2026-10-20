import { afterEach, expect, it, vi } from 'vitest';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { GameRules } from '../game-rules';
import { toFen } from '../rules/setup';
import { applyLan, committedPreview, draftChoices, draftTurn, previewSteps, sendActions } from '../plugin/screens/board-model';
import { needsServerPreview } from '../account-game/engine-identity';
import { LocalMatch } from './index';
import { GameService } from './service';
import type { View } from './protocol';
import type { PostgresMatchStore } from './store';

const actor = '11111111-1111-4111-8111-111111111111', gameId = '22222222-2222-4222-8222-222222222222';
const engine = 'sha256:bab22e94d4df81591374763a7f3abe703c30534f80ce771ee3fe7e095dcec7da';
afterEach(() => vi.restoreAllMocks());

it('previews an archived Haste prefix when the page calculator deliberately differs, without committing it', async () => {
  const match = new LocalMatch(pathToFileURL(resolve('engines', engine.slice(7) + '.mjs')));
  try {
    await match.initialize({ kings: 'Flame:Haste,none', fen: '7k/p7/8/8/8/8/8/R5K1 w - - 0 1' });
    const snapshot = await match.snapshot(), state = await match.exportSave();
    const game = { id: gameId, revision: 7, engine_fingerprint: engine, status: 'playing', turn: 0, snapshot, state, deadline_at: null, players: [{ seat: 0, user_id: actor }, { seat: 1, user_id: null, computer: true }] };
    const load = vi.fn(async () => game), transaction = vi.fn(), seen = vi.fn(), receipt = vi.fn();
    const service = new GameService({ load, transaction, seen, receipt } as unknown as PostgresMatchStore);
    const page = new GameRules(snapshot.rules), pos = page.fromFen(snapshot.fen);
    vi.spyOn(GameRules.prototype, 'legalMoves').mockReturnValue([]);
    vi.spyOn(GameRules.prototype, 'makeMove').mockImplementation(() => { throw new Error('Divergent page calculator must not enforce this draft'); });
    expect(snapshot.legal).toContain('Ra1-a4!H');
    expect(applyLan(pos, 'Ra1-a4!H', snapshot.rules, snapshot.legal)).toBeUndefined();
    expect(draftChoices({ seat: 0, legal: snapshot.legal, rules: snapshot.rules } as View, pos, [], page)).toEqual([]);
    const before = structuredClone(game);
    const preview = service.previewDraft.bind(service);
    const prefix = await preview(actor, gameId, { expected_revision: 7, engine_fingerprint: engine, actions: ['Ra1-a4!H'] });
    expect(prefix).toMatchObject({ game_id: gameId, revision: 7, engine_fingerprint: engine, actions: ['Ra1-a4!H'] });
    expect(prefix.positions).toHaveLength(2);
    expect(prefix.positions[1]).toMatchObject({ fen: '7k/p7/8/8/R7/8/8/6K1 w - - 1 1 u1.0/ha4', status: 'playing', turn: 0, in_check: false });
    expect(prefix.positions[1].moves.map(move => move.lan)).toEqual(expect.arrayContaining(['Ra4-e4', '--']));
    vi.spyOn(GameRules.prototype, 'status').mockImplementation(() => { throw new Error('Page status differs'); });
    const view = { game_id: gameId, revision: 7, engine_fingerprint: engine, fen: snapshot.fen, seat: 0, legal: snapshot.legal, rules: snapshot.rules } as View;
    const steps = previewSteps(view, prefix, page)!;
    expect(steps).toHaveLength(1);
    expect(draftChoices(view, steps[0].pos, steps, page, prefix.positions[1]).map(choice => choice.lan)).toEqual(expect.arrayContaining(['Ra4-e4', '--']));
    expect(draftTurn(steps, steps[0].pos, 'link', 0, page, prefix.positions[1])).toMatchObject({ ready: true, waits: false, midWay: true });
    expect(sendActions(steps, steps[0].pos, 0, page, prefix.positions[1])).toEqual(['Ra1-a4!H', '--']);
    for (const changed of [{ revision: 8 }, { engine_fingerprint: 'sha256:' + 'a'.repeat(64) }, { game_id: actor }, { fen: 'stale base' }]) expect(previewSteps({ ...view, ...changed }, prefix, page)).toBeUndefined();
    const complete = await preview(actor, gameId, { expected_revision: 7, engine_fingerprint: engine, actions: ['Ra1-a4!H', '--'] });
    expect(complete.positions[2]).toMatchObject({ turn: 1, status: 'playing' });
    const ack = {...view,revision:8,fen:complete.positions[2].fen,turn:1,last_commands:[{seq:8,seat:0,at:'2026-10-20T00:00:00Z',action:{type:'turn',actions:['Ra1-a4!H','--']}}]} as View;
    const committed = committedPreview(view,ack,prefix,page)!;
    expect(committed.map(step=>step.lan)).toEqual(['Ra1-a4!H','--']);
    expect(committed[0].words).toContain('White rook');
    expect(toFen(committed[1].pos)).toBe(ack.fen);
    for (const change of [{revision:9},{engine_fingerprint:'other'},{last_commands:[{...ack.last_commands[0],seat:1}]},{last_commands:[{...ack.last_commands[0],action:{type:'turn',actions:['Ra1-a4!H','Ra4-e4']}}]}]) expect(committedPreview(view,{...ack,...change} as View,prefix,page)).toBeUndefined();
    expect(game).toEqual(before);
    expect(transaction).not.toHaveBeenCalled(); expect(seen).not.toHaveBeenCalled(); expect(receipt).not.toHaveBeenCalled();
    expect(await match.exportSave()).toBe(state);
  } finally { await match.close(); }
});

it('uses local previews only for the exact known page implementation', () => {
  expect(needsServerPreview(engine, engine)).toBe(false);
  expect(needsServerPreview(engine, 'sha256:' + 'a'.repeat(64))).toBe(true);
  expect(needsServerPreview(engine, '')).toBe(true);
  expect(needsServerPreview(undefined, engine)).toBe(true);
});

it.each([
 {name:'card Haste',setup:{fen:'7k/p7/8/8/8/8/8/R5K1 w - - 0 1',hand:['Haste'] as const},first:'Ra1-a4!H',second:'--',offered:'Ra4-e4',ready:true},
 {name:'free Freeze',setup:{fen:'4k3/p7/8/3n4/8/8/P7/4K3 w - - 0 1',kings:'Frost:Freeze,none'},first:'!F:d5',second:'a2-a3',offered:'a2-a3',ready:true},
])('keeps $name continuation in the archived implementation',async test=>{
 const match=new LocalMatch(pathToFileURL(resolve('engines',engine.slice(7)+'.mjs')));
 try {
  await match.initialize(test.setup);
  const snapshot=await match.snapshot(),state=await match.exportSave();
  const game={id:gameId,revision:0,engine_fingerprint:engine,status:'playing',turn:0,state,snapshot,players:[{seat:0,user_id:actor},{seat:1,user_id:null}]};
  const load=vi.fn(async()=>game),service=new GameService({load} as unknown as PostgresMatchStore),input={expected_revision:0,engine_fingerprint:engine,actions:[test.first]};
  const draft=await service.previewDraft(actor,gameId,input),view={game_id:gameId,revision:0,engine_fingerprint:engine,fen:snapshot.fen,seat:0,rules:snapshot.rules,legal:snapshot.legal} as View;
  vi.spyOn(GameRules.prototype,'legalMoves').mockReturnValue([]);
  vi.spyOn(GameRules.prototype,'makeMove').mockImplementation(()=>{throw new Error('Page differs');});
  vi.spyOn(GameRules.prototype,'status').mockImplementation(()=>{throw new Error('Page differs');});
  const page=new GameRules(snapshot.rules),steps=previewSteps(view,draft,page)!,position=draft.positions[1];
  expect(position.moves.map(choice=>choice.lan)).toContain(test.offered);
  expect(draftTurn(steps,steps[0].pos,'link',0,page,position)).toMatchObject({ready:test.ready,waits:false});
  expect(sendActions(steps,steps[0].pos,0,page,position)).toEqual(test.ready?[test.first,'--']:[test.first]);
  const finished=await service.previewDraft(actor,gameId,{...input,actions:[test.first,test.second]});
  expect(finished.positions.at(-1)).toMatchObject({turn:1,status:'playing'});
  expect(await match.exportSave()).toBe(state);
 } finally {await match.close();}
});
