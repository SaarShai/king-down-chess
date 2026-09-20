# King Down — current status (2026-09-16)

One page to point at. Everything else is history or detail.

## What is playable now

- **Published game: v0.7.0** — one-guard immortal Wall, no guard promotion, paladin survives pawn
  captures (`paladinKamikaze=nonPawn`), archer/beast move any direction, linear evaluator.
- **Browser AI now plays the adopted Q6 residual net** (2026-09-17): +139 ± 14 Elo at depth 3,
  depth-4 confirmed, 1 s = depth 5.92. The balance lab stays on `linear` so past numbers still mean
  what they meant.
- **Review build of the takeover work** (`dist-review/`, built from `ce90454`, not published): the same
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
| Ogre/Catapult follow-up | **Done 2026-09-17:** depth-4 confirms `push` (+10.2 ± 4.7 decisive); re-run at the measured price (O=195) keeps the sharpening (+9.0 ± 4.9) and removes the White shift (blocker was the over-priced seed); Ogre value 2.43 ± 0.58 pawns (not converged); Catapult weak — report §7 |
| Fairy-piece balance | **Archer shots widened 2026-09-17** (`archerShots: plusDiagFwd2`, adopted): decisive +8.8 ± 3.8, draws −8.2 ± 3.7 at depth 4, fairness clean; archer value 3.73 ± 0.42 → **5.05 ± 0.44 pawns** (`ARCHER_V` 505). Sweep: `paladinJumpsFriends=false`, `archerMove=fwdBack`, `beastMove=forward` rejected; `beastCapture=diagForward`, `maesterStep=2` null (`docs/research/sim-piece-balance-2026-09-17.md`) |
| Kings campaign | **Done 2026-09-17:** Darkness/March/Leap sharpen decisively, Mercy smaller, Holy Light flat, **Death Touch makes games less decisive** (contrary to the plan); report + owner questions in `docs/research/sim-kings-2026-09-16.md`. **Strike (Flame A, tier 2) built 2026-09-17** and measured the same way: decisive **−20.2 ± 5.8** at depth 4, draws +22.2 — a draw engine; second reading (capture without moving) measured **worse** (−29.5 ± 7.3 decisive at depth 4) → **shelved**, see `docs/research/kings-decisions-2026-09-16.md` §6 |

Each report's verdict gets a control-gated Jev claim check (`tools/verify-claims.mjs`) before it is
quoted.

## Open owner decisions

1. King powers: measured (report above); the five semantics questions with options and
   recommendations are in `docs/research/kings-decisions-2026-09-16.md`. The strongest finding is
   Death Touch lowering decisiveness, which suggests testing the "shot plus displacement capture"
   reading next.
2. Tiles: adopt B4 procedural stone and remove the three textures.com JPEGs from the published files
   (licensing blocker), or keep the photo tiles and their terms.
3. Maester `maesterSwapAny` (measured free, not adopted).
4. Q6 model: **adopted in the browser on 2026-09-17** (lab unchanged). Remaining AI work: an
   incremental accumulator for speed, a distilled policy head for instant moves, an opening book
   and small endgame tablebases (see `docs/research/ai-players.md`, status update).

## Verification snapshot

`npx tsc --noEmit` clean; `npx vitest run` 173 tests pass; browser QA **16/16** on the rebuilt review
bundle (incl. a full AI game, cancellation, promotion, undo, save/restore, mobile, the 2017/2021
presets and the `?style=` URL); tiles fps measured on a free machine (21.4 vs 21.6 — no difference).
Every campaign report's verdict went through `tools/verify-claims.mjs` with controls (invalid
instruments exit 2). Jev claim review of the rules, rejections and campaign results:
`docs/research/jev-review-2026-09-17.md` (advisory: archer is the hidden risk, p 0.97). Jev session
player (`tools/jev-play.ts`, report `docs/research/jev-sessions-2026-09-17.md`): plan steering costs
nothing with a feature-only ballot (0.562 vs 0.500 control) and 8% overrides.

## Where the detail lives

- Execution ledger: `TASKS.md` → "Takeover execution — 2026-09-16"
- Plan and review: `docs/TAKEOVER-PLAN.md`, `docs/TAKEOVER-REVIEW-2026-09-14.md`
- Release: `docs/RELEASE-REVIEW-2026-09-16.md`, preserved v0.7 bundle in `docs/releases/v0.7.0/`
- Baseline and hashes: `docs/takeover/BASELINE.md`, `docs/takeover/baseline.json`
