# GUI faults 2026-10-19: the shell controls

Status: done
Type: task

Source: the expert design panel (/private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/lanes/gui-expert/panel.md) and an independent check of each fault (/private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/lanes/gui-expert/fault-plan.json). Each part below is a verified FAULT with one right fix. Build only what each part says. Anything the part calls taste or "for Saar" stays out. Saar's look decisions stand (docs/specs/*/spec.md; the painted look only).

Record: copy this ticket to docs/specs/gui-faults-2026-10-19/issues/<this file name> in the repo, and set its Status to done with the check results at the end.

Gallery for the before state: /private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/lanes/gui-review/gallery/ (INDEX.md). Render compares: use tools/render-compare (see AGENTS.md) where the part asks for one.

### F01 (Saar's own request: "the texture of the stone on the buttons looks too low res")

The fault: src/plugin/assets/stone-control.webp is 232x120 px, and src/plugin/app.css:346 draws it at max(100%, 384px) wide, so the browser enlarges it 1.66x at 1x and 3.3x or more on 2x screens. The red buttons use the same image under a tint.
Fix: keep the look (Saar's pick C1 a: the same stone, the same eight crops and 8 px joins; read docs/specs/stone-controls/ and docs/specs/taste-recommended/issues/04-owner-decisions.md first, and find the script or notes that made the current file). Export the file again from the full-size source (docs/2d-first-pieces/board-art/source/light-stone.png, 1254x1254) at a size that gives at least 2 device pixels for each CSS pixel of the widest control: 768 px wide or more (up to 1056 px for the 528 px widest control). Keep the aspect, the crops and the joins; app.css stays unchanged, except a background-size change only if the new size needs it to keep the same CSS look. Keep the plugin page payload below its limit (the build reports the page size; the limit is 1,000,000 bytes). If the full size does not fit, use the largest that fits and report it. Never enlarge the small export.
Files: src/plugin/assets/stone-control.webp, the export script or notes if they exist (else add a short script under tools/ that makes it).
Proof: a render compare of the home card and the 400% button close-ups before and after (plugin-stone-button-400pct-1280x800-light.png, plugin-red-button-400pct-1280x800-light.png): the same colours and layout, sharper grain. The page payload number before and after.

### F03

Fix: In the stone disabled rule (src/plugin/app.css:374-377), use the recorded off-label colour, ink-soft #5b5045 at 75 % (docs/specs/web-redesign/spec.md:111; docs/visual-design/contrast.mjs:55-63). The stone rule at app.css:344 sets --ink-soft to --ink on each control, so do not read var(--ink-soft) as is. Set `--ink-soft: rgb(91 80 69 / 75%); --fg-soft: rgb(91 80 69 / 75%); color: var(--ink-soft);` in the disabled rule, so nested .line text and the sword SVG (fill: currentColor) follow. Delete the dead rule at app.css:123 (#table-bar > button[aria-disabled='true'], specificity too low, and 60 % gives about 2.7:1). Do not use #8a8072 (--stone-500): it is the border token and it is not the recorded off-label value. Do not add the hover brightness(1.04): that is a new idea for Saar. Do not change src/ui/table.css:39 (web).

Files: src/plugin/app.css

Proof: Run docs/visual-design/contrast.mjs (the 'off label on a disabled button' row stays 3:1 or more). Browser check in the plugin harness at 390x844: the computed color of the disabled Undo and sword button is rgba(91, 80, 69, 0.75), and the enabled Menu stays rgb(43, 38, 33). Render-compare the board bar before and after.

Web overlap: Lane LOOK and inventory B27 later lift the stone disabled rule into shared CSS; web-build ticket 05 puts the shared plugin CSS in one definition after the src/plugin/ handover. Land F03 first or give it to that writer. Web-adaptation tickets 03-06 do not touch app.css.

## Build plan and checks

1. Save matching Home, button close-up and board-bar renders through the required runner.
2. F01: export the eight crops from the full stone source. Keep the crop order,
   joins and CSS. Test the export size and repeat output. Check the page size.
3. F03: set both disabled text tokens to the recorded colour. Remove the dead
   rule. Test the built CSS, nested text and sword colour at 390 × 844.
4. Run the type check, unit tests, contrast check and required browser checks.
   Compare each render set. Record each result. Use one commit for each part.

## F01 result

The export is 1056 × 546 px (the nearest whole-pixel height). It uses 543,402
bytes. The old export uses 22,384 bytes. The source is the full 1254 px stone,
with the same eight tile positions, turns, tones and joined crop order. The
script keeps each 8 px join at the same share of the image. CSS stays the same.
The old small export is not an input. No art is generated.

The page uses 753,408 bytes before and after. Its resource payload stays at
757,276 bytes, below 1,000,000. Art is served as a separate file.
At the old size, the RGB RMS difference is 4.02 out of 255. Each mean colour
channel changes by less than one level. The export test checks size, aspect
and repeat output. The browser check checks the device-pixel floor.

Proof files stay under the lane's `proof/` folder. The before set uses the
same browser, 2× device scale and sample code. Two first sample runs fail
because of sample setup faults. The third saves all four images, then finds
a sample cleanup fault. The fixed check deletes its sample game.
Typecheck passes. The fixed `plugin-ui` check passes on this Mac at
`0527cc28` (299.2 s). The unit run gives 3,218 passes, eight skips and one
failure: the unchanged fixed-depth search test exceeds its 5 s limit.
The final full run repeats this check without a browser run beside it.

The render compare has four pairs, four expected texture changes and no
missing image. Both 400% close-ups keep their exact size (832 × 360 and
816 × 360). Their outer 24 px edges have no pixel change above threshold 16.
Image review shows the same colours, labels, borders and layout, with clear
grain. The page payload stays at 757,276 bytes. No taste choice is added.

## F03 result

The stone disabled rule sets both soft text tokens to `rgb(91 80 69 / 75%)`.
The dead table-bar 60% rule is removed. The web table CSS stays the same.
The browser test checks native disabled text, nested line text, the soft
foreground token, Undo, the sword colour and fill, and enabled Menu.

The contrast check passes all 36 pairs. The disabled-button row gives
3.59:1, above 3:1. Typecheck passes.

## Final verification

- `npx tsc --noEmit`: pass for both parts.
- Final `npm test`: 193 files pass; 3,219 tests pass, eight skip.
  All 51 artwork tests pass. The first run's search timeout does not recur.
  No test limit changes. The local test database uses the owner's URL.
- F01 `plugin-ui`: pass at `0527cc28`, 299.2 s. The F01 amendment only
  records these results. Its product and test code stay the same.
- F03 `plugin-ui`: pass at `5469936f`, 205.4 s. The required runner exits 0.
  Both proof runs use this Mac and the same browser, at 2× device scale.
- At 390 × 844, disabled Undo and the sword colour and fill compute to
  `rgba(91, 80, 69, 0.75)`. Enabled Menu computes to `rgb(43, 38, 33)`.
  Native disabled nested line text and the soft foreground token also pass.
- F03 render compare: four pairs, one expected board-bar change, no missing
  image. Home and both 400% button close-ups match F01 pixel for pixel.
  Image review shows the disabled labels change. Layout stays the same.
- Final page: 753,365 bytes. Final resource payload: 757,233 bytes.
- `git diff --check`: pass. Both parts are complete. No taste choice is added.
  No server code changes, so `plugin-ui-http` is not required.

Evidence root:
`/private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/lanes/gui-shell/`.
It holds `tests-f01.txt`, `tests-f03.txt`, both typecheck logs,
`checks-f01-1.txt`, `checks-f03-1.txt`, `contrast-f03.txt`, the three page-size
logs, both `render-compare-*.txt` files and `f01-geometry.json`.
`proof/before/`, `proof/f01/` and `proof/f03/` hold the four matching PNGs.
The final folder also holds `plugin-shell-colours.json`.
The checks use the local plugin harness. The native ChatGPT app is not checked.
