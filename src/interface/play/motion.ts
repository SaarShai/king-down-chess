import { burst, ease, onFrame, pulse, reducedMotion, sound, Spring, tween, type Effect } from "./fx";

// Interface motion: the owner's choices (runs/motion/decisions.md) with the values of runs/motion/motion-spec.md.
// Durations and the plain curves are tokens in ui/tokens.css. The spring, heavy and back curves come from the
// formulas of labs/motion2/lab.js:64-71 and go on :root as CSS linear() tokens, so CSS and JS share them.
// Rules (spec section 0): the state changes at once, motion follows, no motion blocks a tap.

export const E = {
  out3: (t: number) => 1 - (1 - t) ** 3,
  io3: (t: number) => t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2,
  spring(z: number) { const w = 4.6 / z, wd = w * Math.sqrt(1 - z * z); return (t: number) => t >= 1 ? 1 : 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + (z * w / wd) * Math.sin(wd * t)); },
  backIn: (c: number) => (t: number) => (c + 1) * t * t * t - c * t * t,
  /** Weight: slow start, firm arrival, one small settle past the end and back. */
  heavy: (a: number) => (t: number) => t < .72 ? (1 + a) * E.io3(t / .72) : 1 + a * (1 - E.out3((t - .72) / .28)),
};
export const springZ = (s: number) => Math.max(.3, Math.min(.8, .78 - .19 * s));
/** A CSS linear() easing from samples of `f`. */
export const linear = (f: (t: number) => number, n = 48) => `linear(${Array.from({ length: n + 1 }, (_, i) => +f(i / n).toFixed(4)).join(', ')})`;

const root = document.documentElement;
export const token = (name: string) => getComputedStyle(root).getPropertyValue(name).trim();
/** A time token in ms (the CSS build may write it in s). */
export const ms = (name: string) => { const value = token(name); return parseFloat(value) * (/\ds$/.test(value) ? 1000 : 1); };
const S = () => parseFloat(token('--motion-strength')) || 2;
/** The curves that CSS cannot write as a cubic-bezier, at the current strength. */
export function curves(s: number): Record<string, string> {
  return {
    '--ease-spring': linear(E.spring(springZ(s))), '--ease-seal': linear(E.heavy(.05 * s)), '--ease-label': linear(E.heavy(.035 * s)),
    // The game screen carries the board, and the board never goes past its place: Weight with no settle (b5 repair).
    '--ease-rest': linear(E.heavy(.12)), '--ease-screen-in': linear(E.heavy(0)), '--ease-vanish': linear(E.backIn(1.6)),
  };
}
for (const [name, value] of Object.entries(curves(S()))) root.style.setProperty(name, value);

/** Reduced motion: the system setting or the game's motion setting Off (main.ts sets the attribute). */
export const calm = () => root.dataset.motion === 'reduce';

// One running animation for each element and channel: a new one starts from the current value (implicit first keyframe).
const running = new WeakMap<Element, Map<string, Animation>>();
function to(el: HTMLElement, channel: string, frame: Keyframe, duration: number, easing: string, rest = false): Animation {
  const map = running.get(el) ?? new Map<string, Animation>(); running.set(el, map);
  const before = map.get(channel), now = el.animate([frame], { duration, easing, fill: 'forwards' });
  map.set(channel, now);
  void now.finished.then(() => { before?.cancel(); if (rest && map.get(channel) === now) { now.cancel(); map.delete(channel); } }, () => {});
  return now;
}

// Press: Glow for a button (section 2), Weight for the brass main action (section 3).
let held: { el: HTMLElement; light?: HTMLElement; weight: boolean; tab: boolean } | null = null;
const sealed = new WeakSet<HTMLElement>();
function press(event: PointerEvent) {
  if (event.button !== 0) return;
  const el = (event.target as Element).closest<HTMLElement>('.kd-button, .kd-segment, .shell-nav a');
  if (!el || el.closest('.play-turn, .play-game[data-hand=hand] .play-card') || el.getAttribute('aria-disabled') === 'true') return;
  release();
  const s = S(), weight = el.dataset.kind === 'main';
  held = { el, weight, tab: el.matches('.shell-nav a') };
  if (calm()) { to(el, 'press', { filter: 'brightness(.85)' }, ms('--dur-reduced-press'), 'linear'); return; }
  if (held.tab) { const box = el.getBoundingClientRect(); to(el, 'press', { transform: `perspective(800px) rotateX(${-(event.clientY - box.top - box.height / 2) / box.height * 18 * s}deg) rotateY(${(event.clientX - box.left - box.width / 2) / box.width * 18 * s}deg) scale(${1 - .03 * s})` }, time(110), token('--ease-out3')); const icon = el.querySelector<HTMLElement>('.kd-icon'); if (icon) to(icon, 'press', { transform: 'rotateX(-28deg) scale(1.12)' }, time(170), token('--ease-out3')); return; }
  if (weight) {
    // The finish row reserves 4 px for its press; its 44 px input target keeps its size.
    const transform = el.closest('.play-turn') ? 'translateY(4px)' : `translateY(${5 * s}px) scale(${1 + .015 * s}, ${1 - .05 * s})`;
    to(el, 'press', { transform, filter: 'brightness(.86)' }, ms('--dur-press-weight'), token('--ease-out2')); return;
  }
  const box = el.getBoundingClientRect(), light = document.createElement('span');
  light.className = 'kd-glow'; light.style.width = light.style.height = `${box.width * 1.5}px`;
  el.classList.add('kd-glow-host'); el.append(light); held.light = light; follow(event);
  light.animate([{ opacity: 0, transform: 'translate(-50%, -50%) scale(.2)' }, { opacity: Math.min(1, .45 + .3 * s), transform: 'translate(-50%, -50%) scale(1)' }], { duration: ms('--dur-press-glow'), fill: 'forwards' });
  to(el, 'press', { filter: `brightness(${1 + .08 * s})` }, time(90), token('--ease-out3'));
}
function follow(event: PointerEvent) {
  if (!held?.light) return;
  const box = held.el.getBoundingClientRect();
  held.light.style.left = `${event.clientX - box.left}px`; held.light.style.top = `${event.clientY - box.top}px`;
}
/** Finger up, or the press ends any other way: the light always goes out (the lab fault on disarm). */
function release() {
  if (!held) return;
  const { el, light, weight, tab } = held; held = null;
  if (calm()) { to(el, 'press', { filter: 'brightness(1)' }, ms('--dur-reduced-out'), 'linear', true); light?.remove(); return; }
  if (tab) {
    const before = running.get(el)?.get('press');
    const lift = el.animate([{}, { transform: `scale(${1 + .04 * S()})`, offset: .5 }, { transform: 'none' }], { duration: time(440), easing: linear(E.spring(.55)) });
    void lift.finished.then(() => before?.cancel(), () => {});
    const icon = el.querySelector<HTMLElement>('.kd-icon');
    if (icon) to(icon, 'press', { transform: 'none' }, time(460), linear(E.spring(.5)), true);
    return;
  }
  // The click comes after pointerup: the finish action may seal the button first.
  if (weight) { setTimeout(() => { if (!sealed.has(el)) rest(el); }); return; }
  if (light) void light.animate([{ opacity: 0, transform: `translate(-50%, -50%) scale(${1.4 + .4 * S()})` }], { duration: ms('--dur-release-glow'), fill: 'forwards' })
    .finished.then(() => { light.remove(); if (!el.querySelector('.kd-glow')) el.classList.remove('kd-glow-host'); });
  const wasArmed = el.matches('.play-own .play-power[aria-pressed="true"]');
  // Click sets the armed state after pointerup. One filter path then reaches the armed brightness.
  setTimeout(() => {
    const armed = el.matches('.play-own .play-power[aria-pressed="true"]');
    if (wasArmed && !armed) return; // disarm() owns its bright bump
    to(el, 'press', { filter: `brightness(${armed ? 1.08 : 1})` }, armed ? ms('--dur-arm') : time(420), token('--ease-out3'), true);
  });
}
const rest = (el: HTMLElement) => to(el, 'press', { transform: 'none', filter: 'brightness(1)' }, ms('--dur-rest-weight'), token('--ease-rest'), true);
document.addEventListener('pointerdown', press, true);
document.addEventListener('pointermove', follow, true);
for (const type of ['pointerup', 'pointercancel']) document.addEventListener(type, release, true);

/** The turn is sent: the finish action stays sunk, like a seal, until the next turn. `travel`: the sink in px (the game screen keeps it inside the finish row). */
export function seal(el: HTMLElement, travel = 4 * S()) {
  if (sealed.has(el)) return;
  sealed.add(el);
  if (!calm()) to(el, 'press', { transform: `translateY(${travel}px)`, filter: 'brightness(.86)' }, ms('--dur-seal-weight'), token('--ease-seal'));
}
export function unseal(el: HTMLElement) { if (sealed.delete(el)) { if (calm()) to(el, 'press', { transform: 'none', filter: 'brightness(1)' }, 1, 'linear', true); else rest(el); } }

/** A power goes back to rest when it is disarmed: a short bright bump (section 4). The halo is CSS, so it stops at once. */
export function disarm(el: HTMLElement) {
  if (calm()) return;
  const s = S();
  el.animate([{ filter: 'brightness(1.08)' }, { filter: `brightness(${1.08 + .7 * s}) blur(${1.2 * s}px)`, offset: .5 }, { filter: 'brightness(1) blur(0px)' }], { duration: ms('--dur-disarm'), easing: token('--ease-out3') });
}

/** A text swap: Exact for messages (section 9), Weight when the turn is sent (section 3). */
export function swapText(node: HTMLElement, text: string, _kind: 'exact' | 'weight' = 'exact') {
  const old = node.textContent ?? '';
  if (old === text) return;
  node.textContent = text;
  // One readable label (joy item 1, Single-label Exact): no outgoing copy and no travel; the new label fades from 0.7 over 120 ms.
  if (!old || calm()) return;
  node.animate([{ opacity: .7 }, { opacity: 1 }], { duration: time(120), easing: 'linear' });
}

/** An error line arrives and shakes (section 9). */
export function shake(node: HTMLElement) {
  if (calm()) { node.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ms('--dur-reduced-in') }); return; }
  const s = S(), d = ms('--dur-shake');
  node.animate([{ transform: `translateY(${8 * s}px)`, opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: ms('--dur-msg-in'), easing: token('--ease-out5') });
  node.animate(Array.from({ length: 13 }, (_, i) => ({ transform: `translateX(${4 * s * Math.sin(2 * Math.PI * 2 * i / 12) * (1 - i / 12)}px)` })), { duration: d, composite: 'add' });
}

/** Screen change home to game, and back. The game fades at its final position so its squares take input at once. */
export async function screenChange(from: HTMLElement, to: HTMLElement, back = false): Promise<void> {
  window.scrollTo(0, 0);
  const s = S(), down = `translateY(${8 * s}px) scale(${1 - .05 * s})`;
  if (calm()) {
    const fade = ms('--dur-reduced-in');
    if (back) from.animate([{ opacity: 0 }], { duration: fade, fill: 'forwards' }); else to.animate([{ opacity: 0 }, { opacity: 1 }], { duration: fade });
    await new Promise(r => setTimeout(r, fade)); return;
  }
  if (!back) {
    from.animate([{ transform: 'none', filter: 'brightness(1)' }, { transform: down, filter: 'brightness(.5)' }], { duration: ms('--dur-screen-back'), easing: token('--ease-io3'), fill: 'forwards' });
    await to.animate([{ opacity: 0 }, { opacity: 1 }], { duration: time(120), easing: 'linear' }).finished;
  } else {
    to.animate([{ transform: down, filter: 'brightness(.5)' }, { transform: 'none', filter: 'brightness(1)' }], { duration: ms('--dur-screen-back'), easing: token('--ease-io3') });
    await from.animate([{ transform: 'none' }, { transform: `translateY(${innerHeight}px)` }], { duration: ms('--dur-screen-out'), easing: token('--ease-in3'), fill: 'forwards' }).finished;
  }
}

/** A played card goes to its target on the effect clock. */
export function cardFly(card: HTMLElement, host: HTMLElement, x: number, y: number, _square: number, frost = false): () => void {
  if (reducedMotion()) return () => {};
  const box = card.getBoundingClientRect(), wrap = card.cloneNode(true) as HTMLElement;
  const bounds = host.getBoundingClientRect();
  wrap.classList.add('kd-card-fly'); wrap.setAttribute('aria-hidden', 'true'); wrap.inert = true;
  Object.assign(wrap.style, { left: `${box.left - bounds.left}px`, top: `${box.top - bounds.top}px`, width: `${box.width}px`, height: `${box.height}px` });
  host.append(wrap);
  const dx = x - box.left - box.width / 2, dy = y - box.top - box.height / 2;
  const flight = tween(320, t => {
    wrap.style.transform = `translate(${dx * t}px, ${dy * t}px) rotate(${-5 * Math.sin(Math.PI * t)}deg) scale(${1 - .6 * t})`;
    wrap.style.opacity = String(Math.min(1, (1 - t) * 2.2));
  }, { curve: ease.EASE, done: () => { wrap.remove(); if (frost) burst('dust', { x, y }, { count: 6, ms: 380, rise: -8 }); } });
  return () => { flight.cancel(); wrap.remove(); };
}

export function trackCard(card: HTMLButtonElement, frost: boolean) {
  const lift = new Spring(0, 420, 26), tiltX = new Spring(0, 300, 22), tiltY = new Spring(0, 300, 22);
  let frame: Effect | undefined;
  const draw = () => {
    card.style.setProperty('--pointer-lift', `${lift.x}px`);
    card.style.setProperty('--tilt-x', `${tiltX.x}deg`);
    card.style.setProperty('--tilt-y', `${tiltY.x}deg`);
    card.style.setProperty('--glare', String(.26 * lift.x / 14));
    card.style.setProperty('--hover-scale', String(1 + .056 * lift.x / 14));
  };
  const aim = (event?: PointerEvent) => {
    if (reducedMotion()) return;
    const usable = event && card.closest('[data-hand="hand"]') && card.dataset.spent !== 'true' && card.dataset.notNow !== 'true' && card.getAttribute('aria-pressed') !== 'true';
    const rect = card.getBoundingClientRect();
    lift.to = usable ? 14 : 0;
    tiltX.to = usable ? -12.8 * ((event.clientY - rect.top) / rect.height - .5) : 0;
    tiltY.to = usable ? 16 * ((event.clientX - rect.left) / rect.width - .5) : 0;
    if (usable) card.style.setProperty('--glare-x', `${(event.clientX - rect.left) / rect.width * 100}%`);
    frame ??= onFrame(dt => {
      lift.step(dt); tiltX.step(dt); tiltY.step(dt); draw();
      if (!card.isConnected || lift.still && tiltX.still && tiltY.still) return false;
    }, () => {
      if (reducedMotion()) { lift.snap(0); tiltX.snap(0); tiltY.snap(0); draw(); }
      frame = undefined;
    });
  };
  card.addEventListener('pointerenter', event => {
    if (!frost && event.pointerType === 'mouse' && card.closest('[data-hand="hand"]') && card.dataset.spent !== 'true' && card.dataset.notNow !== 'true') sound('tick', { volume: .28 });
  });
  card.addEventListener('pointermove', aim);
  card.addEventListener('pointerleave', () => aim());
  card.addEventListener('pointercancel', () => aim());
  card.addEventListener('pointerup', () => aim());
}

const armEffects = new WeakMap<HTMLElement, Effect>();
export function armCard(card: HTMLElement, armed: boolean) {
  armEffects.get(card)?.finish();
  if (reducedMotion() || !card.closest('[data-hand="hand"]')) return;
  const spring = new Spring(armed ? 0 : 1, 420, 26); spring.to = armed ? 1 : 0;
  const draw = () => card.style.setProperty('--arm-progress', String(spring.x));
  draw();
  armEffects.set(card, onFrame(dt => { spring.step(dt); draw(); if (!card.isConnected || spring.still) return false; },
    () => { card.style.removeProperty('--arm-progress'); armEffects.delete(card); }));
}

const sheetEffects = new WeakMap<HTMLElement, Effect>();
export function sheetMotion(panel: HTMLElement, open: boolean, close?: () => void, bounds?: DOMRectReadOnly) {
  sheetEffects.get(panel)?.finish();
  sound(open ? 'pass' : 'tick');
  if (open) pulse('light');
  const shade = panel.previousElementSibling;
  const scrim = shade instanceof HTMLElement && shade.matches('.daylight-help-shade') ? shade : undefined;
  if (open && scrim && close) { scrim.style.pointerEvents = 'auto'; scrim.addEventListener('click', close); }
  if (reducedMotion()) return;
  if (!open) {
    const box = bounds ?? panel.getBoundingClientRect(), ghost = panel.cloneNode(true) as HTMLElement;
    ghost.hidden = false; ghost.inert = true; ghost.setAttribute('aria-hidden', 'true'); ghost.removeAttribute('id'); delete ghost.dataset.placement;
    Object.assign(ghost.style, { position: 'fixed', left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, height: `${box.height}px`, bottom: 'auto', right: 'auto', margin: '0', zIndex: '40', overflow: 'hidden' });
    document.body.append(ghost);
    tween(180, t => { ghost.style.transform = `translateY(${t * innerHeight}px)`; ghost.style.opacity = String(1 - t); }, { curve: ease.in2, done: () => ghost.remove() });
    return;
  }
  const handle = panel.querySelector<HTMLElement>('.kd-sheet-head, .menu-head, .play-panel-head');
  if (handle && close) {
    let start: number | undefined, offset = 0;
    handle.style.touchAction = 'none';
    handle.onpointerdown = event => {
      if ((event.target as Element).closest('button')) return;
      sheetEffects.get(panel)?.finish(); start = event.clientY; offset = 0;
      handle.setPointerCapture(event.pointerId);
    };
    handle.onpointermove = event => {
      if (start === undefined) return;
      offset = Math.max(0, event.clientY - start); panel.style.translate = `0 ${offset}px`;
    };
    handle.onlostpointercapture = () => {
      if (start === undefined) return;
      start = undefined;
      if (offset > 70) { panel.style.translate = ''; close(); }
      else tween(160, t => { panel.style.translate = `0 ${offset * (1 - t)}px`; }, { curve: ease.out3, done: () => { panel.style.translate = ''; } });
    };
  }
  const rise = new Spring(1, 320, 27); rise.to = 0;
  const draw = () => {
    panel.style.transform = `translateY(${rise.x * panel.offsetHeight}px)`;
    panel.style.opacity = String(Math.min(1, 1 - rise.x));
    if (scrim) scrim.style.opacity = panel.style.opacity;
  };
  draw();
  sheetEffects.set(panel, onFrame(dt => {
    rise.step(dt); draw();
    if (!panel.isConnected || rise.still) return false;
  }, () => { panel.style.transform = panel.style.opacity = ''; if (scrim) scrim.style.opacity = ''; sheetEffects.delete(panel); }));
}

/** Open or close the help and menu in the reading area (section 6: Exact). Closing slides a copy of the old content down. */
export function sheet(detail: HTMLElement, open: boolean) {
  if (open) {
    detail.animate(calm() ? [{ opacity: 0 }, { opacity: 1 }] : [{ transform: `translateY(${detail.clientHeight}px)` }, { transform: 'none' }], { duration: ms(calm() ? '--dur-reduced-in' : '--dur-sheet-in'), easing: token('--ease-out5') });
    return;
  }
  if (!detail.childElementCount) return;
  const ghost = detail.cloneNode(true) as HTMLElement;
  ghost.setAttribute('aria-hidden', 'true'); ghost.inert = true;
  Object.assign(ghost.style, { position: 'absolute', left: `${detail.offsetLeft}px`, top: `${detail.offsetTop}px`, width: `${detail.offsetWidth}px`, height: `${detail.offsetHeight}px`, background: 'var(--surface-page)', zIndex: '1' });
  detail.after(ghost);
  void ghost.animate(calm() ? [{ opacity: 1 }, { opacity: 0 }] : [{ transform: 'none' }, { transform: `translateY(${detail.offsetHeight}px)` }], { duration: ms(calm() ? '--dur-reduced-out' : '--dur-sheet-out'), easing: token('--ease-in3'), fill: 'forwards' }).finished.then(() => ghost.remove());
}

/** The interface and board share the player's pace. Fast halves all interface times. */
const baseTimes = new Map<string, number>();
export const time = (duration: number) => duration * (root.dataset.motion === 'fast' ? .5 : 1);
export function setInterfaceMotion(pace: string, reduce: boolean) {
  const names = ['press-glow', 'release-glow', 'press-weight', 'seal-weight', 'label-weight', 'rest-weight', 'arm', 'disarm', 'ring-glow', 'ring-out', 'halo', 'card-lift', 'card-travel', 'card-vanish', 'sheet-in', 'sheet-out', 'screen-in', 'screen-back', 'screen-out', 'msg-in', 'msg-out', 'shake', 'versus', 'versus-out', 'arrive', 'tag', 'tab-out', 'tab-in', 'tab-marker'];
  for (const name of [...names.map(name => `--dur-${name}`), '--ring-stagger', '--arrive-stagger', '--tag-start', '--tag-stagger']) if (!baseTimes.has(name)) baseTimes.set(name, ms(name));
  root.dataset.motion = reduce || pace === 'off' ? 'reduce' : pace;
  for (const [name, duration] of baseTimes) root.style.setProperty(name, `${time(duration)}ms`);
}

/** Lift pages hinge in opposite directions. The departing copy cannot receive input. */
export function tabChange(old: HTMLElement, page: HTMLElement, direction: number) {
  const ghost = old.cloneNode(true) as HTMLElement;
  ghost.classList.add('shell-departing'); ghost.hidden = false; ghost.inert = true; ghost.setAttribute('aria-hidden', 'true');
  ghost.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
  page.before(ghost);
  const fade = calm(), angle = Math.min(1.3, S()), back = 1 + .5 * S();
  ghost.style.transformOrigin = direction > 0 ? 'left center' : 'right center';
  page.style.transformOrigin = direction > 0 ? 'right center' : 'left center';
  const out = ghost.animate(fade ? [{ opacity: 1 }, { opacity: 0 }] : [{ transform: old.style.transform || 'none', opacity: old.style.opacity || 1 }, { transform: `rotateY(${-70 * angle * direction}deg)`, opacity: 0 }], { duration: fade ? ms('--dur-reduced-out') : ms('--dur-tab-out'), easing: token('--ease-in3'), fill: 'forwards' });
  void out.finished.then(() => ghost.remove(), () => ghost.remove());
  page.animate(fade ? [{ opacity: 0 }, { opacity: 1 }] : [{ transform: `rotateY(${62 * angle * direction}deg)`, opacity: 0, '--d': 3 }, { transform: 'none', opacity: 1, '--d': 1 }], { duration: fade ? ms('--dur-reduced-in') : ms('--dur-tab-in'), easing: fade ? 'linear' : linear(t => 1 + (back + 1) * (t - 1) ** 3 + back * (t - 1) ** 2) });
}

const markers = new WeakMap<Element, HTMLElement>();
/** The marker travels from its current place when a second choice interrupts it. */
export function travelMarker(from: HTMLElement, target: HTMLElement, tab = false) {
  const host = target.parentElement!, previous = markers.get(host);
  // A tab marker is the short brass bar under the tab (--tab-mark-width), as the resting marker is.
  const bar = (r: DOMRect) => { const w = Math.min(r.width, parseFloat(token('--tab-mark-width')) || r.width); return new DOMRect(r.left + (r.width - w) / 2, r.top, w, r.height); };
  const a = previous?.getBoundingClientRect() ?? (tab ? bar(from.getBoundingClientRect()) : from.getBoundingClientRect()), b = tab ? bar(target.getBoundingClientRect()) : target.getBoundingClientRect();
  previous?.remove(); markers.delete(host);
  if (calm() || from === target) return;
  const mark = document.createElement('span'); mark.className = tab ? 'shell-tab-marker' : 'shell-choice-marker'; mark.setAttribute('aria-hidden', 'true');
  Object.assign(mark.style, { left: `${b.left}px`, top: `${tab ? b.bottom - 3 : b.top}px`, width: `${b.width}px`, height: `${tab ? 3 : b.height}px` });
  document.body.append(mark); markers.set(host, mark);
  const dx = a.left - b.left, dy = tab ? a.bottom - b.bottom : a.top - b.top;
  const bump = tab ? 1 + .14 * S() : 1;
  const frames = [{ transform: `translate(${dx}px, ${dy}px) scaleX(${a.width / b.width})`, filter: 'none' }, { transform: `translate(${dx / 2}px, ${dy / 2}px) scale(${bump})`, filter: tab ? 'none' : `brightness(${1 + .7 * S()}) blur(${1.2 * S()}px)`, offset: .5 }, { transform: 'none', filter: 'none' }];
  const clear = () => { if (markers.get(host) === mark) markers.delete(host); mark.remove(); };
  void mark.animate(frames, { duration: tab ? ms('--dur-tab-marker') : time(280), easing: tab ? linear(t => 1 + 2.2 * (t - 1) ** 3 + 1.2 * (t - 1) ** 2) : token('--ease-out3') }).finished.then(clear, clear);
}
document.addEventListener('kd-change', event => {
  const group = event.target as HTMLElement, list = group.querySelector('.kd-segments');
  if (!list) return;
  const controls = [...list.querySelectorAll<HTMLElement>('[role="radio"]')], selected = list.querySelector<HTMLElement>('[aria-checked="true"]'), old = controls[(event as CustomEvent).detail.previous];
  if (old && selected) travelMarker(old, selected);
});

/** Native dialog state closes at once. An inert copy supplies the departure. */
document.addEventListener('kd-before-close', event => {
  const dialog = event.target as HTMLDialogElement, box = dialog.getBoundingClientRect();
  const ghost = document.createElement('div'), scrim = document.createElement('div');
  ghost.className = `${dialog.className} shell-dialog-ghost`; ghost.hidden = false; ghost.inert = true; ghost.setAttribute('aria-hidden', 'true');
  ghost.append(...[...dialog.children].map(node => node.cloneNode(true)));
  ghost.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
  Object.assign(ghost.style, { left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, height: `${box.height}px` });
  scrim.className = 'shell-dialog-scrim'; scrim.setAttribute('aria-hidden', 'true'); document.body.append(scrim, ghost);
  const duration = ms(calm() ? '--dur-reduced-out' : '--dur-sheet-out');
  scrim.animate([{ opacity: 1 }, { opacity: 0 }], { duration, fill: 'forwards' });
  void ghost.animate(calm() ? [{ opacity: 1 }, { opacity: 0 }] : [{ transform: 'none' }, { transform: `translateY(${innerHeight - box.top}px)` }], { duration, easing: token('--ease-in3'), fill: 'forwards' }).finished.then(() => { ghost.remove(); scrim.remove(); }, () => { ghost.remove(); scrim.remove(); });
});
