# 19 · Release to the private testers

Status: needs-info
Type: HITL (every deploy needs the owner's word)
Size: M
Blocked by: 18

## Scope

- The owner checks two Supabase settings: sessions signed with an asymmetric key; a trigger allowed on `auth.sessions`.
- The branch's release order (`supabase/README.md`), with every migration after 0009 (0010 to 0012 of tickets 06 to 08, and the settings migration of ticket 10) and its role block.
- The move to `https://kingdown.dev/mcp` (multiplayer branch ticket 03 steps: OAuth client, redirect URLs, Vercel env, the publish path).
- Live checks with two test accounts on ChatGPT web and the iPhone app: each play mode, each toggle mix once, the side-panel and sidebar entries (if they do not show for the private plugin, record it and release without them), the profile, the settings, the CSP for the art.
- A short tester guide.
- No email or push (spec Q3): from `supabase/ops/cron.sql`, schedule only `kingdown-tick`, `kingdown-daily` and `kingdown-cron-history`; never `kingdown-outbox` or `kingdown-reminders`. The README says to paste the whole file, so paste a shorter copy. If an older deploy made those two jobs, remove them with `cron.unschedule`. Keep `RESEND_API_KEY` and `KINGDOWN_MAIL_FROM` unset. The tick is necessary: it ends expired setups, friend codes and 24-hour open games. Outbox rows then stay with `done_at` null (`cleanup()` deletes only finished rows); record it.
- Live check on the web and the iPhone: does the board's 3-second check show approval prompts under "Always ask"?
