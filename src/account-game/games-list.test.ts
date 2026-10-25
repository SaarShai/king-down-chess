import { afterEach, expect, it, vi } from 'vitest';
import { DEFAULT_OPTIONS } from '../match/setup';

afterEach(() => vi.unstubAllGlobals());
import type { InboxEntry } from '../match/protocol';
import { nextGame } from './next-game';
const entry = (game_id: string, computer = false, fields: Partial<InboxEntry> = {}) => ({ game_id, rating_policy: 'casual', status: 'playing', action: 'ready', opponent: { computer }, ...fields }) as InboxEntry;

it('prefers the first ready person to a computer and keeps inbox order within each group', () => {
  const computer = entry('computer', true), person = entry('person'), later = entry('later');
  expect(nextGame([computer, person, later])).toBe(person);
  expect(nextGame([computer, person, later], 'person')).toBe(later);
  expect(nextGame([computer, person], 'person')).toBe(computer);
  expect(nextGame([computer, entry('other-computer', true)])).toBe(computer);
});
it('skips waiting games and games that need the opponent, but includes setup choices', () => {
  const setup = entry('setup', false, { status: 'setup' });
  expect(nextGame([entry('waiting', false, { status: 'waiting' }), entry('opponent', false, { action: 'waiting' }), setup])).toBe(setup);
  expect(nextGame([], 'missing')).toBeUndefined();
  expect(nextGame([setup], 'setup')).toBeUndefined();
});

// Keep the row nodes so the test sees each flex item that gamesList creates.
class RowNode {
  className = ''; textContent = ''; dataset = {}; children: (RowNode | string)[] = [];
  append(...nodes: (RowNode | string)[]) { this.children.push(...nodes); }
  replaceChildren(...nodes: RowNode[]) { this.children = nodes; }
  setAttribute() {}
}
it.each(['playing', 'waiting'] as const)('gives the dot its own item in a %s game row', async status => {
  vi.stubGlobal('document', { createElement: () => new RowNode() });
  vi.stubGlobal('navigator', { language: 'en-US' });
  vi.stubGlobal('addEventListener', () => {});
  const { gamesList, gameDetail } = await import('./games-list');
  const game = entry('row', false, { status, seat: 0, move: 2, created_at: '2026-10-17T16:00:00Z', options: DEFAULT_OPTIONS });
  const target = new RowNode();
  gamesList(target as unknown as HTMLElement, [game], () => {}, Date.parse(game.created_at));
  const row = target.children[0] as RowNode, line = row.children.find(n => typeof n !== 'string' && n.className === 'line') as RowNode;
  expect(line.textContent).toBe(status === 'waiting' ? 'Just opened' : 'Move 2');
  const info = line.children.find(n => typeof n !== 'string' && n.className === 'game-detail') as RowNode;
  expect(line.children[0]).toBe(' ');
  expect(info.children.map(n => typeof n === 'string' ? n : n.textContent)).toEqual(['·', ' ', gameDetail(game)]);
});

it('opens each full game ID once and returns its button in inbox order', async () => {
  vi.stubGlobal('document', { createElement: () => new RowNode() });
  vi.stubGlobal('navigator', { language: 'en-US' });
  const { gamesList } = await import('./games-list');
  const games = ['aabbccdd-1111-2222-3333-444444444444', 'aabbccdd-9999-2222-3333-444444444444']
    .map(id => entry(id, false, { created_at: '2026-10-17T16:00:00Z', options: DEFAULT_OPTIONS }));
  const target = new RowNode(), open = vi.fn();
  const rows = gamesList(target as unknown as HTMLElement, games, open);
  expect([...rows.keys()]).toEqual(games.map(game => game.game_id));
  expect([...rows.values()]).toEqual(target.children);
  for (const button of rows.values()) button.onclick!.call(button, {} as PointerEvent);
  expect(open.mock.calls).toEqual(games.map(game => [game.game_id]));
});

it.each([['casual', 'Casual'], ['ranked-v1', 'Ranked'], ['legacy', 'Legacy rated']] as const)('shows stored policy %s on each game detail', async (rating_policy, label) => {
  vi.stubGlobal('navigator', { language: 'en-US' });
  const { gameDetail } = await import('./games-list');
  expect(gameDetail(entry('policy', false, { rating_policy, created_at: '2026-10-17T16:00:00Z', seat: 0 }))).toMatch(new RegExp(`^${label} ·\u00a0White`));
});

it('marks an old computer game as Legacy without calling it rated', async () => {
  vi.stubGlobal('navigator', { language: 'en-US' });
  const { gameDetail } = await import('./games-list');
  expect(gameDetail(entry('computer', true, { kind: 'solo', rating_policy: 'legacy', created_at: '2026-10-17T16:00:00Z', seat: 0 }))).toMatch(/^Legacy ·\u00a0White/);
});

it.each([['beginner','Casual'],['casual','Clever'],['club','Club'],['strong','Strong']] as const)('names an old computer game at level %s', async (level, label) => {
  const { gameTitle } = await import('./games-list');
  expect(gameTitle(entry('computer', true, { level }))).toBe(`Computer · ${label}`);
});
