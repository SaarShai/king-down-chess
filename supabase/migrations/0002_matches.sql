-- Server-owned shared matches. Apply with a privileged PostgreSQL connection.
begin;
create table if not exists public.plugin_matches (
 id uuid primary key,
 white_id uuid not null references auth.users(id) on delete cascade,
 black_id uuid references auth.users(id) on delete cascade,
 mode text not null check (mode in ('solo','friend')),
 revision integer not null check (revision between 0 and 1000),
 save text not null check (octet_length(save) <= 8000000),
 snapshot jsonb not null check (octet_length(snapshot::text) <= 8000000),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check (white_id is distinct from black_id),
 check (mode = 'friend' or black_id is null)
);
create table if not exists public.plugin_match_commands (
 match_id uuid not null references public.plugin_matches(id) on delete cascade,
 actor_id uuid not null references auth.users(id) on delete cascade,
 command_id text not null check (char_length(command_id) between 1 and 200),
 payload jsonb not null check (octet_length(payload::text) <= 4096),
 primary key (match_id,actor_id,command_id)
);
create table if not exists public.plugin_match_invites (
 token_hash text primary key,
 match_id uuid not null references public.plugin_matches(id) on delete cascade,
 expires_at timestamptz not null,
 joined_by uuid references auth.users(id) on delete cascade
);
alter table public.plugin_matches enable row level security;
alter table public.plugin_match_commands enable row level security;
alter table public.plugin_match_invites enable row level security;
revoke all on public.plugin_matches,public.plugin_match_commands,public.plugin_match_invites from public,anon,authenticated;
commit;
