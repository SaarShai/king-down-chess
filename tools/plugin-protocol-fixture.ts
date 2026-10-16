/** In-memory screen fixture. The engine plays moves; the database tests check transactions and access. */
import { randomBytes, randomInt, randomUUID } from 'node:crypto';
import { createMatch, type LocalMatch, type MatchSetup } from '../src/match';
import { MatchServiceError } from '../src/match/store';
import { FRIEND_CODE_DAYS } from '../src/match/service';
import { createSchema, commandSchema, type CreateOptions, type InboxEntry, type View, type Seat, type LoggedCommand, type HistoryEntry, type PlayerRecord } from '../src/match/protocol';
import { buildSetup, defaultChoice, draw, seatChoicesNeeded, validateChoice, type Draw, type Choice } from '../src/match/setup';
import { handleSchema, type PluginService } from '../src/plugin/service';
import { settingsSchema, type PlayerSettings } from '../src/plugin/settings';
import { handleProblem, type Icon } from '../src/account/profile';

const CODE = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789', DAY = 86_400_000;
const fail = (code: MatchServiceError['code'], status: number, message: string): never => { throw new MatchServiceError(code, status, message); };
const parse = <T>(schema: {safeParse(input:unknown):{success:boolean;data?:T}}, input:unknown):T => { const value = schema.safeParse(input); return value.success ? value.data! : fail('INVALID_INPUT',400,'Invalid input'); };
interface Game { id:string; creator:string; input:CreateOptions; match?:LocalMatch; players:(string|null)[]; choices:[Choice|null,Choice|null]; ready:[boolean,boolean]; drawn?:Draw; turns:[number,number]; revision:number; status:View['status']; result?:View['result']; commands:Map<string,string>; log:LoggedCommand[]; invite?:{token:string;code:string;expires_at:string;used_by?:string}; draw_offer:Seat|null; rematch_offer:Seat|null; rematch_game_id:string|null; created:number; updated:number; setup_deadline:string|null; deadline:string|null }
export interface FixtureSeed { history?:HistoryEntry[]; games?:InboxEntry[]; record?:PlayerRecord; views?:Record<string,Partial<View>> }
export function fixtureService(): Pick<PluginService,keyof PluginService> & { seedPosition(setup:MatchSetup,black:boolean):Promise<string>; seed(actor:string,data:FixtureSeed):void; deleteMatch(id:string):Promise<void>; close():Promise<void> } {
 // A start command ID names the game it made or joined, as the database's start receipt does.
 const games = new Map<string,Game>(), starts = new Map<string,string>(), boards = new Map<string,{actor:string;game:string|null;selected:boolean}>(), profiles = new Map<string,{user_id:string;handle:string|null;icon:Icon|null}>(), settings = new Map<string,PlayerSettings>(), seeds = new Map<string,FixtureSeed>();
 let reports = 0;
 const profile = async (actor:string) => { if (!profiles.has(actor)) profiles.set(actor,{user_id:actor,handle:null,icon:null}); return {...profiles.get(actor)!}; };
 const load = (id:string) => games.get(id) ?? fail('NOT_FOUND',404,'Game not found');
 const seatOf = (game:Game,actor:string):Seat => { const seat = game.players.indexOf(actor); return seat < 0 ? fail('FORBIDDEN',403,'You do not have a seat in this game') : seat as Seat; };
 const requireHandle = async (actor:string) => { if (!(await profile(actor)).handle) fail('HANDLE_NEEDED',409,'Choose a handle first'); };
 async function start(game:Game) { game.match = await createMatch(game.input.options ? buildSetup(game.input.options,game.drawn!,game.choices as [Choice,Choice]) : game.input.setup ?? {}); game.status = 'playing'; game.setup_deadline = null; await end(game); }
 async function end(game:Game) { const after = await game.match!.snapshot(); if (after.status !== 'playing') Object.assign(game,{status:'finished',result:{winner:after.status === 'checkmate' ? 1-after.turn : null,reason:after.status}}); }
 async function enter(game:Game) { if (game.ready.every(Boolean) || !game.input.options) { if (!game.match) await start(game); else game.status = 'playing'; } else {game.status = 'setup'; if (game.input.kind !== 'solo') game.setup_deadline ??= new Date(Date.now()+3*DAY).toISOString();} }
 async function create(actor:string,input:unknown,commandId?:string):Promise<View> {
  const options = parse<CreateOptions>(createSchema,input); if (options.kind !== 'solo') await requireHandle(actor);
  const started = starts.get(`${actor}:${commandId}`); if (commandId !== undefined && started) return view(actor,started);
  const seat:Seat = options.colour === 'black' ? 1 : options.colour === 'random' ? randomInt(2) as Seat : 0, solo = options.kind === 'solo', drawn = options.options ? draw(options.options,Math.random) : undefined;
  const needs = !!options.options && Object.values(seatChoicesNeeded(options.options)).some(Boolean);
  const game:Game = {id:randomUUID(),creator:actor,input:options,players:[null,null],choices:[null,null],ready:[!needs,!needs],drawn,turns:[0,0],revision:0,status:solo ? 'setup' : 'waiting',commands:new Map(),log:[],draw_offer:null,rematch_offer:null,rematch_game_id:null,created:Date.now(),updated:Date.now(),setup_deadline:null,deadline:null};
  game.players[seat] = actor;
  if (drawn) for (const s of [0,1] as const) { game.choices[s] = defaultChoice(options.options!,drawn,s,Math.random,solo && s !== seat); if (solo && s !== seat) game.ready[s] = true; }
  games.set(game.id,game); if (commandId !== undefined) starts.set(`${actor}:${commandId}`,game.id);
  if (solo) await enter(game); else if (!options.options) { await start(game); game.status = 'waiting'; }
  return view(actor,game.id);
 }
 async function view(actor:string,id:string,since?:number):Promise<View> {
  const game = load(id), seat = seatOf(game,actor), snapshot = await game.match?.snapshot(), playing = game.status === 'playing', other = (1-seat) as Seat, opponent = game.players[other], solo = game.input.kind === 'solo';
  const otherProfile = opponent ? await profile(opponent) : null, allReady = game.ready.every(Boolean), speed = game.input.speed ?? (solo ? 'live' : 'daily');
  const canSwitch = solo && [...games.values()].some(g=>g.input.kind === 'random' && g.creator === actor && g.created<=game.created && ['setup','playing'].includes(g.status) && g.log.some(c=>c.action.type === 'join' && Date.parse(c.at)>game.created));
  const { outcome, rules: seededRules, ...seeded } = seeds.get(actor)?.views?.[id] ?? {};
  return {...seeded, game_id:id,revision:game.revision,created_at:new Date(game.created).toISOString(),abort_open:game.status === 'waiting' || game.status === 'setup' || playing && (game.turns.some(n=>!n) || canSwitch),seat,kind:game.input.kind,speed,days_per_move:speed === 'daily' ? game.input.days_per_move ?? 3 : null,status:game.status,turn:snapshot?.turn ?? 0,
   action:playing ? snapshot!.turn === seat ? 'ready' : 'waiting' : game.status === 'setup' ? game.ready[seat] ? 'waiting' : 'ready' : game.status === 'waiting' ? 'waiting' : 'done',fen:snapshot?.fen ?? '',in_check:snapshot?.inCheck ?? false,legal:playing && snapshot!.turn === seat ? snapshot!.legal : [],
   last_commands:game.log.filter(c=>c.seq>(since ?? 0)).slice(since === undefined ? -10 : -50).map(c=>c.seat === other && c.action.type === 'choose' && !allReady ? {...c,action:{type:'hidden'}} : c),
   opponent:opponent || solo ? {handle:otherProfile?.handle ?? null,icon:otherProfile?.icon ?? null,computer:solo,deleted:false,last_seen_ms:null,...(since === undefined && opponent && {rating:{rating:1500,provisional:true}})} : null,
   draw_offer:game.draw_offer,rematch_offer:game.rematch_offer,rematch_game_id:game.rematch_game_id,level:game.input.level ?? 'club',...(game.result && {result:game.result}),deadline_at:game.deadline,server_now:new Date().toISOString(),
   ...(game.drawn && {options:game.input.options,draw:game.drawn.army,deal:game.drawn.hand,choices:game.choices.map((c,s)=>s === seat || allReady ? c : null) as View['choices'],ready:[...game.ready] as [boolean,boolean],setup_deadline_at:game.setup_deadline}),
   ...(snapshot && {kings:snapshot.rules.kings,hands:snapshot.rules.hands,...(since === undefined && {rules:snapshot.rules,history:{initial_fen:JSON.parse(await game.match!.exportSave()).initialFen,actions:snapshot.history}})}),
   ...(since === undefined && { ...(game.status === 'finished' && outcome && {outcome}), ...(seededRules && {rules:seededRules}) })};
 }
 async function accept(actor:string,id:string) { await requireHandle(actor); const game = load(id); if (game.players.includes(actor)) return view(actor,id); const seat = game.players.indexOf(null); if (game.status !== 'waiting' || seat < 0) fail('NOT_ALLOWED',409,'This open game is no longer available'); game.players[seat] = actor; game.revision++; game.updated = Date.now(); game.log.push({seq:game.revision,seat:seat as Seat,action:{type:'join'},at:new Date().toISOString()}); await enter(game); return view(actor,id); }
 async function lobby(actor:string) { return {games:await Promise.all([...games.values()].filter(g=>g.input.kind === 'random' && g.status === 'waiting' && !g.players.includes(actor)).map(async g=>({game_id:g.id,options:g.input.options ?? null,colour:g.players[0] === null ? 'white' as const : 'black' as const,creator:{handle:(await profile(g.players.find(Boolean)!)).handle!,icon:(await profile(g.players.find(Boolean)!)).icon},created_at:new Date(g.created).toISOString()})))}; }
 async function invitation(code:unknown,actor?:string) { const key = String(code).trim(), normalized = key.toUpperCase().replace(/[\s-]/g,''); if (!/^[A-Za-z0-9_-]{43}$/.test(key) && !/^[A-HJKMNP-Z2-9]{6}$/.test(normalized)) fail('INVALID_INPUT',400,'Invalid invitation'); const game = [...games.values()].find(g=>g.invite && (g.invite.token === key || g.invite.code === normalized)) ?? fail('INVITE_UNAVAILABLE',404,'Invitation unavailable'); if (actor && game.invite!.used_by === actor && game.players.includes(actor)) return game; if (game.status !== 'waiting' || game.invite!.expires_at <= new Date().toISOString()) fail('INVITE_UNAVAILABLE',409,'Invitation expired or used'); return game; }
 return {
  async seedPosition(setup,black) {
   const created = await create('alice',{kind:'solo',colour:black?'black':'white',setup});
   if (black) { const game = load(created.game_id); game.input.kind = 'friend'; game.players[0] = 'bob'; }
   return created.game_id;
  },
  view,create,profile,lobby,accept,
  async seen() {},
  async find(actor,options,colour='white',commandId?) {
   await requireHandle(actor); const key = `${actor}:${commandId}`, started = starts.get(key); if (commandId !== undefined && started) return view(actor,started);
   const own = [...games.values()].find(g=>g.input.kind === 'random' && g.status === 'waiting' && g.players.includes(actor)); if (own) return view(actor,own.id);
   const [first] = (await lobby(actor)).games; if (!first) return create(actor,{kind:'random',options,colour},commandId);
   if (commandId !== undefined) starts.set(key,first.game_id); return accept(actor,first.game_id);
  },
  async cancel(actor,id) { const g = load(id); seatOf(g,actor); if (g.status === 'aborted') return view(actor,id); if (g.input.kind !== 'random' || g.status !== 'waiting') fail('NOT_ALLOWED',409,'Only your waiting random game can be cancelled'); g.status = 'aborted'; g.result = {winner:null,reason:'abort'}; g.revision++; return view(actor,id); },
  async inbox(actor) { const rows = await Promise.all([...games.values()].filter(g=>g.players.includes(actor) && ['playing','waiting','setup'].includes(g.status)).map(async g=>{const v = await view(actor,g.id); return {game_id:g.id,kind:v.kind,speed:v.speed,status:v.status as InboxEntry['status'],seat:v.seat,action:v.action,turn:v.turn,revision:v.revision,deadline_at:v.deadline_at,opponent:v.opponent,updated_at:new Date(g.updated).toISOString(),created_at:v.created_at,options:g.input.options ?? null,move:v.fen ? Number(v.fen.split(' ')[5]) : null,open_until:g.status === 'waiting' ? g.invite?.expires_at ?? (g.input.kind === 'random' ? new Date(g.created+DAY).toISOString() : null) : null,level:g.input.level ?? 'club'};})); return [...rows,...seeds.get(actor)?.games ?? []].sort((a,b)=>Number(b.action === 'ready')-Number(a.action === 'ready') || b.updated_at.localeCompare(a.updated_at)); },
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
    for (const lan of actions) try { await g.match!.apply({id:randomUUID(),expectedRevision:(await g.match!.snapshot()).revision,lan}); } catch {fail('INVALID_MOVE',400,'This move is no longer available. Reload and choose a move.');}
    if ((await g.match!.snapshot()).turn !== turn) g.turns[turn]++; if (g.draw_offer !== turn) g.draw_offer = null; await end(g);
   } else if (action.type === 'resign') Object.assign(g,{status:'finished',result:{winner:1-seat,reason:'resignation'}});
   else if (action.type === 'abort') { if (!(await view(actor,id)).abort_open) fail('NOT_ALLOWED',409,'Abort is closed'); Object.assign(g,{status:'aborted',setup_deadline:null,deadline:null,result:{winner:null,reason:'abort'}}); }
   else if (action.type === 'draw') { if (g.input.kind === 'solo' || (action.choice === 'offer' ? g.draw_offer !== null : g.draw_offer !== 1-seat)) fail('NOT_ALLOWED',409,'No draw offer is possible now'); if (action.choice === 'offer') g.draw_offer = seat; else {g.draw_offer = null; if (action.choice === 'accept') Object.assign(g,{status:'finished',result:{winner:null,reason:'agreement'}});} }
   else if (action.type === 'claim') { if (!g.deadline || g.deadline > new Date().toISOString() || (await g.match!.snapshot()).turn === seat) fail('NOT_ALLOWED',409,'There is no missed deadline to claim'); Object.assign(g,{status:g.turns.every(Boolean) ? 'finished' : 'aborted',result:{winner:g.turns.every(Boolean) ? seat : null,reason:g.turns.every(Boolean) ? 'timeout' : 'no_start'}}); }
   else if (action.type === 'rematch') {
    if (g.status !== 'finished' || g.rematch_game_id || (g.input.kind === 'solo' ? action.choice !== 'offer' : action.choice === 'offer' ? g.rematch_offer !== null : g.rematch_offer !== 1-seat)) fail('NOT_ALLOWED',409,'No rematch is available now');
    if (action.choice === 'decline') g.rematch_offer = null; else if (action.choice === 'offer' && g.input.kind !== 'solo') g.rematch_offer = seat;
    else {const creator = g.players.find(Boolean)!, same = g.input.kind === 'solo', rematch = await create(creator,{...g.input,colour:(g.players[0] === creator) === same ? 'white' : 'black'}), next = load(rematch.game_id); if (!same) { next.players = [g.players[1],g.players[0]]; await enter(next); } g.rematch_game_id = next.id; g.rematch_offer = null;}
   }
   g.revision++; g.updated = Date.now(); g.commands.set(key,payload); g.log.push({seq:g.revision,seat,action,at:new Date(g.updated).toISOString()}); return view(actor,id,g.revision-1);
  },
  async invite(actor,id) { const g = load(id); seatOf(g,actor); if (g.input.kind !== 'friend' || g.status !== 'waiting') fail('FORBIDDEN',403,'Only the waiting creator can invite'); g.invite = {token:randomBytes(32).toString('base64url'),code:Array.from({length:6},()=>CODE[randomInt(CODE.length)]).join(''),expires_at:new Date(Date.now()+FRIEND_CODE_DAYS*DAY).toISOString()}; return {...g.invite}; },
  async preview(actor,code) { const g = await invitation(code), creator = await profile(g.players.find(Boolean)!); if (g.players.includes(actor)) fail('FORBIDDEN',403,'You already have a seat'); return {code:g.invite!.code,options:g.input.options ?? null,colour:g.players[0] === null ? 'white' : 'black',kind:g.input.kind,creator:{handle:creator.handle,icon:creator.icon},expires_at:g.invite!.expires_at}; },
  async join(actor,code) { await requireHandle(actor); const g = await invitation(code,actor); if (g.players.includes(actor) && g.invite!.used_by !== actor) fail('FORBIDDEN',403,'You already have a seat'); const joined = await accept(actor,g.id); g.invite!.used_by = actor; return joined; },
  async report() {return {id:++reports,created_at:new Date().toISOString()};},
  async handle(actor,input) { const change = parse(handleSchema,input), me = await profile(actor); if (change.check && (!change.handle || change.icon)) fail('INVALID_INPUT',400,'Check one handle'); if (change.handle !== undefined) {const value = change.handle.trim().toLowerCase(), problem = handleProblem(value); if (problem) fail('INVALID_INPUT',400,problem); if ([...profiles.values()].some(p=>p.user_id !== actor && p.handle === value)) fail('HANDLE_TAKEN',409,'This handle is in use'); if (!change.check) me.handle = value;} if (!change.check && change.icon) me.icon = change.icon; profiles.set(actor,me); return me; },
  async settings(actor,input={}) { const change = parse(settingsSchema,input), value = {...settings.get(actor) ?? {symbols_only:false,show_threats:false,last_setup:null},...change}; settings.set(actor,value); return structuredClone(value); },
  async history(actor,before) { const rows = [...seeds.get(actor)?.history ?? []].sort((a,b)=>b.finished_at.localeCompare(a.finished_at) || b.game_id.localeCompare(a.game_id)).filter(r=>!before || `${r.finished_at}|${r.game_id}`<before), page = rows.slice(0,20); return {games:page,next_before:rows.length>20 ? `${page.at(-1)!.finished_at}|${page.at(-1)!.game_id}` : null}; },
  async record(actor) {return structuredClone(seeds.get(actor)?.record ?? {totals:{played:0,won:0,drawn:0,lost:0},rating:{rating:1500,rd:350,volatility:0.06,provisional:true},badges:[]});},
  async openBoard(actor,id) { if (id) seatOf(load(id),actor); const board = randomUUID(); boards.set(board,{actor,game:id ?? null,selected:!!id}); return board; },
  async board(actor,id) {const row = boards.get(id); if (!row || row.actor !== actor) return fail('FORBIDDEN',403,'Board unavailable for this account'); if (!row.game && row.selected) fail('MATCH_REMOVED',404,'This game was deleted. Start, resume or join another game.'); return row.game;},
  async selectBoard(actor,id,gameId) {seatOf(load(gameId),actor); const row = boards.get(id); if (!row || row.actor !== actor) return fail('FORBIDDEN',403,'Board unavailable for this account'); row.game = gameId; row.selected = true;},
  seed(actor,data) {seeds.set(actor,structuredClone(data)); for (const [id,fields] of Object.entries(data.views ?? {})) {const game = games.get(id); if (game && fields.deadline_at !== undefined) game.deadline = fields.deadline_at;}},
  async deleteMatch(id) {await games.get(id)?.match?.close(); games.delete(id); for (const row of boards.values()) if (row.game === id) row.game = null;},
  async close() {await Promise.all([...games.values()].map(g=>g.match?.close()));},
 };
}
