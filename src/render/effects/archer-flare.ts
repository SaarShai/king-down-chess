type Point = { x: number; y: number };
const clamp = (t: number) => Math.max(0, Math.min(1, t));
const ease = (t: number) => { t = clamp(t); return t * t * (3 - 2 * t); };

/** Paired focus feathers gather in place. Nothing travels from the Archer to the victim. */
export function drawArcherFocus(ctx: CanvasRenderingContext2D, foot: Point, source: Point, progress: number, front: boolean, reduced: boolean, isSource = false) {
  const t = reduced ? 1 : ease(progress / .4), hold = ease(progress / .12);
  const flare = reduced ? 0 : Math.sin(clamp(progress / .52) * Math.PI);
  const toward = Math.sign(source.x - foot.x) || 1;
  ctx.save(); ctx.translate(foot.x, foot.y);
  if (!front) {
    const glow = ctx.createRadialGradient(0, -7, 1, 0, -7, isSource ? 59 : 72);
    glow.addColorStop(0, '#edbd686b'); glow.addColorStop(.55, '#b9803633'); glow.addColorStop(1, '#edbd6800');
    ctx.save(); ctx.scale(1, .4); ctx.globalAlpha = hold * (.38 + flare * .5); ctx.fillStyle = glow; ctx.fillRect(-75, -82, 150, 150); ctx.restore();
    for (let i = 0; i < (isSource ? 2 : 3); i++) {
      const side = isSource ? toward : i % 2 ? -toward : toward;
      const x = side * (isSource ? 31 + i * 11 : 40 + (1 - t) * 23 + i * 6), y = -18 - i * 25;
      ctx.globalAlpha = hold * (.24 + flare * .7);
      ctx.beginPath(); ctx.moveTo(x, y + 23);
      ctx.bezierCurveTo(x + side * 18, y + 5, x + side * 18, y - 27, x - side * 4, y - 49);
      ctx.bezierCurveTo(x + side * 7, y - 20, x - side * 5, y + 4, x, y + 23); ctx.closePath();
      const gold = ctx.createLinearGradient(x, y + 23, x - side * 4, y - 49);
      gold.addColorStop(0, '#a66a3300'); gold.addColorStop(.35, '#be8c42d9'); gold.addColorStop(.65, '#fff0b7'); gold.addColorStop(1, '#f0c97300');
      ctx.fillStyle = gold; ctx.fill();
    }
  } else if (flare > 0) {
    for (let i = 0; i < 13; i++) {
      const angle = i * 2.399, radius = 48 + (1 - t) * 24 + (i % 3) * 6;
      const x = Math.cos(angle) * radius, y = -55 + Math.sin(angle) * radius * .68 - t * 8;
      ctx.globalAlpha = flare * (.35 + (i % 4) * .15); ctx.fillStyle = i % 3 ? '#f8dfa0' : '#b78543';
      ctx.beginPath(); ctx.ellipse(x, y, 1.8, 3.4, angle, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
}
