/**
 * The recovery screens of a game against a person (account spec S11 and people spec section 5, in the design
 * project): the game is for another account, the game is gone, the game service does not answer, and the sign-in
 * ended. Each one replaces the game area or opens over it; the unsent turn stays in the controller.
 */
import { button, confirmDialog } from '../../ui/kit.js';
import { recoveryText } from './copy';
import { node, peopleSheet, type PeopleSheet } from './sheet';
import { plain, signInSheet, type SignInHost } from './sign-in';

export interface RecoveryHost {
  toPlay(): void;
  /** Sign out on this device; then the sign-in sheet opens. */
  switchAccount(): void;
  /** Read the game again (the controller's `refresh`). */
  retry(): void;
}
/** The controller's recovery phases and connection (`gone`, `account`, `down`) as a panel. `name` is the player's game name. */
export function recoveryPanel(kind: 'gone' | 'account' | 'down', host: RecoveryHost, name = ''): HTMLElement {
  const element = node('section', 'people-recovery'); element.dataset.state = kind;
  const title = (text: string) => { const heading = node('h2', '', text); heading.tabIndex = -1; return heading; };
  if (kind === 'gone') element.append(title(recoveryText.goneTitle), node('p', '', recoveryText.goneLine), button(recoveryText.back, { kind: 'main', onPress: () => host.toPlay() }));
  else if (kind === 'down') element.append(node('p', '', recoveryText.service), button(recoveryText.tryAgain, { kind: 'main', onPress: () => host.retry() }));
  else {
    // The check names the account that signs out; the screen shows no private part of the game.
    const check = confirmDialog({ title: recoveryText.switch, consequence: recoveryText.switchLine(name), action: recoveryText.switch, cancel: recoveryText.cancel, fallback: element, onConfirm: () => host.switchAccount() });
    const main: HTMLButtonElement = button(recoveryText.switch, { kind: 'main', onPress: () => check.open(main) });
    element.append(title(recoveryText.otherTitle), node('p', '', recoveryText.otherLine(name)), main, plain(recoveryText.back, () => host.toPlay()), check.element);
  }
  return element;
}

/** "Sign in again" (401 at Send): the sign-in sheet over the game. `done` sends the same turn (the controller's `signedIn`). */
export function signInAgain(host: SignInHost, done: () => void, source: HTMLElement | null = null): PeopleSheet {
  const sheet = peopleSheet(source);
  signInSheet(sheet, host, { kind: 'again' }, () => { sheet.close(); done(); });
  return sheet;
}
