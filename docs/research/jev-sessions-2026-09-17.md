# Jev session player — 2026-09-17

`tools/jev-play.ts`: deliberate games where **Jev steers the plan and the engine enforces legality
and tactics**. Each turn the engine runs its own search; the tool then offers Jev a ballot of
*candidate plans* described in code (candidate moves within 80 cp of the best, one per theme, LAN and
consequences spelled out) and Jev picks one with a Choice. Below `--minConf` the engine's move is
played. Every decision is logged with its probabilities, so a session is auditable move by move.
Both sides' policies are selectable; the control is engine-vs-engine on identical seeds and setups.

Run: `tsx tools/jev-play.ts --games 8 --depth 3 --seed 91` (White=jev, Black=engine) ·
`--white engine` for the paired control. Logs and summaries: `sim/out/jev-session-*.jsonl`.

## Results (fresh setups, depth 3, 240-ply cap, no adjudication)

| arm | games | W–D–L (White) | White score (95% CI) | overrides |
|---|---|---|---|---|
| engine control | 40 | 18–4–18 | **0.500** (0.352–0.648) | – |
| Jev, feature-only ballot | 16 | 7–4–5 | **0.562** (0.332–0.769) | 18/227 (8%) |
| Jev, full ballot (generic plan allowed) | 26 | 1–11–14 | **0.250** (0.124–0.441) | 134/1113 (12%) |

All 1,343 Jev decisions carried a mean confidence of 0.81; the confidence gate fired on 11% of them.

## Findings

1. **The generic plan is the trap.** With the full ballot, Jev's overrides were dominated by the
   vague `improve_position` plan (98 of 134), and that arm scored 0.250 against the 0.500 control —
   about 2.4 standard errors, borderline significant at n=26. The search is simply better at
   "improve the position" than a plan picker is.
2. **A feature-only ballot removes the measurable cost.** Adding candidates only when a concrete
   feature is on the table (a capture worth 200 cp, a promotion, a check, an archer shot, a piece in
   danger, a swap, a shove, a lob) drops the override rate to 8% and the arm scores 0.562 — the
   interval covers the control. Use this configuration.
3. **Jev's overrides then favour checks and repositioning** (`give_check` 31, `maester_reposition`
   10, `save_piece` 8, `win_material` 5): when it does deviate, it tends to sharpen or untangle
   rather than drift.
4. **Every session was legal and terminating** (all moves come from the engine's own generator, and
   the cap/repetition rules end the games), so the player is safe to run unattended.

## How to use it

- **As a deliberate review instrument, not a strength upgrade.** The engine plays; Jev chooses among
  plans that are already sound, and the log tells you *which plans a deliberate outsider favours* in
  real games. Read `sim/out/jev-session-*.jsonl` for the per-move plan, probabilities and whether the
  engine was overridden.
- **Keep the feature-only ballot** (`tools/jev-play.ts` as committed). Re-validate against a paired
  engine control whenever the candidate construction changes.

## Limits

- n = 16/26/40 games at one depth; intervals are wide and the arms use different seeds (paired only
  before the first divergence). Treat the generic-ballot cost as directional, not established.
- Only White was steered. Both sides steered would answer a different question (does a Jev-vs-Jev
  game look different?).
- The tool was built for review sessions (tens of games), not for mass play — each call is logged and
  costs a Jev request.
