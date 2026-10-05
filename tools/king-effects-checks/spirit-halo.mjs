// The Spirit glow's reach: mean luminance change by distance from the figure's outline at the breath's
// deepest point, both armies, on a light (e4) and a dark (f4) square. Run from the repo root:
//   node tools/king-effects-checks/spirit-halo.mjs
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, normalize, extname } from 'node:path';
const docs = process.cwd() + '/docs/';
const mime = e => ({ '.html': 'text/html', '.mjs': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png' })[e] ?? 'application/octet-stream';
const server = createServer(async (req, res) => { const p = normalize(join(docs, decodeURIComponent(new URL(req.url, 'http://x').pathname))); let b; try { b = await readFile(p); } catch { res.writeHead(404).end(); return; } res.writeHead(200, { 'content-type': mime(extname(p)) }).end(b); }).listen(0);
await new Promise(r => server.on('listening', r));
const browser = await chromium.launch({ headless: true, channel: 'chromium' });
const page = await browser.newPage({ viewport: { width: 1000, height: 1100 } });
await page.addInitScript(() => { let T = 1e6, q = []; performance.now = () => T; window.requestAnimationFrame = cb => { q.push(cb); return q.length; }; window.__step = to => { T = to; const z = q; q = []; z.forEach(f => f(T)); }; window.__now = () => T; });
await page.goto(`http://127.0.0.1:${server.address().port}/painted-motion/harness.html`);
await page.evaluate(() => window.harness.ready);
const out = await page.evaluate(async () => {
  const h = window.harness, s = h.scene, cv = document.getElementById('scene'), g = cv.getContext('2d'), W = cv.width;
  s.setKings(['spirit', 'spirit']); s.setResolution(1);
  const shot = (pl, kings, t) => { h.setup(pl, { atmosphere: true, kings }); for (let ms = 0; ms <= 1400; ms += 40) { s.redraw(); window.__step(t - 1400 + ms); } return g.getImageData(0, 0, W, cv.height).data; };
  const L = (d, i) => .2126 * d[i] + .7152 * d[i + 1] + .0722 * d[i + 2];
  const res = {};
  shot([['e4', 'K', 1]], true, 3e6); await new Promise(r => setTimeout(r, 300));
  for (const side of [0, 1]) for (const sq of ['e4', 'f4']) {
    // The breath: its loop starts when the effect does; find the deepest frame by trying a few times.
    let best = null;
    for (const dt of [0, 500, 1000, 1500, 2000, 2500, 3000, 3500]) {
      const B = shot([[sq, 'K', side]], false, 4e6 + dt), K1 = shot([[sq, 'K', side]], true, 4e6 + dt);
      let sum = 0; for (let i = 0; i < B.length; i += 4) sum += Math.abs(L(K1, i) - L(B, i));
      if (!best || sum > best.sum) best = { sum, B, K1, dt };
    }
    const B0 = shot([], false, 4e6), { B, K1 } = best, f = h.foot(sq), fx = Math.round(f.x), fy = Math.round(f.y);
    const fig = new Uint8Array(W * cv.height); for (let i = 0; i < fig.length; i++) fig[i] = Math.abs(L(B, i * 4) - L(B0, i * 4)) >= 2 ? 1 : 0;
    // Distance to the figure by repeated dilation (8-neighbour), out to 26.
    const dist = new Uint8Array(W * cv.height).fill(255); let front = []; for (let i = 0; i < fig.length; i++) if (fig[i]) { dist[i] = 0; front.push(i); }
    for (let d = 1; d <= 26; d++) { const next = []; for (const i of front) for (const o of [-1, 1, -W, W, -W - 1, -W + 1, W - 1, W + 1]) { const j = i + o; if (j >= 0 && j < dist.length && dist[j] === 255) { dist[j] = d; next.push(j); } } front = next; }
    const bins = [[1, 2], [3, 4], [5, 7], [8, 12], [13, 17], [18, 26]], row = {};
    for (const [a, b] of bins) { let n = 0, sm = 0; for (let y = fy - 170; y < fy + 25; y++) for (let x = fx - 70; x < fx + 70; x++) { const i = y * W + x, d = dist[i]; if (d < a || d > b) continue; n++; sm += L(K1, i * 4) - L(B, i * 4); } row[`${a}-${b}`] = n ? +(sm / n).toFixed(1) : null; }
    res[`${side ? 'charcoal' : 'ivory'} ${sq}`] = row;
  }
  return res;
});
for (const [k, v] of Object.entries(out)) console.log(k.padEnd(14), JSON.stringify(v));
await browser.close(); server.close();
