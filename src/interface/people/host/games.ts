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
  const mine = view.status === 'playing' && view.action === 'ready';
  const state = view.status === 'aborted' ? 'finished' : view.status;
  const status = view.status === 'aborted' ? 'The game ends with no result.' : state === 'waiting'
    ? invited ? 'Invite sent' : 'Waiting for a player'
    : state === 'setup' ? 'Getting the game ready'
    : state === 'finished' ? view.result?.winner == null ? 'Draw' : view.result.winner === view.seat ? 'You win' : `${name} wins`
    : mine ? 'Your move' : `${name} to move`;
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
export function gameOrder(a: Pick<PersonGame, 'mine' | 'deadline' | 'state'>, b: Pick<PersonGame, 'mine' | 'deadline' | 'state'>): number {
  const rank = (game: typeof a) => game.mine ? 0 : game.state === 'playing' || game.state === 'setup' ? 1 : game.state === 'finished' ? 2 : 3;
  return rank(a) - rank(b) || (a.deadline ? Date.parse(a.deadline) : Infinity) - (b.deadline ? Date.parse(b.deadline) : Infinity) || 0;
}
export function deadlineLine(deadline: string | null, now = Date.now()) {
  return deadline ? timeWords(Date.parse(deadline) - now) : '';
}

/** System copy on a person game keeps the same rules, with the correct opponent words. */
export const personWords = (line: string) => line.replace(/\bComputer\b/g, 'Opponent').replace(/\bcomputer\b/g, 'opponent').replaceAll('End turn', 'Send');

/** A send does not give the opponent a turn until the server confirms it. */
export function personTurn(state: Pick<PeopleState, 'phase' | 'connection'>): string | undefined {
  if (state.connection === 'auth') return 'Sign in to send your turn.';
  if (state.connection === 'offline') return 'You are offline. Your unsent turn stays.';
  if (state.phase === 'waiting') return 'Waiting for a player';
  if (state.phase === 'setup') return 'Getting the game ready';
  if (state.phase === 'sending') return 'Sending your turn…';
  if (state.phase === 'checking') return 'Checking your turn…';
  if (state.phase === 'their-move') return 'Your opponent to move.';
}
