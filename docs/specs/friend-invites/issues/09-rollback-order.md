# Drain the new server before rollback

Status: resolved
Type: task

## Scope and checks

Stop new requests and drain the new server before the named invitation cancellation. Check the existing zero-count query before old-server traffic starts. Keep both SQL statements unchanged.

The rollback order test must fail before the fix and pass after it. Run the focused test and the doc checks. The release review found the read exposure; its database guards do not protect the old preview.

## Evidence

The release review found that the old preview exposes a late named invitation. The focused order test fails on the old steps and passes after the fix. `KINGDOWN_TEST_FILE=tools/invite-rollback.docs.test.ts npm test` passes one selected case, the type checks and 67 artwork cases. This is not a full-suite pass.

`npm run test:docs` passes all 181 cases in 16 files. Both SQL statements match the prior guide.
