# Repair the merged playtest paths

Status: resolved
Type: task

The owner asks for the eight findings from the independent review and decisions 120 and 121. Work stays on `owner-playtest-1`. The approved design stays in use.

## Answer

- Keep an armed card or power in the normal reader. A board target acts. X and Escape cancel. Outside input closes an information panel only.
- Share the short reader with the history strip. The status and strip fit at rest. A piece, action or choice uses the space above the board. Keep Menu in reach. Cancel and Undo return the strip.
- Put the newest action in history once. The reader gives the state and next step.
- Bind a king to the account, game and seat when an invite starts or a player joins. Use the panel's legal king. Keep the next-game preference for the cards-off return. Remove this account's saved bindings on account deletion.
- Keep a confirmed Manual order resumable before its first move. A new game gives the active-game warning.
- Use the common history and anchored panel updates before Ready and in the online wait.
- Use the plain home piece X with a specific name and focus return.
- Remove the unused game-page replay controller and calls. Keep the shared history data and module.

## Checks

| Check | Result |
| --- | --- |
| Focused `npm test` | 168 pass in 7 files: saved, arrange, layout, new-game, controller, seat-king and host/online. |
| Full `npm test` | 7,038 pass and 385 existing skips; then 114 renderer cases pass. No failures. Run once after the browser checks. |
| `npm run test:docs` | 195 pass and 1 existing skip in 19 files. |
| `npm run typecheck` | Both projects pass. |
| `npm run build` | Pass. |
| `npm run check:browser owner-playtest-b` | 18 groups pass: card and power target turns, choices and panels at 4 sizes, then board, portrait, Undo and scroll motion. |
| `npm run check:browser next-arrange` | Pass: 4 solo sizes, Ready then home and reload, Continue, the new-game warning, 2 pending invites with different kings, both invite controls, bound joining kings, Black first and wait panels at 4 sizes. Mud · Leap with cards confirms Mud · March. |
| Hand browser check | All 193 assertions pass. |
| Selected `next-menus` browser cases | All 16 pass: panel, refresh, home piece X and Menu at 4 sizes. |
| Lead's four-game check | All 144 assertions pass across 16 game and size pairs against the check build. |
| UI scan and diff check | No findings or whitespace faults. |

The focused selector is `src/interface/{play/{saved,arrange,layout,new-game},people/{controller,seat-king,host/online}}.test.ts`.
The browser runner accepts `PLAYABLE_PORT=5445`. The Hand and local stack checks use `PLAYABLE_URL` at that port.
The checks run in sequence. Focused and full tests, and browser checks, use the machine lease. Release work keeps its lease.

Evidence is in `runs/launch/owner-playtest/build/r1-shots/` and `r1-logs/` outside the game repository. All 20 required state and size captures are present. The check also covers promotion controls and reduced motion. The local online stack and preview stop after the checks.

## Limits

Chromium checks use mouse, touch and keyboard. No physical phone or WebKit check runs. The existing database-gated skips remain. No live account, old-page browser regression, push, pull request or deploy runs.
