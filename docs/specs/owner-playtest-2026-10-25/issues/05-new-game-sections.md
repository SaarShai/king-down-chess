# 05 — New game sections

Status: resolved
Type: task

## Owner words

- F-116: "in \"the game\", fairy pieces should be collapsible. no need for a \"kinds\" button. the kinds should appear below when expanded. \"arrangement\" should just be a toggle with the text \"first rank sorting: random | player\". (random and player are the options)."
- F-117: "\"cards\" - also collapsible. no \"cards\" button. all the cards should be shown when expanded, but scrollable inside a limited-height \"cards\" section. the cards themselves should just show the artwork and the name, not the description (that is shown when clicking on the card to see the full card. \"Use all cards. These are examples. The deal takes 4 at random from your pool.\" - remove."

The owner approves this build. The owner checks the final images before merge.

## Decisions

- Fairy pieces and Cards have separate section buttons and switches. On opens a section. Off closes it. A section button works only with its switch on.
- Each header has an icon, title, count and arrow. Ranked hides both sections.
- Fairy pieces shows First rank sorting, then all kinds with the current art, lines and locks. Random sends `arrangement: false`. Player sends `arrangement: true`. The king and pawns stay in. The pool keeps at least seven pieces. Classic chess keeps its row.
- Cards shows Choose cards and all deal cards. The box shows about two rows and scrolls inside itself. It contains scroll movement and fits at 320 pixels.
- Each tile has art, a name and a separate checkbox. The checkbox has a 44 pixel target and the name Use plus the card name. An unused card is dim.
- A tile opens one full card in the current sheet. It has art, name, rule, cost and the pool checkbox. Close restores tile focus. A saved `card:<name>` sheet returns on mount. Old `pieces` and `cards` values clear without a sheet.
- Use all cards keeps at least four checked cards and locks the last four. Pick four starts empty and stops at four. A mode round trip keeps the current all-card pool. An incomplete pool shows how many cards it needs. Start sends no Create for that pool.
- Stored fields, protocol and server rules stay the same. The account website shares this screen. Check the local game for a separate copy.

## Plan

1. Capture the base at 1280 and 390 pixels.
2. Add the section tests. Record their failures before the code change.
3. Move the controls inline. Remove the two pool sheets. Update all active callers, checks and current docs.
4. Run types, all affected test files, affected browser checks and doc checks.
5. Capture and inspect the final screens. Check the diff. Record the result and commit.

## Acceptance checks

- Both sections follow the switch, pointer and keyboard rules. Headers report their open state. Switches remain separate controls.
- The kinds and card pools keep their limits. Both sorting values reach Create.
- All card tiles show art and name only. The full sheet shows the full rule and cost. Checkbox changes do not open it.
- The grid scrolls inside its box at 1280, 390 and 320 pixels. No page scrolls sideways.
- Sheet mount, old sheet values, focus and Ranked pass.
- Required commands pass. All final PNG files pass a visual check.

## Check results

Logs use `/private/tmp/claude-501/ci87/run38/new-game-sections-files/`.
Images use `/private/tmp/claude-501/ci87/run38/shots/`.

- The base is `ea49966de18d2d61345f896a2f7329158e3217a0`.
- Both base images pass inspection. See `sections-before-1280.png` and `sections-before-390.png`.
- All seven new checks fail before the source change. See `red-tests.log`.
- The first section run passes 35 tests. One test tries to click the disabled off-state button. It now sends that tap and checks the closed body. See `green-sections.log`.
- The first wider run passes 334 tests and fails 15. The failures identify old Random selectors, two old Cards Done calls, a test that loses its place in a changing checked list, and two phone target checks. See `focused-tests.log`.
- Opponent selectors now use the modes fieldset. Sorting selectors use the sorting fieldset. The header button and switch have separate boxes. The size helper counts a labelled checkbox as part of its label and checks each separate card checkbox.
- The type check passes. All 178 doc checks pass. See `typecheck.log` and `docs.log`.
- The design scan finds one existing king image with no static source. Render sets its source before display. See `design-detect.json`.

## Source check

The account website uses this plugin screen. The local game has no copy of these two pools. It needs no source change.
The piece model, stored fields, protocol and server rules keep their values. Start checks the options before it makes a command.
The pools use stable DOM nodes. A pool edit keeps the current scroll position and focus.
The current specs and capture tool use the inline pools. Past screen names, measurements and owner quotes keep their source meaning. The feature label is First rank sorting (review item R9).


## Final result

- All 694 tests in the 21 setup-related files pass. The 57 art checks pass. See `focused-complete.log`.
- The restored card sheet opens Game options before it sets tile focus. All 36 owner and sheet tests pass after this fix. See `focus-green.log`.
- The visual check makes the card check marks smaller. Their labels keep a 44 pixel target, or 48 pixels with touch. The card box has a clear gap below Choose cards. All 68 owner, sheet and phone tests pass. The 57 art checks pass. See `visual-green.log`.
- The first browser run stops after a helper error. The animation check needs a page, not a box locator. The helper now checks its own box. See `browser.log`.
- The next run passes plugin-ui, plugin-ui-http, game-screen, new-game and plugin-ui-http-staging. Both web modes find a selector made from the old Arrangement key. The web helper now uses the sorting radios and sets each other switch directly. See `browser-repair.log`.
- Both web modes pass after this fix. See `web-green.log`.
- WebKit plugin-ui passes in 330 seconds, within its current limit. See `webkit.log`.
- The type check and all 178 doc tests pass again. See `typecheck-checked.log` and `docs-checked.log`.
- No live publish appears before a browser command. Each browser command keeps the same checkout. See `publish-check.log`.
- All eight final images pass inspection. The cards scroll inside the box. The 320 pixel page has no sideways scroll. Full cards show the art, name, rule, cost and pool control. Both off switches close their sections. See `screenshots.json` and `final-capture.log`.

The image set is `sections-after-fairy-{1280,390}.png`,
`sections-after-cards-{1280,390}.png`, `sections-after-card-sheet-{1280,390}.png`,
`sections-after-off-390.png` and `sections-after-cards-320.png`.

## Review

The code check finds no need for another control layer. Native buttons, checkboxes,
segments and the current sheet keep the change small. The two old pool sheets are removed.
The stable pool nodes keep focus and scroll during edits. Start checks the active options
before any saved setting or Create call. The type, unit, browser and image evidence covers
both sorting values, pool limits, old sheet values, sheet restore and the small screen sizes.

The final commit gets the required check set again. Its logs use the `final-` prefix.
The report gives the commit and each final result. The full unit suite stays for CI.
The owner checks the images before merge. Independent review and CI remain before merge.
This task has no push, PR, merge or deploy.

## Review fixes

The independent review of commit `46c48b6e` lists the items R1 to R10.
Logs use `/private/tmp/claude-501/ci87/run38/agents/sections-fix-files/`.

- Merge: `origin/staging/first-game` merges with no conflict. The new waits in `tools/plugin-ui-check.mjs` stay.
- R1: Open games uses the Start pool guard. With an incomplete Pick four pool it stays on New game, opens Cards and sends no Find. The new owner test fails before the fix (the lobby opens) and passes after. See `r1-r6-before.log`.
- R2: the tester guide and the QA protocol name the sections, First rank sorting, the card tiles with their corner boxes and the full card sheet.
- R3: the card check helper again checks the 140 ms transition and the 3 px lift, the fit at 197, 393 and 1000 pixels (with 1280, 390 and 320), the Close, Escape, scrim and Done exits with focus back on the tile, no infinite animation in the full card sheet, and the names Mirror and Morph.
- R3, not restored: "Close, Escape and scrim keep the last valid pool" no longer applies, because each tap changes the pool at once. The Done refusals ("Choose exactly 4 cards.", "Keep at least 4 cards checked.") no longer apply, because the pool has no Done step; the inline locks and the Start guard replace them.
- R4: the old `pieces` and `cards` sheet test saves the value, waits for the host widget state, tears the frame down and remounts it.
- R5: the visible card check is an 18 pixel box in the tile corner. Its clear 44 pixel hit area reaches 8 pixels past the tile corner, inside the box padding. The focus ring marks the visible box. Names break only between words. Under a 260 pixel container the box uses one column.
- R6: a blocked Start or Open games writes the status into the `role="status"` region `#setup-start-status`. The region clears first, so each blocked press speaks. Focus stays on the pressed control.
- R9: the feature label "Arrangement" is "First rank sorting" in the lobby key, the badges and the invite text. The stored field and the protocol keep `arrangement`.

- Results on `bd1ed7c3`: the type check passes (`typecheck.log`). The six changed test files pass 189 of 189 tests (`focused-tests-final.log`). All 178 doc tests pass (`docs.log`). The browser checks plugin-ui (305.8 s) and new-game (27.7 s) pass after the live publish ends (`browser.log`, `publish-check.log`).
- Images: `sections-fix-390.png` and `sections-fix-197.png` show Cards open. The corner checks do not cover the art, and the names stay whole.
- Known limit: after the pool is complete, the hidden live region keeps its last text. It speaks nothing more.
