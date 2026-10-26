-- Run each marked phase as a separate query. Do not wrap this file in a transaction.
-- Schema locks end before the backfill, validation and concurrent index builds.
begin;
set local lock_timeout = '5s';
alter table public.game_invites add column if not exists recipient_id uuid;
alter table public.game_invites add column if not exists state text not null default 'open';
alter table public.game_invites add column if not exists closed_at timestamptz;

-- The old server writes only used_by and used_at until the new release is active.
create or replace function public.game_invites_old_join() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.used_at is not null and new.state='open' then
    new.state := 'accepted';
    new.closed_at := new.used_at;
  end if;
  return new;
end $$;
revoke all on function public.game_invites_old_join() from public;
drop trigger if exists game_invites_old_join on public.game_invites;
create trigger game_invites_old_join before insert or update on public.game_invites
  for each row execute function public.game_invites_old_join();
commit;

-- migrate:next
begin;
set local lock_timeout = '5s';
-- Keep game and invitation schema locks separate: old joins read invitations before games.
-- Old game-end writes do not update invitations. Keep the same game-before-invitation lock order.
create or replace function public.game_invites_game_end() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.game_invites set state='cancelled',closed_at=coalesce(new.finished_at,new.updated_at)
    where game_id=new.id and state='open' and used_at is null;
  return new;
end $$;
revoke all on function public.game_invites_game_end() from public;
drop trigger if exists game_invites_game_end on public.games;
create trigger game_invites_game_end after update of status on public.games
  for each row when (new.status in ('finished','aborted')) execute function public.game_invites_game_end();
commit;

-- migrate:next
update public.game_invites i set state=case when i.used_at is not null then 'accepted'
  when g.status in ('finished','aborted') then 'cancelled' else 'open' end,
  closed_at=case when i.used_at is not null then i.used_at when g.status in ('finished','aborted') then coalesce(g.finished_at,g.updated_at) end
from public.games g where g.id=i.game_id and (i.state is null or i.state='open' and (i.used_at is not null or g.status in ('finished','aborted')));

-- migrate:next
do $$ begin
  if exists(select game_id from public.game_invites group by game_id having count(*)>1) then
    raise exception 'Duplicate invitations for one game. Repair the rows before this migration.';
  end if;
end $$;

-- migrate:next
create unique index concurrently if not exists game_invites_one_game on public.game_invites(game_id);
-- migrate:next
create index concurrently if not exists game_invites_named_pending on public.game_invites(created_by,recipient_id,expires_at) where state='open' and recipient_id is not null;
-- migrate:next
create index concurrently if not exists game_invites_recipient_inbox on public.game_invites(recipient_id,created_at desc,token_hash) where state='open';
-- migrate:next
create index concurrently if not exists game_invites_open_pending on public.game_invites(created_by,expires_at) where state='open' and recipient_id is null;
-- migrate:next
create index concurrently if not exists game_players_pair on public.game_players(user_id,game_id) where user_id is not null and not computer;

-- migrate:next
begin;
set local lock_timeout = '5s';
do $$ begin
  if exists(select from pg_index where indexrelid in (
    'public.game_invites_one_game'::regclass, 'public.game_invites_named_pending'::regclass,
    'public.game_invites_recipient_inbox'::regclass, 'public.game_invites_open_pending'::regclass,
    'public.game_players_pair'::regclass) and not indisvalid) then
    raise exception 'Invalid invitation index. Drop the failed index concurrently and repeat this migration.';
  end if;
  if not exists(select from pg_constraint where conrelid='public.game_invites'::regclass and conname='game_invites_one_game') then
    alter table public.game_invites add constraint game_invites_one_game unique using index game_invites_one_game;
  end if;
  if not exists(select from pg_constraint where conrelid='public.game_invites'::regclass and conname='game_invites_recipient_id_fkey') then
    alter table public.game_invites add constraint game_invites_recipient_id_fkey foreign key(recipient_id) references auth.users(id) on delete cascade not valid;
  end if;
end $$;
alter table public.game_invites drop constraint if exists game_invites_recipient;
alter table public.game_invites add constraint game_invites_recipient check(recipient_id<>created_by) not valid;
alter table public.game_invites drop constraint if exists game_invites_state;
alter table public.game_invites add constraint game_invites_state check(
  (state='open' and used_at is null and used_by is null and closed_at is null) or
  (state='accepted' and used_at is not null and closed_at is not null) or
  (state in ('declined','cancelled') and used_at is null and used_by is null and closed_at is not null)) not valid;
commit;

-- migrate:next
alter table public.game_invites validate constraint game_invites_recipient_id_fkey,
  validate constraint game_invites_recipient, validate constraint game_invites_state;
-- migrate:next
drop index concurrently if exists public.game_invites_game;

-- migrate:next
begin;
set local lock_timeout = '5s';
alter table public.plugin_tool_tries drop constraint if exists plugin_tool_tries_tool_check;
alter table public.plugin_tool_tries add constraint plugin_tool_tries_tool_check check(tool in ('kingdown_computer','kingdown_create','kingdown_open','kingdown_report','kingdown_friends')) not valid;
do $$ begin
  if exists(select from pg_roles where rolname='kingdown_plugin_runtime') then
    grant update(state,closed_at) on public.game_invites to kingdown_plugin_runtime;
  end if;
end $$;

-- Use the same namespace and sorted IDs as PostgresMatchStore.lockAccounts.
create or replace function kingdown_jobs.delete_account(uid uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
declare account_id uuid; waiting record;
begin
  for account_id in select distinct u from (
    select uid as u union select created_by from public.game_invites where recipient_id=uid
    union select recipient_id from public.game_invites where created_by=uid
    union select op.user_id from public.game_players me join public.game_players op on op.game_id=me.game_id where me.user_id=uid
  ) a where u is not null order by u loop
    perform pg_advisory_xact_lock(hashtextextended('account:'||account_id::text,0));
  end loop;
  perform from public.account_deletions where user_id=uid and run_after<=statement_timestamp() and cancelled_at is null and done_at is null for update;
  if not found or exists(select from public.reports where uid in (reported_id,reporter_id) and hold_until>statement_timestamp()) then return false; end if;
  -- Old writers lock games, not accounts. Lock all affected games before the active-seat check.
  perform from public.games g where g.created_by=uid
    or exists(select from public.game_players p where p.game_id=g.id and p.user_id=uid)
    or exists(select from public.game_invites i where i.game_id=g.id and i.recipient_id=uid)
    order by g.id for update;
  if exists(select from public.game_players p join public.games g on g.id=p.game_id where p.user_id=uid and p.active and g.status<>'waiting') then return false; end if;
  for waiting in select g.id,g.revision from public.games g where g.status='waiting' and
    (g.created_by=uid or exists(select from public.game_invites i where i.game_id=g.id and i.recipient_id=uid)) order by g.id for update loop
    update public.games set status='aborted',result=null,end_reason='no_start',finished_at=statement_timestamp(),updated_at=statement_timestamp(),revision=revision+1 where id=waiting.id;
    update public.game_players set active=false,action='done',ended_at=statement_timestamp() where game_id=waiting.id;
    insert into public.game_commands(game_id,seq,kind,payload,turn_after,status_after,received_at)
      select id,revision,'expire','{}',turn,status,statement_timestamp() from public.games where id=waiting.id;
  end loop;
  -- Old receipts can hold raw recipient fields. Remove them before the account and invites.
  update public.game_commands c set payload=c.payload-'recipient_id'-'recipient_handle'
    where c.kind in ('start','join') and (c.payload->>'recipient_id'=uid::text
      or c.payload->>'recipient_handle'=(select handle from public.profiles where id=uid)
      or exists(select from public.game_invites i where i.game_id=c.game_id and i.recipient_id=uid));
  delete from public.game_invites where created_by=uid or recipient_id=uid;
  insert into public.reserved_handles(handle,reason,user_id) select handle,'deleted',id from public.profiles where id=uid and handle is not null on conflict(handle) do nothing;
  delete from public.games g using public.game_players p where p.game_id=g.id and p.user_id=uid and g.kind='solo';
  delete from auth.users where id=uid;
  update public.account_deletions set done_at=statement_timestamp() where user_id=uid;
  return true;
end $$;
commit;

-- migrate:next
alter table public.plugin_tool_tries validate constraint plugin_tool_tries_tool_check;
