# Park side features for a lean build

Status: in review. PR #196 (branch `staging/park-lean`, into `staging/first-game`).
Source of truth for what is parked: [docs/PARKED.md](../../PARKED.md).

## 1. The owner's words

2026-10-28: "park all of these outside the build. we'll return to them later. we want this build to be lean and minimal ... the focus is on the game (computer, multiplayer) and its features."

Park means: no player-facing entry point, no wiring, and no parked code in the production bundle where an import chain is the only reason it ships. The source files stay. Old saved data still loads. No change to online play, the rules engine, the computer AI or the character animation work.

## 2. The plan

Each step is done when its check passes.

- [x] Workshop: remove `#title-workshop`, `#workshop-btn`, the `?design=` handler and "Bring a design". Move the design-in-a-game code from `src/new-game.ts` to `src/workshop/play-design.ts`. Check: the build has no `groundDialog`; a game link with a design still plays.
- [x] Lessons: remove Learn, the lesson shelf, `#lesson-progress`, `#next-lesson` and Show me; the Guide subtitle no longer names lessons. Keep `src/lessons.ts`. Check: the build has no lesson-shelf code.
- [x] Tricks and seals: remove the Tricks row and page, the seal dots and the `awardTurnSeals` calls. Check: the build has no `awardTurnSeals`.
- [x] Today's army and "Copy today's result". Check: the build has no "Copy today".
- [x] Lab armies under "More…" (example armies, Catapult lab, Ogre practice, Custom army). Check: a saved setup with a parked army loads as Random (`src/new-game.test.ts`).
- [x] The "Coming: Card mode" row.
- [x] The Extra page: Account moves to the main menu; This game goes. Check: `menu-extra` browser check.
- [x] Online Badges display and Collection screen. The server still writes badges. Check: `src/plugin/client.test.ts`, `tools/plugin-profile.test.ts`.
- [x] Remove the shipped CSS of parked elements. Check: `tools/parked-css.test.ts`.
- [x] Update the tests, browser checks and docs; add docs/PARKED.md and this ticket. Check: `tools/parked.docs.test.ts`, `npm run test:docs`.

## 3. Verification

At `067f6b78`:

- `npm test`: exit 0 (279 files, 5518 tests passed, 361 skipped; `node --test` 67 of 67).
- `npm run test:docs`: exit 0 (183 tests).
- `npm run build`: no main chunk holds `groundDialog`, `lesson-shelf`, `shelf-piece`, `awardTurnSeals`, `tricks-list`, "Today's army", "Bring a design" or "Coming". "Workshop" occurs only as a note string in the text and worker chunks (`workshop/model`, which the kept game-link design path needs).
- `npm run check:browser home menu-extra new-game`: 3 of 3 pass. At `50c492f1` the PR body lists the other browser checks that pass.
- The new tests fail on the old code: `client.test` (collection opens profile), `app-ui.test` (refuses Workshop), `new-game.test` (parked army loads as Random), `home.test` (a bare `?design=` opens Home).

At the round 3 fix commit: `tools/parked-css.test.ts` (1 test) and `tools/parked.docs.test.ts` (2 tests) fail on `067f6b78` and pass after the fix. The affected tests (`parked-css`, `tablet-controls`, `focus-contrast`, `plugin-ui-style`) and `npm run test:docs` pass.

Not run: `web-online` and `account-discovery` (they need a local test database).

## 4. Reviews

- Rounds 1 and 2, on `50c492f1`: two independent reviews (standards and spec) found six faults. `067f6b78` fixes them: a saved Collection page in the plugin client opens Profile; the new-game and painted-game browser checks keep the game-link design path (`tools/lib/design-link.mjs`); `qa` reads the FEN from `window.fen`; the `menu-extra` sheet checks move from Tricks to a long Account page; `app-ui` refuses the parked Workshop.
- Round 3, on `067f6b78`: an independent review found two faults and confirmed the verification above.
  1. Standards: the PR had no ticket in the specs folder (AGENTS.md). Fix: this ticket, and a link from docs/PARKED.md; `tools/parked.docs.test.ts` holds it.
  2. Low: `src/style.css` still shipped rules for parked elements: `#design`, `#army-strip .army-design` and `#copy`. Fix: the rules are removed; `tools/parked-css.test.ts` holds it.
