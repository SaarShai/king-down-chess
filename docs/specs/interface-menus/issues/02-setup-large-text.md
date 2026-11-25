# New game at 200% text: Friendly covers Friend, and the setup is too wide

Status: needs-triage

Spec: [Menus](../spec.md). Found in the review of the New Game plinths (branch `gui-setup`). The same faults occur on `main`.

## Fault

- 568x320 at 200% text, Computer: a tap at the centre of Friend goes to Friendly. The level pill covers the right part of the mode tabs.
- 320x568 at 200% text: the setup extends 63 px past the right edge of the screen.

## Where

`src/interface/play/menus.css`: `.setup-body` (near 542), `.setup-mode .kd-segment` (near 550-554; `min-inline-size: max-content`), and the short landscape rules (near 759-766).

## Done when

- At 568x320 and 320x568 at 200% text, a tap at the centre of each mode tab selects that tab.
- No part of the setup extends past the screen edge.
- A `next-menus` case checks both at 200% text.
