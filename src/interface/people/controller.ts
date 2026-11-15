/**
 * The online controller of a game against a person (docs/specs/people-controller; audit M11 and M14). No DOM: a
 * screen reads `state()`, calls the actions and redraws on each change. The turn source is the solo one (`DraftTurn`
 * on a `Game`); the server view stays the truth. Commands use the old page's durable receipt with the M12 fix, and
 * the engine identity (M3) decides whether the page engine may judge a turn alone.
 */
import { Game } from '../../game';
import { needsServerPreview, PAGE_ENGINE } from '../../account-game/engine-identity';
import type { Action, ErrorCode, JoinPreview, Opponent, View } from '../../match/protocol';
import { pollSince, runPoll, type PollView } from '../../plugin/poll';
import { boardActions } from '../../plugin/screens/board-model';
import type { Move, Position } from '../../rules/engine';
import { DraftTurn } from '../play/turn';
import { defaultChoice, validateChoice } from '../../match/setup';
import { OPTIONS_KEY, readOptions } from '../play/new-game';
import { faultOf, settled, type Fault, type InviteKey, type PeopleServer } from './server';
import { actionOf, ReceiptBusy, receiptOf, receiptStore, type LockManager, type Receipt } from './receipt';
import { lastTurnOf, playCommands, positionOf, replicaOf, restage, turnActions, type ReceivedTurn } from './replica';

/** Each player has 3 draw offers in each game (`src/match/service.ts` DRAW_OFFERS). */
export const DRAW_OFFERS = 3;
/** The checks of an unsettled command before the player can discard it (M12). */
export const CHECKS_BEFORE_DISCARD = 2;
/** A read that fails this many times in a row shows the service line (`src/account-game/state.ts` failed-poll). */
export const READS_BEFORE_DOWN = 3;
const SEEN_MS = 30_000;

export type Phase = 'loading' | 'waiting' | 'setup' | 'your-move' | 'staged' | 'sending' | 'checking' | 'their-move' | 'over' | 'gone' | 'account' | 'failed';
export type Connection = 'online' | 'offline' | 'down' | 'auth';
/** One notice at a time; the next player action clears it. */
export type Notice = { kind: 'stale' | 'illegal' | 'offline' | 'refused' | 'draw-declined' | 'signed-in'; code?: ErrorCode; message?: string };
export type Rematch = 'none' | 'mine' | 'theirs' | 'declined' | 'closed' | 'accepted';

export interface PeopleState {
  /** The same engine game that the shared board reads. */
  game?: Game;
  phase: Phase;
  /** The last server view. Draft moves never go into it. */
  view?: View;
  opponent: Opponent | null;
  /** The board to show: the draft position on your move, else the game position. */
  position?: Position;
  /** The turn in progress (your move only). */
  draft?: DraftTurn;
  /** Send is on: a finished draft and nothing waits. */
  canSend: boolean;
  /** The opponent's last turn, when it is your move: the screen plays it once and names it. */
  received?: ReceivedTurn;
  /** Your turn went in this visit and the opponent has not moved yet. */
  sent: boolean;
  draw: 'none' | 'mine' | 'theirs';
  drawsLeft: number;
  canOfferDraw: boolean;
  rematch: Rematch;
  rematchGame: string | null;
  /** The time left for the side to move, from the server clock; null with no deadline. */
  clock: { left: number | null; mine: boolean };
  claim: 'win' | 'end' | null;
  abortOpen: boolean;
  connection: Connection;
  notice?: Notice;
  /** A command whose answer is not known. `game` is its game (it can be another game: it holds all commands). */
  check?: { game: string | null; tries: number; canDiscard: boolean };
  /** M3: 'local' when the page engine is the game's engine; else the server checks each turn before it goes. */
  engine: 'local' | 'server';
}

export interface ControllerOptions {
  server: PeopleServer;
  userId: string;
  storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
  locks?: LockManager;
  /** The page engine (`__KINGDOWN_PAGE_ENGINE__`); tests set it. */
  pageEngine?: string;
  now?: () => number;
  online?: () => boolean;
  uuid?: () => string;
}
type Pending = { receipt: Receipt | undefined; tries: number };

export function peopleController(options: ControllerOptions) {
  const { server, now = Date.now, online = () => globalThis.navigator?.onLine !== false, uuid = () => crypto.randomUUID() } = options;
  const pageEngine = 'pageEngine' in options ? options.pageEngine : PAGE_ENGINE;
  const receipts = receiptStore(options.userId, options.storage, options.locks);
  const listeners = new Set<(state: PeopleState) => void>();
  let view: View | undefined, game: Game | undefined, draft: DraftTurn | undefined, received: ReceivedTurn | undefined;
  let fatal: 'gone' | 'account' | 'failed' | undefined, engine: 'local' | 'server' = 'server', connection: Connection = 'online';
  let notice: Notice | undefined, pending: Pending | undefined, sending = false, busy = false, sent = false, declined = false;
  let readAt = 0, skew = 0, readFails = 0, seenAt = -Infinity, target: string | undefined, epoch = 0;
  const offers = new Set<number>();
  let poll: ReturnType<typeof runPoll> | undefined;

  const mine = (v: View | undefined = view) => !!v && v.status === 'playing' && v.action === 'ready' && v.turn === v.seat;
  function phase(): Phase {
    if (fatal) return fatal;
    if (!view) return 'loading';
    if (sending) return 'sending';
    if (pending && (!pending.receipt || pending.receipt.args.game_id === view.game_id)) return 'checking';
    if (view.status === 'waiting') return 'waiting';
    if (view.status === 'setup') return 'setup';
    if (view.status !== 'playing') return 'over';
    return mine() ? draft?.length ? 'staged' : 'your-move' : 'their-move';
  }
  function rematch(): Rematch {
    if (!view || view.status !== 'finished') return 'none';
    if (view.rematch_game_id) return 'accepted';
    if (view.rematch_allowed === false || view.opponent?.deleted) return 'closed';
    if (view.rematch_offer === view.seat) return 'mine';
    if (view.rematch_offer != null) return 'theirs';
    return declined ? 'declined' : 'none';
  }
  function state(): PeopleState {
    const p = phase(), elapsed = now() - readAt;
    const deadline = view?.status === 'playing' && view.deadline_at ? Date.parse(view.deadline_at) : NaN;
    const actions = view ? boardActions(view, elapsed) : { abort: false, claim: null };
    const drawsLeft = Math.max(0, DRAW_OFFERS - offers.size);
    const playing = view?.status === 'playing' && !sending && p !== 'checking';
    return {
      phase: p, view, game, opponent: view?.opponent ?? null, position: draft?.position ?? game?.pos, draft: mine() ? draft : undefined,
      canSend: p === 'staged' && !!draft?.canFinish && !pending && connection !== 'auth',
      received: mine() ? received : undefined, sent,
      draw: !view || view.draw_offer == null ? 'none' : view.draw_offer === view.seat ? 'mine' : 'theirs',
      drawsLeft, canOfferDraw: !!playing && view!.kind !== 'solo' && view!.draw_offer == null && drawsLeft > 0,
      rematch: rematch(), rematchGame: view?.rematch_game_id ?? null,
      clock: { left: Number.isFinite(deadline) ? deadline - (now() + skew) : null, mine: mine() },
      claim: actions.claim, abortOpen: !!view?.abort_open && view.status !== 'finished' && view.status !== 'aborted',
      connection, notice, engine,
      check: pending && { game: pending.receipt?.args.game_id ?? null, tries: pending.tries, canDiscard: !pending.receipt || pending.tries >= CHECKS_BEFORE_DISCARD },
    };
  }
  function emit() { poll?.update(); const now = state(); for (const listener of listeners) listener(now); }

  /** The first draft of your move; `keep` stages earlier moves again when they are still legal. */
  function freshDraft(keep?: readonly string[]): DraftTurn | undefined {
    if (!game || !mine()) return;
    const next = new DraftTurn(game);
    if (keep?.length && !restage(next, keep)) return new DraftTurn(game);
    return next;
  }
  const draftLans = () => draft?.steps.map(step => game!.context.toLan(step.before, step.move));
  const timed = (next: View) => { readAt = now(); skew = Date.parse(next.server_now) - readAt; if (!Number.isFinite(skew)) skew = 0; };
  function countOffers(next: View) {
    for (const command of next.last_commands) if (command.seat === next.seat && command.action.type === 'draw' && command.action.choice === 'offer') offers.add(command.seq);
  }
  /** The saved turn is the command after its revision: it went in. */
  function wentIn(saved: Receipt, next: View): boolean {
    const action = actionOf(saved), first = next.last_commands.find(c => c.seq === saved.args.expected_revision + 1);
    return action?.type === 'turn' && first?.seat === next.seat && first.action.type === 'turn' && JSON.stringify(first.action.actions) === JSON.stringify(action.actions);
  }
  function good(next: View) {
    readFails = 0; if (connection !== 'auth') connection = 'online'; timed(next); countOffers(next);
    if (pending?.receipt && pending.receipt.args.game_id === next.game_id && next.revision > pending.receipt.args.expected_revision) {
      // M12: a higher revision settles the saved command: it went in, or it can never go in.
      const done = pending.receipt; pending = undefined; void receipts.drop(done);
      if (wentIn(done, next)) sent = true;
    }
    if (next.kind !== 'solo' && now() - seenAt >= SEEN_MS) { seenAt = now(); void server.seen(next.game_id).catch(() => {}); }
  }
  function badRead(error: unknown, first: boolean) {
    const fault = faultOf(error, online(), true);
    if (fault.kind === 'auth') connection = 'auth';
    else if (fault.kind === 'offline') connection = 'offline';
    else if (fault.kind === 'gone' || fault.kind === 'account') fatal = fault.kind;
    // A failed open shows at once; poll failures stay quiet until the third in a row.
    else if (++readFails >= READS_BEFORE_DOWN || first) connection = 'down';
    emit();
  }

  /** Each seat uses its own saved king when this game admits it. */
  function setupChoice(order?: string) {
    if (!view?.options || !view.draw) return;
    const o = view.options, draw = { army: view.draw, hand: [...view.deal ?? []] };
    const choice = { ...(view.choices?.[view.seat] ?? defaultChoice(o, draw, view.seat, Math.random, false, view.setup_admission)), ...(order !== undefined ? { order } : {}) };
    try {
      const king = readOptions(JSON.parse(options.storage.getItem(OPTIONS_KEY) ?? 'null')).king;
      if (!view.ready?.[view.seat] && king && !validateChoice(o, draw, { ...choice, king }, view.setup_admission)) choice.king = king;
    } catch { /* unreadable options keep the seat default */ }
    return choice;
  }
  function setupGame(next: View): Game | undefined {
    const choice = setupChoice();
    if (next.status !== 'setup' || !choice || !next.draw) return;
    const kings: Game['rules']['kings'] = [next.seat === 0 ? choice.king : null, next.seat === 1 ? choice.king : null];
    const setup = new Game(next.draw, { kings });
    // The other seat's chosen order stays private until both players confirm.
    const pos = setup.pos, board = pos.board.slice();
    for (let sq = 0; sq < 64; sq++) if (sq < 16 && next.seat === 1 || sq >= 48 && next.seat === 0) board[sq] = 0;
    setup.load({ ...pos, board });
    return setup;
  }
  /** A full view: build the copy again. */
  function adopt(next: View, keep?: readonly string[]) {
    const copy = replicaOf(next);
    view = next; game = copy ?? positionOf(next) ?? setupGame(next); fatal = undefined;
    engine = copy && !needsServerPreview(next.engine_fingerprint, pageEngine) ? 'local' : 'server';
    if (!game && (next.status === 'playing' || next.status === 'finished')) fatal = 'failed';
    draft = freshDraft(keep);
    received = game && mine() && copy ? lastTurnOf(game, next) : undefined;
    good(next); emit();
  }
  async function fullRead(gameId: string, keep?: readonly string[]) {
    const mark = epoch;
    try { const next = await server.game(gameId); if (mark === epoch) adopt(next, keep); }
    catch (error) { if (mark === epoch) badRead(error, !view); }
  }
  /** A view after `view.revision` (a poll read or a command answer): play its moves on the copy. */
  function advance(next: View): boolean {
    if (!view || next.game_id !== view.game_id) return false;
    if (view.status === 'setup' && next.status === 'playing') return false;
    if (next.status === 'setup') { adopt(next); return true; }
    if (next.revision === view.revision) { view = { ...next, rules: next.rules ?? view.rules }; good(next); emit(); return true; }
    if (!game || !view.rules) return false;
    const before = game.history.length, offerOpen = view.draw_offer === view.seat;
    const turns = playCommands(game, view.revision, next);
    if (!turns) return false;
    for (const command of next.last_commands) if (command.seq > view.revision && command.seat !== next.seat && command.action.type === 'rematch' && command.action.choice === 'decline') declined = true;
    view = { ...next, rules: next.rules ?? view.rules };
    const theirs = turns.filter(turn => turn.seat !== next.seat).at(-1);
    if (theirs) { received = { seq: theirs.seq, at: theirs.at, steps: theirs.steps }; sent = false; }
    if (!mine()) draft = undefined;
    else if (game.history.length !== before || !draft) draft = freshDraft();
    if (offerOpen && next.draw_offer == null && next.status === 'playing') notice = { kind: 'draw-declined' };
    good(next); emit();
    return true;
  }

  /** Keep the commands that set the poll delay. */
  async function refresh() {
    if (!view || busy || fatal) return;
    const base = view, mark = epoch;
    try {
      const next = await server.game(base.game_id, pollSince(base));
      if (mark !== epoch || view !== base || busy) return;
      if (!advance(next)) await fullRead(base.game_id, draftLans());
    } catch (error) { if (mark === epoch) badRead(error, false); }
  }

  /** The server refused the command: it cannot apply later. */
  async function refused(fault: Fault, keep?: readonly string[]) {
    if (fault.kind === 'stale') { notice = { kind: 'stale' }; if (view) await fullRead(view.game_id, keep); return; }
    if (fault.kind === 'ended') { if (view) await fullRead(view.game_id); return; }
    if (fault.kind === 'gone' || fault.kind === 'account') fatal = fault.kind;
    else notice = fault.kind === 'illegal' ? { kind: 'illegal' } : { kind: 'refused', code: fault.code, message: fault.message };
    emit();
  }
  /** The answer of a command: the view that it made. */
  async function landed(next: View, action: Action) {
    if (action.type === 'turn') sent = true;
    if (!advance(next) && view) await fullRead(view.game_id);
  }

  /**
   * The saved command: settle it before any other command (the old rule), with the M12 fix. A read that shows a
   * higher revision settles it with no send; at the same revision it goes again with its own ID (the server applies it
   * once). After two failed checks the player can discard it. True when no saved command waits.
   */
  async function settle(): Promise<boolean> {
    const saved = receipts.read();
    if (!saved) { pending = undefined; return true; }
    if (saved === 'unreadable') { pending = { receipt: undefined, tries: CHECKS_BEFORE_DISCARD }; emit(); return false; }
    const action = actionOf(saved), gameId = saved.args.game_id, expected = saved.args.expected_revision;
    const tries = pending?.receipt && JSON.stringify(pending.receipt) === JSON.stringify(saved) ? pending.tries : 0;
    // A start of the old page (create, find) is no game command: only Discard can free it here.
    if (!action || typeof expected !== 'number') { pending = { receipt: saved, tries: CHECKS_BEFORE_DISCARD }; emit(); return false; }
    pending = { receipt: saved, tries }; busy = true; emit();
    let read = true;
    try {
      const current = await server.game(gameId, expected);
      if (current.revision > expected) {
        await receipts.drop(saved); pending = undefined; busy = false;
        if (wentIn(saved, current)) sent = true;
        if (view?.game_id === gameId && !advance(current)) await fullRead(gameId);
        else emit();
        return true;
      }
      read = false;
      const next = await server.command(gameId, expected, action, saved.args.command_id);
      await receipts.drop(saved); pending = undefined; busy = false;
      if (connection === 'auth') connection = 'online';
      if (view?.game_id === gameId) await landed(next, action); else emit();
      return true;
    } catch (error) {
      busy = false;
      const fault = faultOf(error, online(), read);
      if (settled(fault)) {
        await receipts.drop(saved); pending = undefined;
        if (view?.game_id === gameId) await refused(fault); else emit();
        return true;
      }
      if (fault.kind === 'auth') connection = 'auth';
      pending = { receipt: saved, tries: tries + 1 }; emit();
      return false;
    }
  }

  /** One command of this game, with its receipt written before the send. */
  async function command(action: Action, keep = draftLans()): Promise<boolean> {
    if (!view || busy || fatal || phase() === 'checking') return false;
    notice = undefined;
    if (!online()) { notice = { kind: 'offline' }; emit(); return false; }
    const base = view, receipt = receiptOf(base.game_id, base.revision, action, uuid());
    try { await receipts.hold(receipt); }
    catch (error) {
      if (!(error instanceof ReceiptBusy)) { notice = { kind: 'refused', message: 'This device cannot save the send. Free some space, then try again.' }; emit(); return false; }
      if (!await settle() || view !== base) return false;
      await receipts.hold(receipt);
    }
    busy = sending = true; emit();
    try {
      const next = await server.command(base.game_id, base.revision, action, receipt.args.command_id);
      await receipts.drop(receipt); busy = sending = false;
      await landed(next, action);
      return true;
    } catch (error) {
      busy = sending = false;
      const fault = faultOf(error, online());
      if (!settled(fault)) {
        // The answer is not known: the receipt stays, and Check again sends it with the same ID.
        pending = { receipt, tries: 0 };
        if (fault.kind === 'auth') connection = 'auth'; else if (fault.kind === 'offline') connection = 'offline';
        emit(); return false;
      }
      await receipts.drop(receipt);
      await refused(fault, keep);
      return false;
    }
  }

  function edit(change: (draft: DraftTurn) => void) {
    const p = phase();
    if (!draft || busy || (p !== 'your-move' && p !== 'staged')) throw new Error('The board takes no move now.');
    notice = undefined; change(draft); emit();
  }

  return {
    state, subscribe(listener: (state: PeopleState) => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },

    /** Open a game: settle a saved command, then read the whole game. */
    async open(gameId: string) {
      epoch++; target = gameId;
      view = game = draft = received = undefined; fatal = undefined; notice = undefined; sent = declined = false; offers.clear(); readFails = 0;
      emit();
      const mark = epoch;
      await settle();
      if (mark === epoch) await fullRead(gameId);
    },
    /** Join by an invite link. Returns the fault when the server refuses or does not answer. */
    async join(key: InviteKey): Promise<Fault | undefined> {
      try {
        const joined = await server.join(key);
        epoch++; target = joined.game_id; view = undefined; notice = undefined; sent = declined = false; offers.clear(); readFails = 0;
        if (joined.rules && joined.history) adopt(joined); else await fullRead(joined.game_id);
        return;
      } catch (error) {
        const fault = faultOf(error, online());
        if (fault.kind === 'auth') { connection = 'auth'; emit(); }
        return fault;
      }
    },
    /** The invite before a join (the landing). */
    async preview(key: InviteKey): Promise<JoinPreview | Fault> {
      try { return await server.preview(key); } catch (error) { return faultOf(error, online()); }
    },

    stage: (move: Move) => edit(d => d.stage(move)),
    bite: (source: number, square: number) => edit(d => d.bite(source, square)),
    undo: () => edit(d => d.undo()),
    arm: (key: string) => edit(d => d.arm(key)),

    /** Send the whole turn. With a second engine (M3) the server checks the turn first. */
    async send(): Promise<boolean> {
      if (!state().canSend || !draft || !view || busy) return false;
      const actions = turnActions(draft);
      if (!actions) return false;
      if (engine === 'server') {
        if (!online()) { notice = { kind: 'offline' }; emit(); return false; }
        const base = view;
        busy = sending = true; notice = undefined; emit();
        try {
          if (!base.engine_fingerprint) throw new Error('The game has no engine identity.');
          await server.draft(base.game_id, { expected_revision: base.revision, engine_fingerprint: base.engine_fingerprint, actions });
        } catch (error) {
          busy = sending = false;
          const fault = faultOf(error, online());
          if (settled(fault)) await refused(fault, draftLans());
          else {
            if (fault.kind === 'auth') connection = 'auth';
            else if (fault.kind === 'offline') { connection = 'offline'; notice = { kind: 'offline' }; }
            else connection = 'down';
            emit();
          }
          return false;
        }
        busy = sending = false;
        if (view !== base) return false;
      }
      return command({ type: 'turn', actions });
    },
    /** Check again: read the game and settle the saved command. */
    async check() { const free = await settle(); if (free) await refresh(); return free; },
    /** M12: after two failed checks, the player discards the saved command. The draft stays for a new Send. */
    async discard(): Promise<boolean> {
      const s = state();
      if (!s.check?.canDiscard) return false;
      await receipts.drop(pending?.receipt); pending = undefined; emit();
      return true;
    },
    /** After a new sign-in: the saved command goes with its own ID, then the game reads again. */
    async signedIn() {
      connection = 'online'; emit();
      const had = !!pending?.receipt;
      const free = await settle();
      if (had && free && !notice) notice = { kind: 'signed-in' };
      if (view) await refresh(); else if (target) await fullRead(target); emit();
    },
    refresh,

    /** Confirm this seat's king and its own back-rank order. */
    async ready(order?: string) {
      if (view?.status !== 'setup' || !view.options || !view.draw || view.ready?.[view.seat] || !view.options.arrangement && view.seat === 1 && view.ready?.[0] === false) return Promise.resolve(false);
      const choice = setupChoice(order)!;
      if (validateChoice(view.options, { army: view.draw, hand: [...view.deal ?? []] }, choice, view.setup_admission)) return Promise.resolve(false);
      const base = view, sent = await command({ type: 'choose', choice, ready: true });
      // The other seat can confirm at the same time. Retry once against its new revision.
      if (!sent && !busy && !pending && notice?.kind === 'stale' && view?.game_id === base.game_id && view.status === 'setup' && !view.ready?.[view.seat] && view.revision !== base.revision)
        return command({ type: 'choose', choice, ready: true });
      return sent;
    },

    offerDraw: () => state().canOfferDraw ? command({ type: 'draw', choice: 'offer' }) : Promise.resolve(false),
    answerDraw: (accept: boolean) => state().draw === 'theirs' && view?.status === 'playing' ? command({ type: 'draw', choice: accept ? 'accept' : 'decline' }) : Promise.resolve(false),
    /** The unsent turn does not count. */
    resign: () => view?.status === 'playing' ? command({ type: 'resign' }, []) : Promise.resolve(false),
    abort: () => state().abortOpen ? command({ type: 'abort' }, []) : Promise.resolve(false),
    claim: () => state().claim ? command({ type: 'claim', reason: 'timeout' }, []) : Promise.resolve(false),
    rematch: (choice: 'offer' | 'accept' | 'decline') => view?.status === 'finished' ? command({ type: 'rematch', choice }, []) : Promise.resolve(false),

    /** Start the poll (`src/plugin/poll.ts`) and the connection events. Returns the stop. */
    start(env: { page?: EventTarget & { readonly hidden: boolean }; net?: EventTarget } = {}) {
      const page = env.page ?? globalThis.document, net = env.net ?? globalThis;
      const pollView = (): PollView => {
        if (!view || fatal) return;
        // The rematch watch reads a finished game until a rematch or an answer comes (as `endPoll` of the old page).
        const watch = view.status === 'finished' && view.kind !== 'solo' && !view.rematch_game_id && !!view.opponent && !view.opponent.deleted && view.rematch_allowed !== false;
        return watch ? { ...view, status: 'playing', turn: (1 - view.seat) as 0 | 1 } : view;
      };
      const wentOnline = () => { if (connection === 'offline') connection = 'online'; emit(); void (pending?.receipt ? settle() : Promise.resolve(true)).then(() => refresh()); };
      const wentOffline = () => { if (connection !== 'auth') connection = 'offline'; emit(); };
      net.addEventListener('online', wentOnline); net.addEventListener('offline', wentOffline);
      poll = page ? runPoll(() => view && !fatal ? { view: pollView(), read: refresh, fastStart: true } : undefined, () => !busy && connection !== 'auth', page) : undefined;
      return () => { poll?.stop(); poll = undefined; net.removeEventListener('online', wentOnline); net.removeEventListener('offline', wentOffline); };
    },
    /** The game this controller shows (also while it loads). */
    get gameId() { return target; },
  };
}
export type PeopleController = ReturnType<typeof peopleController>;
