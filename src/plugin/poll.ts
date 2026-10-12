import type { View } from '../match/protocol';
export type PollView = View | 'waiting for a join' | undefined;
export function pollDelay(view: PollView, waitingMs: number, hidden: boolean): number | undefined {
  if (hidden || !view) return;
  if (view === 'waiting for a join') return waitingMs < 120000 ? 5000 : 15000;
  if (view.kind === 'solo' || view.status === 'finished' || view.status === 'aborted') return;
  if (view.status === 'waiting' || view.status === 'setup') return waitingMs < 120000 ? 5000 : 15000;
  const commands = view.last_commands.filter(command => command.seat !== null && command.seat !== view.seat).map(command => Date.parse(command.at)).filter(Number.isFinite);
  const seen = view.opponent?.last_seen_ms ?? Math.max(0, Date.parse(view.server_now) - Math.max(...commands));
  if (view.turn !== view.seat && seen < 120000) return 3000;
  return view.speed === 'daily' ? 30000 : 15000;
}

export function runPoll(current: () => PollView, read: () => Promise<unknown>, page: EventTarget & { readonly hidden: boolean } = document) {
  let timer: ReturnType<typeof setTimeout> | undefined, stopped = false, reading = false;
  let waitKey: string | undefined, began = Date.now();
  function update() {
    clearTimeout(timer);
    if (stopped || reading) return;
    const view = current();
    const key = view === 'waiting for a join' ? view : view && (view.status === 'waiting' || view.status === 'setup') ? `${view.game_id}:${view.status}` : undefined;
    if (view && key !== waitKey) { waitKey = key; began = Date.now(); }
    const delay = pollDelay(view, Date.now() - began, page.hidden);
    if (delay !== undefined) timer = setTimeout(tick, delay);
  }
  async function tick() {
    clearTimeout(timer);
    if (stopped || reading || page.hidden) return;
    reading = true;
    try { await read(); } catch {} finally { reading = false; update(); }
  }
  function visible() { if (page.hidden) clearTimeout(timer); else void tick(); }
  page.addEventListener('visibilitychange', visible);
  void tick();
  return { update, stop() { stopped = true; clearTimeout(timer); page.removeEventListener('visibilitychange', visible); } };
}
