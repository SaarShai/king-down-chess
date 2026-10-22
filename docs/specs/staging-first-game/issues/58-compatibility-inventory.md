# Write the compatibility inventory

Status: resolved. Parent: U09. Base: `73387e66`.

## What

Write one inventory of the compatibility code in `src/`, `tools/` and the migrations. For each item, give the supported data, where it lives, how to measure it, the removal trigger and the owner decision with a pick.

## Why

U09 acceptance says: "Compatibility code has a supported-data reason and removal policy". No inventory exists.

## Scope

One new file, [`docs/specs/release-save-continuity/compatibility-inventory.md`](../../release-save-continuity/compatibility-inventory.md), and this ticket. No source change. The `release-save-continuity` folder has no spec or index file that lists its documents, so no link line changes there.

## Acceptance

- Each item has supported data, where it lives, a removal trigger and an owner decision when one is needed.
- Each `shortcut:` comment in `src/` that names a compatibility fallback is listed.
- Each citation is correct at `73387e66`.
- `npm run test:docs` passes.

## Result

The inventory has 16 product items (C1–C16) and 3 development-tool items (T1–T3).

- All seven starting items are present. Their citations are correct at `73387e66`, with two small changes: `consent-config.ts:9-12` (the `if` starts at 9) and the match index range `129-141` (`createPinnedMatch` and `loadMatch`).
- The scan found these new items: the migration default (`0018_rating_policy.sql:3-4`), the legacy start retry callers (`service.ts:132,140,291`), the HTTP accept schema (`src/api/http.ts:80`), the profile help text (`profile.ts:49`), the old FEN field (`setup.ts:139-141`), `finishLinkedTurn` (`turn.ts:124-130`), the Workshop `ownLetter` field, the widget draft discard (`plugin/client.ts:26-27`), the old `kingdown-plugin` deploy target and OAuth client, and three research-tool items.
- `src/` has one `shortcut:` comment, `service.ts:429` (C1). The inventory lists it and says why each `ponytail:` comment is not a compatibility fallback.
- The scan used these terms in `src/` and `tools/`, without tests: `shortcut:`, `ponytail:`, `legacy`, `compat`, `old save`, `fallback`, `migrat`, `older`, `old link|client|field`, `pre-`.

Decisions for the owner (each with the pick in the inventory):

1. C1: remove the friend-code plain-hash fallback 7 days after the first production publish of this build. Pick: yes.
2. C2–C5: drop the `'legacy'` default after P. Remove the legacy accept, rating and start-retry paths when the SQL counts reach 0. Keep the `'legacy'` value and its labels for history. Pick: yes.
3. C14: remove the anon JWT branch after an operator confirms both hosts use `sb_publishable_` keys. Pick: yes.
4. C15: retire the `kingdown-plugin` project after the connector moves and the project is quiet for 7 days. Pick: yes.
5. C16: delete `src/online/deadline.ts` and its test. Pick: delete.

Checks:

- `npm run test:docs`: pass. `Test Files  13 passed (13)`, `Tests  161 passed (161)`.
- Full `npm test` does not run: this lane changes docs only (ticket scope).
