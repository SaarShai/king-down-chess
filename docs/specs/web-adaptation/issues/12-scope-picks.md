# Choose the shipped picks and later work

Type: grilling
Status: resolved
Blocked by: 01, 02
Parent: [Web adaptation map](../map.md)
Labels: wayfinder:grilling

## Question

Which built plugin work and which owner picks does the web adaptation carry, and which plugin proposals stay later work?

## Rule

A documented proposal is not a built feature, and an old scope note does not override later code. A plugin pick carries to the web; a new web trade-off gets a new owner choice.

## Part 1: the base

1. Adapt all built, in-scope work at the accepted PR 61 merge. Keep absent taste proposals in a later-work list.
2. Hold the web work until every approved or suggested plugin change is built.
3. Port only the original MVP and ignore later fixes.

Recommended: 1. It carries the whole inventory and keeps the web build finite.

## Part 2: approved code outside PR 61

| Branch | What it holds | Recommended |
|---|---|---|
| `claude/od-board` (`b3b52a47`) | Direct card use (arm a coin on tap, J6), card faces in the strip, Collection costs | Include. It is a selective port into the newer board code, not a branch replacement (critic CRIT-20). It enters the plugin first, then reaches the web through the shared UI. |
| `claude/od-home` (`06c746b0`) | Hall presets and word chips | Include through the shared UI when it lands in the plugin. |
| `claude/od-look` (`c382f95b`) | L2 move chooser (omit Zoom in) | Same. |
| `taste/b2-row-preview` (`3bf795e7`), `taste/c5-seat-reveal` (`97e0dca1`) | Game-row board preview; dealt cards and the seat reveal | Same, after their samples are approved. |

No web-only port of these branches. One writer lands each in the shared code.

## Part 3: owner questions from the survey

1. **Play now level.** The records conflict: always Beginner (the selected D2 option, the later build ticket and the current code), or Beginner first, then the saved level (the D2 summary). Recommended: always Beginner; New game keeps the saved level. (CRIT-21, DEC-12.)
2. **Rating rule.** Do all human games count, as plugin Q10 does, or do friend and custom games become casual? Recommended: keep the service rule for the shared pool; a change gets its own policy ticket. (DEC-36.)
3. **No power in old modes.** Recommended: current local modes keep No power; the new setup uses the plugin rule (a king always has a power when powers are on). Under [Choose the web play boundary](09-web-play.md) option 1, local modes do not change. (DEC-09.)
4. **Open plugin samples.** B2/S2 preview repeat, C2 king choice, H4 busy pulse, Y1 Resume with a friend name, Y2 scroll cue, Y3 seat strip with king powers. Recommended: the web follows the plugin's answers; [the browser sample](14-visual-sample.md) shows each at browser sizes. (DEC-39, lane-decisions questions 6–11.)
5. **D6 card costs.** A rule change. Recommended: out of scope here; it gets its own Matrix entry and spec.

## Known distinctions

- The pinned board still has the read sheet and Use for cards and powers; direct arming is Part 2.
- The pinned app imports the shared game fonts. A note about a system-font branch is a host exception, not a web change (DEC-42).
- Email and push code is a foundation; the release keeps those jobs off.
- Lessons, Today's army, local review and the Workshop already work on the web. Keep them; they are not plugin imports.
- The balance tool refuses the Classic flag on purpose (CRIT-09). Keep that limit; it does not limit the game.

## Pass criterion

Every accepted built item maps to a phase. Every deferred item has a reason and stays outside the build.

## Answer

Decided by delegation (owner, 2026-10-18: "regarding \"my decisions\" - please use your best judgement. i trust you to make the decisions."). Three independent reviews (security, product, smallest change) checked the draft; their changes are in. Reviews: `docs/research/web-adaptation-2026-10-18/decision-review-*.md`.

- **Part 1: option 1.** All built, in-scope work at the accepted PR 61 merge is the base.
- **Part 2.** The approved code outside PR 61 (direct card use and Collection costs on `claude/od-board`; hall presets on `claude/od-home`; the L2 move chooser on `claude/od-look`; `taste/b2-row-preview` and `taste/c5-seat-reveal` after their samples) reaches the web only through the shared UI, after it lands in the plugin. No web-only port. A parked branch goes on the later-work list.
- **Part 3.** Play now always uses Beginner, and New game keeps the saved level (the explicit build ticket and the current code outweigh the short D2 summary). The rating rule stays as built: every eligible human game counts. Local modes keep No power. The open plugin samples follow the plugin's answers and appear at browser sizes in the browser sample. D6 card costs stay out of scope: a rule change needs its own Matrix entry and spec.
