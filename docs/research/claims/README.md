# Claim checks — one spec per report

`node tools/verify-claims.mjs docs/research/claims/*.json` runs every spec (model pinned in the tool, three runs, median). Exit 0 all supported, 1 something flagged, 2 a spec's controls failed (that report's verdict may not be quoted until the spec is repaired and passes).

Spec rules that have held (LESSONS.md 2026-09-16 and 2026-09-21): raw numbers only in `state`, with a `note` that says what each pair means and which sign is which; one claim per question; one known-true and one known-false control derived from the same numbers. Do not put interval arithmetic, sign comparisons or "met A and B and C" conjunctions in a spec: the model refuses them even when true; those live in `tools/kings-summary.ts` and `tools/q6-validate.mjs`.

## Run 2026-09-21 (jev-1.13.0, 3 runs)

| spec | controls | flagged claims (support) | reading |
|---|---|---|---|
| sim-kings-2026-09-16-deathtouch2 | 0.77 / 0.06 | worse 0.66; both_drag 0.21 | "worse than the delivered reading" compares −6.0 ± 2.7 with −5.0 ± 2.7, overlapping intervals: say "at least as bad", not "worse". "not the anti-draw tool the proposal expected" is a conclusion, not a number. |
| ai-q6-acceptance-2026-09-16 | 0.91 / 0.08 | none after removing the sign-comparison claim (0.51, known refusal class) | verdict stands |
| setup-liveliness-2026-09-14 | 0.98 / 0.02 | objection 0.52 | "the main cost is diversity" is a judgment; the numbers only say the shares fall |
| sim-new-pieces-2026-09-14-ogre | 0.80 / 0.14 | white_shift 0.58; reprice_clears 0.43; not_converged 0.67 | two-part claims across depths or arms are refused as conjunctions: split them, or quote the pairs directly |

The same Death Touch spec read controls 0.26 / 0.09 without the sign note in `state` (and 0.79 / 0.07 at `jev-latest` with it): the 2026-09-20 failure was spec wording, not the model.
