-- First-party fault counts. No account, game, address or request data.
begin;
create table if not exists public.client_errors (
 id bigint generated always as identity primary key,
 fingerprint text not null check (fingerprint ~ '^[a-f0-9]{16}$'),
 build text not null check (build ~ '^[a-f0-9]{40}$'),
 hour timestamptz not null,
 kind text not null check (kind in ('error','rejection','worker','server')),
 name text not null check (length(name) <= 40),
 message text not null check (length(message) <= 300),
 routes text[] not null check (cardinality(routes) <= 20),
 browsers text[] not null check (cardinality(browsers) <= 20),
 size_classes text[] not null check (size_classes <@ array['phone','desktop']::text[]),
 count bigint not null default 1 check (count > 0),
 first_seen timestamptz not null default now(),
 last_seen timestamptz not null default now(),
 unique (fingerprint,build,hour)
);
create index if not exists client_errors_last_seen on public.client_errors(last_seen);
alter table public.client_errors enable row level security;
revoke all on public.client_errors from public, anon, authenticated;
revoke all on sequence public.client_errors_id_seq from public, anon, authenticated;
-- An existing deployment has this role. A new database adds it with runtime-role.sql.
do $$ begin
 if exists(select from pg_roles where rolname='kingdown_plugin_runtime') then
  grant select, insert, update (count,last_seen,routes,browsers,size_classes), delete on public.client_errors to kingdown_plugin_runtime;
  grant usage on sequence public.client_errors_id_seq to kingdown_plugin_runtime;
  drop policy if exists kingdown_plugin_runtime on public.client_errors;
  create policy kingdown_plugin_runtime on public.client_errors for all to kingdown_plugin_runtime using (true) with check (true);
  drop policy if exists kingdown_plugin_runtime_old_errors on public.client_errors;
  create policy kingdown_plugin_runtime_old_errors on public.client_errors as restrictive for delete to kingdown_plugin_runtime
   using (last_seen < now()-interval '30 days');
 end if;
end $$;
commit;
