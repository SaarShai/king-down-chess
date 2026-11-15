/**
 * The product texts of the people screens (docs/specs/people-screens). Source: the design project's copy tables,
 * `runs/people/people-spec.md` section 4 and `runs/account/account-spec.md` section 3. The ticket lists the few texts
 * that the tables do not have.
 */
import { agoWords } from '../words';

export type Way = 'google' | 'facebook' | 'github' | 'email';
/** The fixed order of the sign-in ways (account spec S1). */
export const WAYS: readonly Way[] = ['google', 'facebook', 'github', 'email'];
const WAY_NAMES: Record<Way, string> = { google: 'Google', facebook: 'Facebook', github: 'GitHub', email: 'email' };

export const signInText = {
  person: 'Sign in to play a person',
  join: (inviter: string | null) => inviter ? `Sign in to join ${inviter}'s game` : "Sign in to join your friend's game",
  again: 'Sign in again',
  line: 'Your game stays with your account. Other players see only your game name.',
  againLine: 'Your sign-in has ended. Your turn stays on this device. Sign in to send it.',
  way: (way: Way) => `Continue with ${WAY_NAMES[way]}`,
  opening: (way: Way) => `Opening ${WAY_NAMES[way]}…`,
  loading: 'Checking sign-in ways…',
  notNow: 'Not now',
  private: 'Other players never see your email.',
  privacy: 'Privacy', terms: 'Terms',
  retry: 'Sign-in did not finish. Try again.',
  expired: 'Sign-in took too long. Try again.',
  suspended: 'This account is suspended. To ask for a review, write to hello@kingdown.dev.',
  // S2: the email code.
  emailTitle: 'Continue with email', emailLine: 'We send you a code. No password.', email: 'Email', sendCode: 'Send code', back: 'Back',
  codeTitle: 'Enter the code', codeLine: (email: string) => `We sent 6 digits to ${email}. The code works for 1 hour.`,
  code: 'Code', continue: 'Continue', newCode: 'Send a new code',
  badAddress: 'Could not send a code to that address. Check it and try again.',
  badCode: 'That code is wrong or has expired. Try again, or ask for a new code.',
  tooMany: 'Too many tries. Wait a minute and try again.',
  noReach: 'Could not reach the sign-in service. Check your connection and try again.',
  serviceFault: 'The sign-in service has a problem. Try again later.',
  // S3: the name.
  nameTitle: 'You play as', nameLine: 'Other players see this name and picture. You can change them in You.',
  checkingName: 'Checking your name…',
  playAs: (name: string) => `Play as ${name}`, change: 'Change name or picture',
  nameFailed: 'Could not save your name. Check your connection and try again.',
} as const;

export const recoveryText = {
  signedIn: 'Signed in. Turn sent.',
  otherTitle: 'This game is for another account',
  otherLine: (name: string) => `You are signed in as ${name}. Sign in with the account that plays this game.`,
  switch: 'Switch account', switchLine: (name: string) => `We sign out ${name} on this device. Then you sign in with the other account.`, cancel: 'Cancel',
  downTitle: 'Sign-in does not work now',
  downLine: 'The sign-in service has a problem. Try again in a few minutes. You can play the computer now.',
  computer: 'Play the computer', tryAgain: 'Try again',
  offline: 'No connection. Your games on this device still work.',
  service: 'The game service does not answer. Your games are safe. Try again in a few minutes.',
  goneTitle: 'This game is not here', goneLine: "The other player's account was deleted, or the game ended.",
  back: 'Back to Play',
} as const;

export const personText = {
  title: 'Play a person', game: 'Game', time: 'Each player has 3 days for each move. Your pieces are random.',
  again: 'Play again', invite: 'Invite', link: 'Send a link', linkSub: 'For WhatsApp, Messages or Mail.', making: 'Making your game…',
  byName: 'Invite by name', byNameMore: 'Invite another player by name',
  field: 'Game name', known: 'Players you know', hint: 'Type 2 letters to find any player.', none: 'No player has this name.',
  linkField: 'Link', copyLink: 'Copy this link and send it to your friend.',
  share: (you: string) => `${you} invites you to a game of King Down.`,
  linkSent: 'Link sent. We tell you when your friend joins.', linkCopied: 'Link copied.',
  inviteSent: (name: string) => `Invite sent to ${name}. ${name} sees it in Play.`,
  openLimit: 'You have 2 open links. Cancel one in Your games first.',
  inviteLimit: (name: string) => `You sent ${name} 2 invites. Wait until ${name} accepts one.`,
  gameLimit: (count: number, name: string) => `You have ${count} games with ${name}. Finish one of them first.`,
  closed: (name: string) => `${name} does not take invites now.`,
  tooMany: 'Too many tries. Wait a minute and try again.',
} as const;
/** "{result}, {when}" of a Play again row, for example "You win, 2 days ago". */
export function againLine(name: string, result: 'won' | 'lost' | 'drawn' | null, ago: number | null): string {
  const words = result === 'won' ? 'You win' : result === 'lost' ? `${name} wins` : result === 'drawn' ? 'Draw' : '';
  const when = ago === null ? '' : `${agoWords(Math.max(0, ago))} ago`;
  return [words, when].filter(Boolean).join(', ');
}

export const landingText = {
  brand: 'King Down',
  title: (inviter: string) => `${inviter} invites you to a game`, titlePlain: 'A friend invites you to a game',
  line: 'Chess with new pieces. Checkmate wins.', time: '3 days for each move', side: (white: boolean) => `You play ${white ? 'White' : 'Black'}`,
  join: 'Join the game', notNow: 'Not now',
  ended: 'This invite has ended', endedLine: (inviter: string | null) => `Invites last 7 days. ${inviter ?? 'Your friend'} can send you a new one.`,
  own: 'This is your invite', ownLine: 'Send this link to a friend. Your friend opens it to join.', again: 'Send the link again', back: 'Back to Play',
  limit: (count: number, inviter: string | null) => `You have ${count} games with ${inviter ?? 'this player'}`, limitLine: 'Finish one of them first.', games: 'Open your games',
  bad: 'This link does not open a game', badLine: 'Part of the link may be missing. Ask your friend to send it again.',
  inviteBack: (inviter: string) => `Invite ${inviter} to a new game`, inviteSent: (inviter: string) => `Invite sent to ${inviter}.`,
  computer: 'Play the computer',
} as const;
