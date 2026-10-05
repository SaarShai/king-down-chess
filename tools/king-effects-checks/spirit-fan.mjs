// The Spirit king's ray fan against his drawn crown through a capture (board units; 0 = on the crown).
// Run from the repo root: node tools/king-effects-checks/spirit-fan.mjs
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, normalize, extname } from 'node:path';
const repo = process.cwd() + '/';
const mime = e => ({ '.html': 'text/html', '.mjs': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png' })[e] ?? 'application/octet-stream';
const server = createServer(async (req, res) => { const p = normalize(join(repo, decodeURIComponent(new URL(req.url, 'http://x').pathname))); let b; try { b = await readFile(p); } catch { res.writeHead(404).end(); return; } res.writeHead(200, { 'content-type': mime(extname(p)) }).end(b); }).listen(0);
await new Promise(r => server.on('listening', r));
const browser = await chromium.launch({ headless: true, channel: 'chromium' });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.addInitScript(() => { let T = 1e6, q = []; performance.now = () => T; window.requestAnimationFrame = cb => { q.push(cb); return q.length; }; window.__step = to => { T = to; const z = q; q = []; z.forEach(f => f(T)); }; window.__now = () => T; });
await page.goto(`http://127.0.0.1:${server.address().port}/docs/king-effects/preview.html?record`);
await page.evaluate(() => window.preview.ready);
const out = await page.evaluate(async () => {
  const res = {}, key = 'capture-spirit', { scene, canvas } = window.preview.scenes[key];
  for (const [k, s] of Object.entries(window.preview.scenes)) s.scene.setLively({ kings: k === key, pawns: false });
  const target = canvas.getContext('2d'), orig = CanvasRenderingContext2D.prototype.drawImage;
  let log = [];
  CanvasRenderingContext2D.prototype.drawImage = function (img, ...a) {
    if (this === target) {
      const m = this.getTransform();
      if (img.width === 320 && img.height === 176) log.push({ kind: 'fan', x: m.e, y: m.f });
      if (img.width === 1152 && a[0] === -576 && a[1] === -1018) { const p = m.transformPoint(new DOMPoint(0, -118 / .1403)); log.push({ kind: 'crown', x: p.x, y: p.y }); }
    }
    return orig.call(this, img, ...a);
  };
  for (const c of [0, 2]) {
    const move = window.preview.setUpCapture(scene, window.preview.capturesFor('spirit')[c], 'spirit');
    let t = window.__now() + 16; for (let i = 0; i < 30; i++) { scene.redraw(); window.__step(t += 40); }
    await new Promise(r => setTimeout(r, 300));
    const rows = [];
    const at = tt => { log = []; scene.redraw(); window.__step(tt); const k = canvas.width / 960; const f = log.find(l => l.kind === 'fan'), cr = log.find(l => l.kind === 'crown'); return f && cr ? +((f.x - cr.x) / k).toFixed(1) : null; };
    rows.push(['rest', at(t += 40)]);
    scene.play(move); const s0 = window.__now();
    for (const ms of [500, 640, 800, 1000, 1200, 1400, 1520]) rows.push([ms, at(s0 + ms)]);
    res[c ? 'charcoal' : 'ivory'] = rows;
  }
  CanvasRenderingContext2D.prototype.drawImage = orig;
  return res;
});
console.log(JSON.stringify(out));
await browser.close(); server.close();
