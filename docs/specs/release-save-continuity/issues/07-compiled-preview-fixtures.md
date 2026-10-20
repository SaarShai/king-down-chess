# Identify compiled card detail samples

Status: prepared; parent review and compiled acceptance remain open.

## Plan and acceptance

1. Keep the existing card detail and recovery samples. Give their synthetic playing view the exact identity of the runtime supplied to `plugin-ui-check.mjs`.
2. Read that identity once from the built runtime's exported save and close the disposable worker before the samples run. Add no build, sentinel, configuration or product fallback.
3. Keep every failed-read, failed-command, poll recovery and failed-turn assertion. Include the card sheet text when a recovered card has no Use button.
4. Parent reviews the diff, then runs the existing registered `plugin-ui-http` check when the shared lane is free. No standalone build, test or hook runs in this worktree before lane release.

## Cause and correction

The combined compiled run at `0698807f` reaches `card-detail-check.mjs` and fails in `usable()` at line 82. Its synthetic view has a game ID, rules and legal moves, but no engine identity. Unknown identity now correctly requires a stored-engine preview. This sample has no stored game, and its intercepted Get repeats the same incomplete view. Retry cannot make the card usable.

The caller already receives the built function directory. It now imports that directory's runtime, creates one disposable match, reads the raw fingerprint from `exportSave()` and closes the worker in `finally`. The card detail sample uses that fingerprint. Product unknown-identity handling and server preview routing stay unchanged. Other compiled layout samples inherit their initialized game's identity.

## Evidence and limits

- Existing red evidence: `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/app-SWDHAx/plugin-ui-http.log`.
- Source inspection confirms the missing view field and the resulting blocked preview path. No new test mirrors this fixture correction.
- The existing compiled check is the regression acceptance. It must pass the original card recovery assertions and the remaining journey. It has not run on this change yet.
