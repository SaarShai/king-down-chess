# Reading: the reading area of the new game page

Status: ready-for-human

Branch: none. The build is an uncommitted copy of `game/` in the design project (`parallel/reading/game`). No commit, push, pull request or deploy until the owner says so.

## 1. Source

The lead's launch decisions 17 to 23 of 2026-11-13 (design project, `runs/launch/decisions.md`). The scope is `runs/launch/reading/scope.md`. The accepted plan is `runs/launch/reading/plan.md`; the lead accepts its six conflict resolutions and its list of items to leave out. The scope also adds these audit faults: soak faults 1 and 3, speed faults 5 and 6, and speed fix 11 where the file is in this stage.

## 2. The plan

### Goal

On `/next.html` the reading area shows the current action first: the last result, the selected piece, the armed power or card, or the choice at a square. Lasting effects become one line for each source, with a tap to open the full detail. Check names the side that is attacked. After a free action the line says what is possible next. After the end the play controls are quiet and inert.

### Scope

- [Issue 01](issues/01-reading.md): decisions 17 to 23 and the audit faults of the scope.
- Files: `src/interface/play/texts.ts`, `main.ts`, `learning-panel.ts` (one option that is off by default), `learning.ts` (three step lines), `play.css` (game sections), and the new test `reading.test.ts`.
- Browser scripts stay in the design project: `runs/tools/launch-reading/`.

### Where a decision cannot hold as written

Items 1 and 4 to 7 are the plan's conflict resolutions that the lead accepts (scope.md, item 1). Items 2 and 3 are new in the build; the lead can accept them or relax the board size.

1. **Decision 17 at 360x640.** The board is 352 px, so the reading area has about 134 px. A reply with three or more sentences, the own-check state, or an armed card with its first-time hint does not fit. Plan: the start of the current text, its controls (Show again, Cancel, `?`) and the heading stay in view. The rest of a long line scrolls inside its own box. The fixture is `effects` (a Freeze reply and a pawn move).
2. **Decision 18 at 360x640.** When the current content fills the area, the effect summary has no height. The rings on the board and the square descriptions keep all the information. The summary shows again when the current content is short.
3. **Decision 18 at 360x640, a refused piece.** A tap on a frozen piece gives a two-line refusal and the 44 px name row; 57 px are left and the Frozen line needs 70 px. The refusal in view states the same fact, and the Frozen line is in the current part, which scrolls. This goes past the accepted exception; the lead can accept it or relax the board size.
4. **Decision 19.** The own-piece prompt is not correct for each card. The step line follows the real target set: own piece, enemy piece, or a ringed piece.
5. **Decision 20.** It replaces the learning line "Now make your move" when End turn is legal. The first-time steps of Freeze, Ice Wall and Firewall change to agree.
6. **Decision 21.** The result card keeps its strip borrow. The live and armed states do not borrow the strip.
7. **Decision 22.** Guard text stays. No detail becomes a count alone.

Left out (accepted): Part B structures, art, opponent card marks, effect chips, new ring strength, coordinate drawing, a new wide rail, larger diagrams, global disabled-button styles, "computer" in place of "opponent" in the old texts, and a quiet End turn after a free action. Speed fix 11, rows in the grid, belongs to the sides stage.

### What does not change for the old screens

- `index.html`, `src/main.ts`, `src/screen/*`, the engine, `read.ts`, the save code, the renderer and the assets do not change.
- The learning panel has a new option `owner` that is absent by default. Guide does not set it, so Guide does not change.
- No save field changes. Effect toggles, inspection, previews and replay do not write a save.

### Checks

- `npm test` and `npm run test:docs` pass. No test is removed, skipped or weakened. Baseline (learning stage): 6504 passes, 384 skips, 114 Node passes; docs 187 passes and 1 skip.
- `npm run build` passes.
- Browser: Playwright on vite preview of the final build, Chromium and WebKit. Each rule case at 360x640, 390x844 and 1440x900. A smoke run at the 17 sizes of the matrix. Deliberate faults on the served files must fail their rule case at the three sizes.
- Report: `parallel/reading/run/report.md` in the design project.

## 3. Verification

[Issue 01](issues/01-reading.md), section "Verification".

## 4. Reviews

- Approval: the owner gave the design and build decisions of this project to the lead (`docs/DECISIONS.md`). The lead accepted the plan, its six conflict resolutions and its list of items to leave out (scope.md).
- The new strings follow the copy table of `runs/learning/learning-spec.md` where it has an entry. The new strings with no entry are in issue 01.
- An independent review comes before a pull request. AGENTS.md: this change is visible, so it waits for the owner's yes on a rendered sample before a merge.
