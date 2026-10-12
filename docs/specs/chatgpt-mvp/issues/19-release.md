# 19 · Release to the private testers

Status: needs-info
Type: HITL (every deploy needs the owner's word)
Size: M
Release gate: the approved main commit and the live checks. Ticket 18 is merged.

## Scope

- The owner checks two Supabase settings: sessions signed with an asymmetric key; a trigger allowed on `auth.sessions`.
- The branch's release order (`supabase/README.md`), with every migration after 0009 (0010 to 0012 of tickets 06 to 08, and the settings migration of ticket 10) and its role block.
- The move to `https://kingdown.dev/mcp` (multiplayer branch ticket 03 steps: OAuth client, redirect URLs, Vercel env, the publish path).
- Live checks with two test accounts on ChatGPT web and the iPhone app: each play mode, each toggle mix once, the side-panel and sidebar entries (if they do not show for the private plugin, record it and release without them), the profile, the settings, the CSP for the art.
- A short tester guide.
- No email or push (spec Q3): from `supabase/ops/cron.sql`, schedule only `kingdown-tick`, `kingdown-daily` and `kingdown-cron-history`; never `kingdown-outbox` or `kingdown-reminders`. The README directs this MVP to its release copy. If an older deploy made those two jobs, remove them with `cron.unschedule`. Keep `RESEND_API_KEY` and `KINGDOWN_MAIL_FROM` unset. The tick is necessary: it ends expired setups, friend codes and 24-hour open games. Outbox rows then stay with `done_at` null (`cleanup()` deletes only finished rows); record it.
- Live check on the web and the iPhone: does the board's 3-second check show approval prompts under "Always ask"?

Preparation: The [runbook](../release/RUNBOOK.md), [MVP cron SQL](../release/cron-mvp.sql), [tester guide](../release/TESTER-GUIDE.md), and [live checks](../release/LIVE-CHECKS.md) prepare the release. No live action runs. The runbook records the plan, checks, and release gaps.

## Open items

- Live steps stay open. Use the owner checklist after the deploy change joins the approved main release.

## Final packet plan

Owner, 2026-10-12: "do ticket 19 and anything else you need to do to get it ready to go live. don't stop to ask me."

Preparation only, on `claude/mvp-19-docs`. The deploy agent owns the deploy code and hosting guide.

1. Add one failing SQL packet test. Add the guarded file, then test its success and failure on a private local database.
2. Match the deletion and privacy text to the database and account code.
3. Update the runbook, cron checks, screen words and owner checklist for the final build.
4. Run `npm test`, the database checks and the page check if needed. Commit and push this branch.

Pass criteria: the SQL packet keeps the source statements and applies in one transaction. It refuses a missing foundation or role grant before any change. Runtime startup probes pass after it runs. The packet uses the one-project deploy commands and the final screen words. No live action runs.


## Final packet result

Branch: `claude/mvp-19-docs`. Base: `9eea0846`. Preparation is complete. Live release stays open.

- The runbook and guides use the one-project deploy contract and the final screens. The owner checklist has 120 lines. It names each private setup, SQL paste, publish command, test-account step and recovery check.
- `apply-0010-0013.sql` checks the foundation and runtime grants, then applies migrations 0010–0013 and blocks 7–9 in one transaction. It includes the board-delete grant. The source-text test prevents drift.
- The deletion page now states the seven-day grace, new-sign-in cancel, token-refresh rule, daily deletion and retained records. The privacy page now covers handles, preset pictures, ratings, badges, reports, the OAuth link and the same grace. It keeps the provider-picture disclosure for the website account menu. Page styles stay the same.
- The database README names 0002–0004 and points to the MVP cron file. The cron check confirms the source helper, schedules, Vault name and server header. Neither cron SQL copy needs a change.

Checks:

- Red: the absent SQL file fails the source-text test. Green: `npm test` passes 2,240 tests; 124 skip; 50 artwork tests pass.
- Red: all three missing-prerequisite cases fail because the unguarded paste accepts them. The clean 0009 upgrade and runtime probes already pass.
- Final: `PLUGIN_TEST_DATABASE_URL` names `kingdown_mvp19docs_test` on `127.0.0.1:55432`. `npm test` passes 2,361 tests in 158 files; 8 skip; 50 artwork tests pass. New packet checks: 5 pass (4 database, 1 source text). Other database checks under `tools/plugin-db`: 5 pass. Cron checks: 2 pass.
- The SQL test uses its own `kingdown_mvp19docs_release19docs_test` copy. Missing invite table, sign-in trigger and cancellation grant each raise a clear exception. Schema, grants and test data stay the same after rollback. The clean upgrade passes every startup probe as the runtime role.
- Document links and `git diff --check` pass. `plugin-ui` does not read the two legal pages, so no browser check is needed for this text change. The deploy live check compares built page bytes; it pins no text and needs no change.

Open items: the merger integrates the deploy and document branches and reviews the final diff. The owner completes Auth, backup, OAuth, environment, publication, SQL, cron, test-account and web/iPhone live steps. All live result cells stay empty. No live action runs here.
