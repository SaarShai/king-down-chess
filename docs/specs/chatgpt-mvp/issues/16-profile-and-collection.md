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

The phone and desktop comparisons cover profile, profile-badges and collection. The files are in `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-look/16/`. All three sizes have separate screenshots in the browser run folder.

Keep these required differences from the sample:

- The shared sheet head has Back. The shared open rows keep their portraits and turn mark, as ticket 11 requires.
- The owner's matte wood rollers replace the sample's brass rollers. Only the sheet grows. The list scrolls inside it, so both rollers show in full. The desktop badge view needs no outer scroll.
- Earned badges show their dates. A tap shows the date or goal on a sheet.
- Piece cards use the full Guide rows, not the sample's short stand-ins. Power and card words use the current official readings, as set out above.

The page keeps the game's fonts, colours, components and art. It adds no art file.

## Result

Profile and collection are complete. The profile reads private tool data, uses the shared open-game list, pages finished rows 20 at a time, and shows the rating, totals and all 10 badges. Each badge opens its date or goal. Collection has 11 pieces, 6 kings, 12 powers and 21 cards, with live rule text and Unlocked. Screen and tab state survive a remount; records and names stay out of widget state.

- Full `npm test`: 151 files pass; 2,302 tests pass, 8 skip. All 50 art tests and the type check pass. The 8 page cases pass.
- `npm run check:browser`: 23 of 24 pass at first. The unchanged web turn check misses its pawn tap. `npm run check:browser turn` then passes 1 of 1 with no code change. Each of the 24 checks has a pass. Full log folder: `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/mvp-16-profile-wKJzR4`; turn repeat: `mvp-16-profile-nbvmtQ` in the same parent folder.
- Final `npm run check:browser plugin-ui plugin-ui-http`: 2 of 2 pass after the full run and both layout fixes. Log and screenshot folder: `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/mvp-16-profile-6o04Ij`. The phone, panel and desktop checks pass for rows, paging, badges, all collection entries, image loads, private handles, fresh remount reads and both rollers. The HTTP check verifies three real PostgreSQL results.
- `npm run plugin:build`, `npm run plugin:server:check` and `npm run plugin:check:protocol`: pass. The server check uses `kingdown_mvp16_test`. All 101 art files pass: 72 WebP, 1 PNG, 24 SVG and 4 woff2. All 24 tools pass.
- Page bytes before and after: HTML 516,932 → 554,597; build payload 518,976 → 556,828. The standalone server resource is 556,593 JSON bytes. The page stays below 1 MB.
- `git diff --check`: pass. The look folder and the required differences are above.

Open items: none in this ticket. The sample's older rule words stay in the sample; the page uses the current official rules.

### Integration check

The branch merges local integration tip `f63606e3` without a conflict. The first combined test finds the hidden profile name link in a Settings-only selector. The profile now owns that link's click handler and calls the shared router. No shared controller or test changes are needed for this fix.

- After the fix, full `npm test` passes 151 files and 2,310 tests; 8 skip. All 50 art tests and the type check pass. All 8 profile and collection cases pass.
- The rebuilt plugin, server check and all 24 protocol tools pass. The server loads all 101 art files. Final page: 555,937 HTML bytes and 558,166 build payload bytes. The standalone resource is 557,931 JSON bytes.
- Both combined-code plugin browser checks pass, 2 of 2. Their log and screenshot folder is `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/mvp-16-profile-VPmXup`. The same look folder holds the final comparisons.
- Apple's Git shim stops one browser attempt with an Xcode licence error. The installed Command Line Tools Git runs the final check. No system or licence setting changes.
- `git diff --check` passes. Open items: none.

### Fix round plan

Keep the resolved status. Work starts from `161f9cc1`. Do not merge the integration branch again.

1. Add a delayed page test for a fresh read with an old cursor page in flight. Clear the cursor and hide More at the start of a full read. Keep older cursor replies out.
2. Add a delayed page test for a badge tap during More. Update the open sheet in place. Close removes its one scrim.
3. Check the profile live rows against the approved phone sample. Put Turn or Open on the left, then the king coin, name and detail. Keep Play rows unchanged.
4. Check each piece rule row and each king power row exactly against the game's rule readers.
5. Run `npm test`, `npm run plugin:build` and `npm run check:browser plugin-ui`. Save the phone look in `$TMPDIR/kingdown-look/16b/`. Record counts, page bytes and the two deferred review items. Commit and push this branch.

- Fresh read: the delayed test fails because More stays visible. The full read now clears its cursor and hides More. The request guard drops the old cursor reply. Focused `npm test` passes 9 page tests and 50 art tests. The type check passes.
- Badge sheet: the delayed test leaves one dark layer after Close. The open sheet now updates its detail in place. Close returns focus to the current badge button. Focused `npm test` passes 10 page tests and 50 art tests. The type check passes.
- Live rows: the page test first fails on the missing left Turn pill. Profile now owns its live row form. It shows Turn or Open, the seat's king coin, the name and detail. The shared Play rows stay unchanged. Focused `npm test` passes 10 page tests and 50 art tests. The type check passes. New look shots go in `16b`.
