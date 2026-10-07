# Workshop code and art facts

Type: research
Status: resolved

## Question

motion.ts exports and the one place in dialog.ts where react() belongs; the selectors it animates against what art.ts renders; fit() and the board CSS hooks for a side-by-side layout; the REVIEW-2026-10-06 fixed list; WORKSHOP.md heading map and contradictions; the test titles; the art pipeline from source PNG to webp and the source of each shipped figure. Needed by: Workshop finish.

Resolved by the workflow retro-spec-facts (run wf_354ee3fb-e64); the report lands in the scratchpad facts folder and its gist is appended here.

## Answer

The full report is in the session scratchpad under `facts/workshop.md`.

- `motion.ts` exports `cancel(root)` and `react(root, previousLook, nextLook, previousVerdict, nextVerdict)`. `react()` has no caller; `cancel()` is a no-op because nothing registers. Connected as it is, it throws on every edit: it reads `.g-track` with a non-null assertion and `art.ts` renders a `.ws-gauge.ws-thermometer` without it.
- Of the 19 selectors `motion.ts` uses, `art.ts` renders 3 (`.ws-model`, `.ws-fig`, `.ws-gauge`). Only the A1 gait, the figure cross-fade, the A4 shake and the A5 ring can run. The gait and shake end with a `scale()` of 0.94 to 1.08 that the still CSS resets, so the figure snaps.
- The one place for `react()` is the end of `update()` in `dialog.ts` (the verdict recompute and the model and gauge re-render). Every edit, Undo and rename passes there. No "previous look" variable exists yet.
- `fit()` caps `--cell` at 44 px by width only. At 568×320 the card sits above two stacked boards (width queries at 1000 and 600 px); header 48 px and footer 60 px leave about 212 px. No height or orientation hook exists; `data-h` is written and read by no CSS. Side by side at that height means about 28 px cells with the h3, mode and forward lines hidden; the 160 px card cannot share the row.
- Esc with the + picker open closes the whole Workshop (no Escape handler on the inline picker, no `cancel` listener on the dialog). The gauge's `aria-valuetext` says "1 pawns", not "about 1 pawn".
- Review fixes: of 29, browser checks cover 4 in part, vitest 10 (model level), 5 went away in the redesign, 11 have no check.
- Tests: 41 `it` blocks in 5 files, vitest environment `node`; no test imports `dialog.ts`, `motion.ts` or `sandbox.ts`. Unknown: whether happy-dom or jsdom implements `Element.animate` well enough for a `react()` test.
- Art: `tools/prepare-workshop-art.mjs` reads `cast.json` (34 entries with `source`), splits each paired PNG into ivory and charcoal halves, trims, resizes to 384×448 and writes `public/ui/workshop/{id}-{w,b}.webp` (68 tracked, 2.3 MB). It needs `sharp`, a transitive dependency only. 33 of 34 sources are untracked PNGs in the Codex worktree (62.6 MB chosen; 90 MB untracked in all). The literal 34 sits in four places.
- `art-src/` (806 MB, ignored except `MANIFEST.md`) has no Workshop folder. The manifest precedent for generated art is the cards section: source "— (made <date>)", licence note "generated with Codex image_gen on the owner's plan, from ... as reference". A natural home: `art-src/workshop/{id}.png` + `{id}.prompt.txt` and a `## workshop` manifest section.
