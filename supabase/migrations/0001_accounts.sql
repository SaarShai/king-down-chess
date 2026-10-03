-- King Down accounts, phase 1: player profiles, each player's saved data, and account deletion.
-- Paste the whole file into the Supabase SQL editor and press Run. It is safe to run again.
-- The browser uses only the publishable key, so these grants and Row Level Security policies are
-- the whole protection. New tables are not exposed automatically in this project: every grant is here.

begin;

-- Profiles: what other signed-in players may see. No email here, ever.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) between 1 and 50),
  avatar_url text,
  rating int not null default 1200,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Each player's settings, lesson progress, saved game and unlocks. Each section is
-- {"at": <ms when it last changed>, "v": <value>}; the newer copy wins (src/account/sync.ts).
create table if not exists public.user_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  settings jsonb check (octet_length(settings::text) <= 16384),
  lessons jsonb check (octet_length(lessons::text) <= 16384),
  saved_game jsonb check (octet_length(saved_game::text) <= 262144),
  unlocks jsonb check (octet_length(unlocks::text) <= 65536),
  updated_at timestamptz not null default now()
);

create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- "create or replace trigger" needs only the TRIGGER privilege; "drop trigger" needs to own the table,
-- and Supabase's auth.users belongs to the auth service.
create or replace trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
create or replace trigger user_data_touch before update on public.user_data
  for each row execute function public.touch_updated_at();

-- Every section is null or {"at": <ms>, "v": <value>}, so the next trigger can compare times.
alter table public.user_data drop constraint if exists user_data_sections_stamped;
alter table public.user_data add constraint user_data_sections_stamped check (
  (settings is null or coalesce(jsonb_typeof(settings -> 'at') = 'number', false))
  and (lessons is null or coalesce(jsonb_typeof(lessons -> 'at') = 'number', false))
  and (saved_game is null or coalesce(jsonb_typeof(saved_game -> 'at') = 'number', false)));

-- A write keeps a section only when it is newer than the stored copy. So a device that was offline
-- cannot replace a newer copy that another device sent meanwhile; the reply gives it the newer copy.
create or replace function public.keep_newer_sections() returns trigger
language plpgsql set search_path = '' as $$
begin
  if (new.settings ->> 'at')::numeric <= (old.settings ->> 'at')::numeric then new.settings := old.settings; end if;
  if (new.lessons ->> 'at')::numeric <= (old.lessons ->> 'at')::numeric then new.lessons := old.lessons; end if;
  if (new.saved_game ->> 'at')::numeric <= (old.saved_game ->> 'at')::numeric then new.saved_game := old.saved_game; end if;
  return new;
end $$;

create or replace trigger user_data_keep_newer before update on public.user_data
  for each row execute function public.keep_newer_sections();

-- The name and picture for a profile, from what the sign-in service sent (nothing else, never a
-- rating). Google sends full_name/name and avatar_url/picture; GitHub sends name or user_name and
-- avatar_url. Other players' browsers will load the picture, so only the sign-in services' own
-- picture servers count: an address someone chose could track them, or be a script link.
create or replace function public.profile_name(m jsonb) returns text
language sql immutable set search_path = '' as $$
  select left(coalesce(nullif(btrim(m ->> 'full_name'), ''), nullif(btrim(m ->> 'name'), ''), nullif(btrim(m ->> 'user_name'), '')), 50)
$$;
create or replace function public.profile_picture(m jsonb) returns text
language sql immutable set search_path = '' as $$
  select url from (select coalesce(m ->> 'avatar_url', m ->> 'picture') as url) p
  where char_length(url) <= 2048
    and url ~ '^https://([a-z0-9-]+\.)*(googleusercontent\.com|githubusercontent\.com|fbsbx\.com|fbcdn\.net)/'
$$;

-- A profile for every new account.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (new.id, public.profile_name(new.raw_user_meta_data), public.profile_picture(new.raw_user_meta_data))
  on conflict (id) do nothing;
  return new;
exception when others then
  -- A missing profile must never stop a sign-up.
  raise warning 'handle_new_user: no profile for %: %', new.id, sqlerrm;
  return new;
end $$;

create or replace trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Accounts made before this file ran (test sign-ins) get their profile too.
insert into public.profiles (id, display_name, avatar_url)
select id, public.profile_name(raw_user_meta_data), public.profile_picture(raw_user_meta_data) from auth.users
on conflict (id) do nothing;

-- Deletes the signed-in player's account. Profile and saved data go with it (on delete cascade).
create or replace function public.delete_my_account() returns void
language sql security definer set search_path = '' as $$
  delete from auth.users where id = auth.uid();
$$;

-- Row Level Security: signed-in players read profiles and change only their own display name;
-- saved data is visible and writable only by its owner. Signed-out visitors (anon) get nothing.
alter table public.profiles enable row level security;
alter table public.user_data enable row level security;

drop policy if exists "Signed-in players read profiles" on public.profiles;
create policy "Signed-in players read profiles" on public.profiles
  for select to authenticated using (true);
drop policy if exists "Players rename themselves" on public.profiles;
create policy "Players rename themselves" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists "Players read their own data" on public.user_data;
create policy "Players read their own data" on public.user_data
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "Players add their own data" on public.user_data;
create policy "Players add their own data" on public.user_data
  for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "Players change their own data" on public.user_data;
create policy "Players change their own data" on public.user_data
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Grants. Rating and unlocks are not writable from the browser (a server will set them later).
-- user_id is in the update list because an upsert names it in its "on conflict do update".
revoke all on public.profiles, public.user_data from public, anon, authenticated;
grant usage on schema public to authenticated;
-- Other players see a name, a picture and a rating (the privacy page), not when an account was made.
grant select (id, display_name, avatar_url, rating) on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;
grant select on public.user_data to authenticated;
grant insert (user_id, settings, lessons, saved_game) on public.user_data to authenticated;
grant update (user_id, settings, lessons, saved_game) on public.user_data to authenticated;

revoke all on function public.touch_updated_at() from public, anon, authenticated;
revoke all on function public.keep_newer_sections() from public, anon, authenticated;
revoke all on function public.profile_name(jsonb) from public, anon, authenticated;
revoke all on function public.profile_picture(jsonb) from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.delete_my_account() from public, anon, authenticated;
grant execute on function public.delete_my_account() to authenticated;

commit;
