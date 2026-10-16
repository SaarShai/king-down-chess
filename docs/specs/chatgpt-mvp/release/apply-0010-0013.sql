-- Paste this whole file in the Supabase SQL Editor as the admin role.
-- One transaction keeps each migration and its grants together.
begin;

-- The foundation and runtime grants must exist before any release change.
do $preflight$
declare
  runtime oid;
  item record;
  name text;
  privilege text;
  column_name text;
  required constant text := 'Release prerequisites: apply migrations 0005–0009 and runtime-role blocks 3–6 before this file';
begin
  select oid into runtime from pg_roles where rolname = 'kingdown_plugin_runtime'
    and rolcanlogin and not rolinherit and not rolsuper and not rolcreatedb
    and not rolcreaterole and not rolreplication and not rolbypassrls;
  if runtime is null then raise exception '%: restricted runtime role is absent', required; end if;

  for name in select unnest(array['profiles','reserved_handles','account_deletions','games','game_players',
    'game_commands','game_invites','relations','reports','mod_actions','notifications','notification_prefs',
    'alert_state','outbox','invite_code_tries','plugin_boards']) loop
    if not exists(select from pg_class where oid = to_regclass('public.' || name) and relrowsecurity) then
      raise exception '%: table or RLS is absent on public.%', required, name;
    end if;
  end loop;
  for item in select * from (values
    ('profiles','handle,handle_changed_at,icon,on_leaderboards,public_page,challenge_from,online_visible_to,quiet_mode,accepting_games'),
    ('account_deletions','user_id,requested_at,run_after,cancelled_at,done_at'),
    ('reports','id,created_at,reporter_id,reported_id,game_id,target,category,intimate_image,note,content,hold_until'),
    ('mod_actions','handle'), ('invite_code_tries','user_id,window_start,tries')
  ) as fields(table_name, names) loop
    foreach column_name in array string_to_array(item.names, ',') loop
      if not exists(select from pg_attribute where attrelid = to_regclass('public.' || item.table_name)
        and attname = column_name and not attisdropped) then
        raise exception '%: column public.%.% is absent', required, item.table_name, column_name;
      end if;
    end loop;
  end loop;
  for name in select unnest(array['profiles_handle_key','account_deletions_due','games_deadline',
    'game_players_active','game_players_history','game_invites_game','relations_other','reports_held',
    'mod_actions_user','notifications_user','outbox_due']) loop
    if to_regclass('public.' || name) is null then raise exception '%: index % is absent', required, name; end if;
  end loop;
  for name in select unnest(array['kingdown_jobs.user_email(uuid)','kingdown_jobs.delete_account(uuid)',
    'kingdown_jobs.request_deletion(uuid)','public.delete_my_account()',
    'public.reserve_handle()','public.cancel_deletion_on_sign_in()']) loop
    if to_regprocedure(name) is null then raise exception '%: function % is absent', required, name; end if;
  end loop;
  if not exists(select from pg_trigger where tgrelid = to_regclass('auth.sessions')
    and tgname = 'on_auth_session_created' and tgtype = 5 and tgenabled in ('O','A')
    and tgfoid = to_regprocedure('public.cancel_deletion_on_sign_in()'))
    or not exists(select from pg_trigger where tgrelid = 'public.profiles'::regclass
    and tgname = 'profiles_reserve_handle' and tgenabled in ('O','A')
    and tgfoid = to_regprocedure('public.reserve_handle()')) then
    raise exception '%: account safety trigger is absent or disabled', required;
  end if;
  if not exists(select from pg_constraint where conrelid = 'public.plugin_boards'::regclass
    and conname = 'plugin_boards_match_id_fkey' and confrelid = 'public.games'::regclass and confdeltype = 'n') then
    raise exception '%: board recovery foreign key is absent', required;
  end if;

  for name in select unnest(array['public','kingdown_jobs','kingdown_oauth']) loop
    if not has_schema_privilege(runtime, name, 'usage') then raise exception '%: runtime schema grant % is absent', required, name; end if;
  end loop;
  for item in select * from (values
    ('plugin_boards','select',null), ('plugin_boards','insert','id,actor_id,match_id'), ('plugin_boards','update','match_id'),
    ('games','select,insert',null), ('game_players','select,insert',null), ('game_commands','select,insert',null),
    ('games','update','status,result,end_reason,turn,revision,draw_offer,state,snapshot,deadline_at,deadline_kind,moves,started_at,finished_at,updated_at'),
    ('game_players','update','user_id,handle_at_start,action,turns_played,draw_offers,said,last_seen_at,last_surface,active,ended_at'),
    ('game_invites','select,insert,delete',null), ('game_invites','update','used_by,used_at'),
    ('notifications','insert',null), ('notifications','select','user_id,kind,payload'),
    ('outbox','select,insert,delete',null), ('outbox','update','attempts,available_at,done_at'),
    ('relations','select,insert,delete',null),
    ('profiles','select','id,handle,handle_changed_at,icon,challenge_from,online_visible_to,quiet_mode,accepting_games,on_leaderboards'),
    ('profiles','update','handle,handle_changed_at,icon,challenge_from,online_visible_to,quiet_mode,accepting_games,on_leaderboards'),
    ('notification_prefs','select,insert',null), ('notification_prefs','update','email,push'),
    ('alert_state','select',null), ('alert_state','insert','user_id'), ('alert_state','update','turn_email_sent_at'),
    ('account_deletions','select',null), ('account_deletions','update','cancelled_at'),
    ('reports','select','id,created_at,reported_id,reporter_id,hold_until'),
    ('reports','insert','reporter_id,reported_id,game_id,target,category,intimate_image,note,content'),
    ('invite_code_tries','select',null), ('invite_code_tries','insert','user_id'), ('invite_code_tries','update','window_start,tries')
  ) as grants(table_name, privileges, names) loop
    foreach privilege in array string_to_array(item.privileges, ',') loop
      if item.names is null then
        if not has_table_privilege(runtime, 'public.' || item.table_name, privilege) then
          raise exception '%: runtime % grant on public.% is absent', required, privilege, item.table_name;
        end if;
      else
        foreach column_name in array string_to_array(item.names, ',') loop
          if not has_column_privilege(runtime, 'public.' || item.table_name, column_name, privilege) then
            raise exception '%: runtime % grant on public.%.% is absent', required, privilege, item.table_name, column_name;
          end if;
        end loop;
      end if;
    end loop;
  end loop;
  for name in select unnest(array['notifications_id_seq','outbox_id_seq','reports_id_seq']) loop
    if not has_sequence_privilege(runtime, 'public.' || name, 'usage') then raise exception '%: runtime sequence grant % is absent', required, name; end if;
  end loop;
  for name in select unnest(array['kingdown_jobs.user_email(uuid)','kingdown_jobs.delete_account(uuid)','kingdown_jobs.request_deletion(uuid)']) loop
    if not has_function_privilege(runtime, name, 'execute') then raise exception '%: runtime function grant % is absent', required, name; end if;
  end loop;
  for name in select unnest(array['plugin_boards','games','game_players','game_commands','game_invites','notifications',
    'outbox','relations','profiles','notification_prefs','alert_state','account_deletions','reports','invite_code_tries']) loop
    if not exists(select from pg_policy where polrelid = to_regclass('public.' || name)
      and polname = 'kingdown_plugin_runtime' and runtime = any(polroles) and polcmd = '*'
      and pg_get_expr(polqual,polrelid) = 'true' and pg_get_expr(polwithcheck,polrelid) = 'true') then
      raise exception '%: runtime policy on public.% is absent', required, name;
    end if;
  end loop;
exception when undefined_table or undefined_column or undefined_function or invalid_schema_name or undefined_object or insufficient_privilege then
  raise exception '%: %', required, sqlerrm;
end $preflight$;

-- SOURCE: supabase/migrations/0010_game_setup.sql
-- Seat setup for plugin games. A saved game with no options keeps its fixed setup.
alter table public.games drop constraint if exists games_kind_check;
alter table public.games add constraint games_kind_check check (kind in ('solo', 'friend', 'random'));
alter table public.games drop constraint if exists games_status_check;
alter table public.games add constraint games_status_check check (status in ('waiting', 'setup', 'playing', 'finished', 'aborted'));
-- Play ends by revision 1000. The final 100 revisions are for rematch offers.
alter table public.games drop constraint if exists games_revision_check;
alter table public.games add constraint games_revision_check check (revision between 0 and 1100);
alter table public.game_commands drop constraint if exists game_commands_seq_check;
alter table public.game_commands add constraint game_commands_seq_check check (seq between 1 and 1100);
alter table public.games
  alter column state drop not null,
  alter column snapshot drop not null,
  alter column rules drop not null,
  alter column engine_fingerprint drop not null,
  add column if not exists options jsonb check (octet_length(options::text) <= 8192),
  add column if not exists draw text check (char_length(draw) = 8),
  add column if not exists deal jsonb check (jsonb_typeof(deal) = 'array' and jsonb_array_length(deal) <= 4),
  add column if not exists level text not null default 'club' check (level in ('beginner', 'casual', 'club', 'strong')),
  add column if not exists setup_deadline_at timestamptz,
  add column if not exists rematch_offer smallint check (rematch_offer in (0, 1)),
  add column if not exists rematch_game_id uuid references public.games(id) on delete set null;
alter table public.game_players
  add column if not exists choice jsonb check (octet_length(choice::text) <= 512),
  add column if not exists ready boolean not null default false;
create index if not exists games_setup_deadline on public.games (setup_deadline_at) where status = 'setup';

-- SOURCE: block-7
grant update (setup, rules, engine_fingerprint, setup_deadline_at, rematch_offer, rematch_game_id) on public.games to kingdown_plugin_runtime;
grant update (choice, ready, power) on public.game_players to kingdown_plugin_runtime;

-- SOURCE: supabase/migrations/0011_matchmaking.sql
-- The open lobby and its 24-hour sweep share this index.
create index if not exists games_random_waiting on public.games (created_at, id) where kind='random' and status='waiting';
create index if not exists game_players_recent on public.game_players (last_seen_at, user_id) where user_id is not null;

-- SOURCE: supabase/migrations/0012_results.sql
-- Results for plugin games. Browser roles have no access; the game service is the writer.
create table if not exists public.player_ratings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  rating double precision not null default 1500 check (rating >= 400 and rating < 'Infinity'::float8),
  rd double precision not null default 350 check (rd between 45 and 350),
  volatility double precision not null default 0.06 check (volatility > 0 and volatility <= 0.1),
  last_game_at timestamptz
);
create table if not exists public.rating_history (
  game_id uuid not null references public.games(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating_before double precision not null,
  rd_before double precision not null,
  volatility_before double precision not null,
  rating double precision not null,
  rd double precision not null,
  volatility double precision not null,
  created_at timestamptz not null,
  primary key (game_id, user_id)
);
create table if not exists public.player_badges (
  user_id uuid not null references auth.users(id) on delete cascade,
  badge text not null check (badge in ('first_win', 'friend_match', 'stranger_match', 'purist', 'fairy_tale',
    'architect', 'card_sharp', 'crowned', 'royal_collection', 'giant_slayer')),
  earned_at timestamptz not null,
  game_id uuid references public.games(id) on delete set null,
  primary key (user_id, badge)
);
do $$
declare t text;
begin
  foreach t in array array['player_ratings', 'rating_history', 'player_badges'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from public, anon, authenticated', t);
  end loop;
end $$;

-- SOURCE: block-8
grant select, insert, update (rating, rd, volatility, last_game_at) on public.player_ratings to kingdown_plugin_runtime;
grant select, insert on public.rating_history, public.player_badges to kingdown_plugin_runtime;
drop policy if exists kingdown_plugin_runtime on public.player_ratings;
create policy kingdown_plugin_runtime on public.player_ratings for all to kingdown_plugin_runtime using (true) with check (true);
drop policy if exists kingdown_plugin_runtime on public.rating_history;
create policy kingdown_plugin_runtime on public.rating_history for all to kingdown_plugin_runtime using (true) with check (true);
drop policy if exists kingdown_plugin_runtime on public.player_badges;
create policy kingdown_plugin_runtime on public.player_badges for all to kingdown_plugin_runtime using (true) with check (true);

-- SOURCE: supabase/migrations/0013_player_settings.sql
-- An empty board and a board whose game was deleted have different read results.
alter table public.plugin_boards add column if not exists created_at timestamptz not null default now();
alter table public.plugin_boards add column if not exists game_selected boolean not null default true;
create table if not exists public.player_settings (
 user_id uuid primary key references auth.users(id) on delete cascade,
 symbols_only boolean not null default false,
 show_threats boolean not null default false,
 last_setup jsonb
);
alter table public.player_settings enable row level security;
revoke all on public.player_settings from public, anon, authenticated;

-- SOURCE: block-9
grant insert (game_selected), update (game_selected) on public.plugin_boards to kingdown_plugin_runtime;
grant delete on public.plugin_boards to kingdown_plugin_runtime;
grant select (handle) on public.reserved_handles to kingdown_plugin_runtime;
drop policy if exists kingdown_plugin_runtime on public.reserved_handles;
create policy kingdown_plugin_runtime on public.reserved_handles for select to kingdown_plugin_runtime using (true);
grant select, insert, update (symbols_only, show_threats, last_setup) on public.player_settings to kingdown_plugin_runtime;
drop policy if exists kingdown_plugin_runtime on public.player_settings;
create policy kingdown_plugin_runtime on public.player_settings for all to kingdown_plugin_runtime using (true) with check (true);

-- SOURCE: block-10
grant delete on public.reports to kingdown_plugin_runtime;
drop policy if exists kingdown_plugin_runtime_old_reports on public.reports;
create policy kingdown_plugin_runtime_old_reports on public.reports as restrictive for delete to kingdown_plugin_runtime
  using (created_at < now() - interval '12 months' and (hold_until is null or hold_until <= now()));

commit;
