# Lessons: Jev

The lessons on Jev (TypeSafe) judgments: what works, what failed its controls. [LESSONS.md](../../LESSONS.md) holds the Always rules and the index of all topic files.

## 2026-09-16 — TypeSafe judgments (standing rule)
- **Rule:** when a task needs a judgment a person makes at a glance — routing, ranking, extraction,
  verification, scoring — load the `typesafe-ai` skill **before writing code**, then read the live
  docs it points to. Keep exact rules, calculations, lookups and execution in code; the model only
  supplies semantic judgment. Auth: `TYPESAFE_API_KEY` from the environment, else read
  `~/.config/typesafe/key`. Never echo, log or commit the key.
- **Judgment types.** *Choice*: pick one of a set — classification, routing, selection. *Noul*:
  probability of yes — detection, flagging, guardrails. *Score*: degree along a rubric — severity,
  relevance, quality. Ask every independent question the code might need in one call, then act in
  code. Gate risky actions on confidence and escalate uncertain cases.
- **Good uses:** classification, routing, scoring, ranking, search, retrieval, structured
  extraction, verification, detection (spam, fraud, urgency, PII, jailbreaks, tool-call errors),
  moderation, ML feature extraction, semantic linting in CI, corpus-scale annotation, and real-time
  UI or game decisions.
- Likely candidates in the takeover: classifying stored games whose replay is ambiguous (Phase 3),
  checking king-power wording against the owner's rules (Phase 5), sorting stale queue/docs entries
  into shipped/lab/rejected/deferred (Phase 6). Purely deterministic checks stay deterministic.
- **Validate the instrument with controls before trusting it.** First real use, 2026-09-16: asked
  Jev whether six king-power guide lines were factually wrong or would surprise a player. All six
  came back within noise of each other (wrong ≈ 0.37, surprise ≈ 0.76) — a flat response across six
  materially different lines. A follow-up control run gave a **deliberately wrong** line 0.76 and two
  correct lines 0.76/0.78: the question could not separate known-good from known-bad, so the whole
  run was discarded. Rule: always include one known-good and one known-bad item in the same call; if
  the answers do not separate them, the run carries no information — fix the state/questions or fall
  back to the deterministic check. Never edit user-facing text on an unvalidated model answer.
- **Second failure, same day, different schema.** Asked Jev to sort 18 document lines into
  keep/edit/delete given a block of current facts. Every line came back `stale ≈ 0.79,
  action = delete`, including the *control_line* that is known to be accurate ("Card / spell effects
  (documented, not yet enabled)"). Two control-validated designs in a row failed on the same kind of
  task, so document-staleness triage stays deterministic bookkeeping here. TypeSafe's value so far is
  in judging items whose *answer is not already encoded in the state*; supply raw evidence, not a
  comparison, and prefer one item per call over a long list with a shared fact block.
- **The recipe that works (2026-09-16, third design).** Verify a report's claims by putting **raw
  numbers only** in `state` and each claim **in its own question** ("Is this statement consistent
  with the numbers? Judge only from the numbers"), with one known-true and one known-false control in
  the same call. Controls separated cleanly (true 0.98, false 0.02), and the pass flagged a real
  overclaim in the liveliness report (0.27) and an ambiguous "unresolved" sentence in the Ogre report
  (0.53); both were rewritten to state the actual figures. **Controls must be unambiguous from the
  quoted numbers**: a third probe that mixed two metrics (lobs per game vs games with a lob) scored
  0.36 and was my error, not the model's. Run this pass on the Q6, kings and Ogre follow-up reports
  before their verdicts are quoted.

## 2026-09-17 — Jev cannot label game narratives from features (instrument failed 6/6)
- **What was tried:** classify recorded games (reduced to deterministic features: reason, plies,
  captures, event totals) into a pattern taxonomy — promotion race, archer crossfire, paladin trade,
  guard blockade, dead material, timeout grind, tactical finish, … — with synthetic controls.
- **What happened:** no control design survived. A kings-only `drawMaterial` ending was labelled
  `timeout_grind` at p 0.03→0.07→0.33 across three attempts; a battle with four promotions as the
  sole mechanism was labelled `tactical_finish` at p(promotion_race) 0.06–0.07. Six designs, six
  control failures. The model does not separate overlapping game-narrative labels from abstract
  feature vectors, even when the label is stated in the machine's own reason code.
- **Rule:** keep narrative classification deterministic — the engine's `reason` **is** the label, and
  mechanism counts (promotions, archer shots, shoves) are arithmetic. Use Jev only for judgments whose
  evidence is **textual or numeric and narrow** (claim checks, rubric scores), never for assigning
  narrative categories it cannot ground. The failed tool was deleted; the attempt is recorded here.
- **The rule red-team screen failed the same way.** `tools/jev-redteam.ts` asked Jev to score lab
  rules for fairness from their rule text + measured numbers; the *benign* control ("archer steps in
  any direction", measured balance-neutral and adopted) scored **1.73/2 unfair** while the busted
  control barely cleared. The model reads the strength of the rule *text*, not the measurement, so
  the tool was deleted. Do not use Jev to second-guess measured balance.
- **What did work, and is committed:** `tools/jev-review.ts` — four themed review passes that check
  factual statements against the measured numbers, three runs per theme, majority+median gating, and
  controls per run. It endorsed the mining report's headline facts (guard draw engine, beast
  ornamental, draws are quiet) and the rejection rationales, and it *caught a real arithmetic slip of
  mine* (March's depth-4 interval excludes zero; only Mercy's includes it).
- **Calibration of that instrument (stable controls):** it confirms direction claims and simple
  numeric facts, but consistently refuses **interval arithmetic** ("does point ± err exclude zero")
  and **long acceptance conjunctions** even when hand-checked true (both passed `verify-claims` at
  0.90). Treat "not endorsed" as "the model did not confirm", never as "false". Evaluative
  conclusions ("this is not adoptable") are refused on principle — the value judgment is the owner's.

## 2026-09-16 — keep the decision out of the state
- Keep the *decision* out of the state: the first Phase 6 docs-classification call put my own
  conclusion into the entry text ("was never completed", "is absent") and Jev echoed it back
  (all `doc-only`, stale ≈ 0.65). State should carry raw evidence; the judgment belongs in the
  question.

## 2026-09-17 — "game-breaking" is measurable, not judicable
- **What was tried:** `tools/jev-conditions.ts` asked Jev to mark conditions, piece combinations,
  starting locations and suspected overpowered cases as game-breaking, anchored by two measured
  controls: the Reaver's full 8-direction step (measured overpowered: no fixed point, +188 ± 32 Elo
  even at a 5.04-pawn price) and its orthogonal reading (measured fine: 4.04 ± 0.56 pawns, neutral).
  Two designs, two control failures: the overpowered case scored 0.39, then 0.35, against a 0.6 bar,
  even with the no-answer mechanism spelled out in the evidence.
- **Rule:** do not ask a model to judge game-breaking quality from evidence text; make it a
  **measurement**. A piece or combination is game-breaking when one of these holds, computed in code:
  1. **value non-convergence** — the odds match moves away from the seed (|next − seed| > error) and
     still favours the owner at the raised price (Reaver full step);
  2. **matched-price dominance** — with both sides priced at the measured value, the owner scores
     more than +100 Elo over the control;
  3. **combination interaction** — in the four-arm factorial (neither / A / B / both) the interaction
     term (A+B − A − B + base) exceeds its interval on decisive share or owner score;
  4. **condition collapse** — a condition that should help (the Ogre against three guards) instead
     makes the game worse, which refutes the design rather than proving power.
- This is the third evaluative instrument to fail controls (narrative labels, fairness red-team,
  game-breaking). The one Jev use that keeps passing is claim verification against numbers; keep it
  there and keep power judgments in code.

## 2026-09-21 — claim checks: the state must say what a sign means; one run is not enough
- **What happened:** the 2026-09-20 `verify-claims` run on the Death Touch second reading failed its
  controls (true 0.26) and the verdict was committed anyway. Re-run at the pinned model with one line
  added to `state` ("a negative decisive point means fewer decisive games than the control") the same
  spec passes (0.81 / 0.06); without the note it fails again (0.26 / 0.09); at `jev-latest` with the
  note it passes (0.79 / 0.07). The failure was the spec, not the model.
- **Rules:** (1) every numeric pair in a spec `state` carries a `note` naming its unit and sign;
  (2) a verdict is not quoted or committed after INSTRUMENT INVALID until a repaired spec passes;
  (3) `tools/verify-claims.mjs` now takes the median of three runs — single-run supports drifted
  0.05-0.15 around the 0.7 gate on the same spec; (4) the model is pinned (`tools/jev.ts` `MODEL`,
  `jev-1.13.0`) and printed with every result; (5) specs are checked in under
  `docs/research/claims/`, one per report, and run together.
- **Calibration seen today:** "worse than" over overlapping intervals (−6.0 ± 2.7 vs −5.0 ± 2.7)
  reads 0.66 — an overclaim, correctly flagged; "the main cost is diversity" 0.52 — a judgment, not a
  number; two-part claims across depths or arms 0.43-0.58 — split them.
- **New screens (advisory, controls in every run):** `tools/design-screen.ts` passed controls and
  its readings match measured history (Templar fails sharp-job and new-move; Strike fails
  reach-earned and one-sentence); `tools/rule-simplicity.ts` separates its controls but not
  owner-rejected from shipped rules — labels needed before it gates anything. `tools/next-ab.ts`
  is a deterministic rank with an optional labelled model opinion. `tools/jev-conditions.ts`
  deleted (failed controls twice, 2026-09-17).
