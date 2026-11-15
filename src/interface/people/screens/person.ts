/**
 * The "Play a person" sheet (people spec P2 and flows F1 to F4 in the design project's `runs/people/people-spec.md`):
 * the game choice, "Play again" with the last opponents, "Send a link" (the share list, or a copy on a computer) and
 * "Invite by name". A signed-out player signs in first (S1), and a player with no name takes the ready name (S3).
 */
import { profilePortrait } from '../host/portrait';
import type { GameOptions } from '../../play/new-game';
import type { Icon } from '../../../account/profile';
import { copyText } from '../../../clipboard';
import { button, setButtonState } from '../../ui/kit.js';
import { againLine, personText } from './copy';
import { inviteProblem } from './problems';
import { node, peopleSheet, picture, say, statusLine, type PeopleSheet } from './sheet';
import { nameSheet, plain, signInSheet, type SignInHost } from './sign-in';

/** The game choice of Play (`src/interface/play/main.ts`). */
export type Rules = 'pieces' | 'powers' | 'cards' | 'both';
export interface Player { handle: string; icon: Icon | null; avatar?: string | null }
/** A past opponent. `result` and `at` (ISO time of the last game) are null when the server does not give them. */
export interface Recent extends Player { result: 'won' | 'lost' | 'drawn' | null; at: string | null }
export interface PersonHost extends SignInHost {
  /** Off only when this surface cannot reach named invitations. The fixture keeps its full set. */
  named?: boolean;
  /** Show profile portraits when available instead of piece icons. */
  photo?: boolean;
  /** The signed-in player, or null when signed out. */
  me(): { handle: string | null; icon: Icon | null } | null;
  rules: Rules;
  /** A change here also changes the choice on Play. */
  setRules(rules: Rules): void;
  recent(): Promise<Recent[]>;
  known(): Promise<Player[]>;
  /** Players whose game name starts with the text (2 letters or more). */
  find(text: string): Promise<Player[]>;
  /** Make a friend game with an open link; the answer is the link. */
  createLink(rules: Rules, options?: GameOptions): Promise<string>;
  invite(handle: string, rules: Rules, options?: GameOptions): Promise<void>;
  /** A toast on Play; the sheet closes after it. */
  toast(text: string): void;
  share?: (data: ShareData) => Promise<void>;
  copy?: (text: string) => Promise<boolean>;
  /** A touch device: "Send a link" opens the share list there, and copies the link on a computer. */
  coarse?: boolean;
}
export const PLAY_AGAIN_ROWS = 3, SEARCH_LETTERS = 2, SEARCH_WAIT_MS = 250;

/** How "Send a link" gives the link: the share list on a touch device that has one, else a copy. */
export function shareWay(host: Pick<PersonHost, 'share' | 'coarse'>): 'share' | 'copy' {
  return host.share && host.coarse ? 'share' : 'copy';
}

/** Open the sheet from the "Play a person" row. */
export function playPerson(host: PersonHost, source: HTMLElement | null = null): PeopleSheet {
  const sheet = peopleSheet(source);
  const task = () => personSheet(sheet, host);
  const named = () => host.me()?.handle ? task() : nameSheet(sheet, host, task);
  if (host.me()) named(); else signInSheet(sheet, host, { kind: 'person' }, named);
  return sheet;
}

function playerRow(player: Player, line: string, onInvite: (control: HTMLButtonElement) => void, named = true, photo = named === false) {
  const row = node('div', 'people-row'), copy = node('span', 'people-row-copy');
  copy.append(node('strong', '', player.handle)); if (line) copy.append(node('span', 'people-muted', line));
  const invite: HTMLButtonElement = button(named ? personText.invite : personText.link, { onPress: () => onInvite(invite) });
  invite.setAttribute('aria-label', `${named ? personText.invite : personText.link} ${player.handle}`);
  row.append(photo ? profilePortrait(player.handle, player.avatar ?? null) : picture(player.icon), copy, invite);
  return row;
}

/** "Invite" on a row: one invite at a time; the sheet closes with the toast. */
function inviter(sheet: PeopleSheet, host: PersonHost, status: HTMLElement, rules: () => Rules) {
  let busy = false;
  return async (handle: string, control: HTMLButtonElement) => {
    if (busy) return;
    busy = true; setButtonState(control, { busy: true }); say(status);
    try { await host.invite(handle, rules()); host.toast(host.named === false ? personText.linkCopied : personText.inviteSent(handle)); sheet.close(); }
    catch (error) { say(status, inviteProblem(error, handle, host.online?.() ?? navigator.onLine)); }
    finally { busy = false; setButtonState(control, {}); }
  };
}

/** P2, the main view. */
export function personSheet(sheet: PeopleSheet, host: PersonHost, start: Rules = host.rules) {
  const status = statusLine(), now = host.now ?? Date.now;
  const chosen = start; let sending = false;
  const again = node('section', 'people-again'); again.hidden = true;
  const main: HTMLButtonElement = button(personText.link, { kind: 'main', onPress: () => void send() });
  const search = () => nameSearch(sheet, host, chosen, () => personSheet(sheet, host, chosen));
  let byName: HTMLButtonElement = button(personText.byName, { onPress: search });

  const invite = inviter(sheet, host, status, () => chosen);
  async function send() {
    if (sending) return;
    sending = true;
    try { await sendPersonLink(sheet, host, chosen, () => personSheet(sheet, host, chosen)); }
    finally { sending = false; }
  }

  // The main action and its status line stay in view on a short screen (people.css, `.people-main`).
  const action = node('div', 'people-main');
  action.append(status, main, node('p', 'people-small people-center', personText.linkSub));
  let timer: ReturnType<typeof setTimeout>;
  // Open with the rows in place. A slow optional list does not block the sheet for more than 1.5 seconds.
  void Promise.race([host.recent().catch(() => []), new Promise<Recent[]>(resolve => { timer = setTimeout(() => resolve([]), 1500); })]).then(list => {
    const rows = list.slice(0, PLAY_AGAIN_ROWS);
    if (rows.length) {
      again.append(node('h3', '', personText.again), ...rows.map(player => playerRow(player, againLine(player.handle, player.result, player.at ? now() - Date.parse(player.at) : null), control => void invite(player.handle, control), host.named, host.photo ?? host.named === false)));
      again.hidden = false;
      byName = plain(personText.byNameMore, search);
    }
    sheet.show({ title: personText.title, body: [node('p', 'people-muted', personText.time), again, action, ...(host.named === false ? [] : [byName])] });
  }).finally(() => clearTimeout(timer));
}

/** The shared panel sends one link. A retry reuses it after a closed share list or a failed copy. */
export async function sendPersonLink(sheet: PeopleSheet, host: PersonHost, rules: Rules, back: () => void) {
  const status = statusLine(), linkField = node('label', 'people-field'), linkInput = node('input');
  linkInput.readOnly = true; linkField.hidden = true; linkField.append(node('span', '', personText.linkField), linkInput);
  let link: string | undefined, busy = false;
  const main = button(personText.link, { kind: 'main', onPress: () => void send() });
  sheet.show({ title: personText.link, body: [status, main, linkField], back });
  async function send() {
    if (busy || !sheet.isOpen) return;
    busy = true; setButtonState(main, { busy: true, label: personText.making }); say(status);
    try {
      link ??= await host.createLink(rules);
      if (!sheet.isOpen) return;
      if (shareWay(host) === 'share') {
        try { await host.share!({ text: personText.share(host.me()?.handle ?? ''), url: link }); host.toast(personText.linkSent); sheet.close(); return; }
        catch (error) { if ((error as Error)?.name === 'AbortError') return; }
      }
      if (await (host.copy ?? copyText)(link)) { host.toast(personText.linkCopied); sheet.close(); return; }
      linkInput.value = link; linkField.hidden = false; say(status, personText.copyLink); linkInput.focus(); linkInput.select(); linkInput.scrollIntoView({ block: 'center' });
    } catch (error) { if (sheet.isOpen) say(status, inviteProblem(error, null, host.online?.() ?? navigator.onLine)); }
    finally { busy = false; setButtonState(main, { label: personText.link }); }
  }
  await send();
}

/** P2, "Invite by name": the field, "Players you know", and the search from 2 letters. */
export function nameSearch(sheet: PeopleSheet, host: PersonHost, rules: Rules, back: () => void) {
  const status = statusLine(), input = node('input'), list = node('div', 'people-list'), heading = node('h3', '', personText.known);
  input.type = 'text'; input.name = 'handle'; input.autocomplete = 'off'; input.autocapitalize = 'none'; input.spellcheck = false; input.maxLength = 20;
  input.setAttribute('enterkeyhint', 'search');
  const field = node('label', 'people-field'); field.append(node('span', '', personText.field), input);
  let known: Player[] = [], asked = 0, timer: ReturnType<typeof setTimeout> | undefined;
  const invite = inviter(sheet, host, status, () => rules);
  const rows = (players: Player[]) => list.replaceChildren(...players.map(player => playerRow(player, '', control => void invite(player.handle, control), host.named, host.photo ?? host.named === false)));
  input.addEventListener('input', () => {
    clearTimeout(timer); say(status);
    const text = input.value.trim().toLowerCase(), mark = ++asked;
    if (text.length < SEARCH_LETTERS) { heading.hidden = !known.length; rows(known); return; }
    timer = setTimeout(() => {
      host.find(text).then(found => {
        if (mark !== asked) return;
        heading.hidden = true; rows(found);
        if (!found.length) say(status, personText.none);
      }, error => { if (mark === asked) { heading.hidden = true; rows([]); say(status, inviteProblem(error, null, host.online?.() ?? navigator.onLine)); } });
    }, SEARCH_WAIT_MS);
  });
  heading.hidden = true;
  sheet.show({ title: personText.byName, body: [field, heading, list, node('p', 'people-small', personText.hint), status], back });
  input.focus();
  host.known().then(players => { known = players; if (input.value.trim().length < SEARCH_LETTERS) { heading.hidden = !known.length; rows(known); } }, () => {});
}
