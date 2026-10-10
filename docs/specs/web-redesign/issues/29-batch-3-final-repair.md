# Batch 3 final repair

Status: resolved

Decision: decided by delegation (2026-10-09).

## Plan and checks

1. Check each report claim against the code and final3 samples.
2. Fix items 1 to 12 in small topic commits. Test logic first at the existing Previously, reach, move text and lesson seams. Add browser checks for layout and focus.
3. Run npm test, typecheck, the full browser suite, plugin-ui and plugin-ui-http. Keep the plugin default. Record page bytes (before: 4,296,042).
4. Build and capture W1 to W12 in final4. Extract every video at 2 fps. Compare every state with final3. Record each visible change and its item number.
5. Keep Workshop paths fixed. Push the branch with the test hook.

Pass criteria: all 12 items pass; tests and checks pass; all sample reports show 0 faults; each visible change has an item; the push succeeds.

## Answer

All 12 claims are checked against the code and the renders. None is wrong.

| Item | Change and evidence |
| --- | --- |
| 1 | Menu uses fit-content before its first measurement. The phone sheet keeps the bottom edge. Close and Back stay in one place. All rows fit at 320 by 568. The browser check tests all these bounds. |
| 2 | Each Guide power is a block with its own full stop. There are no separator text lines. The focused power outline clears the king name and colon. The browser check tests both. |
| 3 | Previously names Sacrifice, Morph, Rescue, Salvation, entry and other stationary acts. Sacrifice fails first in the test, then passes. Tests also cover an empty Rescue mark and a pass-only held turn. Line height is 1.25. Whole detail rows hide when they do not fit. The long-turn sample and browser check keep the summary above Moves. |
| 4 | The web result passes the final option to move words. Haste and Rally use the plain final ply. The option defaults to false for the plugin. Unit tests cover both powers; the end check covers the result. |
| 5 | Ceremony says Tap the board to skip. The end check tests the caption and skip. W6 frames show the new caption. |
| 6 | A read coin keeps its 1 px read outline; keyboard focus uses 3 px. The keyboard check reads a coin, tabs to it and tests the focus ring. |
| 7 | The active lesson takes priority over its saved done state. The browser check plays learned Archer again and tests current. |
| 8 | Check ring and cause line stay on the board while the computer searches. This keeps the board and cause words in agreement. Motion keeps its former timing. The their-turn check tests the marks. |
| 9 | Coins keep the outer lift shadow outside the short portrait layout. Short phones retain inset rings. W1 to W4 and W11 show the lift change. |
| 10 | All three Lab Archer over-shot readings say only over a piece. Reach tests reject an empty middle square and accept a filled one. The Flight tile test uses a rook. |
| 11 | The font check rejects Alegreya. Each measured bite digit has its own bold record and ink-size check. Bite radius is 8 CSS px. Web ink remains an option; plugin ink defaults do not change. |
| 12 | Catapult uses a C text mark when it has no icon. All three Catapult example armies show 8 marks. The new-game check tests their count. |

The capture check also fixes the W6 computer sample's two random rolls and tests the g7-g5 reply (item 14). Repeated captures had chosen other replies, which made a before-and-after comparison weak. The sample now uses the same reply as the prior video. This changes the sample input, not game play.

## Visible changes from final3

Every changed state is in the scratch report `b3-fix3-render-comparison.md`. The JSON report includes all 274 stills. Each changed or new still has an item number. Each other still is checked for no visible change.

| Unit/state and size | Visible change | Item |
| --- | --- | --- |
| W1/haste, phone and desktop | Coin lift shadow. | 9 |
| W2/menu, extra, board-help, resign, all four sizes | Restored sheet placement and bottom edge; compact rows at 320 by 568. | 1 |
| W2/free-pass, freeze-armed, freeze-mark, phone, desktop and landscape | Coin lift shadow. | 9 |
| W3/power-all-rules, all three sizes | Power blocks, full stops and a clear focus outline. | 2 |
| W3/always-on, armed, black-side, computer-power, ready, their-power, turn-waits, used, phone and desktop | Coin lift shadows. | 9 |
| W4/bites-1-and-2 and four-bites, phone and smallPhone | Bite badge radius 8 CSS px. | 11 |
| W4/read-frozen, phone and desktop | Coin lift shadow. | 9 |
| W5/computer-in-check, phone and desktop | Check ring and cause line stay during search. | 8 |
| W6/flight-tile and freeze-tile, desktop | Coin lift shadow. | 9 |
| W6/haste-final-pass, phone and desktop | Plain final move words. The shorter phone panel centres again. | 4 |
| W6/archer-ceremony video, frames 09 to 12 | Caption names the board tap. | 5 |
| W6/computer-tell, both stills and its video | Fixed sample reply makes the lifted piece repeatable. | 14 |
| W7/catapult-example-1, 2 and 3, phone and desktop | A C mark fills the missing army-strip place. | 12 |
| W10/menu-new-seal, extra-new-seal and tricks, phone and desktop | Restored Menu sheet placement and bottom edge. | 1 |
| W11/previously, see-again, haste-turn and haste-takes, all three sizes | Line height 1.25. Whole optional rows hide when they do not fit. | 3 |
| W11/haste-turn and haste-takes, phone and desktop | Haste coin lift shadow. | 9 |
| W11/see-again, all three sizes | Motion Normal king glow phase varies between captures; the settled board agrees. | 14 |
| W11/haste-takes, desktop | Motion Normal king glow phase varies between captures. | 14 |
| W9/piece-shelf, all-learned and shelf-focus, desktop | Guide click leaves a pointer hover wash on the Ogre card after Menu moves to the centre. | 1 |
| W11/long-turn, all three sizes | New four-bite sample. Summary stays above Moves. | 3 |

W8 has no visible change. W9 desktop shelf stills have the pointer hover wash listed above. W12 has no visible change. Small figure-edge raster differences in W4 and W12 are checked at full size and in enlarged crops. They do not change layout, words, marks or art. No Workshop source or W12 sample source changes.

All 31 video frames are checked. Startup image load, press timing and motion phase can differ between recordings (item 14). Settled board states, text and controls agree. The computer's final board has the same g7-g5 reply as final3; only 35 raster pixels differ above RGB delta 30.

## Verification

- `npm test`: 95 passed, 1 skipped test files (96); 1721 passed, 13 skipped tests (1734). Scene: 50 pass, 0 fail. The source push hook repeats this result.
- `npm run typecheck`: pass.
- `npm run check:browser`: all 25 passed. QA: 17 PASS, 0 FAIL, 0 XFAIL, 0 XPASS.
- `npm run check:browser plugin-ui plugin-ui-http`: all 2 passed; plugin-ui 14.8 s, plugin-ui-http 15.2 s.
- Plugin page: 4,296,042 bytes before; 4,296,055 after (13 bytes more).
- Source repair head `d1fdcfeca735148daaaab49a4b48fb434473ccf2` reaches the remote branch through `git push origin claude/web-redesign-int`. The test hook passes.
- `git diff --check ece7195`: pass. Workshop source and W12 sample source have no diff.

| Unit | Renders | Faults | Extracted frames |
| --- | ---: | ---: | ---: |
| W1 | 14 | 0 | 0 |
| W2 | 68 | 0 | 0 |
| W3 | 27 | 0 | 0 |
| W4 | 48 | 0 | 0 |
| W5 | 14 | 0 | 0 |
| W6 | 16 | 0 | 31 |
| W7 | 24 | 0 | 0 |
| W8 | 10 | 0 | 0 |
| W9 | 8 | 0 | 0 |
| W10 | 8 | 0 | 0 |
| W11 | 15 | 0 | 0 |
| W12 | 24 | 0 | 0 |

Total: 276 renders; 274 stills, two videos and 31 frames at 2 fps. All 12 report files have 0 faults. Preview PIDs 58760 and 63223 are stopped.

Renders: `/private/tmp/claude-501/-Users-za-Documents-king-down-chess/f713c296-a557-4c06-99e1-90ecc1f52371/scratchpad/build/samples/final4/`.

Full state comparison: `/private/tmp/claude-501/-Users-za-Documents-king-down-chess/f713c296-a557-4c06-99e1-90ecc1f52371/scratchpad/b3-fix3-render-comparison.md` and its JSON file.

Logs: `/private/tmp/b3-fix3-tests-complete.log`, `/private/tmp/b3-fix3-browser-complete.log`, `/private/tmp/b3-fix3-plugin-complete.log`, `/private/tmp/b3-fix3-capture.log`, `/private/tmp/b3-fix3-recapture.log`, `/private/tmp/b3-fix3-push-code.log`.

Browser results:

```text
ok   read-piece          1.2 s  /var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-checks/read-piece.log
ok   verb-marks          1.6 s  /var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-checks/verb-marks.log
ok   lessons             3.2 s  /var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-checks/lessons.log
ok   turn               11.5 s  /var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-checks/turn.log
ok   link-game          11.9 s  /var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-checks/link-game.log
ok   end                18.7 s  /var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-checks/end.log
ok   their-turn          5.4 s  /var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-checks/their-turn.log
ok   game-screen         6.5 s  /var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-checks/game-screen.log
ok   menu-extra         10.8 s  /var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-checks/menu-extra.log
ok   home                7.6 s  /var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-checks/home.log
ok   account            53.5 s  /var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-checks/account.log
ok   cursor-adoption    20.5 s  /var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-checks/cursor-adoption.log
ok   king-effects      105.9 s  /var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-checks/king-effects.log
ok   lesson-return       9.0 s  /var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-checks/lesson-return.log
ok   new-game           14.1 s  /var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-checks/new-game.log
ok   painted-game      108.8 s  /var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-checks/painted-game.log
ok   playable-clay      19.9 s  /var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-checks/playable-clay.log
ok   powers              4.2 s  /var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-checks/powers.log
ok   special-moves      31.2 s  /var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-checks/special-moves.log
ok   ux-defects         69.0 s  /var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-checks/ux-defects.log
ok   visual-design      17.8 s  /var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-checks/visual-design.log
ok   workshop           64.9 s  /var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-checks/workshop.log
ok   workshop-cast       8.4 s  /var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-checks/workshop-cast.log
ok   qa                176.3 s  /var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-checks/qa.log
ok   selftest            1.0 s  /var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-checks/selftest.log
check: all 25 passed
```

The repairs stay in the existing UI and text helpers. They add no dependency, rule, saved-game field or new product path. The plugin keeps its prior defaults through optional web arguments.
