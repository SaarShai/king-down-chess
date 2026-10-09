# Samples

Each visual step of the web redesign has one state table here: `<NN>.mjs`, with the number of its ticket (for example `03.mjs` or `02b.mjs`). The sample tool renders the table from a build of the step branch, and the owner says yes or no to the renders (spec rule 3).

Build the branch, serve the build, and run the tool against the address that `npm run preview` prints:

```sh
npm run build
npm run preview          # in a second shell; it prints the address, for example http://127.0.0.1:4173/
SAMPLE=03 node docs/specs/web-ux/capture.mjs http://127.0.0.1:4173/ [out-dir]
```

The tool writes `<state>-<size>.png`, `<state>-phone.webm` (for a state with `video: true`) and `report.json` to the out folder (default: `<system temp folder>/kingdown-samples/<NN>`). It refuses an out folder inside the checkout. Copy the renders out of that folder to show them. Never commit a render. Run one capture per out folder. Wait for it to finish before another capture uses that folder.

## The table

A unit can use its W number, for example `SAMPLE=W12`. Its table may add `smallPhone` (320×568).
The target check uses the top open dialog, so it does not check controls behind a sheet.

The file exports one object:

```js
export default {
  sizes: ['phone', 'desktop'], // optional; this is the default
  states: [
    {
      name: 'staged-check',      // the file name: <name>-<size>.png
      query: '?fen=...',         // optional; added to the base URL
      save: { back: 'RNBQKBNR', fen: '', moves: ['e2-e4'], white: 'human', black: 'ai' }, // optional; the seeded save
      title: false,              // optional; true keeps the title screen
      steps: async ({ page, tap, size }) => {}, // optional; tap(sq) taps square sq (0 = a1)
      controls: '#undo, #end-turn', // optional; each match must be inside the screen
      targets: 'button, select',    // optional; the 44 px targets on a touch size (default: button, select, summary, label)
      motion: 'normal',          // optional; a still with Motion Normal, for replay controls
      video: true,               // optional; also one phone video of the steps: <name>-phone.webm
      scheme: 'dark',            // optional; the device's colour scheme, 'light' (the default) or 'dark'
    },
  ],
};
```

- Sizes (spec rule 3): `phone` 390×844 (touch, DPR 2) and `desktop` 1440×900 for every visual step. A layout step adds `laptop` 1280×720, `tablet` 820×1180 (touch) and `landscape` 844×390 (touch).
- A still with `motion: 'normal'` uses Motion Normal and asks for full motion. Its steps must wait for the state to settle. All other stills have Motion Off: the seeded save gets `pace: 'off'`, and the browser asks for reduced motion.
- A motion step gives the moving state `video: true` (spec rule 3: one phone video). The video has Motion Normal: the seeded save gets `pace: 'normal'`, and the browser does not ask for reduced motion. It records the steps and 2 s after them.
- The steps reach the app through `tools/app-ui.mjs` (for example `pressMenu`, `endTurn`), so a table keeps working when a later step moves a control. Import it in the table: `import { pressMenu } from '../../../../tools/app-ui.mjs';` (see `00.mjs`).
- The checks: the app keeps every move of the seeded save (it drops a move that is not legal for the army, and the moves after it); no sideways scroll; each `controls` match inside the screen; on a touch size, each `targets` match in the open dialog (or in the page) is 44 px or more. A page error is a fault too. The tool exits 1 when a render has a fault.

A brief cue can use `clock: true`, `stillPace: 'normal'` and `settleMs: 0`.
The tool installs the page clock before load. Steps receive `video` as a boolean.
For a still, pause the clock while the cue is present. This keeps the real cue
for the image. Reduced motion stays on, so the tell shows a glow with no lift.
Motion Off has no tell. A video keeps normal time and normal motion.
