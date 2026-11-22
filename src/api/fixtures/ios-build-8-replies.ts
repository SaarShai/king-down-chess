// The /api reply fields of iOS build 1.0 (8), commit f346e832e (ios/release-log.md): the reply types of
// f346e832e:src/online/client.ts and of the types that it names in src/match/protocol.ts, src/account/profile.ts and
// src/api/http.ts. Keep the lists unchanged while build 8 is in use.
// shortcut: top-level fields and the list items only, not `rules`, `options` or the deeper fields; add a level when a reply
// changes shape there.
export type Create = 'view' | 'invite';
export type Settings = 'settings' | 'me';
export type Handle = 'me' | 'available';
export type Record = 'handle' | 'icon' | 'record' | 'blocks' | 'history' | 'next_before' | 'next_blocks_after' | 'notices' | 'next_notices_before';
export type Lobby = 'games' | 'active_count' | 'server_now';
export type Block = 'blocked' | 'view';
export type Ack = 'type' | 'command_id' | 'revision' | 'view';
export type Invitations = 'games' | 'invitations' | 'next_before';
export type Friends = 'friends' | 'next_after';
export type JoinPreview = 'code' | 'options' | 'colour' | 'kind' | 'creator' | 'expires_at' | 'recipient_id' | 'recipient_handle' | 'invite_id';
export type DraftPreview = 'game_id' | 'revision' | 'engine_fingerprint' | 'actions' | 'positions';
export type Report = 'id' | 'created_at';
export type View = 'invite' | 'invitation' | 'game_id' | 'rating_policy' | 'revision' | 'engine_fingerprint' | 'created_at' | 'abort_open'
  | 'outcome' | 'seat' | 'kind' | 'speed' | 'days_per_move' | 'status' | 'turn' | 'action' | 'fen' | 'in_check' | 'legal'
  | 'last_commands' | 'history' | 'opponent' | 'draw_offer' | 'rematch_allowed' | 'rematch_offer' | 'rematch_game_id' | 'options'
  | 'draw' | 'deal' | 'level' | 'choices' | 'setup_admission' | 'ready' | 'setup_deadline_at' | 'kings' | 'hands' | 'result'
  | 'deadline_at' | 'server_now' | 'invite_id' | 'rules';
export type Opponent = 'handle' | 'icon' | 'avatar' | 'rating' | 'computer' | 'deleted' | 'last_seen_ms';
export type InboxEntry = 'invite_id' | 'rating_policy' | 'options' | 'move' | 'created_at' | 'open_until' | 'level' | 'game_id' | 'kind'
  | 'speed' | 'status' | 'seat' | 'action' | 'turn' | 'revision' | 'deadline_at' | 'opponent' | 'updated_at';
export type InvitationRow = 'revision' | 'invite_id' | 'game_id' | 'direction' | 'recipient_id' | 'player' | 'options' | 'expires_at' | 'state';
export type LobbyEntry = 'rating_policy' | 'game_id' | 'options' | 'colour' | 'creator' | 'created_at';
export type HistoryEntry = 'rating_policy' | 'game_id' | 'finished_at' | 'kind' | 'colour' | 'result' | 'reason' | 'opponent' | 'features';
export type Friend = 'user_id' | 'handle' | 'icon' | 'source';
export type InviteLink = 'token' | 'code' | 'expires_at' | 'invite_id' | 'recipient_id' | 'url';
export type Profile = 'user_id' | 'handle' | 'can_rename_at' | 'deletion' | 'icon' | 'challenge_from' | 'online_visible_to' | 'quiet_mode'
  | 'accepting_games' | 'on_leaderboards';
