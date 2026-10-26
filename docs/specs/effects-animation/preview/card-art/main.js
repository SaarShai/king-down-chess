import { available } from './availability.js';
import { art as cardArtUrl } from '../../../../../src/account-game/art';

const cards = {
  freeze: { title:'Freeze', file:'freeze', description:'Frost travels through the existing ice. Snow and cold mist move around the perfectly still knight.' },
  skylift: { title:'Sky Lift', file:'skylift', description:'Three painted rocks rise through the wind around the suspended towers.' },
  mimic: { title:'Mimic', file:'mimic', description:'Fuller painted clouds cross the moon. The horse-shaped shadow moves independently of the cloaked figure.' },
  haste: { title:'Haste', file:'haste', description:'Golden dust races around the rook while its red banner catches the wind.' },
  flight: { title:'Flight', file:'flight', description:'The painted ribbon and wind sweep around the floating bishop.' },
  salvation: { title:'Salvation', file:'salvation', description:'Mist gathers at the grave and soft light rises through it.' },
};
const $ = id => document.getElementById(id);
const query = matchMedia('(prefers-reduced-motion: reduce)');
const frame = document.createElement('canvas');
frame.width = frame.height = 512;
const context = frame.getContext('2d');
const views = ['art','crop','coin-desktop','coin-touch'].map(id => $(id));
const cache = new Map();
let sample = new URLSearchParams(location.search).get('card');
if (!available.includes(sample)) sample = available[0] || 'freeze';
let ready = false, playing = false, time = 0, mode = 'idle', variant = 'animated';
let reduced = query.matches, speed = 1, inView = true, raf = 0, last = 0, painted = 0, revision = 0, frames = 0;
let art, effect;
const duration = () => mode === 'idle' ? 8 : 3.2;

function state() { return { ready, sample, playing, time, progress:time/duration(), mode, variant, reduced, speed, frames }; }

function controls() {
  for (const id of Object.keys(cards)) {
    $(`choose-${id}`).disabled = !available.includes(id);
    $(`choose-${id}`).setAttribute('aria-pressed', String(id === sample));
    $(`choose-${id}`).title = available.includes(id) ? `Replay ${cards[id].title}` : 'Preview in development';
  }
  for (const id of ['original','animated']) $(id).setAttribute('aria-pressed', String(id === variant));
  for (const id of ['idle','awaken']) $(id).setAttribute('aria-pressed', String(id === mode));
  for (const id of ['original','animated','idle','awaken','replay']) $(id).disabled = !ready;
  $('play').disabled = !ready || reduced || variant === 'original';
  $('play').textContent = playing ? 'Pause' : 'Play';
  $('scrub').disabled = !ready || reduced || variant === 'original';
  $('scrub').value = String(Math.round(time/duration()*1000));
  $('time').textContent = `${time.toFixed(2)} s`;
  $('reduced').checked = reduced;
  $('title').textContent = cards[sample].title;
  $('description').textContent = cards[sample].description;
  $('phase').textContent = !ready ? 'Loading artwork…' : variant === 'original' ? 'Original painting' : reduced ? 'Still artwork · reduced motion' : `${mode === 'idle' ? 'Gentle loop' : 'Awakening'} · ${playing ? 'playing' : time === duration() ? 'complete' : 'paused'}`;
}

function draw() {
  if (ready) {
    context.save();
    context.resetTransform();
    context.clearRect(0,0,512,512);
    if (variant === 'original' || reduced) context.drawImage(art,0,0,512,512);
    else effect.draw(context, { time, mode, reduced });
    context.restore();
    for (const canvas of views) {
      const c = canvas.getContext('2d');
      const scale = Math.max(canvas.width/512,canvas.height/512);
      c.clearRect(0,0,canvas.width,canvas.height);
      c.drawImage(frame,(canvas.width-512*scale)/2,(canvas.height-512*scale)/2,512*scale,512*scale);
    }
    $('art').setAttribute('aria-label',`${cards[sample].title}: ${variant === 'original' ? 'original painting' : cards[sample].description}`);
    frames++;
  }
  controls();
}

function stop() { playing = false; cancelAnimationFrame(raf); raf = 0; last = 0; painted = 0; }
function tick(now) {
  if (!playing) return;
  if (document.hidden || !inView || reduced) { stop(); controls(); return; }
  if (last) time += Math.min((now-last)/1000,.1)*speed;
  last = now;
  if (time >= duration()) {
    if (mode === 'idle') time %= duration();
    else { time = duration(); stop(); }
  }
  if (!painted || now-painted >= 1000/30 || !playing) { draw(); painted = now; }
  if (playing) raf = requestAnimationFrame(tick);
}
function play() {
  if (!ready || reduced || variant === 'original' || document.hidden || !inView) return;
  if (playing) { stop(); controls(); return; }
  if (time === duration()) time = 0;
  playing = true; last = 0; painted = 0; controls(); raf = requestAnimationFrame(tick);
}
function replay() { stop(); time = 0; variant = 'animated'; draw(); play(); }
function seek(progress) {
  if (!Number.isFinite(progress)) return;
  stop(); time = Math.max(0,Math.min(1,progress))*duration(); draw();
}
function setVariant(value) {
  if (!['original','animated'].includes(value)) return;
  stop(); variant = value; draw();
}
function setMode(value) {
  if (!['idle','awaken'].includes(value)) return;
  stop(); mode = value; time = 0; draw();
}
function setReduced(value) { stop(); reduced = value; draw(); }

async function select(id, autoplay = false) {
  if (!available.includes(id)) return;
  stop(); const token = ++revision; ready = false; sample = id; time = 0;
  if (id === 'mimic') mode = 'idle';
  $('loading').hidden = false; $('loading').textContent = `Loading ${cards[id].title}…`; controls();
  try {
    if (!cache.has(id)) {
      cache.set(id, (async () => {
        const image = new Image(); image.src = cardArtUrl(`ui/cards/${cards[id].file}.webp`);
        const [,module] = await Promise.all([image.decode(), import(`./${id}/effect.js`)]);
        return { image, renderer:module.createEffect(image) };
      })());
    }
    const loaded = await cache.get(id);
    if (token !== revision) return;
    art = loaded.image; effect = loaded.renderer; ready = true;
    $('loading').hidden = true;
    const url = new URL(location.href); url.searchParams.set('card',id); history.replaceState(null,'',url);
    draw(); if (autoplay) { variant = 'animated'; draw(); play(); }
  } catch (error) {
    cache.delete(id);
    if (token !== revision) return;
    $('loading').textContent = 'This artwork could not load. Choose the card to try again.';
    $('phase').textContent = 'Preview unavailable'; console.error(error);
  }
}

for (const id of Object.keys(cards)) $(`choose-${id}`).onclick = () => select(id,true);
for (const value of ['original','animated']) $(value).onclick = () => setVariant(value);
for (const value of ['idle','awaken']) $(value).onclick = () => { setMode(value); replay(); };
$('replay').onclick = replay;
$('play').onclick = play;
$('scrub').oninput = event => seek(Number(event.target.value)/1000);
$('speed').onchange = event => { speed = Number(event.target.value); last = 0; };
$('reduced').onchange = event => setReduced(event.target.checked);
query.addEventListener('change', () => setReduced(query.matches));
document.addEventListener('visibilitychange', () => { if (document.hidden) { stop(); controls(); } });
new IntersectionObserver(entries => { inView = entries[0].isIntersecting; if (!inView) { stop(); controls(); } }, { threshold:.05 }).observe($('art'));
window.addEventListener('pagehide', stop);
window.cardArtStudy = { getState:state, select, seek, setVariant, setMode, frame:() => frame.toDataURL() };
controls(); if (available.length) select(sample,true);
