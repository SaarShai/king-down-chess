-- One counter for each user and tool. The server counts each call before it starts work.
begin;

create table if not exists public.plugin_tool_tries (
  user_id uuid not null references auth.users (id) on delete cascade,
  tool text not null check (tool in ('kingdown_computer','kingdown_create','kingdown_open','kingdown_report')),
  window_start timestamptz not null default now(),
  tries integer not null default 1 check (tries >= 1),
  primary key (user_id,tool)
);
alter table public.plugin_tool_tries enable row level security;
revoke all on public.plugin_tool_tries from public, anon, authenticated;

commit;
