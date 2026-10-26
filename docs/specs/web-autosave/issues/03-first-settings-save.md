# Save settings before the first saved game

Status: resolved
Type: bug

## Fault

PR #146 makes each settings change a settings-only save. A settings-only save keeps the stored game and changes only its settings. With no stored game, it writes nothing.
A fresh page or a `?fen=` position has no stored game until the first move. A settings change there is lost on reload.
The release 2 publish finds this fault: `visual-design` fails at "Show threats ... saved" because `kingdown.save` stays empty.

## Fix

`save()` in `src/screen/play.ts`: a settings change with no stored game saves the current game with the settings, as before PR #146.
The rule applies only outside a lesson and outside a cloud game, and only when this tab also loaded no saved game.
If another tab saves a game first, the settings change still changes only that tab's settings.
A failed storage read is not "no stored game": `readSave()` marks it `failed`, and the settings change writes no game (independent review, round 1, P2).

## Checks

- Red: `KINGDOWN_TEST_FILE=src/screen/play.test.ts npm test` without the fix: "saves the game with a settings change when no game is saved yet" fails; 76 pass.
- Green: `KINGDOWN_TEST_FILE='src/screen/{play,save,settings}.test.ts' npm test`: 95 pass. `src/account/sync.test.ts`: 42 pass.
- Review round 1: new tests "keeps another tab's game when a settings change follows an empty load" and "... when the settings read fails once". Without the read guard, the second fails; with it, `src/screen/{play,save}.test.ts` 97 pass.
- `npm run check:browser visual-design new-game home`: all 3 pass. On main `e320ff50`, `visual-design` fails.
