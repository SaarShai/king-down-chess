# Shown king names

Status: resolved
Type: task

The owner approves this text change in round 2, decision 124 item 2.

Use Sky for Stratus and Earth for Mud in player text. Keep the engine IDs,
asset paths, saved options, saved games, tool enums and server values.
Do not change layout or paint image labels.

## Result

`src/king-label.ts` holds the one display map. Both game pages, both guides,
the learning panel, the workshop and the app screens use it. Muse accepts
the shown names and the old IDs. Its answers use the shown names. The app
and Muse tool descriptions name Sky and Earth. The live Muse tool document
is generated again after the description change.

The current rules and matrix text use the shown names. The history in
RULES section 6 stays unchanged. Generic King move and history text stays
generic. The named move helper check uses Sky and Earth.

The build 6 save fixture loads through both page readers. Stored options
keep both old IDs. The browser check starts Sky with Flight and confirms
the saved Stratus ID and the old emblem path. No rule, match or online
source file changes. No asset or schema enum changes.

## Checks

- Full `npm test`: 7,338 pass, 387 skip, one fail. Only the known animation
  rebuild case fails. It needs 31 GiB free; the disk has about 13 GiB free.
  The test stays unchanged.
- Focused `npm test`: 159 pass in six files. These are king-label,
  interface/play/saved, interface/play/menus, muse/board-words, new-game and
  powers-ui. All 114 render tests in the 30 `.test.mjs` files also pass.
  Their folders are `docs/2d-first-pieces` and `src/render/painted`.
- `npm run test:docs`: 197 pass, one existing skip. The first run finds a
  stale generated Muse tool description. Generation repairs it; the next run passes.
- `npm run typecheck`: both TypeScript checks pass.
- `npm run build`: pass, 483 modules.
- `npm run check:browser king-labels`: pass. Ten screen and browser cases,
  plus the old page picker in both browsers. Port 5453 only. Chromium uses
  360x640, 390x844, 430x932, 768x1024, 844x390 and 1440x900. WebKit uses
  the three phone sizes and short landscape. All 30 screenshots are saved
  in the round 2 build folder under `lane-c-shots/`. The guide shots show
  Sky and Earth after the art loads. The phone and desktop shots are inspected.
- Tesseract reads all 10,905 public images, including the 12 rasterized SVG
  icons and all animation frames. No read errors. No Stratus or Mud word match.
  No public image label needs a file or page-use entry. No image is repainted.

## Remaining names and handoff

The final text search has one old-name line in the player rule document:
RULES line 155, the historical decision of 2026-09-13. It stays as a record.
The other source matches are IDs, enum values, comments and old art prompts.
Asset paths and data attributes keep their old names for compatibility.
The round 2 build folder holds `lane-c-grep.txt` and the OCR log and results.

Lanes A and B keep the small display-map calls when they merge home, main
and texts. No other rename change is needed from them. The WebKit game
shot still shows the known Computer word wrap. Lane B owns that repair.
The lead owns the App Store iPad `05-kings.png` replacement in decision 124.

No live app host or physical iPhone check runs here. No push, merge or deploy.
