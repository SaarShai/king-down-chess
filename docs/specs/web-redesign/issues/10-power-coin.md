# 10 · The power coin by the portrait

Status: in-progress (W3 phase 1 done; W2 wiring waits)
Blocked by: 03 (this step comes directly after 03, so no power tile with words ships)

## Scope

- Owner choice: King powers B, a coin by the portrait. The coin shows no name. The owner's proposal: "a tap on the coin reads the power and its state ('Freeze · 1 left') in the tap-to-read line." Decisions D7 (a tap reads; "Use" arms) and D12 (c) (a cast of 250–350 ms; the next move does not wait).
- Demo: `feat-king-powers` option B (`coin-phone.png`; `demo.js` 167–169; the coin styles in `demo.css`).
- Files: `src/powers-ui.ts` (`coinState`) and test; new `src/ui/coin.ts`; `src/main.ts` (`refreshPowers`, the power handler, the interim action of ticket 03); `index.html` (the strip slots; `#powers` goes); `src/style.css`; `src/power-motion.ts` (reuse `emblemArt`); `tools/verify-powers.mjs` (rewrite); `tools/qa.mjs`; `docs/visual-design/verify.mjs`; `tools/ux-defects/d3-review-readouts.mjs`.

## Plan

1. [ ] `coinState(pos, side, rules, history, armed)` (pure): the king, the power, the state (ready, armed, used, always, waiting, no target), the notches (total, spent), the first move it can act and the move it was used (from the history). No notches for an always-on power. In review it reads the shown position and its history.
2. [ ] A coin button by each portrait: the king's emblem, a 9 px diamond notch for each use, a gold glow when armed, grey when used, `aria-label` "Freeze, 1 left", `aria-pressed` when armed. An off coin uses `aria-disabled`, so a tap still reads it. A side with no power has no coin. Each coin sits in the Tab order after its strip name (spec §4.4).
3. [ ] A tap on any coin reads it in the context line and never arms it (D7): "Freeze · 1 left", "Frost king · Freeze · 1 left", "Freeze · Used on move 12", "Freeze · From move 5", "Holy Light · Always on". When your power has a legal action now, the line adds the action "Use". "Use" arms: "Freeze · 1 left · Tap an enemy piece", with Cancel. Cancel, Esc or a second tap on the coin disarms. When the power has no legal action now, the line says why ("No piece to freeze now.", "From move 5.", "Not your turn.").
4. [ ] March and Leap: their moves show among a piece's ordinary moves, as today, so their coins only read. Each Leap move spends a use (ticket 08 marks its target). The notch drops at the staged ply and comes back on Undo.
5. [ ] The cast: 250–350 ms (a coin pulse and a trace to the target). The next move does not wait for it. The timing goes in a pure motion module (spec rule 8).
6. [ ] Their reveal: when they use their power, their coin flips (200 ms) and the line names the power for that move.
7. [ ] Remove the interim power action of ticket 03 and `#power-status`. Build the coins as a row bound to the portrait, so card coins can join it later (ticket 24).

## Verification

- [ ] `src/powers-ui.test.ts`: `coinState` for the twelve powers in each state (ready, armed, used, always on, from move N, unlimited, no target) and for a side with no power; "Used on move N" from the history; a use comes back after Undo; a read in review uses the shown position.
- [ ] `powers` check, rewritten (`Removed-check:` trailers for the old button text): a tap on the coin reads and does not arm; "Use" arms Freeze; freeze; see "Used on move N"; a no-target Sacrifice says why; their reveal; an always-on coin only reads; a Leap use comes back on Undo; the coin reads on the other side's turn and in review.
- [ ] `qa`, `visual-design`, `ux-defects`, `npm test` and `npm run check:browser` pass.
- [ ] Rendered sample, 390×844 and 1440×900: a coin read; ready with "Use"; armed; the cast; used; always on; their reveal; a side with no power. The owner's yes, with the date, in Comments.

## Risks

- The coin shows no name. The read line must name the power every time.
- The reveal and the tell (13) both act at their move: the coin flips while their king lifts.

## Does not do

- No card coins (ticket 24), no new art for a king with no power, no turn countdown ring.

## Comments

- Phase 1 plan: test `coinState` at its pure interface, one failing test at a time. Cover ready, armed, used, always on and no power.
- Build the coin row DOM and copy the demo coin CSS. Keep the live game as it is until W2 lands.
- Checks: `npm test`, `npm run typecheck`, and the named plugin checks. Record the plugin size before and after. No full browser suite in phase 1.
- Phase 2: wire the strips and context actions, update check helpers, run the powers check and full suite, and render the sample.
- The coin CSS matches demo lines 86–95. `coinRow` binds the power coin to the portrait. Card coins can append to the row.
- The tests cover both sides, a use on move 12, Undo, and zero-use March and Leap. Each new state first fails, then passes.
- The plugin page is 4,291,869 bytes before and after. `plugin-ui` passes (19.4 s). `plugin-ui-http` passes (16.1 s) after a retry with the local test database from `docs/plugin-preparation.md`.
- `npm test` passes: 79 files pass, 1 skips; 1,447 tests pass, 13 skip; all 50 artwork checks pass. The full run uses one worker with all test paths. The temporary test filter is removed. `npm run typecheck` and `git diff --check` pass.
- Phase 1 is done. Phase 2 also adds the waiting and no-target states and legal Use guards. Cast motion and coin flip stay out, as the fast plan says. The sample and full browser suite wait for phase 2.
