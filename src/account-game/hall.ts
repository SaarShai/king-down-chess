import type { InboxEntry, View } from '../match/protocol';
import { GameReadError, type GameClient, type PageHost, type ReadRoute } from './client';
import { gamesList } from './games-list';
import { messageLine, type Store } from './state';
import { errorText } from './types';

export type HallMemory = { games: InboxEntry[]; dirty: boolean };
export const createHallMemory = (): HallMemory => ({ games: [], dirty: true });

/** Keep current display fields at the same revision and rules from the same game. */
export function acceptedView(current: View | undefined, next: View): View | undefined {
  if (current?.game_id !== next.game_id) return next;
  if (next.revision < current.revision) return;
  return next.rules || !current.rules ? next : { ...next, rules: current.rules };
}

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id)! as T;

export function createHall(memory: HallMemory, client: GameClient, host: PageHost, store: Store, onView: (view: View) => void) {
  // The plugin supplies these controls. The web hall leaves this template absent.
  const rows = document.getElementById('games-list') ?? document.createElement('div'); rows.id = 'games-list';
  const controls = document.querySelector<HTMLTemplateElement>('#hall-controls')?.content;
  const start = controls?.querySelector('#games-start'), footer = controls?.querySelector('.new-game-foot');
  start?.remove(); footer?.remove();
  $('new-game').innerHTML = '<header class="new-game-head"><h2>Play</h2></header><div class="new-game-body"><h3 id="games-head" class="group-head">Your games</h3><div id="games-empty" hidden><p>No games yet.</p></div><p id="games-status" role="status"></p></div>';
  const body = $('new-game').querySelector('.new-game-body')!;
  body.append(rows);
  if (start) $('games-empty').append(start);
  if (controls) body.append(controls);
  const navigation: HTMLButtonElement[] = [];
  for (const [screen, title, line] of [['profile', 'Profile', 'Your scroll, rating and badges.'], ['settings', 'Settings', 'Symbols only, Show threats, Who sees when you are online.']] as const) {
    const button = document.createElement('button'); button.className = 'menu-row'; button.dataset.nav = screen;
    button.innerHTML = `<span class="row-title">${title}</span><span class="line">${line}</span><i aria-hidden="true">›</i>`;
    button.onclick = () => { if (!disposed) host.navigate({ screen }); }; navigation.push(button); body.append(button);
  }
  if (footer) $('new-game').append(footer);

  let disposed = false, failed = false, generation = 0, route: ReadRoute | undefined;
  let list: AbortController | undefined, selected: AbortController | undefined;
  let stopHost = () => {};
  const cancel = () => { generation++; list?.abort(); selected?.abort(); };
  function render() {
    if (disposed) return;
    $('games-status').textContent = ''; $('games-empty').hidden = !!memory.games.length;
    gamesList($('games-list'), memory.games, gameId => { if (!disposed) host.navigate({ screen: 'game', gameId }); });
    store.sync();
  }
  function acceptGames(entries: InboxEntry[]) {
    if (disposed) return;
    list?.abort();
    memory.games = entries; memory.dirty = false; failed = false;
    render();
  }
  async function refresh(signal?: AbortSignal): Promise<boolean> {
    if (disposed || signal?.aborted) return false;
    list?.abort(); const read = list = new AbortController(), version = generation;
    const abort = () => read.abort(); signal?.addEventListener('abort', abort, { once: true });
    const current = () => !disposed && !read.signal.aborted && list === read && version === generation;
    $('games-status').textContent = 'Loading games…';
    try {
      const entries = await client.games(read.signal);
      if (!current()) return false;
      acceptGames(entries);
      store.dispatch({ type: 'good-read' });
      return true;
    } catch (error) {
      if (!current() || error instanceof Error && error.name === 'AbortError') return false;
      $('games-status').textContent = errorText(error);
      failed = true;
      if (store.page().notice?.kind !== 'refusal') store.dispatch({ type: 'failed-read', text: errorText(error) });
      return false;
    } finally { read.abort(); signal?.removeEventListener('abort', abort); }
  }
  async function open(gameId: string) {
    const read = selected = new AbortController(), version = generation;
    const current = () => !disposed && !read.signal.aborted && version === generation;
    try {
      const next = await client.game(gameId, read.signal);
      if (!current()) return;
      if (next.game_id !== gameId) throw new GameReadError('UNAVAILABLE', 'The game reply does not match this game.');
      const view = acceptedView(store.page().view, next);
      if (!view) return;
      failed = false; store.dispatch({ type: 'good-read', game: gameId }); onView(view);
    } catch (error) {
      if (!current() || error instanceof Error && error.name === 'AbortError') return;
      failed = true;
      if (store.page().notice?.kind !== 'refusal') store.dispatch({ type: 'failed-read', text: errorText(error) });
    } finally { read.abort(); }
  }
  function enter(next: ReadRoute) {
    if (disposed) return;
    cancel(); route = next; host.save(next);
    if (next.screen === 'game') void open(next.gameId);
    else if (next.screen === 'play') { render(); if (memory.dirty) void refresh(); }
  }
  const retry = (event: Event) => {
    if (!failed || messageLine(store.page()).action !== 'try-again' || disposed || store.page().notice?.kind !== 'read' || !['home', 'play', 'profile', 'settings'].includes(store.page().screen)) return;
    event.stopImmediatePropagation();
    if (route?.screen === 'game') { selected?.abort(); void open(route.gameId); }
    else void refresh();
  };
  // WebKit needs focus before the click handler, so a sheet can return to its opener.
  const focus = (event: MouseEvent) => {
    if (disposed) return;
    const button = event.isTrusted && (event.target as Element | null)?.closest?.('button');
    if (button && $('app-root').contains(button) && document.activeElement !== button) button.focus({ preventScroll: true });
  };
  // Reveal the label, then keep its input in view if the label exceeds the scroll area.
  const reveal = (event: FocusEvent) => {
    if (disposed) return;
    const target = event.target as HTMLElement | null, control = target?.closest?.('label') ?? target;
    if (control && $('app-root').contains(control)) {
      control.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      if (target !== control) target!.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  };
  window.addEventListener('focusin', reveal);
  window.addEventListener('click', focus, true);
  $('retry')?.addEventListener('click', retry, true);
  function close() {
    cancel(); memory.games = []; memory.dirty = true;
    $('games-list').replaceChildren(); $('games-status').textContent = '';
  }
  function dispose() {
    if (disposed) return;
    disposed = true; close(); stopHost();
    for (const button of navigation) button.onclick = null;
    window.removeEventListener('focusin', reveal);
    window.removeEventListener('click', focus, true); $('retry')?.removeEventListener('click', retry, true);
  }
  stopHost = host.start(enter, close);
  if (disposed) stopHost();
  return { refresh, acceptGames, render, dispose };
}
