// A king's resting effect after his move, once the new position has come (as the game sets it): it must grow
// back from nothing, never snap back (measured round his square). Uses the preview's captures (Death Touch keeps Shadow on his square; a
// knight capture moves Mud): prints [ms after the position came, mean |effect| per pixel] for each case.
// Run from the repo root: node tools/king-effects-checks/after-move.mjs
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, normalize, extname } from 'node:path';
const repo = process.cwd() + '/';
const mime = e => ({ '.html': 'text/html', '.mjs': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png' })[e] ?? 'application/octet-stream';
const server = createServer(async (req, res) => { const p = normalize(join(repo, decodeURIComponent(new URL(req.url, 'http://x').pathname))); let b; try { b = await readFile(p); } catch { res.writeHead(404).end(); return; } res.writeHead(200, { 'content-type': mime(extname(p)) }).end(b); }).listen(0);
await new Promise(r => server.on('listening', r));
const browser = await chromium.launch({ headless: true, channel: process.env.PLAYABLE_BROWSER || 'chromium' });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on('pageerror', e => console.log('ERR', e.message));
await page.addInitScript(() => { let T = 1e6, q = []; performance.now = () => T; window.requestAnimationFrame = cb => { q.push(cb); return q.length; }; window.__step = to => { T = to; const z = q; q = []; z.forEach(f => f(T)); }; window.__now = () => T; });
await page.goto(`http://127.0.0.1:${server.address().port}/docs/king-effects/preview.html?record`);
await page.evaluate(() => window.preview.ready);
for (const [design, c] of [['shadow', 4], ['shadow', 5], ['mud', 1], ['mud', 3], ['stratus', 0]]) {
  const r = await page.evaluate(async ([design, c]) => {
    const key = `capture-${design}`, { scene, canvas } = window.preview.scenes[key], g = canvas.getContext('2d');
    for (const [k, s] of Object.entries(window.preview.scenes)) s.scene.setLively({ kings: false, pawns: false });
    scene.setResolution(1);
    const cap = window.preview.capturesFor(design)[c], DT = [0, 40, 80, 160, 320, 640];
    const run = async kings => {
      scene.setLively({ kings });
      const move = window.preview.setUpCapture(scene, cap, design);
      let t = window.__now() + 16; for (let i = 0; i < 80; i++) { scene.redraw(); window.__step(t += 40); } // rest 3.2 s
      await new Promise(r => setTimeout(r, 200));
      let done = false; scene.play(move).then(() => { done = true; });
      while (!done) { scene.redraw(); window.__step(t += 40); await 0; }
      window.preview.afterCapture(scene, cap, design); const t0 = t;
      const out = [];
      // Round the king on his square after the move (the whole board can differ by a pixel between runs).
      const sq = cap.touch ? cap.king[0] : cap.victim[0], f = scene.foot('abcdefgh'.indexOf(sq[0]) + 8 * (+sq[1] - 1)), k = canvas.width / 960;
      const box = [Math.round((f.x - 80) * k), Math.round((f.y + scene.headroom - 180) * k), Math.round(160 * k), Math.round(220 * k)];
      for (const dt of DT) { scene.redraw(); window.__step(t0 + dt + 1); out.push(g.getImageData(...box).data); }
      return out;
    };
    const on = await run(true), off = await run(false);
    scene.setLively({ kings: false });
    return DT.map((dt, k) => { let m = 0; for (let i = 0; i < on[k].length; i++) m += Math.abs(on[k][i] - off[k][i]); return [dt, +(m / on[k].length * 100).toFixed(2)]; });
  }, [design, c]);
  console.log(design, c, JSON.stringify(r));
}
await browser.close(); server.close();
