/** Approved Set A reactions. Render the still card first, then react; cancel on navigation/close. */
import { modelHtml, gaugeHtml } from './art';
import type { StageLook } from './look';
import type { Verdict } from './judge';
// @ts-expect-error The approved gait curves are shared browser JavaScript, without declarations.
import { GAITS, GAIT_OF } from '../../docs/2d-first-pieces/board/gait.mjs';

const active = new WeakMap<HTMLElement, () => void>();
const ART: Record<StageLook['body'], string> = { P: 'pawn', N: 'knight', B: 'bishop', R: 'rook', Q: 'queen', A: 'archer', L: 'paladin', G: 'guard', M: 'maester', S: 'beast', O: 'ogre', token: 'pawn' };
const over = (v: Verdict): boolean => ['possiblyOP', 'likelyOP', 'untestedOP'].includes(v.label);

/** Cancels tracked animations even when the caller already replaced their DOM. */
export function cancel(root: HTMLElement): void { active.get(root)?.(); }

/** Keep `root` stable between renders (the card's host or Workshop screen). All reactions end still. */
export function react(root: HTMLElement, previousLook: StageLook, nextLook: StageLook, previousVerdict: Verdict, nextVerdict: Verdict): void {
  cancel(root);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const still = (): boolean => reduced.matches || document.documentElement.dataset.pace === 'off';
  const model = root.querySelector<HTMLElement>('.ws-model');
  if (still() || !model) return;

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
  const run = (el: Element | null, frames: Keyframe[], duration: number, delay = 0, done?: () => void): void => {
    if (!el) return;
    const a = el.animate(frames, { duration: duration * speed, delay: delay * speed, fill: 'none', easing: frames[0].easing ?? 'cubic-bezier(.2,.8,.2,1)' });
    animations.set(a, done);
    a.onfinish = a.oncancel = () => {
      animations.delete(a);
      done?.();
      if (!animations.size) stop();
    };
  };
  const fade = (el: HTMLElement | SVGElement, parent: Element, duration: number): void => {
    el.style.pointerEvents = 'none';
    temporary.add(el);
    parent.append(el);
    run(el, [{ opacity: getComputedStyle(el).opacity }, { opacity: 0 }], duration, 0, () => { el.remove(); temporary.delete(el); });
  };
  // Build the previous decoration from data, so snapshots cannot contain unfinished effects.
  const before = document.createElement('template');
  before.innerHTML = modelHtml(previousLook) + gaugeHtml(previousVerdict);
  const old = before.content;
  const fig = model.querySelector<HTMLElement>('.ws-fig'), rim = model.querySelector<HTMLElement>('.ws-rim');
  const crossed = over(nextVerdict) && !over(previousVerdict);

  // A1: approved in-place gait, preserving the worth's resting scale. Overload owns the figure when crossing.
  if (!crossed) {
    const gait = GAITS[GAIT_OF[ART[nextLook.body]] ?? 'hop'];
    run(fig, Array.from({ length: 25 }, (_, i) => {
      const p = gait.at(i / 24, 1);
      return { transform: `translateY(${-p.lift * 1.8}px) rotate(${p.tilt * 1.5}rad) scale(${p.sx * nextLook.scale}, ${p.sy * nextLook.scale})`, easing: 'linear' };
    }), 480);
  }
  if (rim) {
    const { opacity, transform } = getComputedStyle(rim);
    run(rim, [{ opacity, transform }, { opacity: 1, transform: `${transform} scale(1.12)`, offset: 0.3 }, { opacity, transform }], 480);
  }
  if (previousLook.figure !== nextLook.figure || previousLook.body !== nextLook.body || previousLook.army !== nextLook.army || (nextLook.body === 'token' && previousLook.letter !== nextLook.letter)) {
    const copy = old.querySelector<HTMLElement>('.ws-fig');
    if (copy) { copy.style.zIndex = '1'; copy.style.transform = `scale(${previousLook.scale})`; fade(copy, model, 250); }
    run(fig, [{ opacity: 0 }, { opacity: 1 }], 300);
  }

  // A2: identify marks by geometry and kind, including take versus shoot at the same square.
  const marks = (parent: ParentNode): Map<string, SVGElement> => new Map([...parent.querySelectorAll<SVGElement>('path[fill^="url"], circle[stroke-width="1.2"]')]
    .map(el => [`${el.tagName}:${el.getAttribute('d') ?? `${el.getAttribute('cx')},${el.getAttribute('cy')}`}:${el.getAttribute('stroke-dasharray') ?? ''}:${el.classList.contains('h')}`, el]));
  const floor = model.querySelector<SVGSVGElement>('.ws-floor-svg'), was = marks(old), popped = new Set<Element>();
  if (floor) {
    const now = marks(floor), gradient = floor.querySelector('linearGradient')!.id;
    for (const [key, el] of now) if (!was.has(key)) {
      const xy = el.tagName === 'circle' ? [+el.getAttribute('cx')!, +el.getAttribute('cy')!]
        : el.getAttribute('d')!.match(/^M([\d.-]+) ([\d.-]+)/)!.slice(1).map((n, i) => +n + (i ? 3.4 : 0));
      const ring = Math.round(Math.max(Math.abs(xy[0] - 35), Math.abs(xy[1] - 35)) / 10);
      const opacity = getComputedStyle(el).opacity;
      el.style.transformBox = 'fill-box'; el.style.transformOrigin = 'center';
      popped.add(el);
      run(el, [{ opacity: 0, transform: 'scale(0)' }, { opacity, transform: 'scale(1.6)', offset: 0.6 }, { opacity, transform: 'none' }], 360, Math.max(0, 38 * (ring - 1)));
    }
    for (const [key, el] of was) if (!now.has(key)) {
      if (el.getAttribute('fill')?.startsWith('url(')) el.setAttribute('fill', `url(#${gradient})`);
      fade(el, floor, 360);
    }
  }

  // A3: translate from old gauge coordinates; the layout itself already has its final values.
  for (const gauge of root.querySelectorAll<HTMLElement>('.ws-gauge')) {
    const width = gauge.querySelector('.g-track')!.getBoundingClientRect().width / 100;
    for (const selector of ['.g-gem', '.g-fuzz']) {
      const el = gauge.querySelector<HTMLElement>(selector)!, prev = old.querySelector<HTMLElement>(selector)!;
      if (el.style.left === prev.style.left && el.style.width === prev.style.width) continue;
      const offset = (parseFloat(prev.style.left) - parseFloat(el.style.left)) * width;
      if (selector === '.g-gem') run(el, [{ transform: `translateX(${offset}px)` }, { transform: `translateX(${offset * 0.3}px) scale(1.7)`, offset: 0.6 }, { transform: 'none' }], 450);
      else {
        const ratio = (parseFloat(prev.style.width) || 0.1) / (parseFloat(el.style.width) || 0.1);
        el.style.transformOrigin = 'left';
        run(el, [{ transform: `translateX(${offset}px) scaleX(${ratio})` }, { transform: 'none' }], 450);
      }
    }
  }
  if (previousLook.metal !== nextLook.metal) {
    const plinth = old.querySelector<HTMLElement>('.ws-plinth');
    if (plinth) fade(plinth, model, 450);
  }

  // A4: one bounded crack draw and three tremors. The resting ember seam stays static.
  if (crossed) {
    for (const path of model.querySelectorAll<SVGElement>('.ws-cracks path')) {
      path.style.strokeDasharray = '1';
      run(path, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], 560, 0, () => { path.style.strokeDasharray = ''; });
    }
    run(fig, [0, -7, 7, -7, 7, -4, 0].map(x => ({ transform: `translateX(${x}px) scale(${nextLook.scale})`, easing: 'linear' })), 560);
  }

  // A5: compare the prop values, so changing an existing When reacts as well as adding one.
  if (nextLook.ghost && previousLook.ghost !== nextLook.ghost) {
    run(model.querySelector('.ws-ghost'), [{ opacity: 0, transform: 'scale(.8)' }, { opacity: .7, transform: 'scale(1.2)', offset: .5 }, { opacity: .25, transform: 'scale(1.15)' }], 560);
    const ring = document.createElement('span');
    ring.setAttribute('aria-hidden', 'true');
    ring.style.cssText = 'position:absolute;left:50%;bottom:34%;width:70%;aspect-ratio:1;border:3px solid #e9c071;border-radius:50%;pointer-events:none;box-shadow:0 0 16px #e9c071';
    temporary.add(ring); model.append(ring);
    run(ring, [{ opacity: 1, transform: 'translate(-50%, 50%) scale(.4)' }, { opacity: 0, transform: 'translate(-50%, 50%) scale(1.7)' }], 560, 0, () => { ring.remove(); temporary.delete(ring); });
  }
  if (previousLook.zone !== nextLook.zone || previousLook.partner !== nextLook.partner || previousLook.ghost !== nextLook.ghost) {
    model.querySelectorAll<HTMLElement | SVGElement>('.ws-zone rect[fill="#e9c071"], .ws-partner, .ws-floor-svg .h').forEach((el, i) => {
      if (popped.has(el)) return;
      const opacity = getComputedStyle(el).opacity;
      el.style.transformBox = 'fill-box'; el.style.transformOrigin = 'center';
      run(el, [{ opacity: 0, transform: 'scale(.4)' }, { opacity, transform: 'none' }], 360, Math.min(200, i * 20));
    });
  }
  if (previousLook.hourglass !== nextLook.hourglass) run(model.querySelector('.ws-hourglass'), [{ opacity: .4, transform: 'rotate(180deg) scale(1.6)' }, { opacity: 1, transform: 'none' }], 560);
  if (previousLook.cardBack !== nextLook.cardBack) run(model.querySelector('.ws-cardback'), [{ opacity: 0, transform: 'scale(.4)' }, { opacity: 1, transform: 'none' }], 560);
  if (!animations.size) stop();
}
