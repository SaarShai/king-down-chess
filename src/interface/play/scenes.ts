/**
 * The test page of the play screen (`play-scenes.html?scene=<name>`). Each scene is a state of the play screen: the
 * page writes the scene's records into a memory store, loads the play screen, presses the scene's controls, then sets
 * `document.body.dataset.sceneReady`. The memory store stands in for `localStorage` and `sessionStorage`, so the
 * player's saved game and sign-in on this origin stay as they are. An empty memory cache store stands in for `caches`, and
 * the page has no `navigator.serviceWorker`, so the origin's caches and service workers stay as they are. `fetch` answers `/api` from the scene data and
 * refuses all else: the page sends no request to the game server or to a different host.
 * Add a scene: one entry in SCENES (records, steps, the selector that shows the state).
 */
import { memoryStorage } from '../people/fake-server';
import { panelText, text } from './texts';

interface Scene { save?: object; online?: object; steps?: string[]; ready: string }
// White to move; the opponent's queen mates on h4 (the "fool's mate").
const LOST = 'rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3';
const SOLO = { back: 'RNBQKBNR', fen: '', moves: ['e2-e4', 'e7-e5'], white: 'human', black: 'ai', rules: { kings: [null, null], hands: [[], []] }, pace: 'off' };
const LOSS = { status: 'finished', result: { winner: 1, reason: 'checkmate' }, fen: LOST, rematch_offer: null };
const SCENES: Record<string, Scene> = {
  'online-loss': { online: LOSS, ready: '.play-result' },
  'online-loss-offer': { online: { ...LOSS, rematch_offer: 1 }, ready: '.play-result' },
  'solo-result': { save: SOLO, steps: [text.resume, text.menu, text.resign, text.resign], ready: '.play-result' },
  'menu': { save: SOLO, steps: [text.resume, text.menu], ready: 'dialog.game-menu-dialog[open]' },
  'new-game': { save: SOLO, steps: [text.newGame], ready: 'dialog.new-game-panel[open]' },
  'setup-powers': { save: SOLO, steps: [text.newGame, 'Powers'], ready: '.setup-overlay:not([hidden])' },
  'setup-cards': { save: SOLO, steps: [text.newGame, text.cards], ready: '.setup-overlay:not([hidden])' },
  'home-signed-out': { ready: '.play-home[data-state="new"] .home-sign-in:not([hidden])' },
  'home-saved': { save: SOLO, ready: '.play-home[data-state="saved"] .home-continue' },
  'setup-more': { save: SOLO, steps: [text.newGame, panelText.more], ready: '.setup-overlay:not([hidden]) [data-choice="more"]' },
  'setup-friend': { steps: [text.friend], ready: 'dialog.new-game-panel[open] .setup-friend-foot:not([hidden])' },
  'guide-pieces': { steps: [text.guide], ready: '.guide-page[data-section="Pieces"] .guide-panel' },
  'guide-cards': { steps: [text.guide, text.cards], ready: '.guide-page[data-section="Cards"] .guide-panel' },
  'settings': { steps: [text.settingsLabel], ready: 'dialog.settings-sheet[open] .settings-account [aria-haspopup="dialog"]' },
};

const GAME = '00000000-0000-4000-8000-000000000001', ME = '00000000-0000-4000-8000-000000000002';
const now = new Date().toISOString(), later = new Date(Date.now() + 365 * 86_400_000);
const view = (scene: object) => ({ game_id: GAME, rating_policy: 'casual', revision: 7, created_at: now, abort_open: false, seat: 0, kind: 'friend', speed: 'daily', days_per_move: 3, turn: 0, action: 'done', in_check: true, legal: [], last_commands: [], draw_offer: null, rematch_allowed: true, rematch_game_id: null, deadline_at: null, server_now: now,
  opponent: { handle: 'wwwwwwwwwwwwwwwwwwww', icon: 'frost', avatar: null, computer: false, deleted: false, last_seen_ms: 0 }, ...scene });
const session = { access_token: 'scene-token', token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(later.getTime() / 1000), refresh_token: 'scene-refresh',
  user: { id: ME, aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: now } };

const name = new URLSearchParams(location.search).get('scene') ?? '', scene = SCENES[name];
const store = memoryStorage(), tab = memoryStorage();
Object.defineProperty(window, 'localStorage', { value: store, configurable: true });
Object.defineProperty(window, 'sessionStorage', { value: tab, configurable: true });
// The online client deletes old `kingdown-` caches before a send; a scene has no cache to delete.
Object.defineProperty(window, 'caches', { value: { keys: async () => [], delete: async () => false }, configurable: true });
Object.defineProperty(navigator, 'serviceWorker', { value: undefined, configurable: true });
// The sign-in client tells the other tabs of this origin about a session; a scene tells them nothing.
Object.defineProperty(window, 'BroadcastChannel', { value: undefined, configurable: true });
const json = (body: unknown, status = 200) => new Response(status === 204 ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const answer = (path: string, method: string) => {
  if (method === 'GET' && path === `/api/games/${GAME}`) return json(view(scene?.online ?? {}));
  if (path === '/api/me/settings') return json({ settings: {}, me: { handle: 'alex', icon: 'flame' } });
  if (path === '/api/me/games') return json({ games: [], invitations: [], next_before: null });
  if (path === '/api/me/record') return json({ handle: 'alex', icon: 'flame', record: {}, notices: [], blocks: [], history: [], next_before: null });
  if (method === 'POST' && path.endsWith('/seen')) return json(null, 204);
  return json({ code: 'NOT_FOUND', message: 'Not in the scene' }, 404);
};
window.fetch = async (input, init) => {
  const url = new URL(input instanceof Request ? input.url : String(input), location.href);
  if (url.origin !== location.origin || !url.pathname.startsWith('/api/')) throw new TypeError('Failed to fetch');
  return answer(url.pathname, init?.method ?? (input instanceof Request ? input.method : 'GET'));
};

const shown = (node: Element) => node.checkVisibility() && !node.closest('[inert]');
const frame = () => new Promise(done => requestAnimationFrame(done));
async function find(test: () => Element | undefined) { for (;;) { const node = test(); if (node) return node; await frame(); } }
// The state is on the screen when its moves end (a loop, such as an idle figure, never ends).
const settled = async () => { for (let list; (list = document.getAnimations().filter(a => a.playState !== 'finished' && a.effect?.getTiming().iterations !== Infinity)).length;) await Promise.allSettled(list.map(a => a.finished)); };
/** Press the shown button or tab with this name, as a player does. */
const press = async (label: string) => (await find(() => [...document.querySelectorAll<HTMLButtonElement>('button:not([role]), button[role="button"], button[role="tab"]')]
  .find(b => shown(b) && (b.getAttribute('aria-label') ?? b.textContent?.trim()) === label)) as HTMLButtonElement).click();

if (!scene) {
  const list = document.createElement('ul');
  for (const key of Object.keys(SCENES)) { const link = document.createElement('a'); link.href = `?scene=${key}`; link.textContent = key; list.append(document.createElement('li')); list.lastElementChild!.append(link); }
  document.querySelector('#app')!.replaceChildren(Object.assign(document.createElement('h1'), { textContent: 'Play screen scenes' }), list);
} else {
  sessionStorage.setItem('kingdown.title-seen', '1');
  localStorage.setItem('kingdown.solo-launch-seen', '1');
  if (scene.save) localStorage.setItem('kingdown.save', JSON.stringify(scene.save));
  if (scene.online) { localStorage.setItem('kingdown.auth', JSON.stringify(session)); history.replaceState(null, '', `${location.search}#online=${GAME}`); }
  await import('./main');
  for (const step of scene.steps ?? []) { await press(step); await frame(); await settled(); }
  await find(() => [...document.querySelectorAll(scene.ready)].find(shown));
  await document.fonts.ready; await settled(); await frame(); await frame();
  document.body.dataset.sceneReady = name;
}
export {};
