// Renders the trailer (docs/trailer/engine) frame by frame. Serves docs/ itself on a free port
// (set TRAILER_URL to use another server instead):
//   node tools/render-trailer.mjs still 12.5 out.png [--shot archer]
//   node tools/render-trailer.mjs video out.mp4 [--from 0] [--to 72] [--fps 30] [--scale 1] [--shot beast] [--blur 4] [--shutter 180] [--audio sound.wav]
//   node tools/render-trailer.mjs audio out.wav [--only music|sfx]
//   node tools/render-trailer.mjs master raw.wav out.wav
// --blur N: true motion blur — N sub-frames spread over the shutter (degrees of a 1/fps frame, opening at the frame time) and averaged.
// audio: renders engine/audio.html offline and masters the mix to -14 LUFS, -1 dBTP (docs/trailer/AUDIO.md); a stem
// (--only) is written as rendered (32-bit float, mix level), so the stems stay comparable. master: masters a raw render.
// --audio: muxes a soundtrack (global time) under the video, cut to the rendered range.
// Times are global seconds, or local to the shot with --shot. Video goes through a temp PNG sequence and ffmpeg.
import { chromium } from 'playwright';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, join, normalize } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const [mode, a, b] = process.argv.slice(2);
const opt = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };

// Mastering, linear: one gain to -14 LUFS, then a 4× oversampled lookahead limiter holds the true peaks under -1 dBTP.
// The limiter takes a little loudness off, so the gain is measured and corrected (at most three passes).
const LUFS = -14, CEILING = -1, LIMIT = CEILING - 0.3;   // the limiter sits 0.3 dB under the ceiling: resampling overshoot
const loudness = (file, af) => {
  const s = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-af', [af, 'ebur128=peak=true'].filter(Boolean).join(','), '-f', 'null', '-'], { encoding: 'utf8' }).stderr.split('Summary:').pop();
  const n = re => Number(re.exec(s)?.[1]);
  return { I: n(/I:\s+(-?[\d.]+) LUFS/), LRA: n(/LRA:\s+([\d.]+) LU/), TP: n(/Peak:\s+(-?[\d.]+|-inf) dBFS/) };
};
function master(raw, out) {
  const chain = g => `aresample=192000,volume=${g.toFixed(2)}dB,alimiter=limit=${(10 ** (LIMIT / 20)).toFixed(4)}:attack=2:release=40:level=0:latency=1,aresample=48000`;
  const src = loudness(raw);
  if (!(src.I > -70)) throw new Error(`master: ${raw} is silent`);
  let gain = LUFS - src.I, got;
  for (let k = 0; k < 3; k++) { got = loudness(raw, chain(gain)); if (Math.abs(got.I - LUFS) < 0.05) break; gain += LUFS - got.I; }
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', raw, '-af', chain(gain), '-c:a', 'pcm_s24le', out]);
  const done = loudness(out);
  console.log(`ok master → ${out}: ${done.I} LUFS, ${done.TP} dBTP, LRA ${done.LRA} LU (was ${src.I} LUFS, ${src.TP} dBTP; ${gain >= 0 ? "+" : ""}${gain.toFixed(2)} dB)`);
  if (Math.abs(done.I - LUFS) > 0.2 || done.TP > CEILING) { console.error(`master: missed ${LUFS} LUFS / ${CEILING} dBTP`); process.exitCode = 1; }
}
if (mode === 'master') { master(a, b); process.exit(); }
// Own static server: no shared backlog with other renders, and missing optional assets give a plain 404.
const TYPES = { '.wav': 'audio/wav', '.html': 'text/html', '.mjs': 'text/javascript', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const root = fileURLToPath(new URL('../docs/', import.meta.url));
const server = createServer(async (req, res) => {
  let path = join(root, normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)));
  if (path.endsWith('/')) path += 'index.html';
  try { const body = await readFile(path); res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' }); res.end(body); }
  catch { res.writeHead(404); res.end(); }
});
if (!process.env.TRAILER_URL) await new Promise(ok => server.listen(0, '127.0.0.1', ok));
const base = process.env.TRAILER_URL || `http://127.0.0.1:${server.address().port}/trailer/engine/`;
const shot = opt('shot'), scale = Number(opt('scale', 1));
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  // A missing optional asset (shots fall back) logs a 404; a missing required one fails its shot on its own.
  page.on('console', m => { if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) errors.push(m.text()); });
  if (mode === 'audio') {
    await page.goto(base + 'audio.html');
    await page.waitForFunction(() => window.renderAudio, null, { polling: 100, timeout: 120000 });
    const only = opt('only', null), dir = mkdtempSync(join(tmpdir(), 'trailer-audio-')), raw = only ? a : join(dir, 'raw.wav');
    writeFileSync(raw, Buffer.from(await page.evaluate(only => window.renderAudio({ only }), only), 'base64'));
    if (only) console.log(`ok ${only} stem → ${a} (float, mix level)`); else master(raw, a);
    rmSync(dir, { recursive: true });
    if (errors.length) { console.error('page errors:', errors); process.exitCode = 1; }
    process.exit();
  }
  await page.goto(base + (shot ? `?shot=${shot}` : ''));
  await page.waitForFunction(() => window.ready, null, { polling: 100, timeout: 120000 });
  await page.evaluate(() => window.ready);
  const frame = async (t, path) => { await page.evaluate(t => window.renderAt(t), t); await page.screenshot({ path, scale: 'css' }); };
  if (mode === 'still') { await frame(Number(a), b); console.log(`ok still ${a}s → ${b}`); }
  else if (mode === 'video') {
    const fps = Number(opt('fps', 30)), from = Number(opt('from', 0)), to = Number(opt('to', await page.evaluate(() => window.duration)));
    const blur = Math.max(1, Number(opt('blur', 1))), shutter = Number(opt('shutter', 180)) / 360;
    const dir = mkdtempSync(join(tmpdir(), 'trailer-')), n = Math.round((to - from) * fps);
    for (let i = 0; i < n; i++) for (let s = 0; s < blur; s++) {
      const off = s / blur * shutter / fps;  // the shutter opens on the frame time, like a film camera: cuts stay clean, hits land on their frame
      await frame(from + i / fps + off, join(dir, `f${String(i * blur + s).padStart(6, '0')}.png`));
    }
    const filters = blur > 1 ? [`tmix=frames=${blur}`, `select=not(mod(n+1\\,${blur}))`, `setpts=N/(${fps}*TB)`] : [];
    if (scale !== 1) filters.push(`scale=${Math.round(1920 * scale / 2) * 2}:-2`);
    const audio = opt('audio'), at = from + (shot ? (await import('../docs/trailer/engine/timeline.mjs')).shots.find(s => s.id === shot).start : 0);
    execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', String(fps * blur), '-i', join(dir, 'f%06d.png'),
      ...(audio ? ['-ss', String(at), '-t', String(to - from), '-i', audio, '-map', '0:v', '-map', '1:a', '-c:a', 'aac', '-b:a', '256k'] : []),
      ...(filters.length ? ['-vf', filters.join(',')] : []), '-r', String(fps), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium', a]);
    rmSync(dir, { recursive: true });
    console.log(`ok video ${n} frames, ${from}–${to}s → ${a}`);
  } else throw new Error('usage: still <t> <out.png> | video <out.mp4> [--from --to --fps --scale --shot --blur --audio] | audio <out.wav> [--only]');
  if (errors.length) { console.error('page errors:', errors); process.exitCode = 1; }
} finally { await browser.close(); server.close(); }
