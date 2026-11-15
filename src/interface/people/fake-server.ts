/**
 * Test support: a fake game server for the people controller. It puts the website's REST paths in front of the
 * repository's in-memory protocol fixture (`tools/plugin-protocol-fixture.ts`), so the controller talks to the real
 * client and the fixture's game rules, with no sign-in and no network. The bearer token names the player. Faults
 * (a lost connection, a lost reply, a server fault, an ended sign-in) come from a queue. No app code imports it.
 */
import type { Icon } from '../../account/profile';
import type { DraftPreview, FriendsPage, HistoryPage, InboxEntry, InvitationPage, InvitationRow, JoinPreview, PlayerRecord, View } from '../../match/protocol';

/** The fixture calls that the paths use (`fixtureService()` has them). */
export interface FakeGames {
  view(actor: string, gameId: string, since?: number): Promise<View>;
  command(actor: string, gameId: string, input: unknown): Promise<View>;
  previewDraft(actor: string, gameId: string, input: unknown): Promise<DraftPreview>;
  preview(actor: string, code: unknown): Promise<JoinPreview>;
  join(actor: string, code: unknown): Promise<View>;
  seen(actor: string, gameId: string): Promise<void>;
  create?(actor: string, input: any, commandId?: string): Promise<View & { invite?: { token: string; code: string; expires_at: string; invite_id: string; recipient_id?: string | null } }>;
  invite?(actor: string, gameId: string, input?: unknown): Promise<{ token: string; code: string; expires_at: string; invite_id: string; recipient_id?: string | null }>;
  invitations?(actor: string, input?: Record<string, unknown>): Promise<InvitationPage>;
  declineInvite?(actor: string, inviteId: string): Promise<InvitationRow>;
  friends?(actor: string, input?: Record<string, unknown>): Promise<FriendsPage>;
  inbox?(actor: string): Promise<InboxEntry[]>;
  history?(actor: string, before?: string): Promise<HistoryPage>;
  record?(actor: string): Promise<PlayerRecord>;
  profile?(actor: string): Promise<{ user_id: string; handle: string | null; icon: Icon | null }>;
  handle?(actor: string, input: unknown): Promise<{ user_id: string; handle: string | null; icon: Icon | null }>;
  settings?(actor: string, input?: Record<string, unknown>): Promise<unknown>;
}
/** `network`: no answer, nothing happens. `lost`: the server applies the call, then the answer is lost. */
export type FakeFault = { path?: RegExp; actor?: string; times?: number } & ({ kind: 'network' | 'lost' } | { kind: 'status'; status: number; code: string });
export interface FakeCall { actor: string; method: string; path: string; body: unknown }

/** A `localStorage` in memory. */
export function memoryStorage() {
  const records = new Map<string, string>();
  return { records, getItem: (key: string) => records.get(key) ?? null, setItem: (key: string, value: string) => { records.set(key, value); }, removeItem: (key: string) => { records.delete(key); } };
}
const json = (status: number, value: unknown) => status === 204 ? new Response(null, { status }) : new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } });

export function fakeServer(games: FakeGames) {
  const faults: FakeFault[] = [], calls: FakeCall[] = [], signedOut = new Set<string>();
  let offline = false;
  async function route(actor: string, method: string, path: string, query: URLSearchParams, body: any): Promise<unknown> {
    let m: RegExpExecArray | null;
    if (method === 'POST' && path === '/api/games' && games.create) {
      const { command_id, ...rest } = body ?? {};
      const options = rest.kind === 'friend' && !rest.recipient_id && !rest.recipient_handle ? { ...rest, open_link: true } : rest;
      let { invite, ...view } = await games.create(actor, options, command_id);
      if (!invite && options.kind === 'friend' && options.open_link && !options.recipient_id && !options.recipient_handle && games.invite) {
        invite = await games.invite(actor, view.game_id, { open_link: true });
        view = await games.view(actor, view.game_id);
      }
      return { view, ...(invite && { invite: { ...invite, url: `https://kingdown.test/j#${invite.token}` } }) };
    }
    if (method === 'GET' && (m = /^\/api\/games\/([^/]+)$/.exec(path))) { const since = query.get('since'); return games.view(actor, m[1], since === null ? undefined : Number(since)); }
    if (method === 'POST' && (m = /^\/api\/games\/([^/]+)\/commands$/.exec(path))) { const view = await games.command(actor, m[1], body); return { type: 'ack', command_id: body.command_id, revision: view.revision, view }; }
    if (method === 'POST' && (m = /^\/api\/games\/([^/]+)\/preview$/.exec(path))) return games.previewDraft(actor, m[1], body);
    if (method === 'POST' && (m = /^\/api\/games\/([^/]+)\/seen$/.exec(path))) { await games.seen(actor, m[1]); return undefined; }
    if (method === 'POST' && (m = /^\/api\/games\/([^/]+)\/invite$/.exec(path)) && games.invite) {
      const invite = await games.invite(actor, m[1], body ?? {});
      return { ...invite, url: `https://kingdown.test/j#${invite.token}` };
    }
    if (method === 'POST' && path === '/api/invites/preview') return games.preview(actor, body && typeof body === 'object' && 'invite_id' in body ? { invite_id: body.invite_id } : body.token);
    if (method === 'POST' && path === '/api/invites/redeem') return games.join(actor, body && typeof body === 'object' && 'invite_id' in body ? { invite_id: body.invite_id } : body.token);
    if (method === 'GET' && path === '/api/friends' && games.friends) {
      return games.friends(actor, { ...(query.get('handle') && { handle: query.get('handle') }), ...(query.get('after') && { after: query.get('after') }), ...(query.get('limit') && { limit: Number(query.get('limit')) }) });
    }
    if (method === 'POST' && (m = /^\/api\/invites\/([^/]+)\/decline$/.exec(path)) && games.declineInvite) return games.declineInvite(actor, decodeURIComponent(m[1]));
    if (method === 'GET' && path === '/api/me/games' && games.inbox) {
      const list = await games.inbox(actor);
      if (!query.has('invitations') || !games.invitations) return list;
      const page = await games.invitations(actor, { ...(query.get('before') && { before: query.get('before') }), ...(query.get('limit') && { limit: Number(query.get('limit')) }) });
      return { games: list, ...page };
    }
    if (method === 'GET' && path === '/api/me/record' && games.history && games.record && games.profile) {
      const [me, record, page] = await Promise.all([games.profile(actor), games.record(actor), games.history(actor, query.get('before') ?? undefined)]);
      return { handle: me.handle, icon: me.icon, record, notices: [], next_notices_before: null, blocks: [], next_blocks_after: null, history: page.games, next_before: page.next_before };
    }
    if (method === 'GET' && path === '/api/me/settings' && games.profile) {
      const me = await games.profile(actor);
      return { me: { handle: me.handle, icon: me.icon }, ...(games.settings && { settings: await games.settings(actor) }) };
    }
    if (method === 'PATCH' && path === '/api/me/settings' && games.settings) return { settings: await games.settings(actor, body ?? {}) };
    if (method === 'POST' && path === '/api/me/handle' && games.handle) {
      const me = await games.handle(actor, body);
      return { me: { handle: me.handle, icon: me.icon }, ...(body?.check && { available: true }) };
    }
    throw Object.assign(new Error('Not found'), { code: 'NOT_FOUND', status: 404 });
  }
  /** One answer: the status and the JSON body, as the website API gives them (`src/api/http.ts`). */
  async function handle(method: string, url: string, authorization: string | null, text: string | null): Promise<{ status: number; body: unknown } | 'network'> {
    const { pathname: path, searchParams } = new URL(url, 'http://fake'), actor = authorization?.replace(/^Bearer /, '') ?? '';
    const body = text ? JSON.parse(text) : undefined;
    calls.push({ actor, method, path: path + (searchParams.size ? `?${searchParams}` : ''), body });
    if (offline) return 'network';
    const at = faults.findIndex(f => (!f.path || f.path.test(path)) && (!f.actor || f.actor === actor));
    const fault = at < 0 ? undefined : faults[at];
    if (fault && (fault.times = (fault.times ?? 1) - 1) <= 0) faults.splice(at, 1);
    if (fault?.kind === 'network') return 'network';
    if (fault?.kind === 'status') return { status: fault.status, body: { code: fault.code, message: `Fake ${fault.code}` } };
    if (!actor || signedOut.has(actor)) return { status: 401, body: { code: 'UNAUTHENTICATED', message: 'Sign in again' } };
    try {
      const value = await route(actor, method, path, searchParams, body);
      if (fault?.kind === 'lost') return 'network';
      return { status: value === undefined ? 204 : 200, body: value };
    } catch (error) {
      const e = error as { code?: string; status?: number; message?: string };
      if (fault?.kind === 'lost') return 'network';
      return { status: e.status ?? 500, body: { code: e.code ?? 'UNAVAILABLE', message: e.message ?? 'Server fault' } };
    }
  }
  /** A `fetch` for `onlineClient`. */
  const fetch = async (input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> => {
    const headers = new Headers(init.headers);
    const answer = await handle(init.method ?? 'GET', String(input), headers.get('Authorization'), typeof init.body === 'string' ? init.body : null);
    if (answer === 'network') throw new TypeError('Failed to fetch');
    return json(answer.status, answer.body);
  };
  return {
    fetch, handle, calls,
    fail(fault: FakeFault) { faults.push(fault); },
    clear() { faults.length = 0; },
    set offline(value: boolean) { offline = value; }, get offline() { return offline; },
    signOut(actor: string) { signedOut.add(actor); }, signIn(actor: string) { signedOut.delete(actor); },
  };
}
export type FakeServer = ReturnType<typeof fakeServer>;
