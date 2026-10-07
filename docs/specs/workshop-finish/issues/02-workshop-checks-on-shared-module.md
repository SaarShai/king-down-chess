# 02: Workshop checks on the shared check module

**What to build:** The two Workshop browser checks, `workshop` and `workshop-cast`, become readable code on the shared check module of the checks-and-hooks spec. They run under the browser-check runner on any channel and any server, and change no tracked file. Each check gets its server, channel and output folder from the module, traps page and console errors, fails on an error it does not allow, and writes its screenshots through the module into the runner's untracked folder. The cast check compares image paths with `imageIs`, so it passes on the dev server and the preview server. Neither check holds a literal cast size: the count comes from the cast list. Each check keeps every assertion it has today, written one step to a line in named groups.

**Blocked by:** checks-and-hooks/05 (shared check module: `env`, `launch`, `trapErrors`, `assertNoErrors`, `shot`, `imageIs`); checks-and-hooks/06 (browser-check runner with `workshop` and `workshop-cast` in its registry)

**Status:** ready-for-agent

- [x] Both checks use `env`, `launch`, `trapErrors`, `assertNoErrors` and `shot`; the cast check uses `imageIs`. The check lint of checks-and-hooks passes for both.
- [x] Neither check holds a port, a channel, a temp path or the number 34.
- [x] Each assertion of today's two checks is still present (a before and after list in the ticket's Comments shows it); the commit needs no `Removed-check:` trailer.
- [x] `npm run check:browser workshop workshop-cast` passes, and the runner reports no changed tracked file.
- [x] The same run passes with `PLAYABLE_BROWSER=chromium`.
- [x] The cast check passes against the dev server (`PLAYABLE_URL` set to it).

**Verify:** `npm test`; `npm run check:browser workshop workshop-cast`; `PLAYABLE_BROWSER=chromium npm run check:browser workshop workshop-cast`

**Owns:** tools/verify-workshop.mjs, tools/verify-workshop-cast.mjs

## Comments

Builder, 2026-10-07, branch `build/workshop-finish-02`.

**What changed.** Both checks import `env`, `launch`, `trapErrors`, `assertNoErrors` and `shot` from the shared module; both also use `imageIs` (the cast check for every picture, the Workshop check for the Try it picture). The cast size comes from `docs/visual-design/workshop/cast.json`, read by its path from the script, not from the working folder. The art-load step builds each file path from `document.baseURI`, not from `/`. Each step is one line, in named async groups. Each assertion now has a message. A trapped list per viewport and `assertNoErrors()` at the end replace the pageerror-only lists; console errors now fail too, and no allowed pattern was needed.

**Check lint.** The lint of checks-and-hooks/11 is not in the tree yet (that ticket waits for this one). A stand-in grep of both files finds no port, channel, temp path, `mkdtemp` or 34, and finds `env`, `launch`, `trapErrors`, `assertNoErrors`, `shot` and `imageIs` calls in each.

**Runs.**
- Red first: the old cast check against the dev server (`npx vite --host 127.0.0.1`, free port) failed at line 28: `/ui/workshop/owl-archivist-w.webp` is not `./ui/workshop/owl-archivist-w.webp`.
- Green: the new cast check and the new Workshop check against the same dev server (`PLAYABLE_URL` set to it), both pass. The dev server was stopped by its PID.
- `npm run check:browser workshop workshop-cast`: ok workshop 14.1 s, ok workshop-cast 8.7 s, all 2 passed, no changed file in the checkout. Screenshots: 10 in `<output root>/workshop`, 8 in `<output root>/workshop-cast`.
- `PLAYABLE_BROWSER=chromium npm run check:browser workshop workshop-cast`: all 2 passed.
- After the merge of the integration tip (`000fa16`): `npm test` green, vitest 55 files and 1028 tests, node tests 42 of 42; the runner again passes both checks. One earlier `npm test` run after the merge failed one test on a 5 s time-out (`judge.test.ts`, "keeps the line within 90 characters..."), at a load average near 20; the rerun passed. This file is not in this ticket.

**Assertions before and after.** Old line numbers are from `24dad2b`. Each old assertion is in the new file, in the group named here.

`verify-workshop.mjs` (every viewport unless named):

| Old line | Assertion | New group |
|---|---|---|
| 18 | 34 New piece choices (now: the cast list length) | blankCast |
| 21 | new design squares `[]` | blankCast |
| 22 | 2 boards | blankCast |
| 23 | no edit sheet, die, card edit, plinth, floor, rim, range input | blankCast |
| 24 | one model picture | blankCast |
| 25 | thermometer taller than wide | blankCast |
| 26 | thermometer role `meter` | blankCast |
| 28 | move cell (tap at 390) gives `move` | separateChannels |
| 29 | take cell gives `both` | separateChannels |
| 30 | move cell gives `take` | separateChannels |
| 31 | Undo gives `both` | separateChannels |
| 33 | two shoot clicks give `moveShoot` | separateChannels |
| 35 | rule book opens no dialog | inlineProperties |
| 36 | chain gives 1 rule | inlineProperties |
| 38 | When pill opens no dialog | inlineProperties |
| 41 | "In the enemy half" changes `when` | inlineProperties |
| 42 | remove gives 1 rule | inlineProperties |
| 44 | rename saves "Test Sentinel" | nameAndAppearance |
| 47 | figure `clay-golem` saved | nameAndAppearance |
| 49 | no sideways scroll in the workspace | layoutFits |
| 50 | each board fits the width | layoutFits |
| 55 | 1280: arrows and Enter mark (1,0) | keyboardAndRefusedSave |
| 55 | 1280: Control+Z (no assertion, as before) | keyboardAndRefusedSave |
| 57 | 1280: refused save shows the alert | keyboardAndRefusedSave |
| 58 | 1280: Retry hides the alert | keyboardAndRefusedSave |
| 63 | Try it picture is clay-golem-w (now `imageIs`) | shareTryReload |
| 64 | Undo after Try it gives army 0 | shareTryReload |
| 65 | link opens with no enabled cell | shareTryReload |
| 66 | Keep a copy keeps the name | shareTryReload |
| 68 | reload keeps figure `clay-golem` | shareTryReload |
| 72 | no page error (now also no console error, per viewport and at the end) | main loop |

`verify-workshop-cast.mjs` (widths 390 and 1280):

| Old line | Assertion | New group |
|---|---|---|
| 17 | 34 New piece choices (now: the cast list length) | newPieceScreen |
| 18 | no preset, Mix or Surprise | newPieceScreen |
| 23 | blank squares, lines, rules | blankDesign |
| 24 | figure `owl-archivist` | blankDesign |
| 25 | name "Owl Archivist" | blankDesign |
| 28 | after reload, card picture owl-archivist-w (`imageIs`) | reloadKeepsFigure |
| 32 | gallery count is the cast length | galleryChoices |
| 35 | each figure: card picture `<id>-w` (`imageIs`) | galleryChoices |
| 36 | each figure: gallery stays open | galleryChoices |
| 39 | Strong filter shows fewer than the cast | filterArmyUndo |
| 42 | second army: clay-golem-b (`imageIs`) | filterArmyUndo |
| 44 | Undo: clay-golem-w (`imageIs`) | filterArmyUndo |
| 51 | every army file loads (now names the files that do not) | allArtLoads |
| 58 | Try it picture clay-golem-w (`imageIs`) | shareTryReload |
| 62 | share link card clay-golem-b (`imageIs`) | shareTryReload |
| 66 | home, first design: clay-golem-b (`imageIs`) | shareTryReload |
| 67 | no page error (now also no console error) | main loop |

**Second merge of the integration tip (`b2906b8`, with checks-and-hooks/09 and 10).** `npm test` green: vitest 58 files and 1055 tests, node tests 42 of 42. Two runs before it failed only on the same judge time-out at a load average of 23 to 27; the judge file alone passes 13 of 13, and the "90 characters" case takes 2.7 s alone. The runner again passes both checks.

**Removed-check counter (checks-and-hooks/10).** No assertion is removed, but the counter counts a changed line as removed, and the rewrite changes the text of each assertion line (one step to a line, a message, `imageIs` in place of a string compare). So the two build commits, counted alone, give 47 lines. They were made in this worktree before the hook came in, with no hook path set. A trial in a throwaway worktree with the hooks on: `git merge --no-ff build/workshop-finish-02` into the integration tip passes (the counter counts a merge line only when the merge removes it from each parent); a squash commit of the same change is refused with 47 lines. So the merger must use the `--no-ff` merge, not a squash or a rebase. The criterion "needs no `Removed-check:` trailer" holds for that merge; the table above is the proof that each assertion stays.
