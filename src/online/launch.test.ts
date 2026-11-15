import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { Game } from '../game';
import { toFen } from '../rules/setup';
import { DEFAULT_OPTIONS } from '../match/setup';
import { savedGame, type Save } from '../screen/save';
import type { View } from '../match/protocol';
import type { OnlineClient } from './client';
import { installLocalSolo, soloSave } from './launch';
import { createWebTransport } from './runtime';

const platform = vi.hoisted(() => ({ inApp: false }));
vi.mock('../platform', () => platform);
const records = new Map<string, string>();
beforeEach(() => vi.stubGlobal('localStorage', { getItem: (key: string) => records.get(key) ?? null, setItem: (key: string, value: string) => { records.set(key, value); }, removeItem: (key: string) => { records.delete(key); }, get length() { return records.size; }, key: (i: number) => [...records.keys()][i] ?? null }));
afterEach(() => { platform.inApp = false; records.clear(); vi.unstubAllGlobals(); });
function view(seat: 0 | 1 = 0): View {
  const game = new Game('RNBQKBNR'), fen = toFen(game.pos);
  const move = game.legal.find(move => game.context.toLan(game.pos, move) === 'e2-e4')!; game.play(move);
  return { rating_policy: 'casual', revision: 1, created_at: '', abort_open: false, speed: 'daily', days_per_move: null, turn: 1, action: 'waiting', in_check: false, legal: [], last_commands: [], opponent: null, draw_offer: null, deadline_at: null, server_now: '', game_id: 'old-solo', kind: 'solo', seat, status: 'playing', fen: toFen(game.pos), rules: game.rules, history: { initial_fen: fen, actions: game.history.map(h => h.lan) }, level: 'beginner' } as View;
}
it.each([0, 1] as const)('replays the complete account game for seat %s and keeps the computer turn', seat => {
  const old = view(seat), save = soloSave(old), game = savedGame(save);
  expect(toFen(game.pos)).toBe(old.fen); expect(game.history).toHaveLength(1); expect(game.pos.turn).toBe(1);
  expect([save.white, save.black][seat]).toBe('human'); expect(save.skill).toBe('beginner');
  expect(() => soloSave({ ...old, fen: old.history!.initial_fen })).toThrow('game version');
  expect(() => soloSave({ ...old, history: { ...old.history!, actions: ['bad move'] } })).toThrow('game version');
});
it('hands start, resume, a pending computer command and solo rematch to local play without a server write', async () => {
  const old = view(), create = vi.fn(), game = vi.fn(async () => old), command = vi.fn();
  const saves: Save[] = [], online: boolean[] = [];
  const handoff = vi.fn((save: Save, onOpen: () => void, kept: boolean) => { saves.push(save); online.push(kept); onOpen(); });
  const api = { create, game, command } as unknown as OnlineClient;
  installLocalSolo(api, 'player', handoff);
  records.set('kingdown.account-command.player', JSON.stringify({ args: { command_id: 'old' } }));
  records.set('kingdown.account-game.player', JSON.stringify({ pending: { args: { command_id: 'old' } }, screen: 'play' }));
  // A new game has no online game, so its refusal has no text; the others keep the online game.
  const kept = { code: 'NOT_ALLOWED', status: 403, message: 'Your online game stays saved.' };
  await expect(api.create({ kind: 'solo', options: { ...DEFAULT_OPTIONS, arrangement: false }, colour: 'black', level: 'beginner' })).rejects.toMatchObject({ ...kept, message: '' });
  expect(saves[0].black).toBe('human'); expect(savedGame(saves[0]).status).toBe('playing');
  expect(records.has('kingdown.account-command.player')).toBe(false);
  expect(JSON.parse(records.get('kingdown.account-game.player')!)).toEqual({ screen: 'play' });
  await expect(api.game('old-solo')).rejects.toMatchObject(kept);
  await expect(api.command('old-solo', 1, { type: 'computer' })).rejects.toMatchObject(kept);
  await expect(api.command('old-solo', 1, { type: 'rematch', choice: 'offer' })).rejects.toMatchObject(kept);
  expect(saves).toHaveLength(4); expect(saves[3].white).toBe('human'); expect(online).toEqual([false, true, true, true]);
  expect(create).not.toHaveBeenCalled(); expect(command).not.toHaveBeenCalled();
  const friend = { ...old, kind: 'friend' } as View; game.mockResolvedValue(friend);
  await api.create({ kind: 'friend', options: DEFAULT_OPTIONS }); await api.game('friend'); await api.command('friend', 1, { type: 'resign' });
  expect(create).toHaveBeenCalledOnce(); expect(command).toHaveBeenCalledOnce();
});

it('connects the legal Account labels to their real handlers and keeps retry after a fault', async () => {
  const { installAccountControls } = await import('./launch');
  class Element {
    children: Element[] = []; textContent = ''; className = ''; type = ''; disabled = false;
    onclick?: () => Promise<void>; setAttribute() {}
    append(...nodes: Element[]) { this.children.push(...nodes); }
    querySelectorAll(): Element[] { return this.children.filter(node => node.type === 'button'); }
  }
  const target = new Element(), replace = vi.fn(), deleteAccount = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(undefined), disconnectMuse = vi.fn(async () => 2);
  const top = {}; vi.stubGlobal('window', { top, self: top }); vi.stubGlobal('confirm', vi.fn(() => true));
  vi.stubGlobal('location', { replace });
  vi.stubGlobal('document', { createElement: () => new Element(), querySelector: () => target });
  try {
    installAccountControls({ deleteAccount, disconnectMuse }, true);
    const section = target.children[0], controls = section.querySelectorAll(), note = section.children.at(-1)!;
    expect(section.children[0].textContent).toBe('Account'); expect(controls.map(button => button.textContent)).toEqual(['Disconnect Muse', 'Delete my account']);
    await controls[0].onclick!(); expect(disconnectMuse).toHaveBeenCalledOnce(); expect(note.textContent).toContain('Muse is disconnected');
    await controls[1].onclick!(); expect(note.textContent).toContain('Could not finish'); expect(controls.every(button => !button.disabled)).toBe(true); expect(replace).not.toHaveBeenCalled();
    await controls[1].onclick!(); expect(deleteAccount).toHaveBeenCalledTimes(2); expect(replace).toHaveBeenCalledWith('/play/');
    platform.inApp = true; const assign = vi.fn(); vi.stubGlobal('location', { assign });
    await controls[1].onclick!(); expect(assign).toHaveBeenCalledExactlyOnceWith('/next.html#you'); expect(deleteAccount).toHaveBeenCalledTimes(2);
  } finally { vi.unstubAllGlobals(); }
});

it('keeps the king that the player selects before the local start', async () => {
 const king = { king: 'Spirit', power: 'HolyLight' } as const, options = { ...DEFAULT_OPTIONS, kingPowers: true, arrangement: false };
 const settings = vi.fn(async () => ({ settings: { last_setup: { kind: 'solo', colour: 'white', level: 'beginner', options, king } } }));
 const api = { create: vi.fn(), game: vi.fn(), command: vi.fn(), settings } as unknown as OnlineClient;
 const handoff = vi.fn((save: Save) => { expect(save.rules?.kings[0]).toEqual(king); });
 installLocalSolo(api, 'player', handoff); await api.settings();
 await expect(api.create({ kind: 'solo', options, colour: 'white' })).rejects.toMatchObject({ code: 'NOT_ALLOWED' });
 expect(handoff).toHaveBeenCalledOnce();
});

it('keeps a legacy solo rematch initial position and rules when it has no options record', async () => {
 const old = { ...view(1), status: 'finished', options: undefined } as View;
 const api = { create: vi.fn(), game: vi.fn(async () => old), command: vi.fn() } as unknown as OnlineClient;
 const handoff = vi.fn((save: Save) => {
  expect(save.moves).toEqual([]); expect(save.fen).toBe(old.history!.initial_fen);
  expect(save.rules).toEqual(old.rules); expect(save.black).toBe('human');
 });
 installLocalSolo(api, 'player', handoff);
 await expect(api.command(old.game_id, 1, { type: 'rematch', choice: 'offer' })).rejects.toMatchObject({ code: 'NOT_ALLOWED' });
 expect(handoff).toHaveBeenCalledOnce();
});

/** A small dialog DOM: the hand-off appends its dialog to the body and removes it when it closes. */
class Node {
  children: Node[] = []; attrs: Record<string, string> = {}; id = ''; className = ''; textContent = ''; type = ''; open = false;
  parent?: Node; onclick?: () => void; onclose?: () => void;
  constructor(readonly tag: string) {}
  setAttribute(key: string, value: string) { this.attrs[key] = value; }
  append(...nodes: Node[]) { for (const node of nodes) { node.parent = this; this.children.push(node); } }
  remove() { this.parent?.children.splice(this.parent.children.indexOf(this), 1); this.parent = undefined; }
  showModal() { this.open = true; }
  close() { if (this.open) { this.open = false; this.onclose?.(); } }
}
function page() {
  const body = new Node('body'), assign = vi.fn(), session = new Map<string, string>();
  const dialog = () => body.children.find(node => node.tag === 'dialog' && node.className.includes('launch-handoff'));
  vi.stubGlobal('document', { body, createElement: (tag: string) => new Node(tag), querySelector: (selector: string) => selector === 'dialog.launch-handoff' ? dialog() ?? null : null });
  vi.stubGlobal('location', { assign }); vi.stubGlobal('sessionStorage', { setItem: (key: string, value: string) => session.set(key, value) });
  vi.stubGlobal('navigator', { locks: { request: async (_key: string, _options: unknown, run: () => Promise<void>) => run() } });
  const press = (label: string) => dialog()!.children.find(node => node.tag === 'button' && node.textContent === label)!.onclick!();
  const words = () => dialog()!.children.filter(node => node.tag === 'p' && node.textContent).map(node => node.textContent).join(' ');
  const labels = () => dialog()!.children.filter(node => node.tag === 'button').map(node => node.textContent);
  return { dialog, assign, session, press, words, labels };
}
const local = (moves: string[], resigned: 0 | 1 | null = null) => JSON.stringify({ back: '', fen: toFen(new Game('RNBQKBNR').pos), moves, white: 'human', black: 'ai', coords: true, resigned });

it('keeps the hand-off dialog open past the 10 s request limit with no connection error, and Play again opens it again', async () => {
  vi.useFakeTimers();
  try {
    const ui = page(), finished = { ...view(), status: 'finished' } as View;
    const create = vi.fn(), command = vi.fn(), api = { create, game: vi.fn(async () => finished), command } as unknown as OnlineClient;
    installLocalSolo(api, 'player', undefined);
    const { call, pending } = createWebTransport(api, 'player', localStorage);
    const start = call('kingdown_create', { command_id: 'new', kind: 'solo', options: { ...DEFAULT_OPTIONS, arrangement: false }, colour: 'white' }, { timeout: 10_000 });
    await vi.advanceTimersByTimeAsync(11_000);
    // The request is over at once: a refusal with no text, so the page shows no line, and its receipt is gone.
    await expect(start).resolves.toEqual({ isError: true, content: [{ type: 'text', text: '' }], _meta: { code: 'NOT_ALLOWED' } });
    expect(pending()).toBeUndefined();
    expect(ui.dialog()?.open).toBe(true); expect(ui.dialog()!.attrs['aria-labelledby']).toBe('launch-handoff-title');
    expect(ui.words()).toBe('Solo games now play on this device.');
    ui.press('Cancel'); expect(ui.dialog()).toBeUndefined();
    for (const id of ['again-1', 'again-2']) {
      const again = call('kingdown_rematch', { command_id: id, game_id: 'old-solo', expected_revision: 1, choice: 'offer' }, { timeout: 10_000 });
      await vi.advanceTimersByTimeAsync(11_000);
      await expect(again).resolves.toMatchObject({ isError: true, content: [{ text: 'Your online game stays saved.' }] });
      expect(ui.dialog()?.open).toBe(true); expect(ui.words()).toBe('Solo games now play on this device. Your online game stays saved.');
      ui.press('Cancel');
    }
    expect(create).not.toHaveBeenCalled(); expect(command).not.toHaveBeenCalled();
  } finally { vi.useRealTimers(); }
});

it('writes through the owner guard, opens the board that the worker keeps offline, and never replaces a game in progress', async () => {
  const ui = page(), old = view(), api = { create: vi.fn(), game: vi.fn(async () => old), command: vi.fn() } as unknown as OnlineClient;
  installLocalSolo(api, 'player', undefined);
  // A finished local game: the hand-off replaces it, then opens /index.html with the title skipped for this tab.
  records.set('kingdown.save', local(['e2-e4'], 0));
  await expect(api.game('old-solo')).rejects.toMatchObject({ code: 'NOT_ALLOWED' });
  expect(ui.words()).toBe('Solo games now play on this device. This replaces your last game on this device. Your online game stays saved.');
  ui.press('Open local game');
  expect(ui.assign).toHaveBeenCalledExactlyOnceWith('/index.html'); expect(ui.session.get('kingdown.title-seen')).toBe('1');
  const handed = records.get('kingdown.save')!;
  expect(JSON.parse(handed)).toMatchObject({ moves: ['e2-e4'], white: 'human', black: 'ai', gameAt: expect.any(Number) });
  ui.dialog()?.close();
  // The same server game opened again: the local game now plays on, so the dialog continues it and writes nothing.
  await expect(api.game('old-solo')).rejects.toMatchObject({ code: 'NOT_ALLOWED' });
  expect(ui.words()).toBe('A game is in progress on this device. Finish it before you open another game. Your online game stays saved.');
  expect(ui.labels()).toEqual(['Continue local game', 'Cancel']);
  ui.press('Continue local game');
  expect(ui.assign).toHaveBeenLastCalledWith('/index.html'); expect(records.get('kingdown.save')).toBe(handed);
});

it('keeps the local games of another account', async () => {
  const ui = page(), api = { create: vi.fn(), game: vi.fn(), command: vi.fn() } as unknown as OnlineClient;
  const theirs = local(['e2-e4'], 0);
  records.set('kingdown.sync-owner', JSON.stringify({ userId: 'other' })); records.set('kingdown.save', theirs);
  installLocalSolo(api, 'player', undefined);
  await expect(api.create({ kind: 'solo', options: { ...DEFAULT_OPTIONS, arrangement: false }, colour: 'white' })).rejects.toMatchObject({ code: 'NOT_ALLOWED', message: '' });
  expect(ui.words()).toBe('The games on this device belong to another account. To keep them safe, this game cannot open here.');
  expect(ui.labels()).toEqual(['Cancel']);
  ui.press('Cancel'); expect(records.get('kingdown.save')).toBe(theirs); expect(ui.assign).not.toHaveBeenCalled();
});

it('checks the local game again at the tap: a game that another tab starts stays', async () => {
  const ui = page(), api = { create: vi.fn(), game: vi.fn(), command: vi.fn() } as unknown as OnlineClient;
  installLocalSolo(api, 'player', undefined);
  await expect(api.create({ kind: 'solo', options: { ...DEFAULT_OPTIONS, arrangement: false }, colour: 'white' })).rejects.toMatchObject({ code: 'NOT_ALLOWED' });
  expect(ui.labels()).toEqual(['Open local game', 'Cancel']);
  const started = local(['e2-e4']); records.set('kingdown.save', started);
  ui.press('Open local game');
  expect(ui.words()).toContain('A game is in progress on this device.'); expect(records.get('kingdown.save')).toBe(started); expect(ui.assign).not.toHaveBeenCalled();
});
