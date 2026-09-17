# King Down — current status (2026-09-16)

One page to point at. Everything else is history or detail.

## What is playable now

- **Published game: v0.7.0** — one-guard immortal Wall, no guard promotion, paladin survives pawn
  captures (`paladinKamikaze=nonPawn`), archer/beast move any direction, linear evaluator.
- **Review build of the takeover work** (`dist-review/`, commit `b2a9ebc`, not published): the same
  gameplay plus the fixes below. `docs/RELEASE-REVIEW-2026-09-16.md` has the evidence list.
- Run it locally: `npm run dev` → http://localhost:5173. URL variants: `?rules=2017|2021`,
  `?kings=<king>:<power>[,<king>:<power>]`, `?style=…`, `?fen=…`.

## What changed in the source since v0.7.0 (all lab or correctness, no gameplay defaults)

1. Browser AI workers receive the live rule snapshot (variant games used to search the default
   rules); autosave stores and restores the active rules before replay.
2. Simulation runs carry an immutable identity (rules + `specKey` + source hash); resumes reject
   unstamped, torn, mixed or changed-history files; sampling replays under the recorded rules.
3. Ogre/Catapult lab browser path fixed (shove targeting/animation); six king powers have tests and
   variant-aware guide text (still off by default).
4. Reports/tools: liveliness redone with a held-out split (no filter adopted), tiles report/QA,
   reconciled docs and dashboard.

## Running or queued (automatic, stop-on-failure)

| job | what lands |
|---|---|
| Q6 replacement (`nnue-g2`) | **Done 2026-09-17: ACCEPTED as a candidate** (+139 ± 14 Elo depth 3, +149 ± 37 depth 4, speed bar passed) — `docs/research/ai-q6-acceptance-2026-09-16.md`; default stays linear until an adoption decision |
| Ogre/Catapult follow-up | **Done 2026-09-17:** depth-4 confirms `push` grows (+10.2 ± 4.7 decisive) but shifts White +4.9 ± 3.1; Ogre value 2.43 ± 0.58 pawns (not converged); Catapult weak — report §7 |
| Kings campaign | running: pilots done, 1,600-game paired A/Bs next; `docs/research/sim-kings-2026-09-16.md` via `tools/kings-summary.ts` |

Each report's verdict gets a control-gated Jev claim check (`tools/verify-claims.mjs`) before it is
quoted.

## Open owner decisions

1. King powers: five semantics questions in `docs/research/sim-kings-2026-09-16.md` (Mercy vs guard
   immunity, Death Touch verb, March/Leap charges, adjacent Mercy kings, Darkness evaluation).
2. Tiles: adopt B4 procedural stone and remove the three textures.com JPEGs from the published files
   (licensing blocker), or keep the photo tiles and their terms.
3. Maester `maesterSwapAny` (measured free, not adopted).
4. Q6 model: the replacement candidate **passed** the staged bar (2026-09-17). Adopting it means
   switching the default evaluator, a one-word change plus a rebuild — a release step, not an
   automatic consequence of the run.

## Verification snapshot

`npx tsc --noEmit` clean; `npx vitest run` 173 tests pass; browser QA 14/14 on the review build, two
added preset cases passing on the dev source (`tools/qa.mjs`, `QA_ONLY=` runs a subset).

## Where the detail lives

- Execution ledger: `TASKS.md` → "Takeover execution — 2026-09-16"
- Plan and review: `docs/TAKEOVER-PLAN.md`, `docs/TAKEOVER-REVIEW-2026-09-14.md`
- Release: `docs/RELEASE-REVIEW-2026-09-16.md`, preserved v0.7 bundle in `docs/releases/v0.7.0/`
- Baseline and hashes: `docs/takeover/BASELINE.md`, `docs/takeover/baseline.json`
