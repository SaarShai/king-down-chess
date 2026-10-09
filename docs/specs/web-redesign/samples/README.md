# Samples

Each visual step of the web redesign has one state table here: `<NN>.mjs`, with the number of its ticket (for example `03.mjs` or `02b.mjs`). The sample tool renders the table from a build of the step branch, and the owner says yes or no to the renders (spec rule 3).

Run it against a served build of the branch:

```sh
SAMPLE=03 node docs/specs/web-ux/capture.mjs <base-url> [out-dir]
```

The tool writes `<state>-<size>.png` and `report.json` to the out folder (default: `<system temp folder>/kingdown-samples/<NN>`). Copy the renders out of that folder to show them. Never commit a render.

## The table

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
    },
  ],
};
```

- Sizes (spec rule 3): `phone` 390×844 (touch, DPR 2) and `desktop` 1440×900 for every visual step. A layout step adds `laptop` 1280×720, `tablet` 820×1180 (touch) and `landscape` 844×390 (touch).
- Each render has Motion Off: the seeded save gets `pace: 'off'`, and the browser asks for reduced motion.
- The steps reach the app through `tools/app-ui.mjs` (for example `pressMenu`, `endTurn`), so a table keeps working when a later step moves a control.
- The checks: no sideways scroll; each `controls` match inside the screen; on a touch size, each `targets` match in the open dialog (or in the page) is 44 px or more. A page error is a fault too. The tool exits 1 when a render has a fault.
