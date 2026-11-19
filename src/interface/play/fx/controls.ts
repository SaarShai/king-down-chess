import { later, onFrame, reducedMotion } from './clock';
import { Spring } from './curves';
import type { Effect, PulseKind, SoundName, SoundOptions } from './index';

const controls = '.kd-button, .kd-nav a, .kd-segment, .kd-choice, .kd-switch, .kd-game-row, .kd-resource, .list-row';
const ownEffects = '.play-card, .card, .play-turn button, .end-btn, .undo-btn';
const tabs = '.kd-nav a';
let bound = false;

export function bindControls(sound: (name: SoundName, options?: SoundOptions) => void, pulse: (kind: PulseKind) => void): void {
  if (bound) return;
  bound = true;
  let press: { element: HTMLElement; id: number; release(): void } | undefined;
  let hover: HTMLElement | undefined;
  let hoverFilter = '';
  const motion = new WeakMap<HTMLElement, Effect>();

  const find = (target: EventTarget | null): HTMLElement | null => {
    const el = target instanceof Element ? target.closest<HTMLElement>(controls) : null;
    return el?.matches(`:disabled, [aria-disabled="true"], ${ownEffects}`) ? null : el;
  };
  const unhover = () => {
    if (hover && hover.style.filter === 'brightness(0.98)') hover.style.filter = hoverFilter;
    hover = undefined;
  };
  const push = (element: HTMLElement, id: number) => {
    press?.release();
    motion.get(element)?.finish();
    const main = element.dataset.kind === 'main';
    if (main) { sound('press', { volume: .7 }); pulse('light'); }

    const filter = hover === element ? hoverFilter : element.style.filter;
    const restoreFilter = () => {
      if (element.style.filter === 'brightness(0.93)') element.style.filter = hover === element ? 'brightness(0.98)' : filter;
    };
    const scale = element.style.scale, translate = element.style.translate;
    const spring = new Spring(1, 620, 22);
    const floor = main ? .95 : .985;
    spring.to = floor;
    spring.v = main ? -.75 : -.3;
    let draw: Effect | undefined;
    const restore = () => {
      element.style.scale = scale;
      element.style.translate = translate;
      draw = undefined;
      motion.delete(element);
    };
    const move = () => {
      if (draw || reducedMotion()) return;
      draw = onFrame(dt => {
        const previous = spring.x;
        if (spring.step(dt) !== previous) pass(spring.x);
        if (spring.still && spring.to === 1) return false;
      }, restore);
      motion.set(element, draw);
    };
    const pass = (y: number) => {
      element.style.scale = `${main ? 1 + (1 - y) * .35 : 1} ${y}`;
      element.style.translate = `0 ${(1 - y) / (1 - floor) * (main ? 2 : 1)}px`;
    };
    if (reducedMotion()) element.style.filter = 'brightness(.93)';
    else move();
    press = { element, id, release() {
      press = undefined;
      restoreFilter();
      spring.to = 1;
      move();
    } };
  };

  const handle = (event: Event) => {
    const element = find(event.target);
    if (event instanceof PointerEvent) {
      if (event.type === 'pointerdown' && element && event.isPrimary && event.button === 0) push(element, event.pointerId);
      else if ((event.type === 'pointerup' || event.type === 'pointercancel') && press?.id === event.pointerId) press.release();
      else if (event.pointerType !== 'touch' && event.type === 'pointerout' && element !== find(event.relatedTarget)) {
        if (hover === element) unhover();
        if (press?.id === event.pointerId && press.element === element) press.release();
      } else if (event.pointerType !== 'touch' && event.type === 'pointerover' && element && element !== find(event.relatedTarget)) {
        unhover();
        hover = element; hoverFilter = element.style.filter; element.style.filter = 'brightness(.98)';
      }
    }
    if (event instanceof MouseEvent && event.type === 'click' && element && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
      if (element.matches(tabs) && !element.hasAttribute('aria-current')) { sound('tick', { volume: .51 }); pulse('tick'); }
      if (event.detail === 0) {
        push(element, -1);
        const keyboard = press;
        if (reducedMotion()) keyboard?.release();
        else later(70, () => { if (press === keyboard) keyboard?.release(); });
      }
    }
  };
  for (const type of ['pointerdown', 'pointerup', 'pointercancel', 'pointerover', 'pointerout', 'click']) {
    document.addEventListener(type, handle, { capture: true, passive: true });
  }
}
