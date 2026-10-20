# Establish the ownership baseline and prove signature mechanics

Type: task
Status: resolved
Parent: U04, with cross-host preservation evidence for U05.

## Question

What is the smallest complete game-owned boundary that preserves current mechanics and permits differently configured games to run safely?

## Checkable work

- Inspect current engine globals, scoped entry points, worker caches and product callers.
- Reuse archived/current fixtures for a differential test before changing behavior.
- Compare interleaved/nested/exception paths and alternating search against fresh-worker results.
- Select the smallest viable ownership approach and record its integration requirements. Keep the experiment test-local; broader caller migration and its import guard follow this baseline ticket.
- Demonstrate an actual fairy-piece action, card effect and king-power effect through web and ChatGPT in staging. Compare the same game history, uses and continuation after switching surfaces.
- Run focused checks, independent review and staging-only deployment if required.

## Constraints

Root owns shared source and browser work. Read-only explorers inspect separate questions. Parallel writers require isolated worktrees. No dependency, art, rule, rating or production change is part of this task.

Use the corrected native Chrome first-load procedure from `docs/specs/staging-first-game/chatgpt-connection.md`. Browser-control attachment before startup is not a valid clean-load control.

## Assigned checks

- The isolated ownership experiment reuses current continuation fixtures and search probes. It checks deep snapshot ownership, nested calls, exceptions and asynchronous escape before any broad extraction.
- The isolated `web-game` check adds a deterministic friend game with fairy pieces, cards and March. It alternates actual HTTP/MCP handlers, checks Maester swap and Morph, and compares accepted state after reload. Existing hidden-setup, Haste and lost-reply cases remain.
- Root creates a separate real-host staging computer game with fairy pieces, March and the explicit Freeze/Ice Wall/Morph/Vault hand. Actual effects and saved history must agree when switching web and ChatGPT. The real-host computer replies need not match the deterministic friend's replies.

## Answer

The baseline supports immutable game definitions with a private synchronous rules scope for the current helpers. Search also needs game ownership. A rules scope alone does not isolate its shared tables and scratch state. Keep the existing server workers and reset policy. Retain a browser worker's warm search state within its game; do not reset it after every action.

The test-only candidate covers deep copies, nested calls, validation and callback errors, asynchronous rejection, preview, replay, undo, setup, status, notation and legal-search helpers. The existing Workshop scope restores top-level fields after errors but permits nested-object aliasing. The candidate is private: rejecting a returned promise cannot prevent arbitrary callbacks from scheduling later work. It restores design-derived evaluation values, not arbitrary evaluator overrides.

A fixed-depth search gives a concrete counterexample. For the full fairy army, fresh current rules choose `c2-c3` with score 13; fresh 2017 rules choose `Mf1<>g1` with score 3. Reusing the current-rules search tables under 2017 rules returns `c2-c3` with score 13. Clearing search state restores the fresh results, including node counts. This proves the existing hazard; it does not prove a production cache-switch implementation or browser performance.

## Integrated checks

- `2005de7f`: extends `tools/web-game-check.mjs`. The real HTTP/MCP service accepts a complete friend game with fairy pieces, Cards and March. Assertions cover setup, `e3-e5`, `Ma1<>a2`, website Morph to a knight, exact history, revisions, only the correct card spent, stored command surfaces, reload and a shared resignation result.
- `e0207b44`: adds the test-only scope/search experiment and one archived continuation row. The row uses Archer Haste, four cards and always-on March.
- Focused `npm test`: 20 isolation tests pass; 129 engine tests pass and 11 database-gated tests skip because that command has no database configuration. Required artwork checks pass (53 per invocation). The separate database-backed browser check passes in 25 seconds.
- `npm run test:docs`: 161 checks pass after the records are added. Product files under `src/` have no diff from the starting commit.
- Independent readers review both changes. No confirmed fix remains. Their limits are included above and in the host record.

Exact focused commands use `KINGDOWN_TEST_FILE=tools/rule-isolation.test.ts npm test` and `KINGDOWN_TEST_FILE=tools/engines.test.ts npm test`. The isolation report invocation also sets `KINGDOWN_ISOLATION_REPORT=/tmp/kd-rule-isolation`. The browser command is `npm run check:browser web-game` with the disposable test database configured. Test output is in the task transcript; the two search reports and the browser log, manifest and screenshots are copied to the workspace evidence folder. The browser manifest records the pre-commit base; its tested patch is preserved by `2005de7f`.

## Real staging proof

See [the signature-mechanics record](../staging-proof.md). In one saved computer game, the website plays `e2-e3`; ChatGPT plays March `e3-e5`; the website plays Maester `Mc1<>c2`; ChatGPT plays Morph `!IP:b2=N`. The computer replies after each accepted turn and also uses Morph. Website reload and ChatGPT board refresh show the same eight-action history, the same transformed pieces and both spent Morph cards.

This change adds tests and records only. Product source remains `01cbe379` on the existing staging preview. No new deployment, migration, production action or gameplay change is needed.

Both isolated writer worktrees are removed after their clean commits are integrated and their evidence is preserved. Other worktrees remain unchanged.

## Next

U04 remains open. [Ticket 02](02-owned-game-boundary.md) must prove compiled multi-action search, cancellation and retained per-game state before completing the product boundary and import guard. This baseline does not claim full roster combinations, all evaluator configurations or the U05 acceptance matrix.
