# UI source

`tokens.css`, `components.css` and `kit.js` start as copies from the design project's `kit/`. The game changes two of them:
- `tokens.css`: the title font, the material tokens (brass main action, enamel power, the opponent's power, the card edge, the raised edge). One light theme, the paper theme. The focus colour is `--focus-ring`, because `src/style.css` owns `--focus`.
- `components.css`: the main button uses the brass tokens; a quiet button has the raised edge; a disabled button has no depth; titles use weight 700.
`kit.js` uses Capture in `targetChoice`. It also changes `confirmDialog` takes an optional `cancel` label (default "Keep playing", so Resign does not change). New game uses "Keep my game". `kit.d.ts` gives TypeScript types to the copied module.
`turn-controls.ts` keeps Undo and End turn visible in each state, and makes the state line of the reading area.
The play page adds layout rules in `play/play.css`.

The launch shell uses the bar with a named `guide` option. The default keeps Learn. Choice events also give the previous index. Confirm dialogs emit `kd-before-close` before native close, so the interface can draw the departure. `play/shell.css` places the bar, Guide and You.

The sides stage uses `errorState` unchanged for the two game faults (art and the computer's move), with Try again as its one action. `kit.d.ts` adds its type.

The menus stage (launch decisions 24 to 30 and 37):
- `kit.js`: `switchRow` adds no note when the description is empty, and shows the state as a word and as a track with a knob (`kd-switch-state`, `kd-switch-track`, `kd-switch-knob`). A switch with a description is the same as before. `kit.d.ts` adds the types of `icon`, the `icon` option of `button`, the `description` of a choice and `switchRow`.
- `tokens.css`: the safe-area tokens `--safe-top`, `--safe-right`, `--safe-bottom`, `--safe-left` (from `env(safe-area-inset-*, 0px)`), the bar heights `--bar-phone` (56 px) and `--bar-top` (72 px), the marker colour `--brass` and `--tab-mark-width`.
- `components.css`: `-webkit-text-size-adjust: 100%` on `html`; no callout, no text selection and no tap colour on controls (iOS needs P4, P5); hover styles only under `@media (hover: hover)`; no underline on a control; the segmented control as one track; the switch track; `.kd-dialog` text at the start.
- Only `next.html` takes these files (through `play/main.ts`). `index.html` takes none of them.
