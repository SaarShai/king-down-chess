import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { Game } from '../../game';
import { lastReplySteps, replayController, undoReplayState } from './replay';
import type { Board } from '../board-api';
import { POWERS_BALANCED } from '../../rules/rules';
it('last reply contains the whole turn and survives resume', () => {
  const game = new Game('RNBQKBNR', { ...POWERS_BALANCED, kings: [null, { king: 'Frost', power: 'Freeze' }] });
  game.play(game.legal.find(m => !m.power)!); game.play(game.legal.find(m => m.power === 'freeze')!); game.play(game.legal.find(m => !m.pass)!);
  expect(lastReplySteps(game)).toHaveLength(2); expect(lastReplySteps(game)[0].move.power).toBe('freeze');
  const copy = new Game('RNBQKBNR', game.rules); copy.playLan(game.history.map(h => h.lan));
  expect(lastReplySteps(copy)).toEqual(lastReplySteps(game));
});
it('replay changes only the board and restores the live draft', async () => {
  const game = new Game('RNBQKBNR'); game.play(game.legal[0]); game.play(game.legal[0]);
  const history = structuredClone(game.history), position = game.pos, calls: unknown[] = [];
  const board = { setPosition: (p: unknown) => calls.push(p), play: async (m: unknown) => { calls.push(m); }, skip() {} } as unknown as Board;
  await replayController().play(lastReplySteps(game), board, game.context, () => true, () => calls.push('restore'), () => {});
  expect(calls.at(-1)).toBe('restore'); expect(calls).toHaveLength(3);
  expect(game.history).toEqual(history); expect(game.pos).toBe(position);
});
it('cancelled replay cannot restore an old game', async () => {
  const game = new Game('RNBQKBNR'); game.play(game.legal[0]); game.play(game.legal[0]);
  let resolve = () => {}, restores = 0;
  const board = { setPosition() {}, play: () => new Promise<void>(done => { resolve = done; }), skip() {} } as unknown as Board;
  const replay = replayController(), playing = replay.play(lastReplySteps(game), board, game.context, () => true, () => { restores++; }, () => {});
  expect(replay.running).toBe(true); replay.cancel(); expect(restores).toBe(1);
  resolve(); await playing; expect(restores).toBe(1); expect(replay.running).toBe(false);
});
it('held replies keep both Haste and Rally steps and the final pass', async () => {
 const {diagramFor}=await import('./learning');
 for(const subject of [{kind:'power',id:'Haste'},{kind:'card',id:'Rally'},{kind:'power',id:'Freeze'}] as const){
  const demo=diagramFor(subject,1),game=new Game('RNBQKBNR',demo.rules.rules);game.load(demo.frames[0].before);
  for(const frame of demo.frames)game.play(frame.move!);
  if(game.pos.turn===1)game.play(game.legal.find(m=>m.pass)!);
  const frames=lastReplySteps(game);expect(frames).toHaveLength(demo.frames.length+(subject.id==='Freeze'?1:0));
  expect(frames.at(-1)!.after).toEqual(game.pos);
 }
});

it('the finish button is off before a reply, then Replay, Undo, and Replay after Undo', async () => {
  const { DraftTurn } = await import('./turn');
  const game = new Game('RNBQKBNR');
  expect(undoReplayState(0, lastReplySteps(game).length)).toEqual({ replay: false, enabled: false });
  game.play(game.legal[0]); game.play(game.legal[0]);
  const draft = new DraftTurn(game), reply = lastReplySteps(game).length;
  expect(undoReplayState(draft.length, reply)).toEqual({ replay: true, enabled: true });
  draft.stage(game.legal[0]);
  expect(undoReplayState(draft.length, reply)).toEqual({ replay: false, enabled: true });
  draft.undo();
  expect(undoReplayState(draft.length, reply)).toEqual({ replay: true, enabled: true });
  expect(undoReplayState(1, reply, true).enabled).toBe(false);
  expect(undoReplayState(0, reply, true).enabled).toBe(false);
});

it('fault 3: Motion Off cancels a running Replay; its later step does not play and the draft returns', async () => {
  const game = new Game('RNBQKBNR'); game.play(game.legal[0]); game.play(game.legal[0]);
  const step = lastReplySteps(game)[0], plays: unknown[] = []; let end = () => {}, restores = 0;
  const board = { setPosition() {}, play: (move: unknown) => { plays.push(move); return new Promise<void>(done => { end = done; }); }, skip() { end(); } } as unknown as Board;
  const replay = replayController(), playing = replay.play([step, step], board, game.context, () => true, () => { restores++; }, () => {});
  replay.cancel(); await playing;
  expect(plays).toHaveLength(1); expect(restores).toBe(1); expect(replay.running).toBe(false);
  // The game page wires it: the effective motion (Motion, system Reduce Motion or Symbols) going Off cancels the Replay.
  const main = readFileSync('src/interface/play/main.ts', 'utf8'), at = main.indexOf('function setMotion() {');
  const setMotion = main.slice(at, main.indexOf('\n}\n', at));
  expect(setMotion).toContain("const pace = reduce || pieceView === 'symbols' ? 'off' : motion;");
  expect(setMotion).toContain('board?.setMotion(pace);');
  expect(setMotion).toContain("if (pace === 'off') boardReplay.cancel();");
});
