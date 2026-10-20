/** The website's JSON API (/api/*) and the job endpoints (/internal/*) of the one function (report part 03, sections
 * 4.3, 4.4 and 8). Thin adapters: the game, account and safety services decide; the actor is the verified `sub` of
 * a website session, never input. Errors carry the protocol codes: `{ code, message }`, and a command's refusal is
 * the protocol's `reject` reply. */
import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createRemoteJWKSet, errors, jwtVerify, type JWTVerifyGetKey } from 'jose';
import { z } from 'zod';
import { parse, MatchServiceError, type GameService } from '../match/service';
import { commandSchema, createSchema, type Invite } from '../match/protocol';
import { optionsSchema } from '../match/setup-schema';
import { handleSchema, type PluginService } from '../plugin/service';
import { settingsSchema } from '../plugin/settings';
import type { AccountService } from '../online/accounts';
import type { SafetyService } from '../online/safety';
import { cleanup, runDeletions, sweepDeadlines } from '../online/jobs';
import { ACTOR_UUID, AuthenticationError, AuthenticationUnavailable, pluginOrigin } from '../plugin/auth';
import { diagnostic } from '../plugin/diagnostics';
import { WEB_ACCOUNT_ACCESS_TTL_MS } from './account-access';
import type { WebAccountStatus } from '../online/account-access';

export const MAX_API_BODY = 16 * 1024;
/** Routes that can build or play a match share a bound for each instance, as /mcp has. */
export const MAX_ACTIVE_ENGINE = 4;
const AUTH_DOWN = new Set(['ERR_JOSE_GENERIC', 'ERR_JWKS_TIMEOUT', 'ERR_JWKS_INVALID']); // the key set did not load
const sha256 = (text: string) => createHash('sha256').update(text).digest();

/** A website session token (Supabase Auth, 1 hour) gives its user ID. Refused: another audience, an OAuth access
 * token for /mcp (it has a client_id), a guest (anonymous), another role. jose checks the signature, issuer and expiry.
 * Reads use this local check until token expiry. Writes also require the injected current-user check. */
export function sessionVerifier(supabaseUrl: string, keys?: JWTVerifyGetKey): (token: string) => Promise<string> {
 const base = new URL(supabaseUrl);
 if (base.protocol !== 'https:' || base.username || base.password || base.search || base.hash || base.pathname !== '/') throw new Error('Expected a fixed HTTPS Supabase origin');
 const issuer = `${base.origin}/auth/v1`, jwks = keys ?? createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`), { timeoutDuration: 5000 });
 return async token => {
  let payload;
  try { ({ payload } = await jwtVerify(token, jwks, { issuer, audience: 'authenticated', algorithms: ['ES256', 'RS256'], requiredClaims: ['sub', 'exp', 'role', 'is_anonymous'] })); }
  catch (error) { throw error instanceof errors.JOSEError && !AUTH_DOWN.has(error.code) ? new AuthenticationError() : new AuthenticationUnavailable(); }
  const audience = Array.isArray(payload.aud) && payload.aud.length === 1 ? payload.aud[0] : payload.aud;
  if (audience !== 'authenticated' || payload.role !== 'authenticated' || payload.is_anonymous !== false || payload.client_id !== undefined
   || typeof payload.sub !== 'string' || !ACTOR_UUID.test(payload.sub)) throw new AuthenticationError();
  return payload.sub.toLowerCase();
 };
}

function respond(res: ServerResponse, status: number, value?: unknown): void {
 if (value === undefined) { res.writeHead(status); res.end(); return; }
 res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(value));
}
const failure = (code: MatchServiceError['code'], status: number, message: string) => new MatchServiceError(code, status, message);
/** Headers for every answer, the exact host, and the path; undefined when the request is refused. */
function guard(req: IncomingMessage, res: ServerResponse, origin: string): string | undefined {
 res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Content-Type-Options', 'nosniff');
 if (req.headers.host?.toLowerCase() !== new URL(origin).host || !req.url?.startsWith('/')) { respond(res, 403, { code: 'FORBIDDEN', message: 'Untrusted host' }); return; }
 return new URL(req.url, origin).pathname;
}
async function readJson(req: IncomingMessage): Promise<unknown> {
 if (Number(req.headers['content-length']) > MAX_API_BODY) throw failure('INVALID_INPUT', 413, 'Request body too large');
 const chunks: Buffer[] = []; let bytes = 0;
 for await (const chunk of req.iterator({ destroyOnReturn: false })) { if ((bytes += chunk.length) > MAX_API_BODY) throw failure('INVALID_INPUT', 413, 'Request body too large'); chunks.push(chunk); }
 if (!bytes) return undefined;
 try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw failure('INVALID_INPUT', 400, 'Malformed JSON'); }
}

export interface ApiOptions {
 games: GameService; accounts: AccountService; safety: SafetyService;
 players?: Pick<PluginService, 'settings' | 'profile' | 'handle' | 'block' | 'blocks' | 'toolTry'>;
 publicOrigin: string; operations?: ReadonlySet<string>;
 /** undefined: website sign-in is not configured */ verify?: (token: string) => Promise<string>;
 webAccountAccess?: () => Promise<{ enabled: boolean; expiresAt: number }>;
 admit?: (actor: string) => () => void;
 currentUser?: (token: string, actor: string) => Promise<void>;
}
type Route = (actor: string, id: string, body: unknown, query: URLSearchParams) => Promise<unknown>;
/** The invitation as the website shares it: a link built from the fixed origin, and the short code. */
export type InviteLink = Invite & { url: string };
const emptySchema = z.strictObject({}).optional();
const startSchema = createSchema.safeExtend({ command_id: commandSchema.shape.command_id });
const findSchema = z.strictObject({ options: optionsSchema, colour: z.enum(['white', 'black', 'random']).optional(), any_rules: z.boolean().optional(), command_id: commandSchema.shape.command_id });
const recordSchema = z.strictObject({ before: z.string().max(100).optional(), blocks_after: z.uuid().optional() });
const blockTarget = { game_id: z.uuid().optional(), user_id: z.uuid().optional() };
const blockReadSchema = z.strictObject(blockTarget).refine(target => Number(target.game_id !== undefined) + Number(target.user_id !== undefined) === 1);
const blockSchema = z.strictObject({ ...blockTarget, blocked: z.boolean().optional() }).refine(target => Number(target.game_id !== undefined) + Number(target.user_id !== undefined) === 1);
function queryInput(query: URLSearchParams): Record<string, string> {
 const input: Record<string, string> = Object.create(null);
 for (const [key, value] of query) { if (Object.hasOwn(input, key)) throw failure('INVALID_INPUT', 400, 'Repeated query parameter'); input[key] = value; }
 return input;
}
const redeemSchema = z.union([z.strictObject({ token: z.string().max(100) }), z.strictObject({ code: z.string().max(20) })]);

export function createApiHandler({ games, accounts, safety, players, publicOrigin, verify, operations, webAccountAccess, admit, currentUser }: ApiOptions): (req: IncomingMessage, res: ServerResponse) => Promise<void> {
 const origin = pluginOrigin(publicOrigin);
 const readAccess = async () => {
  try {
   const access = await webAccountAccess?.();
   if (access && (!Number.isFinite(access.expiresAt) || performance.now() >= access.expiresAt)) console.error('King Down account switch proof is unavailable');
   return access;
  }
  catch (error) { console.error('King Down account status failed', diagnostic(error)); }
 };
 const accountAccess = async () => {
  const access = await readAccess();
  if (access?.enabled !== true || !Number.isFinite(access.expiresAt) || performance.now() >= access.expiresAt) throw failure('UNAVAILABLE', 503, 'Account play is temporarily unavailable. Try again or play on this device.');
 };
 const playerService = () => { if (!players) throw failure('UNAVAILABLE', 503, 'Account service is not configured'); return players; };
 const settings = async (actor: string, input: unknown = {}) => {
  const service = playerService();
  const [settings, { handle, icon }] = await Promise.all([service.settings(actor, parse(settingsSchema, input)), service.profile(actor)]);
  return { settings, me: { handle, icon } };
 };
 const block = async (actor: string, input: z.infer<typeof blockSchema>) => {
  const service = playerService(), { blocked: change, ...target } = input;
  const blocked = await service.block(actor, target, change);
  return { blocked, ...(change !== undefined && target.game_id && { view: await games.view(actor, target.game_id) }) };
 };
 const link = async (actor: string, id: string): Promise<InviteLink> => { const invite = await games.invite(actor, id); return { ...invite, url: `${origin}/j#${invite.token}` }; };
 const routes: Record<string, Route> = {
  'GET /api/status': async (): Promise<WebAccountStatus> => {
   if (table.some(route => route.method === 'GET' && route.key !== 'GET /api/status' && operations?.has(route.key))) {
    const access = await readAccess();
    const remaining = access?.enabled === true && Number.isFinite(access.expiresAt) ? Math.floor(Math.min(WEB_ACCOUNT_ACCESS_TTL_MS, access.expiresAt - performance.now())) : 0;
    if (remaining > 0) return { account_access: 'open', valid_for_ms: remaining };
   }
   return { account_access: 'closed', valid_for_ms: 0 };
  },
  // A friend game comes with its invitation (part 03, section 4.4); a lost link gets a new one from /invite.
  'POST /api/games': async (actor, _, body) => { const { command_id, ...options } = parse(startSchema, body); await playerService().toolTry(actor, 'kingdown_create'); const view = await games.create(actor, options, command_id); return { view, ...(view.kind === 'friend' && view.status === 'waiting' && { invite: await link(actor, view.game_id) }) }; },
  'POST /api/games/find': async (actor, _, body) => { const input = parse(findSchema, body); await playerService().toolTry(actor, 'kingdown_create'); return games.find(actor, input.options, input.colour, input.command_id, input.any_rules); },
  'POST /api/games/:id/accept': (actor, id, body) => { parse(emptySchema, body); return games.accept(actor, id); },
  'POST /api/games/:id/cancel': (actor, id, body) => { parse(emptySchema, body); return games.cancel(actor, id); },
  'GET /api/lobby': async actor => ({ ...await games.lobby(actor), server_now: new Date().toISOString() }),
  'GET /api/games/:id': (actor, id, _, query) => {
   const since = query.get('since');
   if (since !== null && !/^\d{1,4}$/.test(since)) throw failure('INVALID_INPUT', 400, 'Invalid revision');
   return games.view(actor, id, since === null ? undefined : Number(since));
  },
  'POST /api/games/:id/seen': (actor, id, body) => { parse(z.strictObject({}).optional(), body); return games.seen(actor, id); },
  'POST /api/games/:id/commands': async (actor, id, body) => { if ((body as { action?: { type?: unknown } } | null)?.action?.type === 'computer') await playerService().toolTry(actor, 'kingdown_computer'); const view = await games.command(actor, id, body, 'web'); return { type: 'ack', command_id: (body as { command_id: string }).command_id, revision: view.revision, view }; },
  'POST /api/games/:id/invite': (actor, id) => link(actor, id),
  'POST /api/invites/preview': (actor, _, body) => { const key = parse(redeemSchema, body); return games.preview(actor, 'token' in key ? key.token : key.code); },
  'POST /api/invites/redeem': (actor, _, body) => { const key = parse(redeemSchema, body); return games.join(actor, 'token' in key ? key.token : key.code); },
  'GET /api/me/games': actor => games.inbox(actor),
  'GET /api/me/profile': actor => accounts.profile(actor),
  'PATCH /api/me/profile': (actor, _, body) => accounts.updateSettings(actor, body),
  'GET /api/me/settings': actor => settings(actor),
  'PATCH /api/me/settings': (actor, _, body) => settings(actor, body),
  'POST /api/me/handle': async (actor, _, body) => { const input = parse(handleSchema, body), { handle, icon } = await playerService().handle(actor, input); return { me: { handle, icon }, ...(input.check && { available: true }) }; },
  'GET /api/me/record': async (actor, _, __, query) => {
   const { before, blocks_after } = parse(recordSchema, queryInput(query)), service = playerService();
   const [{ handle, icon }, record, history, blocks] = await Promise.all([service.profile(actor), games.record(actor), games.history(actor, before), service.blocks(actor, blocks_after)]);
   return { handle, icon, record, blocks: blocks.slice(0, 50), next_blocks_after: blocks.length > 50 ? blocks[49].user_id : null, history: history.games, next_before: history.next_before };
  },
  'GET /api/blocks': (actor, _, __, query) => block(actor, parse(blockReadSchema, queryInput(query))),
  'POST /api/blocks': (actor, _, body) => block(actor, parse(blockSchema, body)),
  'POST /api/me/deletion': actor => accounts.requestDeletion(actor),
  // A sign-in cancels a deletion in the database (0008); the website also calls this after a sign-in.
  'DELETE /api/me/deletion': actor => accounts.cancelDeletion(actor),
  'GET /api/me/notifications': actor => accounts.notificationPrefs(actor),
  'PUT /api/me/notifications': (actor, _, body) => accounts.setNotificationPrefs(actor, body),
  'GET /api/relations': actor => accounts.relations(actor),
  'POST /api/relations': (actor, _, body) => accounts.relate(actor, body),
  'DELETE /api/relations': (actor, _, body) => accounts.unrelate(actor, body),
  'POST /api/reports': async (actor, _, body) => { await playerService().toolTry(actor, 'kingdown_report'); return safety.report(actor, body); },
 };
 const created = new Set(['POST /api/games', 'POST /api/reports']);
 const table = Object.entries(routes).map(([key, run]) => { const [method, path] = key.split(' '); return { key, method, dynamic: path.includes(':id'), pattern: new RegExp(`^${path.replace(':id', '([^/]+)')}$`), run }; });
 let active = 0;
 return async (req, res) => {
  const notFound = () => {
   res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Content-Type-Options', 'nosniff');
   req.resume(); respond(res, 404, { code: 'NOT_FOUND', message: 'Not found' });
  };
  if (!operations?.size) { notFound(); return; }
  const path = req.url?.startsWith('/') && URL.canParse(req.url, origin) ? new URL(req.url, origin).pathname : '';
  const matched = table.flatMap(route => { const found = route.pattern.exec(path); return found ? [{ ...route, id: found[1] ?? '' }] : []; });
  const matches = matched.some(route => !route.dynamic) ? matched.filter(route => !route.dynamic) : matched;
  const route = matches.find(r => r.method === req.method), allowed = matches.filter(r => operations.has(r.key));
  if (route ? !operations.has(route.key) : !allowed.length) { notFound(); return; }
  if (guard(req, res, origin) === undefined) return;
  // Same origin only, so no CORS headers ever: a browser sends Origin on a cross-site call (and every preflight).
  const site = req.headers['sec-fetch-site'];
  if (req.headers.origin !== undefined && req.headers.origin !== origin || site !== undefined && site !== 'same-origin' && site !== 'none') { respond(res, 403, { code: 'FORBIDDEN', message: 'Cross-origin requests are refused' }); return; }
  if (!route) { req.resume(); res.setHeader('Allow', allowed.map(r => r.method).join(', ')); respond(res, 405, { code: 'NOT_ALLOWED', message: 'Method not allowed' }); return; }
  const engine = ['POST /api/games', 'POST /api/games/find', 'POST /api/games/:id/accept', 'POST /api/invites/redeem', 'POST /api/games/:id/commands'].includes(route.key);
  let body: unknown, release: (() => void) | undefined;
  try {
   if (route.key === 'GET /api/status') {
    req.resume(); res.setHeader('Referrer-Policy', 'no-referrer');
    respond(res, 200, await route.run('', '', undefined, new URL(req.url!, origin).searchParams)); return;
   }
   await accountAccess();
   if (!verify) throw failure('UNAVAILABLE', 503, 'Website sign-in is not configured');
   const bearer = /^Bearer ([A-Za-z0-9._~-]{1,16384})$/i.exec(req.headers.authorization ?? '')?.[1];
   let actor: string;
   try { if (!bearer) throw new AuthenticationError(); actor = await verify(bearer); }
   catch (error) {
    if (error instanceof AuthenticationUnavailable) { res.setHeader('Retry-After', '5'); throw failure('UNAVAILABLE', 503, error.message); }
    res.setHeader('WWW-Authenticate', 'Bearer'); throw failure('UNAUTHENTICATED', 401, 'Sign in again');
   }
   await accountAccess();
   if (route.method !== 'GET') {
    if (!admit || !currentUser) throw failure('UNAVAILABLE', 503, 'Website writes are not configured');
    release = admit(actor);
    try { await currentUser(bearer!, actor); }
    catch (error) { if (error instanceof AuthenticationUnavailable || error instanceof AuthenticationError) throw error; throw new AuthenticationUnavailable(); }
    await accountAccess();
   }
   body = await readJson(req);
   await accountAccess();
   if (engine && active >= MAX_ACTIVE_ENGINE) { res.setHeader('Retry-After', '1'); throw failure('UNAVAILABLE', 503, 'This server instance is busy. Retry.'); }
   if (engine) active++;
   try {
    // The service checks the ID (a UUID), so the path segment goes as it is.
    const value = await route.run(actor, route.id, body, new URL(req.url!, origin).searchParams);
    respond(res, value === undefined ? 204 : created.has(route.key) ? 201 : 200, value);
   } finally { if (engine) active--; }
  } catch (error) {
   const known = error instanceof MatchServiceError ? error : error instanceof AuthenticationUnavailable ? failure('UNAVAILABLE', 503, error.message) : error instanceof AuthenticationError ? failure('UNAUTHENTICATED', 401, 'Sign in again') : failure('UNAVAILABLE', 500, 'Request failed. Retry.');
   if (known.status === 503 && !res.hasHeader('Retry-After')) res.setHeader('Retry-After', '5');
   if (known.status === 401) res.setHeader('WWW-Authenticate', 'Bearer');
   if (known.status === 413) { res.setHeader('Connection', 'close'); req.resume(); }
   if (known.status >= 500 && known.status !== 503) console.error('King Down API failed', { route: route.key, requestId: randomUUID(), ...diagnostic(error) });
   const commandId = (body as { command_id?: unknown } | undefined)?.command_id;
   respond(res, known.status, { ...(route.key === 'POST /api/games/:id/commands' && { type: 'reject', command_id: typeof commandId === 'string' ? commandId : '' }), code: known.code, message: known.message });
  } finally { release?.(); }
 };
}

export interface InternalOptions { games: GameService; publicOrigin: string; /** at least 32 characters; else /internal answers 503 */ secret?: string }
/** pg_cron calls these through pg_net with the shared secret (supabase/ops/cron.sql). Each job is idempotent. */
export function createInternalHandler({ games, publicOrigin, secret }: InternalOptions): (req: IncomingMessage, res: ServerResponse) => Promise<void> {
 const origin = pluginOrigin(publicOrigin), expected = secret && secret.length >= 32 ? sha256(secret) : undefined;
 const jobs: Record<string, () => Promise<object>> = {
  '/internal/tick': async () => ({ ended: await sweepDeadlines(games) }),
  // The cleanup first, so a deletion that fails does not stop it.
  '/internal/daily': async () => { const cleaned = await cleanup(games); return { deleted: await runDeletions(games), ...cleaned }; },
 };
 return async (req, res) => {
  const path = guard(req, res, origin); if (path === undefined) return;
  req.resume(); // the jobs read no body
  if (!expected) { respond(res, 503, { code: 'UNAVAILABLE', message: 'Internal jobs are not configured' }); return; }
  const given = req.headers['x-kingdown-internal'];
  // Equal-length digests, so the compare takes the same time for every wrong secret.
  if (typeof given !== 'string' || !timingSafeEqual(sha256(given), expected)) { respond(res, 403, { code: 'FORBIDDEN', message: 'Internal secret required' }); return; }
  const job = Object.hasOwn(jobs, path) ? jobs[path] : undefined;
  if (!job) { respond(res, 404, { code: 'NOT_FOUND', message: 'Not found' }); return; }
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); respond(res, 405, { code: 'NOT_ALLOWED', message: 'Method not allowed' }); return; }
  try { respond(res, 200, await job()); }
  catch (error) {
   const known = error instanceof MatchServiceError ? error : undefined;
   if (!known) console.error('King Down job failed', { path, requestId: randomUUID(), ...diagnostic(error) });
   respond(res, known?.status ?? 500, { code: known?.code ?? 'UNAVAILABLE', message: known?.message ?? 'Job failed' });
  }
 };
}
