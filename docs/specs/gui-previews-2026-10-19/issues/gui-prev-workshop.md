# GUI previews 2026-10-19: the web Workshop

Status: in-progress
Type: task

## Why and the rule
Saar, 2026-10-19: "by the time i get back - everything must be sleek and pixel-perfect and faultless and beautiful to look at and a joy to use." His standing rule: a taste call needs his approval. So this lane builds a PREVIEW of the recommended pick of each item below, on its own branch, at award-level craft. Nothing merges until he approves the item on his approval page. Build each pick exactly as its option text says; do not build the other options; add no idea that the item does not name. Where a pick leaves a detail open, choose the most restrained and clear answer, and name it in your answer as a taste choice.

Record: copy this ticket to docs/specs/gui-previews-2026-10-19/issues/<this file name> in the repo, set its Status to done, and add the check results at the end.

Screens before the change: /private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/lanes/gui-review/gallery/ (INDEX.md names each image). The expert reviews: /private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/lanes/gui-expert/panel.md, /private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/lanes/gui-review/suggestions.md, review-astra.md, review-opus.md; /private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/lanes/gui-expert/argon-1.md, argon-2.md.
Proof for each item: before and after screenshots of each screen it changes, at the sizes where it shows (plugin harness: 390x844 and 1280x800, light and dark; web: 390x844 and 1440x900), saved as /private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/lanes/gui-prev-workshop/previews/A<n>-<screen>-<size>-<theme>-before.png and -after.png. Take the before shots from the branch base, the after shots from your commit. A test for each behaviour change. npm test and the plugin-ui browser check pass. One commit per item.
Art: new or changed images only through Codex's built-in image_gen on the ChatGPT plan (never the paid images API). Match the painted cast (public/pieces/painted-2d/, docs/2d-first-pieces/) and keep every page under its size limit (the plugin page HTML stays under 1,000,000 bytes).

### A13 Rule seals in the Workshop

Problem: The wax seals have a strong shine.

Build: **Matte wax**. Less shine, softer shadow; same shapes and colours.

Why this pick: A matte seal matches the matte painted look.

Other options (do not build): Flat ink (No wax at all.)

### A29 Workshop: plaques cut at the row edge

Problem: On a wide screen the last rule plaque runs past the right edge, as a scroll row does. On a phone a name is cut hard with no fade. It touches your Proving Ground layout.

Build: **Add the fade to the phone row too**. The same fade as on the wide screen.

Why this pick: A soft fade on the phone shows that the row scrolls, as the wide screen already does.

Other options (do not build): Wrap the plaques onto more lines (No scrolling; the row grows taller.); Keep as it is (The cut shows that the row scrolls.)

### A32 Workshop tabs keep the pawn on the bench

Problem: After a change to Kings, Cards or Rules, the bench still shows the pawn. It changes how the Proving Ground works.

Build: **Show the first item of the new tab**. A change of tab changes the bench.

Why this pick: The bench then always shows something from the tab you chose.

Other options (do not build): Show an empty bench with a short prompt (The player picks the item.); Keep as it is (The pawn stays.)


## Plan and checks

Base: `bc62f4ee`. Branch: `claude/gui-prev-workshop`.

1. A13: reduce the seal light to .06. Use the review shadow: 1.5 down, 1.2 blur, .22 opacity. Keep each shape and colour.
2. A29: remove the phone mask override. Use the same 24 px fade as the wide row. Keep the scroll and the row height.
3. A32: open the first item when the player changes a library tab. Keep the Board tab on the current item.

For each part, save before and after web screens at 390×844 and 1440×900, at 2× scale. Review each changed area at 2×. Add a check for each change. Run the type check, unit tests and the approved browser runner. The runner checks committed code. Record the results here. Keep each part in one commit.

The Workshop is a web screen. It has no plugin screen or host theme. Plugin checks still guard the shared game code. No server code changes are planned.

## A13 preview

The seal uses the review values. The wax light is .06. The shadow uses 1.5 down, 1.2 blur and .22 opacity. The shapes and colours stay the same.

The type check passes. A unit check covers all ten seals. The browser check reads the shared shadow and all ten lights. The full test run waits for the shared test lock. Screens and browser results follow after the commit.

The 2× review finds a second CSS shadow on the large seal. It is removed. The shared SVG shadow now draws each seal at its size. This is the only extra taste choice in A13.
