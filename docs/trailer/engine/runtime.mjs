// Shared trailer runtime: deterministic clock, easing, film finish, particles, gilded titles.
// Every shot draws from its local time t (seconds), so any frame renders exactly and repeatably.
export const W = 1920, H = 1080;
// The game's painted scene reads performance.now() and requestAnimationFrame(); both run on this clock.
let now = 0;
const queued = [];
performance.now = () => now;
window.requestAnimationFrame = cb => { queued.push(cb); return queued.length; };
/** Set the clock to `ms` and run every queued animation frame at that time. */
export const flush = ms => { now = ms; queued.splice(0).forEach(f => f(now)); };
export const easeInOut = k => { k = Math.max(0, Math.min(1, k)); return k * k * (3 - 2 * k); };
export const load = src => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error(src)); i.src = src; });
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, k) => a + (b - a) * k;
export const easeOut = k => 1 - (1 - clamp(k, 0, 1)) ** 3;
export const easeBack = k => { k = clamp(k, 0, 1); return 1 + 2.7 * (k - 1) ** 3 + 1.7 * (k - 1) ** 2; };
export const rand = seed => { let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; };
export const canvas = (w, h) => Object.assign(document.createElement('canvas'), { width: w, height: h });

// ---- shared finishing: vignette, film grain, letterbox ----
export const grain = (() => {
  const c = canvas(512, 512), g = c.getContext('2d'), d = g.createImageData(512, 512), r = rand(7);
  for (let i = 0; i < d.data.length; i += 4) { const v = r() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
  g.putImageData(d, 0, 0); return c;
})();
export function finish(g, t, bars = 132) {
  const v = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.98);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.75)');
  g.fillStyle = v; g.fillRect(0, 0, W, H);
  g.save(); g.globalAlpha = 0.06; g.globalCompositeOperation = 'overlay';
  const ox = Math.floor((t * 97) % 1 * 512), oy = Math.floor((t * 61) % 1 * 512);
  for (let x = -ox; x < W; x += 512) for (let y = -oy; y < H; y += 512) g.drawImage(grain, x, y);
  g.restore();
  g.fillStyle = '#000'; g.fillRect(0, 0, W, bars); g.fillRect(0, H - bars, W, bars);
}
export function particles(g, t, { n = 140, seed = 3, color = '255,190,110', rise = 30, area = [0, 0, W, H], size = [1, 3], bokeh = 10 } = {}) {
  const r = rand(seed);
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const x0 = area[0] + r() * area[2], y0 = r() * area[3], s = lerp(size[0], size[1], r()), sp = lerp(0.4, 1.3, r()), ph = r() * 6.28;
    const x = x0 + Math.sin(t * 0.7 + ph) * 18, y = area[1] + (((y0 - t * rise * sp) % area[3]) + area[3]) % area[3];
    const a = (0.35 + 0.65 * r()) * (0.6 + 0.4 * Math.sin(t * 3 + ph)), big = i < bokeh, rad = (big ? s * 9 : s) * 2.2;
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, `rgba(${color},${big ? a * 0.16 : a})`); gr.addColorStop(1, `rgba(${color},0)`);
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad, 0, 6.283); g.fill();
  }
  g.restore();
}
/** Name plate text: gilded gradient with an optional light sweep (0..1). */
export function goldText(text, px, { spacing = 0, sweep = -1 } = {}) {
  const font = `900 ${px}px Cinzel`, m = canvas(8, 8).getContext('2d');
  m.font = font; m.letterSpacing = `${spacing}px`;
  const tw = Math.ceil(m.measureText(text).width) + 60, th = Math.ceil(px * 1.5);
  const c = canvas(tw, th), g = c.getContext('2d');
  g.font = font; g.letterSpacing = `${spacing}px`; g.textBaseline = 'middle';
  const gr = g.createLinearGradient(0, th * 0.2, 0, th * 0.8);
  gr.addColorStop(0, '#fffbea'); gr.addColorStop(0.45, '#f6cd76'); gr.addColorStop(0.6, '#b9741f'); gr.addColorStop(1, '#6a3a0a');
  g.fillStyle = gr; g.fillText(text, 30, th / 2);
  if (sweep >= 0 && sweep <= 1) {
    g.globalCompositeOperation = 'source-atop';
    const x = lerp(-tw * 0.3, tw * 1.3, sweep), s = g.createLinearGradient(x - 140, 0, x + 140, th);
    s.addColorStop(0, 'rgba(255,255,255,0)'); s.addColorStop(0.5, 'rgba(255,255,255,.95)'); s.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = s; g.fillRect(0, 0, tw, th);
  }
  return c;
}

