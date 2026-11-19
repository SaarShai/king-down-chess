/** The new page's host on the existing account client and website client. */
import { profilePortrait } from './portrait';
import type { Client } from '../../../account/client';
import { userOf, type User } from '../../../account/account';
import { AUTH_KEY, sessionKey, type AccountSession } from '../../../account/session';
import { handleProblem, type Icon } from '../../../account/profile';
import type { InvitationRow, View } from '../../../match/protocol';
import { DEFAULT_OPTIONS } from '../../../match/setup';
import { DEFAULT_OPTIONS as PANEL_OPTIONS, singleKinds, type GameOptions } from '../../play/new-game';
import { onlineClient, OnlineError } from '../../../online/client';
import { beginAccountSignIn, consumeSignInReturn, YOU_SIGN_IN, type SignInHost as ReturnHost } from '../../../online/sign-in';
import type { Provider } from '../../../account/providers';
import { apiOrigin, inApp } from '../../../platform';
import { clearDeletedAccount } from '../../../account/local';
import { peopleController, type PeopleState } from '../controller';
import { ObsoleteAction, peopleServer } from '../server';
import { bindSeatKing, preferredKing } from '../seat-king';
import { accountData, AccountDataClosed, type AccountData } from '../../../account/data';
import { toFen } from '../../../rules/setup';
import { DraftTurn } from '../../play/turn';
import { restage } from '../replica';
import type { PersonHost, Player, Rules } from '../screens/person';
import type { LandingHost } from '../screens/landing';
import type { ReadyName } from '../screens/names';

export function inviteURL(token: string, origin = location.origin, app = inApp): string {
  if (app) return 'https://kingdown.dev/j#' + token;
  const url = new URL('/next.html', origin); url.hash = 'join=' + token;
  return url.href;
}

export const onlineOptions = (rules: Rules, options: GameOptions = PANEL_OPTIONS) => ({ ...DEFAULT_OPTIONS, pool: [...options.pool], ...(singleKinds(options).length ? { single: singleKinds(options) } : {}), cardPool: [...options.cardPool], arrangement: options.arrangement === 'manual', kingPowers: rules === 'powers' || rules === 'both', cards: rules === 'cards' || rules === 'both' });
export const draftKey = (user: string, game: string) => `kingdown.people-draft.${user}.${game}`;
export function keepDraft(storage: Pick<Storage, 'setItem'>, user: string, state: PeopleState, gate: AccountData) {
  const key = state.view && draftKey(user, state.view.game_id);
  const value = state.view && state.draft && JSON.stringify({ revision: state.view.revision, actions: state.draft.steps.map(step => state.game!.context.toLan(step.before, step.move)) });
  return gate.write(() => { if (key && value) storage.setItem(key, value); });
}
export function restoreDraft(storage: Pick<Storage, 'getItem'>, user: string, state: PeopleState) {
  if (!state.draft || !state.view) return;
  try {
    const saved = JSON.parse(storage.getItem(draftKey(user, state.view.game_id)) ?? 'null');
    if (saved?.revision === state.view.revision && Array.isArray(saved.actions) && saved.actions.length <= 4 && saved.actions.every((a: unknown) => typeof a === 'string') && state.game) { const candidate = new DraftTurn(state.game); if (restage(candidate, saved.actions)) restage(state.draft, saved.actions); }
  } catch { /* The server position stays when the local draft cannot open. */ }
}
export interface HostOptions {
  rules(): Rules;
  setRules(rules: Rules): void;
  changed(): void;
  open(id: string, notice?: string): void;
  home(): void;
  toast(line: string): void;
  /** Tests use the existing account interface and the local protocol server. */
  auth?: () => Promise<Client>;
  storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> & Partial<Pick<Storage, 'length' | 'key'>>;
  fetch?: typeof fetch;
}
export function onlineHost(options: HostOptions) {
  const storage = options.storage ?? localStorage;
  let authPromise: Promise<Client> | undefined, session: AccountSession | null = null, user: User | null = null, writer: AccountData | undefined;
  let profile: { handle: string | null; icon: Icon | null } | null = null, views: View[] = [], loading: Promise<void> | undefined;
  let incomingInvites: InvitationRow[] = [], inviteUpdates: InvitationRow[] = [], cachedKnown: Player[] = [];
  let controller: ReturnType<typeof peopleController> | undefined, stop = () => {}, unsubscribe = () => {}, epoch = 0;
  const safetyListeners = new Set<(nextUser?: string) => void>();
  const closeSafety = (nextUser?: string) => { for (const close of [...safetyListeners]) close(nextUser); };
  const inviteSeenKey = (userId: string, inviteId: string) => `kingdown.invite-seen.${userId}.${inviteId}`;
  const knownAvatar = (handle: string): string | null => {
    for (const view of views) {
      if (view.opponent?.handle === handle && !view.opponent.deleted && view.opponent.avatar) return view.opponent.avatar;
      if (view.invitation?.player?.handle === handle && view.invitation.player.avatar) return view.invitation.player.avatar;
    }
    for (const row of [...incomingInvites, ...inviteUpdates]) {
      if (row.player?.handle === handle && row.player.avatar) return row.player.avatar;
    }
    return null;
  };
  const auth = () => authPromise ??= (options.auth ? options.auth() : import('../../../account/client').then(m => m.connect(AUTH_KEY, { manualCallback: true, apple: true }))).then(client => {
    client.onSession(current => {
      user = userOf(current?.user);
      if (current?.user.id !== session?.userId || session && current && typeof current.access_token === 'string' && sessionKey({ userId: current.user.id, accessToken: current.access_token }) !== sessionKey(session)) {
        const changing = !!session;
        epoch++; closeSafety(current?.user.id); stopGame(); session = null; profile = null; views = []; incomingInvites = []; inviteUpdates = []; cachedKnown = [];
        if (changing) options.home(); options.changed();
      }
      options.changed();
    });
    return client;
  }, error => { authPromise = undefined; throw error; });
  const api = onlineClient({ origin: apiOrigin, fetch: options.fetch, token: async () => {
    const current = await (await auth()).readSession();
    return current && current.userId === session?.userId ? current.accessToken : null;
  } });
  function accountSafety() {
    const expectedUser = session?.userId, mark = epoch;
    const current = async () => {
      const value = await (await auth()).readSession();
      return expectedUser && value?.userId === expectedUser && session?.userId === expectedUser && mark === epoch ? value : null;
    };
    const scoped = onlineClient({ origin: apiOrigin, fetch: options.fetch, token: async () => (await current())?.accessToken ?? null });
    async function checked<T>(reply: Promise<T>): Promise<T> {
      const value = await reply;
      if (!await current()) throw new OnlineError('UNAUTHENTICATED', 401, 'The account changes.');
      return value;
    }
    return {
      report: (...args: Parameters<typeof scoped.report>) => checked(scoped.report(...args)),
      block: (...args: Parameters<typeof scoped.block>) => checked(scoped.block(...args)),
      relate: (...args: Parameters<typeof scoped.relate>) => checked(scoped.relate(...args)),
      record: (...args: Parameters<typeof scoped.record>) => checked(scoped.record(...args)),
      onAccountChange(close: () => void) {
        safetyListeners.add(close);
        if (!expectedUser || expectedUser !== session?.userId || mark !== epoch) close();
        return () => { safetyListeners.delete(close); };
      },
    };
  }
  const returnHost: ReturnHost = { entryPath: '/next.html', location, history, storage: sessionStorage, now: Date.now, client: auth };
  async function startSignIn(way: Provider, target: string) {
    if (way === 'apple' && inApp) { await (await auth()).signInWithApple(); await signIn(); void refresh(); }
    else await beginAccountSignIn(way, target, returnHost);
  }
  function stopGame() { controller?.stop(); stop(); unsubscribe(); stop = unsubscribe = () => {}; controller = undefined; }
  async function signIn() {
    const current = await (await auth()).readSession();
    if (session?.userId !== current?.userId || session && current && sessionKey(session) !== sessionKey(current)) { epoch++; closeSafety(current?.userId); stopGame(); views = []; incomingInvites = []; inviteUpdates = []; cachedKnown = []; }
    const mark = epoch;
    session = current; writer = undefined;
    if (current) {
      const gate = accountData(current.userId, storage);
      try {
        await gate.confirm(async () => {
          const live = await (await auth()).readSession();
          return live && live.userId === current.userId && sessionKey(live) === sessionKey(current) && mark === epoch ? live : null;
        });
        const ready = accountData(current.userId, storage);
        const settings = await api.settings();
        await ready.write(async () => {
          const live = await (await auth()).readSession();
          if (!live || live.userId !== current.userId || sessionKey(live) !== sessionKey(current) || mark !== epoch) throw new AccountDataClosed();
          profile = settings.me; writer = ready;
        });
      } catch (error) { if (!(error instanceof AccountDataClosed)) throw error; }
    } else profile = null;
    options.changed();
    return current;
  }
  function remember(view: View) {
    if (view.status !== 'waiting') incomingInvites = incomingInvites.filter(i => i.game_id !== view.game_id);
    const i = views.findIndex(v => v.game_id === view.game_id);
    if (i < 0) views.push(view); else views[i] = { ...views[i], ...view, rules: view.rules ?? views[i].rules, history: view.history ?? views[i].history };
    options.changed();
  }
  function seatReply(opening = false) {
    const account = session, mark = epoch, gate = writer;
    if (!account) throw new OnlineError('UNAUTHENTICATED', 401, 'Sign in to play.');
    const current = () => { if (mark !== epoch || session?.userId !== account.userId) throw new ObsoleteAction(); };
    const accept = async (view: View, king: ReturnType<typeof preferredKing>) => {
      let failed = false;
      if (!gate) throw new ObsoleteAction();
      try { await bindSeatKing(storage, account.userId, view, king, () => { failed = true; }, gate); }
      catch (error) { if (error instanceof AccountDataClosed) throw new ObsoleteAction(); throw error; }
      current();
      const notice = failed ? 'Your king stays for this visit. It cannot save on this device.' : undefined;
      if (notice && !opening) options.toast(notice);
      remember(view);
      return notice;
    };
    const failed = (error: unknown): never => { current(); throw error; };
    const live = async () => {
      current();
      if (!gate) throw new ObsoleteAction();
      try { await gate.write(() => {}); } catch (error) { if (error instanceof AccountDataClosed) throw new ObsoleteAction(); throw error; }
      current();
    };
    return Object.assign(accept, { current: live, failed });
  }
  async function refresh() {
    if (!session) return;
    if (loading) return loading;
    const mark = epoch;
    loading = (async () => {
      try {
        const [listed, record] = await Promise.all([api.invitations({ limit: 50 }), api.record()]);
        const inbox = Array.isArray(listed) ? listed : listed.games ?? [];
        const invitationRows = Array.isArray(listed) ? [] : listed.invitations ?? [];
        const nextIncoming = invitationRows.filter(row => row.direction === 'incoming' && row.state === 'open');
        const nextUpdates = invitationRows.filter(row => row.direction === 'outgoing' && (row.state === 'declined' || row.state === 'expired') && (() => {
          try { return storage.getItem(inviteSeenKey(session!.userId, row.invite_id)) !== row.state; } catch { return true; }
        })());
        const finished = record.history.filter(row => {
          try { return storage.getItem(`kingdown.people-seen.${session!.userId}.${row.game_id}`) !== row.finished_at; } catch { return true; }
        }).slice(0, 10);
        const answers = await Promise.allSettled([...new Set([...inbox.map(row => row.game_id), ...finished.map(row => row.game_id)])].map(id => api.game(id)));
        if (mark !== epoch) return;
        const before = JSON.stringify([views, incomingInvites, inviteUpdates]);
        const next = answers.flatMap(answer => answer.status === 'fulfilled' ? [answer.value] : []);
        // A failed row read keeps the last known position. It cannot remove a saved game.
        for (const answer of answers) if (answer.status === 'rejected') for (const kept of views) if (!next.some(v => v.game_id === kept.game_id)) next.push(kept);
        views = next;
        incomingInvites = nextIncoming;
        inviteUpdates = nextUpdates;
        if (before !== JSON.stringify([views, incomingInvites, inviteUpdates])) options.changed();
      } catch { options.toast('Your online games cannot load. Check your connection and try again.'); }
    })().finally(() => { loading = undefined; });
    return loading;
  }
  const host: PersonHost & LandingHost = {
    photo: true, pictureFor: name => profilePortrait(name, user?.avatar),
    get rules() { return options.rules(); }, setRules: options.setRules,
    me: () => session ? profile ?? { handle: null, icon: null } : null,
    ways: async () => (await (await auth()).providers()),
    start: way => startSignIn(way, location.hash.startsWith('#join=') ? '/j#' + location.hash.slice(6) : controller?.gameId ? '/g/' + controller.gameId : '/play/friend'),
    sendCode: async email => (await auth()).sendEmailCode(email),
    verifyCode: async (email, code) => { await (await auth()).verifyEmailCode(email, code); await signIn(); void refresh(); },
    checkName: async handle => (await api.handle({ handle, check: true })).available === true,
    saveName: async (name: ReadyName) => { profile = (await api.handle(name)).me; },
    playComputer: options.home, storage: sessionStorage,
    recent: async () => {
      const seen = new Set<string>(), list = [];
      for (const row of (await api.record()).history) {
        if (row.opponent.computer || row.opponent.deleted || !row.opponent.handle || seen.has(row.opponent.handle)) continue;
        seen.add(row.opponent.handle);
        list.push({ handle: row.opponent.handle, icon: null, avatar: knownAvatar(row.opponent.handle), result: row.result, at: row.finished_at });
        if (list.length >= 3) break;
      }
      return list;
    },
    known: async () => {
      if (!session) return [];
      const page = await api.friends({ limit: 20 });
      cachedKnown = page.friends.map(friend => ({ handle: friend.handle, icon: friend.icon, avatar: knownAvatar(friend.handle) }));
      return cachedKnown;
    },
    find: async text => {
      const clean = text.trim().toLowerCase();
      if (clean.length < 2) return [];
      if (!cachedKnown.length && session) {
        try { cachedKnown = (await api.friends({ limit: 50 })).friends.map(friend => ({ handle: friend.handle, icon: friend.icon, avatar: knownAvatar(friend.handle) })); }
        catch { /* Exact handle search below still runs when handle format is valid. */ }
      }
      const matches = cachedKnown.filter(player => player.handle.startsWith(clean)).map(player => ({ ...player, avatar: knownAvatar(player.handle) ?? player.avatar ?? null }));
      if (handleProblem(clean) !== null) return matches;
      try {
        const exact = await api.friends({ handle: clean });
        for (const friend of exact.friends) if (!matches.some(m => m.handle === friend.handle)) matches.push({ handle: friend.handle, icon: friend.icon, avatar: knownAvatar(friend.handle) });
        return matches;
      } catch (error) {
        if (error instanceof OnlineError && error.code === 'NOT_FOUND') return matches;
        throw error;
      }
    },
    invite: async (handle, rules, choices) => {
      const accept = seatReply(), king = choices ? choices.king : preferredKing(storage);
      const created = await api.create({ kind: 'friend', recipient_handle: handle, colour: 'random', options: onlineOptions(rules, choices) }).catch(accept.failed);
      await accept(created.view, king);
    },
    inviteBack: async (handle, rules) => {
      const accept = seatReply(), king = preferredKing(storage);
      const created = await api.create({ kind: 'friend', recipient_handle: handle, colour: 'random', options: rules ?? onlineOptions(options.rules()) }).catch(accept.failed);
      await accept(created.view, king);
    },
    createLink: async (rules, choices) => {
      const accept = seatReply(), king = choices ? choices.king : preferredKing(storage);
      const created = await api.create({ kind: 'friend', open_link: true, colour: 'random', options: onlineOptions(rules, choices) }).catch(accept.failed);
      await accept(created.view, king);
      const link = created.invite ?? await api.invite(created.view.game_id).catch(accept.failed);
      await accept.current();
      return inviteURL(link.token);
    },
    preview: key => api.preview(key),
    get safety() { return { ...accountSafety(), changed: () => { void refresh(); } }; },
    join: async key => { const accept = seatReply(true), king = preferredKing(storage); const view = await api.redeem(key).catch(accept.failed); const notice = await accept(view, king); options.open(view.game_id, notice); },
    toPlay: options.home, toast: options.toast,
    share: navigator.share ? data => navigator.share(data) : undefined,
    coarse: matchMedia('(pointer: coarse)').matches,
  };
  function reset() { epoch++; closeSafety(); stopGame(); session = null; writer = undefined; profile = null; user = null; views = []; incomingInvites = []; inviteUpdates = []; cachedKnown = []; options.home(); options.changed(); }
  const resultHost = {
    async copyLink(id: string) {
      const link = await api.invite(id), { copyText } = await import('../../../clipboard');
      if (!await copyText(inviteURL(link.token))) throw new Error('The link cannot copy.');
    },
    api, host, get safety() { return accountSafety(); }, get user() { return user; }, get userId() { return session?.userId; }, get views() { return views; }, get incomingInvites() { return incomingInvites; }, get inviteUpdates() { return inviteUpdates; }, get controller() { return controller; }, get signedIn() { return !!session; },
    async acceptInvite(invite: InvitationRow) {
      const accept = seatReply(true), king = preferredKing(storage);
      const view = await api.redeem({ invite_id: invite.invite_id }).catch(accept.failed);
      const notice = await accept(view, king);
      incomingInvites = incomingInvites.filter(i => i.invite_id !== invite.invite_id);
      options.open(view.game_id, notice);
      void refresh();
    },
    async declineInvite(invite: InvitationRow) {
      await api.declineInvite(invite.invite_id);
      incomingInvites = incomingInvites.filter(i => i.invite_id !== invite.invite_id);
      options.toast('Invite declined.');
      options.changed();
      void refresh();
    },
    async dismissInvite(invite: InvitationRow) {
      if (session && writer) try { const key = inviteSeenKey(session.userId, invite.invite_id); await writer.write(() => storage.setItem(key, invite.state)); } catch { /* This update can show again. */ }
      inviteUpdates = inviteUpdates.filter(i => i.invite_id !== invite.invite_id);
      options.changed();
    },
    async init() {
      const returned = await consumeSignInReturn(returnHost);
      // No stored session: the local home does not load the account library.
      let stored = false; try { stored = !!storage.getItem(AUTH_KEY); } catch { /* Local play works with blocked storage. */ }
      if (returned.status !== 'retry' && (stored || returned.status === 'signed-in')) await signIn();
      if (session) await refresh();
      return returned;
    },
    signIn, refresh, stopGame,
    startAccountSignIn: (way: Provider) => startSignIn(way, YOU_SIGN_IN),
    async open(id: string, change: (state: PeopleState) => void) {
      stopGame();
      if (!session) { change({ phase: 'loading', connection: 'auth' } as PeopleState); return; }
      const opening = session, mark = epoch, account = opening.userId, gate = writer;
      const live = async () => {
        current.signal.throwIfAborted();
        const value = await (await auth()).readSession();
        current.signal.throwIfAborted();
        if (!value || value.userId !== account || sessionKey(value) !== sessionKey(opening) || !session || session.userId !== account || sessionKey(session) !== sessionKey(opening) || mark !== epoch) { current.stop(); throw new ObsoleteAction(); }
        return value;
      };
      const scoped = onlineClient({ origin: apiOrigin, fetch: options.fetch, token: async () => (await live()).accessToken });
      const current = peopleController({ server: peopleServer(scoped), storage, userId: account, locks: navigator.locks, current: live }); controller = current;
      let restored = false, seen = -1;
      unsubscribe = current.subscribe(state => {
        if (controller !== current) return;
        if (state.view) {
          if (!restored && state.game) { restored = true; restoreDraft(storage, session!.userId, state); }
          remember(state.game ? { ...state.view, rules: state.game.rules, history: { initial_fen: toFen(state.game.history[0]?.pos ?? state.game.pos), actions: state.game.history.map(entry => state.game!.context.toLan(entry.pos, entry.move)) } } : state.view);
          if (state.view.status === 'finished' && state.view.revision !== seen) { seen = state.view.revision; void scoped.record({}, current.signal).then(record => {
            if (controller !== current) return;
            const row = record.history.find(row => row.game_id === id);
            if (row && gate) void gate.write(() => storage.setItem(`kingdown.people-seen.${account}.${id}`, row.finished_at)).catch(() => {});
          }).catch(() => {}); }
        }
        change(current.state());
      });
      stop = current.start(); await current.open(id);
    },
    async saveDraft() {
      if (!session || !controller) return true;
      try { if (!writer) throw new AccountDataClosed(); await keepDraft(storage, session.userId, controller.state(), writer); return true; }
      catch { options.toast('This device cannot save your unsent turn. Send it before you close the page.'); return false; }
    },
    get deletion() {
      const opening = session, mark = epoch, gate = writer;
      let expectedSignOut = false;
      const listeners = new Set<() => void>();
      const keys = ['kingdown.email-code', 'kingdown.account-page.' + opening?.userId, 'kingdown.account-signin'];
      let records: (string | null)[] | undefined;
      try { records = keys.map(key => sessionStorage.getItem(key)); } catch { /* Report incomplete cleanup with the receipt. */ }
      const current = async () => {
        const live = await (await auth()).readSession();
        if (opening && live?.userId === opening.userId && sessionKey(live) === sessionKey(opening) && session === opening && mark === epoch) return live;
        for (const close of listeners) close();
        throw new OnlineError('UNAUTHENTICATED', 401, 'The account changes.');
      };
      return {
        onAccountChange(close: () => void) {
          const changed = (nextUser?: string) => { if (!expectedSignOut || nextUser) close(); };
          listeners.add(close); safetyListeners.add(changed);
          if (!opening || session !== opening || mark !== epoch) close();
          return () => { listeners.delete(close); safetyListeners.delete(changed); };
        },
        async remove() {
          const scoped = onlineClient({ origin: apiOrigin, fetch: options.fetch, token: async () => (await current()).accessToken });
          const result = await scoped.requestDeletion();
          if (!result.deletion || !Number.isFinite(Date.parse(result.deletion.run_after))) throw new Error('No deletion receipt');
          let localCleared = true;
          try {
            if (!gate) throw new AccountDataClosed();
            await gate.close(() => {
              if (typeof storage.length !== 'number' || !storage.key) throw new Error('Storage cannot list keys');
              clearDeletedAccount(storage as Storage, opening!.userId);
            }, current);
            if (!records) throw new Error('Storage cannot read sign-in records');
            keys.forEach((key, i) => { if (records[i] !== null && sessionStorage.getItem(key) === records[i]) sessionStorage.removeItem(key); });
          } catch (error) { if (error instanceof OnlineError) throw error; if (error instanceof AccountDataClosed) throw new OnlineError('UNAUTHENTICATED', 401, 'The account changes.'); localCleared = false; }
          // Auth events can reach this tab after the full reply and local cleanup.
          await current();
          expectedSignOut = true;
          if (!await (await auth()).signOutSession(opening!)) throw new OnlineError('UNAUTHENTICATED', 401, 'The account changes.');
          if (session === opening && mark === epoch) reset();
          options.toast('Deletion requested. Sign in before deletion to cancel.');
          return { runAfter: result.deletion.run_after, localCleared };
        },
      };
    },
    async signOut() {
      stopGame();
      const client = await auth(), expected = session;
      if (!expected) { await client.signOut(); reset(); return; }
      // Bind to the shown session: another tab, or this page, can sign in while the reply waits.
      await client.signOutSession(expected);
      const live = await client.readSession().catch(() => null);
      if (session && sessionKey(session) !== sessionKey(expected) || live && sessionKey(live) !== sessionKey(expected)) return;
      reset();
    },
  };
  return resultHost;
}
export type OnlineHost = ReturnType<typeof onlineHost>;
