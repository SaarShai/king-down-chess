/**
 * The invite landing (`/j#{token}`, people spec P6 and flows F5, F6): a full page with no bar. One state for each
 * answer of the server; each state has one main action. Join signs in first (S1) and takes the ready name (S3) when
 * the player has none, then joins.
 */
import type { Icon } from '../../../account/profile';
import type { JoinPreview } from '../../../match/protocol';
import type { Options } from '../../../match/setup';
import { INVITE_NOTICES } from '../../../match/invite-notices';
import { profilePortrait } from '../host/portrait';
import { copyText } from '../../../clipboard';
import { button, setButtonState } from '../../ui/kit.js';
import { landingText, personText } from './copy';
import { limitCount, serviceLine } from './problems';
import { faultOf, inviteKey, type Fault, type InviteKey } from '../server';
import { node, peopleSheet, picture, say, statusLine } from './sheet';
import { shareWay } from './person';
import { nameSheet, plain, signInSheet, type SignInHost } from './sign-in';
import { playerSafety, type SafetyClient } from './safety';

export type LandingKind = 'valid' | 'plain' | 'own' | 'ended' | 'limit' | 'bad';
export interface Landing { kind: LandingKind; inviter: string | null; icon: Icon | null; avatar?: string | null; facts: string[]; count?: number }

/** The rule words of the game choice. */
export const rulesWords = (options: Options | null) => !options?.kingPowers ? 'Pieces only' : options.cards ? 'With powers and cards' : 'With powers';
const factsOf = (preview: JoinPreview) => [rulesWords(preview.options), landingText.time, landingText.side(preview.colour === 'white')];

/**
 * The state of the page. `me` is the player's game name (null when signed out or with no name).
 * - No preview with no sign-in: today the server shows an invite only after sign-in, so the page is "plain".
 * - `INVITE_UNAVAILABLE` with the text of a closed or past invite (taken, cancelled, replaced, past its time): "ended".
 *   The server gives one answer for these causes; the line of "ended" is true for each of them.
 * - `INVITE_UNAVAILABLE` with the text "not available" (a block, an invite for another player), or a bad key: "bad".
 */
export function landingState(key: InviteKey | undefined, me: string | null, answer: JoinPreview | Fault | undefined, known: JoinPreview | undefined = undefined): Landing {
  const inviter = known?.creator.handle ?? null, icon = known?.creator.icon ?? null, avatar = known?.creator.avatar ?? undefined;
  const withAvatar = (url: string | null | undefined) => (url ? { avatar: url } : {});
  if (!key) return { kind: 'bad', inviter: null, icon: null, facts: [] };
  if (!answer) return { kind: 'plain', inviter: null, icon: null, facts: [] };
  if ('code' in answer && 'creator' in answer) {
    const kind = me !== null && answer.creator.handle === me ? 'own' : 'valid';
    return { kind, inviter: answer.creator.handle, icon: answer.creator.icon, ...withAvatar(answer.creator.avatar), facts: kind === 'valid' ? factsOf(answer) : [] };
  }
  const fault = answer as Fault;
  if (fault.kind === 'auth') return { kind: 'plain', inviter, icon, ...withAvatar(avatar), facts: known ? factsOf(known) : [] };
  if (fault.code === 'FRIEND_GAME_LIMIT') return { kind: 'limit', inviter, icon, ...withAvatar(avatar), facts: [], count: limitCount(fault) };
  if (fault.code === 'INVITE_UNAVAILABLE' && fault.message !== INVITE_NOTICES.unavailable) return { kind: 'ended', inviter, icon, ...withAvatar(avatar), facts: [] };
  return { kind: 'bad', inviter, icon, facts: [] };
}

export interface LandingHost extends SignInHost {
  safety?: Pick<SafetyClient, 'report' | 'block' | 'relate' | 'onAccountChange'> & { changed(): void };
  named?: boolean;
  photo?: boolean;
  /** The signed-in player, or null when signed out. */
  me(): { handle: string | null; icon: Icon | null } | null;
  preview(key: InviteKey): Promise<JoinPreview>;
  /** Join, then open the board. */
  join(key: InviteKey): Promise<void>;
  /** "Invite {inviter} to a new game": an invite by name with the same rules. */
  inviteBack(handle: string, options: Options | null): Promise<void>;
  toPlay(): void;
  toast(text: string): void;
  share?: (data: ShareData) => Promise<void>;
  copy?: (text: string) => Promise<boolean>;
  coarse?: boolean;
  /** The page address, for "Send the link again". */
  href?: string;
}

/** The page. It reads the invite at once. */
export function landingPage(host: LandingHost, fragment: string) {
  const key = inviteKey(fragment);
  const element = node('section', 'people-landing'), status = statusLine();
  element.setAttribute('aria-labelledby', 'people-landing-title');
  let known: JoinPreview | undefined, joining = false;

  const read = async () => {
    say(status);
    if (!key) return render(landingState(key, null, undefined));
    try { known = await host.preview(key); render(landingState(key, host.me()?.handle ?? null, known)); }
    catch (error) {
      const fault = faultOf(error, host.online?.() ?? navigator.onLine), line = serviceLine(fault);
      if (line && fault.kind !== 'auth') { render(landingState(key, null, undefined, known), true); say(status, line); return; }
      render(landingState(key, host.me()?.handle ?? null, fault, known));
    }
  };
  // Join signs in first and takes the ready name, then comes back to Join.
  const signIn = (control: HTMLButtonElement) => { const sheet = peopleSheet(control); signInSheet(sheet, host, { kind: 'join', inviter: known?.creator.handle ?? null }, () => { sheet.close(); void join(control); }); };
  const name = (control: HTMLButtonElement) => { const sheet = peopleSheet(control); nameSheet(sheet, host, () => { sheet.close(); void join(control); }); };
  const join = async (control: HTMLButtonElement): Promise<void> => {
    if (joining || !key) return;
    if (!host.me()) return signIn(control);
    if (!host.me()!.handle) return name(control);
    joining = true; setButtonState(control, { busy: true }); say(status);
    try { await host.join(key); }
    catch (error) {
      const fault = faultOf(error, host.online?.() ?? navigator.onLine), line = serviceLine(fault);
      if (fault.code === 'HANDLE_NEEDED') name(control);
      else if (fault.kind === 'auth') signIn(control);
      else if (line || fault.code === 'RATE_LIMITED') say(status, line ?? personText.tooMany);
      else render(landingState(key, host.me()?.handle ?? null, fault, known));
    } finally { joining = false; if (control.isConnected) setButtonState(control, {}); }
  };
  const sendAgain = async (control: HTMLButtonElement) => {
    const url = host.href ?? location.href;
    setButtonState(control, { busy: true });
    try {
      if (shareWay(host) === 'share') { try { await host.share!({ text: personText.share(host.me()?.handle ?? ''), url }); return; } catch (error) { if ((error as Error)?.name === 'AbortError') return; } }
      if (await (host.copy ?? copyText)(url)) host.toast(personText.linkCopied);
    } finally { setButtonState(control, {}); }
  };
  const inviteBack = async (control: HTMLButtonElement, handle: string) => {
    setButtonState(control, { busy: true }); say(status);
    try { await host.inviteBack(handle, known?.options ?? null); host.toast(landingText.inviteSent(handle)); host.toPlay(); }
    catch (error) { setButtonState(control, {}); const fault = faultOf(error, host.online?.() ?? navigator.onLine); say(status, serviceLine(fault) ?? (fault.code === 'RATE_LIMITED' ? personText.tooMany : fault.code === 'FRIEND_GAME_LIMIT' ? personText.gameLimit(limitCount(fault), handle) : fault.code === 'FRIEND_INVITE_LIMIT' ? personText.inviteLimit(handle) : personText.closed(handle))); }
  };

  function render(state: Landing, retry = false) {
    const restore = element.isConnected;
    const title = node('h2', '', titleOf(state)); title.id = 'people-landing-title'; title.tabIndex = -1;
    const facts = node('p', 'people-facts'); facts.append(...state.facts.map(fact => node('span', 'people-fact', fact)));
    const computer = () => button(landingText.computer, { kind: 'main', onPress: () => host.playComputer() });
    const actions: HTMLElement[] = [];
    switch (state.kind) {
      case 'valid': case 'plain': {
        const main: HTMLButtonElement = button(landingText.join, { kind: 'main', onPress: () => void join(main) });
        actions.push(retry ? button('Try again', { kind: 'main', onPress: () => void read() }) : main, plain(landingText.notNow, () => host.toPlay())); break;
      }
      case 'own': {
        const main: HTMLButtonElement = button(landingText.again, { kind: 'main', onPress: () => void sendAgain(main) });
        actions.push(main, plain(landingText.back, () => host.toPlay())); break;
      }
      case 'ended':
        if (host.named !== false && host.me()?.handle && state.inviter) {
          const handle = state.inviter, main: HTMLButtonElement = button(landingText.inviteBack(handle), { kind: 'main', onPress: () => void inviteBack(main, handle) });
          actions.push(main, plain(landingText.computer, () => host.playComputer()));
        } else actions.push(computer());
        break;
      case 'limit': actions.push(button(landingText.games, { kind: 'main', onPress: () => host.toPlay() })); break;
      case 'bad': actions.push(computer()); break;
    }
    const lineText = lineOf(state);
    if (host.safety && host.me() && state.inviter && state.kind !== 'own' && state.kind !== 'bad') actions.push(...playerSafety(host.safety, { handle: state.inviter }, host.safety.changed));
    element.replaceChildren(node('h1', 'people-brand', landingText.brand), (host.photo ?? host.named === false) ? profilePortrait(state.inviter ?? 'A player', state.avatar ?? null) : picture(state.icon, 'large'), title,
      ...(lineText ? [node('p', '', lineText)] : []), ...(state.facts.length ? [facts] : []), status, ...actions);
    element.dataset.state = state.kind;
    if (restore) title.focus();
  }
  void read();
  return element;
}

function titleOf(state: Landing): string {
  switch (state.kind) {
    case 'valid': return state.inviter ? landingText.title(state.inviter) : landingText.titlePlain;
    case 'plain': return landingText.titlePlain;
    case 'own': return landingText.own;
    case 'ended': return landingText.ended;
    case 'limit': return landingText.limit(state.count ?? 0, state.inviter);
    case 'bad': return landingText.bad;
  }
}
function lineOf(state: Landing): string {
  switch (state.kind) {
    case 'valid': case 'plain': return landingText.line;
    case 'own': return landingText.ownLine;
    case 'ended': return landingText.endedLine(state.inviter);
    case 'limit': return landingText.limitLine;
    case 'bad': return landingText.badLine;
  }
}
