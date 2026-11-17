-- Opponent OAuth picture address for players who share a game or an invite with no block.
-- Email sign-in keeps no picture. Browser roles keep no access. Safe to run again.
begin;

create schema if not exists kingdown_jobs;
revoke all on schema kingdown_jobs from public, anon, authenticated;

create or replace function kingdown_jobs.user_avatar(viewer uuid, subject uuid) returns text
language plpgsql stable security definer set search_path = '' as $$
declare
  meta jsonb;
  app jsonb;
  url text;
begin
  if viewer is null or subject is null or viewer = subject then
    return null;
  end if;
  if exists (
    select from public.relations r
    where r.kind = 'block'
      and ((r.user_id = viewer and r.other_id = subject)
        or (r.user_id = subject and r.other_id = viewer))
  ) then
    return null;
  end if;
  if not (
    exists (
      select from public.game_players a
      join public.game_players b on b.game_id = a.game_id
      where a.user_id = viewer and b.user_id = subject
    )
    or exists (
      select from public.game_invites i
      where (i.created_by = viewer and i.recipient_id = subject)
         or (i.created_by = subject and i.recipient_id = viewer)
    )
  ) then
    return null;
  end if;
  select u.raw_user_meta_data, to_jsonb(u) -> 'raw_app_meta_data'
  into meta, app
  from auth.users u
  where u.id = subject;
  if meta is null or coalesce(app ->> 'provider', '') = 'email' then
    return null;
  end if;
  url := coalesce(
    case when jsonb_typeof(meta -> 'avatar_url') = 'string' then nullif(btrim(meta ->> 'avatar_url'), '') end,
    case when jsonb_typeof(meta -> 'picture') = 'string' then nullif(btrim(meta ->> 'picture'), '') end
  );
  if url is not null and url ~ '^https://' and char_length(url) <= 2048 then
    return url;
  end if;
  return null;
end $$;

revoke all on function kingdown_jobs.user_avatar(uuid, uuid) from public, anon, authenticated;

do $$ begin
  if exists(select from pg_roles where rolname = 'kingdown_plugin_runtime') then
    grant usage on schema kingdown_jobs to kingdown_plugin_runtime;
    grant execute on function kingdown_jobs.user_avatar(uuid, uuid) to kingdown_plugin_runtime;
  end if;
end $$;

commit;
