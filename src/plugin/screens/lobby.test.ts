import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { DEFAULT_OPTIONS } from '../../match/setup';
import type { CreationMode, RatingPolicy } from '../../match/protocol';
const harness = vi.hoisted(() => ({
  mode: 'casual' as CreationMode, nodes: new Map<string, any>(), rows: [] as any[],
  memory: { view: undefined as any, games: [] as any[], me: { handle: 'player' as string | null } },
  client: { state: { screen: 'lobby' as string, queued: undefined }, call: vi.fn() },
  call: vi.fn(), start: vi.fn(), send: vi.fn(), navigate: vi.fn(), routeView: vi.fn(),
}));
vi.mock('../../account-game/runtime', () => harness);
vi.mock('./setup', () => ({ ANY_RULES: 'Any rules', currentSetup: () => ({ kind: 'random', mode: harness.mode, options: DEFAULT_OPTIONS, colour: 'white', king: null, level: 'club' }) }));
vi.mock('./friend', () => ({
  $: (id: string) => harness.nodes.get(id), onStop() {}, portrait: () => '', showError: vi.fn(),
  row: () => { const row = { append() {}, classList: { add() {} }, onclick: undefined }; harness.rows.push(row); return row; },
}));
vi.mock('../../account-game/features', () => ({ featureNames: [], features: () => 'features', icon: () => '' }));
const flush = async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); };
const waiting = (rating_policy: RatingPolicy) => ({ game_id: `game-${rating_policy}`, kind: 'random', status: 'waiting', rating_policy, options: DEFAULT_OPTIONS });
afterEach(() => vi.unstubAllGlobals());
beforeEach(() => {
  vi.stubGlobal('document', { createElement: () => ({ className: '', textContent: '' }) });
  vi.resetModules(); harness.nodes.clear(); harness.rows = []; harness.mode = 'casual';
  harness.memory.view = undefined; harness.memory.games = []; harness.memory.me.handle = 'player'; harness.client.state.screen = 'lobby';
  for (const id of ['page-back', 'find-features', 'find-any-row', 'find-any-line', 'find-any-rules', 'find-opponent', 'lobby-key', 'lobby-online', 'lobby-list', 'lobby-status', 'lobby-empty']) harness.nodes.set(id, { checked: false, hidden: false, textContent: '', replaceChildren: vi.fn(), addEventListener() {}, removeEventListener() {} });
  harness.client.call.mockReset().mockImplementation(async (name: string) => ({ _meta: name === 'kingdown_lobby' ? { lobby: { games: [], server_now: '2030-01-01' } } : { games: harness.memory.games } }));
  harness.call.mockReset(); harness.start.mockReset(); harness.send.mockReset(); harness.navigate.mockReset(); harness.routeView.mockReset();
});
it.each(['casual', 'ranked'] as const)('does not reuse an open game from another policy with Any rules in %s', async mode => {
  harness.mode = mode; harness.memory.view = waiting(mode === 'casual' ? 'ranked-v1' : 'casual');
  const { lobbyScreen } = await import('./lobby'); lobbyScreen(); await flush();
  harness.nodes.get('find-any-rules').checked = true;
  await harness.nodes.get('find-opponent').onclick();
  expect(harness.call).not.toHaveBeenCalled();
  expect(harness.start).toHaveBeenCalledWith('random', expect.objectContaining({ mode, ...(mode === 'ranked' ? { colour: 'random' } : { any_rules: true }) }));
});
it.each(['casual', 'ranked'] as const)('resumes an own waiting game only within %s', async mode => {
  harness.mode = mode; harness.memory.view = waiting(mode === 'casual' ? 'casual' : 'ranked-v1');
  const { lobbyScreen } = await import('./lobby'); lobbyScreen(); await flush();
  await harness.nodes.get('find-opponent').onclick();
  expect(harness.call).toHaveBeenCalledWith('kingdown_resume', { game_id: harness.memory.view.game_id }, false, false, false);
  expect(harness.start).not.toHaveBeenCalled();
});
it.each(['casual', 'ranked'] as const)('filters the %s lobby and retains explicit accept policy through handle creation', async mode => {
  harness.mode = mode;
  const games = (['legacy', 'casual', 'ranked-v1'] as const).map(rating_policy => ({ ...waiting(rating_policy), created_at: '2030-01-01', creator: { handle: 'player', icon: null } }));
  harness.client.call.mockImplementation(async (name: string) => ({ _meta: name === 'kingdown_lobby' ? { lobby: { games, server_now: '2030-01-01' } } : { games: [] } }));
  harness.send.mockResolvedValueOnce({ status: 'refused', code: 'HANDLE_NEEDED' }).mockResolvedValue({ status: 'done' });
  const { lobbyScreen } = await import('./lobby'); lobbyScreen(); await flush();
  expect(harness.rows).toHaveLength(mode === 'ranked' ? 1 : 2);
  harness.rows[0].onclick(); await flush();
  const rating_policy = mode === 'ranked' ? 'ranked-v1' : 'legacy';
  expect(harness.send).toHaveBeenLastCalledWith('kingdown_accept', { game_id: `game-${rating_policy}`, rating_policy });
  expect(harness.navigate).toHaveBeenCalledWith('handle');
  lobbyScreen(); await flush();
  expect(harness.send).toHaveBeenCalledTimes(2);
  expect(harness.send).toHaveBeenLastCalledWith('kingdown_accept', { game_id: `game-${rating_policy}`, rating_policy });
});
