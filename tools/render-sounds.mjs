// Renders every board sound offline, checks its level, and writes one WAV to listen to.
// Needs the dev server (it imports the TypeScript module): npx vite --port 5173 &
//   node tools/render-sounds.mjs [out.wav]    (default docs/sounds/king-down-sounds.wav)
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
const out = process.argv[2] || 'docs/sounds/king-down-sounds.wav', rate = 44100;
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.goto(process.env.DEV_URL || 'http://localhost:5173/');
  const { stats, samples } = await page.evaluate(async rate => {
    const { SOUNDS } = await import('/src/render/sfx.ts');
    const names = Object.keys(SOUNDS), gap = 0.7, c = new OfflineAudioContext(1, Math.ceil(rate * gap * names.length), rate);
    names.forEach((n, i) => SOUNDS[n](c, c.destination, 0.05 + i * gap));
    const d = (await c.startRendering()).getChannelData(0);
    const stats = names.map((name, i) => {
      let peak = 0, sum = 0; const a = Math.floor(i * gap * rate), b = Math.floor((i + 1) * gap * rate);
      for (let k = a; k < b; k++) { peak = Math.max(peak, Math.abs(d[k])); sum += d[k] * d[k]; }
      return { name, peak: +peak.toFixed(2), rms: +Math.sqrt(sum / (b - a)).toFixed(3) };
    });
    return { stats, samples: Array.from(d, v => Math.round(Math.max(-1, Math.min(1, v)) * 32767)) };
  }, rate);
  console.table(stats);
  for (const s of stats) assert.ok(s.peak < 0.9 && s.rms > 0.01, `${s.name}: peak ${s.peak}, rms ${s.rms}`);
  const pcm = Buffer.from(Int16Array.from(samples).buffer), h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVEfmt ', 8); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(rate, 24); h.writeUInt32LE(rate * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, Buffer.concat([h, pcm]));
  console.log(`ok ${stats.length} sounds → ${out} (${stats.map(s => s.name).join(', ')}, 0.7 s apart)`);
} finally { await browser.close(); }
