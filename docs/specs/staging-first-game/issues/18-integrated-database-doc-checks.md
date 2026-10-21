# Integrated database and rule-document checks

Status: in progress. Parent: U09. No live database changes.

The complete source run at `3e979f1b` finds two setup faults. The web-switch migration test reconstructs the schema through 0015, then uses the current game store, which now requires the 0017 admission column. All ten cases stop before their assertions. The test must isolate the absent switch on current game storage; it must not claim to execute the historical plugin. Keep its data-preservation, repeatability, runtime grants, browser denial and fail-closed assertions. The separate migration suite covers applying the complete migration sequence in order.

The AGENTS test section has 144 words against its existing 120-word limit. Compress the same rules, including focused-run reporting and detached commands; do not raise the limit or remove the check.

Verify both full affected files through `npm test` with the disposable PostgreSQL database, including typecheck and artwork checks. Request an independent read before normal commit hooks. The complete combined source gate remains open.

The selected run passes both complete files: 60 tests, no skips, full typecheck and 54 artwork checks. All ten database cases now execute. Log: `/tmp/kingdown-u09-db-docs.log`, exit 0, 1.80 seconds for the test files. This is a focused result, not a full-suite pass.
