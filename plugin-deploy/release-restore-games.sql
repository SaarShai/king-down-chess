-- Restore the games of a release backup (release-backup.sql) in the live tables, in one transaction
-- (docs/specs/release-safety/issues/01-backup-restore-and-engine-target.md). Run by the owner's word only, with a
-- privileged connection (the Supabase SQL Editor). For another backup, change the date in every schema name.
--
-- Tables: games, game_players, game_commands, game_invites. Order:
--   1. Lock the four tables against writes (reads continue) until the commit, so the game service and the jobs wait.
--   2. Refuse a backup in which a game and its command rows disagree, a child row has no game, or a game lacks seat 0
--      or seat 1. Refuse when the rating rows of a backup game changed since the backup (a rating restore is a
--      separate decision).
--   3. Leave out each backup solo game of an account deleted since the backup, with all its rows, so it stays erased.
--   4. Delete the live player, command and invite rows of each backup game.
--   5. Insert each backup game that was deleted since the backup, then write every backup game in place (an update, so
--      reports, badges, boards and rematches keep their link).
--   6. Insert the backup player, command and invite rows.
--   7. Refuse (and roll back) when a restored game and its command rows disagree.
-- Newer rows: a game made after the backup stays as it is, with all its rows. A backup game loses the moves, joins,
-- seats and invites written after the backup.
-- Deleted accounts: an account deleted since the backup keeps the erasure of kingdown_jobs.delete_account
-- (supabase/migrations/0007_jobs.sql), which the privacy page promises. Its solo games stay deleted, with their seats
-- (and the handle at start), commands and invites. A game with another human seat stays, as delete_account keeps it
-- for the opponent: each reference to the account follows its foreign key, so it becomes null, or (an invite that the
-- account made) the row stays deleted.
-- Not restored: accounts, settings, ratings, notifications and the outbox. A restored deadline that passed since the
-- backup ends its game at the next kingdown-tick, unless the owner pauses that job first.
-- Columns: only the columns that the backup and the live table share; a column added since the backup keeps its default.
begin;
lock table public.games, public.game_players, public.game_commands, public.game_invites in exclusive mode;
do $$
declare
  b constant text := 'release_backup_20261022';
  t text;
  cols text;
  n bigint;
  shared constant text := 'select string_agg(quote_ident(l.column_name), '','' order by l.ordinal_position) from information_schema.columns l
    join information_schema.columns k on k.table_schema = $1 and k.table_name = l.table_name and k.column_name = l.column_name
    where l.table_schema = ''public'' and l.table_name = $2 and l.column_name <> all($3)';
  -- A backup game agrees with its command rows when they are exactly seq 1 to revision.
  disagree constant text := 'select count(*) from %1$s g where ((select count(*) from %2$s c where c.game_id = g.id and c.seq between 1 and g.revision) <> g.revision
    or exists (select from %2$s c where c.game_id = g.id and c.seq > g.revision))';
begin
  if to_regnamespace(b) is null then raise exception 'backup schema % does not exist', b; end if;
  execute format(disagree, format('%I.games', b), format('%I.game_commands', b)) into n;
  if n > 0 then raise exception 'backup refused: % game(s) disagree with their command rows', n; end if;
  for t in select unnest(array['game_players', 'game_commands', 'game_invites']) loop
    execute format('select count(*) from %1$I.%2$I c where not exists (select from %1$I.games g where g.id = c.game_id)', b, t) into n;
    if n > 0 then raise exception 'backup refused: % row(s) of % have no backup game', n, t; end if;
  end loop;
  -- Every game has both seats from its first write (src/match/service.ts makes seats 0 and 1, store.ts inserts them in
  -- the game's transaction), for every kind and status. A plain-begin copy can hold a game that started after its
  -- game_players copy: no commands, so the command check passes, but no seats.
  execute format('select count(*) from %1$I.games g where (select count(distinct p.seat) from %1$I.game_players p where p.game_id = g.id and p.seat in (0, 1)) <> 2', b) into n;
  if n > 0 then raise exception 'backup refused: % game(s) lack seat 0 or seat 1', n; end if;
  execute format('select count(*) from ((select to_jsonb(r) from public.rating_history r where r.game_id in (select id from %1$I.games)
    except all select to_jsonb(r) from %1$I.rating_history r) union all (select to_jsonb(r) from %1$I.rating_history r
    except all select to_jsonb(r) from public.rating_history r where r.game_id in (select id from %1$I.games))) d', b) into n;
  if n > 0 then raise exception 'restore refused: % rating row(s) of backup games changed since the backup', n; end if;

  for t in select unnest(array['games', 'game_players', 'game_commands', 'game_invites']) loop
    execute format('create temp table restore_%1$s on commit drop as select * from %2$I.%1$I', t, b);
  end loop;
  -- An account deleted since the backup. A backup seat named an account that existed at the backup (its foreign key held
  -- in the snapshot), so a seat account that is not in auth.users now was deleted since the backup, by delete_account or
  -- by an owner's delete in auth.users (account_deletions records only the first). First leave out its solo games, as
  -- delete_account deletes them, with every row of them; a live copy (after an owner's delete) stays as it is. This runs
  -- before the next lines, which null the seat and so lose the account. Then apply its foreign key actions to the other
  -- backup rows.
  delete from restore_games r where r.kind = 'solo' and exists (select from restore_game_players p
    where p.game_id = r.id and p.user_id is not null and not exists (select from auth.users u where u.id = p.user_id));
  for t in select unnest(array['game_players', 'game_commands', 'game_invites']) loop
    execute format('delete from restore_%1$s c where not exists (select from restore_games g where g.id = c.game_id)', t);
  end loop;
  update restore_games r set created_by = null where not exists (select from auth.users u where u.id = r.created_by);
  update restore_game_players r set user_id = null where not exists (select from auth.users u where u.id = r.user_id);
  update restore_game_commands r set actor_id = null where not exists (select from auth.users u where u.id = r.actor_id);
  delete from restore_game_invites r where r.created_by is not null and not exists (select from auth.users u where u.id = r.created_by);
  update restore_game_invites r set used_by = null where not exists (select from auth.users u where u.id = r.used_by);

  delete from public.game_players where game_id in (select id from restore_games);
  delete from public.game_commands where game_id in (select id from restore_games);
  delete from public.game_invites where game_id in (select id from restore_games);

  execute shared into cols using b, 'games', array['id'];
  execute format('insert into public.games (id,%1$s) select id,%1$s from restore_games r where not exists (select from public.games g where g.id = r.id)', cols);
  execute format('update public.games g set (%1$s) = row(%2$s) from restore_games r where g.id = r.id', cols,
    (select string_agg('r.' || c, ',') from unnest(string_to_array(cols, ',')) c));
  for t in select unnest(array['game_players', 'game_commands', 'game_invites']) loop
    execute shared into cols using b, t, array[]::text[];
    execute format('insert into public.%1$I (%2$s) select %2$s from restore_%1$s', t, cols);
  end loop;

  execute format(disagree, 'public.games', 'public.game_commands') || ' and g.id in (select id from restore_games)' into n;
  if n > 0 then raise exception 'restore refused: % restored game(s) disagree with their command rows', n; end if;
end $$;
commit;
select (select count(*) from release_backup_20261022.games) as backup_games,
  (select count(*) from public.games g join release_backup_20261022.games k using (id) where g.revision = k.revision and g.status = k.status) as restored_games,
  (select count(*) from public.games g where not exists (select from release_backup_20261022.games k where k.id = g.id)) as newer_games_kept,
  (select count(*) from release_backup_20261022.games k where k.kind = 'solo' and exists (select from release_backup_20261022.game_players p
    where p.game_id = k.id and p.user_id is not null and not exists (select from auth.users u where u.id = p.user_id))) as erased_games_left_out,
  clock_timestamp() as restored_at;
