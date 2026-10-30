import type { UiMotion } from './motion';
import './object-motion.css';

const clamp = (n: number) => Math.max(0, Math.min(1, n));
const phase = (t: number, start: number, length: number) => 1 - (1 - clamp((t - start) / length)) ** 3;
const frames = (duration: number, draw: (t: number) => Keyframe) => Array.from({ length: 25 }, (_, i) => ({ ...draw(duration * i / 24), offset: i / 24 }));
function layer(host: Element, className: string, words = '') {
  const el = document.createElement('span'); el.className = className; el.textContent = words; el.setAttribute('aria-hidden', 'true'); host.append(el); return el;
}
function transient(motion: UiMotion, el: HTMLElement, keys: Keyframe[], duration: number, delay: number, at: number) {
  const animation = motion.play(el, keys, duration, delay, at, 'linear');
  if (animation) void animation.finished.then(() => el.remove(), () => el.remove()); else el.remove();
}
function dust(motion: UiMotion, host: Element, at: number, delay: number, gold = false) {
  const el = layer(host, 'ui-object-dust');
  for (let i = 0; i < (gold ? 9 : 7); i++) {
    const grain = layer(el, 'ui-object-grain'), angle = (i * 137.5 - (gold ? 85 : 110)) * Math.PI / 180, duration = gold ? 470 : 560;
    transient(motion, grain, frames(duration, t => {
      const p = clamp(t / duration);
      return { opacity: Math.sin(p * Math.PI) * (gold ? .8 : .65), transform: `translate(${Math.cos(angle) * (gold ? 35 : 34) * p}px,${Math.sin(angle) * (gold ? 35 : 27) * p - (gold ? 12 : 8) * p}px) rotate(${i * (gold ? 39 : 29)}deg)` };
    }), duration, delay + i * (gold ? 23 : 19), at);
  }
  transient(motion, el, [{ opacity: 1 }, { opacity: 1 }], (gold ? 470 + 8 * 23 : 560 + 6 * 19), delay, at);
}

/** A confirmed ready flag keeps its seal; only a live false-to-true change stamps it. */
export function readySeal(motion: UiMotion, host: HTMLElement, ready: boolean, at = -Infinity, temporary = false) {
  let seal = host.querySelector<HTMLElement>('.ui-object-seal');
  if (!ready) { seal?.remove(); return; }
  if (seal) return;
  seal = layer(host, 'ui-object-seal', '✓');
  const keys = frames(300, t => ({ opacity: phase(t, 0, 300), translate: `0 ${(1 - phase(t, 0, 300)) * -6}px` }));
  if (temporary) transient(motion, seal, [...keys.map(k => ({ ...k, offset: Number(k.offset) * .45 })), { opacity: 1, translate: '0 0', offset: .9 }, { opacity: 0, translate: '0 0' }], 672, 0, at);
  else motion.play(seal, keys, 300, 0, at, 'linear');
  const glow = layer(host, 'ui-object-warmth');
  transient(motion, glow, frames(650, t => ({ opacity: Math.sin(clamp(t / 650) * Math.PI) * .5 })), 650, 0, at);
  dust(motion, host, at, 90);
}

export function opponentFound(motion: UiMotion, host: HTMLElement, at: number) {
  motion.play(host.querySelector('h2'), frames(420, t => ({ opacity: phase(t, 0, 420), translate: `0 ${(1 - phase(t, 0, 420)) * 10}px` })), 420, 0, at, 'linear');
  const portrait = host.querySelector<HTMLElement>('.portrait'); if (!portrait) return;
  motion.play(portrait, frames(420, t => ({ opacity: phase(t, 0, 420), translate: `0 ${(1 - phase(t, 0, 420)) * 10}px` })), 420, 0, at, 'linear');
  const glow = layer(portrait, 'ui-object-warmth');
  transient(motion, glow, frames(800, t => ({ opacity: Math.sin(clamp(t / 800) * Math.PI) * .6, scale: String(.8 + .2 * phase(t + 120, 0, 420)) })), 800, 120, at);
  const seal = layer(portrait, 'ui-object-seal', '✓');
  motion.play(seal, frames(260, t => ({ opacity: phase(t, 0, 260), translate: `0 ${(1 - phase(t, 0, 260)) * 4}px` })), 260, 320, at, 'linear');
  dust(motion, portrait, at, 270);
}

export function drawReply(motion: UiMotion, host: HTMLElement, declined: boolean, at: number) {
  if (declined) {
    motion.play(host, frames(340, t => ({ translate: `0 ${2 * Math.sin(phase(t, 0, 340) * Math.PI)}px` })), 340, 0, at, 'linear');
    const mark = layer(host, 'ui-object-reply', '—');
    transient(motion, mark, frames(340, t => ({ opacity: phase(t, 0, 340), translate: `0 ${(1 - phase(t, 0, 340)) * -5}px` })), 340, 0, at);
  } else {
    const light = layer(host, 'ui-object-paper-light');
    transient(motion, light, frames(420, t => ({ opacity: Math.sin(phase(t, 0, 420) * Math.PI) * .7 })), 420, 0, at);
    dust(motion, host, at, 120, true);
  }
}

/** Copy succeeds before the source tiles give their light sweep. */
export function inviteCopied(motion: UiMotion, tiles: HTMLElement, status: HTMLElement, at: number) {
  for (const [i, tile] of [...tiles.children].entries()) {
    const light = layer(tile, 'ui-object-copy-light');
    transient(motion, light, frames(450, t => ({ opacity: Math.sin(clamp(t / 450) * Math.PI) * .65, translate: `${-80 + 160 * clamp(t / 450)}% 0` })), 450, i * 35, at);
  }
  // The existing live region is the copy receipt. Keep its text and size.
  motion.play(status, frames(470, t => ({ opacity: phase(t, 0, 470), translate: `0 ${(1 - phase(t, 0, 470)) * -22}px`, rotate: `${(1 - phase(t, 0, 470)) * -2}deg` })), 470, 280, at, 'linear');
  const check = layer(status, 'ui-object-copy-check');
  transient(motion, check, frames(230, t => ({ opacity: phase(t, 0, 230), translate: `0 ${(1 - phase(t, 0, 230)) * -5}px` })), 230, 670, at);
  dust(motion, status, at, 650);
}
