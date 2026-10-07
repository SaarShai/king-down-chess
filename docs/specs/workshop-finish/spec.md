# Workshop finish
Status: ready-for-agent
Source: docs/specs/retro-2026-10-06/retro.md items 1, 2 (the Workshop part), 3, 25, 26, 27

## Problem Statement

The player sees no reaction to an edit, and the reaction code throws on the current card. On a 568×320 phone the first board starts about 555 px down. A rewrite cut the browser check from 712 lines to 74; 11 of the 29 review fixes have no check. Small faults remain: Esc in the + picker closes the Workshop. WORKSHOP.md contradicts itself. 33 of the 34 figure sources lie untracked in a Codex working copy.

## Solution

Each edit plays an approved reaction for at most 600 ms, and none under reduced motion. A landscape phone shows both boards and Try it. The checks measure layout and review fixes again. The small faults go. WORKSHOP.md tells only the current state. Each figure has a source and a prompt.

## User Stories

Checks run in `npm test`, the motion seam (Testing Decisions) or the browser checks `workshop` and `workshop-cast`.

1. As a player, I want one reaction per edit, Undo or rename, which stops at my next action, so that I see the change. Check: motion seam.
2. As a player, I want each reaction to end within 600 ms (300 ms at Fast) at the still size, so that nothing jumps. Check: motion seam.
3. As a player with reduced motion or Animations Off, I want no reaction, even a running one, so that the screen stays still. Check: motion seam, `workshop`.
4. As a player at 568×320, I want both boards and Try it in view without a scroll, so that I edit and test at once. Check: `workshop`.
5. As a player at 320×568, 390×844, 768×1024 or 1280×900, I want each board whole in view after a scroll to it, and Try it in view, so that no row hides. Check: `workshop`.
6. As a player, I want cells of 24 px or more, so that I hit the square I mean. Check: `workshop`.
7. As a keyboard player, I want Ctrl/Cmd+Z to do nothing under a sheet, and the game to get no Workshop key, so that keys act only where I am. Check: `workshop`.
8. As a keyboard player, I want arrows to move a choice and Enter to commit it, so that I need no mouse. Check: `workshop`.
9. As a player in a choices panel (+ picker, pill or When), I want Esc to close only the panel and focus its opener, so that I keep my Workshop. Check: `workshop`.
10. As a player, I want a stroke to end when I release off the board, and a press from a sheet to its backdrop to keep the sheet, so that I lose no work. Check: `workshop`.
11. As a player in Try it, I want a choice on a two-action square, focus on the landing square and the exact Safe rule words, so that I test what I made. Check: `workshop`.
12. As a player whose clipboard refuses, I want a sheet to copy by hand, so that I still share. Check: `workshop`.
13. As a player, I want toasts to clear on a screen change, so that no old message misleads me. Check: `workshop`.
14. As a player with a full shelf, I want the Workshop to ask which design to delete, so that I lose nothing. Check: `workshop`.
15. As a screen-reader player, I want the thermometer to say "about 1 pawn, the unit of worth", so that it agrees with the summary. Check: art test.
16. As a player, I want Surprise me to add no glow, so that my save holds nothing unseen. Check: `workshop`.
17. As the owner, I want each review fix to show its check, "superseded" or "not checked: <reason>", so that none goes silently. Check: fix-table lint.
18. As an agent, I want the Workshop checks to run on any channel and server without a tracked change, so that one recipe serves. Check: check lint, runner's changed-file guard.
19. As a builder, I want no dead code, stale CSS or literal cast size in the Workshop, so that I maintain only what runs. Check: `noUnusedLocals`, CSS test; review.
20. As the owner, I want WORKSHOP.md to tell only the current Workshop, with today's revision 3 in a dated file, so that I read one truth. Check: doc lint.
21. As the owner, I want one approved source PNG and prompt per figure, with a manifest row, so that an art helper can redraw it. Check: art-script and figures tests.
22. As the owner, I want the shipped art folder to hold only the 68 webp of the figure module, so that the repository stays small. Check: figures test.
23. As the owner, I want the agent to delete the rejected batches only after my recorded yes, so that no chosen source goes. Check: a listing of the Codex working copy.
24. As an art helper, I want one command to remake the webp in any checkout, so that a new source ships in one step. Check: art-script test, `workshop-cast`.

## Implementation Decisions

**Motion.**
- The dialog keeps the last look and verdict. Its render function ends with the reaction, except on a first render.
- A rename renders one time: the full render runs only when no edit render runs.
- The motion module keeps only A1 (gait, cross-fade), A4 (shake into overpowered) and A5 (gold ring), whose targets the card renders.
- Keyframes end at the still transform, with no worth scale.
- The model element gets a position. The fading copy lies absolute over it; the ring anchors to it.

**Landscape.** One media query, landscape and at most 500 px high, holds the mockup numbers:
- header 44 px, footer 49 px;
- a 120 px card column with an 84 px figure and no thermometer;
- boards side by side: 27 px cells, 197 px boards, 14 px titles, no mode or forward line;
- the Apply-to select and the rest below, in the scroll.

The fit function also caps the cell by height in short landscape, and runs on an orientation change. Its 24 px floor replaces the 28 px minimum of revision 3. Other layouts do not change.

**Checks.**
- The Workshop check becomes readable code on the shared assertion module of checks-and-hooks. In short landscape, `minTarget` accepts 36 px for the header buttons and 28 px for the pen, the eye and the Take-by select, as in the mockup.
- It restores each old group of `84f9e42` and `8c91940`, except brushes, tabs, glows, Mix two, the Saved screen and the desktop editor column, whose features are gone.
- The fix table gets a "Checked by" column:
  - the browser check: fixes 4, 5, 6, 9, 13, 20, 27, 29 and the line edge of 28;
  - the judge test: the Why? band of 28;
  - the motion seam: 26, whose gradients and seams are "superseded";
  - fix 25: "not checked: preview page outside the build".
- Both checks use `env`, `launch`, `trapErrors`, `assertNoErrors` and `shot`. The cast check uses `imageIs`.
- The judge test gives the seeded case "never lowers W" a 30 s limit, as checks-and-hooks asks.

**Small faults.**
- The keydown listener of the dialog handles Escape for the choices panel.
- The glow field stays, so old saves and links load.
- The dead code of the retro appendix goes with its tests, among them the five unused names that the `noUnusedLocals` gate of checks-and-hooks needs.

**Doc.**
- Revision 3 moves whole into a dated review file. Code comments that cite its sections name that file.
- The new Workshop doc covers screens, layouts, model, judge, motion, art, accessibility and checks. It names the runner's untracked screenshot folder, not the revision 3 folder.
- The anchor table and the new doc cite run ids, such as `pv-A-af2` for the Archer far2, not task-list lines.
- The doc lint fails on a deny list of removed features. Both lints use the doc-lint suffix of checks-and-hooks.

**Art.**
- The main checkout's art-source folder gets a workshop folder: per figure, one paired PNG and one prompt file (or "prompt not recorded"), named by id. The art manifest gets a workshop section.
- The cast list loses its source field. The art script finds each source by id in the main checkout, through git's common directory, and writes into the current checkout. It stops on a missing PNG or prompt.
- After the copy, one art-script run in the main checkout leaves the 68 tracked webp unchanged. This proves the sources.

## Testing Decisions

- A good test asserts what the player sees or saves, not which function ran.
- The figures test asserts the cast list equals the figure module, a manifest row per figure, and only two webp per figure in the shipped folder.
- The art-script test starts from `tempRepo()` of checks-and-hooks and adds a linked worktree and a fixture PNG. It asserts the two webp, the lookup by id and the stop on a missing file.
- The CSS test asserts that each Workshop stylesheet class occurs in the Workshop source.
- The art test asserts the value text.
- The motion seam: if a probe finds `Element.animate` and `document.getAnimations` in happy-dom, a DOM test under happy-dom asserts stories 1 to 3. If not, the `workshop` check asserts them from animation end times.
- Prior art: `ui.test.ts`, `figures.test.ts`, `judge.test.ts`; `verify-workshop.mjs` at `84f9e42` and `8c91940`.

## Out of Scope

- A3 on the thermometer fill, and other new motion: these need the owner's yes.
- Mix two and the Saved screen: the owner removed them. The mix function stays.
- The runner, shared assertion module, hooks, `sharp`, happy-dom and compiler settings (checks-and-hooks); the size gate and art ignore lines (secrets-and-public-gates); TASKS.md and the Workshop MATRIX rows with its revision 3 citation (steering-cut).
- The item 25 check that WORKSHOP.md changes in each Workshop code commit: a code-only fix needs no doc change.
- Items 7 and 8 (except the size gate and ignore lines), 9 to 13, 18, 19, 21 to 23 and 28 to 30, and a history purge: decision 1 keeps them out.

## Further Notes

- Only the landscape layout waits for the owner's yes on the mockup (issue 07).
- Checks-and-hooks comes first. Steering-cut needs the run-id anchors.
- Open point 1 (owner): the mockup hides the thermometer; a 150 px card keeps a small one, with 25 px cells. The build hides it.
- Open point 2 (owner): in short landscape, 36 px header buttons and 28 px pen, eye and Take-by select (the mockup), or 44 px for all with smaller cells. The build takes the mockup.
- Open point 3 (owner): the rejected batches go after the 34 sources are safe. The build waits for the recorded yes.
