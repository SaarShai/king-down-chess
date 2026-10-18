import { beforeEach, expect, it, vi } from 'vitest';

const app = vi.hoisted(() => ({ client: { call: vi.fn(), state: { screen: 'profile' } } }));
vi.mock('../app', () => ({ call: vi.fn(), client: app.client, navigate: vi.fn(), routeView: vi.fn() }));
vi.mock('../art', () => ({ art: () => '', symbols: () => false }));
vi.mock('../client', () => ({ errorText: String }));
vi.mock('../games-list', () => ({ formatDate: () => '', gameDetail: () => '', waitingLine: () => '' }));
vi.mock('./friend', () => ({ features: () => [] }));
vi.mock('./board-actions', () => ({ confirmBoardAction: vi.fn() }));
vi.mock('./profile.css', () => ({}));

function node() {
  return { textContent: '', hidden: false, setAttribute() {}, removeAttribute() {}, replaceChildren() {}, append() {}, querySelector: () => node(), style: {} };
}
beforeEach(() => {
  const nodes = new Map<string, ReturnType<typeof node>>();
  vi.stubGlobal('document', { getElementById: (id: string) => { if (!nodes.has(id)) nodes.set(id, node()); return nodes.get(id); } });
});
const flush = () => new Promise(resolve => setTimeout(resolve, 0));

it('sends the reads of a reopened Profile after the superseded reads end', async () => {
  const { profileScreen } = await import('./profile');
  const replies: (() => void)[] = [];
  app.client.call.mockImplementation(() => new Promise(resolve => { replies.push(() => resolve({ content: [], isError: true })); }));
  profileScreen(); await flush();
  expect(app.client.call.mock.calls.map(([name]) => name)).toEqual(['kingdown_profile', 'kingdown_games']);
  // The server allows three calls at once for each account (http.ts): two more would refuse one.
  profileScreen(); await flush();
  expect(app.client.call).toHaveBeenCalledTimes(2);
  for (const reply of replies.splice(0)) reply();
  await flush();
  expect(app.client.call).toHaveBeenCalledTimes(4);
});
