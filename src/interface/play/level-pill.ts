import { choiceGroup } from '../ui/kit.js';
import { LEVELS } from './new-game';
import type { Level } from './saved';
import { text } from './texts';
import { at, burst, edgeLight, ease, later, onFrame, pulse, reducedMotion, sound, Spring, tween, type Effect } from './fx';

export function levelPill(value: Level, describe: (value: Level) => string, onChange: (value: Level) => void): HTMLElement {
  const pill = choiceGroup(text.level, LEVELS.map(level => ({ value: level, label: text[level] })), value);
  pill.classList.add('level-pill');
  pill.querySelector('legend')!.classList.add('kd-sr');
  const track = pill.querySelector<HTMLElement>('.kd-segments')!;
  const controls = [...track.querySelectorAll<HTMLButtonElement>('button')];
  const thumb = document.createElement('span'); thumb.className = 'level-thumb'; thumb.setAttribute('aria-hidden', 'true');
  const line = document.createElement('p'); line.className = 'level-line'; line.setAttribute('aria-live', 'polite');
  track.prepend(thumb); pill.append(line);

  let current = LEVELS.indexOf(value), glide: Effect | undefined, cue: Effect | undefined, sheen: Effect | undefined;
  let note: Effect | undefined, sparks: Effect | undefined, edge: Effect | undefined;
  let drag: { id: number; x: number; stop: number; active: boolean } | null = null;
  const spring = new Spring(current, 340, 17);
  const show = (level: Level) => { pill.dataset.level = String(LEVELS.indexOf(level) + 1); line.textContent = describe(level); };
  const move = (x: number, stretch = 0) => {
    thumb.style.transform = `translateX(${x * 100}%) scaleX(${1 + stretch})`;
    thumb.style.setProperty('--pill-warmth', `${Math.min(100, Math.max(0, x - 1) * 100)}%`);
  };
  const clearSheen = () => thumb.style.removeProperty('--pill-sheen');
  const rest = () => { spring.snap(current); thumb.style.removeProperty('transform'); thumb.style.removeProperty('--pill-warmth'); };
  const settle = () => {
    glide?.cancel();
    spring.to = current;
    glide = onFrame(dt => {
      if (!pill.isConnected) return false;
      move(spring.step(dt), Math.min(.045, Math.abs(spring.v) * .004));
      if (spring.still) return false;
    }, rest);
  };
  show(value);
  pill.addEventListener('kd-change', event => {
    const next = (event as CustomEvent<{ value: Level }>).detail.value, stop = LEVELS.indexOf(next);
    if (current === stop) { settle(); return; }
    current = stop;
    cue?.cancel(); sheen?.cancel(); note?.cancel(); edge?.cancel(); sparks?.cancel(); clearSheen();
    show(next); onChange(next); settle();
    sound(stop === 0 ? 'tick' : stop === 1 ? 'clink' : 'fire');
    pulse(stop === 0 ? 'tick' : stop === 1 ? 'light' : 'heavy');
    if (reducedMotion()) return;
    line.style.opacity = '0';
    note = tween(160, k => {
      line.style.opacity = String(k);
      line.style.transform = `translateY(${5 * (1 - k)}px)`;
    }, { done: () => { line.style.removeProperty('opacity'); line.style.removeProperty('transform'); } });
    cue = later(130, () => {
      if (!pill.isConnected || reducedMotion()) return;
      sheen = tween(340, k => thumb.style.setProperty('--pill-sheen', `${-30 + k * 160}%`), { curve: ease.io3, done: clearSheen });
      if (stop === 2) {
        edge = edgeLight(track, { ms: 600, width: 2 });
        sparks = burst('sparks', at(thumb, .5, 0), { ms: 900, count: 10, rise: 70 });
      }
    });
  });

  track.addEventListener('pointerdown', event => {
    if (event.button !== 0 || drag) return;
    drag = { id: event.pointerId, x: event.clientX, stop: current, active: false };
  });
  track.addEventListener('pointermove', event => {
    if (drag?.id !== event.pointerId) return;
    if (!drag.active) {
      if (Math.abs(event.clientX - drag.x) < 6) return;
      track.setPointerCapture(event.pointerId); drag.active = true; glide?.cancel();
    }
    const box = track.getBoundingClientRect();
    const position = 3 * (event.clientX - box.left) / box.width - .5;
    const x = Math.max(0, Math.min(2, position)), stop = Math.round(x);
    if (stop !== drag.stop) { drag.stop = stop; sound('tick'); pulse('tick'); }
    spring.snap(x + (stop - x) * .7);
    move(spring.x, reducedMotion() ? 0 : -Math.min(.045, Math.abs(position - x) * .09));
  });
  track.addEventListener('pointerup', event => {
    if (drag?.id !== event.pointerId) return;
    const { active, stop } = drag; drag = null;
    if (active) { controls[stop].focus(); controls[stop].click(); }
  });
  for (const type of ['pointercancel', 'lostpointercapture', 'pointerleave']) track.addEventListener(type, event => {
    if (drag?.id !== (event as PointerEvent).pointerId || type === 'pointerleave' && drag.active) return;
    drag = null; settle();
  });
  return pill;
}
