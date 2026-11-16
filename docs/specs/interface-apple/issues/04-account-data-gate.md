# Repair the account deletion races

Status: ready-for-human

## Scope

Use one account lock and writer generation for receipts, drafts, seen records and both old page writers. Bind deletion cleanup to the request session and generation. Bind sign-out to the expected stored session. Keep a later sign-in and its data. A page load with the closed session cannot open writes.

Keep the native invite repair and the first board deadline as they are. Add no dependency or database migration. Leave the changes uncommitted for the lead.

## Checks

Move all twelve review cases into the source test files. Keep each case's order and intent. Use the real installed auth library with fake storage and HTTP for the sign-out race. Check each repair with the repair removed in a scratch copy. Keep the signatures in that copy.

Run the focused tests, then the full suite, docs tests, type checks and build. Run one browser check for the page path. The external report holds the counts, logs and limits.

## Result

The shared gate checks the captured writer generation inside the account lock. Deletion checks the request session and generation before cleanup. A confirmed new session can open a new generation. An old page load cannot do this.

The account client gives auth storage and expected-session removal the same lock. It removes only the expected stored credentials. It revokes only the expected token, outside that lock. A late reply cannot remove a newer stored session.

All twelve review cases now live in the source test files. The 270 focused tests pass. The full suite passes 7,395 tests, with 17 skips. All 114 Node tests pass. The docs tests, both type checks, launch build and next-save browser check pass. The browser save fixture now starts after the existing launch notice and uses the current game row. All save checks stay. It also checks the exact resumed rules and first turn.

All 21 new tests fail with a corresponding repair removed in the scratch copy. The checks keep the signatures and reach test assertions. The save-result assertion also fails when its return is removed. The external repair report holds each result and the check limits. A final docs check runs after this record is written.

The native invite code and first board deadline stay unchanged. The changes stay uncommitted for the lead and independent review.
