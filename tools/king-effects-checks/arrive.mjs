// How much the board round a king changes from one frame to the next as his move ends and the new position
// comes (the game's sync): a resting effect must not snap on or off there. A king walks one square (to a
// square of the other colour), then rests. Prints per frame [ms from the sync, pixels whose luminance moved by
// more than 25 since the frame before], with the effects on and off,
// and the most that changes in a frame while he rests (his effect's own motion). Run from the repo root:
//   node tools/king-effects-checks/arrive.mjs <design> <side 0|1> <from> <to>
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, normalize, extname } from 'node:path';
const [design = 'spirit', side = '1', from = 'd4', to = 'd5'] = process.argv.slice(2);
const docs = process.cwd() + '/docs/';
const mime = e => ({ '.html': 'text/html', '.mjs': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png' })[e] ?? 'application/octet-stream';
const server = createServer(async (req, res) => { const p = normalize(join(docs, decodeURIComponent(new URL(req.url, 'http://x').pathname))); let b; try { b = await readFile(p); } catch { res.writeHead(404).end(); return; } res.writeHead(200, { 'content-type': mime(extname(p)) }).end(b); }).listen(0);
await new Promise(r => server.on('listening', r));
const browser = await chromium.launch({ headless: true, channel: process.env.PLAYABLE_BROWSER || 'chromium' });
const page = await browser.newPage({ viewport: { width: 1000, height: 1100 } });
page.on('pageerror', e => console.log('ERR', e.message));
await page.addInitScript(() => { let T = 1e6, q = []; performance.now = () => T; window.requestAnimationFrame = cb => { q.push(cb); return q.length; }; window.__step = to => { T = to; const z = q; q = []; z.forEach(f => f(T)); }; window.__now = () => T; });
await page.goto(`http://127.0.0.1:${server.address().port}/painted-motion/harness.html`);
await page.evaluate(() => window.harness.ready);
const run = kings => page.evaluate(async ([design, side, from, to, kings]) => {
  const h = window.harness, s = h.scene, cv = document.getElementById('scene'), g = cv.getContext('2d', { willReadFrequently: true });
  s.setKings([design, design]); s.setResolution(1);
  h.setup([[from, 'K', side], ['a1', 'P', 1 - side], ['h8', 'P', side]], { atmosphere: true, kings, moves: true });
  let t = window.__now(); for (let i = 0; i < 20; i++) { s.redraw(); window.__step(t += 40); }
  await new Promise(r => setTimeout(r, 300));
  for (let i = 0; i < 65; i++) { s.redraw(); window.__step(t += 40); }
  // His effect's own motion at rest on the arrival square: the yardstick for a jump.
  let rest = 0;
  if (kings) { const f0 = h.foot(from), grab0 = () => { const d = g.getImageData(f0.x - 80, f0.y - 200, 160, 230).data, o = []; for (let i = 0; i < d.length; i += 4) o.push(.2126 * d[i] + .7152 * d[i + 1] + .0722 * d[i + 2]); return o; };
   let p0 = grab0(), ns = []; for (let i = 0; i < 6; i++) { s.redraw(); window.__step(t += 40); const c = grab0(); let n = 0; for (let j = 0; j < c.length; j++) if (Math.abs(c[j] - p0[j]) > 25) n++; ns.push(n); p0 = c; } rest = Math.max(...ns); }
  const f = h.foot(to), L = d => { const o = new Float32Array(d.length / 4); for (let i = 0; i < o.length; i++) o[i] = .2126 * d[i * 4] + .7152 * d[i * 4 + 1] + .0722 * d[i * 4 + 2]; return o; };
  const grab = () => L(g.getImageData(f.x - 80, f.y - 200, 160, 230).data);
  h.play(from, to); // the harness sets the new position when the move ends
  const out = []; let prev = null, synced = null;
  for (let i = 0; i < 40; i++) {
    t += 40; s.redraw(); window.__step(t); await 0;
    if (synced == null && !s.animating && !s.playing) synced = t;
    const cur = grab();
    if (prev && synced != null) { let n = 0; for (let j = 0; j < cur.length; j++) if (Math.abs(cur[j] - prev[j]) > 25) n++; out.push([t - synced, n]); }
    prev = cur;
  }
  out.rest = rest; return { frames: out.slice(0, 12), rest };
}, [design, +side, from, to, kings]);
// The walk's own last step changes pixels too: the same move with the effects off is the control.
const on = await run(true), off = await run(false);
console.log(design, side, `${from}-${to}`, 'effects on', JSON.stringify(on.frames.slice(0, 6)), 'off', JSON.stringify(off.frames.slice(0, 3)), 'at rest (most in a frame)', on.rest);
await browser.close(); server.close();
