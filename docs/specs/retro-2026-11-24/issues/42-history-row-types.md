# Compare the database columns with the hand-written row types

Status: ready-for-agent
Source: the change rehearsals and guard checks of 2026-11-25 ([ticket 10](10-change-rehearsals.md), [ticket 11](11-guards-that-cannot-fail.md), [ticket 12](12-lessons-and-checks.md))

## Problem
- A migration that adds a column (supabase/migrations/NNNN_*.sql) must also change the hand-written row types and queries in src/match/store.ts, src/online/jobs.ts and src/account/*. The project has no generated database types. Nothing fails when a column has no type.
- These files are class C code. This lane cannot change them.

## Change
Add a database test (*.db.test.ts, for example tools/plugin-db/row-types.db.test.ts). It applies all migrations to the disposable test database (PLUGIN_TEST_DATABASE_URL) and reads information_schema.columns for each kingdown_* table and each public table that the server writes. It compares the columns with one typed key list for each row type: `const gameRow = { id: true, ... } satisfies Record<keyof GameRow, true>`. The key list needs a type-only export of each row type from its class C file. Failure text: `table T has column C; add it to the row type in <file>`, and the reverse for a key with no column.

## Test that fails first
Add a fake migration that adds a column to public.games. The new test is red and names the table, the column and src/match/store.ts.

## Known limits
- A db test needs the disposable database. It does not run in npm run test:docs.
- A type-only export from a class C file needs the class C review.
- A column that no code reads needs an exempt list with a reason.

## Work record
Not started.
