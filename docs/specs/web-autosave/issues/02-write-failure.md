# F3: Show a failed local save

Status: resolved
Type: task

## Scope

The owner requests this fix for audit finding F3. Work stays on `staging/web-autosave`.

## Plan

1. Reproduce a storage refusal with a focused test.
2. Return the write result. Keep a short notice while writes fail.
3. Clear the notice after a successful write. Retry the complete current game.
4. Run the focused tests and type checks. Commit this finding alone.

## Checks

- Quota and storage refusal keep the previous save and show a persistent notice.
- Ordinary refresh and selection do not clear the notice.
- A failed write does not notify account sync of a saved change.
- A later successful game write saves all moves and clears the notice.
- Record the failing and passing test runs here. Do not run browser checks or the full suite under the quiet lock.

## Result

The old writer catches a storage error and returns no result. The page cannot show that moves remain unsaved. The red tests reproduce both a quota error and a storage refusal.

`writeSave()` now returns success or failure. A failed write keeps a notice apart from tap and turn notices. The existing context live region shows `Changes not saved. Keep this tab open.` first. It keeps the current instruction and controls. It uses the existing refusal style. No new CSS or layout is needed.

A successful game write saves all current moves and clears the notice. A settings write clears only a settings failure. It cannot hide unsaved game moves. Only a successful write updates the game comparison and notifies account sync.

## Evidence

- Red: `KINGDOWN_TEST_FILE='src/screen/{play,save}.test.ts' KINGDOWN_TEST_NAME='failed local autosaves|the autosave' npm test`. Type checks pass. Five tests fail, three pass, and 37 skip. The writer returns `undefined`. The page has no save notice.
- Green: `KINGDOWN_TEST_FILE='src/screen/{play,save}.test.ts' npm test`. Type checks pass. Both files and all 45 tests pass.
- UI: `KINGDOWN_TEST_FILE=src/ui/table.test.ts npm test`. Type checks pass. All three cases pass. The notice stays first during a power choice, review, and a result. Cancel and Back to game stay available.
- Final focused check: `KINGDOWN_TEST_FILE='src/{screen/{play,save},ui/table,account/sync}.test.ts' npm test`. Type checks pass. All four files and 71 tests pass.
- Docs: `KINGDOWN_TEST_FILE='tools/{docs-index,model-names}.docs.test.ts' npm test`. Type checks pass. Both files and all nine tests pass. `git diff --check` passes.
- Review: The three failure states distinguish unsaved moves from unsaved settings. A single flag could clear the warning while moves remain unsaved. The change keeps the save format and the existing notice style.
- Limits: No browser check, full suite, or production request runs. Storage and DOM tests use substitutes. CI must check browser layout and real tab behavior.
