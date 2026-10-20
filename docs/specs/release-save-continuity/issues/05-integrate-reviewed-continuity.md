# Integrate reviewed setup and browser-save continuity

Status: source checks passed; parent final review and integrated acceptance remain open.

## Plan and acceptance

1. Start a new isolated worktree at accepted root `ce61e8d7`. Apply only the reviewed candidates in order: `06127525`, `7f516cfa`, `4d214ce5`, `8aaf48dd`, `fd7eb155`. Record conflicts and preserve root's support, startup and lifecycle fixes.
2. Keep setup admission/engine pinning and browser-save recovery behavior unchanged. Resolve only integration conflicts; add no engine archive, loader, migration framework or recovery policy.
3. Reuse the prior setup source, compiled journey and picker-copy evidence, plus the 84-test browser-save evidence. Run one focused combined source selection through `npm test` after the shared lane is free. Run mandatory commit hooks in that lane.
4. Obtain the parent's final review before integration. Migration `0017_setup_admission.sql` remains required for account setup. Do no compiled check, staging database write or deployment here; the parent will combine preview work and run integrated acceptance once.

## Prior evidence

- Setup candidate `06127525`: 387 source tests and the archived N-to-N+1 continuation checks. Reviewed picker follow-ups `7f516cfa` and `4d214ce5`: compiled journey passes in 247.9 seconds; final copy/source selection passes 35 tests.
- Browser-save candidates `8aaf48dd` and `fd7eb155`: 84 focused tests cover complete restore, unreadable raw retention, remote validation, unavailable storage and explicit New game recovery.
- Prior test counts are reused evidence, not a new integrated run. Exact combined source evidence and conflict details will follow below.

## Application and conflicts

The five requested commits apply with `git cherry-pick --no-commit` in the stated order. There are no conflicts and no manual conflict resolutions. Git automatically merges `src/api/http.db.test.ts`: the new actor-only notice case remains present, while the two setup privacy checks exclude only the public admission roster from their secret-name scan. The private choices and hidden command checks remain in place.

No candidate product change is made during integration. The staged browser-save product files compare equal to `fd7eb155`; the staged setup and picker product files compare equal to `4d214ce5`. The only new file is this integration ticket. Root's support, lifecycle, cache proof and staging help navigation stay at `ce61e8d7`.

## Combined source verification

The one combined run uses the approved password-free disposable loopback template, with each database suite retaining its existing isolated suffix and role-lock behavior:

```
PLUGIN_TEST_DATABASE_URL=postgresql://kingdown_test@127.0.0.1:55432/kingdown_new_staging_test KINGDOWN_TEST_LOCK_WAIT=60 KINGDOWN_TEST_FILE='{src/{match/{setup,setup.db,match,service,service.db},plugin/screens/{seat-model,setup-model},plugin/{server,server.db},api/http.db,screen/{save,play},account/{sync,account},game}.test.ts,tools/{engines,plugin-screen-lifecycle,plugin-db/{release-order.docs,migrations.db}}.test.ts}' npm test
```

Result: exit 0, full typecheck, 19 files / 486 tests with no skips, and 54 art checks. Vitest duration is 27.62 seconds. Log: `/tmp/kingdown-u08-continuity-combined.log`. This selection joins the affected setup service/DB/transport/archive-inventory paths, picker model/lifecycle and legacy-save page/sync paths. The compiled setup and copy evidence above is reused; no compiled check repeats here.

## Remaining gates

- Root's read-only staging preflight reports zero unstamped pending games, four playing games and all seven required archives retained. It reports that `setup_admission` is absent. These are root's preflight observations, not a database operation by this worktree.
- Apply the add-only, nullable `supabase/migrations/0017_setup_admission.sql` through the root's approved staging process before serving this account setup code. Existing initialized games retain their saved state; do not infer an old pending setup or delete an archive.
- Root performs final review, combines the later preview candidate, and runs integrated compiled/native acceptance once. This source bundle authorizes no staging database change, deployment or public matching change.
