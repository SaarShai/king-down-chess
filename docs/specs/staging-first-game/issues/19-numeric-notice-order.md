# Keep notice ordering and cursors numeric

Status: source verified; integrated acceptance remains open. Parent: U09.

## Hypothesis and scope

The combined source run at `bdd45ea0` fails the actor-scoped notice test at its first page: IDs `96` and `95` precede the much larger IDs beginning `9007199`. The query selects `id::text` and orders by unqualified `id`, so the output text alias governs the sort. The cursor condition remains bigint. Reused test sequences can expose the defect between runs; the earlier pass does not establish numeric ordering.

Own only `src/online/accounts.db.test.ts`, `src/online/accounts.ts`, and this ticket. Use the existing disposable PostgreSQL suite and runtime role. Do not change root, live data, schema, DTO shape, cursor parsing or privacy projection.

## Plan and verification

1. Prepare a deterministic two-row regression for one fresh actor. Use exact string IDs `999999999999999999` and `1000000000000000000`, equal timestamps, and safe notice text plus private payload canaries. Both IDs fit PostgreSQL bigint and exceed safe JavaScript Number range.
2. Assert numeric newest-first order, exact safe string DTOs, continuation before the newest ID, and an empty result before the older ID. Preserve the existing pagination and privacy checks.
3. Wait for the parent to finish the active full suite and grant the CPU lane. Establish red through the focused registered `npm test` path before any product correction or database experiment.
4. If red confirms the hypothesis, qualify the underlying numeric notification ID in `ORDER BY`. Run the new regression and affected account tests with the disposable database, typecheck and art checks. Obtain independent read review and normal hooks before handing back a commit.

## Verified correction

The deterministic test fails before the product change: `999999999999999999` precedes `1000000000000000000` (one selected failure; 14 filtered). Log: `/tmp/kingdown-u09-numeric-notice-red.log`. This proves the wrong order without relying on a sequence value or random actor ordering.

The one-line correction uses `ORDER BY notifications.id DESC`, naming the underlying bigint column. Actor filtering, string IDs, cursor bounds/comparison, projection and DTO remain unchanged.

`PLUGIN_TEST_DATABASE_URL=<approved disposable loopback database> KINGDOWN_TEST_FILE='{src/online/accounts.db.test.ts,src/online/client.test.ts,src/online/runtime.test.ts,src/api/http.test.ts,src/api/http.db.test.ts}' KINGDOWN_TEST_NAME='PostgreSQL accounts and safety|notice|uses shared settings, handle validation and exact profile pagination' npm test` passes 20 selected cases; 103 are filtered. This includes all 15 accounts DB cases and five existing notice/pagination cases, including the real private HTTP/MCP projection. Typecheck and all 54 art checks pass. Duration: 3.56 s. Log: `/tmp/kingdown-u09-numeric-notice-green.log`.

Independent read review clears the regression and final query change with no should-fix. This is focused source evidence; the parent owns the exact combined release gate. No schema, archive, build, live-data or deployment change occurs here.
