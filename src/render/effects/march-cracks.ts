import { PAD, TILE, type PaintedScene } from '../../../docs/2d-first-pieces/board/scene.mjs';
import type { Point } from './card-types';
import { clamp, ease, rand } from './travel-material';

// March: the tiles crack under the real walk. Each tile on the path has one painted crack pattern, and each
// footfall opens it in a circle that grows from the foot. The joints between tiles stop the cracks, so they fit the stone.
// march-cracks.webp: four crack cells, then eight chips (light, dark) and three dust puffs. Prompt: march-cracks-prompt.txt.
const CRACK = 208, CHIP = 48, DUST = 96, ROW = CRACK, DUST_X = CHIP * 8;
const TILE_INSET = 4, CORNER = 8;
const REACH = 62, LAND_REACH = 78, SPREAD_MS = 110;
const HOLD_MS = 480, FADE_MS = 420;
const CHIP_MS = 340, DUST_MS = 430;
const SIDE = 13, MAX_FALLS = 16, FIELDS = 5;
// A walk bank reports each footfall itself. This distance only fills in on a page without one, or a slow frame that hid one.
const MISSED_STEP = 58;

let atlas: HTMLImageElement | undefined;
function art(): HTMLImageElement | null {
  if (!atlas) { atlas = new Image(); atlas.src = new URL('./march-cracks.webp', import.meta.url).href; }
  return atlas.complete && atlas.naturalWidth ? atlas : null;
}

interface Tile { x: number; y: number; dark: boolean; cell: number; flipX: boolean; flipY: boolean; last: number }

export class MarchCracks {
  private tiles: Tile[] = [];
  /** x, y, birth ms, reach and dark flag of each footfall. */
  private falls = new Float32Array(MAX_FALLS * FIELDS);
  private count = 0;
  private pose: number | null = null;
  private poses = 0;
  private lastX: number;
  private lastY: number;
  private landed = false;
  private sideX: number;
  private sideY: number;

  constructor(a: Point, private b: Point, private square: number, private seed: number) {
    art();
    this.lastX = a.x; this.lastY = a.y;
    const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1, steps = Math.ceil(len / (TILE / 4));
    this.sideX = -dy / len; this.sideY = dx / len * .5;
    for (let i = 0; i <= steps; i++) this.tileAt(a.x + dx * i / steps, a.y + dy * i / steps);
  }

  private tileAt(x: number, y: number): Tile {
    const col = Math.floor((x - PAD) / TILE), row = Math.floor((y - PAD) / TILE), left = PAD + col * TILE, top = PAD + row * TILE;
    let tile = this.tiles.find(t => t.x === left && t.y === top);
    if (!tile) {
      const n = this.tiles.length;
      // a1 is dark: on the screen, in either board direction, an odd column and row sum is a dark tile.
      tile = { x: left, y: top, dark: (col + row) % 2 === 1, cell: (this.seed + n) % 4, flipX: rand(n, this.seed) > .5, flipY: rand(n, this.seed + 1) > .5, last: Infinity };
      this.tiles.push(tile);
    }
    return tile;
  }

  private fall(x: number, y: number, ms: number, reach: number): void {
    if (this.count >= MAX_FALLS) return;
    const tile = this.tileAt(x, y), i = this.count++ * FIELDS;
    tile.last = ms;
    this.falls[i] = x; this.falls[i + 1] = y; this.falls[i + 2] = ms; this.falls[i + 3] = reach; this.falls[i + 4] = tile.dark ? 1 : 0;
    this.lastX = x; this.lastY = y;
  }

  /** Takes the beat from the live walk: its poses alternate a planted foot and a passing foot. */
  follow(scene: PaintedScene, foot: Point, landed: boolean, ms: number): void {
    if (this.landed) return;
    let step = false;
    for (const frame of scene.characterFrames) {
      if (frame.square !== this.square) continue;
      if (frame.bank.includes('walk') && frame.time !== this.pose) { this.pose = frame.time; step = this.poses++ % 2 === 0; }
      break;
    }
    const moved = Math.hypot(foot.x - this.lastX, foot.y - this.lastY);
    if (step || moved >= (this.count ? MISSED_STEP : 3)) {
      // The foot that lands changes each time, to the side of the figure's centre line.
      const side = this.count % 2 ? SIDE : -SIDE;
      this.fall(foot.x + this.sideX * side, foot.y + this.sideY * side, ms, REACH);
    }
    if (landed) {
      this.landed = true;
      this.fall(this.b.x, this.b.y, ms, LAND_REACH);
      for (const tile of this.tiles) if (tile.last === Infinity) tile.last = ms;
    }
  }

  draw(ctx: CanvasRenderingContext2D, ms: number): void {
    const image = art();
    if (!image || !this.count) return;
    for (const tile of this.tiles) {
      const alpha = 1 - ease((ms - tile.last - HOLD_MS) / FADE_MS);
      if (alpha > 0) this.drawTile(ctx, image, tile, alpha, ms);
    }
    for (let n = 0; n < this.count; n++) this.drawBits(ctx, image, n, ms);
  }

  private drawTile(ctx: CanvasRenderingContext2D, image: HTMLImageElement, tile: Tile, alpha: number, ms: number): void {
    const l = tile.x + TILE_INSET, t = tile.y + TILE_INSET, size = TILE - TILE_INSET * 2, r = l + size, b = t + size;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(l + CORNER, t); ctx.lineTo(r - CORNER, t); ctx.lineTo(r, t + CORNER); ctx.lineTo(r, b - CORNER);
    ctx.lineTo(r - CORNER, b); ctx.lineTo(l + CORNER, b); ctx.lineTo(l, b - CORNER); ctx.lineTo(l, t + CORNER);
    ctx.closePath(); ctx.clip();
    ctx.beginPath();
    for (let n = 0; n < this.count; n++) {
      const i = n * FIELDS, age = ms - this.falls[i + 2];
      if (age <= 0) continue;
      const reach = this.falls[i + 3] * (1 - (1 - clamp(age / SPREAD_MS)) ** 3);
      ctx.moveTo(this.falls[i] + reach, this.falls[i + 1]);
      ctx.arc(this.falls[i], this.falls[i + 1], reach, 0, Math.PI * 2);
    }
    ctx.clip();
    ctx.globalAlpha *= alpha;
    ctx.translate(l + size / 2, t + size / 2); ctx.scale(tile.flipX ? -1 : 1, tile.flipY ? -1 : 1);
    ctx.drawImage(image, tile.cell * CRACK, 0, CRACK, CRACK, -size / 2, -size / 2, size, size);
    ctx.restore();
  }

  /** A few chips jump from the foot and drop back; a little dust rises and thins out. */
  private drawBits(ctx: CanvasRenderingContext2D, image: HTMLImageElement, n: number, ms: number): void {
    const i = n * FIELDS, x = this.falls[i], y = this.falls[i + 1], age = ms - this.falls[i + 2], dark = this.falls[i + 4] ? 4 : 0, seed = this.seed + n * 5;
    if (age <= 0 || age >= Math.max(CHIP_MS, DUST_MS) + 60) return;
    const puff = age / DUST_MS;
    if (puff < 1) {
      const side = (n % 2 ? 1 : -1) * (12 + rand(n, seed) * 8);
      this.sprite(ctx, image, DUST_X + seed % 3 * DUST, ROW, DUST, x + side * (1 + puff), y - 2 - puff * 10, 22 + puff * 14, 0, ease(puff / .18) * (1 - ease((puff - .3) / .7)) * .6);
    }
    for (let j = 0; j < 3; j++) {
      const k = (age - j * 18) / CHIP_MS;
      if (k <= 0 || k >= 1) continue;
      const angle = rand(j, seed + 2) * Math.PI * 2, far = (18 + rand(j, seed + 3) * 18) * k, hop = Math.sin(k * Math.PI) * (12 + rand(j, seed + 4) * 12);
      this.sprite(ctx, image, (dark + (seed + j) % 4) * CHIP, ROW, CHIP, x + Math.cos(angle) * far, y + Math.sin(angle) * far * .6 - hop, 9 + rand(j, seed + 5) * 4, k * 5 * (rand(j, seed + 6) - .5), ease(k / .08) * (1 - ease((k - .7) / .3)));
    }
  }

  private sprite(ctx: CanvasRenderingContext2D, image: HTMLImageElement, sx: number, sy: number, cell: number, x: number, y: number, size: number, angle: number, alpha: number): void {
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(x, y); if (angle) ctx.rotate(angle);
    ctx.drawImage(image, sx, sy, cell, cell, -size / 2, -size / 2, size, size);
    ctx.restore();
  }
}
