import { drawFirewall, drawFreeze } from '../render/effects/materials';
import { CAST_PREPARE_MS } from '../render/effects/card';

/** Short interface motion. The DOM always holds the readable result. */
export class UiMotion {
  private running = new Map<Animation, Element>();
  private onsets = new Map<number, { time: number; end: number }>();
  private stopped = false;
  private cutoff = -Infinity;
  private reduced = matchMedia('(prefers-reduced-motion: reduce)');
  private hidden = () => { if (document.hidden) this.cancel(); };
  private settings = () => { if (!this.enabled()) this.cancel(); };
  private observer: MutationObserver;
  private focus = (event: FocusEvent) => {
    for (const [animation, target] of this.running) if (event.target instanceof Node && target.contains(event.target)) { animation.cancel(); this.running.delete(animation); }
  };

  constructor(private allowed: () => boolean = () => true, private pace: () => string | undefined = () => document.documentElement.dataset.pace) {
    document.addEventListener('visibilitychange', this.hidden);
    this.reduced.addEventListener('change', this.settings);
    document.addEventListener('focusin', this.focus);
    this.observer = new MutationObserver(this.settings);
    this.observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-pace'] });
    if (document.body) this.observer.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['data-page', 'data-ui-motion'] });
  }

  private enabled() { return !this.stopped && !document.hidden && !this.reduced.matches && this.pace() !== 'off' && this.allowed(); }

  play(element: Element | null, frames: Keyframe[], duration: number, delay = 0, at = performance.now(), easing = 'cubic-bezier(.333333,1,.666667,1)'): Animation | undefined {
    const speed = this.pace() === 'fast' ? 2 : 1;
    const age = performance.now() - at;
    if (!this.enabled()) { this.cutoff = Math.max(this.cutoff, at); return; }
    if (document.activeElement && element?.contains(document.activeElement)) return;
    if (!element || !element.isConnected || typeof element.animate !== 'function' || at <= this.cutoff || age >= (delay + duration) / speed) return;
    // Convert once per event: the timeline can lag wall time during setup or use another clock.
    for (const [event, onset] of this.onsets) if (onset.end <= performance.now()) this.onsets.delete(event);
    const end = at + (delay + duration) / speed;
    const onset = this.onsets.get(at) ?? { time: Number(document.timeline.currentTime) - age, end };
    onset.end = Math.max(onset.end, end);
    this.onsets.set(at, onset);
    for (const [animation, target] of this.running) if (target === element || !target.isConnected) { animation.cancel(); this.running.delete(animation); }
    const animation = element.animate(frames, { duration: duration / speed, delay: delay / speed, easing, fill: 'both' });
    animation.startTime = onset.time;
    this.running.set(animation, element);
    const clear = () => { this.running.delete(animation); animation.cancel(); };
    void animation.finished.then(clear, () => { this.running.delete(animation); });
    return animation;
  }

  reveal(element: Element | null, duration = 420, distance = 18, delay = 0, at = performance.now()): void {
    this.play(element, [{ opacity: 0, translate: `0 ${distance}px` }, { opacity: 1, translate: '0 0' }], duration, delay, at);
  }

  cancel(): void {
    this.cutoff = performance.now();
    for (const animation of this.running.keys()) animation.cancel();
    this.running.clear();
    this.onsets.clear();
  }

  dispose(): void {
    this.stopped = true;
    this.cancel();
    document.removeEventListener('visibilitychange', this.hidden);
    this.reduced.removeEventListener('change', this.settings);
    document.removeEventListener('focusin', this.focus);
    this.observer.disconnect();
  }
}

export type ResultMotion = 'victory' | 'defeat' | 'draw' | 'abort';

/** The approved result timing, applied to the existing result art and words. */
export function revealResult(motion: UiMotion, host: HTMLElement, kind: ResultMotion): void {
  const all = (selector: string) => [...host.querySelectorAll<HTMLElement>(selector)];
  const at = performance.now();
  if (kind === 'victory') {
    for (const title of (host.querySelector('.over-words')?.textContent?.trim() ? all('.over-words') : all('h2'))) motion.play(title, [{ opacity: 0, transform: 'translateY(8px) scale(1.12)', filter: 'blur(2px)' }, { opacity: 1, transform: 'translateY(0) scale(1)', filter: 'blur(0)' }], 620, 450, at);
    for (const art of all('.over-king')) motion.reveal(art, 700, 12, 180, at);
    if (host.querySelector('.over-words')?.textContent?.trim()) motion.reveal(host.querySelector('h2'), 400, 5, 750, at);
    motion.reveal(host.querySelector('#over-detail, #end-reason'), 500, 8, 1350, at);
  } else if (kind === 'draw') {
    all('.over-king').forEach((art, i) => motion.play(art, [{ opacity: 0, translate: `${i ? 25 : -25}px 0` }, { opacity: 1, translate: '0 0' }], 650, 200, at));
    motion.reveal(host.querySelector('h2'), 500, 0, 450, at);
    motion.reveal(host.querySelector('#over-detail, #end-reason'), 400, 0, 700, at);
  } else {
    for (const art of all('.over-king')) motion.reveal(art, kind === 'defeat' ? 700 : 400, kind === 'defeat' ? -12 : 0, kind === 'defeat' ? 200 : 100, at);
    motion.reveal(host.querySelector('h2'), kind === 'defeat' ? 700 : 450, kind === 'defeat' ? -8 : 0, kind === 'defeat' ? 650 : 450, at);
    motion.reveal(host.querySelector('#over-detail, #end-reason'), kind === 'defeat' ? 500 : 350, 0, 850, at);
  }
  motion.reveal(host.querySelector('form'), 450, kind === 'defeat' ? 10 : kind === 'abort' ? 5 : 8, kind === 'victory' ? 1800 : 1300, at);
}

/** A single turn token travels between the real player portraits. */
export function handoff(motion: UiMotion, host: HTMLElement, target: HTMLElement, at: number): void {
  host.querySelector('.ui-turn-token')?.remove();
  const other = [...host.querySelectorAll<HTMLElement>('.player-strip .portrait')].find(p => p !== target);
  if (!other || !Number.isFinite(at)) return;
  const token = document.createElement('span'); token.className = 'ui-turn-token'; token.textContent = '◆'; token.setAttribute('aria-hidden', 'true');
  const box = host.getBoundingClientRect(), end = target.getBoundingClientRect(), start = other.getBoundingClientRect();
  token.style.left = `${end.left + end.width / 2 - box.left}px`;
  token.style.top = `${end.top + end.height / 2 - box.top}px`;
  host.append(token);
  const animation = motion.play(token, [{ opacity: 1, transform: `translate(${start.left - end.left}px, ${start.top - end.top}px) rotate(0deg)` }, { opacity: 1, transform: 'translate(0,0) rotate(90deg)', offset: .9 }, { opacity: 0, transform: 'translate(0,0) rotate(90deg)' }], 700, 0, at);
  // A transparent token at an old position can enlarge the board after a resize.
  if (animation) void animation.finished.then(() => token.remove(), () => token.remove());
  else token.remove();
}

/** The check frame tightens once; the portrait art stays in place. */
export function checkFrame(motion: UiMotion, portrait: HTMLElement, at = performance.now()): void {
  let frame = portrait.querySelector<HTMLElement>('.ui-check-frame');
  if (!frame) { frame = document.createElement('i'); frame.className = 'ui-check-frame'; frame.setAttribute('aria-hidden', 'true'); portrait.append(frame); }
  motion.play(frame, [{ opacity: 0, scale: '1.2' }, { opacity: 1, scale: '1' }], 430, 250, at);
}

const clamp = (n: number) => Math.max(0, Math.min(1, n));
const ease = (n: number) => { n = clamp(n); return n * n * (3 - 2 * n); };
export const CAST_SPENT_MS = 500;
/**
 * The local release at the card (ticket 86): Freeze or Firewall gathers a little of its board material on the card for
 * CAST_PREPARE_MS, then the card's light drains into the spent state by CAST_SPENT_MS. Nothing travels to the board.
 * `host` holds the material layer (#game-table); `coin` is the spent card coin, found again by id after a rebuild.
 */
export function castRelease(motion: UiMotion, host: HTMLElement, coin: HTMLElement, card: 'Freeze' | 'Firewall', at: number): void {
  // The approved card glow on the coin face, sampled at 0, 125, 250 and 375 ms on a linear clock: brightness
  // 1 + .2 sin(pi ms / 500), grey and fade by the spent value. The preview's emblem also dims by .28 of the spent value,
  // to brightness .72 at rest; the game's spent coin keeps its own static style (brightness 1, the G2 contrast), so the
  // release ends there instead. The animation has no last keyframe, so it ends on that static style.
  const paint = coin.querySelector('.coin-paint');
  motion.play(paint, [
    { transform: 'translateY(-4px) scale(1)', filter: 'grayscale(0) brightness(1)', opacity: 1 },
    { transform: 'translateY(-4px) scale(1)', filter: 'grayscale(0) brightness(1.14)', opacity: 1, offset: .25 },
    { filter: 'grayscale(.26) brightness(1.2)', opacity: .96, offset: .5 },
    { filter: 'grayscale(.74) brightness(1.14)', opacity: .89, offset: .75 },
  ], CAST_SPENT_MS, 0, at, 'linear');
  if (host.querySelector(`.ui-cast-release[data-coin="${coin.id}"]`)) return;
  const layer = document.createElement('canvas'); layer.className = 'ui-cast-release'; layer.dataset.coin = coin.id; layer.setAttribute('aria-hidden', 'true');
  host.append(layer);
  // The layer's own opacity animation is the clock, so pace, reduced motion, hiding and cancel stop it with the rest.
  const clock = motion.play(layer, [{ opacity: 1 }, { opacity: 1 }], CAST_SPENT_MS, 0, at, 'linear');
  if (!clock) { layer.remove(); return; }
  const draw = card === 'Freeze' ? drawFreeze : drawFirewall, total = Number(clock.effect?.getComputedTiming().duration) || CAST_SPENT_MS;
  // The material sets its own alpha, so it draws on its own canvas first; the layer then fades that image, as the preview does.
  const material = document.createElement('canvas');
  const frame = () => {
    const target = document.getElementById(coin.id), ms = Number(clock.currentTime ?? 0) * CAST_SPENT_MS / total;
    if (clock.playState !== 'running' || !target || !layer.isConnected) { layer.remove(); return; }
    const box = host.getBoundingClientRect(), face = target.getBoundingClientRect(), scale = face.width / 142, dpr = Math.min(2, devicePixelRatio || 1);
    // The material's foot sits low on the card face, as on a figure.
    Object.assign(layer.style, { left: `${face.left - box.left + face.width / 2 - 80 * scale}px`, top: `${face.top - box.top + face.height * .8 - 145 * scale}px`, width: `${160 * scale}px`, height: `${180 * scale}px` });
    layer.width = material.width = Math.round(160 * scale * dpr); layer.height = material.height = Math.round(180 * scale * dpr);
    const paint = material.getContext('2d')!, ctx = layer.getContext('2d')!;
    paint.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);
    for (const front of [false, true]) draw(paint, { x: 80, y: 145, progress: .32 * ease(ms / CAST_PREPARE_MS), front, seed: 3 });
    ctx.globalAlpha = (1 - ease((ms - CAST_PREPARE_MS) / (CAST_SPENT_MS - CAST_PREPARE_MS))) * .86;
    ctx.drawImage(material, 0, 0);
    requestAnimationFrame(frame);
  };
  void clock.finished.then(() => layer.remove(), () => layer.remove());
  frame();
}
