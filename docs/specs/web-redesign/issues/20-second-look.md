# 20 · The second look: an opt-in practice aid

Status: ready-for-agent (the owner approved [the spec](../spec.md) on 2026-10-09)
Blocked by: 05 (Board help), 13 (the search before the press)

## Scope

- Owner choice: our pick for now, the second look as an opt-in practice aid that the player turns on. Advisors: use the game's evaluation, not a count of material. Decision D11.
- Demo: `feat-help` (the `second-look` state).
- Files: `src/main.ts` (the staged turn, `Save`, `settingsNow`, `applySettings`; call lines only); a new pure `secondLook` and its test (reuse the score bounds of `keyMoments` in `src/moment.ts`); `src/ui/menu.ts` (Board help); `src/account/sync.ts` and test; `tools/verify-turn.mjs`.

## Plan

1. [ ] A Board help switch "Second look", off by default, for games against the computer at every level. A new setting `secondLook`, written only when on, in `SETTINGS`.
2. [ ] The baseline: when the computer's reply lands and it is the move its search chose, keep that search's score, from the player's side, with the position it belongs to. When the blunder rule played another move, run one short search of the position the player sees (the key-moment time) for the baseline; until it returns, no second look for that turn. A reload, Undo past it or a game change clears the baseline. Scores read by side, not by ply parity.
3. [ ] When the switch is on and the turn waits (not mid-way), read the search of the new position (ticket 13; no extra search). Compare it with the baseline of the same position.
4. [ ] A loss of 300 or more, or a mate it allows, shows one line in the context line ("Their archer can take your queen.") and the cause marks of that reply. The line shows a cause only when the returned move supports it. It adds no buttons: Undo takes the move back, and End turn keeps it.
5. [ ] No check without a sound baseline (the first turn, after a reload), on one device or in a link game. A press during the check stops it; the check never slows the press.

## Verification

- [ ] `secondLook` test: the 300 threshold; an allowed mate; a planned sacrifice that the score keeps; no baseline, no warning; a random computer reply; a Haste turn and a free mark (the score's side).
- [ ] `src/account/sync.test.ts`: `secondLook` travels with the settings.
- [ ] `turn` check, extended (with `?think=`): with the switch on, a queen left to a shot shows the line before the press; Undo takes it back; End turn keeps it and the reply plays; a forced random reply gives no false line; with the switch off, nothing shows.
- [ ] `npm test` and `npm run check:browser` pass.
- [ ] Rendered sample, 390×844 and 1440×900: the second look line with its cause marks; the Board help switch. The owner's yes, with the date, in Comments.

## Risks

- Short searches add noise to the score; the 300 threshold limits false alarms.

## Does not do

- No Hint, no "Take it back" or "Keep it" buttons, no check at the computer's turn.

## Comments
