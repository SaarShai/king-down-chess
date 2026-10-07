/**
 * The approved Set A reactions on the piece card (docs/WORKSHOP.md §5.5): A1 (gait and cross-fade),
 * A4 (shake into overpowered) and A5 (gold ring). The card renders its still state first, then reacts.
 * The reactions read only `.ws-model` and `.ws-fig`, which the card renders (art.ts). Each animation
 * ends at the still transform, by 560 ms (280 ms at Fast); the next edit, a screen change, a close,
 * reduced motion or Animations Off stops it.
 */
import { figureHtml } from './art';
import type { StageLook } from './look';
import type { Verdict } from './judge';
// @ts-expect-error The approved gait curves are shared browser JavaScript, without declarations.
import { GAITS, GAIT_OF } from '../../docs/2d-first-pieces/board/gait.mjs';

const active = new WeakMap<HTMLElement, () => void>();
const ART: Record<StageLook['body'], string> = { P: 'pawn', N: 'knight', B: 'bishop', R: 'rook', Q: 'queen', A: 'archer', L: 'paladin', G: 'guard', M: 'maester', S: 'beast', O: 'ogre', token: 'pawn' };
const over = (v: Verdict): boolean => ['possiblyOP', 'likelyOP', 'untestedOP'].includes(v.label);

/** Stops the reaction on `root`, also when the caller already replaced its elements. */
export function cancel(root: HTMLElement): void { active.get(root)?.(); }

/** Plays the reaction from the previous look to the next. `root` stays the same element between renders and holds the new `.ws-model`. */
export function react(root: HTMLElement, previousLook: StageLook, nextLook: StageLook, previousVerdict: Verdict, nextVerdict: Verdict): void {
  cancel(root);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const still = (): boolean => reduced.matches || document.documentElement.dataset.pace === 'off';
  const model = root.querySelector<HTMLElement>('.ws-model'), fig = model?.querySelector<HTMLElement>('.ws-fig');
  if (still() || !model || !fig) return;

  const animations = new Map<Animation, (() => void) | undefined>(), temporary = new Set<Element>();
  let stopped = false;
  const stop = (): void => {
    if (stopped) return;
    stopped = true;
    active.delete(root);
    reduced.removeEventListener('change', preference);
    observer.disconnect();
    for (const [a, done] of animations) { a.onfinish = a.oncancel = null; a.cancel(); done?.(); }
    animations.clear();
    for (const el of temporary) el.remove();
  };
  const preference = (): void => { if (still()) stop(); };
  const observer = new MutationObserver(preference);
  reduced.addEventListener('change', preference);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-pace'] });
  active.set(root, stop);
  const speed = document.documentElement.dataset.pace === 'fast' ? 0.5 : 1;
  const run = (el: Element, frames: Keyframe[], duration: number, done?: () => void): void => {
    const a = el.animate(frames, { duration: duration * speed, fill: 'none', easing: frames[0].easing ?? 'cubic-bezier(.2,.8,.2,1)' });
    animations.set(a, done);
    a.onfinish = a.oncancel = () => {
      animations.delete(a);
      done?.();
      if (!animations.size) stop();
    };
  };
  /** A temporary element in the model: it goes when its animation ends or the reaction stops. */
  const temp = (el: HTMLElement, frames: Keyframe[], duration: number): void => {
    el.setAttribute('aria-hidden', 'true');
    temporary.add(el);
    model.append(el);
    run(el, frames, duration, () => { el.remove(); temporary.delete(el); });
  };
  const crossed = over(nextVerdict) && !over(previousVerdict);

  // A1: the approved gait in place. The last frame of each gait is the rest pose, so it ends at the still transform.
  if (!crossed) {
    const gait = GAITS[GAIT_OF[ART[nextLook.body]] ?? 'hop'];
    run(fig, Array.from({ length: 25 }, (_, i) => {
      const p = gait.at(i / 24, 1);
      return { transform: `translateY(${-p.lift * 1.8}px) rotate(${p.tilt * 1.5}rad) scale(${p.sx}, ${p.sy})`, easing: 'linear' };
    }), 480);
  }
  // A1: a new picture fades in over a copy of the old one, which lies over the model (workshop.css).
  if (previousLook.figure !== nextLook.figure || previousLook.army !== nextLook.army) {
    const before = document.createElement('template');
    before.innerHTML = figureHtml(previousLook, 'ws-fig-was');
    temp(before.content.firstElementChild as HTMLElement, [{ opacity: 1 }, { opacity: 0 }], 250);
    run(fig, [{ opacity: 0 }, { opacity: 1 }], 300);
  }

  // A4: three tremors when the design becomes overpowered.
  if (crossed) run(fig, [0, -7, 7, -7, 7, -4, 0].map(x => ({ transform: `translateX(${x}px)`, easing: 'linear' })), 560);

  // A5: a gold ring when a "moves like" or "becomes" piece is new or changes.
  if (nextLook.ghost && previousLook.ghost !== nextLook.ghost) {
    const ring = document.createElement('span');
    ring.className = 'ws-ring';
    temp(ring, [{ opacity: 1, transform: 'translate(-50%, 50%) scale(.4)' }, { opacity: 0, transform: 'translate(-50%, 50%) scale(1.7)' }], 560);
  }
}
