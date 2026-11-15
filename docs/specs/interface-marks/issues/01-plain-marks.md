# Plain marks under the figures

Status: ready-for-human

Spec: [Plain marks](../spec.md).

## Acceptance

- All 18 actions use the approved colours and Quiet rings and paths.
- Marks scale with squares. The dark edge draws first.
- The renderer draws marks below figures, in Figures and Symbols.
- Preview marks stay during playback. Result marks stay until the next action.
- Check, Freeze, Ice Wall, Guard and Holy Light track the current position.
- Haste and Beast show the remaining route. Haste shows step numbers.
- The old page keeps its default renderer behavior.
- The text and 44 px square controls keep the meaning accessible.
- Full tests, documentation tests, build and the three-size browser run pass.

## Verification

The final checks below pass. The stage report records logs, images and limits.
No commit, push, pull request or deploy occurs.

## Implementation

The scene draws Plain marks in its existing under-layer hook.
The new page enables the named option. The old page keeps its default drawings and clock.
The action list supplies preview, playback and result marks. Current engine state supplies protection and check.
The page removes the SVG mark layer. Each legal target has an action description.
The chosen ring draws after protection. A piece with no legal action keeps its chosen ring.
A later Haste step replaces the first landing ring with a dashed trail.
The registered save check reads legal target descriptions. Its save assertions stay.

## Final checks

Evidence paths start in the design project's `runs/launch/marks/`.

| Check | Result | Log |
| --- | --- | --- |
| Full npm test | 6425 passes, the same 384 skips; 114 Node passes | `tests.log`, `tests.json` |
| Test preservation | 36 added cases, no removed case, same skip list | `test-audit.json` |
| Documentation | 187 passes, one existing skip | `docs.log` |
| Normal build | Pass | `build.log` |
| Registered save check | Pass | `next-save-final.log` |
| All actions and selection | 171 passes | `browser.log`, `browser.json` |
| Motion and step gap | 36 passes | `motion.log`, `motion.json` |
| Haste trail proof | Fails before the fix, passes after it | `trail-red.log`, `trail-green.log` |
| Source and preview audit | 14 source hashes match; ten preview ports are closed | `audit.json` |

Both browser runs use the final normal build and record no console or page error.
The action matrix also checks Symbols in Chromium, all legal targets, result life, Continue, Undo and 44 px squares.
The motion matrix checks Normal, Fast, Off, system reduced motion and the Haste and Beast step gaps.
The report holds all screenshot paths. All 325 captures receive visual examination in 28 contact sheets.
Five final captures also receive examination at full size.

## Limits and departures

Burn follows the engine: the actor moves onto the captured square. The dashed Ember ring sits below it.
The text stays in the existing reading area above or beside the board. Long content can need internal scroll on a short phone.
Frame loading and departure from an idle pose can precede the active 900 ms action clock.
Symbols show the board result at once. The interface can still play a card flight at its stored pace.
The open Beast chain keeps the existing save limit before End turn.
No physical phone, sunlight, screen reader, Firefox or full old-page browser matrix runs here.
An independent review comes before a pull request. No publish occurs.

## Repair

Both independent reports describe real faults. The repair rejects no finding.
Current state now owns lasting Ice rings. Past Freeze, Ice Wall and Firewall actions cannot restore old rings.
Text reads the same current protection and check sources as the drawings.
Each state has text and square descriptions. Haste text names both drawn steps.
The action paragraph keeps its height while next-step marks pause or change.
A Beast with no next capture says Select End turn.
The unused SVG error keyframes leave the page. Square refusal feedback stays.
The test audit reads skipped status and keeps duplicate case counts.
Two merged-action tests fail before the Ice fix. Three text tests pin state and route facts.
The browser checks fail on each reported fault before the fix.
Carry item 11 keeps the long-rule scroll and its lower shade at 360×640.
The design project's stage report gives the final logs, results, images and checks not run.

The registered save check also finds a helper fault. State descriptions are not legal move targets.
The pawn helper now selects the description of that pawn's move. Every save assertion stays.
The original helper fails the staged-write assertion in the repair's next-save.log.
The repaired helper passes the same registered check in next-save-final.log.
The repair adds five unit cases. The full suite has 6430 passes, the same 384 skips, and 114 Node passes.
The final repair browser matrix has 72 passes. Six extra fault-state cases pass.
No console error, page error or unexpected failed request occurs in those 78 cases.
The exact skipped-case comparison keeps all duplicate counts. No test is removed or newly skipped.
