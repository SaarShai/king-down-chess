-- INSTALLATION TEMPLATE ONLY: do not include in automatic game migrations.
-- Contract: https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook
-- Enable public.kingdown_access_token_hook in Authentication > Hooks after review.
-- Add only registered/approved OAuth client UUIDs and their exact HTTPS /mcp resource.
-- An existing Custom Access Token hook must retain its behavior when this is integrated.
-- Safe to run again: paste it again after a change (docs/submission/checklist.md, owner step 2).
begin;
create schema if not exists kingdown_oauth;
revoke all on schema kingdown_oauth from public, anon, authenticated;
create table if not exists kingdown_oauth.client_resources (
  client_id uuid primary key,
  resource text not null check (resource ~ '^https://[^/?#@]+/mcp$')
);
alter table kingdown_oauth.client_resources enable row level security;
revoke all on kingdown_oauth.client_resources from public, anon, authenticated;
grant usage on schema public, kingdown_oauth to supabase_auth_admin;
grant select on kingdown_oauth.client_resources to supabase_auth_admin;
drop policy if exists auth_admin_read on kingdown_oauth.client_resources;
create policy auth_admin_read on kingdown_oauth.client_resources for select to supabase_auth_admin using (true);
create or replace function public.kingdown_access_token_hook(event jsonb)
returns jsonb language plpgsql stable security invoker set search_path = '' as $$
declare
  claims jsonb := event -> 'claims';
  target text;
  listed boolean := false;
begin
  if claims is null or jsonb_typeof(claims) <> 'object' then
    raise exception 'Missing token claims' using errcode = '22023';
  end if;
  -- Approval D8 a: a password session only for an address in kingdown_auth.password_accounts (review-signup-hook.sql).
  -- The Before User Created hook sees only new accounts, and a Google or GitHub player can add a password to an
  -- existing account (auth.updateUser). So Auth refuses the session here. With no list installed, it refuses them all.
  -- A refresh keeps the session's method in amr. An app code exchange makes a new session with only
  -- oauth_provider/authorization_code in amr. Auth's app_metadata shows whether the account has a social sign-in.
  -- An account with no social sign-in gets no new token after its address leaves the list.
  if event ->> 'authentication_method' = 'password' or coalesce(claims -> 'amr' @> '[{"method": "password"}]', false)
    or not exists (
      select from jsonb_array_elements_text(coalesce(claims -> 'app_metadata' -> 'providers', '[]'::jsonb)) as p(provider)
      where p.provider <> 'email'
    ) then
    if to_regclass('kingdown_auth.password_accounts') is not null then
      listed := exists (select from kingdown_auth.password_accounts a where a.email = lower(claims ->> 'email'));
    end if;
    if not listed then
      return jsonb_build_object('error', jsonb_build_object('http_code', 403, 'message', 'Sign in with Google or GitHub.'));
    end if;
  end if;
  -- client_id is an Auth-issued claim, never user_metadata or a caller-supplied URL.
  if claims ->> 'role' = 'authenticated' and claims ->> 'is_anonymous' = 'false' then
    select resource into target from kingdown_oauth.client_resources
      where client_id::text = claims ->> 'client_id';
    if target is not null then
      claims := jsonb_set(claims, '{aud}', to_jsonb(target));
    end if;
  end if;
  -- Preserve every other claim, including client_id, expiry, session and website permissions.
  return jsonb_build_object('claims', claims);
end;
$$;
revoke execute on function public.kingdown_access_token_hook(jsonb) from public, anon, authenticated;
grant execute on function public.kingdown_access_token_hook(jsonb) to supabase_auth_admin;
-- Example after registering your real client (replace both placeholders):
-- insert into kingdown_oauth.client_resources(client_id,resource)
-- values ('YOUR-OAUTH-CLIENT-UUID', 'https://YOUR-PLUGIN-ORIGIN/mcp');
commit;
