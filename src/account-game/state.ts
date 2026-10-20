// The client's one state slot (design §1 and §3, ticket 19 S2): the notice reducer, the message line,
// the scoped locks and render(). This file holds no transport code, so its selectors are pure.
import type { Pending, Screen } from './types';
import type { View } from '../match/protocol';

/** The four notice kinds (design §1.1). One slot; the first match wins in the message line. */
export type NoticeKind = 'refusal' | 'read' | 'error' | 'connect';
export type Notice = { kind: NoticeKind; text: string; game?: string; screen?: Screen; code?: string };

/** The page parts the message line and the scoped locks read. */
export type Page = {
  screen: Screen;
  pending?: Pending;
  view?: View;
  connected: boolean;
  mounting: boolean;
  writing: boolean;
  settings?: boolean;
  handle_back?: Screen;
  settings_back?: Screen;
  notice?: Notice;
};

/** One message slot and the poll's failure count (design §1.1: the poll keeps its own counter). */
export type Slot = { notice?: Notice; polls: number };

export type Action =
  | { type: 'change' }
  | { type: 'navigate' }
  | { type: 'command' }
  | { type: 'view'; game?: string }
  | { type: 'good-read'; game?: string }
  | { type: 'refusal'; text: string; code?: string; game?: string }
  | { type: 'failed-read'; text: string; game?: string }
  | { type: 'failed-poll'; text: string; game?: string }
  | { type: 'error'; text: string }
  | { type: 'connect'; text: string }
  | { type: 'connected' };

export const GAME_SCREENS: Screen[] = ['seat', 'board', 'wait', 'friend', 'end'];
const START_TOOLS = ['kingdown_create', 'kingdown_find'];

/** A start, or the step of one that still holds the setup flow. */
export const isStart = (pending: Pending) => START_TOOLS.includes(pending.name);

/** A start, or a step of one that still holds the setup flow: it belongs to Play, not to the game the page shows. */
export const isStartStep = (pending: Pending) => isStart(pending) || pending.screen === 'play' || !!pending.quick;

/** Derived, never stored (design §1.1). */
export const blocked = (page: Page) => !page.connected || page.writing || page.mounting;

/** The pending command belongs to what the screen shows now. It never reads another game. */
export function pendingHere(page: Page) {
  const pending = page.pending;
  if (!pending) return false;
  // A game command belongs to the game it names, only while that game shows on a game screen.
  if (pending.game_tag && GAME_SCREENS.includes(page.screen) && !!page.view?.game_id.startsWith(pending.game_tag)) return true;
  // Starts and setup steps keep their error and Retry on Play, and on the screen where they started (Wait, Open games).
  if (isStartStep(pending)) return page.screen === 'play' || page.screen === pending.screen;
  // A command with no game shows on the screen where it failed.
  return !pending.game_tag && pending.error_screen === page.screen;
}

/** The read notice is for the game the page shows: its game lock and "Not current". A notice with no game covers a first read. */
export const staleRead = (page: Page) => page.notice?.kind === 'read' && (!page.notice.game || page.notice.game === page.view?.game_id);

/** A notice shows on a screen and, for a game, only while that game shows on a game screen. */
export function noticeShows(page: Page, notice: Notice) {
  if (notice.kind === 'connect') return true;
  if (notice.kind === 'error') return notice.screen === page.screen;
  // A read or refusal that names no game has no scope, as today; a named one follows its game.
  if (!notice.game) return true;
  return GAME_SCREENS.includes(page.screen) && page.view?.game_id === notice.game;
}

export type Line = { text: string; action: 'none' | 'retry' | 'try-again' | 'connect'; status: boolean };

/** The message line (design §3.2): the first match wins. */
export function messageLine(page: Page): Line {
  if (page.pending?.error && pendingHere(page)) return { text: page.pending.error, action: 'retry', status: false };
  const notice = page.notice;
  if (notice && noticeShows(page, notice)) {
    if (notice.kind === 'refusal') return { text: notice.text, action: 'none', status: false };
    if (notice.kind === 'read') return { text: notice.text, action: 'try-again', status: staleRead(page) || !page.view };
    if (notice.kind === 'error') return { text: notice.text, action: 'none', status: false };
    return { text: notice.text, action: 'connect', status: false };
  }
  return { text: '', action: 'none', status: false };
}

export type Locks = { blocked: boolean; game: boolean; start: boolean; toggles: boolean; retry: boolean; label: string };

/** The scoped locks (design §3.3). A game command never locks Start. */
export function locks(page: Page): Locks {
  const line = messageLine(page);
  return {
    blocked: blocked(page),
    game: blocked(page) || pendingHere(page) || staleRead(page),
    start: blocked(page) || (!!page.pending && (isStart(page.pending) || page.pending.screen === 'play')),
    toggles: blocked(page) || !page.settings,
    // A control that does nothing must look off: the line's button stays off while the page is blocked (design §3.3).
    // The one exception is a failed connect: `connected` is false then, and Try again is the way back.
    retry: line.action !== 'none' && (!blocked(page) || line.action === 'connect'),
    label: line.action === 'retry' ? 'Retry' : 'Try again',
  };
}

const TITLES: Partial<Record<Screen, string>> = { friend: 'A friend', join: 'Join a game', wait: 'Looking for an opponent', lobby: 'Open games', seat: 'Set up your side', end: 'Game over', profile: 'Profile', collection: 'Collection', settings: 'Settings', handle: 'Pick a name and a picture' };

/** The back label of the page header (design §3.1). */
export const backLabel = (page: Page) => page.screen === 'handle' && page.handle_back === 'settings' ? '‹ Settings' : page.screen === 'collection' ? '‹ Profile' : page.screen === 'settings' && (page.settings_back === 'board' || page.settings_back === 'seat') ? '‹ Game' : '‹ Play';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T | null;

/** The view switch and the message line: render() is their only writer (design §3). */
export function renderPage(page: Page) {
  // A write only on a change: the page's own observers (wait, lobby, join) react to the attribute.
  if (document.body.dataset.page !== page.screen) document.body.dataset.page = page.screen;
  document.querySelectorAll<HTMLElement>('[data-screen]').forEach(el => { el.hidden = el.dataset.screen !== page.screen; });
  const frame = $('app-frame'); if (frame) frame.hidden = page.screen === 'home';
  const head = $('page-head'); if (head) head.hidden = page.screen === 'home' || page.screen === 'play';
  const back = $('page-back'); if (back) back.textContent = backLabel(page);
  const title = $('page-title'); if (title) title.textContent = TITLES[page.screen] ?? '';
  const line = messageLine(page);
  // The line shows once: the home card has its own line on home; the frame's line takes it elsewhere.
  const error = $('error'); if (error) error.textContent = page.screen === 'home' ? '' : line.text;
  const home = $('home-error'); if (home) home.textContent = page.screen === 'home' ? line.text : '';
  const retry = $<HTMLButtonElement>('retry');
  if (retry) { retry.hidden = line.action === 'none'; retry.textContent = line.action === 'retry' ? 'Retry' : 'Try again'; }
  if (line.status) $('status')?.replaceChildren(document.createTextNode('Not current'));
}

/** The lock pass of render(): each button off under the scoped lock. */
export function applyLocks(page: Page) {
  const lock = locks(page);
  document.querySelectorAll<HTMLButtonElement>('button').forEach(button => {
    // Retry follows the message line alone; a failed connect must leave it on while blocked.
    if (button.id === 'retry') { button.disabled = !lock.retry; return; }
    const free = button.hasAttribute('data-free') || button.id === 'page-back' && page.screen === 'settings' && page.connected && !page.mounting;
    button.disabled = button.matches('#king-picker [aria-disabled="true"]')
      || !free && (lock.blocked || lock.game && button.matches('.game-action, #choices button, #context-actions button'));
  });
}

/** The store's state change: the notice reducer, then render(), then the screen subscribers. */
export function reduce(slot: Slot, action: Action, page: Page): Slot {
  switch (action.type) {
    case 'refusal': return { notice: { kind: 'refusal', text: action.text, ...(action.game && { game: action.game }), ...(action.code && { code: action.code }) }, polls: 0 };
    case 'failed-read': return { notice: { kind: 'read', text: action.text, ...(action.game && { game: action.game }) }, polls: 0 };
    case 'failed-poll': {
      const polls = slot.polls + 1;
      return polls < 3 ? { notice: slot.notice, polls } : { notice: { kind: 'read', text: action.text, ...(action.game && { game: action.game }) }, polls };
    }
    case 'error': return { notice: { kind: 'error', text: action.text, screen: page.screen }, polls: slot.polls };
    case 'connect': return { notice: { kind: 'connect', text: action.text }, polls: slot.polls };
    // A failed connect clears when a later connect succeeds.
    case 'connected': return { notice: slot.notice?.kind === 'connect' ? undefined : slot.notice, polls: slot.polls };
    // A good view of a game clears the read notice of that game and resets the poll counter.
    case 'good-read': return { notice: slot.notice?.kind === 'read' && (!slot.notice.game || slot.notice.game === action.game) ? undefined : slot.notice, polls: 0 };
    // A user command clears a refusal and an error, so a Block that works after a failed one shows no old failure; a read never does.
    case 'command': return slot.notice?.kind === 'refusal' || slot.notice?.kind === 'error' ? { notice: undefined, polls: slot.polls } : { ...slot };
    // A view of another game clears a refusal and a read that name another game.
    case 'view': return slot.notice && (slot.notice.kind === 'refusal' || slot.notice.kind === 'read') && slot.notice.game && slot.notice.game !== action.game ? { notice: undefined, polls: slot.polls } : { ...slot };
    // Navigation clears an error notice. It keeps a refusal and a read: they are scoped to their game.
    case 'navigate': return slot.notice?.kind === 'error' ? { notice: undefined, polls: slot.polls } : { ...slot };
    default: return { ...slot };
  }
}

export type BoardCall = (name: string, args: Record<string, unknown>, retain?: boolean, quiet?: boolean, route?: boolean, retry?: boolean, signal?: AbortSignal, user?: boolean) => Promise<View | undefined>;
export type Store = {
  page: () => Page;
  dispatch: (action: Action) => Page;
  render: () => void;
  sync: () => void;
  subscribe: (sync: (page: Page, before: Page) => void) => () => void;
  refusal: () => Notice | undefined;
  call: BoardCall;
};

export function createStore(host: { page: () => Omit<Page, 'notice'>; call: BoardCall }): Store {
  let slot: Slot = { polls: 0 };
  const subscribers: ((page: Page, before: Page) => void)[] = [];
  let syncing = false, again = false;
  const page = (): Page => ({ ...host.page(), ...(slot.notice && { notice: slot.notice }) });
  const render = () => renderPage(page());
  // Each subscriber gets the page before this pass, so it can skip a rebuild that the change does not touch (design §3.4).
  // It stays unset until the first sync: page() reads app memory that is still initializing when createStore runs.
  let previous: Page | undefined;
  // render() runs before the subscribers, and a subscriber that dispatches coalesces into this same pass.
  const sync = () => {
    if (syncing) { again = true; return; }
    syncing = true;
    try { do { again = false; const now = page(); renderPage(now); applyLocks(now); for (const each of subscribers) each(now, previous ?? now); previous = now; } while (again); }
    finally { syncing = false; }
  };
  return {
    page, render, sync, call: host.call,
    dispatch: action => { slot = reduce(slot, action, page()); sync(); return page(); },
    subscribe: fn => {
      subscribers.push(fn);
      return () => { const index = subscribers.indexOf(fn); if (index >= 0) subscribers.splice(index, 1); };
    },
    refusal: () => { const notice = page().notice; return notice?.kind === 'refusal' ? notice : undefined; },
  };
}
