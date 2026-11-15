# Menus: Play, New game, the Menu, You and the Guide on the new page

Status: ready-for-human

Branch: the working copy of lane "menus" (`parallel/menus/game` in the design project). No commit, push, pull request or deploy until the owner says so.

## 1. Source

The lead's launch decisions 24 to 31 and 37 (design project, `runs/launch/decisions.md`), with 45, 46, 51 and 52, fault 4 of the soak report, fix 11 of the speed report (the parts in the files of this lane) and the iOS needs P1, P2, P4 and P5. The stage scope is `runs/launch/menus/scope.md`. The plan is `runs/launch/menus/plan.md`; the lead accepts each row of its table "Conflicts and precise proposals". The visual reference is the lab `labs/menus/`.

## 2. The plan

### Goal

On `/next.html` Play is the games screen with one main action, the New game panel shows the army that the next game uses, the in-game Menu keeps its exits in view, You and the Guide use one control set, and home shows before the board code loads.

### Scope

- [Issue 01](issues/01-menus.md): decisions 24 to 31 and 37, 45, 46, 51, 52, soak fault 4, speed fix 11 and the iOS needs P1, P2, P4, P5.

### The precise readings (accepted by the lead)

1. Random resolves when the candidate is made. The panel shows that side; Start game does not draw again.
2. One main button on a screen: "Play the computer" or Continue on Play, Start game in the panel.
3. The Menu has a budget of 328 px at 390x844 (head 44, exits 44, note 20, five rows of 44). At 360x640 only the setting rows scroll.
4. When the last write failed, the Menu shows the cannot-save line (or the other-tab line), not "Your game stays saved."
5. The last action on the small board is the last real action: a staged step when there is one; a pass marks no square.
6. No warning in the panel for an empty, finished or kept game. The keys of the save and the stored choices stay the same.
7. A kept save that this page cannot open has no Continue.
8. Reset hints stays in You, where the learning stage put it.
9. Cards: four columns on a wide screen, two on a phone.
10. The turn identifiers stay.
11. The panel replaces the dialog "Start a new game?".

### What does not change for the old screens

- `index.html`, `src/main.ts`, `src/screen/*`, `src/account/*`, the routes, `public/sw.js` and the manifest.
- `tokens.css`, `components.css` and `kit.js` go only to `next.html` (through `play/main.ts`). The old page takes none of them. The browser check `old_page` confirms that the old page takes no file of this stage and has no error.
- The save shape, the keys `kingdown.save`, `kingdown.save.kept`, `kingdown.setup`, `kingdown.side` and the settings fields.

### Checks

- `npm test` and `npm run test:docs` pass. No test is removed, skipped or weakened. `tools/verify-next-save.mjs` changes its selectors and its path to a game with powers (the New game panel); each save assertion stays.
- `npm run build` passes. `npm run check:browser next-save` passes.
- The browser run of this stage passes in Chromium and WebKit at the size matrix, with the soft case 320x568.
- The home of the next page is usable in 3 s on "fast 3G" with a 4 times slower processor.

## 3. Verification

[Issue 01](issues/01-menus.md), section "Verification".

## 4. Reviews

- Approval: the owner gave the design and build decisions of this project to the lead. The lead accepted the plan on 2026-11-14.
- The level lines are the words of decision 46. The other new strings have no entry in the copy table of `runs/learning/learning-spec.md`. They are in `home.ts` (`homeText`) and `menus.ts` (`menuText`).
- An independent review comes before a pull request.
