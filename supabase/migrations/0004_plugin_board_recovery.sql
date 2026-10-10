-- Keep board ownership when its selected match is deleted.
begin;
alter table public.plugin_boards alter column match_id drop not null;
-- 0006 points the key at public.games; a second run of this file must not point it back, or the boards
-- of online games fail the key and the run stops (npm run plugin:db:migrate runs 0002-0009 again).
do $$ begin
  if not exists (select from pg_constraint where conrelid = 'public.plugin_boards'::regclass
    and conname = 'plugin_boards_match_id_fkey' and confrelid = to_regclass('public.games')) then
    alter table public.plugin_boards drop constraint if exists plugin_boards_match_id_fkey;
    alter table public.plugin_boards add constraint plugin_boards_match_id_fkey
     foreign key (match_id) references public.plugin_matches(id) on delete set null;
  end if;
end $$;
commit;
