# Repair the confirmed independent-review findings

Status: claimed

## Authorization and scope

On October 8, 2026, the owner asks "fix" after the independent review. This covers the confirmed findings in ticket 12, including tickets 13 and 14. Keep the game rules and intentional swap/shove controls. Keep speculative capacity changes and unverified host behavior outside this repair.

## Plan and verification

1. Separate board selection from submission. Keep pass and armed powers explicit. Clamp keyboard movement by file and rank. Check same-square taps, drag start, Archer targets, Haste, Freeze and both orientations.
2. Keep the board owner when its selected game is deleted; clear only the selected match. Preserve ownership checks on existing boards. Check deleted-game Create, Resume and Join through the database and protocol paths.
3. Distinguish invalid input/moves from worker and provider failures. Keep temporary failures retryable and sanitized. Reject control characters before database access. Add focused service, auth and HTTP tests.
4. Correct setup and data records, limit consent to the approved providers, check board-table access at startup, preserve safe diagnostic categories, and protect deployment files in the push hook. Cover each changed boundary with the existing checks.
5. Run the full suite with the disposable database, runtime/protocol checks and named plugin browser checks. Review the diff, then prepare the pull request and release through the existing approved path.

No repair is complete until its regression check passes. Keep the original independent reports as historical records.

## Repair

Board selection cannot submit a move. A second tap clears selection. Source-square taps cannot submit pass or a shot; capture targets still submit an Archer shot. Powers that need arming use their named buttons. Keyboard movement stops at each file and rank edge.

Migration 0004 changes the board match link to nullable with `ON DELETE SET NULL`. It keeps the board UUID and owner. The same owner can Create, Resume or Join after MATCH_REMOVED. A foreign or unknown board still fails. Account deletion still removes that account's boards. Apply this migration before the new server starts. A board already removed by the old cascade still needs a fresh model-side Open; its lost owner record cannot be restored safely.

Worker faults return a fixed, retryable error. Known invalid moves remain definitive. Temporary provider faults return 503 without an OAuth challenge. Command control characters fail before database access. Startup checks board access, the recovery constraint and the audience allowlist. Logs keep only fixed error categories and request IDs. Consent shows Google and GitHub. The push guard covers the deployment folder and website routing file. Setup and data records now describe these paths.

## Checks before release

- All three named browser checks pass on the fixed tree: `plugin-ui` (15.5 s), `plugin-ui-http` (15.1 s), and `plugin-oauth` (2.9 s). Both board paths cover repeated source taps, drag start, Archer target submission, explicit Freeze, Haste, keyboard edges in both orientations, deleted-game recovery, and remount of the same board after recovery. They also retain move, computer, retry, friend, reopen and phone-width checks.
- The compiled server check passes with PostgreSQL: deleted selection, replacement in the same board, reload and foreign-account rejection, plus the existing move, computer, retry, restart and friend checks.
- The plugin build, runtime worker smoke and protocol check pass. The game rules and worker sources do not change.
- The full suite passes: 1,410 tests and 42 artwork checks, with type checking and PostgreSQL cases enabled. The repair uses a separate disposable database, `kingdown_plugin_review_test`. The original local test database keeps its old-main schema until main receives this repair.
- Source review checks that recovery preserves ownership, action selection uses the existing `needsArming` rule, and diagnostics cannot print raw error messages or connection URLs. No new dependency is needed.

## First release and host check

[PR 22](https://github.com/SaarShai/king-down-chess/pull/22) merges at `9807be01166f88596cec9293f58745682c361e89` after all three hosted checks pass. Production migration 0004 returns `preserves_board_owner = true`. The current compiled server passes production startup with the restricted login, TLS checks, board schema and exact OAuth audience.

The approved release script publishes deployment `dpl_8NgLfpapmpEEEVJshcxdJ9NCeRwc` at `https://kingdown-plugin.vercel.app`. It passes 1,410 tests, 42 artwork checks, compiled HTTP/database, worker and protocol checks, and all three browser checks (4.4 s, 17.6 s and 17.0 s). Unsigned live checks pass. The deployment dashboard shows zero error or fatal log entries in the first live-check window; the API log connector denies access, so the dashboard supplies this evidence.

The actual ChatGPT check detects cached old controls, even after a full chat reload. [Ticket 16](16-board-resource-cache.md) owns the cache repair and final live verification. This repair stays open until that check passes. The phone-width browser check is not a new native iPhone result. Broader beta scenarios and speculative capacity changes remain outside this repair.
