# Hand, power coins and Your games

Status: resolved

## Scope

Build decisions 94 and 98 from the owner playtest brief. Use the approved Hand sample and the existing emblems. Work on branch `owner-playtest-h` only.

Keep the coin and hand in one row. Keep Menu at the edge of the opponent group. Keep both hands in a cards-only game. Give Your games three full rows and half of the fourth. Keep the open state outside the Play redraw.

## Checks

- Focused layout, coin and list tests: 17 pass in 2 files. Command: `TMPDIR=/private/tmp/kd-h KINGDOWN_TEST_FILE='src/interface/play/{layout,resources}.test.ts' npm test`.
- Browser check: 193 pass. Run `verify-hand.mjs` in this folder against port 5444, with `PLAYABLE_OUT` set to the evidence folder. It uses local account replies. It checks four sizes, card use and resume, power states, Ribbon, long card names, two, four and six games, and a real host redraw with the list open.
- Full `npm test`: 6,988 pass, 385 skip, 5 fail in 3 unchanged base files. The node test phase does not start after these failures.
- `npm run test:docs`: 195 pass, 1 skip. Type checks and the build pass.
- The design check reports no finding. `git diff --check` passes.

## Base failures

- `tools/game-boundary.test.ts`: `new-game.ts` imports `randomBackRank` outside the owned boundary.
- `saved.test.ts`: the old cards label expects `cards` for a game with powers and cards. The cards-only save fixture uses the retired `Mirror` card and returns `kept`.
- `people/host/online.test.ts`: two old cases expect powers and manual king setup in a cards game.

Leave these files for the lead. The browser check deals released cards with no king powers, plays a whole turn and resumes the used hand.

## Choices

The compact hand row uses 96 px. The board keeps 44 px squares at 360×640; the reader takes the remaining 64 px. The tall row uses 112 px and the wide row uses 144 px. A lifted card stays below the home rank. Both sides use the existing emblems and the house button. No new art or kit API is needed.

The opponent identity and resources stay together. Menu has its own space at the edge. On phones, game rows omit the small portrait to keep the 140 px board, name and turn status clear. The partial fourth row is inert until the list opens. The list state stays in `main.ts` outside the redraw.

## Evidence and limits

Evidence: `/Users/za/Documents/king down (fresh)/runs/launch/owner-playtest/build/h-shots/` (58 screenshots and `checks.json`). Logs are beside that folder. A first focused command uses the shared brief's `KINGDOWN_TEST_FILE=none` form; this checkout selects no test with that form. The brace selector above passes.

No live account or physical phone check is made. No deploy or push is made. No file owned by another lane changes.
