-- INSTALLATION TEMPLATE ONLY: do not include in automatic game migrations.
-- Contract: https://supabase.com/docs/guides/auth/auth-hooks/before-user-created-hook
-- Players sign up with Google, GitHub, Facebook or an email code. This hook refuses every other sign-up: phone,
-- anonymous and unknown. The Auth API cannot tell a code sign-up from a password sign-up here, so a password account
-- can be made through the API. It gets no session: public.kingdown_access_token_hook (oauth-audience-hook.sql) refuses
-- a password session for each address not in kingdown_auth.password_accounts (approval D8 a, the review account), also
-- for an existing account that adds a password. This hook sees only new accounts.
-- Order: apply oauth-audience-hook.sql and this file as the admin role; enable public.kingdown_before_user_created in
-- Authentication > Hooks > Before User Created; only then turn the Email provider on
-- (docs/specs/email-sign-in/issues/01-email-code.md). A review account also needs its address in the list (below).
begin;
create schema if not exists kingdown_auth;
revoke all on schema kingdown_auth from public, anon, authenticated;
create table if not exists kingdown_auth.password_accounts (
  email text primary key check (email = lower(email) and email like '_%@_%')
);
alter table kingdown_auth.password_accounts enable row level security;
revoke all on kingdown_auth.password_accounts from public, anon, authenticated;
grant usage on schema kingdown_auth to supabase_auth_admin;
grant select on kingdown_auth.password_accounts to supabase_auth_admin;
drop policy if exists auth_admin_read on kingdown_auth.password_accounts;
create policy auth_admin_read on kingdown_auth.password_accounts for select to supabase_auth_admin using (true);
create or replace function public.kingdown_before_user_created(event jsonb)
returns jsonb language plpgsql stable security invoker set search_path = '' as $$
declare
  provider text := event -> 'user' -> 'app_metadata' ->> 'provider';
  address text := lower(event -> 'user' ->> 'email');
begin
  if provider in ('google', 'github', 'facebook') or provider = 'email' and address like '_%@_%' then
    return '{}'::jsonb;
  end if;
  return jsonb_build_object('error', jsonb_build_object('http_code', 403, 'message', 'Sign up with Google, GitHub or email.'));
end;
$$;
revoke execute on function public.kingdown_before_user_created(jsonb) from public, anon, authenticated;
grant execute on function public.kingdown_before_user_created(jsonb) to supabase_auth_admin;
-- Addresses in lower case, never a password. While you make and seed the accounts: the review address, its opponent
-- and your test address. Then delete the opponent (step 2.8) and, before the upload, the test address (step 7), so
-- that only the review address can sign in with a password. Sign each removed address out on every device: the
-- session delete also removes its refresh tokens.
-- insert into kingdown_auth.password_accounts(email) values ('YOUR-REVIEW-ADDRESS'), ('OPPONENT'), ('TEST');
-- delete from kingdown_auth.password_accounts where email <> 'YOUR-REVIEW-ADDRESS';
-- delete from auth.sessions where user_id in (select id from auth.users where lower(email) in ('OPPONENT', 'TEST'));
commit;
