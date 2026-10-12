# 16 · Profile and collection

Status: claimed
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
