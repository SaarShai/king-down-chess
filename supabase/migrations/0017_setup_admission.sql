-- Drawn setups keep finite admission rules and an existing engine fingerprint across releases.
-- Do not infer a baseline for old unstamped pending games.
alter table public.games add column if not exists setup_admission jsonb
  check (jsonb_typeof(setup_admission) = 'object' and octet_length(setup_admission::text) <= 4096);
