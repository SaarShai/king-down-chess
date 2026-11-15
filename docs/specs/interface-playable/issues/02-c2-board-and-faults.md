# Part C2: the board and the small faults

Status: ready-for-human

Spec: [Playable](../spec.md). Part [01](01-c1-save-resume.md) stays in the working tree. This part also repairs the two faults from its recheck.

AGENTS.md: this part changes what the player sees. It waits for the owner's yes on a rendered sample before a merge.

## Scope and plan

### Decision 14: the Versus card

- `src/interface/play/play.css`, `.play-versus` and its parts: restore the app's light values (`app/src/play/play.css` 193 to 204): background `radial-gradient(120% 70% at 50% 45%, #24474d, var(--surface-page) 70%)`, text `#fff5df`, `.vs-who` `#c6d4ce`, `.vs-line` `#e6efe9`. Remove the stage B comment about the paper tokens. The gold "VS" mark stays.
- Edge: stage B changed these values because the light text lost contrast where the glow fades into the paper page. The browser run samples the background under each text box (`.vs-who`, `.vs-king`, `.vs-line`) at the four sizes of decision 20. When a box is under 4.5:1, change only the outer stop of the gradient, and record it as a deviation.
- Test: browser (screenshots and the contrast samples).

### Decision 15: Coordinates

- Plan as the spec, item 2: the page draws the labels, not the renderer.
- `play/main.ts` `start()`: each rank 1 cell gets `data-file` (a to h), each a-file cell gets `data-rank` (1 to 8). `screen.dataset.coords` follows the setting.
- `play.css`: `.play-square` is `position: relative`; `[data-file]::after` in the lower right corner, `[data-rank]::before` in the upper left corner; 11 px text in `#2b2621` on a paper chip `#f3ead7` (the renderer's label colours); `pointer-events: none`; hidden under `.play-game[data-coords='false']`.
- Menu: `choiceGroup('Coordinates', On, Off)`. Default On. A change writes `coords` (part C1 writer).
- Edge: each cell has an `aria-label` (`squareLabel`), so the labels do not change what a screen reader says.
- Edge: a label can cover a corner of a figure. The owner's sample decides.
- Test: browser (the labels show at 360×640 and 1440×900 inside the board rectangle; Off hides them; the setting stays after a reload).

### Decision 16: Sound

- `src/render/sfx.ts`: new export `unlockSound()`. When sound is on, it makes the audio context and calls `resume()`. The old screens do not call it.
- `play/main.ts`: `setSound(false)` at load becomes `setSound(stored sound)`. Menu `choiceGroup('Sound', On, Off)`, default Off. A change calls `setSound`, then `unlockSound()` inside the same tap when On, and writes `sound`. With a stored On, the first `pointerdown` or `keydown` of the page load calls `unlockSound()` once.
- Edge: an old save holds `sound: true` (the old default). That player hears sound here. Default Off applies only to a device with no stored value.
- Test (`src/render/sfx.test.ts`): "unlockSound makes and resumes one audio context only when sound is on" (stubbed `AudioContext`).

### Decision 17: Motion speed in `pace`

- `play/main.ts`: `motion` starts from the stored `pace` (`normal`, `fast`, `off` are the renderer's values, no map needed), else from the system setting as today. A change writes `pace`.
- Edge: Symbols set the board's motion to Off; the stored `pace` keeps the player's choice.
- Test: the C1 settings test covers the write; the browser run covers Fast and Off.

### Decision 18: words

- `src/interface/ui/kit.js` `targetChoice`: the labels are "Capture" and "Push" (the typedef too). `play/main.ts` `showChoice`: the match `'take'` becomes `'capture'`. `PROVENANCE.md` records the change. `src/read.ts` does not change.
- `play/texts.ts`: a helper gives "an" before a name with a vowel sound (Archer, Ogre) and "a" before the others. It applies to "The computer moves a …", "A … enters", "becomes a …" (the drop line starts with "An" or "A").
- Tests (`texts.test.ts`): "uses an before Archer and Ogre and a before the others", "a returned Archer enters with An"; the Ogre choice test in `turn.test.ts` does not change (it reads moves, not labels).

### Decision 19: carry faults 1 to 12

| Fault | Change | Check |
|---|---|---|
| 1. Roll call tags past the edge on files a and h | `rollCall()`: after the tag is in the board, clamp its centre to half its width from each board edge | browser, 360×640: each tag inside the board rectangle |
| 2. Escape does not disarm with focus on the power | move the Escape branch of `key()` to a `keydown` listener on the game screen | browser: focus the armed power, Escape, `aria-pressed` false |
| 3. The lifted card covers 12 px of rank 1 (phone) and the power and next card (1440×900) | `play.css`: `--card-lift` and `--card-scale` per layout | browser: the lifted card rectangle does not meet rank 1 or the next control |
| 4. The reading area shifts on arm, disarm, lift, Menu | `play.css` and `renderReader()`: fixed heights for the state line and the help line | browser: the reading area top and the state line top stay the same |
| 5. "Please wait" on Play moves the home 29 px; the stage figures move when they load | keep the Play button size while busy; fixed sizes for the stage images | browser: the home elements keep their positions |
| 6. Arm: brightness does not ease to 1.08 in 200 ms | `play.css` `.play-power` transition and `kd-halo`: one filter path to 1.08 in `--dur-arm` | browser: the computed filter over time |
| 7. The error ring uses a linear curve | `play.css` `kd-error`: the spec's curves in each part | read of the CSS against `runs/motion/motion-spec.md` |
| 8. "Salvation" is 2 px wider than its card at 360×640, in Hand and in Ribbon | `play.css` `.play-card` type and padding at narrow width, both views | browser: `scrollWidth <= clientWidth` for each card label, both views |
| 9. A board tap while Versus shows only ends the hold | `versusCard()`: the tap ends the hold and goes to the square under it (`tap(square)`) | browser: a tap on a pawn during Versus selects it |
| 10. A board tap during the reply ends the thaw at once | `PaintedView.skip()` stops the state effects; add one `skip` option that keeps them, off by default, and use it from `board-api` only. If it needs more than one option, record it as a known limit | browser: the frost mark fades after a tap; `board-api.test.ts` case for the option |
| 11. At 360×640 the full rule of a piece and the Earth Quake rule need a scroll | the short layout borrows the opponent strip for the rule (as for Menu); if the text still does not fit, the scroll and its shade stay, recorded as a known limit | browser at 360×640 |
| 12. A tall phone has empty space in the reading area | the roomy layout uses the space for the state line and the last action (larger text); no new content | browser at 390×844 and 430×932 |

Fault 13 is not in this part.

### Decision 20: browser run of the end states

- Script in the design project (`runs/playable/c2-browser.mjs`), on `vite preview` of a fresh `dist/` on a free port, stopped by its PID.
- Positions: the script writes a fixture save to `kingdown.save` before the page loads, then presses Continue (part C1). Fixtures: a checkmate the player gives in one move; stalemate, `draw50`, `drawRepetition` and `drawMaterial` that the player's move makes; a Beast chain; a push or capture choice (Ogre); a promotion.
- Runs: the end states and the choices; reduced motion (`emulateMedia`); Motion speed Fast and Off; Coordinates and Sound on and off; Hand and Ribbon.
- Sizes: 360×640, 390×844, 768×1024, 1440×900. Chromium, and WebKit when the installed Playwright (1.64.1) can start it. Say which.
- Record for each run: console errors, failed requests (a `net::ERR_ABORTED` frame load after a cancelled playback is expected), controls under 44 px, page scroll, the board rectangle at rest, card labels that overflow, screenshots.

### Decision 21: the page head colour

- `next.html`: `html { background: #f7f5ed; }` (the page token `--paper-50`). The theme colour and the rest of the head stay.

## Verification

- `npm test`: 6360 passed, 387 skipped; 114 Node tests passed. No file in the game changes during the test run. Log: design project `runs/playable/c2-test.log`.
- `npm run test:docs`: 187 passed, 1 skipped. Log: `runs/playable/c2-docs.log`.
- `npm run build`: exit 0. Log: `runs/playable/c2-build.log`. The build scan finds zero links and zero private runtime data. ALLOWLIST has 270 entries; PRECACHE has 269. Neither list names the new page or its interface files. Data: `runs/playable/c2-build-data.json`.
- `npm run check:browser next-save`: passes. Log: `runs/playable/c2-next-save.log`.
- Decision 20: 88 cases pass in installed Chromium and WebKit. Each engine runs 11 cases at each of the four sizes. Fixture saves reach all four draws, checkmate, Beast captures, both Ogre actions and promotion. Fast, Off, reduced motion and the settings also have cases. Data: `runs/playable/c2-browser.jsonl`. Script: design project `runs/tools/c2/browser.mjs`. No test hook enters the shipped page.
- Decision 14: only the outer gradient stop changes to `#17363c`. The paper stop gives a minimum ratio from 1.05:1 to 1.52:1. The teal stop gives at least 7.29:1. Data: `runs/playable/c2-contrast.json`.
- The report in the design project, `runs/playable/c2.md`, lists source changes, each carry fault with before and after evidence, deviations and unchecked work. Screenshots stay in `runs/playable/c2-shots/`.

### C1 recheck repair

- Require a non-array king object and string king and power names before the name checks. Array-valued fields on either side now take the kept path.
- Compare effective rules and finalized history for later states of a kept game. Undo can replace staged steps. A missing rules field can become explicit default rules on the old page.
- Four new cases fail before the fixes and pass after them. Logs: `runs/playable/c2-recheck-red.log` and `c2-recheck-green.log`. `saved.test.ts` now has 47 cases. The registered browser check also covers the four malformed field shapes and both kept-copy cases. It verifies the kept bytes after a new game.

### Built details

- Coordinates Off uses separate selectors for file and rank pseudo-elements. The browser regression checks both; its previous form fails all 24 settings cases. Evidence: design project `runs/playable/c2-browser-coords-red.jsonl`.
- Continue uses the saved player's army for the stage and army list. With no Continue it uses the new deal.
- The reader stays at one position. A borrowed sheet covers the state line instead of moving it. Its empty padding does not intercept Menu. A short result uses smaller art and omits the repeated Rematch hint so both actions fit.
- The error-ring curves use concrete cubic-bezier values. Browser keyframes resolve the variable form to linear. The segments keep 220 ms, 1500 ms hold and 150 ms exit.
- The interface passes one optional `keepStates` flag to `PaintedView.skip`. Its old default still settles state effects. Tests cover both paths.
- The home busy button keeps its size. Figure boxes reserve their size. The head preloads the display font. The observed first-load shift becomes zero. The 360×640 transition stays at scroll y 0.
- No dependency, old-screen controller, account module or `src/read.ts` changes in this part.

## Known limits

- Carry 11 remains in part: at 360×640 the Archer rule needs 15 px of scroll. Earth Quake fits. Long rules and turn steps can still need a scroll. The lower shade stays.
- Carry 13 is outside this part: marker travel, tabs, dialog close motion and Fast interface motion remain.
- Carry 14 is an accepted limit: a finished unsupported save gets no kept copy. A new game can replace it. Decision 6 applies.
- The exact abrupt-thaw timing from the carry report does not reproduce in the browser sequence. The browser shows a continuing thaw. Unit tests verify that the interface skip keeps state effects and the old default settles them.
- The C1 limits stay: one kept game, no old-page card controls, an open Beast chain reloads before the chain, and blocked storage keeps the game in memory.
- Cancelled playback can end frame requests with `net::ERR_ABORTED`. The browser record lists them separately.
- No Firefox, real phone, screen reader, signed-in account, real-device sound audibility, offline install or full old-page browser suite runs in this part.

## Comments

### Repair

- The two stage checks find test gaps and small control faults. The repair verifies each fault in source or in a browser before it changes code.
- Each resource preview now has Close or Cancel. Escape works from any game focus, including BODY. It closes Menu and Full rule. It returns focus to the resource, Menu or the board. Menu and Full rule move focus to Close when they open. Z calls the same guarded Undo action as the button. These changes stay in `src/interface/play/main.ts`.
- A WebKit check finds a tag 0.14 px past the board edge. The tag clamp now keeps one extra pixel inside the board. A new assertion fails before this change.
- `src/interface/play/texts.test.ts` also checks the article in an in-place power promotion. `tools/test-unlocked.sh` passes reporter arguments to the existing test runner. Its default command stays the same.
- The three extra skips are the two source exports in `tools/board-grain.test.ts` and the source export in `tools/stone-control.test.ts`. The test command selects a Python install without NumPy. A command with `PATH=/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin` selects the installed Python with NumPy and Pillow. All seven art cases pass. No skip or assertion changes.
- The final full `npm test` has 6363 passes and 384 skips. All 114 Node tests pass. The JSON result names every skip. The skip audit proves that exactly those three cases return to execution. Every remaining skipped file equals HEAD. Logs stay in the design project at `runs/launch/c2/repair-checks/`.
- `runs/tools/c2-repair/browser.mjs` in the design project uses the existing browser and Node assertions. It checks close actions, focus, Undo, coordinates, sound, board pace, contrast, bounds, motion timing, home loading and the resumed army. The settings case observes the real board adapter through the built response. It adds no shipped test hook. The other cases use the unmodified build.
- The repair keeps carry 11: long rules and turn steps can need internal scroll at 360×640. The Archer rule keeps its lower shade. Carry 13 and the accepted save limits stay outside this repair.
- Final browser, mutation, documentation and build results appear in the design-project report `runs/playable/c2.md`, section Repair. No commit, push, pull request or deploy occurs.
- Final repair checks pass: 78 browser cases in Chromium and WebKit at the three required sizes; 15 deliberate faults detected; the registered `next-save` check; 187 documentation tests with one existing skip; the build. The browser records zero console errors and zero unexpected failed requests. The six home cases repeat with layout height, so the press animation does not change their measurement. The final contact sheets are examined.
