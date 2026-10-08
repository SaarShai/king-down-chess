-- Keep board ownership when its selected match is deleted.
begin;
alter table public.plugin_boards alter column match_id drop not null;
alter table public.plugin_boards drop constraint if exists plugin_boards_match_id_fkey;
alter table public.plugin_boards add constraint plugin_boards_match_id_fkey
 foreign key (match_id) references public.plugin_matches(id) on delete set null;
commit;
