# Review build and release summary — 2026-09-16

Phase 7 of [docs/TAKEOVER-PLAN.md](../TAKEOVER-PLAN.md). The takeover's work is a **review build**,
not a release: nothing is published here, and no default behaviour changed. Built from commit
`591ff67` on branch `takeover`.

## What this build contains (the smallest validated set)

v0.7.0 gameplay **unchanged**: linear evaluator, one-guard immortal Wall, no guard promotion, paladin
`nonPawn`, powers off, Ogre/Catapult outside the pool. On top of it, the fixes and lab tooling that
Phase 2–5 validated:

| Change | Evidence |
|---|---|
| Browser AI workers receive the live rule snapshot (incl. after `cancel()`); autosave stores and restores the active rules before replay | `src/game.test.ts` worker tests; QA cases *save/restore keeps the active rules*, *AI uses Death Touch in the worker*, *Darkness pawn capture survives save/restore* |
| Simulation runs carry an immutable identity (`rulesKey`/`specKey`/`src`); `checkResume` refuses unstamped, torn, mixed, changed-spec and changed-source files; summaries stream (the old read crashed on >512 MB) | `src/sim/sim.test.ts`; smoke run `smoke2` |
| Sampling replays under the recorded rules, validates events, writes fingerprints, and is atomic (a refused sample cannot truncate the corpus) | `src/sim/gen.ts`, `src/sim/tune.ts`; the refused `nnue-g1` sample left `positions.bin` untouched |
| Stop-on-failure Q6 chain; candidate net written to `sim/nnue/`, never `src/`; match arms pin the net blob | `tools/q6-chain.sh`, `tools/q6-validate.mjs`; gate fixture rejected at 0.45 |
| Lab UI: Ogre shove selection (shift-click disambiguates capture vs shove), shove animation, shoves highlight; six-power guide text | `tools/qa.mjs` 14/14 |
| Kings: 21 rule tests, browser/worker coverage, campaign queued | `src/rules/rules.test.ts`; `docs/research/sim-kings-2026-09-16.md` (skeleton + open owner questions) |
| Docs/dashboard/liveliness/tiles reports reconciled | Phase 6 commits `a3eeaaa`, `591ff67` |

## Evidence

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | clean |
| `npx vitest run` | **173 tests in 6 files pass** |
| Review build | `npx vite build --outDir dist-review` — 144 files, manifest digest `faaf00ee8615fa17` |
| Bundles | `assets/index-BTyxE5sm.js` (`a369ffa96468a771`), **`assets/worker-C8IVcIyN.js`** (`2dba63547f796c62`, the AI worker), `assets/index-DQoaMBkc.css` (`db1913d7a83eb7fc`, identical to v0.7) |
| Browser QA against `vite preview` over `dist-review` | **14/14**, zero console errors: paladin default/2017, rule-restoring autosave, Ogre friend shove + undo, capture-vs-shove, Catapult lob, AI reply in a lab position, kings restore, Death Touch in the real worker, Darkness restore, **full AI game (checkmate, 203 plies, 426 s under load)**, cancellation mid-search, promotion picker, mobile 390×844 with no horizontal overflow |
| Harness | `tools/qa.mjs` (`QA_BASE=http://localhost:4173/ node tools/qa.mjs`; `QA_ONLY=<substring>` runs a subset) |

Two preset cases were added to the harness after this build (`default archer steps diagonally`,
`?rules=2021 archer has no diagonal step`); both pass against the dev source. Re-run the full harness
on the next build.

## Deliberately not included (unvalidated or owner-owned)

- **Q6 residual candidate** — the inherited corpus was audited and excluded (old paladin, unstamped);
  the `nnue-g2` replacement chain is still generating. Default stays `linear`.
- **King powers** — implemented and tested, but off by default and not exposed in a picker; the
  pricing campaign and the owner's decisions (Mercy vs guard immunity, Death Touch verb, March/Leap
  charges) are pending.
- **Ogre / Catapult** — lab-only, outside `POOL` and `PROMOTIONS`; report finished, depth-4 follow-up queued.
- **Liveliness filter** — held-out gain is real (+3.8 decisive points) but it thins the guard and
  maester of games; no filter adopted.
- **B4 procedural tiles** — the option exists and is QA'd; the default is unchanged.

## Limitations to carry into any real release

1. **Licensing (blocking for publication).** `public/textures/*.jpg` (three textures.com derivatives)
   may not be served as standalone files. Adopt B4 (`stoneProc`) and remove the JPEGs from the
   published file list — leaving them unused in `public/` still ships them. Everything else is clear
   or needs only the designer's credit line (`docs/research/licensing-2026-09-14.md`).
2. **Variant guide text.** The piece guide and info cards describe the shipped rules; `?rules=2017|2021`
   shows today's wording. Preset-aware text is a feature, not a bug fix.
3. **fps measurement** in `docs/research/tiles-proc/README.md` was taken under full CPU load; re-run
   on a free machine before quoting it.
4. **Q6 and the kings/Ogre follow-ups** are queued (`tools/q6-chain.sh`, `tools/newpieces-followup.sh`,
   `tools/kings-pilot.sh`); their reports land when the runs finish.

## Publication

Not requested and not done. If it is requested: adopt the licence fix (or keep the current default and
accept the JPEG terms), then publish from `dist-review`/a fresh `npm run build` and re-run
`node tools/qa.mjs` against the published bundle.
