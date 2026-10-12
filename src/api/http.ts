/** The website's JSON API (/api/*) and the job endpoints (/internal/*) of the one function (report part 03, sections
 * 4.3, 4.4 and 8). Thin adapters: the game, account and safety services decide; the actor is the verified `sub` of
 * a website session, never input. Errors carry the protocol codes: `{ code, message }`, and a command's refusal is
 * the protocol's `reject` reply. */
import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createRemoteJWKSet, errors, jwtVerify, type JWTVerifyGetKey } from 'jose';
import { z } from 'zod';
import { parse, MatchServiceError, type GameService } from '../match/service';
import type { Invite } from '../match/protocol';
import type { AccountService } from '../online/accounts';
import type { SafetyService } from '../online/safety';
import { cleanup, drainOutbox, queueReminders, runDeletions, sweepDeadlines } from '../online/jobs';
import type { Sender } from '../online/mail';
import { ACTOR_UUID, AuthenticationError, AuthenticationUnavailable, pluginOrigin } from '../plugin/auth';
import { diagnostic } from '../plugin/diagnostics';

export const MAX_API_BODY = 16 * 1024;
/** Engine routes (create and commands) run a worker each: a bound for each instance, as /mcp has. */
export const MAX_ACTIVE_ENGINE = 4;
const AUTH_DOWN = new Set(['ERR_JOSE_GENERIC', 'ERR_JWKS_TIMEOUT', 'ERR_JWKS_INVALID']); // the key set did not load
const sha256 = (text: string) => createHash('sha256').update(text).digest();

/** A website session token (Supabase Auth, 1 hour) gives its user ID. Refused: another audience, an OAuth access
 * token for /mcp (it has a client_id), a guest (anonymous), another role. jose checks the signature, issuer and expiry.
 * ponytail: no call to Supabase for each request, so a token stays valid until it expires (1 hour at most) after a
 * sign-out or a ban; the /mcp verifier asks Supabase each time instead. */
export function sessionVerifier(supabaseUrl: string, keys?: JWTVerifyGetKey): (token: string) => Promise<string> {
 const base = new URL(supabaseUrl);
 if (base.protocol !== 'https:' || base.username || base.password || base.search || base.hash || base.pathname !== '/') throw new Error('Expected a fixed HTTPS Supabase origin');
 const issuer = `${base.origin}/auth/v1`, jwks = keys ?? createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`), { timeoutDuration: 5000 });
 return async token => {
  let payload;
  try { ({ payload } = await jwtVerify(token, jwks, { issuer, audience: 'authenticated', algorithms: ['ES256', 'RS256'], requiredClaims: ['sub', 'exp', 'role', 'is_anonymous'] })); }
  catch (error) { throw error instanceof errors.JOSEError && !AUTH_DOWN.has(error.code) ? new AuthenticationError() : new AuthenticationUnavailable(); }
  if (payload.aud !== 'authenticated' || payload.role !== 'authenticated' || payload.is_anonymous !== false || payload.client_id !== undefined
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

export interface ApiOptions { games: GameService; accounts: AccountService; safety: SafetyService; publicOrigin: string; /** undefined: website sign-in is not configured */ verify?: (token: string) => Promise<string> }
type Route = (actor: string, id: string, body: unknown, query: URLSearchParams) => Promise<unknown>;
/** The invitation as the website shares it: a link built from the fixed origin, and the short code. */
export type InviteLink = Invite & { url: string };
const redeemSchema = z.union([z.strictObject({ token: z.string().max(100) }), z.strictObject({ code: z.string().max(20) })]);

export function createApiHandler({ games, accounts, safety, publicOrigin, verify }: ApiOptions): (req: IncomingMessage, res: ServerResponse) => Promise<void> {
 const origin = pluginOrigin(publicOrigin);
 const link = async (actor: string, id: string): Promise<InviteLink> => { const invite = await games.invite(actor, id); return { ...invite, url: `${origin}/j/${invite.token}` }; };
 const routes: Record<string, Route> = {
  // A friend game comes with its invitation (part 03, section 4.4); a lost link gets a new one from /invite.
  'POST /api/games': async (actor, _, body) => { const view = await games.create(actor, body); return { view, ...(view.kind === 'friend' && { invite: await link(actor, view.game_id) }) }; },
  'GET /api/games/:id': (actor, id, _, query) => {
   const since = query.get('since');
   if (since !== null && !/^\d{1,4}$/.test(since)) throw failure('INVALID_INPUT', 400, 'Invalid revision');
   return games.view(actor, id, since === null ? undefined : Number(since));
  },
  'POST /api/games/:id/commands': async (actor, id, body) => { const view = await games.command(actor, id, body, 'web'); return { type: 'ack', command_id: (body as { command_id: string }).command_id, revision: view.revision, view }; },
  'POST /api/games/:id/invite': (actor, id) => link(actor, id),
  'POST /api/invites/redeem': (actor, _, body) => { const key = parse(redeemSchema, body); return games.join(actor, 'token' in key ? key.token : key.code); },
  'GET /api/me/games': actor => games.inbox(actor),
  'GET /api/me/profile': actor => accounts.profile(actor),
  'PATCH /api/me/profile': (actor, _, body) => accounts.updateSettings(actor, body),
  'POST /api/me/handle': (actor, _, body) => accounts.setHandle(actor, body),
  'POST /api/me/deletion': actor => accounts.requestDeletion(actor),
  // A sign-in cancels a deletion in the database (0008); the website also calls this after a sign-in.
  'DELETE /api/me/deletion': actor => accounts.cancelDeletion(actor),
  'GET /api/me/notifications': actor => accounts.notificationPrefs(actor),
  'PUT /api/me/notifications': (actor, _, body) => accounts.setNotificationPrefs(actor, body),
  'GET /api/relations': actor => accounts.relations(actor),
  'POST /api/relations': (actor, _, body) => accounts.relate(actor, body),
  'DELETE /api/relations': (actor, _, body) => accounts.unrelate(actor, body),
  'POST /api/reports': (actor, _, body) => safety.report(actor, body),
 };
 const created = new Set(['POST /api/games', 'POST /api/reports']);
 const table = Object.entries(routes).map(([key, run]) => { const [method, path] = key.split(' '); return { key, method, pattern: new RegExp(`^${path.replace(':id', '([^/]+)')}$`), run }; });
 let active = 0;
 return async (req, res) => {
  const path = guard(req, res, origin); if (path === undefined) return;
  // Same origin only, so no CORS headers ever: a browser sends Origin on a cross-site call (and every preflight).
  const site = req.headers['sec-fetch-site'];
  if (req.headers.origin !== undefined && req.headers.origin !== origin || site !== undefined && site !== 'same-origin' && site !== 'none') { respond(res, 403, { code: 'FORBIDDEN', message: 'Cross-origin requests are refused' }); return; }
  const matches = table.flatMap(route => { const found = route.pattern.exec(path); return found ? [{ ...route, id: found[1] ?? '' }] : []; });
  const route = matches.find(r => r.method === req.method);
  if (!route) { if (matches.length) res.setHeader('Allow', matches.map(r => r.method).join(', ')); respond(res, matches.length ? 405 : 404, matches.length ? { code: 'NOT_ALLOWED', message: 'Method not allowed' } : { code: 'NOT_FOUND', message: 'Not found' }); return; }
  const engine = route.key === 'POST /api/games' || route.key === 'POST /api/games/:id/commands';
  let body: unknown;
  try {
   if (!verify) throw failure('UNAVAILABLE', 503, 'Website sign-in is not configured');
   const bearer = /^Bearer ([A-Za-z0-9._~-]{1,16384})$/i.exec(req.headers.authorization ?? '')?.[1];
   let actor: string;
   try { if (!bearer) throw new AuthenticationError(); actor = await verify(bearer); }
   catch (error) {
    if (error instanceof AuthenticationUnavailable) { res.setHeader('Retry-After', '5'); throw failure('UNAVAILABLE', 503, error.message); }
    res.setHeader('WWW-Authenticate', 'Bearer'); throw failure('UNAUTHENTICATED', 401, 'Sign in again');
   }
   body = await readJson(req);
   if (engine && active >= MAX_ACTIVE_ENGINE) { res.setHeader('Retry-After', '1'); throw failure('UNAVAILABLE', 503, 'This server instance is busy. Retry.'); }
   if (engine) active++;
   try {
    // The service checks the ID (a UUID), so the path segment goes as it is.
    const value = await route.run(actor, route.id, body, new URL(req.url!, origin).searchParams);
    respond(res, value === undefined ? 204 : created.has(route.key) ? 201 : 200, value);
   } finally { if (engine) active--; }
  } catch (error) {
   const known = error instanceof MatchServiceError ? error : failure('UNAVAILABLE', 500, 'Request failed. Retry.');
   if (known.status === 413) { res.setHeader('Connection', 'close'); req.resume(); }
   if (known !== error || known.status >= 500 && known.status !== 503) console.error('King Down API failed', { route: route.key, requestId: randomUUID(), ...diagnostic(error) });
   const commandId = (body as { command_id?: unknown } | undefined)?.command_id;
   respond(res, known.status, { ...(route.key === 'POST /api/games/:id/commands' && { type: 'reject', command_id: typeof commandId === 'string' ? commandId : '' }), code: known.code, message: known.message });
  }
 };
}

export interface InternalOptions { games: GameService; publicOrigin: string; /** at least 32 characters; else /internal answers 503 */ secret?: string; /** throws when email is not configured */ sender: () => Sender }
/** pg_cron calls these through pg_net with the shared secret (supabase/ops/cron.sql). Each job is idempotent. */
export function createInternalHandler({ games, publicOrigin, secret, sender }: InternalOptions): (req: IncomingMessage, res: ServerResponse) => Promise<void> {
 const origin = pluginOrigin(publicOrigin), expected = secret && secret.length >= 32 ? sha256(secret) : undefined;
 const jobs: Record<string, () => Promise<object>> = {
  '/internal/tick': async () => ({ ended: await sweepDeadlines(games) }),
  '/internal/outbox': async () => {
   let send: Sender; try { send = sender(); } catch { throw failure('UNAVAILABLE', 503, 'Email is not configured'); }
   return { sent: await drainOutbox(games, send) };
  },
  '/internal/reminders': async () => ({ queued: await queueReminders(games) }),
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
