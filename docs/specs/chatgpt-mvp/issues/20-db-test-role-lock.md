# 20 · One role lock for the whole test database server

Status: ready-for-agent
Type: AFK
Size: S
Blocked by: none

## Problem

The database tests (`src/online/accounts.db.test.ts`, `src/match/service.db.test.ts`, `src/online/jobs.db.test.ts`) and `tools/plugin-db/bootstrap-test.mjs` create, grant and drop roles. Roles belong to the whole PostgreSQL server, not to one database. The tests guard role changes with `pg_advisory_lock(7_007_007)`, but an advisory lock belongs to one database. Two worktrees with two test databases on the same server (127.0.0.1:55432) therefore do not wait for each other, and PostgreSQL reports "deadlock detected" (ticket 17, run 4; the fold-in of 2026-10-11, `accounts.db.test.ts`). The shared `npm test` lock (PR #53) does not cover a bootstrap that runs outside `npm test`.

## Scope

- One helper that holds the role lock on the server's `postgres` database (shared by every test database on that server) while it runs a role change; the three tests and the bootstrap use it for every create, grant, alter and drop of a role.
- No change to production SQL or to the runtime role.

## Acceptance

- A test runs two role changes at the same time from two different test databases and shows that the second waits for the first (no deadlock, no overlap).
- `npm test` with a test database passes; `npm run plugin:db:init-test` passes.
- AGENTS rule kept: each agent uses its own test database.
