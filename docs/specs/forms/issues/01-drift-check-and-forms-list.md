# Forms: the drift check and the forms list

Type: task
Status: resolved

The owner asks how to manage changes across the four forms (web app, iOS app, ChatGPT plugin, Muse connector), then says yes to two additions: a drift check and a forms list for each run of changes.

## Plan

1. Add `tools/forms-drift.test.ts`: the web piece names against the engine names, one short line with text for each king power and dealt card, and the hand size and switch count that the plugin tool text states.
2. Add `docs/FORMS.md`: the four forms, the forms list for a pull request, when each kind of change goes live, and the limit of old iOS builds.
3. Add the index line and one rule line in `AGENTS.md`.

Not in this ticket: the iOS sync step in CI, a script for the listing ZIP, and one shared name table for the two screens.

## Evidence

- `KINGDOWN_TEST_FILE=tools/forms-drift.test.ts npm test`: 3 tests pass. The full suite runs in CI on the pull request.
- `npm run typecheck` and `npm run test:docs`: pass.

## Comments

- Independent review, commit `146606ffb`: BLOCK. Medium: the doc said that an old iOS build gets its previews and moves from the server; this is true only for the old board. Low: an empty short line passed; the release timing had no conditions; no ticket.
- Repair: the old-iOS section states the limit and requires an old-app check for a rule change; the test requires text in each short line; the timing lines have their conditions; this ticket records the work.
