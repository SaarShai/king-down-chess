# Batch 3 merge

Status: resolved

Decision: decided by delegation (2026-10-09).

## Plan and checks

1. Check the branch and each lane report. Merge new main commits first.
2. Revert the parked Workshop change on the sheets lane. Merge words,
   board, sheets and end in that order. Keep both intents in each conflict.
3. Run typecheck and `npm test` after each merge. Run all browser checks,
   then plugin-ui and plugin-ui-http. Record the plugin page size.
4. Build and render W1 to W12. Each report must have zero faults. Inspect
   all batch 3 stills, videos and W2 smallPhone stills for layout faults.
5. Record the evidence and push the integration branch with its hook.

## Evidence

The worktree starts clean at 0d88005, the origin branch head. All four
lane exits are 0 and each final report has `ok: true`. Main has four new
doc commits; its merge (6417033) has no conflict. The lane merges are
words (11693ae), board (d10f512), sheets (2dafa6f) and end (e03abe2).

The sheets lane reverts its Workshop changes in 975918c before it merges:
`src/workshop/workshop.css`, `tools/verify-workshop.mjs` and ticket 22.
W12 has no lane change. The protected Workshop paths match 0d88005.
The Workshop stays parked.

### Conflicts

- Tickets 03, 04, 07, 08, 10 and 18 keep both lanes' evidence.
- W3 keeps the words states and the black-side board state. W9 keeps
  both the Archer-learned and all-learned states, plus shelf focus.
- `src/style.css` keeps the read outline and the armed coin ring.
- `index.html` keeps All rules words and the Guide body wrapper.
  `src/ui/table.css` keeps compact phone rows and the Menu sheet layout.
  `src/ui/table.ts` keeps the generic rules opener and scrolls only the
  Guide body to the chosen row, with focus that does not scroll the page.
- `tools/verify-lessons.mjs` and `tools/app-ui.mjs` keep both sets of
  checks and helpers.
- `docs/specs/web-ux/capture.mjs` keeps normal motion, the still pace,
  the test clock and the video step timing.

### Fixes after the merge

The first full browser run finds two old Archer word checks. Commit
c4c81c1 changes their expected words to the lane's requested text. The
checks still test the same behavior. Both pass in the final full run.

The W6 video shows a king fall clipped at the right board edge. Commit
7bf311a turns the web fall inward there in both board orientations. The
shared scene keeps its former default. A browser check compares the
drawn result in both orientations. The new build and W6 captures pass.

### Tests and browser checks

Typecheck and `npm test` pass after each lane merge. The final typecheck
passes. The final `npm test` reports:

- Test Files: 95 passed | 1 skipped (96).
- Tests: 1700 passed | 13 skipped (1713).
- Scene tests: 50 tests, 50 pass, 0 fail.

The final `npm run check:browser` reports `check: all 25 passed`.
QA reports 17 PASS, 0 FAIL, 0 XFAIL and 0 XPASS. The final
`npm run check:browser plugin-ui plugin-ui-http` reports plugin-ui
14.7 s, plugin-ui-http 15.3 s and `check: all 2 passed`. The HTTP check
uses the local disposable test database after its schema init. The
targeted w6-parts check also passes (4.3 s).

Logs are in `/private/tmp/kingdown-b3-final-test.log`,
`/private/tmp/kingdown-b3-browser-final.log`,
`/private/tmp/kingdown-b3-plugin-final.log` and
`/private/tmp/kingdown-b3-fall-check.log`.

The plugin page is 4,295,044 bytes before and 4,296,117 bytes after
(+1,073 bytes). It stays below the 4,350,000-byte limit. The web drawing
options stay opt-in; both plugin checks pass.

### Captures

The build passes. The final2 capture reports have these counts:

| Unit | Renders | Faults |
| --- | ---: | ---: |
| W1 | 14 | 0 |
| W2 | 68 | 0 |
| W3 | 27 | 0 |
| W4 | 45 | 0 |
| W5 | 10 | 0 |
| W6 | 10 | 0 |
| W7 | 18 | 0 |
| W8 | 10 | 0 |
| W9 | 8 | 0 |
| W10 | 8 | 0 |
| W11 | 12 | 0 |
| W12 | 24 | 0 |
| Total | 254 | 0 |

The renders are in the build scratchpad under `samples/final2/`.
Visual inspection covers all 145 required stills: every W3, W4, W5,
W6, W8, W9, W10 and W11 still, plus every W2 smallPhone still. It also
covers both W6 videos. The fixed items show in the pixels. The controls
and text fit; the sheets scroll as intended. The corrected king fall
fits inside the board. The preview and its child stop by PID.

### Deferred items

- Workshop all 18 stays parked, as instructed.
- Frost art (all 5 and W3 6) is excluded from the lane scope. It needs a
  follow-up ticket.
- The optional W4 9 read sign needs a sample that proves it differs
  from selection.
- The optional W8 5 first-paint focus change needs input tracking to
  keep keyboard and screen-reader access.

The integration push is the last step and runs the required test hook.

## Batch 3 repair plan

Decision: decided by delegation (2026-10-09). Items 1 to 15 in the repair brief apply.

1. Check the report claims in code and final2 pixels. Fix words, turn summaries and lesson state in small commits.
2. Fix short-phone rows, coin rings, board ink, Guide, Home and Menu. Keep the plugin default and parked paths.
3. Test logic at the existing public seams: previouslyTurn, contextLine, checkCause, readText/reachOf, lesson store/shelf, powerText and ceremonyMoveLabel. The brief names these checks; no new test seam is needed.
4. Run typecheck, npm test, all browser checks and both plugin checks. Record page bytes before and after.
5. Build W1 to W12 into final3, extract every video at 2 fps, inspect all required stills and frames, and push with the test hook.

Pass criteria: items 1 to 15 have ticket notes; all tests/checks pass; each sample report has 0 faults; every required pixel check passes; push succeeds.
