// How much a king's resting effect changes from frame to frame as he starts a move (it must fade, not jump).
// Run from the repo root: node tools/king-effects-checks/move-start.mjs <design> <side 0|1>
// Prints [ms after the move starts, mean |effect| per pixel, mean change from the frame before].
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { join, normalize, extname } from 'node:path';
const [design, side, outFile] = process.argv.slice(2);
const docs = process.cwd() + '/docs/';
const mime = e => ({ '.html': 'text/html', '.mjs': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png' })[e] ?? 'application/octet-stream';
const server = createServer(async (req, res) => { const p = normalize(join(docs, decodeURIComponent(new URL(req.url, 'http://x').pathname))); let b; try { b = await readFile(p); } catch { res.writeHead(404).end(); return; } res.writeHead(200, { 'content-type': mime(extname(p)) }).end(b); }).listen(0);
await new Promise(r => server.on('listening', r));
const browser = await chromium.launch({ headless: true, channel: 'chromium' });
const page = await browser.newPage({ viewport: { width: 1000, height: 1100 } });
page.on('pageerror', e => console.log('ERR', e.message));
await page.addInitScript(() => { let T = 1e6, q = []; performance.now = () => T; window.requestAnimationFrame = cb => { q.push(cb); return q.length; }; window.__step = to => { T = to; const z = q; q = []; z.forEach(f => f(T)); }; window.__now = () => T; });
await page.goto(`http://127.0.0.1:${server.address().port}/painted-motion/harness.html`);
await page.evaluate(() => window.harness.ready);
const r = await page.evaluate(async ([design, side]) => {
  const h = window.harness, s = h.scene, cv = document.getElementById('scene'), g = cv.getContext('2d');
  s.setKings([design, design]); s.setResolution(1);
  const DTS = [-40, 0, 16, 33, 50, 100, 150, 200, 260];
  // The same timeline twice, with the kings' effects on and off; the effect's part is the difference.
  const run = async kings => {
    h.setup([['d4', 'K', +side], ['a8', 'P', 1 - side], ['h1', 'P', 1 - side]], { atmosphere: true, kings, moves: true });
    let t = 2e6; for (let i = 0; i < 20; i++) { s.redraw(); window.__step(t += 40); }
    await new Promise(r => setTimeout(r, 200));
    for (let i = 0; i < 75; i++) { s.redraw(); window.__step(t += 40); }
    const f = h.foot('d4'), grab = () => g.getImageData(f.x - 90, f.y - 190, 180, 220).data, out = [];
    s.redraw(); window.__step(t - 40 + 40); out.push(grab());
    window.__step(t + 1); h.play('d4', 'e4'); const t0 = t + 1;
    for (const dt of DTS.slice(1)) { s.redraw(); window.__step(t0 + dt + 1); out.push(grab()); }
    return out;
  };
  const on = await run(true), off = await run(false), parts = on.map((a, k) => { const c = new Float32Array(a.length); for (let i = 0; i < a.length; i++) c[i] = a[i] - off[k][i]; return c; });
  return parts.map((c, k) => { let m = 0, d = 0; for (let i = 0; i < c.length; i++) { m += Math.abs(c[i]); if (k) d += Math.abs(c[i] - parts[k - 1][i]); } return [DTS[k], +(m / c.length).toFixed(2), +(d / c.length).toFixed(2)]; });
}, [design, side]);
console.log(design, side, JSON.stringify(r));
await browser.close(); server.close();
