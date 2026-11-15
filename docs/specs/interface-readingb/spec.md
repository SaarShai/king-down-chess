# Reading B: the B reading area and the game screen at every size

Status: ready-for-human

Branch: none. The build is an uncommitted copy of `game/` in the design project (`parallel/reading/game`). No commit, push, pull request or deploy until the owner says so.

## 1. Source

The lead's launch decisions 33 to 36 of 2026-11-13 and the size matrix (design project, `runs/launch/decisions.md`). The scope is `runs/launch/readingb/scope.md`. The design is `runs/review/reading-lab/design.md` (the B design). The scope adds joy items J1 and J5 of `runs/launch/finish/accepted.md`, and the iOS needs P3 (run the layout again when the safe areas arrive or change) and P4 (the tap grid is the painted board), with a browser check that taps the centre of a corner square after a rotation.

Stage A ("reading", decisions 17 to 23, [Reading](../interface-reading/spec.md)) is built in the same copy. B keeps A's functions, texts and tests.

## 2. The plan

### Goal

On `/next.html` the reading area has the B structure: one small turn state, one headline, one subject, and the lasting effects in one summary control at the end. The game screen has two layout classes (a stack and a rail) that the viewport after the safe areas decides. At each size of the matrix there is no page scroll, the squares and the controls are 44 px or more, no text is under 14 px, nothing is under a safe area and nothing is cut.

### Scope

- [Issue 01](issues/01-readingb.md): decisions 33 to 36, J1, J5, P3 and P4.
- New files: `src/interface/play/layout.ts` (the layout classes), `reader.ts` (the B reading area), `reader-rules.ts` (its pure rules), `reading-b.css` (the B look and the classes), and the tests `layout.test.ts` and `reading-b.test.ts`.
- Changed files: `main.ts` (the game screen parts), `texts.ts` (four words), and `motion.ts` (J1: one hunk in `swapText`).
- Browser scripts stay in the design project: `runs/tools/launch-readingb/`.

### The options of decision 33

a1 (one summary control for the lasting effects), b1 (the computer's four cards as one group in its strip), c2 on upright phones and c1 where the rail is 400 px or wider, d2 (End turn quiet after a free action, brass after a move), e1 (Cancel beside the name), f1 (subject art where the words fit). There are no other options and no switches. The lab pages (design section 7) are not part of this stage.

### Where a design number cannot hold at a matrix size

Decision 34 wins. Each case is in issue 01, section "Where decision 34 cannot hold", with the path of its screenshot.

### What does not change for the old screens

- `index.html`, `src/main.ts`, `src/screen/*`, the engine, the save code, the renderer and the assets do not change.
- `motion.ts` `swapText` has no user outside the new page: its users are `turn-controls.ts` and `reader.ts`, which only the new page loads.
- No save field changes. The layout, the summary control, the computer's card group and inspection do not write a save.

### Checks

- `npm test` and `npm run test:docs` pass. No test is removed, skipped or weakened.
- `npm run build` passes.
- Browser: Playwright on vite preview of the final build, Chromium and WebKit. Each reachable state of the design's state table at each of the 17 sizes, with the safe areas at 0 and set (decision 36). The facts of stage A in B's places at 360x640, 390x844 and 1440x900. The rotation and corner-tap check (P3, P4). Deliberate faults on the served files must fail their case.
- Report: `parallel/reading/run/report.md` in the design project, section "Stage readingb".

## 3. Verification

[Issue 01](issues/01-readingb.md), section "Verification".

## 4. Reviews

- Approval: the owner gave the design and build decisions of this project to the lead (`docs/DECISIONS.md`). The lead chose the options of decision 33 and the layout rules of decision 34.
- The new strings follow the copy table and the design's state table. The new strings are in issue 01.
- An independent review comes before a pull request. AGENTS.md: this change is visible, so it waits for the owner's yes on a rendered sample before a merge.
