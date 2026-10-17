import type { View } from '../match/protocol';
export type PollView = View | 'waiting for a join' | undefined;
export function pollDelay(view: PollView, waitingMs: number, hidden: boolean): number | undefined {
  if (hidden || !view) return;
  if (view === 'waiting for a join') return waitingMs < 120000 ? 5000 : 15000;
  if (view.kind === 'solo' || view.status === 'finished' || view.status === 'aborted') return;
  if (view.status === 'waiting' || view.status === 'setup') return waitingMs < 120000 ? 5000 : 15000;
  if (view.draw_offer != null) return 3000;
  const age = (mine: boolean, types?: string[]) => Date.parse(view.server_now) - Math.max(...view.last_commands
    .filter(command => command.seat !== null && (command.seat === view.seat) === mine && (!types || types.includes(command.action.type)))
    .map(command => Date.parse(command.at)).filter(Number.isFinite));
  // For 2 minutes after your own move, draw or rematch command, the other side's answer shows within 3 seconds.
  if (age(true, ['turn', 'draw', 'rematch']) < 120000) return 3000;
  const seen = view.opponent?.last_seen_ms ?? Math.max(0, age(false));
  if (view.turn !== view.seat && seen < 120000) return 3000;
  return view.speed === 'daily' ? 30000 : 15000;
}

/** One poll target: the view that sets the delay, and the read that a tick runs (design §4). */
export type PollTarget = { view: PollView; read: () => Promise<unknown> };
/**
 * The page's one poll. A tick runs only while the page shows, a target exists and `gate()` is true; a closed gate skips
 * the tick and waits one more delay. `visibilitychange` and `pageshow` start one fresh read; missed ticks do not run.
 */
export function runPoll(target: () => PollTarget | undefined, gate: () => boolean = () => true, page: EventTarget & { readonly hidden: boolean } = document) {
  let timer: ReturnType<typeof setTimeout> | undefined, stopped = false, reading = false, woke = -Infinity;
  // Each wait keeps its own clock, so a target switch (the computer handoff) does not restart it.
  const began = new Map<string | undefined, number>();
  function update() {
    clearTimeout(timer);
    if (stopped || reading) return;
    const view = target()?.view;
    const key = view === 'waiting for a join' ? view : view && (view.status === 'waiting' || view.status === 'setup') ? `${view.game_id}:${view.status}` : undefined;
    if (!began.has(key)) began.set(key, Date.now());
    const delay = pollDelay(view, Date.now() - began.get(key)!, page.hidden);
    if (delay !== undefined) timer = setTimeout(tick, delay);
  }
  async function tick() {
    clearTimeout(timer);
    if (stopped || reading || page.hidden) return;
    const next = target();
    if (!next || !gate()) { update(); return; }
    reading = true;
    try { await next.read(); } catch {} finally { reading = false; update(); }
  }
  // The two wake events of one return come together: they start one read.
  function wake() { if (page.hidden) clearTimeout(timer); else if (Date.now() - woke >= 1000) { woke = Date.now(); void tick(); } }
  page.addEventListener('visibilitychange', wake); page.addEventListener('pageshow', wake);
  void tick();
  return { update, stop() { stopped = true; clearTimeout(timer); page.removeEventListener('visibilitychange', wake); page.removeEventListener('pageshow', wake); } };
}
