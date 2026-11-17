/** The launch build alone adds local solo and account controls to the old web entry. */
import { Game } from '../game';
import { readSave, savedGame, writeSave, type Save } from '../screen/save';
import { inApp } from '../platform';
import { localAccess } from '../account/local';
import { toFen } from '../rules/setup';
import { DEFAULT_RULES, POWERS_BALANCED, RULES_2017, RULES_2021, parseKings, type KingChoice } from '../rules/rules';
import { buildSetup, defaultChoice, draw } from '../match/setup';
import type { PlayerSettings } from '../plugin/settings';
import type { CreateOptions, View } from '../match/protocol';
import type { Client } from '../account/client';
import type { AccountSession } from '../account/session';
import { OnlineError, type OnlineClient } from './client';
import { readWebAccountAccess } from './account-access';
import './launch.css';

function fresh(input: CreateOptions, previous?: View, king?: KingChoice | null): Save {
  const options = input.options;
  const seat = previous?.seat ?? (input.colour === 'black' || input.colour === 'random' && Math.random() < 0.5 ? 1 : 0);
  const deal = previous?.draw ? { army: previous.draw, hand: [...previous.deal ?? []] } : options ? draw(options, Math.random) : undefined;
  const choices = options && deal ? [0, 1].map(seat => previous?.choices?.[seat] ?? defaultChoice(options, deal, seat as 0 | 1, Math.random, true)) : undefined;
  if (choices && options?.kingPowers && king) choices[seat] = { ...choices[seat], king };
  const setup: import('../match/index').MatchSetup = options && deal && choices ? buildSetup(options, deal, [choices[0], choices[1]]) : input.setup ?? {};
  const kings = parseKings(setup.kings ?? 'none,none');
  const rules = { ...DEFAULT_RULES, ...(kings.some(Boolean) ? POWERS_BALANCED : {}), ...(setup.preset === '2017' ? RULES_2017 : setup.preset === '2021' ? RULES_2021 : {}), kings,
    ...(setup.classic && { classicChess: true }), hands: [setup.hand ?? [], setup.hand ?? []] as const };
  const game = new Game(setup.backRank, rules);
  if (setup.fen) game.load(game.context.fromFen(setup.fen));
  return { back: '', fen: toFen(game.pos), moves: [], white: seat === 0 ? 'human' : 'ai', black: seat === 1 ? 'human' : 'ai', coords: true, resigned: null, skill: input.level ?? 'casual', rules: game.rules };
}
export function soloSave(view: View): Save {
  if (view.kind !== 'solo') throw new Error('This game needs the online page.');
  if (view.status === 'setup' && view.options) return fresh({ kind: 'solo', options: view.options, level: view.level }, view);
  if (!view.history || !view.rules || view.status !== 'playing') throw new Error('This game cannot open on this device.');
  const save: Save = { back: '', fen: view.history.initial_fen, moves: [...view.history.actions], white: view.seat === 0 ? 'human' : 'ai', black: view.seat === 1 ? 'human' : 'ai', coords: true, resigned: null, skill: view.level, rules: { ...DEFAULT_RULES, ...view.rules } };
  const game = savedGame(save);
  if (game.history.length !== save.moves.length || toFen(game.pos) !== view.fen) throw new Error('This game version cannot open on this device. Your online game stays saved.');
  return save;
}
const KEPT = 'Your online game stays saved.';
const OTHER = 'The games on this device belong to another account. To keep them safe, this game cannot open here.';
const BUSY = 'A game is in progress on this device. Finish it before you open another game.';
/** The one local save slot. Replace only an empty or finished game, of this account or of no account. */
function localSlot(userId: string): 'none' | 'done' | 'busy' | 'other' {
  const read = readSave(), owner = localAccess(localStorage).userId;
  if (owner !== null && owner !== userId || read.unreadable && read.raw === undefined) return 'other';
  if (read.unreadable || read.partial) return 'busy';
  if (!read.save) return 'none';
  try { return read.save.moves.length && read.save.resigned == null && savedGame(read.save).status === 'playing' ? 'busy' : 'done'; }
  catch { return 'busy'; }
}
/** The worker serves /index.html offline only with no query. The tab mark skips the title, as ?title=0 does. */
function openBoard(): void {
  let url = '/index.html';
  try { sessionStorage.setItem('kingdown.title-seen', '1'); } catch { url += '?title=0'; }
  location.assign(url);
}
/**
 * The dialog is not part of the request: a request has a 10 s limit, and the player can take more time to choose.
 * A second hand-off while the dialog is open shows nothing new.
 */
function openLocal(save: Save, onOpen: () => void, online: boolean, userId: string): void {
  if (document.querySelector('dialog.launch-handoff')) return;
  const slot = localSlot(userId);
  const dialog = document.createElement('dialog'); dialog.className = 'launch-account-dialog launch-handoff';
  dialog.setAttribute('aria-labelledby', 'launch-handoff-title'); dialog.setAttribute('aria-describedby', 'launch-handoff-line');
  const title = document.createElement('h2'); title.id = 'launch-handoff-title'; title.textContent = 'Play on this device';
  const line = document.createElement('p'); line.id = 'launch-handoff-line';
  line.textContent = [slot === 'other' ? OTHER : slot === 'busy' ? BUSY : 'Solo games now play on this device.',
    ...slot === 'done' ? ['This replaces your last game on this device.'] : [], ...online ? [KEPT] : []].join(' ');
  const error = document.createElement('p'); error.setAttribute('role', 'alert');
  const go = document.createElement('button'); go.type = 'button'; go.textContent = slot === 'busy' ? 'Continue local game' : 'Open local game';
  go.onclick = () => {
    if (slot === 'busy') { openBoard(); return; }
    // Another tab can change the local data while the dialog is open.
    const now = localSlot(userId);
    if (now === 'other' || now === 'busy') { error.textContent = now === 'other' ? OTHER : BUSY; return; }
    if (!writeSave({ ...save, gameAt: Date.now() })) { error.textContent = 'Could not save this game. Free space on this device, then try again.'; return; }
    // The old local board supports all account solo rules and either side.
    onOpen(); openBoard();
  };
  const cancel = document.createElement('button'); cancel.type = 'button'; cancel.textContent = 'Cancel'; cancel.onclick = () => dialog.close();
  dialog.onclose = () => dialog.remove();
  dialog.append(title, line, error, ...slot === 'other' ? [] : [go], cancel); document.body.append(dialog); dialog.showModal();
}
/** Reads stay authoritative. Solo writes never reach the web API after cutover. */
export function installLocalSolo(api: OnlineClient, userId: string, handoff = openLocal): void {
  /** The request ends at once with a refusal; the open dialog does the hand-off. A new game has no online game to keep. */
  const toLocal = (save: Save, online = true): never => {
    const key = `kingdown.account-command.${userId}`, receipt = localStorage.getItem(key);
    handoff(save, () => {
      if (!receipt || localStorage.getItem(key) !== receipt) return;
      const pageKey = `kingdown.account-game.${userId}`;
      try {
        const page = JSON.parse(localStorage.getItem(pageKey) ?? 'null');
        if (page?.pending?.args?.command_id === JSON.parse(receipt).args.command_id) {
          delete page.pending; localStorage.setItem(pageKey, JSON.stringify(page));
        }
      } catch { /* An unreadable page record does not keep a completed local handoff pending. */ }
      localStorage.removeItem(key);
    }, online, userId);
    throw new OnlineError('NOT_ALLOWED', 403, online ? KEPT : '');
  };
  const { create, game, command, settings } = api;
  let lastSetup: PlayerSettings['last_setup'] = null;
  api.settings = async (...args) => { const value = await settings(...args); lastSetup = value.settings.last_setup; return value; };
  api.create = async (input, ...rest) => input.kind === 'solo' ? toLocal(fresh(input, undefined, lastSetup?.king), false) : create(input, ...rest);
  api.game = async (id, since, signal) => {
    const view = await game(id, since, signal);
    if (view.kind !== 'solo' || !['playing', 'setup'].includes(view.status)) return view;
    return toLocal(soloSave(since === undefined ? view : await game(id, undefined, signal)));
  };
  api.command = async (id, revision, action, ...rest) => {
    const view = await game(id, undefined, rest[1]);
    if (view.kind === 'solo') {
      const save = action.type === 'rematch'
        ? view.options ? fresh({ kind: 'solo', options: view.options, level: view.level, colour: view.seat === 0 ? 'white' : 'black' })
          : { ...soloSave({ ...view, status: 'playing' }), moves: [] }
        : soloSave(view);
      return toLocal(save);
    }
    return command(id, revision, action, ...rest);
  };
}

/** `expected` is the page's account (online entry): each action binds to it, so a sign-in from another tab is never changed. */
export async function installAccountControls(auth: Pick<Client, 'deleteAccount' | 'disconnectMuse'>, expected?: AccountSession, muse?: boolean): Promise<void> {
  if (muse === undefined) muse = (await readWebAccountAccess()).muse === true;
  const section = document.createElement('section'); section.className = 'fields launch-account';
  const title = document.createElement('h3'); title.className = 'group-head'; title.textContent = 'Account';
  const note = document.createElement('p'); note.setAttribute('role', 'status');
  section.append(title);
  function control(label: string, question: string, action: () => Promise<string>) {
    const button = document.createElement('button'); button.className = 'menu-row'; button.type = 'button'; button.textContent = label;
    button.onclick = async () => {
      if (window.top !== window.self) return;
      if (inApp && label === 'Delete my account') { location.assign('/next.html#you'); return; }
      if (!confirm(question)) return;
      section.querySelectorAll('button').forEach(button => { button.disabled = true; });
      try { note.textContent = await action(); }
      catch { note.textContent = 'Could not finish. Check your connection and try again.'; }
      finally { section.querySelectorAll('button').forEach(button => { button.disabled = false; }); }
    };
    section.append(button);
  }
  if (muse) control('Disconnect Muse', 'Disconnect Muse? Muse can no longer use your account, and we delete the games you started in Muse.', async () => {
    const deleted = await auth.disconnectMuse(expected);
    return deleted === null ? 'Could not disconnect Muse. Try again later.' : 'Muse is disconnected. We deleted the games you started in Muse.';
  });
  control('Delete my account', 'Delete your account in seven days? To keep it, sign in again before then.', async () => {
    await auth.deleteAccount(expected); location.replace('/play/'); return 'We delete your account in seven days.';
  });
  section.append(note); document.querySelector('#settings-sheet .new-game-body')!.append(section);
}
