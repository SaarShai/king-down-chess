// Unit tests for the store's pure parts (design §1 and §3, ticket 19 S2). The page parts load no DOM, so they run in
// the node environment: the notice reducer, the scopes, the message line and the scoped locks.
import { describe, expect, it, vi } from 'vitest';
import type { View } from '../match/protocol';
import { applyLocks, backLabel, blocked, isStart, locks, messageLine, noticeShows, pendingHere, reduce, staleRead, type Notice, type Page, type Slot } from './state';

const view = (game_id: string, revision = 1) => ({ game_id, revision } as unknown as View);
const page = (part: Partial<Page> = {}): Page => ({ screen: 'board', connected: true, mounting: false, writing: false, settings: true, ...part });
const slot = (part: Partial<Slot> = {}): Slot => ({ polls: 0, ...part });
// The client's one sentence for a lost connection (client.ts CANNOT_CONNECT). A copy keeps this unit file free of DOM code.
const CANNOT_CONNECT = 'Cannot connect. Check your connection, then try again.';

describe('the notice reducer', () => {
  it('keeps a refusal through every read, and clears it on a command', () => {
    const notice: Notice = { kind: 'refusal', text: 'Abort is closed', game: 'g1' };
    const shown = page({ view: view('g1'), notice });
    expect(reduce(slot({ notice }), { type: 'good-read', game: 'g1' }, shown).notice).toBe(notice);
    expect(reduce(slot({ notice }), { type: 'failed-poll', text: CANNOT_CONNECT, game: 'g1' }, shown).notice).toBe(notice);
    expect(reduce(slot({ notice }), { type: 'command' }, shown).notice).toBeUndefined();
  });

  it('clears an error on a command, and keeps it through a read', () => {
    const notice: Notice = { kind: 'error', text: CANNOT_CONNECT, screen: 'board' };
    expect(reduce(slot({ notice }), { type: 'good-read', game: 'g1' }, page()).notice).toBe(notice);
    expect(reduce(slot({ notice }), { type: 'command' }, page()).notice).toBeUndefined();
  });

  it('clears a refusal or a read only on a view of another game', () => {
    const refusal: Notice = { kind: 'refusal', text: 'Abort is closed', game: 'g1' };
    const read: Notice = { kind: 'read', text: CANNOT_CONNECT, game: 'g1' };
    for (const notice of [refusal, read]) {
      expect(reduce(slot({ notice }), { type: 'view', game: 'g1' }, page()).notice).toBe(notice);
      expect(reduce(slot({ notice }), { type: 'view', game: 'g2' }, page()).notice).toBeUndefined();
    }
    // A notice that names no game has no scope, so another game does not clear it.
    const loose: Notice = { kind: 'refusal', text: 'Nope' };
    expect(reduce(slot({ notice: loose }), { type: 'view', game: 'g2' }, page()).notice).toBe(loose);
  });

  it('shows a notice on its scope', () => {
    const refusal: Notice = { kind: 'refusal', text: 'Nope', game: 'g1' };
    expect(noticeShows(page({ view: view('g1') }), refusal)).toBe(true);
    expect(noticeShows(page({ view: view('g2') }), refusal)).toBe(false);
    expect(noticeShows(page({ screen: 'play', view: view('g1') }), refusal)).toBe(false);
    const error: Notice = { kind: 'error', text: 'Nope', screen: 'play' };
    expect(noticeShows(page({ screen: 'play' }), error)).toBe(true);
    expect(noticeShows(page({ screen: 'board' }), error)).toBe(false);
    expect(noticeShows(page({ screen: 'home' }), { kind: 'connect', text: 'Nope' })).toBe(true);
  });

  it('clears a connect notice only when a later connect succeeds', () => {
    expect(reduce(slot({ notice: { kind: 'connect', text: 'Nope' } }), { type: 'connected' }, page()).notice).toBeUndefined();
    const read: Notice = { kind: 'read', text: 'Nope' };
    expect(reduce(slot({ notice: read }), { type: 'connected' }, page()).notice).toBe(read);
  });

  it('clears an error notice on navigation and keeps a refusal', () => {
    const error = reduce(slot(), { type: 'error', text: 'Nope' }, page({ screen: 'play' }));
    expect(error.notice).toEqual({ kind: 'error', text: 'Nope', screen: 'play' });
    expect(reduce(error, { type: 'navigate' }, page()).notice).toBeUndefined();
    const refusal: Notice = { kind: 'refusal', text: 'Nope' };
    expect(reduce(slot({ notice: refusal }), { type: 'navigate' }, page()).notice).toBe(refusal);
  });
});

describe('the read rule', () => {
  it('clears the read notice of its game on a good read and resets the poll counter', () => {
    const read: Notice = { kind: 'read', text: CANNOT_CONNECT, game: 'g1' };
    expect(reduce(slot({ notice: read, polls: 2 }), { type: 'good-read', game: 'g1' }, page())).toEqual({ notice: undefined, polls: 0 });
    expect(reduce(slot({ notice: read, polls: 2 }), { type: 'good-read', game: 'g2' }, page()).notice).toBe(read);
    // A first-read notice names no game; any good read clears it.
    expect(reduce(slot({ notice: { kind: 'read', text: 'Nope' } }), { type: 'good-read', game: 'zz' }, page()).notice).toBeUndefined();
  });

  it('sets the read notice on the third failed poll and stays silent before it', () => {
    let state = slot();
    state = reduce(state, { type: 'failed-poll', text: CANNOT_CONNECT, game: 'g1' }, page());
    expect(state).toEqual({ polls: 1 });
    state = reduce(state, { type: 'failed-poll', text: CANNOT_CONNECT, game: 'g1' }, page());
    expect(state).toEqual({ polls: 2 });
    state = reduce(state, { type: 'failed-poll', text: CANNOT_CONNECT, game: 'g1' }, page());
    expect(state.notice).toEqual({ kind: 'read', text: CANNOT_CONNECT, game: 'g1' });
  });

  it('sets the read notice at once on a failed foreground read', () => {
    expect(reduce(slot({ polls: 2 }), { type: 'failed-read', text: 'Nope', game: 'g1' }, page())).toEqual({ notice: { kind: 'read', text: 'Nope', game: 'g1' }, polls: 0 });
  });

  it('marks a read stale only for the shown game, or when it names none', () => {
    const read: Notice = { kind: 'read', text: 'Nope', game: 'g1' };
    expect(staleRead(page({ notice: read, view: view('g1') }))).toBe(true);
    expect(staleRead(page({ notice: read, view: view('g2') }))).toBe(false);
    expect(staleRead(page({ notice: { kind: 'read', text: 'Nope' } }))).toBe(true);
    expect(staleRead(page({ notice: { kind: 'refusal', text: 'Nope', game: 'g1' }, view: view('g1') }))).toBe(false);
  });
});

describe('the pending scope', () => {
  it('reads a game command only while its game shows on a game screen', () => {
    expect(pendingHere(page({ pending: { name: 'kingdown_move', args: {}, game_tag: 'g1', screen: 'board' }, view: view('g1') }))).toBe(true);
    expect(pendingHere(page({ pending: { name: 'kingdown_move', args: {}, game_tag: 'g1', screen: 'board' }, view: view('g2') }))).toBe(false);
    expect(pendingHere(page({ screen: 'play', pending: { name: 'kingdown_move', args: {}, game_tag: 'g1', screen: 'board' }, view: view('g1') }))).toBe(false);
  });

  it('keeps a start on Play only', () => {
    expect(isStart({ name: 'kingdown_create', args: {}, screen: 'play' })).toBe(true);
    expect(isStart({ name: 'kingdown_move', args: {}, screen: 'board' })).toBe(false);
    expect(pendingHere(page({ screen: 'play', pending: { name: 'kingdown_create', args: {}, screen: 'play' } }))).toBe(true);
    expect(pendingHere(page({ screen: 'board', pending: { name: 'kingdown_create', args: {}, screen: 'play' } }))).toBe(false);
  });

  it('keeps a start from Open games on Open games and on Play', () => {
    const pending = { name: 'kingdown_find', args: {}, screen: 'lobby' as const, error: 'Lost the reply' };
    expect(pendingHere(page({ screen: 'lobby', pending }))).toBe(true);
    expect(pendingHere(page({ screen: 'play', pending }))).toBe(true);
    expect(pendingHere(page({ screen: 'wait', pending }))).toBe(false);
  });

  it('shows a game-less command on the screen where it failed', () => {
    const pending = { name: 'kingdown_settings', args: {}, screen: 'settings' as const, error_screen: 'settings' as const };
    expect(pendingHere(page({ screen: 'settings', pending }))).toBe(true);
    expect(pendingHere(page({ screen: 'home', pending }))).toBe(false);
  });
});

describe('the scoped locks', () => {
  it('locks a game that shows a pending command or a stale read, and not another game', () => {
    const command = { name: 'kingdown_move', args: {}, game_tag: 'g1', screen: 'board' as const };
    expect(locks(page({ pending: command, view: view('g1') })).game).toBe(true);
    expect(locks(page({ pending: command, view: view('g2') })).game).toBe(false);
    expect(locks(page({ notice: { kind: 'read', text: 'Nope', game: 'g1' }, view: view('g1') })).game).toBe(true);
    expect(locks(page({ notice: { kind: 'read', text: 'Nope', game: 'g1' }, view: view('g2') })).game).toBe(false);
  });

  it('never lets a game command lock Start', () => {
    const command = { name: 'kingdown_move', args: {}, game_tag: 'g1', screen: 'board' as const };
    expect(locks(page({ pending: command, view: view('g2') })).start).toBe(false);
    expect(locks(page({ screen: 'play', pending: { name: 'kingdown_create', args: {}, screen: 'play' } })).start).toBe(true);
  });

  it('keeps Try again on with a connect notice, and locks the toggles without settings', () => {
    const connect = page({ connected: false, notice: { kind: 'connect', text: 'Nope' } });
    expect(blocked(connect)).toBe(true);
    expect(locks(connect).retry).toBe(true);
    expect(locks(page()).retry).toBe(false);
    expect(locks(page({ settings: false })).toggles).toBe(true);
    expect(locks(page({ settings: true })).toggles).toBe(false);
    expect(blocked(page({ writing: true }))).toBe(true);
    expect(blocked(page({ mounting: true }))).toBe(true);
    expect(blocked(page({ connected: false }))).toBe(true);
    expect(blocked(page())).toBe(false);
  });

  it('keeps the line button off while the page is blocked, and on only for a failed connect', () => {
    // The blocked page: a mount read or a write runs, or the page is offline.
    const read = page({ mounting: true, view: view('g1'), notice: { kind: 'read', text: 'Offline', game: 'g1' } });
    expect(messageLine(read).action).toBe('try-again');
    expect(locks(read).retry).toBe(false);
    const error = page({ writing: true, view: view('g1'), pending: { name: 'kingdown_move', args: {}, game_tag: 'g1', screen: 'board', error: 'Lost the reply' } });
    expect(messageLine(error)).toEqual({ text: 'Lost the reply', action: 'retry', status: false });
    expect(locks(error).retry).toBe(false);
    expect(locks(page({ connected: false, view: view('g1'), notice: { kind: 'read', text: 'Offline', game: 'g1' } })).retry).toBe(false);
    // The page is free: the line's button is on. A failed connect keeps it on to connect again (design §3.3).
    expect(locks(page({ view: view('g1'), notice: { kind: 'read', text: 'Offline', game: 'g1' } })).retry).toBe(true);
    expect(locks(page({ connected: false, notice: { kind: 'connect', text: 'No host' } })).retry).toBe(true);
  });
});

describe('the message line', () => {
  it('shows a pending error for its own screen before a notice', () => {
    const shown = page({ pending: { name: 'kingdown_move', args: {}, game_tag: 'g1', screen: 'board', error: 'Lost the reply' }, view: view('g1'), notice: { kind: 'read', text: 'Not current', game: 'g1' } });
    expect(messageLine(shown)).toEqual({ text: 'Lost the reply', action: 'retry', status: false });
  });

  it('gives each notice its action', () => {
    expect(messageLine(page({ notice: { kind: 'read', text: 'Nope', game: 'g1' }, view: view('g1') }))).toEqual({ text: 'Nope', action: 'try-again', status: true });
    expect(messageLine(page({ notice: { kind: 'refusal', text: 'Nope' } }))).toEqual({ text: 'Nope', action: 'none', status: false });
    expect(messageLine(page({ notice: { kind: 'error', text: 'Nope', screen: 'board' } }))).toEqual({ text: 'Nope', action: 'none', status: false });
    expect(messageLine(page({ connected: false, notice: { kind: 'connect', text: 'Nope' } }))).toEqual({ text: 'Nope', action: 'connect', status: false });
    expect(messageLine(page())).toEqual({ text: '', action: 'none', status: false });
  });

  it('hides a notice that belongs to another screen or game', () => {
    expect(messageLine(page({ notice: { kind: 'error', text: 'Nope', screen: 'play' } })).text).toBe('');
    expect(messageLine(page({ notice: { kind: 'read', text: 'Nope', game: 'g1' }, view: view('g2') })).text).toBe('');
  });
});

describe('the back label', () => {
  it('names the page the back control returns to', () => {
    expect(backLabel(page({ screen: 'handle', handle_back: 'settings' }))).toBe('‹ Settings');
    expect(backLabel(page({ screen: 'collection' }))).toBe('‹ Profile');
    expect(backLabel(page({ screen: 'settings', settings_back: 'board' }))).toBe('‹ Game');
    expect(backLabel(page({ screen: 'play' }))).toBe('‹ Play');
  });
});

it.each([
  ['settings', true, false, false],
  ['settings', true, true, true],
  ['settings', false, false, true],
  ['board', true, false, true],
] as const)('keeps Settings Back free during a save, with mount and connect locks (%s, %s, %s)', (screen, connected, mounting, disabled) => {
  const button = (id: string) => ({ id, disabled: false, hasAttribute: () => false, matches: () => false });
  const back = button('page-back'), other = button('setup-start');
  vi.stubGlobal('document', { querySelectorAll: () => [back, other] });
  try {
    applyLocks(page({ screen, connected, mounting, writing: true }));
    expect(back.disabled).toBe(disabled);
    expect(other.disabled).toBe(true);
  } finally { vi.unstubAllGlobals(); }
});
