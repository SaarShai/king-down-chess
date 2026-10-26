-- Named invitations and account locks. Keep runtime grants and row security.
begin;

alter table public.game_invites add column if not exists recipient_id uuid references auth.users(id) on delete cascade;
alter table public.game_invites add column if not exists state text;
alter table public.game_invites add column if not exists closed_at timestamptz;
update public.game_invites i set state=case when i.used_at is not null then 'accepted'
  when g.status in ('finished','aborted') then 'cancelled' else 'open' end,
  closed_at=case when i.used_at is not null then i.used_at when g.status in ('finished','aborted') then coalesce(g.finished_at,g.updated_at) end
from public.games g where g.id=i.game_id and i.state is null;
alter table public.game_invites alter column state set default 'open', alter column state set not null;

do $$ begin
  if exists(select game_id from public.game_invites group by game_id having count(*)>1) then
    raise exception 'Duplicate invitations for one game. Repair the rows before this migration.';
  end if;
end $$;
alter table public.game_invites drop constraint if exists game_invites_one_game;
alter table public.game_invites add constraint game_invites_one_game unique(game_id);
drop index if exists public.game_invites_game;
alter table public.game_invites drop constraint if exists game_invites_recipient;
alter table public.game_invites add constraint game_invites_recipient check(recipient_id<>created_by);
alter table public.game_invites drop constraint if exists game_invites_state;
alter table public.game_invites add constraint game_invites_state check(
  (state='open' and used_at is null and used_by is null and closed_at is null) or
  (state='accepted' and used_at is not null and closed_at is not null) or
  (state in ('declined','cancelled') and used_at is null and used_by is null and closed_at is not null));
create index if not exists game_invites_named_pending on public.game_invites(created_by,recipient_id,expires_at) where state='open' and recipient_id is not null;
create index if not exists game_invites_recipient_inbox on public.game_invites(recipient_id,created_at desc,token_hash) where state='open';
create index if not exists game_invites_open_pending on public.game_invites(created_by,expires_at) where state='open' and recipient_id is null;
create index if not exists game_players_pair on public.game_players(user_id,game_id) where user_id is not null and not computer;

alter table public.plugin_tool_tries drop constraint if exists plugin_tool_tries_tool_check;
alter table public.plugin_tool_tries add constraint plugin_tool_tries_tool_check check(tool in ('kingdown_computer','kingdown_create','kingdown_open','kingdown_report','kingdown_friends'));
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
  if not found or exists(select from public.reports where uid in (reported_id,reporter_id) and hold_until>statement_timestamp())
    or exists(select from public.game_players p join public.games g on g.id=p.game_id where p.user_id=uid and p.active and g.status<>'waiting') then return false; end if;
  for waiting in select g.id,g.revision from public.games g where g.status='waiting' and
    (g.created_by=uid or exists(select from public.game_invites i where i.game_id=g.id and i.recipient_id=uid)) order by g.id for update loop
    update public.games set status='aborted',result=null,end_reason='no_start',finished_at=statement_timestamp(),updated_at=statement_timestamp(),revision=revision+1 where id=waiting.id;
    update public.game_players set active=false,action='done',ended_at=statement_timestamp() where game_id=waiting.id;
    insert into public.game_commands(game_id,seq,kind,payload,turn_after,status_after,received_at)
      select id,revision,'expire','{}',turn,status,statement_timestamp() from public.games where id=waiting.id;
  end loop;
  delete from public.game_invites where created_by=uid or recipient_id=uid;
  insert into public.reserved_handles(handle,reason,user_id) select handle,'deleted',id from public.profiles where id=uid and handle is not null on conflict(handle) do nothing;
  delete from public.games g using public.game_players p where p.game_id=g.id and p.user_id=uid and g.kind='solo';
  delete from auth.users where id=uid;
  update public.account_deletions set done_at=statement_timestamp() where user_id=uid;
  return true;
end $$;
commit;
