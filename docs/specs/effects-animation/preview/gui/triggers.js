import { UiMotion } from '/src/ui/motion.ts';
import { art } from '../../../../../src/account-game/art';
const $ = id => document.getElementById(id);
const reduce = $('reduce');
reduce.checked = matchMedia('(prefers-reduced-motion: reduce)').matches;
const motion = new UiMotion(() => !reduce.checked, () => 'normal');
reduce.onchange = () => { if (reduce.checked) motion.cancel(); };
let left = 15000, deadline = 0, running = false, warning = false, interval;
function paintClock() {
  if (running) left = Math.max(0, deadline - performance.now());
  const seconds = Math.ceil(left / 1000);
  $('seconds').textContent = `00:${String(seconds).padStart(2, '0')}`;
  document.querySelector('.timer-fill').style.transform = `scaleX(${left / 15000})`;
  document.querySelector('.timer-fill').style.background = seconds <= 10 ? 'var(--accent)' : 'var(--gold-ink)';
  $('seconds').style.color = seconds <= 10 ? 'var(--accent)' : 'var(--ink)';
  if (running && seconds <= 10 && !warning) {
    warning = true;
    motion.play(document.querySelector('.timer-ring'), [{opacity: 0, scale: '1'}, {opacity: 1, scale: '1.045', offset: .5}, {opacity: 0, scale: '1'}], 700);
  }
  if (running && left === 0) {
    running = false; clearInterval(interval);
    $('clock-status').textContent = 'Time is up.'; $('clock-heading').textContent = 'The clock has stopped.';
    motion.reveal($('clock-status'), 350, 8);
  } else if (running) $('clock-status').textContent = seconds <= 5 ? 'Make your move.' : seconds <= 10 ? '10 seconds left.' : 'Your clock is running.';
  $('start-clock').disabled = running;
  $('start-clock').textContent = running ? 'Running' : left === 15000 || left === 0 ? 'Start 15 seconds' : 'Resume';
  $('pause-clock').disabled = !running;
}
$('start-clock').onclick = () => {
  if (left === 0) { left = 15000; warning = false; }
  running = true; deadline = performance.now() + left;
  $('clock-heading').textContent = 'Your turn.';
  paintClock(); clearInterval(interval); interval = setInterval(paintClock, 50);
};
$('pause-clock').onclick = () => { paintClock(); running = false; clearInterval(interval); $('clock-status').textContent = 'Paused.'; paintClock(); };
$('reset-clock').onclick = () => { clearInterval(interval); running = false; left = 15000; warning = false; motion.cancel(); $('clock-status').textContent = 'Ready when you are.'; $('clock-heading').textContent = 'Your turn.'; paintClock(); };
function resetHand() {
  motion.cancel();
  $('hand').innerHTML = ['Freeze', 'Strike', 'Haste', 'Flight'].map(name => `<div class="study-card"><div class="card-picture"><img src="${art(`ui/cards/${name.toLowerCase()}.webp`)}" alt=""><span class="card-tick">✓</span></div><b>${name}</b><small class="card-state">Ready</small></div>`).join('');
  $('spend-card').disabled = false; $('spend-card').textContent = 'Use Freeze'; $('refill-card').disabled = true;
  $('card-status').textContent = 'Freeze is ready. The other three cards keep their place.';
}
$('spend-card').onclick = () => {
  const card = $('hand').firstElementChild;
  card.querySelector('.card-picture').style.filter = 'grayscale(1)'; card.querySelector('.card-tick').style.opacity = 1;
  card.querySelector('.card-state').textContent = 'Used';
  motion.play(card, [{transform: 'translateY(-8px) scale(1)'}, {transform: 'translateY(0) scale(.96)'}], 400);
  $('card-status').textContent = `${card.querySelector('b').textContent} is spent. Refill this slot when ready.`;
  $('spend-card').disabled = true; $('refill-card').disabled = false;
};
$('refill-card').onclick = () => {
  const card = $('hand').firstElementChild, name = card.querySelector('b').textContent === 'Freeze' ? 'Leap' : 'Freeze';
  card.querySelector('img').src = art(`ui/cards/${name.toLowerCase()}.webp`); card.querySelector('b').textContent = name;
  card.querySelector('.card-state').textContent = 'Ready'; card.querySelector('.card-picture').style.filter = 'none'; card.querySelector('.card-tick').style.opacity = 0;
  motion.play(card, [{opacity: 0, transform: 'translateY(25px) rotate(-6deg)'}, {opacity: 1, transform: 'translateY(0) rotate(0)'}], 500);
  $('card-status').textContent = `${name} fills the spent slot. Your other cards stay unchanged.`;
  $('spend-card').disabled = false; $('spend-card').textContent = `Use ${name}`; $('refill-card').disabled = true;
};
$('reset-hand').onclick = resetHand;
document.addEventListener('visibilitychange', () => { if (!document.hidden) paintClock(); });
window.addEventListener('pagehide', () => { clearInterval(interval); motion.dispose(); }, {once: true});
resetHand(); paintClock();
