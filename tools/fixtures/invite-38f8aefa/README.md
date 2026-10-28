# Old invitation server fixture

`service.ts` and `store.ts` come from `src/match/` at `38f8aefa`.
Only import paths change. The transition test checks the source hashes.
Keep these files fixed. Use them only in tests.

`src/match/invite-transition.db.test.ts` runs token and code previews across release,
rollback, and restore with migration 0022. It holds real requests across each
change. Keep the unsafe orders as controls. Run the guide's current order too.
The PostgreSQL `verify` CI job collects this test through `npm test`.
