// Frames of a king's capture with other pieces on the board, for close looks (the Stratus throw):
//   node tools/king-effects-checks/throw-frames.mjs <design> <out.png> '<placements json>' <from> <to> <ms,ms,…> [x w above h]
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { join, normalize, extname } from 'node:path';
const [design, outFile, placements, from, to, times, zx = "0", zw = "960", zy = "340", zh = "380"] = process.argv.slice(2);
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
const png = await page.evaluate(async ([design, placements, from, to, times, zx, zw, zy, zh]) => {
  const h = window.harness, s = h.scene, cv = document.getElementById('scene');
  s.setKings([design, design]); s.setResolution(1);
  h.setup(JSON.parse(placements), { atmosphere: true, kings: true, captures: true });
  let t = window.__now(); for (let i = 0; i < 20; i++) { s.redraw(); window.__step(t += 40); }
  await new Promise(r => setTimeout(r, 400));
  const sq = n => { const f = 'abcdefgh'.indexOf(n[0]), r = +n[1] - 1; return r * 8 + f; };
  s.play({ from: sq(from), to: sq(to), captures: [sq(to)] });
  const start = window.__now(), f = h.foot(to), frames = [];
  for (const ms of times.split(',').map(Number)) { s.redraw(); window.__step(start + ms); const c = document.createElement('canvas'); c.width = 960; c.height = 380; c.getContext("2d").drawImage(cv, +zx, f.y - +zy, +zw, +zh, 0, 0, 960, 380); frames.push([ms, c]); }
  const out = document.createElement('canvas'); out.width = 960; out.height = frames.length * 404; const g = out.getContext('2d'); g.fillStyle = '#eee'; g.fillRect(0, 0, 960, out.height);
  frames.forEach(([ms, c], i) => { g.drawImage(c, 0, i * 404 + 24); g.fillStyle = '#000'; g.font = '16px sans-serif'; g.fillText(`${ms} ms`, 4, i * 404 + 18); });
  return out.toDataURL('image/png');
}, [design, placements, from, to, times, zx, zw, zy, zh]);
await writeFile(outFile, Buffer.from(png.split(',')[1], 'base64'));
await browser.close(); server.close();
