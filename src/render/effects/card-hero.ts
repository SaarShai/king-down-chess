import type { PaintedScene } from '../painted/scene.mjs';
import type { CardFrame, CardLayer, Point } from './card-types';
import { drawBurn } from './hero-burn';
import { drawQuake } from './hero-quake';
import { frostStamps, rand, stamp } from './hero-stamps';
export { quakeJolt } from './hero-quake';

const TAU = Math.PI * 2;
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const ease = (t: number) => { t = clamp(t); return t * t * (3 - 2 * t); };

// The Freeze cast. The material itself (materials.ts) starts to grow at 125 ms and holds from 575 ms.
const GATHER_MS = 270, BURST_MS = 235, SHARDS_MS = 560, CAST_MS = BURST_MS + 600;
const MOTES = 16, SHARDS = 20, MIST = 10;

function freezeCast(ctx: CanvasRenderingContext2D, foot: Point, front: boolean, ms: number) {
  if (ms <= 0 || ms >= CAST_MS) return;
  const set = frostStamps(), gather = ms / GATHER_MS, burst = (ms - BURST_MS) / (CAST_MS - BURST_MS);
  const mid = { x: foot.x, y: foot.y - 54 };
  if (!front) {
    // The cold pools on the floor, then the burst throws its mist out along the floor.
    stamp(ctx, set.pool, foot.x, foot.y - 4, .5 + ease(gather) * .5 + ease(burst) * .45, 0, ease(gather) * (1 - ease(burst)) * .95, .42);
    if (gather < 1) for (let i = 0; i < MIST; i++) {
      const a = i / MIST * TAU + rand(i, 3), k = clamp(gather * 1.25 - rand(i, 4) * .25), r = (128 - 92 * ease(k)) * (.85 + rand(i, 5) * .3);
      stamp(ctx, set.mist[i % 3], foot.x + Math.cos(a) * r, foot.y - 4 + Math.sin(a) * r * .46, .42 + rand(i, 6) * .16, i, Math.sin(clamp(k) * Math.PI * .72) * .78, .5);
    }
  }
  if (burst > 0 && burst < 1) for (let i = 0; i < MIST; i++) {
    // The near half of the mist rolls over the boots; the far half stays behind the figure.
    const a = i / MIST * TAU + rand(i, 7), near = Math.sin(a) > 0;
    if (near !== front) continue;
    const k = 1 - (1 - clamp(burst * 1.05 - rand(i, 8) * .05)) ** 2.4, r = (26 + k * 104) * (.82 + rand(i, 9) * .36);
    stamp(ctx, set.mist[i % 3], foot.x + Math.cos(a) * r, foot.y - 6 + Math.sin(a) * r * .46 - k * (8 + rand(i, 10) * 14), .5 + k * (.5 + rand(i, 11) * .25), i * 1.7 + k * .5, ease(burst / .1) * (1 - ease((burst - .22) / .78)) * .9, .62);
  }
  if (!front) return;
  // Hard ice grains draw in from all round the figure and meet at its body.
  if (gather < 1.06) for (let i = 0; i < MOTES; i++) {
    const a = i * 2.399, delay = rand(i, 12) * .3, k = clamp((gather - delay) / (1.06 - delay)), turn = a + ease(k) * 1.5;
    const r = (112 - 100 * ease(k) ** 1.4) * (.8 + rand(i, 13) * .4), alpha = ease(k / .3) * (1 - ease((k - .9) / .1));
    stamp(ctx, set.shards[i % 4], mid.x + Math.cos(turn) * r, mid.y + Math.sin(turn) * r * .8, .34 + rand(i, 14) * .26, turn + Math.PI / 2, alpha);
  }
  // One cold core swells through the gather and is the same light that flashes at the burst.
  const swell = ease((gather - .12) / .88) * (1 - ease((ms - BURST_MS - 20) / 300));
  stamp(ctx, set.cold, mid.x, mid.y, .16 + ease(gather) * .3 + ease((ms - BURST_MS) / 170) * .72, 0, swell * .96);
  const flight = (ms - BURST_MS) / SHARDS_MS;
  if (flight > 0 && flight < 1) for (let i = 0; i < SHARDS; i++) {
    // A shard flies out, loses speed, and falls. It reaches about one tile: it stays local.
    const a = i * 2.399 + rand(i, 15) * .4, reach = (62 + rand(i, 16) * 72) * (1 - (1 - flight) ** 2.2);
    const x = mid.x + Math.cos(a) * reach, y = mid.y + Math.sin(a) * reach * .78 + flight * flight * (34 + rand(i, 17) * 30);
    stamp(ctx, set.shards[i % 4], x, y, (.46 + rand(i, 18) * .6) * (1 - flight * .3), a + Math.PI / 2 + flight * (rand(i, 19) - .5) * 5, ease(flight / .06) * (1 - ease((flight - .62) / .38)));
  }
}

/** The local Freeze release: a gather and a burst on the target. No light leaves the target's neighbourhood. */
export function drawFreezeCast(ctx: CanvasRenderingContext2D, scene: PaintedScene, target: number, layer: CardLayer, row: number | undefined, ms: number) {
  if (layer === 'over' && scene.cell(target).row !== row) return;
  freezeCast(ctx, scene.foot(target), layer === 'over', ms);
}

export const HEROES = new Set(['Burn', 'Freeze', 'EarthQuake']);
export function drawHero(ctx: CanvasRenderingContext2D, scene: PaintedScene, id: string, event: CardFrame, layer: CardLayer) {
  const { t, move } = event;
  if (t <= 0 || t >= 1) return;
  if (id === 'Burn') drawBurn(ctx, scene, event, layer);
  else if (id === 'EarthQuake') drawQuake(ctx, scene, event, layer);
  // A Mirror copy of Freeze: its material starts at t = .57, so the same cast is timed from there.
  else if (id === 'Freeze') freezeCast(ctx, scene.foot(move.to), layer === 'over', (t - .57) * 1000 + 125);
}
