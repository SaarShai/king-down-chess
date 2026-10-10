-- King Down accounts and safety, phase 1 of online play: handles that never return, the 7-day
-- deletion grace, and the evidence that reports and moderation keep (report part 01, sections 5
-- and 8.2; part 03, sections 8.8 and 8.10). Run after 0007 with a privileged connection.
-- It is safe to run again. The account and safety services (src/online/) are the only writers.

begin;

-- A handle never returns: a changed handle stays reserved for its player, and a deleted player's
-- handle stays reserved for good. Here, not in the service, so every path keeps the rule. A lock on
-- each handle that a change takes or leaves makes a player who wants that handle wait until the
-- change commits; that player then sees the reservation. Without the lock on the old handle, the
-- reservation is not visible yet, and the old handle passes to the other player at the commit.
create or replace function public.reserve_handle() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    if old.handle is not null then
      perform pg_advisory_xact_lock(hashtext('kingdown.handle:' || old.handle));
      insert into public.reserved_handles (handle, reason) values (old.handle, 'deleted') on conflict (handle) do nothing;
    end if;
    return old;
  end if;
  if new.handle is not distinct from old.handle then return new; end if;
  -- The lower key first, so two changes never wait on each other. least and greatest skip a null handle.
  perform pg_advisory_xact_lock(least(hashtext('kingdown.handle:' || old.handle), hashtext('kingdown.handle:' || new.handle)));
  perform pg_advisory_xact_lock(greatest(hashtext('kingdown.handle:' || old.handle), hashtext('kingdown.handle:' || new.handle)));
  if new.handle is not null then
    if exists (select from public.reserved_handles where handle = new.handle) then
      raise exception 'Handle % is reserved', new.handle using errcode = '23505', constraint = 'reserved_handles_pkey';
    end if;
  end if;
  if old.handle is not null then
    insert into public.reserved_handles (handle, reason, user_id) values (old.handle, 'old', old.id) on conflict (handle) do nothing;
  end if;
  return new;
end $$;
create or replace trigger profiles_reserve_handle before update of handle or delete on public.profiles
  for each row execute function public.reserve_handle();

-- A deletion request: the deletions job runs it after a 7-day grace. A second request in the grace
-- keeps the first date; a request after a cancel starts a new grace. The dates come from the database
-- clock here, and the server role may not write them itself, so kingdown_jobs.delete_account can
-- trust run_after (plugin-deploy/runtime-role.sql, fifth block).
create or replace function kingdown_jobs.request_deletion(uid uuid) returns void
language sql security definer set search_path = '' as $$
  insert into public.account_deletions as d (user_id) values (uid)
  on conflict (user_id) do update set requested_at = now(), run_after = now() + interval '7 days', cancelled_at = null
    where d.cancelled_at is not null;
$$;

-- "Delete my account" on the website now asks for the same deletion.
create or replace function public.delete_my_account() returns void
language sql security definer set search_path = '' as $$
  select kingdown_jobs.request_deletion(auth.uid()) where auth.uid() is not null;
$$;

-- A sign-in in the grace cancels the deletion. Supabase Auth makes a new session at each sign-in
-- (website and ChatGPT), and a token refresh keeps the session, so a refresh cancels nothing.
create or replace function public.cancel_deletion_on_sign_in() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.account_deletions set cancelled_at = now()
    where user_id = new.user_id and cancelled_at is null and done_at is null;
  return null;
end $$;
create or replace trigger on_auth_session_created after insert on auth.sessions
  for each row execute function public.cancel_deletion_on_sign_in();

-- Evidence: the reported handle or preset as it was at the report, and the handle that a rename or
-- a hide took away (an upheld appeal gives it back). The NCA rules keep reported content for a year.
alter table public.reports add column if not exists content text check (char_length(content) <= 40);
alter table public.mod_actions add column if not exists handle text;
create index if not exists reports_held on public.reports (reported_id) where hold_until is not null;

revoke all on function public.reserve_handle() from public, anon, authenticated;
revoke all on function kingdown_jobs.request_deletion(uuid) from public, anon, authenticated;
revoke all on function public.cancel_deletion_on_sign_in() from public, anon, authenticated;

commit;
