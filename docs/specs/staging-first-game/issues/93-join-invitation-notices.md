# Keep Join invitation notices

Status: in review.

## Plan and acceptance

The release review finds that Join replaces service notices for unavailable invitations with a missing-code notice.

1. Test expired, closed and unavailable service replies on Join. Check preview and final Join replies.
2. Remove the unavailable-invitation rewrite. Update tests that expect the old words.
3. Run the full `npm test`, `npm run test:docs` and `npm run check:browser plugin-ui` with the shared locks. Commit, push and open a PR into `staging/first-game`.

The release review probes fail for all three notices before the fix. No deploy, sign-in or remote database is part of this work.

## Evidence

- The selected `keeps the .* service notice on Join replies` cases fail for expired, closed and unavailable replies before the fix. Each shows the missing-code notice.
- The first full test run finds missing packages in this worktree and two fixture text expectations. The worktree gets its own `npm ci` installation; the expectations now use the fixture reply.
- Full `npm test` passes: 270 files and 5,368 tests pass; 17 files and 342 tests are skipped. All 67 art checks pass.
- `npm run test:docs` passes: 16 files and 183 tests.
- `npm run check:browser plugin-ui` passes in 305.5 seconds. The test lock and shared browser locks are in use.
