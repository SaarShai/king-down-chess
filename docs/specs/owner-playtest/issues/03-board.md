# Board, panels, history and idle motion

Status: resolved

The owner's playtest feedback (sections 4 and 5) asks for these changes. The lead's decisions 95, 96, 97 and 99 set the design.

## Answer

- Use the kit paper, edge, radius and panel shadow. Game panels have no scrim. Outside input closes only. Wide panels stay in the rail. Escape and the X return focus.
- Use three dots for Menu. Use switches for Symbols and Ribbon. Keep the stored motion speed. Put Resign at the bottom with its confirmation.
- Show the last opponent turn with faint source squares and a stronger final square. The first board input clears it and acts. Remove the Guard rule marks and notice. Keep piece help and real effects.
- Put history and Effects in a fixed 44 px strip. Show staged steps first, then turns and steps in reverse order. Effects counts source groups; each group lists its pieces. Use small rolled ends on plain paper.
- Undo changes the board at once. Its removed line wipes for 200 ms. Reduced motion removes it at once. Read the system setting at the action to avoid a preference-change race.
- Use 12 px coordinates with the same typeface and no box. Kit ink gives sampled contrast of 5.34 on grey and 9.53 on light stone.
- Use existing character clips with random pauses and three board slots. A selected piece uses a slot. The portrait has its own clock. Reduced motion stops both. No idle waits for input.

Resting Pawn motion was off because the new page sets `quiet`, which disables legacy Pawn motion. The new page now uses the character clips under one shared limit. The manifest needs no edit.

## Scope

The shared people-sheet frame and its tests change for the web Close and Cancel X. No host, controller, New game, layout, hand or power-coin source changes. The opponent row changes only for the Menu icon. The browser runner accepts the lane's fixed preview port, 5443.

## Checks

| Command | Result |
| --- | --- |
| Focused `npm test` | 140 pass in 8 files: marks, history, reading, menus, idle schedule, painted view, people pages and safety. |
| Renderer `.mjs` cases through `npm test` | 114 pass. |
| Full `npm test` | 6,990 pass; 6 fail; 385 skip. See below. |
| Email-flow repeat through `npm test` | 1 pass; 28 cases not selected. Name: `email and code errors use product copy`. |
| `npm run test:docs` | 195 pass; 1 skip; 19 files pass. |
| `npm run typecheck` | Both projects pass. |
| `npm run build` | Pass. |
| `npm run check:browser owner-playtest-b` | 1 check passes; all 6 cases pass. Board idle maximum: 3. |

The focused run uses `KINGDOWN_TEST_FILE` with the eight file paths. In this base, `none` selects no files. The renderer run selects `{docs/2d-first-pieces,src/render/painted}/**/*.test.mjs`.

Five full-run failures are in source files unchanged from base `8fc21159`: one game-boundary case, two saved-game cases and two online game-type cases. The sixth is the email-flow timeout at `pages.test.ts:367`. It passes in the focused run and in the isolated repeat. Its cause is not confirmed. The full suite stays red. No test is removed or weakened.

## Evidence and limits

Evidence is in `/Users/za/Documents/king down (fresh)/runs/launch/owner-playtest/build/`: `b-shots/`, `b-logs/` and `b-board.md`.

The five required states have samples at 390x844, 360x640, 844x390 and 1440x900. Card, rule and portrait samples are also present. The contact sheets receive visual review.

The browser check uses Chromium with mouse, touch and keyboard. It checks outside input, focus, Escape, Undo, the history, stored switches and reduced motion. No physical phone, other browser, live sign-in, full old-page browser regression or database suite is checked. No push, pull request or deploy runs.

## Merged repair

Armed targets act in the normal reader. The short reader shares space with history and returns it after Cancel or Undo. History shows the newest action once. The unused game-page replay controller is removed.

[Ticket 05](05-merged-repair.md) records the shared state and layout repairs and their final checks. It supersedes the base-fault limits in this lane report.
