-- Online games for both surfaces (website and ChatGPT), with the alert, report and outbox tables
-- (report part 03, section 5.1, phase-1 subset). Run after 0005 with a privileged connection.
-- It is safe to run again. The game service (src/match/service.ts) is the only writer of game rows.
-- RLS is on for every table and the browser roles get no grant; a later ticket adds one where needed.
-- The old plugin_matches, plugin_match_commands and plugin_match_invites stay as they are, unused:
-- they hold private test games only, and a later migration drops them.

begin;

create table if not exists public.games (
  id uuid primary key,
  kind text not null check (kind in ('solo', 'friend')),
  speed text not null check (speed in ('daily', 'live')),
  days_per_move smallint check (days_per_move in (1, 3, 7)),
  clock_ms integer check (clock_ms > 0),           -- reserved: live clocks come in phase 2
  increment_ms integer check (increment_ms >= 0),  -- reserved
  clock jsonb,                                     -- reserved
  rated boolean not null default false,
  category text not null,
  readings text,
  colour_rule text not null check (colour_rule in ('white', 'black', 'random')),
  engine_fingerprint text not null,
  setup jsonb not null check (octet_length(setup::text) <= 8192),
  rules jsonb not null check (octet_length(rules::text) <= 65536),
  status text not null check (status in ('waiting', 'playing', 'finished', 'aborted')),
  result text check (result in ('white', 'black', 'draw')),
  end_reason text check (end_reason in ('checkmate', 'stalemate', 'draw50', 'drawRepetition', 'drawMaterial',
    'resignation', 'agreement', 'timeout', 'abort', 'no_start')),
  turn smallint not null check (turn in (0, 1)),
  revision integer not null check (revision between 0 and 1000),
  draw_offer smallint check (draw_offer in (0, 1)),
  state text not null check (octet_length(state) <= 8000000),
  snapshot jsonb not null check (octet_length(snapshot::text) <= 8000000),
  deadline_at timestamptz,
  deadline_kind text check (deadline_kind in ('first_turn', 'move')),
  moves text[],
  tournament_id uuid,                              -- reserved
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  updated_at timestamptz not null default now(),
  check ((status in ('finished', 'aborted')) = (end_reason is not null)),
  check ((deadline_at is null) = (deadline_kind is null))
);
create index if not exists games_deadline on public.games (deadline_at) where status = 'playing';

-- One row for each seat (0 White, 1 Black). A deleted account leaves its seat with no user.
create table if not exists public.game_players (
  game_id uuid not null references public.games (id) on delete cascade,
  seat smallint not null check (seat in (0, 1)),
  user_id uuid references auth.users (id) on delete set null,
  computer boolean not null default false,
  handle_at_start text,
  power text not null default 'none',
  action text not null check (action in ('waiting', 'ready', 'done')),
  turns_played integer not null default 0,
  draw_offers smallint not null default 0,
  said text[] not null default '{}',
  last_seen_at timestamptz,
  last_surface text check (last_surface in ('web', 'chatgpt')),
  active boolean not null default true,
  ended_at timestamptz,
  primary key (game_id, seat),
  unique (game_id, user_id),                       -- no self-play
  check (not (computer and user_id is not null))
);
create index if not exists game_players_active on public.game_players (user_id) where active;
create index if not exists game_players_history on public.game_players (user_id, ended_at desc);

-- The command log: one row for each revision. A row with no command_id is an event (a join, a
-- deadline that ran out). The receipt keys on the seat, so an account deletion does not break it.
create table if not exists public.game_commands (
  game_id uuid not null references public.games (id) on delete cascade,
  seq integer not null check (seq between 1 and 1000),
  seat smallint check (seat in (0, 1)),
  actor_id uuid references auth.users (id) on delete set null,
  command_id text check (char_length(command_id) between 1 and 200),
  kind text not null,
  payload jsonb not null check (octet_length(payload::text) <= 4096),
  actions text[],
  turn_after smallint not null check (turn_after in (0, 1)),
  status_after text not null,
  surface text check (surface in ('web', 'chatgpt')),
  received_at timestamptz not null,
  created_at timestamptz not null default now(),
  primary key (game_id, seq),
  unique (game_id, seat, command_id)
);

-- An invitation binds one seat; the link token and the short code are stored as SHA-256 hashes.
create table if not exists public.game_invites (
  token_hash text primary key,
  code_hash text not null unique,
  game_id uuid not null references public.games (id) on delete cascade,
  seat smallint not null check (seat in (0, 1)),
  created_by uuid references auth.users (id) on delete cascade,
  expires_at timestamptz not null,
  used_by uuid references auth.users (id) on delete set null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists game_invites_game on public.game_invites (game_id);

-- A board that pointed at an old plugin match now shows "This game was deleted" (its recovery path).
alter table public.plugin_boards drop constraint if exists plugin_boards_match_id_fkey;
update public.plugin_boards b set match_id = null
  where match_id is not null and not exists (select from public.games g where g.id = b.match_id);
alter table public.plugin_boards add constraint plugin_boards_match_id_fkey
  foreign key (match_id) references public.games (id) on delete set null;

create table if not exists public.relations (
  user_id uuid not null references auth.users (id) on delete cascade,
  other_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('follow', 'block')),
  created_at timestamptz not null default now(),
  primary key (user_id, other_id, kind),
  check (user_id <> other_id)
);
create index if not exists relations_other on public.relations (other_id, kind);

create table if not exists public.reports (
  id bigserial primary key,
  source text not null default 'player' check (source in ('player', 'automatic')),
  reporter_id uuid references auth.users (id) on delete set null,
  reported_id uuid references auth.users (id) on delete set null,
  game_id uuid references public.games (id) on delete set null,
  target text not null check (target in ('player', 'handle', 'message')),
  category text not null check (category in ('computer_help', 'rating_manipulation', 'leaving_or_stalling',
    'harassment', 'offensive_handle', 'child_safety_or_illegal', 'other')),
  intimate_image boolean not null default false check (not intimate_image or category = 'child_safety_or_illegal'),
  note text check (char_length(note) <= 1000),
  status text not null default 'open' check (status in ('open', 'reviewed', 'closed')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  outcome text,
  nca_reference text,
  hold_until timestamptz
);
create index if not exists reports_queue on public.reports (status, created_at);

create table if not exists public.mod_actions (
  id bigserial primary key,
  user_id uuid references auth.users (id) on delete set null,
  action text not null check (action in ('warning', 'rename', 'hide', 'timeout', 'rated_ban', 'board_removal',
    'suspension', 'closure')),
  statement text not null,
  by text not null,
  created_at timestamptz not null default now(),
  ends_at timestamptz,
  private_mark text,
  report_id bigint references public.reports (id) on delete set null,
  appeal_status text check (appeal_status in ('open', 'upheld', 'reversed')),
  appeal_note text
);
create index if not exists mod_actions_user on public.mod_actions (user_id, created_at);

create table if not exists public.notifications (
  id bigserial primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null,
  payload jsonb not null default '{}' check (octet_length(payload::text) <= 4096),
  created_at timestamptz not null default now(),
  read_at timestamptz,
  expires_at timestamptz
);
create index if not exists notifications_user on public.notifications (user_id, created_at desc);

create table if not exists public.notification_prefs (
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null,
  push boolean not null default false,
  email boolean not null default true,
  primary key (user_id, kind)
);

-- One "your turn" email, then no more until the player returns.
create table if not exists public.alert_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  turn_email_sent_at timestamptz,
  returned_at timestamptz
);

-- Events for after the commit (alerts, achievements). A job drains it with "for update skip locked".
create table if not exists public.outbox (
  id bigserial primary key,
  kind text not null,
  payload jsonb not null check (octet_length(payload::text) <= 8192),
  created_at timestamptz not null default now(),
  available_at timestamptz not null default now(),
  attempts integer not null default 0,
  done_at timestamptz
);
create index if not exists outbox_due on public.outbox (available_at) where done_at is null;

do $$
declare t text;
begin
  foreach t in array array['games', 'game_players', 'game_commands', 'game_invites', 'relations', 'reports',
    'mod_actions', 'notifications', 'notification_prefs', 'alert_state', 'outbox'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from public, anon, authenticated', t);
  end loop;
end $$;
revoke all on sequence public.reports_id_seq, public.mod_actions_id_seq, public.notifications_id_seq,
  public.outbox_id_seq from public, anon, authenticated;

commit;
