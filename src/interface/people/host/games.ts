import type { InvitationRow, View } from '../../../match/protocol';
import type { Options } from '../../../match/setup';
import { DraftTurn } from '../../play/turn';
import { savedPreview, type SavedPreview } from '../../play/mini-board';
import { replicaOf, positionOf } from '../replica';
import { timeWords } from '../words';
import type { PeopleState } from '../controller';

export interface PersonGame {
  id: string; name: string; avatar: string | null; mine: boolean; deadline: string | null;
  state: 'playing' | 'finished' | 'waiting' | 'setup'; status: string; preview: SavedPreview | null;
  /** Server fields stay available for the home and later views. */
  view: View;
}
export interface HomeInvite {
  id: string; name: string; avatar: string | null; line: string;
  kind: 'incoming' | 'declined' | 'expired';
}
export function personGame(view: View): PersonGame {
  const game = replicaOf(view) ?? positionOf(view), opponent = view.opponent;
  const invited = view.status === 'waiting' && view.invitation?.direction === 'outgoing' ? view.invitation.player : null;
  const name = opponent?.deleted ? 'Deleted player' : opponent?.handle ?? invited?.handle ?? 'A player';
  const avatar = opponent && !opponent.computer && !opponent.deleted ? opponent.avatar ?? null : invited?.avatar ?? null;
  // A missed move stays 'playing' until the server's next command or sweep; it is not your move.
  const late = view.status === 'playing' && view.kind !== 'solo' && !!view.deadline_at && Date.parse(view.deadline_at) <= Date.now();
  // The other player's move time ran out: this player can claim the win, or end the game while abort is open (`boardActions`).
  const claim = late && view.turn !== view.seat;
  const mine = view.status === 'playing' && (view.action === 'ready' && !late || claim);
  const state = view.status === 'aborted' ? 'finished' : view.status;
  const status = view.status === 'aborted' ? 'The game ends with no result.' : state === 'waiting'
    ? invited ? 'Invite sent' : 'Waiting for a player'
    : state === 'setup' ? 'Getting the game ready'
    : state === 'finished' ? view.result?.winner == null ? 'Draw' : view.result.winner === view.seat ? 'You win' : `${name} wins`
    : claim ? `Time is up · you can ${view.abort_open ? 'end the game' : 'claim the win'}`
    : mine ? 'Your move' : late && view.action === 'ready' ? 'Time is up' : `${name} to move`;
  return { id: view.game_id, name, avatar, mine, deadline: view.deadline_at, state, status, preview: game ? savedPreview(new DraftTurn(game), view.seat) : null, view };
}
const rulesWords = (options: Options | null) => options?.kingPowers ? options.cards ? 'With powers and cards' : 'With powers' : options?.cards ? 'With cards' : 'Pieces';
export function homeInvite(invitation: InvitationRow, now = Date.now()): HomeInvite {
  const name = invitation.player?.handle ?? 'A player', avatar = invitation.player?.avatar ?? null;
  if (invitation.direction === 'incoming') {
    const left = timeWords(Date.parse(invitation.expires_at) - now);
    return { id: invitation.invite_id, name, avatar, line: ['Invites you to a game', rulesWords(invitation.options), left].filter(Boolean).join(' · '), kind: 'incoming' };
  }
  return { id: invitation.invite_id, name, avatar, line: invitation.state === 'declined' ? 'Invite declined' : 'Invite expired', kind: invitation.state === 'declined' ? 'declined' : 'expired' };
}
type Ordered = Pick<PersonGame, 'mine' | 'deadline' | 'state'> & { invite?: boolean };
/** Invite rows rank with "Your move" games; they have no deadline, so they come after those games and before all other rows. */
export function gameOrder(a: Ordered, b: Ordered): number {
  const rank = (game: Ordered) => game.mine || game.invite ? 0 : game.state === 'playing' || game.state === 'setup' ? 1 : game.state === 'finished' ? 2 : 3;
  return rank(a) - rank(b) || (a.deadline ? Date.parse(a.deadline) : Infinity) - (b.deadline ? Date.parse(b.deadline) : Infinity) || 0;
}
export function deadlineLine(deadline: string | null, now = Date.now()) {
  // No time left once the move time ran out (the status says "Time is up").
  return deadline && Date.parse(deadline) > now ? timeWords(Date.parse(deadline) - now) : '';
}

/** System copy on a person game keeps the same rules, with the correct opponent words. */
export const personWords = (line: string) => line.replace(/\bComputer\b/g, 'Opponent').replace(/\bcomputer\b/g, 'opponent').replaceAll('End turn', 'Send');

/** A send does not give the opponent a turn until the server confirms it. */
export function personTurn(state: Pick<PeopleState, 'phase' | 'connection'> & Partial<Pick<PeopleState, 'clock'>>): string | undefined {
  if (state.connection === 'auth') return 'Sign in to send your turn.';
  if (state.connection === 'offline') return 'You are offline. Your unsent turn stays.';
  // Your clock ran out (controller `late`): the controls lock until the server ends the game.
  if (state.phase === 'their-move' && state.clock?.mine) return 'Your time to move is up.';
  if (state.phase === 'waiting') return 'Waiting for a player';
  if (state.phase === 'setup') return 'Getting the game ready';
  if (state.phase === 'sending') return 'Sending your turn…';
  if (state.phase === 'checking') return 'Checking your turn…';
  if (state.phase === 'their-move') return 'Your opponent to move.';
}
