import { createArtLoader } from './art';
import { playFrames, type CollapseTarget, type MomentTarget } from './frame-player';

export type { CollapseTarget, MomentTarget } from './frame-player';
export type Army = 'white' | 'black';
export const pieces = ['archer', 'beast', 'bishop', 'guard', 'knight', 'maester', 'ogre', 'paladin', 'pawn', 'queen', 'rook'] as const;
export const kings = ['flame', 'frost', 'mud', 'shadow', 'spirit', 'stratus'] as const;

type Result = 'finished' | 'not-ready' | 'cancelled';
const load = createArtLoader();
const HOLD = 400, FADE = 250, DISSOLVE = 120;

function frameClock(draw: (elapsed: number) => void) {
  const start = performance.now();
  let frame = requestAnimationFrame(tick);
  function tick(now: number) {
    frame = requestAnimationFrame(tick);
    draw(Math.max(0, now - start));
  }
  return () => cancelAnimationFrame(frame);
}

function play(key: string, target: MomentTarget, collapse: boolean, from?: CollapseTarget['from']) {
  let player: ReturnType<typeof playFrames>, end = 0;
  let stopClock: (() => void) | undefined;
  let resolve!: (result: Result) => void;
  let settled = false;
  const finished = new Promise<Result>(done => { resolve = done; });
  function finish(result: Result) {
    if (settled) return;
    settled = true;
    stopClock?.();
    stopClock = undefined;
    if (collapse || result !== 'finished') remove();
    resolve(result);
  }
  function remove() {
    player?.remove();
    player = null;
  }
  function skip() {
    if (settled) return;
    if (!collapse && !player) { finish('not-ready'); return; }
    if (player && !collapse) player.draw(end);
    const pending = !player;
    finish('finished');
    if (pending) target.onReady?.();
  }

  if (collapse && target.motion === 'reduce') skip();
  else void load(key).then(pack => {
    if (settled) return;
    player = playFrames(target, pack);
    if (!player) { finish('not-ready'); return; }
    end = pack.bank.ms;
    if (target.motion === 'reduce') {
      player.draw(end);
      finish('finished');
      target.onReady?.();
      return;
    }
    const fadeAt = end + HOLD;
    const total = collapse ? fadeAt + FADE : end;
    const draw = (time: number) => {
      if (settled) return;
      const elapsed = Math.min(total, time * (target.motion === 'fast' ? 2 : 1));
      const alpha = collapse ? 1 - Math.max(0, elapsed - fadeAt) / FADE : 1;
      player!.draw(elapsed, alpha, from, from ? Math.min(1, elapsed / DISSOLVE) : 1);
      if (elapsed === total) finish('finished');
    };
    draw(0);
    target.onReady?.();
    if (!settled) {
      const stop = (target.clock ?? frameClock)(draw);
      if (settled) stop();
      else stopClock = stop;
    }
  }).catch(() => finish('not-ready'));

  return { finished, skip, dispose() { if (settled) remove(); else finish('cancelled'); } };
}

export function playCollapse(piece: string, army: Army, target: CollapseTarget) {
  const dissolve = piece === 'pawn' || piece === 'bishop' || piece === 'archer';
  return play(`collapse/${piece}/${army}`, target, true, dissolve ? target.from : undefined);
}

export function playBow(king: typeof kings[number], army: Army, target: MomentTarget) {
  return play(`bow/${king}/${army}`, target, false);
}
