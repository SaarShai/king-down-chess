-- INSTALLATION TEMPLATE ONLY: do not include in automatic game migrations.
-- Contract: https://supabase.com/docs/guides/auth/auth-hooks/before-user-created-hook
-- Approval D8 a: one review account signs in with an email and a password; every player uses Google or GitHub.
-- With the Email provider on, anyone can make a password account through the Auth API. This hook lets a new account
-- in only through Google, GitHub or Facebook, or with an email address in kingdown_auth.password_accounts. It refuses
-- every other sign-up: email, phone, anonymous and unknown. The same list limits password sign-ins:
-- public.kingdown_access_token_hook (oauth-audience-hook.sql) refuses a password session for every other address,
-- also for an existing Google or GitHub account that adds a password. This hook sees only new accounts.
-- Order: apply oauth-audience-hook.sql and this file as the admin role; enable public.kingdown_before_user_created in
-- Authentication > Hooks > Before User Created; add the addresses (below); only then turn the Email provider on and
-- make the accounts (docs/submission/checklist.md, owner step 2).
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
  if provider in ('google', 'github', 'facebook')
    or provider = 'email' and exists (select from kingdown_auth.password_accounts a where a.email = address) then
    return '{}'::jsonb;
  end if;
  return jsonb_build_object('error', jsonb_build_object('http_code', 403, 'message', 'Sign up with Google or GitHub.'));
end;
$$;
revoke execute on function public.kingdown_before_user_created(jsonb) from public, anon, authenticated;
grant execute on function public.kingdown_before_user_created(jsonb) to supabase_auth_admin;
-- Addresses in lower case, never a password. While you make and seed the accounts: the review address, its opponent
-- and your test address. Then delete the opponent (step 2.8) and, before the upload, the test address (step 7), so
-- that only the review address can sign in with a password:
-- insert into kingdown_auth.password_accounts(email) values ('YOUR-REVIEW-ADDRESS'), ('OPPONENT'), ('TEST');
-- delete from kingdown_auth.password_accounts where email <> 'YOUR-REVIEW-ADDRESS';
commit;
