# Identify compiled card detail samples

Status: resolved; independent review and the full compiled plugin journey pass.

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
- The full registered `plugin-ui-http` check passes on `44e89092` in run `app-WTEsKA` (249.805 seconds). It retains the original failed-read, failed-command, failed-turn and open-sheet recovery assertions and passes the remaining real-HTTP/MCP journey with no browser errors. The parent evidence folder preserves its log and run record. The separate mechanics navigation failure does not invalidate this fixture correction.
