// Builds the Set A motion preview (docs/WORKSHOP.md §5.5) and records it: one standalone page with
// the five motions live on the real model, and phone and desktop videos of it. The model, the gauge
// and the styles come from this build (run `npx vite build` first). The page holds everything it
// needs: the art as data URIs (in the markup, so the still models show even where scripts do not
// run), motion-a.js inline, and the phone video by a path next to it. It plays every motion in a
// loop on open. Nothing here is in the game.
//   npx tsx tools/workshop-motion.mts            → docs/visual-design/workshop/motion-preview.html
//   npx tsx tools/workshop-motion.mts --videos   → also motion-phone.webm and motion-desktop.webm
import { readFileSync, readdirSync, renameSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { chromium } from 'playwright';
import { gaugeHtml, modelHtml } from '../src/workshop/art';
import { BAND_WORD, judge } from '../src/workshop/judge';
import { lookOf } from '../src/workshop/look';
import { KING_STEP, fromPreset, presetOf, type Body, type PieceDesign, type Rule } from '../src/workshop/model';
import { pawns } from '../src/workshop/text';
// @ts-expect-error a plain .mjs module without types
import { GAITS, GAIT_OF } from '../docs/2d-first-pieces/board/gait.mjs';

const OUT = 'docs/visual-design/workshop';
/* ---- every file the styles and the model use, inlined ---- */
const MIME: Record<string, string> = { webp: 'image/webp', woff2: 'font/woff2', svg: 'image/svg+xml', png: 'image/png' };
const inline = (s: string): string => s.replace(/url\((['"]?)(?:\.{0,2}\/)(ui|fonts)\/([^'")]+)\1\)/g, (_m, _q, dir, f) => `url(${dataUri(`public/${dir}/${f}`)})`)
  .replace(/src="\.\/(ui\/[^"]+)"/g, (_m, f) => `src="${dataUri(`public/${f}`)}"`);
const seen = new Map<string, string>();
function dataUri(path: string): string {
  if (!seen.has(path)) seen.set(path, `data:${MIME[path.split('.').pop()!]};base64,${readFileSync(path).toString('base64')}`);
  return seen.get(path)!;
}
const chain: Rule = { when: { on: 'takes' }, does: { a: 'chain' } };
const design = (key: string, f: (d: PieceDesign) => void = () => {}): PieceDesign => { const d = fromPreset(presetOf(key)); d.letter = 'D'; f(d); return d; };
const state = (d: PieceDesign) => { const v = judge(d); return { model: modelHtml(lookOf(d, v)), gauge: gaugeHtml(v, true), worth: `About ${pawns(v.worth.point)} · ${BAND_WORD[v.label]}`, op: /OP/.test(v.label) }; };
const ART: Record<Body, string> = { P: 'pawn', N: 'knight', B: 'bishop', R: 'rook', Q: 'queen', A: 'archer', L: 'paladin', G: 'guard', M: 'maester', S: 'beast', O: 'ogre' };
/** The figure's own gait as in-place keyframes: lift, squash and tilt about the feet, no travel. */
function bob(body: Body) {
  const g = GAITS[GAIT_OF[ART[body]] ?? 'hop'];
  return Array.from({ length: 25 }, (_, i) => {
    const p = g.at(i / 24, 1);
    return { transform: `translateY(${(-p.lift * 1.8).toFixed(2)}px) rotate(${(p.tilt * 1.5).toFixed(4)}rad) scale(${p.sx.toFixed(4)}, ${p.sy.toFixed(4)})` };
  });
}
const kingStep = (d: PieceDesign) => { d.squares = KING_STEP('both'); d.look.body = 'M'; };
const SCENES = [
  { id: 'A1', motion: 'equip', title: 'A1 Equip', say: 'Look tab: the Rook takes the Beast body. The figure bobs in its own gait, the rim flashes, the bodies cross-fade.',
    states: [state(design('rook')), state(design('rook', d => { d.look.body = 'S'; }))], gait: [bob('R'), bob('S')] },
  { id: 'A2', motion: 'pop', title: 'A2 Floor pop', say: 'Moves tab: the Knight gets the 8 squares next to it. New marks pop in, the near ring first. Tap again: they fade.',
    states: [state(design('knight')), state(design('knight', d => { d.squares.push(...KING_STEP('both')); }))] },
  { id: 'A3', motion: 'gauge', title: 'A3 Gauge ease', say: 'Rules tab: the Knight takes again. The gem and its band ease along the gauge; the plinth turns from silver to gold.',
    states: [state(design('knight')), state(design('knight', d => { d.rules = [chain]; }))] },
  { id: 'A4', motion: 'overload', title: 'A4 Overload', say: 'The Rook takes again and crosses the line. The cracks draw, the figure shakes 3 times, the cracks glow while it stays over.',
    states: [state(design('rook')), state(design('rook', d => { d.rules = [chain]; }))] },
  { id: 'A5', motion: 'reveal', title: 'A5 "When…" reveal: on a center square', say: 'On a center square, it also moves like a queen. The queen\'s ghost fades in with a gold ring; the map of the center and the extra lines light.',
    states: [state(design('maester', d => { kingStep(d); d.rules = []; })), state(design('maester', d => { kingStep(d); d.rules = [{ when: { on: 'zone', zone: 'capital' }, does: { a: 'movesLike', as: 'queen' } }]; }))] },
  { id: 'A5b', motion: 'reveal', title: 'A5 "When…" reveal: from move 10', say: 'From move 10, it also moves like a rook. The hourglass turns and wakes, the ghost fades in.',
    states: [state(design('maester', d => { kingStep(d); d.rules = []; })), state(design('maester', d => { kingStep(d); d.rules = [{ when: { on: 'fromMove', n: 10 }, does: { a: 'movesLike', as: 'rook' } }]; }))] },
  { id: 'A5c', motion: 'reveal', title: 'A5 "When…" reveal: next to your king', say: 'Next to your king, it also moves like a knight. The king comes in beside it, and the knight\'s squares light.',
    states: [state(design('maester', d => { kingStep(d); d.rules = []; })), state(design('maester', d => { kingStep(d); d.rules = [{ when: { on: 'near', who: 'king' }, does: { a: 'movesLike', as: 'knight' } }]; }))] },
];

const css = readdirSync('dist/assets').filter(f => f.endsWith('.css')).map(f => readFileSync(`dist/assets/${f}`, 'utf8')).join('\n');
const motion = readFileSync(`${OUT}/motion-a.js`, 'utf8').replace(/^export /gm, '');

const INLINE = Object.fromEntries([...new Set(JSON.stringify(SCENES).match(/ui\/[\w/.-]+\.webp/g))].map(f => [f, dataUri(`public/${f}`)]));
/** The first state of each card, drawn into the page with its art inlined: it shows without scripts. */
const fixArt = (h: string): string => Object.entries(INLINE).reduce((t, [f, uri]) => t.replaceAll('./' + f, uri), h);
const page = `<!doctype html>
<html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Workshop motion, Set A</title>
<style>${inline(css)}
html, body { height: auto; overflow: auto; }
body { margin: 0; background: var(--parchment); color: var(--ink); font-family: var(--font-body, 'Alegreya Sans', sans-serif); font-variant-numeric: lining-nums; }
main { max-width: 1180px; margin: 0 auto; padding: 16px; }
h1 { font-family: var(--font-display); margin: 8px 0 4px; } .lead { margin: 0 0 12px; max-width: 70ch; }
.bar { display: flex; gap: 8px; align-items: center; margin-bottom: 12px; flex-wrap: wrap; }
.bar button, .card button.play { width: auto; min-height: 44px; padding: 6px 16px; }
.bar button[aria-pressed="true"] { color: var(--vellum); background: var(--accent); }
.note { margin: 0 0 16px; padding: 10px 14px; border-radius: 8px; background: var(--vellum); border: 1px solid var(--stone-300); max-width: 70ch; }
h2.rec { font-size: var(--fs-lg); margin: 24px 0 8px; }
video { display: block; width: min(100%, 300px); margin: 0 0 16px; border-radius: 12px; border: 1px solid var(--stone-300); }
.cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr)); gap: 16px; }
.card { background: var(--vellum); border: 1px solid var(--stone-300); border-radius: var(--radius-lg, 12px); overflow: hidden; box-shadow: var(--shadow-card); transition: box-shadow .2s; }
.card.now { box-shadow: 0 0 0 3px var(--accent), var(--shadow-card); }
.card .ws-stage { --model: 190px; --gut: 16px; grid-template-columns: minmax(0, 1fr); grid-template-areas: 'model' 'info'; padding: 20px 20px 16px; gap: 10px; }
.card .ws-stats, .card .g-mark { display: block; }
.card .ws-gauge { margin-bottom: 14px; }
.card h2 { font-size: var(--fs-lg); margin: 12px 16px 4px; } .card p.say { margin: 0 16px 12px; font-size: var(--fs-sm); }
.card button.play { margin: 0 16px 16px; min-height: 44px; }
:root[data-pace='off'] * { transition: none !important; }
.mo-ring { position: absolute; left: 50%; bottom: 34%; width: 70%; aspect-ratio: 1; border: 3px solid #e9c071; border-radius: 50%; pointer-events: none; box-shadow: 0 0 16px #e9c071; }
</style></head><body><main>
<h1>Workshop motion, Set A</h1>
<p class="lead">The model reacts to each change. The page plays every motion in turn, again and again: the lit card is the one that moves. Tap Play on a card to play only that one. Each motion lasts at most 600 ms, then the still picture stays. Slow view stretches the time 4 times, only to look at it here; the game never runs slow.</p>
<noscript><p class="note">This viewer runs no scripts, so nothing moves here. Open the file in Chrome or Safari, or watch the video below (motion-phone.webm, in the same folder).</p></noscript>
<p class="note" id="rm" hidden>Your device asks for reduced motion, so nothing moves. Turn it off in the system settings to see the motion, or watch the video below.</p>
<div class="bar" role="group" aria-label="Playback" hidden><button type="button" id="loop" aria-pressed="true">Play all: on</button><button type="button" id="slow" aria-pressed="false">Slow view: off</button>
<b>Speed:</b> <button type="button" data-pace="normal" aria-pressed="true">Normal</button><button type="button" data-pace="fast" aria-pressed="false">Fast</button><button type="button" data-pace="off" aria-pressed="false">Off</button></div>
<div class="cards">${SCENES.map(s => `<div class="card" id="${s.id}"><section class="ws-stage"><div class="ws-model-box">${fixArt(s.states[0].model)}</div><div class="ws-info"><p class="ws-worth">${s.states[0].worth}</p><div class="ws-gauge-box">${s.states[0].gauge}</div></div></section><h2>${s.title}</h2><p class="say">${s.say}</p><button type="button" class="play">Play</button></div>`).join('')}</div>
<h2 class="rec">The recording (motion-phone.webm)</h2>
<video src="motion-phone.webm" controls muted loop playsinline preload="metadata" aria-label="A recording of the motions on a phone"></video>
</main>
<script type="module">
${motion}
const ART = ${JSON.stringify(INLINE)};
/** Each figure is inlined once: the markup names it by path. */
const fix = h => Object.entries(ART).reduce((t, [f, uri]) => t.replaceAll('./' + f, uri), h);
const SCENES = ${JSON.stringify(SCENES)};
const root = document.documentElement, wait = ms => new Promise(r => setTimeout(r, ms));
document.querySelector('.bar').hidden = false;
if (matchMedia('(prefers-reduced-motion: reduce)').matches) document.getElementById('rm').hidden = false;
for (const b of document.querySelectorAll('[data-pace]')) b.onclick = () => {
  root.dataset.pace = b.dataset.pace;
  if (still()) document.getAnimations().forEach(a => a.cancel()); // Off stops the ember loop too
  for (const c of document.querySelectorAll('[data-pace]')) c.setAttribute('aria-pressed', String(c === b));
};
const slow = document.getElementById('slow');
slow.onclick = () => { const on = root.dataset.slow !== '4'; root.dataset.slow = on ? '4' : ''; slow.setAttribute('aria-pressed', String(on)); slow.textContent = 'Slow view: ' + (on ? 'on' : 'off'); };
const play = [];
for (const s of SCENES) {
  const card = document.getElementById(s.id), box = card.querySelector('.ws-model-box'), gaugeBox = card.querySelector('.ws-gauge-box');
  let i = 0;
  const draw = () => { box.innerHTML = fix(s.states[i].model); gaugeBox.innerHTML = s.states[i].gauge; card.querySelector('.ws-worth').textContent = s.states[i].worth; };
  const go = () => {
    const before = box.querySelector('.ws-model').cloneNode(true), gaugeBefore = gaugeBox.querySelector('.ws-gauge').cloneNode(true);
    i ^= 1; draw();
    const model = box.querySelector('.ws-model'), gauge = gaugeBox.querySelector('.ws-gauge');
    if (s.motion === 'equip') equip(model, s.gait[i], before);
    if (s.motion === 'pop') floorPop(model, before);
    if (s.motion !== 'equip' && s.motion !== 'pop') gaugeEase(gauge, gaugeBefore, model, before);
    if (s.motion === 'overload' && s.states[i].op && !s.states[i ^ 1].op) overload(model);
    if (s.motion === 'reveal') reveal(model, before);
  };
  card.querySelector('.play').onclick = go;
  play.push({ card, go });
}
// Play all: each card in turn, forward and back, with a pause to see the still picture after each motion.
const loop = document.getElementById('loop');
let looping = true;
loop.onclick = () => { looping = !looping; loop.setAttribute('aria-pressed', String(looping)); loop.textContent = 'Play all: ' + (looping ? 'on' : 'off'); };
(async () => {
  await wait(600);
  for (let k = 0; ; k = (k + 1) % play.length) {
    while (!looping) await wait(200);
    const { card, go } = play[k], t = +root.dataset.slow || 1;
    for (const c of document.querySelectorAll('.card')) c.classList.toggle('now', c === card);
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await wait(500);
    go(); await wait(1400 * t + (card.id === 'A4' ? 1600 : 0));
    go(); await wait(1200 * t);
  }
})();
</script></body></html>
`;
writeFileSync(`${OUT}/motion-preview.html`, page);
console.log(`${OUT}/motion-preview.html: ${(page.length / 1024).toFixed(0)} kB`);

if (process.argv.includes('--videos')) {
  const browser = await chromium.launch({ headless: true, channel: process.env.PLAYABLE_BROWSER || 'chrome' });
  for (const [name, w, h] of [['phone', 390, 844], ['desktop', 1280, 900]] as const) {
    const dir = `${OUT}/.video-${name}`;
    rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, recordVideo: { dir, size: { width: w, height: h } }, isMobile: w < 721, hasTouch: w < 721 });
    const p = await ctx.newPage();
    const errors: string[] = [];
    p.on('pageerror', e => errors.push(e.message));
    await p.goto(`file://${process.cwd()}/${OUT}/motion-preview.html`);
    await p.waitForTimeout(1200);
    // Play all runs on open: one full round of every card.
    await p.waitForTimeout(600 + SCENES.length * 3100 + 1600 + 1500);
    await ctx.close();
    renameSync(`${dir}/${readdirSync(dir)[0]}`, `${OUT}/motion-${name}.webm`);
    rmSync(dir, { recursive: true });
    if (errors.length) throw new Error(errors.join('\n'));
    console.log(`${OUT}/motion-${name}.webm`);
  }
  await browser.close();
}
