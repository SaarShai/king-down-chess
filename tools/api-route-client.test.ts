// Each call of the website client (src/online/client.ts) must reach a route key of src/api/http.ts.
// A wrong or renamed path gives a 404 only at run time; this test finds it first.
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { onlineClient } from '../src/online/client';

type Client = ReturnType<typeof onlineClient>;
const id = 'd137864c-e174-4f38-9277-6bdd0a4289dc';
// One sample for each client method. A new method does not compile until it has a sample here.
// A method with more than one request form (for example GET and PATCH) has one call for each form.
const samples: { [K in keyof Client]: (client: Client) => Promise<unknown> } = {
  create: c => c.create({ kind: 'solo' } as never), preview: c => c.preview({ code: 'ABC234' }),
  settings: async c => { await c.settings().catch(() => undefined); return c.settings({ symbols_only: true }); },
  handle: c => c.handle({ handle: 'a' }), record: c => c.record(), lobby: c => c.lobby(),
  find: c => c.find({}), accept: c => c.accept(id), cancel: c => c.cancel(id), block: c => c.block({ game_id: id }),
  game: c => c.game(id, 0), previewDraft: c => c.previewDraft(id, {} as never), seen: c => c.seen(id),
  command: c => c.command(id, 0, {} as never), invite: c => c.invite(id), redeem: c => c.redeem({ code: 'ABC234' }),
  declineInvite: c => c.declineInvite(id), friends: c => c.friends(), games: c => c.games(), invitations: c => c.invitations(),
  profile: c => c.profile(), updateProfile: c => c.updateProfile({} as never), setHandle: c => c.setHandle('a'),
  requestDeletion: c => c.requestDeletion(), cancelDeletion: c => c.cancelDeletion(), notifications: c => c.notifications(),
  setNotifications: c => c.setNotifications({} as never), relations: c => c.relations(), relate: c => c.relate('block', { handle: 'a' }),
  unrelate: c => c.unrelate('block', { handle: 'a' }), report: c => c.report({} as never),
};

it('sends each client call to a route key of src/api/http.ts', async () => {
  // The same key scan as tools/plugin-server-build.test.ts ('keeps every isolated operation set equal to the handler route keys').
  const http = readFileSync(new URL('../src/api/http.ts', import.meta.url), 'utf8');
  const keys = [...http.matchAll(/^  '([A-Z]+ \/api[^']*)':/gm)].map(match => match[1]);
  expect(keys.length, 'the route key scan of src/api/http.ts finds no key; update this test').toBeGreaterThan(0);
  const routes = keys.map(key => { const [method, path] = key.split(' '); return { method, pattern: new RegExp(`^${path.replaceAll(':id', '[^/]+')}$`) }; });
  const sent: string[] = [];
  const client = onlineClient({ token: async () => 'jwt', tries: 1, fetch: async (url, init) => { sent.push(`${init?.method} ${String(url).split('?')[0]}`); return new Response('{}', { status: 200 }); } });
  const missed: string[] = [];
  for (const [name, run] of Object.entries(samples)) {
    sent.length = 0;
    await run(client).catch(() => undefined);
    expect(sent, `client.${name} sends no request; fix its sample in this test`).not.toEqual([]);
    for (const call of sent) {
      const [method, path] = call.split(' ');
      if (!routes.some(route => route.method === method && route.pattern.test(path))) missed.push(`client.${name}: ${call}`);
    }
  }
  expect(missed, 'Each call needs a route key in src/api/http.ts (and the operation sets). Fix the path in src/online/client.ts or add the route').toEqual([]);
});
