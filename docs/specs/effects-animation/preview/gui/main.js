import { otherSamples } from './samples.js';
import { objectSamples } from './objects.js';
import { arrivalSamples } from './arrivals.js';
document.body.classList.toggle('embedded', window.parent !== window);
const $ = selector => document.querySelector(selector);
const scene = $('#scene');
const clamp = n => Math.max(0, Math.min(1, n));
const out = n => 1 - (1 - n) ** 3;
const phase = (time, start, length = 420) => out(clamp((time - start) / length));
const style = (selector, props) => scene.querySelectorAll(selector).forEach(node => Object.assign(node.style, props));
const reveal = (selector, time, start, length = 420, distance = 18) => {
  const p = phase(time, start, length);
  style(selector, { opacity: p, transform: `translateY(${(1 - p) * distance}px)` });
};
const image = (path, cls = '', alt = '') => `<img class="${cls}" src="/ui/${path}.webp" alt="${alt}">`;
const samples = [
  {
    id: 'victory', name: 'Victory', group: 'Hero moments', duration: 3800,
    phases: [[0, 'The result holds'], [450, 'King Down'], [1300, 'A quiet victory'], [1350, 'Moves to look at again']],
    note: 'A short breath, one large title, then a soft settle. The live final-blow replay and fallen king come before this UI; this study begins at the result reveal.',
    html: `<div class="result victory"><div class="soft-ray"></div>${image('kings/frost', 'hero-art')}${image('kings/shadow-b', 'hero-art dark')}${image('emblems/frost', 'result-emblem')}<p class="result-label">White wins</p><h2 class="result-title">King Down</h2><div class="gold-rule"></div><p class="result-copy">A kingdom won. A game to remember.</p><div class="result-recap"><div class="recap-tile"><small>Move 18</small>A path opens</div><div class="recap-tile"><small>Move 24</small>The king exposed</div><div class="recap-tile"><small>Move 27 · Final blow</small>The last capture</div></div></div>`,
    render(t) {
      const p = phase(t, 450, 620);
      style('.result-title', {opacity: p, transform: `translateY(${(1-p)*8}px) scale(${1.12-.12*p})`, filter: `blur(${(1-p)*2}px)`});
      reveal('.result-emblem', t, 180, 700, 12); reveal('.result-label', t, 750, 400, 5);
      style('.gold-rule', {opacity: phase(t, 950, 500), transform: `scaleX(${phase(t, 950, 650)})`});
      reveal('.result-copy', t, 1350, 500, 8);
      scene.querySelectorAll('.recap-tile').forEach((node, i) => { const p = phase(t, 1350 + i * 100, 400); Object.assign(node.style, {opacity: p, transform: `translateY(${(1-p)*15}px)`}); });
      style('.hero-art', {opacity: .15 * phase(t, 300, 1100)});
      style('.soft-ray', {opacity: Math.sin(clamp((t-350)/2200)*Math.PI) * .75});
    }
  },
  {
    id: 'timer', name: 'Timer · warning & expiry', group: 'Hero moments', duration: 8500,
    phases: [[0, '15 seconds · sample'], [1200, 'Ten seconds · one warning'], [3800, 'The last five seconds'], [6500, 'Time expires · readable result']],
    note: 'One firm border beat marks the warning. The digits and line carry the countdown after it. At zero, the clock gives way to a clear outcome. Mocked seconds; the live game currently shows coarse hours and minutes.',
    html: `<div class="timer-study"><p class="result-label">Your turn</p><h2 class="timer-label">Find your next move.</h2><div class="timer-clock"><span class="timer-ring"></span><small>Time remaining · sample</small><strong class="time-value">00:15</strong><div class="timer-track"><div class="timer-fill"></div></div></div><div class="timer-alert"> </div><p class="timer-caption">Seconds are sped up for this study.</p></div>`,
    render(t) {
      const seconds = t < 1200 ? 15 - Math.floor(t / 240) : t < 3800 ? 10 - Math.floor((t - 1200) / 520) : Math.max(0, 5 - Math.floor((t - 3800) / 540));
      const expired = t >= 6500, warn = t >= 1200;
      $('.time-value').textContent = `00:${String(expired ? 0 : seconds).padStart(2, '0')}`;
      $('.timer-alert').textContent = expired ? 'Time is up. Black wins.' : warn ? seconds <= 5 ? 'Make your move.' : '10 seconds left.' : ' ';
      $('.timer-label').textContent = expired ? 'The clock has stopped.' : 'Find your next move.';
      style('.timer-fill', {transform: `scaleX(${expired ? 0 : seconds / 15})`, background: warn ? 'var(--accent)' : 'var(--gold-ink)'});
      style('.time-value', {color: warn ? 'var(--accent)' : 'var(--ink)'});
      const beat = t >= 1200 && t < 1900 ? Math.sin((t - 1200)/700*Math.PI) : 0;
      style('.timer-ring', {opacity: beat, transform: `scale(${1 + .045 * beat})`});
      style('.timer-clock', {borderColor: warn ? 'var(--accent)' : 'var(--stone-300)', transform: `translateY(${-2 * beat}px)`});
      style('.timer-alert', {opacity: warn ? 1 : 0, transform: expired ? `translateY(${(1-phase(t,6500,350))*8}px)` : 'none'});
    }
  }
];

samples.push(...otherSamples({ $, scene, phase, style, reveal, image, clamp }));
samples.push(...objectSamples({ $, scene, phase, style, image, clamp }));
samples.push(...arrivalSamples({ $, scene, phase, style, image, clamp }));

const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
let active = samples[0], time = 0, playing = false, reduced = motionPreference.matches, speed = 1, raf = 0, last = 0;
const nav = $('#sample-nav'), picker = $('#sample-select');
let group = '';
for (const [i, sample] of samples.entries()) {
  if (sample.group !== group) { group = sample.group; nav.insertAdjacentHTML('beforeend', `<p class="nav-group">${group}</p>`); }
  const button = document.createElement('button'); button.type = 'button'; button.dataset.sample = sample.id; button.innerHTML = `<span class="nav-number">${String(i+1).padStart(2,'0')}</span>${sample.name}`; button.onclick = () => select(sample.id); nav.append(button);
  const option = document.createElement('option'); option.value = sample.id; option.textContent = `${String(i+1).padStart(2,'0')} · ${sample.name}`; picker.append(option);
}
$('#sample-count').textContent = `${samples.length} studies`;
function render() {
  document.body.classList.toggle('reduced-motion', reduced);
  active.render(time);
  $('#scrub').value = String(time / active.duration * 1000);
  $('#scrub').setAttribute('aria-valuetext', `${(time/1000).toFixed(1)} of ${(active.duration/1000).toFixed(1)} seconds`);
  $('#elapsed').textContent = `${(time/1000).toFixed(1)} / ${(active.duration/1000).toFixed(1)} s`;
  $('#phase').textContent = reduced ? 'Reduced motion · settled state' : [...active.phases].reverse().find(([start]) => time >= start)?.[1] ?? '';
  $('#play').textContent = playing ? 'Pause' : 'Play'; $('#play').disabled = reduced;
  $('#replay').disabled = reduced; $('#scrub').disabled = reduced;
}
function stop() { playing = false; cancelAnimationFrame(raf); render(); }
function frame(now) {
  if (!playing) return;
  time = Math.min(active.duration, time + Math.min(now-last, 80)*speed); last=now;
  if (time === active.duration) playing = false;
  render(); if (playing) raf=requestAnimationFrame(frame);
}
function play() {
  if (reduced || document.hidden) return;
  if (time >= active.duration) time=0;
  cancelAnimationFrame(raf); playing=true; last=performance.now(); render(); raf=requestAnimationFrame(frame);
}
function select(id) {
  const next = samples.find(sample => sample.id === id); if (!next) throw new Error(`Unknown study: ${id}`);
  cancelAnimationFrame(raf); playing=false; active=next; time=reduced ? active.duration : 0;
  scene.innerHTML=active.html; scene.dataset.sample=id;
  $('#sample-title').textContent=active.name; $('#category').textContent=active.group; $('#rationale').textContent=active.note;
  nav.querySelectorAll('button').forEach(button=>button.setAttribute('aria-current', String(button.dataset.sample===id)));
  picker.value=id; render(); if (!reduced) play();
}
function seek(progress) { if (!Number.isFinite(progress)) throw new Error('Progress must be finite'); stop(); time=reduced ? active.duration : clamp(progress)*active.duration; render(); }
$('#play').onclick=()=>playing ? stop() : play();
$('#replay').onclick=()=>{time=0;play();};
$('#scrub').oninput=event=>seek(Number(event.target.value)/1000);
$('#speed').onchange=event=>{speed=Number(event.target.value);};
function setReduced(value) {
  reduced=value;
  $('#reduce').checked=reduced;
  time=reduced?active.duration:0;
  stop();
}
$('#reduce').checked=reduced;
$('#reduce').onchange=event=>setReduced(event.target.checked);
motionPreference.addEventListener('change',event=>setReduced(event.matches));
picker.onchange=event=>select(event.target.value);
scene.addEventListener('click',event=>{const target=event.target.closest('[data-jump]');if(target&&!reduced){time=Number(target.dataset.jump);play();}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
document.addEventListener('keydown',event=>{
  if (event.target instanceof Element && event.target.closest('input,select,button,a') || event.altKey || event.metaKey || event.ctrlKey) return;
  if (event.code==='Space') {event.preventDefault();playing?stop():play();}
  if (event.key.toLowerCase()==='r' && !reduced) {time=0;play();}
  if (event.key==='ArrowRight'||event.key==='ArrowLeft') {event.preventDefault();seek(time/active.duration+(event.key==='ArrowRight'?.05:-.05));}
});
window.effectsStudy={ready:false,select,seek,getState:()=>({id:active.id,progress:time/active.duration,playing,itemCount:samples.length}),samples:samples.map(({id,name,group,duration})=>({id,name,group,duration}))};
const requested = new URLSearchParams(location.search).get('sample');
select(samples.some(sample => sample.id === requested) ? requested : 'victory');
const sources = new Set(samples.flatMap(sample => [...sample.html.matchAll(/src="([^"]+)"/g)].map(match => match[1])));
sources.add('/ui/cards/leap.webp');
Promise.all([document.fonts.ready, ...[...sources].map(src => {
  const asset = new Image(); asset.src = src; return asset.decode();
})]).then(() => { window.effectsStudy.ready = true; }).catch(error => { window.effectsStudy.error = String(error); });
