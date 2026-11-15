/** In-memory screen fixture. The engine plays moves; the database tests check transactions and access. */
import { createHash, randomBytes, randomInt, randomUUID } from 'node:crypto';
import { createMatch, loadMatch, type LocalMatch, type MatchSetup } from '../src/match';
import { MatchServiceError, type PostgresMatchStore } from '../src/match/store';
import { INVITE_NOTICES } from '../src/match/invite-notices';
import { FRIEND_CODE_DAYS, GameService, startKey, TURN_DAYS, UNFINISHED } from '../src/match/service';
import { createSchema, commandSchema, inviteSchema, friendsSchema, invitationsSchema, type CreateOptions, type RatingPolicy, type InboxEntry, type View, type Seat, type LoggedCommand, type HistoryEntry, type PlayerRecord, type InvitationRow, type InvitationState, type Friend } from '../src/match/protocol';
import { RANKED_OPTIONS, buildSetup, defaultChoice, draw, seatChoicesNeeded, switches, validateChoice, type Draw, type Choice } from '../src/match/setup';
import { handleSchema, type PluginService } from '../src/plugin/service';
import { settingsSchema, type PlayerSettings } from '../src/plugin/settings';
import { handleProblem, type Icon, type AccountNotice } from '../src/account/profile';
import { noticesBeforeSchema } from '../src/online/accounts';

const CODE = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789', DAY = 86_400_000;
// The invitation identity, as the service gives it (ticket 38): the token hash, which cannot redeem the invitation.
const inviteId = (token: string) => createHash('sha256').update(token).digest('hex');
const fail = (code: MatchServiceError['code'], status: number, message: string): never => { throw new MatchServiceError(code, status, message); };
const parse = <T>(schema: {safeParse(input:unknown):{success:boolean;data?:T}}, input:unknown):T => { const value = schema.safeParse(input); return value.success ? value.data! : fail('INVALID_INPUT',400,'Invalid input'); };
const creation = (input:unknown):CreateOptions => { const parsed = parse<CreateOptions>(createSchema,input); return parsed.mode === 'ranked' ? { ...parsed, colour:'random', options:RANKED_OPTIONS } : parsed; };
interface FixtureInvite { invite_id:string; token:string; code:string; created_by:string; recipient_id:string|null; recipient_actor:string|null; state:InvitationState; expires_at:string; created_at:number; used_by?:string }
interface Game { rating_policy:RatingPolicy; id:string; creator:string; input:CreateOptions; match?:LocalMatch; engine?:string; players:(string|null)[]; choices:[Choice|null,Choice|null]; ready:[boolean,boolean]; drawn?:Draw; turns:[number,number]; revision:number; status:View['status']; result?:View['result']; commands:Map<string,string>; log:LoggedCommand[]; invite?:FixtureInvite; draw_offer:Seat|null; rematch_offer:Seat|null; rematch_game_id:string|null; created:number; updated:number; setup_deadline:string|null; deadline:string|null }
export interface FixtureMetadata { avatar_url?: unknown; picture?: unknown; provider?: string }
export interface FixtureSeed { notices?: AccountNotice[]; history?:HistoryEntry[]; games?:InboxEntry[]; invitations?:InvitationRow[]; record?:PlayerRecord; views?:Record<string,Partial<View>>; metadata?:FixtureMetadata; accepting_games?: boolean; challenge_from?: 'nobody' | 'follows' | 'signed-in' | 'everyone' }
/** A seed may leave out `rating_policy` on a history row, as an old row does; `seed` reads it as legacy. */
export type FixtureSeedInput = Omit<FixtureSeed,'history'> & { history?: (Omit<HistoryEntry,'rating_policy'> & Partial<Pick<HistoryEntry,'rating_policy'>>)[] };
/** The match engine of the fixture's games. A compiled page check passes its built runtime, so each game carries the
 * page's own engine identity, as on the hosted service; the default runs the source engine. */
export type FixtureEngine = { createMatch: typeof createMatch; loadMatch: typeof loadMatch };
// The default reads the module bindings at each call, so a test can spy on them.
export function fixtureService(engine: FixtureEngine = { createMatch: (...args) => createMatch(...args), loadMatch: (...args) => loadMatch(...args) }): Pick<PluginService,keyof PluginService> & { seedPosition(setup:MatchSetup,black:boolean):Promise<string>; seed(actor:string,data:FixtureSeedInput):void; deleteMatch(id:string):Promise<void>; close():Promise<void> } {
 // A start command ID names the game it made, joined or reused, with its input, as the database's start receipt does.
 const games = new Map<string,Game>(), starts = new Map<string,{game:string;input:string}>(), boards = new Map<string,{actor:string;game:string|null;selected:boolean}>(), profiles = new Map<string,{user_id:string;handle:string|null;icon:Icon|null}>(), settings = new Map<string,PlayerSettings>(), seeds = new Map<string,FixtureSeed>(), metadata = new Map<string,FixtureMetadata>();
 const blocks = new Set<string>();
 const unblocked = (a:string,b:string) => !blocks.has(`${a}:${b}`) && !blocks.has(`${b}:${a}`);
 const text = (v: unknown): string | null => typeof v === 'string' && v.trim() ? v.trim() : null;
 function userAvatar(viewer: string, subject: string | null): string | null {
  if (!viewer || !subject || viewer === subject || !unblocked(viewer, subject)) return null;
  const linked = [...games.values()].some(g => g.players.includes(viewer) && g.players.includes(subject)
   || g.invite?.recipient_actor && (g.invite.created_by === viewer && g.invite.recipient_actor === subject || g.invite.created_by === subject && g.invite.recipient_actor === viewer));
  if (!linked) return null;
  const m = metadata.get(subject);
  if (!m || m.provider === 'email') return null;
  const url = text(m.avatar_url) ?? text(m.picture);
  return url && /^https:\/\//.test(url) && url.length <= 2048 ? url : null;
 }
 function pairCount(a: string, b: string): number {
  return [...games.values()].filter(g => g.input.kind !== 'solo' && (g.status === 'setup' || g.status === 'playing') && g.players.includes(a) && g.players.includes(b)).length;
 }
 function pendingCount(sender: string, recipient: string | null): number {
  const now = new Date().toISOString();
  return [...games.values()].filter(g => g.status === 'waiting' && g.invite?.created_by === sender && g.invite.state === 'open' && g.invite.expires_at > now && (recipient ? g.invite.recipient_actor === recipient : g.invite.recipient_actor === null)).length;
 }
 async function resolveRecipient(actor: string, input: { recipient_id?: string; recipient_handle?: string }): Promise<{ actor: string; user_id: string } | null> {
  if (!input.recipient_id && !input.recipient_handle) return null;
  const wanted = input.recipient_handle?.trim().toLowerCase();
  for (const [candidate, p] of profiles.entries()) {
   if (!p.handle || candidate === actor) continue;
   if (input.recipient_id ? p.user_id === input.recipient_id : p.handle === wanted) return { actor: candidate, user_id: p.user_id };
  }
  return fail('NOT_FOUND', 404, INVITE_NOTICES.notFound);
 }
 async function issueInvite(game: Game, actor: string, recipient: { actor: string; user_id: string } | null, expires?: string): Promise<FixtureInvite> {
  const token = randomBytes(32).toString('base64url'), code = Array.from({ length: 6 }, () => CODE[randomInt(CODE.length)]).join('');
  game.invite = { invite_id: inviteId(token), token, code, created_by: actor, recipient_id: recipient?.user_id ?? null, recipient_actor: recipient?.actor ?? null, state: 'open', expires_at: expires ?? new Date(Date.now() + FRIEND_CODE_DAYS * DAY).toISOString(), created_at: Date.now() };
  return game.invite;
 }
 async function invitationRowFor(actor: string, g: Game): Promise<InvitationRow | null> {
  if (!g.invite) return null;
  const peerActor = g.invite.created_by === actor ? g.invite.recipient_actor : g.invite.created_by;
  const peer = peerActor ? await profile(peerActor) : null;
  const expired = (g.invite.state === 'open' || g.invite.state === 'cancelled') && g.invite.expires_at <= new Date().toISOString();
  return { revision: g.revision, invite_id: g.invite.invite_id, game_id: g.id, direction: g.invite.created_by === actor ? 'outgoing' : 'incoming', recipient_id: g.invite.recipient_id, player: peer && peerActor ? { user_id: peer.user_id, handle: peer.handle, icon: peer.icon, avatar: userAvatar(actor, peerActor) } : null, options: g.input.options ?? null, expires_at: g.invite.expires_at, state: expired ? 'expired' : g.invite.state };
 }
 let reports = 0;
 // Actor names select fixture users; public account IDs have the database UUID format.
 const historySeeded = new Map<string,number>();
 /** The history row of a game that finished in the fixture, with the service's fields (src/match/results.ts). */
 async function finishedRow(actor:string, g:Game): Promise<HistoryEntry> {
  const seat = g.players.indexOf(actor) as Seat, other = g.players[1-seat], options = g.input.options, rules = (await g.match?.snapshot())?.rules, king = rules?.kings[seat];
  const peer = other ? await profile(other) : null, solo = g.input.kind === 'solo';
  return { rating_policy:g.rating_policy, game_id:g.id, finished_at:new Date(g.updated).toISOString(), kind:g.input.kind, colour:seat === 0 ? 'white' : 'black',
   result:g.result!.winner === null ? 'drawn' : g.result!.winner === seat ? 'won' : 'lost', reason:g.result!.reason,
   opponent:{handle:peer?.handle ?? null,icon:peer?.icon ?? null,computer:solo,deleted:false,level:solo ? g.input.level ?? 'club' : null},
   features:{fairy:options?.fairy ?? false,arrangement:options?.arrangement ?? false,classic:options?.classic ?? rules?.classicChess ?? false,cards:options?.cards ?? !!rules?.hands?.some(hand=>hand.length),
    powers:options?.kingPowers ?? !!rules?.kings.some(Boolean),king:king?.king ?? (seat === 0 ? 'Spirit' : 'Shadow'),power:king?.power ?? null} };
 }
 const profile = async (actor:string) => { if (!profiles.has(actor)) profiles.set(actor,{user_id:randomUUID(),handle:null,icon:null}); return {...profiles.get(actor)!}; };
 const load = (id:string) => games.get(id) ?? fail('NOT_FOUND',404,'Game not found');
 const seatOf = (game:Game,actor:string):Seat => { const seat = game.players.indexOf(actor); return seat < 0 ? fail('FORBIDDEN',403,'You do not have a seat in this game') : seat as Seat; };
 const requireHandle = async (actor:string) => { if (!(await profile(actor)).handle) fail('HANDLE_NEEDED',409,'Choose a handle first'); };
 const resent = (actor:string,commandId:string|undefined,key:ReturnType<typeof startKey>) => { const start = commandId === undefined ? undefined : starts.get(`${actor}:${commandId}`); if (!start) return; if (start.input !== JSON.stringify(key)) fail('COMMAND_CONFLICT',409,'Command ID was used with different input'); return view(actor,start.game); };
 async function start(game:Game) { game.match = await engine.createMatch(game.input.options ? buildSetup(game.input.options,game.drawn!,game.choices as [Choice,Choice]) : game.input.setup ?? {}); game.engine = JSON.parse(await game.match.exportSave()).engine; game.status = 'playing'; game.setup_deadline = null; await end(game); }
 async function end(game:Game) { const after = await game.match!.snapshot(); if (after.status !== 'playing') Object.assign(game,{status:'finished',result:{winner:after.status === 'checkmate' ? 1-after.turn : null,reason:after.status}}); }
 async function enter(game:Game) { if (game.ready.every(Boolean) || !game.input.options) { if (!game.match) await start(game); else game.status = 'playing'; } else {game.status = 'setup'; if (game.input.kind !== 'solo') game.setup_deadline ??= new Date(Date.now()+3*DAY).toISOString();} }
 async function create(actor:string,input:unknown,commandId?:string):Promise<View> {
  const options = creation(input); if (options.kind !== 'solo') await requireHandle(actor);
  const done = resent(actor,commandId,startKey(options)); if (done) return done;
  const send = options.kind === 'friend' && !!(options.recipient_id || options.recipient_handle);
  const recipient = send ? await resolveRecipient(actor, options) : null;
  if (send && recipient) {
   if (!unblocked(actor, recipient.actor)) fail('FORBIDDEN', 403, INVITE_NOTICES.permission);
   const recSeed = seeds.get(recipient.actor);
   if (recSeed?.accepting_games === false || recSeed?.challenge_from === 'nobody') fail('FORBIDDEN', 403, INVITE_NOTICES.permission);
   const pair = pairCount(actor, recipient.actor);
   if (pair >= 5) throw new MatchServiceError('FRIEND_GAME_LIMIT', 409, INVITE_NOTICES.gameLimit(pair, (await profile(recipient.actor)).handle), { count: pair, handle: (await profile(recipient.actor)).handle });
   const open = pendingCount(actor, recipient.actor);
   if (open >= 2) throw new MatchServiceError('FRIEND_INVITE_LIMIT', 409, INVITE_NOTICES.namedLimit((await profile(recipient.actor)).handle, open), { count: open, handle: (await profile(recipient.actor)).handle });
  }
  const seat:Seat = options.colour === 'black' ? 1 : options.colour === 'random' ? randomInt(2) as Seat : 0, solo = options.kind === 'solo', drawn = options.options ? draw(options.options,Math.random) : undefined;
  const needs = !!options.options && Object.values(seatChoicesNeeded(options.options)).some(Boolean);
  const game:Game = {rating_policy:options.mode === 'ranked' ? 'ranked-v1' : 'casual',id:randomUUID(),creator:actor,input:options,players:[null,null],choices:[null,null],ready:[!needs,!needs],drawn,turns:[0,0],revision:0,status:solo ? 'setup' : 'waiting',commands:new Map(),log:[],draw_offer:null,rematch_offer:null,rematch_game_id:null,created:Date.now(),updated:Date.now(),setup_deadline:null,deadline:null};
  game.players[seat] = actor;
  if (drawn) for (const s of [0,1] as const) { game.choices[s] = defaultChoice(options.options!,drawn,s,Math.random,solo && s !== seat); if (solo && s !== seat) game.ready[s] = true; }
  games.set(game.id,game); if (commandId !== undefined) starts.set(`${actor}:${commandId}`,{game:game.id,input:JSON.stringify(startKey(options))});
  const issued = send ? await issueInvite(game, actor, recipient) : undefined;
  if (solo) await enter(game); else if (!options.options) { await start(game); game.status = 'waiting'; }
  const rendered = await view(actor,game.id);
  return { ...rendered, ...(issued && { invite: { token: issued.token, code: issued.code, expires_at: issued.expires_at, invite_id: issued.invite_id, recipient_id: issued.recipient_id } }) };
 }
 async function view(actor:string,id:string,since?:number):Promise<View> {
  const game = load(id), seat = seatOf(game,actor), snapshot = await game.match?.snapshot(), playing = game.status === 'playing', other = (1-seat) as Seat, opponent = game.players[other], solo = game.input.kind === 'solo';
  const otherProfile = opponent ? await profile(opponent) : null, allReady = game.ready.every(Boolean), speed = solo ? 'live' : 'daily';
  const canSwitch = solo && [...games.values()].some(g=>g.input.kind === 'random' && g.creator === actor && g.created<=game.created && ['setup','playing'].includes(g.status) && g.log.some(c=>c.action.type === 'join' && Date.parse(c.at)>game.created));
  const inviteMeta = game.input.kind === 'friend' ? await invitationRowFor(actor, game) : null;
  const { outcome, rules: seededRules, ...seeded } = seeds.get(actor)?.views?.[id] ?? {};
  return {...seeded, ...(game.input.kind === 'friend' && {invite_id:inviteMeta?.invite_id ?? null}), ...(inviteMeta && {invitation:inviteMeta}), rating_policy:game.rating_policy,game_id:id,engine_fingerprint:game.engine ?? null,revision:game.revision,created_at:new Date(game.created).toISOString(),abort_open:game.status === 'waiting' || game.status === 'setup' || playing && (game.turns.some(n=>!n) || canSwitch),seat,kind:game.input.kind,speed,days_per_move:speed === 'daily' ? TURN_DAYS : null,status:game.status,turn:snapshot?.turn ?? 0,
   action:playing ? snapshot!.turn === seat ? 'ready' : 'waiting' : game.status === 'setup' ? game.ready[seat] ? 'waiting' : 'ready' : game.status === 'waiting' ? 'waiting' : 'done',fen:snapshot?.fen ?? '',in_check:snapshot?.inCheck ?? false,legal:playing && snapshot!.turn === seat ? snapshot!.legal : [],
   last_commands:game.log.filter(c=>c.seq>(since ?? 0)).slice(since === undefined ? -10 : -50).map(c=>c.seat === other && (c.action.type === 'choose' && !allReady || c.action.type === 'say' && opponent && !unblocked(actor,opponent)) ? {...c,action:{type:'hidden'}} : c),
   opponent:opponent || solo ? {handle:otherProfile?.handle ?? null,icon:otherProfile?.icon ?? null,avatar:opponent && !solo ? userAvatar(actor,opponent) : null,computer:solo,deleted:false,last_seen_ms:null,...(since === undefined && opponent && {rating:{rating:1500,provisional:true}})} : null,
   rematch_allowed:solo || !opponent || unblocked(actor,opponent),draw_offer:game.draw_offer,rematch_offer:game.rematch_offer,rematch_game_id:game.rematch_game_id,level:game.input.level ?? 'club',...(game.result && {result:game.result}),deadline_at:game.deadline,server_now:new Date().toISOString(),
   ...(game.drawn && {options:game.input.options,draw:game.drawn.army,deal:game.drawn.hand,choices:game.choices.map((c,s)=>s === seat || allReady ? c : null) as View['choices'],ready:[...game.ready] as [boolean,boolean],setup_deadline_at:game.setup_deadline}),
   ...(snapshot && {kings:snapshot.rules.kings,hands:snapshot.rules.hands,...(since === undefined && {rules:snapshot.rules,history:{initial_fen:JSON.parse(await game.match!.exportSave()).initialFen,actions:snapshot.history}})}),
   ...(since === undefined && { ...(game.status === 'finished' && outcome && {outcome}), ...(seededRules && {rules:seededRules}) })};
 }
 async function accept(actor:string,id:string,ratingPolicy?:RatingPolicy) { await requireHandle(actor); const game = load(id); if (ratingPolicy !== game.rating_policy && !(ratingPolicy === undefined && game.rating_policy === 'legacy')) fail('MATCH_INCOMPATIBLE',409,'Choose this game policy before you accept the seat'); if (game.players.includes(actor)) return view(actor,id); const seat = game.players.indexOf(null); if (!unblocked(actor,game.creator)) fail('FORBIDDEN',403,'This open game cannot be accepted'); if (game.status !== 'waiting' || seat < 0) fail('NOT_ALLOWED',409,'This open game is no longer available'); game.players[seat] = actor; game.revision++; game.updated = Date.now(); game.log.push({seq:game.revision,seat:seat as Seat,action:{type:'join'},at:new Date().toISOString()}); await enter(game); return view(actor,id); }
 async function lobby(actor:string) { return {games:await Promise.all([...games.values()].filter(g=>g.input.kind === 'random' && g.status === 'waiting' && !g.players.includes(actor) && unblocked(actor,g.creator)).map(async g=>({rating_policy:g.rating_policy,game_id:g.id,options:g.input.options ?? null,colour:g.players[0] === null ? 'white' as const : 'black' as const,creator:{handle:(await profile(g.players.find(Boolean)!)).handle!,icon:(await profile(g.players.find(Boolean)!)).icon},created_at:new Date(g.created).toISOString()})))}; }
 async function invitation(code:unknown,actor?:string) {
  let game: Game | undefined, byId = false;
  if (typeof code === 'object' && code !== null && 'invite_id' in code && typeof code.invite_id === 'string') {
   byId = true;
   game = [...games.values()].find(g => g.invite?.invite_id === code.invite_id) ?? fail('INVITE_UNAVAILABLE',404,INVITE_NOTICES.unavailable);
  } else {
   const key = String(code).trim(), normalized = key.toUpperCase().replace(/[\s-]/g,'');
   if (!/^[A-Za-z0-9_-]{43}$/.test(key) && !/^[A-HJKMNP-Z2-9]{6}$/.test(normalized)) fail('INVALID_INPUT',400,'Invalid invitation');
   game = [...games.values()].find(g=>g.invite && (g.invite.token === key || g.invite.code === normalized)) ?? fail('INVITE_UNAVAILABLE',404,'Invitation unavailable');
  }
  const inv = game.invite!;
  if (actor && (byId ? inv.recipient_actor !== actor : inv.recipient_actor && inv.recipient_actor !== actor && inv.created_by !== actor)) fail('INVITE_UNAVAILABLE',404,byId ? INVITE_NOTICES.unavailable : 'Invitation unavailable');
  if (actor && inv.used_by === actor && game.players.includes(actor)) return game;
  if (inv.expires_at <= new Date().toISOString()) fail('INVITE_UNAVAILABLE',409,byId ? INVITE_NOTICES.expired : 'Invitation expired or used');
  if (inv.state !== 'open' || game.status !== 'waiting') fail('INVITE_UNAVAILABLE',409,byId ? INVITE_NOTICES.closed : 'Invitation expired or used');
  return game;
 }
 return {
  async toolTry() {},
  async friends(actor, input = {}) {
   const page = parse(friendsSchema, input), needle = page.handle?.trim().toLowerCase();
   const candidates = new Map<string, { source: Friend['source']; recent: number }>();
   for (const g of games.values()) {
    if (!g.players.includes(actor) || g.input.kind === 'solo') continue;
    const peer = g.players.find(p => p && p !== actor);
    if (peer) candidates.set(peer, { source: 'recent', recent: Math.max(candidates.get(peer)?.recent ?? 0, g.updated) });
   }
   const list: (Friend & { recent: number })[] = [];
   for (const [peer, p] of profiles.entries()) {
    if (peer === actor || !p.handle || !unblocked(actor, peer)) continue;
    const cand = candidates.get(peer);
    if (needle ? p.handle !== needle : !cand) continue;
    list.push({ user_id: p.user_id, handle: p.handle, icon: p.icon, source: cand ? 'recent' : 'lookup', recent: cand?.recent ?? 0 });
   }
   list.sort((a, b) => (a.source === 'recent' ? 0 : 1) - (b.source === 'recent' ? 0 : 1) || b.recent - a.recent || a.user_id.localeCompare(b.user_id));
   if (needle && !list.length) fail('NOT_FOUND', 404, INVITE_NOTICES.notFound);
   const startAt = page.after ? list.findIndex(f => f.user_id === page.after) + 1 : 0;
   const slice = list.slice(startAt, startAt + page.limit).map(({ recent: _recent, ...f }) => f);
   return { friends: slice, next_after: startAt + page.limit < list.length ? slice.at(-1)!.user_id : null };
  },
  async invitations(actor, input = {}) {
   const page = parse(invitationsSchema, input);
   const live = await Promise.all([...games.values()].filter(g => g.invite && (g.invite.created_by === actor || g.invite.recipient_actor === actor && unblocked(g.invite.created_by, actor))).map(async g => ({ at: g.invite!.created_at, row: (await invitationRowFor(actor, g))! })));
   const seeded = (seeds.get(actor)?.invitations ?? []).map((row, idx) => ({ at: Date.parse(row.expires_at) - idx, row }));
   const rows = [...live, ...seeded].sort((a, b) => b.at - a.at || b.row.invite_id.localeCompare(a.row.invite_id)).map(entry => entry.row).filter(r => !page.before || r.invite_id < page.before.split('|')[1]);
   const slice = rows.slice(0, page.limit);
   return { invitations: slice, next_before: rows.length > page.limit ? `${new Date().toISOString()}|${slice.at(-1)!.invite_id}` : null };
  },
  async declineInvite(actor, inviteId) {
   const g = [...games.values()].find(game => game.invite?.invite_id === inviteId) ?? fail('INVITE_UNAVAILABLE', 404, 'This invitation is not available now. Return to Your games.');
   if (g.invite!.recipient_actor !== actor) fail('INVITE_UNAVAILABLE', 404, INVITE_NOTICES.unavailable);
   if (g.invite!.state === 'open' && g.invite!.expires_at > new Date().toISOString() && g.status === 'waiting') {
    g.invite!.state = 'declined'; g.status = 'aborted'; g.setup_deadline = null; g.deadline = null; g.result = { winner: null, reason: 'abort' }; g.revision++; g.updated = Date.now();
   }
   return (await invitationRowFor(actor, g))!;
  },
  async seedPosition(setup,black) {
   const created = await create('alice',{kind:'solo',colour:black?'black':'white',setup});
   if (black) { const game = load(created.game_id); game.input.kind = 'friend'; game.players[0] = 'bob'; }
   return created.game_id;
  },
  view,create,profile,lobby,accept,
  async previewDraft(actor,id,input) {
   const game = load(id); seatOf(game,actor);
   const caller = (await profile(actor)).user_id;
   const players = await Promise.all(game.players.map(async (player,seat) => ({seat,user_id:player ? (await profile(player)).user_id : null})));
   const snapshot = game.match ? await game.match.snapshot() : null, state = game.match ? await game.match.exportSave() : null;
   const service = new GameService({load:async()=>({id,revision:game.revision,status:game.status,turn:snapshot?.turn ?? 0,engine_fingerprint:game.engine,state,snapshot,players})} as unknown as PostgresMatchStore);
   return service.previewDraft(caller,id,input);
  },
  async seen() {},
  async find(actor,options,colour,commandId?,anyRules=false,mode?) {
   await requireHandle(actor); const input = creation({kind:'random',options,colour,mode}), asked = startKey(input,anyRules === true), done = resent(actor,commandId,asked); if (done) return done;
   if (mode === 'ranked' && anyRules) fail('INVALID_INPUT',400,'Ranked uses the fixed ranked rules');
   const ratingPolicy = mode === 'ranked' ? 'ranked-v1' : 'casual';
   const fits = (g:Game) => g.rating_policy === ratingPolicy && (asked.any_rules || switches(g.input.options!) === switches(input.options!));
   const own = [...games.values()].find(g=>g.input.kind === 'random' && g.status === 'waiting' && g.players.includes(actor) && fits(g));
   const open = own ? undefined : (await lobby(actor)).games.find(entry=>fits(load(entry.game_id)));
   const game = own?.id ?? open?.game_id ?? (await create(actor,input)).game_id;
   if (commandId !== undefined) starts.set(`${actor}:${commandId}`,{game,input:JSON.stringify(asked)});
   return open ? accept(actor,game,ratingPolicy) : view(actor,game);
  },
  async cancel(actor,id) { const g = load(id); seatOf(g,actor); if (g.status === 'aborted') return view(actor,id); if (g.input.kind !== 'random' || g.status !== 'waiting') fail('NOT_ALLOWED',409,'Only your waiting random game can be cancelled'); g.status = 'aborted'; g.result = {winner:null,reason:'abort'}; g.revision++; return view(actor,id); },
  async inbox(actor) { const rows = await Promise.all([...games.values()].filter(g=>g.players.includes(actor) && ['playing','waiting','setup'].includes(g.status)).map(async g=>{const v = await view(actor,g.id); return {...('invite_id' in v && {invite_id:v.invite_id}),rating_policy:g.rating_policy,game_id:g.id,kind:v.kind,speed:v.speed,status:v.status as InboxEntry['status'],seat:v.seat,action:v.action,turn:v.turn,revision:v.revision,deadline_at:v.deadline_at,opponent:v.opponent,updated_at:new Date(g.updated).toISOString(),created_at:v.created_at,options:g.input.options ?? null,move:v.fen ? Number(v.fen.split(' ')[5]) : null,open_until:g.status === 'waiting' ? g.invite?.expires_at ?? (g.input.kind === 'random' ? new Date(g.created+DAY).toISOString() : null) : null,level:g.input.level ?? 'club'};})); return [...rows,...seeds.get(actor)?.games ?? []].sort((a,b)=>Number(b.action === 'ready')-Number(a.action === 'ready') || b.updated_at.localeCompare(a.updated_at)); },
  async command(actor,id,input) {
   const g = load(id), seat = seatOf(g,actor), {command_id,expected_revision,action} = parse(commandSchema,input), payload = JSON.stringify({expected_revision,action}), key = `${seat}:${command_id}`, seen = g.commands.get(key);
   if (seen !== undefined) return seen === payload ? view(actor,id,g.revision) : fail('COMMAND_CONFLICT',409,'Command ID was used with different input');
   if (g.revision !== expected_revision) fail('STALE_REVISION',409,'The game changed; reload before you act');
   if (action.type !== 'rematch' && ['finished','aborted'].includes(g.status)) fail('MATCH_TERMINAL',409,'The game has ended');
   if (g.status === 'waiting' && action.type !== 'abort') fail('WAITING',409,'Waiting for the other player');
   if (g.status === 'setup' && !['choose','abort'].includes(action.type)) fail('NOT_ALLOWED',409,'Choose your seat first');
   if (action.type === 'choose') { if (g.status !== 'setup' || g.ready[seat]) fail('NOT_ALLOWED',409,'This seat is ready'); if (validateChoice(g.input.options!,g.drawn!,action.choice)) fail('INVALID_INPUT',400,'Invalid choice'); g.choices[seat] = action.choice; g.ready[seat] = action.ready; if (g.ready.every(Boolean)) await start(g); }
   else if (action.type === 'turn' || action.type === 'computer') {
    const turn = (await g.match!.snapshot()).turn; if (action.type === 'turn' ? turn !== seat : g.input.kind !== 'solo' || turn === seat) fail('WRONG_TURN',403,'This operation is not permitted on the current turn');
    const actions = action.type === 'turn' ? action.actions : [await g.match!.chooseMove({level:g.input.level,maxTimeMs:250,maxDepth:6})];
    if (action.type === 'computer') Object.assign(action, {actions});
    const save = await g.match!.exportSave();
    try {
     for (const lan of actions) {
      const snapshot = await g.match!.snapshot();
      if (snapshot.status !== 'playing' || snapshot.turn !== turn) fail('INVALID_MOVE',400,'This move is no longer available. Reload and choose a move.');
      await g.match!.apply({id:randomUUID(),expectedRevision:snapshot.revision,lan});
     }
     // A player's command is a whole turn, as in the service (W7 ticket 06).
     if (action.type === 'turn') { const after = await g.match!.snapshot(); if (after.status === 'playing' && after.turn === turn) fail('INVALID_MOVE',400,UNFINISHED); }
    } catch (error) {
     const old = g.match!; g.match = await engine.loadMatch(save);
     // shortcut: reads can see draft moves during reload, use a copy if read isolation is required.
     await old.snapshot().catch(() => {}); await old.close();
     if (error instanceof MatchServiceError) throw error;
     fail('INVALID_MOVE',400,'This move is no longer available. Reload and choose a move.');
    }
    if ((await g.match!.snapshot()).turn !== turn) g.turns[turn]++; if (g.draw_offer !== turn) g.draw_offer = null; await end(g);
   } else if (action.type === 'resign') Object.assign(g,{status:'finished',result:{winner:1-seat,reason:'resignation'}});
   else if (action.type === 'abort') { if (!(await view(actor,id)).abort_open) fail('NOT_ALLOWED',409,'Abort is closed'); if (g.invite?.state === 'open') g.invite.state = 'cancelled'; Object.assign(g,{status:'aborted',setup_deadline:null,deadline:null,result:{winner:null,reason:'abort'}}); }
   else if (action.type === 'draw') { if (g.input.kind === 'solo' || (action.choice === 'offer' ? g.draw_offer !== null : g.draw_offer !== 1-seat)) fail('NOT_ALLOWED',409,'No draw offer is possible now'); if (action.choice === 'offer') g.draw_offer = seat; else {g.draw_offer = null; if (action.choice === 'accept') Object.assign(g,{status:'finished',result:{winner:null,reason:'agreement'}});} }
   else if (action.type === 'claim') { if (!g.deadline || g.deadline > new Date().toISOString() || (await g.match!.snapshot()).turn === seat) fail('NOT_ALLOWED',409,'There is no missed deadline to claim'); Object.assign(g,{status:g.turns.every(Boolean) ? 'finished' : 'aborted',result:{winner:g.turns.every(Boolean) ? seat : null,reason:g.turns.every(Boolean) ? 'timeout' : 'no_start'}}); }
   else if (action.type === 'rematch') {
    if (action.choice !== 'decline' && g.input.kind !== 'solo' && !unblocked(actor,g.players[1-seat]!)) fail('NOT_ALLOWED',409,'No rematch is available with this player');
    if (g.status !== 'finished' || g.rematch_game_id || (g.input.kind === 'solo' ? action.choice !== 'offer' : action.choice === 'offer' ? g.rematch_offer !== null : g.rematch_offer !== 1-seat)) fail('NOT_ALLOWED',409,'No rematch is available now');
    if (action.choice === 'decline') g.rematch_offer = null; else if (action.choice === 'offer' && g.input.kind !== 'solo') g.rematch_offer = seat;
    else {const creator = g.players.find(Boolean)!, same = g.input.kind === 'solo', rematch = await create(creator,{...g.input,mode:'casual',colour:(g.players[0] === creator) === same ? 'white' : 'black'}), next = load(rematch.game_id); if (!same) { next.players = [g.players[1],g.players[0]]; await enter(next); } g.rematch_game_id = next.id; g.rematch_offer = null;}
   }
   g.revision++; g.updated = Date.now(); g.commands.set(key,payload); g.log.push({seq:g.revision,seat,action,at:new Date(g.updated).toISOString()}); return view(actor,id,g.revision-1);
  },
  async invite(actor,id,input={}) {
   const g = load(id); seatOf(g,actor); const opts = parse(inviteSchema, input);
   if (g.input.kind !== 'friend' || g.status !== 'waiting') fail('FORBIDDEN',403,'Only the waiting creator can invite');
   if (g.invite && g.invite.state !== 'open') fail('INVITE_UNAVAILABLE',409,INVITE_NOTICES.closed);
   const recipient = g.invite?.recipient_actor ? { actor: g.invite.recipient_actor, user_id: g.invite.recipient_id! } : await resolveRecipient(actor, opts);
   const inv = await issueInvite(g, actor, recipient, g.invite?.expires_at);
   return { token: inv.token, code: inv.code, expires_at: inv.expires_at, invite_id: inv.invite_id, recipient_id: inv.recipient_id };
  },
  async preview(actor,code) {
   const g = await invitation(code, actor), hostActor = g.players.find(Boolean)!, creator = await profile(hostActor);
   if (g.invite!.recipient_actor && g.invite!.recipient_actor !== actor && hostActor !== actor) fail('INVITE_UNAVAILABLE',404,INVITE_NOTICES.unavailable);
   if (!unblocked(actor, hostActor)) fail('INVITE_UNAVAILABLE',404,INVITE_NOTICES.unavailable);
   const rec = g.invite!.recipient_actor ? (await profile(g.invite!.recipient_actor)).handle : null;
   return {code:g.invite!.code,options:g.input.options ?? null,colour:g.players[0] === null ? 'white' : 'black',kind:g.input.kind,creator:{handle:creator.handle,icon:creator.icon,avatar:userAvatar(actor,hostActor)},expires_at:g.invite!.expires_at,recipient_id:g.invite!.recipient_id,recipient_handle:rec,invite_id:g.invite!.invite_id};
  },
  async join(actor,code) {
   await requireHandle(actor); const g = await invitation(code,actor);
   if (g.players.includes(actor) && g.invite!.used_by !== actor) fail('FORBIDDEN',403,'You already have a seat');
   if (g.invite!.used_by === actor) return view(actor, g.id);
   const joined = await accept(actor,g.id,g.rating_policy);
   g.invite!.used_by = actor; g.invite!.state = 'accepted';
   return view(actor, joined.game_id);
  },
  async blocks(actor,after) { const rows = await Promise.all([...blocks].filter(key=>key.startsWith(`${actor}:`)).map(async key=>{const user_id=key.slice(actor.length+1); const other=await profile(user_id); return {user_id:other.user_id,handle:other.handle};})); return rows.filter(row=>!after || row.user_id>after).sort((a,b)=>a.user_id.localeCompare(b.user_id)).slice(0,51); },
  async block(actor,target,blocked) { let other = target.user_id === undefined ? undefined : [...profiles].find(([,p])=>p.user_id === target.user_id)?.[0]; if (target.game_id) { const game = load(target.game_id), seat = seatOf(game,actor); other = game.players[1-seat] ?? undefined; } if (!other) fail('NOT_FOUND',404,'Player not found'); const key = `${actor}:${other}`; if (blocked === true) blocks.add(key); if (blocked === false) blocks.delete(key); return blocks.has(key); },
  async report() {return {id:++reports,created_at:new Date().toISOString()};},
  async handle(actor,input) { const change = parse(handleSchema,input), me = await profile(actor); if (change.check && (!change.handle || change.icon)) fail('INVALID_INPUT',400,'Check one handle'); if (change.handle !== undefined) {const value = change.handle.trim().toLowerCase(), problem = handleProblem(value); if (problem) fail('INVALID_INPUT',400,problem); if ([...profiles.values()].some(p=>p.user_id !== me.user_id && p.handle === value)) fail('HANDLE_TAKEN',409,'This handle is in use'); if (!change.check) me.handle = value;} if (!change.check && change.icon) me.icon = change.icon; profiles.set(actor,me); return me; },
  async settings(actor,input={}) { const change = parse(settingsSchema,input), value = {...settings.get(actor) ?? {symbols_only:false,show_threats:false,online_visible_to:'mutual',last_setup:null},...change}; settings.set(actor,value); return structuredClone(value); },
  async notices(actor,before) { const cursor = parse(noticesBeforeSchema.optional(), before), rows = [...seeds.get(actor)?.notices ?? []].sort((a,b)=>BigInt(a.id)>BigInt(b.id)?-1:1).filter(row=>cursor === undefined || BigInt(row.id)<BigInt(cursor)), notices=rows.slice(0,20); return {notices,next_notices_before:rows.length>20?notices.at(-1)!.id:null}; },
  async history(actor,before) { const seeded = seeds.get(actor)?.history ?? [], since = historySeeded.get(actor) ?? -Infinity;
   // A seeded history is the stored rows at seed time; a fixture game that finishes later joins it, as in the database.
   const played = await Promise.all([...games.values()].filter(g=>g.status === 'finished' && g.players.includes(actor) && g.updated > since && !seeded.some(r=>r.game_id === g.id)).map(g=>finishedRow(actor,g)));
   const rows = [...seeded, ...played].sort((a,b)=>b.finished_at.localeCompare(a.finished_at) || b.game_id.localeCompare(a.game_id)).filter(r=>!before || `${r.finished_at}|${r.game_id}`<before), page = rows.slice(0,20); return {games:page,next_before:rows.length>20 ? `${page.at(-1)!.finished_at}|${page.at(-1)!.game_id}` : null}; },
  async record(actor) {return structuredClone(seeds.get(actor)?.record ?? {totals:{played:0,won:0,drawn:0,lost:0},rating:{rating:1500,rd:350,volatility:0.06,provisional:true},badges:[]});},
  async openBoard(actor,id) { if (id) seatOf(load(id),actor); const board = randomUUID(); boards.set(board,{actor,game:id ?? null,selected:!!id}); return board; },
  async board(actor,id) {const row = boards.get(id); if (!row || row.actor !== actor) return fail('FORBIDDEN',403,'Board unavailable for this account'); if (!row.game && row.selected) fail('MATCH_REMOVED',404,'This game was deleted. Start, resume or join another game.'); return row.game;},
  async selectBoard(actor,id,gameId) {seatOf(load(gameId),actor); const row = boards.get(id); if (!row || row.actor !== actor) return fail('FORBIDDEN',403,'Board unavailable for this account'); row.game = gameId; row.selected = true;},
  seed(actor,data) {if (data.metadata) metadata.set(actor, structuredClone(data.metadata)); if (data.history) historySeeded.set(actor,Date.now()); seeds.set(actor,structuredClone({...data, ...(data.games && {games:data.games.map(row=>({...row,rating_policy:row.rating_policy ?? 'legacy'}))}), ...(data.history && {history:data.history.map(row=>({...row,rating_policy:row.rating_policy ?? 'legacy'}))})} as FixtureSeed)); for (const [id,fields] of Object.entries(data.views ?? {})) {const game = games.get(id); if (game && fields.rating_policy) game.rating_policy = fields.rating_policy; if (game && fields.deadline_at !== undefined) game.deadline = fields.deadline_at;}},
  async deleteMatch(id) {await games.get(id)?.match?.close(); games.delete(id); for (const row of boards.values()) if (row.game === id) row.game = null;},
  async close() {await Promise.all([...games.values()].map(g=>g.match?.close()));},
 };
}
