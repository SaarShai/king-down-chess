## Review of King Down match foundation and private ChatGPT plugin (target 860386f, baseline 7d4370f)

I read the source directly, the full diff and all eleven tickets. I ran no tests and no runtime checks. Every "evidence" line below names what I read, not what I executed.

## Standards

1. **Medium. Docs instruct bare vitest.** `docs/match-foundation.md:67` and `:69` tell the reader to run `npx vitest run src/match/match.test.ts ... -t "replay"`.
   - Requirement: AGENTS.md "Run the tests with `npm test` only... Do not run bare vitest". Ticket 01 step 2 (`issues/01-external-host-check.md:16`) claims "Remove alternate unit-test commands."
   - Impact: a reader follows a forbidden command; the ticket's completion claim is inaccurate.
   - Correction: replace both lines with `npm test` and name the test titles to look for in its output.

2. **Low. Deploy-critical files are outside the push guard.** `.githooks/pre-push.mjs:56-57` protects `src/`, `supabase/`, `tools/` and others, but not `plugin-deploy/` or `vercel.json`.
   - Trigger: a direct push to main that edits `plugin-deploy/runtime-role.sql` or the consent redirect in `vercel.json`.
   - Impact: production grants, the token hook template and the published consent route bypass "Code reaches main by pull request only" (AGENTS.md). `tools/deploy.sh:180` publishes `vercel.json` with the website.
   - Correction: add `plugin-deploy/` and `vercel.json` to `protectedPaths`.

3. **Low. Setup guide names only migration 0002; the grants block is duplicated.** `docs/plugin-preparation.md:54` and `:77` cite 0002 alone. `tools/plugin-db/migrate.ts:7` applies 0002 and 0003. `plugin-deploy/runtime-role.sql:29-36` repeats `plugin-deploy/board-grants.sql:1-8` word for word.
   - Impact: a fresh operator following the guide misses `plugin_boards`; two copies of the same grants can drift (duplicated logic).
   - Correction: name 0003 and the board grants in the guide; keep one copy of the block.

4. **Low. Consent page offers a provider the records do not list.** `src/plugin/consent.html:3` has a Facebook button. `docs/plugin-preparation.md:72` says "Google and GitHub sign-in"; ticket 01 line 26 says only those two are enabled.
   - Impact: if Facebook is off for this project, the live button sends the user to a provider error page.
   - Correction: confirm the enabled providers in Supabase, then remove the button or document Facebook. Request this as a one-line check in the next live session.

5. **Low. Startup error masks its cause.** `tools/plugin-server.mjs:42-45` catches any error from the allowlist query and throws "Install and configure the reviewed King Down OAuth audience hook allowlist".
   - Trigger: a TLS or connectivity failure, as in ticket 02.
   - Impact: an operator chases the hook when the database is unreachable.
   - Correction: compare `allowed.rows.length` outside the try, and rethrow query errors with `error.code` only.

6. **Low. Internal failures are logged with no diagnostic.** `src/plugin/server.ts:20` logs `{ tool, code: 'INTERNAL_ERROR' }` and `tools/plugin-server.mjs:40` logs a fixed string.
   - Impact: a production worker timeout or pool error cannot be told apart from any other failure. The protocol check correctly proves no secret leaks, but nothing is left to read.
   - Correction: log `error.name` and `error.code` plus a per-request ID; never the message body.

7. **Low. Evidence durability.** Tickets cite `/tmp/*.log` and `/tmp/*.jsonl` as the proof for test counts and the live revoke cycle (`issues/06:25`, `issues/09:57-63`, `issues/10:19,23,43`, `issues/11:19,25`). The iPhone pass is the owner's words "seems to be working" and "that worked" (`issues/11:31`).
   - Impact: none of these can be re-read from the repository; the spec acceptance (`spec.md:19`) rests on them.
   - Correction: copy the receipt digests and the revoke JSON into the ticket or `docs/research/`; keep the owner-report wording as it is, since the ticket already labels it.

8. **Smells (subjective).**
   - Feature envy: `src/match/service.ts:27,32,38` run raw SQL through `store.pool` while every other table access lives in `store.ts`. Move the three board queries into `PostgresMatchStore`.
   - Divergent change: `src/plugin/app.ts:47` and `:50` hard-code the server's board-accepting tool list and its definitive error codes. A new server code needs a client edit. A server-sent `_meta.definitive: true` flag removes the second list.
   - Naming: `tools/plugin-db-config.mjs:5,9` requires the literal `sslmode=require` but enforces verify-full behaviour. The name says less than the code does; a comment or a `sslmode=verify-full` requirement would match.

## Spec

1. **Medium. A deleted match bricks every board that selected it.** `src/plugin/server.ts:24-26` (`select`) calls `getBoard` before any action; `src/match/service.ts:33` throws FORBIDDEN when the board row is gone; `supabase/migrations/0003_plugin_boards.sql:6` cascades the row on match deletion.
   - Trigger: the opponent deletes their account (`plugin-beta-support.md:49` documents the cascade) or `deleteAccountMatches` runs. The shared match and all board rows pointing to it vanish.
   - Impact: the other player's open boards return "Board unavailable for this account" for Reload, New solo game, New friend game, Resume and Join, because `app.ts:47` attaches `boardId` to all of them. The player has no in-board recovery. This violates ticket 09's rule "Reload resolves that board UUID on the server" and the spec purpose "resume a game".
   - Evidence: code reading only; no test covers deletion of a selected match followed by a board action (`service.db.test.ts:25-39` deletes and then only asserts FORBIDDEN).
   - Correction: in `selectBoard`, use `insert ... on conflict (id) do update set match_id = excluded.match_id where plugin_boards.actor_id = excluded.actor_id`, and drop the pre-check in `select` for create, resume and join. FORBIDDEN stays for a row owned by another actor. Request a database test: delete the selected match, then create a game through the same board.

2. **Low. Definitive-rejection recovery is proven only in the fixture.** `src/plugin/app.ts:50-51` clears `pending` only when `result._meta.code` is in the definitive list; the server sets it at `src/plugin/server.ts:20`.
   - Trigger: a stale or illegal move in the real host, if ChatGPT does not pass `_meta` through to the widget.
   - Impact: Retry stays visible, each retry returns the same definitive error, and board taps stay blocked by `pending` (`app.ts:69`). The live record has a lost-result retry (`issues/06:29-31`) but no definitive rejection in ChatGPT.
   - Correction: also put the code in `structuredContent` (for example `{ error: code }`) and read either. Request one live check: play a move in the friend game from a stale board and confirm Retry disappears.

3. **Low. Own-piece re-selection is impossible when the piece is a swap or shove target.** `src/plugin/app.ts:70-73` submits the single ordinary option when the tapped square matches `move.to` or `move.shove.from`.
   - Trigger: Maester selected, tap an own piece it can swap with; or Ogre selected, tap an own piece it can shove.
   - Impact: the swap or shove is sent at once instead of selecting the tapped piece. The player must tap elsewhere first. Ticket 11 changed this policy for Haste but did not cover own-piece targets.
   - Correction: when the tapped square holds an own piece, re-select it and list the swap or shove under choices.

4. **Low. Every background poll costs a provider round trip, and its failure paints an error.** `src/plugin/auth.ts:38-44` calls `/auth/v1/user` on every request by design (ticket 10). `src/plugin/app.ts:110-112` polls `kingdown_get` every 3 seconds for a visible waiting or opponent-turn friend board. `app.ts:61` writes a background failure into `#error`.
   - Impact: one idle friend board makes about 20 provider calls a minute per widget. A transient provider or 503 admission failure shows an error on a board that did nothing. I cannot confirm a Supabase rate limit from the snapshot.
   - Correction: do not display background errors; back off the interval after a failure. Keep the no-cache rule for mutations. Request a measurement of provider request volume for one waiting board over ten minutes.

5. **Low. No per-actor bound on games or boards.** `src/plugin/server.ts:29-30` inserts a `plugin_boards` row on every `kingdown_open`, and creates a match on every `mode` call. `supabase/migrations/0003_plugin_boards.sql:3-7` has no `created_at`.
   - Impact: unbounded rows per account, each `create` spawns a worker and stores a snapshot; nothing can age rows out. Operation limits are documented (`plugin-preparation.md:66`), but no account-level cap exists.
   - Correction: add `created_at`, a per-actor open-match cap in `create`, and a retention delete.

6. **Low. Missing indexes on seat and foreign-key columns.** `src/match/store.ts:31` scans `plugin_matches` by `white_id or black_id` on every `kingdown_open`; `service.ts:75` deletes invites by `match_id`; cascades on `plugin_boards.match_id` and `plugin_match_invites.match_id` scan.
   - Correction: add indexes on `plugin_matches(white_id)`, `plugin_matches(black_id)`, `plugin_match_invites(match_id)`, `plugin_boards(match_id)`, `plugin_boards(actor_id)` in an additive migration.

7. **Low. Rollback failure masks the original error and returns a broken client.** `src/match/store.ts:19-20` awaits `rollback` in the catch and calls `release()` without the error.
   - Trigger: connection loss mid-transaction.
   - Impact: the caller sees the rollback error, and the dead client goes back to the pool.
   - Correction: wrap the rollback in its own try, then `client.release(error)`.

8. **Low. A control character in `lan` yields a non-definitive error.** `src/match/service.ts:12` accepts any string; `store.ts:35` casts the payload to jsonb, which rejects `\u0000` before move validation.
   - Impact: INTERNAL_ERROR, so the client keeps `pending` and retries forever. Only a hand-built client can send this.
   - Correction: reject control characters in `command()` with INVALID_INPUT.

9. **Test blind spots (no code defect found).**
   - `src/match/service.db.test.ts:15` skips the whole suite without the database variable. The website deploy and `test.yml` run `npm test` with those 12 cases skipped (ticket 01 line 72 confirms). The plugin deploy path enforces the variable; nothing else does.
   - No test reaches `MATCH_LIMIT` (`service.ts:52`) or the worker's 1,000-command bound.
   - No test covers the deleted-selected-match path (Spec 1).
   - The harness (`tools/plugin-ui-host.ts:18`) returns `_meta` exactly as the server does; the real host's handling is unrecorded (Spec 2).

**Verified with no finding.** Seat and turn checks use the stored actual turn, so Haste keeps the mover (`service.ts:54`, worker tests, `issues/06:41`). The commit path re-reads under `for update`, re-checks dedupe and revision, and writes receipt plus save in one transaction (`store.ts:40-49`). Identical retries return current authority; a different payload under the same ID conflicts. Lock order is match then invite in both `invite` and `join`, so no deadlock. Column grants match every statement the service issues; RLS policies exist only for the runtime role; browser roles have nothing. Cascade delete through the restricted role is proven by `service.db.test.ts:152-156`. JWT checks reject website, mixed and foreign audiences, then the provider lookup fails closed. The HTTP layer bounds body size, rejects batches, caps active work at four and keeps a slot until abandoned work settles. The consent page waits for the account choice before the existing-grant redirect, validates redirect targets and escapes its config. Temporary live controls and the `[DEBUG-selected-game]` trace are absent from the source; only the tickets mention them. No model name appears in the reviewed docs or code.

## Inspected and limitations

- Files: `src/match/{index,worker,service,store}.ts` and both tests; `src/plugin/{auth,http,server,app,consent,consent-config,view}.ts`, both HTML files, `app.css`, three tests; `plugin-deploy/*.sql`; `supabase/migrations/0002`, `0003`; `tools/plugin-*`, `tools/plugin-db/*`, `tools/deploy.sh`, `tools/deploy-plugin-*.mjs`, `tools/deploy.test.ts` (diff), `tools/check.mjs`, the check registry, `.github/workflows/plugin-checks.yml`, `vercel.json`, `package.json`, `tsconfig.json` and `vite.config.ts` (diff), `src/render/PaintedView.ts` pointer handling, `src/rules/engine.ts` Move shape, `src/ai/search.ts` time bound, `src/game.ts` history; the spec, all eleven tickets, the three guides, AGENTS.md, CLAUDE.md, TASKS.md, LESSONS.md Always and Index.
- Flows traced: move and computer retry after a lost reply; concurrent writers; invite and join races; board open, select and reload; widget-state replay on remount; touch select and destination tap; background polling during a user action; OAuth challenge, JWT and provider revocation; consent sign-in, account switch, approve and deny; the deploy gates, environment staging and unsigned live check.
- Limitations: the snapshot has no `node_modules`, so I could not confirm SDK behaviour for `_meta` pass-through or `ontoolresult` semantics. Git history and tests were unavailable; all test counts and live results are owner or ticket reports. I did not read `plugin-deploy/.env.example` from disk, only from the diff. I did not assess the website UI, workshop or balance work.