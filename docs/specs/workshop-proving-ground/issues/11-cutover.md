# 11 · Cut over: A becomes the Workshop

Status: ready-for-agent
Size: L
Blocked by: 02, 03, 04, 05, 06, 07, 08, 09, 10

## Scope

- The Workshop doors open A for every player. The preview switch goes.
- Delete what A makes dead (spec, "What goes").
- The checks, the docs and the samples tell only A.

## Plan

1. [ ] **`src/main.ts:90-97`:** `openWorkshop` imports `./workshop/ground` always; remove the `?workshop=a` test. The `workshop` promise type (`:90`) names `groundDialog`, because `dialog.ts` goes.
2. [ ] **Delete:** `src/workshop/dialog.ts`, `card.ts`, `sandbox.ts`, `motion.ts`, `workshop.css`; `art.ts` (`gaugeHtml`, and `figureHtml` and `modelHtml` if A does not use them); `look.ts` `ghost`; `text.ts` `dirWords`; `tools/workshop-motion.mts`. In `judge.ts`: the exports that only the old screens read, `whyHead` (`:377`), `whyTitle` (`:180`) and `badgeText` (`:339`), with their cases in `judge.test.ts` and `ui.test.ts`. The `Verdict` fields stay (spec, "What goes"): `memory` feeds `warn` and `line`, and `judge.test.ts:102` reads `metal`. Any `vocab.ts` field that only the old UI read. Then search `src/` and `tools/` for each removed name; nothing is left.
3. [ ] **Checks** (`tools/lib/registry.mjs:32-33`): `git mv tools/verify-proving-ground.mjs tools/verify-workshop.mjs` over the old file, so the `workshop` entry keeps its name and its script path, and `src/workshop/review.docs.test.ts:17` (`CHECK`) still reads the right file; the `proving-ground` entry goes. From now on the docs lint covers the file (`tools/*workshop*`, `workshop.docs.test.ts:80`): no bare `§`; `tools/verify-workshop-cast.mjs` keeps its cast groups on A's selectors (one New-piece choice per cast figure through "More", every army file loads). The commit lists one `Removed-check:` trailer for each removed assertion line, each naming the A group that covers it or "superseded: <feature> left with A". Make the list from the diff with a script, then read each reason.
4. [ ] **Fix table:** each of the 29 rows (`FIXES`, `review.docs.test.ts:20`) of `docs/visual-design/workshop/REVIEW-2026-10-06.md` names an A group of the `workshop` check, a test title, "superseded" or "not checked: <reason>".
5. [ ] **Helpers:** `tools/app-ui.mjs:229-239` (`keepWorkshopCopy`, `workshopCopyLink`, `workshopCardText`) and `tools/app-ui.test.ts:90-92` use A's selectors. `tools/verify-home.mjs:110-116` (a `?design=` link skips Home), `tools/verify-menu-extra.mjs:192` and `docs/visual-design/verify.mjs:313-314` (`#workshop` and its backdrop) pass with no change.
6. [ ] **`docs/WORKSHOP.md`:** rewrite it for A with the 8 sections (Screens, Layouts, Model, Judge, Motion, Art, Accessibility, Checks). In the same commit, `src/workshop/workshop.docs.test.ts:29-43`: take `brush(es)`, `plinth`, `rim`, `halo` and `glow` off the deny list (A's own words); add Surprise me, the thermometer, the Why-estimate sheet and the Try it screen; `gauge` stays on it. The revision 3 file stays byte-equal.
7. [ ] **Samples:** `docs/specs/web-redesign/samples/W12.mjs` goes (W14 holds the card); `01.mjs` and any other table that opens the Workshop use A's selectors.
8. [ ] **Records:** `docs/specs/workshop-finish/spec.md` says "superseded by `docs/specs/workshop-proving-ground/`"; the `TASKS.md` line changes on main.
9. [ ] **Size:** the Workshop chunk before and after (`npm run build` output) in this ticket.

## Verification

- [ ] `npm test` passes (with the golden fixtures, the doc lints and the fix table).
- [ ] `npm run check:browser` (all checks) passes; `workshop` three times.
- [ ] `node docs/specs/web-ux/render-compare.mjs --against main`, detached: only Workshop states change.
- [ ] A save and a link made on main before this ticket load after it (the golden fixtures, and one live save in the check).
- [ ] The full W14 table renders at 1440 × 900, 390 × 844 and 844 × 390.
- [ ] The owner sees the renders before the merge; the ticket records his words and the date.

## Risks

- The trailer list is long (about 247 assertion lines in `verify-workshop.mjs`). Do not route around the hook by an unregister first.
- A removed `vocab.ts` field that an old link or save holds: none does today (the share keys and look keys are fixed), but check `validParts` (`model.ts:201-213`) before each removal.

## Does not do

- No new feature.
