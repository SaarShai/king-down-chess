-- The operator controls web account access. A new switch stays off.
begin;

create table if not exists public.web_account_access (
 singleton boolean primary key default true check (singleton),
 enabled boolean not null default false
);
alter table public.web_account_access enable row level security;
revoke all on public.web_account_access from public, anon, authenticated;
insert into public.web_account_access(singleton, enabled)
values (true, false) on conflict (singleton) do nothing;

commit;
