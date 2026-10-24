-- In-database release backup: one copy of every public table and of kingdown_oauth.client_resources, made from one
-- snapshot (docs/specs/release-safety/issues/01-backup-restore-and-engine-target.md). Run by the owner's word only,
-- with a privileged connection (the Supabase SQL Editor). For a new release, change the date in every schema name here
-- and in release-restore-games.sql.
-- Repeatable read gives every copy and count the snapshot of the first query: a live move that commits during the copy
-- is in no copy, so games and game_commands agree. Plain read committed takes a new snapshot for each statement.
-- The copy refuses (and rolls back) when the schema exists, a count differs, a table has no row-level security, or a
-- client role can use a backup table.
begin isolation level repeatable read;
create schema release_backup_20261022;
revoke all on schema release_backup_20261022 from public, anon, authenticated;
do $$ declare t record; begin
  for t in select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' order by c.relname loop
    execute format('create table release_backup_20261022.%I as table public.%I', t.relname, t.relname);
  end loop;
end $$;
create table release_backup_20261022.kingdown_oauth__client_resources as table kingdown_oauth.client_resources;
do $$ declare t record; begin
  for t in select tablename from pg_tables where schemaname = 'release_backup_20261022' loop
    execute format('alter table release_backup_20261022.%I enable row level security', t.tablename);
  end loop;
end $$;
revoke all on all tables in schema release_backup_20261022 from public, anon, authenticated;
do $$ declare t record; a bigint; b bigint; begin
  for t in select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' order by c.relname loop
    execute format('select count(*) from public.%I', t.relname) into a;
    execute format('select count(*) from release_backup_20261022.%I', t.relname) into b;
    if a <> b then raise exception 'backup count differs for %: % vs %', t.relname, a, b; end if;
  end loop;
  if exists (select 1 from pg_tables where schemaname = 'release_backup_20261022' and not rowsecurity) then
    raise exception 'a backup table has no row level security';
  end if;
  if exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'release_backup_20261022' and c.relkind = 'r'
      and (has_table_privilege('anon', c.oid, 'select,insert,update,delete,truncate,references,trigger')
        or has_table_privilege('authenticated', c.oid, 'select,insert,update,delete,truncate,references,trigger'))) then
    raise exception 'a client role can read a backup table';
  end if;
end $$;
commit;
select (select count(*) from pg_tables where schemaname = 'release_backup_20261022') as backup_tables,
  (select count(*) from pg_tables where schemaname = 'public') as public_tables,
  (select count(*) from release_backup_20261022.games) as backup_games,
  (select count(*) from pg_tables where schemaname = 'release_backup_20261022' and not rowsecurity) as tables_without_rls,
  has_schema_privilege('anon', 'release_backup_20261022', 'usage') or has_schema_privilege('authenticated', 'release_backup_20261022', 'usage') as client_can_use_schema,
  clock_timestamp() as made_at;
