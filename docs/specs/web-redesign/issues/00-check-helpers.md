# 00 · Check helpers and sample states

Status: ready-for-agent (the owner approved [the spec](../spec.md) on 2026-10-09)
Blocked by: PR #24 (decision D1)

## Scope

- No owner choice of its own. It makes every later step smaller and safer: the checks go through helpers, and the samples come from one tool. It changes no app code and needs no owner sample.
- Files: new `tools/app-ui.mjs`; `docs/specs/web-ux/capture.mjs` (a state table); new `docs/specs/web-redesign/samples/` (one state table for each visual step); the checks below.

## Plan

1. [ ] Merge `origin/main` into the step branch (plugin and docs commits). Run `npm test` and `npm run check:browser plugin-ui`. Record the plugin page size (`node tools/plugin-ui-build.mjs`) in Comments.
2. [ ] `tools/app-ui.mjs`: helpers that read today's ids. `menuItem(page, name)` (today: `#new-game-btn`, `#settings-btn`, `#rules-btn`, `#workshop-btn`), `openMenu(page)` (today: nothing to open), `openExtra(page)`, `setPace(page, value)` (today: `#settings-btn` and `#pace`), `endTurn(page)` (today: nothing to press; the computer replies at once), `contextText(page)` (today: `#status`, `#move-help` and `#moment`), `lanMoves(page)` (today: the LAN of the `#moves [data-ply]` rows). Later steps change only the helper bodies.
3. [ ] Route every check through the helpers. The files that click the four nav buttons: `docs/visual-design/verify.mjs`, `tools/new-game-ui.mjs`, `tools/ux-defects/open.mjs`, `d2-hint`, `d3-review-readouts`, `d4-start-asks`, `d8-letters-stay`, `d9-copy-feedback`, `d10-enemy-card`, `verify-account`, `verify-cursor-adoption`, `verify-lesson-return`, `verify-new-game`, `verify-painted-game`, `verify-playable-clay`, `verify-workshop`, `verify-workshop-cast`. The files that read `#moves`: `docs/visual-design/verify.mjs`, `tools/measure-load.mjs`, `qa`, the probes `d1`, `d2`, `d3`, `d4`, `d6`, `d7`, `d8`, `d10`, `verify-account`, `verify-cursor-adoption`, `verify-new-game`, `verify-painted-game`, `verify-playable-clay`, `verify-powers`, `verify-special-moves`. Each changed assertion line gets its `Removed-check:` trailer here, once.
4. [ ] Samples: `capture.mjs` takes `SAMPLE=<NN>` and reads `docs/specs/web-redesign/samples/<NN>.mjs` (a query, a seeded save and steps for each state). It renders each state at the sizes of spec rule 3 with Motion Off for stills, and checks no sideways scroll, controls inside the screen and 44 px targets on touch. Copy the renders out of the output folder; never commit them.

## Verification

- [ ] Every check passes with no change of behaviour; each changed check runs three times with no failure.
- [ ] `npm test` and `npm run check:browser` pass.
- [ ] `SAMPLE=00` renders today's game screen at the five sizes, as a test of the tool.

## Risks

- A helper that hides a real failure: each helper fails with the id it looked for.

## Does not do

- No app change, no owner sample.

## Comments
