# 16 · Profile and collection

Status: resolved
Type: AFK
Size: M
Blocked by: 11

## Scope

- The scroll: totals; open games (your turn first; tap to resume); finished games with the details of spec Q11; "More" pages.
- The rating with "?" while provisional.
- The 10 badges, earned (with date) and not yet earned (with how to earn).
- Collection: every pool piece, king, power and the 21 cards, each with its one-line rule and "unlocked".

## Acceptance

- Browser check: the scroll after a few games; badges; the collection.

## Plan and checks

Base: local integration tip `1a2b0ecc`. Tickets 08, 10 and both parts of 11 are complete. Work stays on `claude/mvp-16-profile`.

Use the approved app-page seam (spec Testing Decisions, seam 4). Use the existing fixture seed and real tool calls. Each step starts with one failing page test, then makes it pass.

1. Add the check frame and seed a profile record. Show the name, picture, rounded rating, provisional mark and totals.
2. Put the shared open-game list on the scroll. Add finished rows and cursor paging.
3. Show all badges. A tap opens the badge sheet with its date or goal.
4. Add the four collection tabs. Read the game rule functions and load art through `art()`.
5. Check the three viewport sizes, remounts, hidden data, images and scroll rollers. Compare each sample state with the page.
6. Run the full tests, all browser checks, named plugin checks, build, server and protocol checks. Record page bytes. Commit, merge the current integration tip, test and push.

Checks use the disposable `kingdown_mvp16_test` database on `127.0.0.1:55432`. Finished rows use `_meta.history`; More passes `_meta.next_before` unchanged. Fixture open games are real games, not seeded inbox rows. HTTP results use a solo resignation, a friend's resignation and an agreed draw.

## Progress

- Header: the browser check first fails on the empty profile (`#profile-rating b`). After the build, the focused `npm test` passes 1 page test and all 50 art tests. The type check passes. `plugin-ui` passes. The name, picture, rating and totals come from `_meta`.
- Baseline build: 516,932 HTML bytes and 518,976 payload bytes. The first browser run stops on the existing threat-arrow check before it reaches this ticket's block. A later run passes that check and the profile header.
- Open games: the browser check first fails on the absent open rows. The page now calls the shared `gamesList` and keeps server order. A tap resumes the selected real game. The focused `npm test` passes 2 page tests and 50 art tests. `plugin-ui` passes. The scroll uses one border-image slice rule; its list scrolls between fixed rollers.
- Finished rows: the new page test first finds 0 rows instead of 20. It now passes all row details, old-save names and the second page. More sends the cursor unchanged, adds 3 rows without a repeat, then hides. The focused `npm test` passes 3 page tests and 50 art tests. The page and end card share `WHY`. The black king symbol uses the shared art module's `symbols` export because `art()` returns the white symbol only.
- Badges: the page test first finds 0 badges instead of 10. It now checks all 10, six earned dates, four grey badges, and the date or goal after a tap. The sheet uses the shared over dialog and scrim. The focused `npm test` passes 4 page tests and 50 art tests. `plugin-ui` passes. Profile styles stay in the profile section.
- Collection text check: `sample/data.js` keeps the printed readings. `docs/RULES.md` makes the balanced readings official. Nine powers and six cards differ. The page uses the required live readers without `setRules`. The test keeps the sample's unchanged lines and fixed current-rule words for the changed lines. The sample files stay unchanged.
- Collection: the test first finds 0 pieces instead of 11. All four tabs now pass: 11 pieces, 6 kings, 12 powers and 21 cards, with text and Unlocked. It checks all power and card lines, and restores Cards after a remount. The focused `npm test` passes 5 page tests and 50 art tests. The type check passes.
- Full page check: 8 focused page tests and 50 art tests pass. A remount reads the new rating and totals. A missing private handle gives Profile and a name row. More's loading line first cuts the bottom roller by 11 px; the disabled More control now shows the pending read without a new line. The name row also cuts the roller; it now sits with the other profile links. Both failing bounds checks pass.
- `plugin-ui` and `plugin-ui-http` pass before these last two layout fixes. The checks cover all three sizes, 23 fixture rows in two pages, two real open games, all badges, all four collection tabs, every page image, remount reads and hidden data. The HTTP check ends three real games and checks PostgreSQL totals and the friend's handle in the page only.

## Look check

The phone and desktop comparisons cover profile, profile-badges and collection. The final fix-round files are in `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-look/16b/`. All three sizes have separate screenshots in the browser run folder.

Keep these required differences from the sample:

- The shared sheet head has Back. Profile live rows use the sample's left Turn or Open pill and king coin. Play keeps the shared row form.
- The owner's matte wood rollers replace the sample's brass rollers. Only the sheet grows. The list scrolls inside it, so both rollers show in full. The desktop badge view needs no outer scroll.
- Earned badges show their dates. A tap shows the date or goal on a sheet.
- Piece cards use the full Guide rows, not the sample's short stand-ins. Power and card words use the current official readings, as set out above.

The page keeps the game's fonts, colours, components and art. It adds no art file.

## Result

Status stays resolved. This fix round starts from `161f9cc1`. It adds no integration merge. Work stays in the ticket worktree on `claude/mvp-16-profile`.

### Fix round

- A full read clears the old cursor and hides More before the read starts. The request guard drops an older cursor reply. The delayed page test checks the new result, totals and open game after the old reply arrives.
- More updates an open badge sheet in place. It keeps the Close control and its focus. Close clears the one dark layer and returns focus to the current badge button. The delayed page test checks this sequence and an updated earned date.
- Profile live rows now follow the phone sample: a left red Turn or tan Open pill, the seat's king coin, the name and a normal-weight detail line. Profile owns these rows. The shared Menu list stays unchanged. The page test checks both row forms, their order and resume.
- The collection test checks every piece's Moves, Takes and Special rows and both power rows for each king exactly against the game's rule readers. A temporary wrong Takes line fails the new check. The correct collection code stays unchanged.
- Each code fix starts with a failing page test. The detail-weight check also fails before its style fix. Small commits keep these changes separate.

### Checks

- Final full `npm test`: 151 files pass; 2,312 tests pass; 8 skip. All 10 profile and collection page tests, 50 art tests and the type check pass. Log: `$TMPDIR/mvp16b-final-tests-look.log`.
- The first full run has four failures in unchanged engine/search tests: three time limits and a clock-limited mate check. A repeat passes with no code change. The final run after the detail style fix also passes. No engine or search file changes.
- Final `npm run plugin:build`: pass. HTML: 557,426 bytes. Build resource payload: 559,665 bytes. The browser's standalone resource: 559,395 JSON bytes. The page stays below 1 MB.
- Final `npm run check:browser plugin-ui`: 1 of 1 passes. It checks Profile and Collection at phone, panel and desktop sizes, then the shared app flows. Run folder: `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/mvp-16-profile-2rg6y1`.
- The final phone look matches the sample's live row form. Raw phone shots and sample comparisons are in `$TMPDIR/kingdown-look/16b/`. The matte wood rollers stay as approved.
- `git diff --check`: pass. The merger runs the full browser set and other plugin checks on its machine.

### Open items

- Add exact history date and icon asserts.
- Check an open badge sheet across a remount.
