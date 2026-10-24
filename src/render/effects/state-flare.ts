type Point = { x: number; y: number };
type Frame = { progress: number; front: boolean; reduced: boolean };
const TAU = Math.PI * 2;
const clamp = (t: number) => Math.max(0, Math.min(1, t));
const ease = (t: number) => { t = clamp(t); return t * t * (3 - 2 * t); };
const rand = (i: number) => { const n = Math.sin(i * 127.1 + 17.7) * 43758.5453; return n - Math.floor(n); };

function glow(ctx: CanvasRenderingContext2D, p: Point, radius: number, colour: string, alpha: number, flat = 1) {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(p.x, p.y); ctx.scale(1, flat);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
  g.addColorStop(0, colour); g.addColorStop(1, `${colour}00`);
  ctx.fillStyle = g; ctx.fillRect(-radius, -radius, radius * 2, radius * 2); ctx.restore();
}

// Filled, tapered light has a soft outer body and a pale core, rather than a route stroke.
function wisp(ctx: CanvasRenderingContext2D, a: Point, b: Point, width: number, bend: number, colour: string, alpha: number) {
  if (alpha <= 0) return;
  const dx = b.x - a.x, dy = b.y - a.y, length = Math.hypot(dx, dy) || 1, nx = -dy / length, ny = dx / length;
  ctx.save(); ctx.globalAlpha *= alpha;
  for (let core = 0; core < 2; core++) {
    const w = width * (core ? .26 : 1);
    ctx.beginPath(); ctx.moveTo(a.x - nx * w * .2, a.y - ny * w * .2);
    ctx.bezierCurveTo(a.x + dx * .32 + nx * (bend - w), a.y + dy * .32 + ny * (bend - w), b.x - dx * .24 + nx * bend, b.y - dy * .24 + ny * bend, b.x, b.y);
    ctx.bezierCurveTo(b.x - dx * .3 + nx * (bend + w), b.y - dy * .3 + ny * (bend + w), a.x + dx * .4 + nx * (bend + w), a.y + dy * .4 + ny * (bend + w), a.x + nx * w * .2, a.y + ny * w * .2); ctx.closePath();
    const g = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
    g.addColorStop(0, `${colour}00`); g.addColorStop(.32, core ? '#fff7dbb8' : `${colour}b8`); g.addColorStop(.72, core ? '#ffffece6' : `${colour}ee`); g.addColorStop(1, `${colour}00`);
    ctx.fillStyle = g; ctx.fill();
  }
  ctx.restore();
}

function mote(ctx: CanvasRenderingContext2D, p: Point, size: number, colour: string, alpha: number) {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.fillStyle = colour;
  ctx.beginPath(); ctx.ellipse(p.x, p.y, size * .55, size, -.4, 0, TAU); ctx.fill(); ctx.restore();
}

function guardOutline(ctx: CanvasRenderingContext2D) {
  ctx.beginPath(); ctx.moveTo(0, -68);
  ctx.bezierCurveTo(-17, -70, -29, -79, -42, -72);
  ctx.bezierCurveTo(-49, -43, -39, -16, 0, 3);
  ctx.bezierCurveTo(39, -16, 49, -43, 42, -72);
  ctx.bezierCurveTo(29, -79, 17, -70, 0, -68); ctx.closePath();
}

/** A curved steel face with a thick forged rim, not an outline. */
function guardPlate(ctx: CanvasRenderingContext2D, shine: number, sweep: number) {
  ctx.save(); ctx.translate(2, 3); guardOutline(ctx); ctx.fillStyle = '#292f32'; ctx.fill(); ctx.restore();
  guardOutline(ctx);
  const rim = ctx.createLinearGradient(-43, -70, 40, 0);
  rim.addColorStop(0, '#fff0c0'); rim.addColorStop(.18, '#b9a77a'); rim.addColorStop(.37, '#574c37');
  rim.addColorStop(.52, '#e0d6b3'); rim.addColorStop(.68, '#857455'); rim.addColorStop(1, '#383936');
  ctx.fillStyle = rim; ctx.fill();
  ctx.save(); ctx.translate(0, -35); ctx.scale(.9, .89); ctx.translate(0, 35);
  guardOutline(ctx); ctx.fillStyle = '#172e34'; ctx.fill(); ctx.restore();
  ctx.save(); ctx.translate(0, -35); ctx.scale(.87, .86); ctx.translate(0, 35);
  guardOutline(ctx); ctx.clip();
  const steel = ctx.createLinearGradient(-43, -55, 43, -17);
  steel.addColorStop(0, '#253b44'); steel.addColorStop(.22, '#5c8d98'); steel.addColorStop(.48, '#b6d0c9');
  steel.addColorStop(.51, '#536d72'); steel.addColorStop(.74, '#314b57'); steel.addColorStop(1, '#182b35');
  ctx.fillStyle = steel; ctx.fillRect(-50, -84, 100, 96);
  // Broad reflections and a raised central ridge carry the shield's volume at board size.
  const reflection = ctx.createRadialGradient(-16, -62, 2, -16, -62, 61);
  reflection.addColorStop(0, '#e1f7de83'); reflection.addColorStop(.5, '#a9e4e028'); reflection.addColorStop(1, '#88cbd900');
  ctx.fillStyle = reflection; ctx.fillRect(-50, -84, 100, 96);
  ctx.beginPath(); ctx.moveTo(-35, -68); ctx.bezierCurveTo(-24, -66, -20, -69, -7, -64);
  ctx.bezierCurveTo(-24, -58, -25, -40, -32, -24); ctx.bezierCurveTo(-40, -37, -40, -54, -35, -68);
  ctx.fillStyle = '#d9e9d52e'; ctx.fill();
  const shade = ctx.createLinearGradient(0, -68, 8, 4);
  shade.addColorStop(0, '#1d313000'); shade.addColorStop(.55, '#142f3910'); shade.addColorStop(1, '#0f202aac');
  ctx.fillStyle = shade; ctx.fillRect(-50, -84, 100, 96);
  ctx.beginPath(); ctx.moveTo(-3, -70); ctx.lineTo(0, -3); ctx.lineTo(5, -70); ctx.closePath();
  ctx.fillStyle = '#dbdfc798'; ctx.fill();
  // Soft hammer marks break up the reflection without adding an emblem or loose shards.
  for (let i = 0; i < 36; i++) {
    const x = -41 + rand(i + 252) * 82, y = -74 + rand(i + 391) * 76;
    ctx.beginPath(); ctx.ellipse(x, y, 1 + rand(i + 52) * 4, .7 + rand(i + 87) * 1.4, -.55, 0, TAU);
    ctx.fillStyle = i % 3 ? '#ddf1d512' : '#10283624'; ctx.fill();
  }
  // Fixed uneven grain belongs to the metal; it does not twinkle.
  for (let i = 0; i < 70; i++) {
    ctx.fillStyle = i % 3 ? '#d7ead222' : '#102b393d';
    ctx.fillRect(-43 + rand(i + 91) * 86, -76 + rand(i + 171) * 79, .6 + rand(i + 6) * 2.2, .6);
  }
  if (shine > 0) {
    const x = -76 + sweep * 145, light = ctx.createLinearGradient(x - 20, -60, x + 20, -42);
    light.addColorStop(0, '#e1ffff00'); light.addColorStop(.4, '#a1eaff38');
    light.addColorStop(.52, '#ffffe9d9'); light.addColorStop(.66, '#d6ffff6b'); light.addColorStop(1, '#e1ffff00');
    ctx.globalAlpha *= shine; ctx.fillStyle = light; ctx.fillRect(-50, -84, 100, 96);
  }
  ctx.restore();
  guardOutline(ctx); ctx.strokeStyle = '#e9e5bc9c'; ctx.lineWidth = 1.25; ctx.stroke();
  for (const side of [-1, 1]) {
    ctx.beginPath(); ctx.ellipse(side * 39, -66, 2.1, 2.4, side * .3, 0, TAU);
    ctx.fillStyle = '#354446'; ctx.fill();
    ctx.beginPath(); ctx.ellipse(side * 39 - .5, -67, .9, 1, 0, 0, TAU); ctx.fillStyle = '#f1e6b9'; ctx.fill();
  }
}

/** Three fitted plates form one low shield. The existing red crown carries the king exception. */
export function drawGuard(ctx: CanvasRenderingContext2D, foot: Point, frame: Frame) {
  const p = frame.reduced ? 1 : clamp(frame.progress), rise = ease(p / .2), join = ease((p - .045) / .2);
  const visible = ease(p / .07), flare = ease(p / .08) * (1 - ease((p - .3) / .3));
  const shine = ease((p - .12) / .08) * (1 - ease((p - .4) / .2));
  ctx.save(); ctx.translate(foot.x, foot.y);
  if (!frame.front) {
    glow(ctx, { x: 0, y: -2 }, 62, '#7eb8bb', visible * (.12 + flare * .23), .3);
    // Light and the contact shadow stay below the figure.
    glow(ctx, { x: 1, y: 1 }, 44, '#182b35', visible * .33, .22);
  } else {
    ctx.save(); ctx.globalAlpha *= visible * (.73 + flare * .22);
    ctx.translate(0, (1 - rise) * 20 - 3);
    for (const side of [-1, 0, 1]) {
      ctx.save(); ctx.translate(side * (1 - join) * 24, (1 - rise) * (side ? -8 : 10));
      ctx.rotate(side * (1 - join) * .13);
      ctx.beginPath(); ctx.rect(side < 0 ? -54 : side > 0 ? 15 : -15, -84, side ? 39 : 30, 96); ctx.clip();
      guardPlate(ctx, shine, ease((p - .14) / .37)); ctx.restore();
    }
    ctx.restore();
    if (flare > 0) for (let i = 0; i < 8; i++) {
      const t = ease((p - .06) / .48), side = i % 2 ? 1 : -1;
      mote(ctx, { x: side * (37 + rand(i + 31) * 11 + t * 9), y: -18 - rand(i + 47) * 37 - t * 23 },
        1.2 + rand(i + 8) * 1.4, i % 3 ? '#e9f7df' : '#d0b875', flare * .8);
    }
  }
  ctx.restore();
}

/** Light starts at the supporting king, then opens a mantle behind the knight. */
export function drawShelter(ctx: CanvasRenderingContext2D, source: Point, target: Point, frame: Frame, mercy = false) {
  const p = frame.progress, settled = frame.reduced ? 1 : ease((p - .18) / .2);
  const flare = frame.reduced ? 0 : Math.sin(clamp((p - .12) / .45) * Math.PI);
  const colour = mercy ? '#edc48d' : '#f2cb69';
  if (!frame.front) {
    glow(ctx, source, 67, colour, ease(p / .12) * .25, .34);
    glow(ctx, target, 76, colour, settled * (.17 + flare * .33), .34);
    for (const side of [-1, 1]) {
      const alpha = ease(p / .12) * (.28 + (frame.reduced ? 0 : (1 - ease((p - .23) / .2)) * .48));
      wisp(ctx, { x: source.x + side * 31, y: source.y - 57 }, { x: source.x + side * 17, y: source.y - 136 }, 14, side * 15, colour, alpha);
    }
    // Broad shoulders stay behind the figure. Mercy leaves the pawn-facing side open.
    ctx.save(); ctx.translate(target.x, target.y); ctx.globalAlpha = settled * (.29 + flare * .55);
    const pawnSide = Math.sign(source.x - target.x) || 1;
    for (const side of [-1, 1]) {
      if (mercy && side === -pawnSide) continue;
      ctx.save(); ctx.scale(side, 1);
      const h = 72 + settled * 45;
      ctx.beginPath(); ctx.moveTo(28, 2); ctx.bezierCurveTo(71, -24, 71, -h + 12, 4, -h); ctx.bezierCurveTo(49, -h + 27, 48, -34, 28, 2); ctx.closePath();
      const g = ctx.createLinearGradient(0, -h, 58, 0);
      g.addColorStop(0, '#fff2bf'); g.addColorStop(.27, colour); g.addColorStop(.63, mercy ? '#c49a589c' : '#d3a54ab8'); g.addColorStop(1, `${colour}00`);
      ctx.fillStyle = g; ctx.fill();
      wisp(ctx, { x: 30, y: 4 }, { x: 8, y: -h - 7 }, 10, 48, colour, flare * .65);
      ctx.restore();
    }
    ctx.restore();
  } else {
    const gather = frame.reduced ? 0 : ease(p / .12) * (1 - ease((p - .12) / .17));
    glow(ctx, { x: source.x, y: source.y - 83 }, 66, colour, gather * .5);
    for (let i = 0; i < 9; i++) {
      const angle = i * 2.399, r = 47 - ease(p / .16) * 27;
      const a = { x: source.x + Math.cos(angle) * r, y: source.y - 78 + Math.sin(angle) * r * .7 };
      wisp(ctx, a, { x: a.x - Math.sin(angle) * 25, y: a.y - 30 }, 6, 8, colour, gather * .7);
    }
    const travel = clamp((p - .12) / .23), packet = frame.reduced ? 0 : Math.sin(travel * Math.PI);
    if (packet > 0) {
      const point = (t: number) => ({ x: source.x + (target.x - source.x) * t + Math.sin(t * Math.PI) * 26, y: source.y - 77 + (target.y - source.y) * t - Math.sin(t * Math.PI) * 35 });
      const b = point(ease(travel)), a = point(Math.max(0, ease(travel) - .34));
      wisp(ctx, a, b, 18, 12, colour, packet);
      glow(ctx, b, 28, colour, packet * .6);
    }
    for (let i = 0; i < 21; i++) {
      const a = i * 2.399, r = 39 + rand(i) * 24;
      mote(ctx, { x: target.x + Math.cos(a) * r, y: target.y - 61 + Math.sin(a) * r - settled * 22 }, 1.8 + rand(i + 4) * 2.6, i % 3 ? '#fff2bf' : colour, flare * .8);
    }
  }
}

/** A single pair of braided light loops previews a swap; neither figure moves. */
export function drawSwap(ctx: CanvasRenderingContext2D, a: Point, b: Point, frame: Frame) {
  const p = frame.progress, turn = ease((p - .03) / .53), hold = ease(p / .12);
  const flare = frame.reduced ? 0 : Math.sin(clamp((p - .025) / .55) * Math.PI);
  const colour = ['#bd8ae9', '#70cde4'];
  if (!frame.front) {
    for (const [i, foot] of [a, b].entries()) {
      glow(ctx, foot, 75, colour[i], hold * (.2 + flare * .3), .33);
      ctx.save(); ctx.translate(foot.x, foot.y);
      for (const side of [-1, 1]) wisp(ctx, { x: side * 33, y: 2 }, { x: side * 48, y: -72 }, 13, side * 12, colour[i], hold * (.24 + flare * .45));
      ctx.restore();
    }
    return;
  }
  if (flare <= 0) return;
  for (let strand = 0; strand < 2; strand++) {
    const path = (t: number): Point => {
      const u = (1 - Math.cos(t * TAU)) / 2, v = strand ? 1 - u : u;
      return { x: a.x + (b.x - a.x) * v, y: a.y + (b.y - a.y) * v - 75 + Math.sin(t * TAU * 2) * (strand ? -46 : 46) };
    };
    // One filled wake avoids a chain of equally spaced dots along the preview path.
    ctx.save(); ctx.globalAlpha = flare;
    for (const core of [false, true]) {
      ctx.beginPath();
      for (const side of [-1, 1]) for (let i = 0; i <= 30; i++) {
        const age = side === -1 ? i / 30 : 1 - i / 30, t = Math.max(0, turn - (1 - age) * .18);
        const q = path(t), next = path(Math.min(1, t + .001)), dx = next.x - q.x, dy = next.y - q.y, length = Math.hypot(dx, dy) || 1;
        const width = Math.sin(age * Math.PI * .92) * (core ? 2.4 : 11 + Math.sin(age * 17) * 2.5);
        const x = q.x - dy / length * width * side, y = q.y + dx / length * width * side;
        if (side === -1 && i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath(); ctx.fillStyle = core ? '#f3e4ff' : `${colour[strand]}c9`; ctx.fill();
    }
    ctx.restore();
    const head = path(turn); glow(ctx, head, 32, colour[strand], flare * .7);
    mote(ctx, head, 5.4, '#fff3ff', flare);
    for (let i = 0; i < 13; i++) {
      const q = path(Math.max(0, turn - rand(i + strand * 31) * .16));
      mote(ctx, { x: q.x + (rand(i + 6) - .5) * 32, y: q.y + (rand(i + 12) - .5) * 32 }, 2 + rand(i + 9) * 2, colour[strand], flare * (1 - rand(i) * .7));
    }
  }
}
