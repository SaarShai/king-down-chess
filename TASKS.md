# Tasks

Project tracker (checkable). Verification evidence goes next to each item.

## Phase 0 — Research & sources
- [x] Read all 8 shared docs/sheets/PDF (2026-09-13). Notes: `docs/RULES.md`. The `.gdoc` shortcut "rules FINAL" points to a deleted doc.
- [x] Sweep Drive folder "King Down" (2026-09-13): all 19 folders reviewed → `docs/research/drive-*.md` (8 reports), keepers in `art-src/`, raw download deleted
- [x] Engine + ML research (Opus subagent) → `docs/research/engine-ai.md` (verdict: own TS engine; Fairy-Stockfish expresses 0/5 pieces)
- [x] Rendering stack research (Opus subagent) → `docs/research/rendering.md` (verdict: plain three.js + RenderPixelatedPass; deltas applied: Timer, palette pass)

## Phase 1 — Framework (v0.1 playable)
- [x] Stack: Vite 8 + TypeScript 7 + three.js 0.186 + Vitest 5, plain DOM HUD, AI in a Web Worker
- [x] Rules engine `src/rules/engine.ts` (standard + Archer/Paladin/Guard/Maester/Beast), setup/FEN/LAN `src/rules/setup.ts`
- [x] Tests green: 15/15 (`npx vitest run`), perft(3)=8902, per-piece cases, isAttacked cross-check on 300 random boards
- [x] Tier-1 AI `src/ai/search.ts` (negamax + quiescence, time-limited) in `src/ai/worker.ts`
- [x] Pixel-3D render: board, voxel pieces, RenderPixelatedPass + DB32 palette/dither pass, hover/select, legal-move markers
- [x] Animations: hop, capture debris burst + shake, archer arrow, paladin self-burst, beast chain lunges, maester swap (verified: pawn hop + AI reply in browser; fairy animations not yet eyeballed)
- [x] HUD: turn, status, move list, new game (random / classic / custom back rank), sides, think time, pixel/edge/palette/dither, piece guide dialog
- [x] Voxelize STL sculpts (`tools/voxelize.py`, 28 voxels high) → `public/models/*.json`; toggle "Sculpts" switches to procedural placeholders
- [x] `npm run build` clean (146 kB gzip). Published: https://claude.ai/code/artifact/7acdadad-e068-4a2e-a6a3-1635a2c3b1da
- [x] Fairy-piece animations + chain UI verified in browser via `?fen=` positions (archer shot, beast chain, paladin kamikaze, maester swap)
- [x] Full games end to end (2026-09-13, Opus QA, 8 games incl. human as Black and CvC; fairy events cross-checked against the engine; `docs/research/qa-full-games-2026-09-13.md`): 5 bugs found and fixed at the root (gen guard around the animation await + Engine.think ignores cancelled ids; promotion picker locks input and cancels on reset; fallback timer checks liveness; orient() on side change; mobile board band centred); 90 tests green

## Phase 1b — Feedback round 1 (2026-09-13)
- [x] Bright, minimal white/black pixel-art GUI (`src/style.css`, DotGothic16 + Press Start 2P)
- [x] Switchable art styles in-engine (`src/render/styles.ts`, `?style=` sprites|hd|cel|voxel|db32) + HD-2D billboard sprites from the PSD renders (`tools/sprites.sh`)
- [x] Rule decisions written to docs/RULES.md §6; draws by repetition + insufficient material (18 tests)
- [x] Style board published: https://claude.ai/code/artifact/b4800dc6-5092-4468-b637-c0a3c7da0236 (`docs/styleboard/`); pixel-style survey in `docs/research/pixel-styles.md`; sprite study pending
- [x] Painted-accent sprites from `art stuff/Characters/color guides` (Opus agent, `tools/sprites-painted.py` → `public/sprites/painted-{blue-red,ivory-charcoal}/`, 192 px, contact sheets in `docs/research/sprites/painted-*.png`); `painted-blue-red` is the default sprite set (verified in browser, `?style=sprites`)
- [x] Default camera raised to ~54° elevation (`CAM_HOME` in `src/render/renderer.ts`): a back-rank king no longer covers the pawn in front (verified in browser at 37°/54°/76°; 54° keeps the 3D read)
- [x] Painted voxel models (`tools/paint-voxels.py` → shade/accent in `public/models/*.json`), verified in browser (Cel shows colour-guide accents)
- [x] Round 2 art styles from Saar's three references (`docs/research/style-refs.md`): 9 presets (`chunky*`, `dungeon*`, `iso*`) via new Style knobs (camera/tiles/lights/paletteName/rim/spriteOutline/boardSide/shadow); renders in `docs/styleboard/img/r2-*.png`; style board republished (round 2) and game republished as v0.4 (`tools/artifact.mjs` builds dist/artifact.html + files.json). **→ resolved 2026-09-14: B2 "Dungeon voxel" picked and made the default; earlier style requests closed.**
- [x] Camera navigation: OrbitControls (orbit/zoom/pan), Reset view button + R key, click-vs-drag; sprites billboard per frame (verified in browser)
- [x] Drive sweep reports (Opus agents) → `docs/research/drive-{art-stuff,board,cards}.md` + `docs/research/drive-assets/`; no artist credit or licence found anywhere; `materials/` mood boards pin stock/film stills (do not ship)
- [x] Drive sweep: `concept art/` (`drive-concept-art.md`: teaser video, alpha cut-outs, Pantones, four-biome board brief), `drafts`/`dropbox`/`early inspiration` (`drive-misc-folders.md`: credits resolved — © 2014 Saar Shai, Double Edged Games, Dream Catcher; 2014 rules differ: 2–4 players, hand-picked armies, 2×2 capitol; `early inspiration` = third-party, do not ship)
- [x] Drive sweep: remaining folders (`drive-remaining-folders.md`): 2021 "Chess Expansion Concept" pitch (weaker Archer/Beast), 22 OBJ piece meshes, 2500 px labelled board, range-tiles legend, all card names; `website` incomplete (4/11 files)
- [x] Drive sweep: `final art/` (`drive-final-art.md`): Rulebook there is the 2015 card game v1.5 (older; 2017 Classic wins); its range chart differs for paladin/maester/beast; best two-army piece PNGs (Characters_Final No Shadow + colored pieces dark); double-sided board AI (biomes / plain marble); credits © 2015 Saar Shai, Double Edged Games, Dream Catcher, Kickstarter
- [x] Curated 137 files / 788 MB into `art-src/` (MANIFEST.md lists every source path + what stayed on Drive with sizes); raw 51 GB download deleted (2026-09-13). Caveat: board tiles derive from textures.com stock; Imperator fonts carry no licence

- [x] Curate + clean (2026-09-13): `art-src/` 137 files / 788 MB with MANIFEST.md; raw download deleted

## Phase 1c — Saar picked B2 "Dungeon voxel" (2026-09-13); make it the game
- [x] B2 as default style (2026-09-13): `dungeonVoxel` first, labelled Dungeon; `tools/trim-base.py` trimmed 3–4 disc rows per model; camera 53°; torch rig rebalanced; board coordinates (`setCoords`); verified `docs/styleboard/img/b2-default.png` + `b2-cel-check.png`; tsc + 53 tests green. Was: trim the sculpts' base discs (`tools/trim-base.py` → `public/models/*.json`); elevation ~52°; lift torch ambient so far corners read; board coordinates (a–h / 1–8) on the frame; verify with browser screenshots (Opus agent, owns `src/render/*`, `public/models/*`)
- [x] Game UX (2026-09-13): undo/takeback (z), game-over dialog (Rematch/New/Close), resign, autosave+restore, captured rows, piece info card, copy LAN, Esc, Coords checkbox; 9 Game tests + 29 Playwright checks; `docs/styleboard/img/ux-hud.png`. Was: undo/takeback, game-over dialog (result + reason, Rematch / New game), resign, autosave + restore (localStorage), captured pieces per side, piece info card on select/hover, copy moves (LAN), Esc cancels selection; verify in browser (Opus agent, owns `src/main.ts`, `src/game.ts`, `index.html`, `src/style.css`)
- [x] AI tier 2 (2026-09-13): `src/ai/{eval,search,zobrist}.ts`, depth 6–7 in 1 s (was 4), 11 new tests, deterministic fixed depth + `resetSearchState()`; values A430 L470 G250 M330 S350 vs research priors (`fairy-values.md`) A350 L400 G200 M350 S220 → settle by the piece-value swap experiment. Was: eval with PSTs + mobility + king safety, Zobrist TT, TT/killer/history ordering, quiescence delta pruning, mate-distance scores, time management; tests: mate-in-1/2 puzzles (incl. archer), engine self-play smoke (100 games) for legality/crashes; nodes/s before vs after (Opus agent, owns `src/ai/*`)
- [x] Rebuilt + republished v0.5 (2026-09-13): https://claude.ai/code/artifact/7acdadad-e068-4a2e-a6a3-1635a2c3b1da (tsc + 54 tests green; `node tools/artifact.mjs`)

## Phase 1d — Balance lab (Saar, 2026-09-13): AI-vs-AI Monte Carlo over configurations
- [x] Research done (2026-09-13), six reports: Chess960 rules/arrangement data → `docs/research/chess960.md`; variant-balancing methodology → `variant-balance.md`; fairy-piece values → `fairy-values.md`; simulation tooling + experiment design + fun metrics → `sim-methodology.md`; game-balancing frameworks beyond chess (Ludii, OpenSpiel, automated balancing research, industry practice) → `balancing-frameworks.md`; AI players for chess and variants (NNUE, AlphaZero-style, MCTS, fast move generation, skill levels) → `ai-players.md`
- [x] Plan v2: `docs/SIM-PLAN.md` (11 sections, from the six research reports)
- [x] Stage 1 build (2026-09-13): `src/sim/` runner + analyzer, 15 tests; smoke 200 games depth 3 = 8.8 games/s on 16 workers, White 0.540 (±0.07), decisiveness 69%; `npm run sim -- --id smoke --games 200 --sample 50 --depth 3 --seed 1`, `npm run sim:analyze -- --id smoke`
- [x] Rules bug found by the smoke run and fixed: archer captured by orthogonal displacement (king could be taken). `genPiece` A steps are now move-only; regression test added (54 tests green)
- [x] Stage 2 (2026-09-13): `src/rules/rules.ts` (12 toggles, `setRules()`, proven identical defaults, 79 tests), `src/sim/experiments.ts` (values / sweep / ab), `--rule k=v`, `--multiPv`; reduced runs (11,400 games) → `docs/research/sim-results-2026-09-13.md`: White +30 ± 40 Elo; sweep extremes within noise; paladin 3.7 ± 0.9 and maester 3.5 ± 0.7 pawns, archer/guard/beast far below a knight (eval mispricing suspected → fixed-point pass 2); beastChains=false only lengthens games
- [x] Pass 2+3 (2026-09-13, 16,820 games, 33 min): values converged — L 3.1 ± 0.4, M 3.3 ± 0.4 pawns; A/G/S bounded < 1.7 pawns (odds match, depth 3 and 4, and tanh regression agree); eval.ts now A170 L320 G185 M350 B195; sweep at 160 games/rank: real between-rank spread ≈ 9 Elo, all flagged ranks favour White; interest axis currently tracks draw rate (`sim-results-2026-09-13.md` §9–17)
- [x] Buff candidates measured (2026-09-13, §18): archerMove=any 2.7, guard pawns+step2 1.8, beastMove=any 2.1 pawns; balance unchanged with all on; guard pawn-harvest flagged. Saar chose the recommended set → R6 done (2026-09-13, 53,940 games, `sim-buffed-2026-09-13.md`): balance unchanged (−0.002 ± 0.009), branching +5, beast activity ×3; BUT guard pawns+step2 = uncapturable pawn harvester (44% of games, draws +4 pts, worse at depth 4). Verdict: adopt archerMove=any + beastMove=any; hold the guard pending alternatives **→ resolved: the guard is the immortal one-step Wall, at most one per army (`RULES.md` §6.9).**
- [x] Data mining (2026-09-13, `tools/mine.ts`, `sim-mining-*.md`): pace = army value (r −0.79 with plies), queen −11 draw points, guards +10 draw points (walls), paladin the only sharpener, beast dead weight (20% never move), corner archers/beasts furniture, interest metric broken by the min-fairy-use term; batch 3 proposed: 29 specs in `sim/specs/batch3/`, 69k games (~4 h) — run after batch 2
- [x] R1 strength ladder (2026-09-13, `sim-strength-2026-09-13.md`): ~180 Elo per ply, depth 2→6 = +730 ± 66; White +24 ± 34 at depth 5; archer/guard/beast gaps to a knight widen with depth; restricted play passes the 65% skill gate on every rank but cannot rank ranks at 20 games. Verdict: balance conclusions are depth-stable, draw/interest/per-rank rankings are not
- [x] R2/R3 pool + placement (2026-09-13, 54,400 games, `sim-configs-2026-09-13.md`): pool composition dominates (standard-only 87% decisive / 87 plies vs fairy-heavy 40% / 172); guard/archer/beast are the draw engine under today's rules; paladin is the only piece that moves balance (+20 per paladin for White); placement effects small (archers adjacent → +3 draw points); king placement irrelevant
- [x] Guard alternatives + R4 + R7 (2026-09-13, 54,100 games, `sim-rules-2026-09-13.md`): guard pawns+step2 capped at 1 capture removes the harvester (44% → 0%, +54 Elo); only guardImmune=false changes the game among the R4 toggles (+4 pts decisive); 2021 archer is 84 Elo weaker than 2017, 2021 beast equal to 2017 but 2× as active; buff set sharpens twice as hard
- [x] New defaults adopted + v0.6 published (2026-09-13): archerMove any, beastMove any, guard captures one pawn per lifetime (SPENT bit, FEN `H/h`) + step 2, eval A280 L310 G170 M330 S215; presets `?rules=2017|2021`; RULES.md §3/§6.8, piece guide, info cards updated; 97 tests green; Playwright 9/9
- [x] R5 Texel tuning shipped (2026-09-13, `sim-tuning-2026-09-13.md`): 584k quiet positions from 28.6k v0.6 games, 408 params, +113 ± 27 Elo at depth 3, +117 ± 33 at depth 4; odds-match design values under the tuned engine: A 3.4, L 2.2, G < 1.5, M 2.2, S 2.7 pawns (paladin/maester fell, archer/beast rose); 102 tests green
- [x] Batch 3 (2026-09-13, 76,100 games, `sim-batch3-2026-09-13.md`): guards are the draw engine (+20 draw points for 2 guards at fixed value); fairy count matters at constant value; guardImmune=false is the cheapest anti-draw lever; maester beside king +15 Elo; two paladins beat two maesters by 61 Elo at equal table value; army value does NOT drive pace (mining headline reversed); interest ordering survives depth (ρ 0.81) but not rule changes (ρ −0.16)
- [ ] Known: eval mirror-symmetry test relaxed to 1 cp (float king-phase blend) — fix with an integer phase after the current measurement round
- [x] Dashboard: `npm run dashboard` → `docs/dashboard/index.html`, published https://claude.ai/code/artifact/556509ef-4701-4811-89d1-58824ee8c5f8 (republish after each run batch)
- [x] Full-scale runs done across batches 1–3 (154 runs, ~300k games, ~12 h machine time)

## Phase 1e — Saar's decisions (2026-09-13, late)
- [x] Guard back to the 2017 immortal wall (no captures, 1 step); toggles lab-only; RULES.md §6.9; v0.6.2 published (2026-09-13)
- [x] Guard study (2026-09-14, `guard-study-2026-09-13.md`, 92k games mined + 16k targeted): immortality does NOT hurt fun (two guards: −8.8 decisive pts, capped 3.1%, inside the gate; reach and pawn-eating are what drag); the anvil (a piece pinned beside a guard for an archer shot or beast capture) is the one pattern that pays (+0.03–0.11); the king shield is the default habit and reads worse; a guard 4+ files from its king gives +9.7 decisive pts; pawn escort does not work; guardStep=2 doubles capped/dead endings (+10 plies) → this agent says keep the Wall (the Warden agent leaned 2-step: same data direction, different judgement). CAVEAT: batch 3 ran under buff defaults (capturing guard) — its guard conclusions are void; runs are now classified from their moves. AI: SHIELD_GUARD was fitted on the capturing guard; the stage-0 re-fit (immortal guard) supersedes it
- [x] Saar: one guard per army at most (pool `QLRRBBNNAAGMMSS`; 'exactly one' still to confirm, see checkpoint) — landed with tests + RULES.md; Warden tests done (2026-09-14, `sim-warden-2026-09-13.md`, 60 ranks × 25 games/arm): Warden A (2-step) +35 ± 39 Elo value, balance unchanged, −2.7 decisive pts, +5.7 plies, more active (4.4 moves/game vs 1.7) but drags more draws (52% vs 41%); the second-rank ban makes the guard inert (kills the king shield) → recommendation: adopt 2-step, reject the ban — awaiting Saar **→ resolved: both rejected; the Wall stays (`docs/QUEUE.md`, Q1).**
- [x] Saar: a pawn never promotes to a guard → default `anyNonKingNoGuard` (landed; RULES_2017 keeps anyNonKing); republish pending **→ shipped in v0.7.0 (2026-09-14).**
- [x] Paladin grid + maester candidates (2026-09-14, `sim-lm-buffs-2026-09-13.md`, odds matches only — A/Bs and the double-turn measurement were cut by CPU contention): paladin nonPawn-kamikaze 2.9 pawns (nearest a knight, identity intact); blocked-by-friends 3.7 (+97 Elo, the jump makes it die early); never-kamikaze 3.4; checks 3.2; return/jump-enemies degenerate. Maester swapAny 3.1 (nearest), step2 3.8, kingSwapAnywhere 2.5, swapEnemy never used. White edge on paladin ranks 0.561 vs 0.510 without; removing the jump leaves 0.556 → the edge is the piece, not the jump. Awaiting Saar's picks **→ resolved: paladin `nonPawn` shipped (v0.7.0); `maesterSwapAny` not adopted (Q3).**
- [ ] Not yet measured (blocked by 'start nothing new'): A/Bs of the recommended paladin/maester buffs; the kamikaze-never half of the White-edge diagnostic; `secondPlayerDoubleFirstTurn` (rule implemented + tested)
- [x] Stronger AI (2026-09-14, `ai-nnue-2026-09-13.md`): linear eval re-fit under the final rules shipped in source (+94 ± 30 Elo; guard value 124 → 96); NNUE-style net built (1408→32×2→1, Int16, 118 kB, parity 0.7 cp) but lost −129 ± 29 Elo at depth 3 (WDL labels memorise per-game back ranks; material compression) → kept behind `setEvaluator('nnue')`, not default. 119 tests green. Build ready (dist assets index-D1chnv_q.js) — NOT published yet (Saar: start nothing new) **→ superseded: v0.7.0 published 2026-09-14 (`index-eaHeYinC.js`).**
- [ ] Next for the AI when allowed: 10× data from the shipped engine, then material + residual net

## Checkpoint 2026-09-14 (pause; nothing new started)
State: published game = v0.6.2 (guard = immortal wall, one-step; archer/beast any-step; two guards still possible in the pool at that build). Source is ahead of the published build: one guard per army in the pool, no promotion to guard, eval re-fit (+94 Elo), lab toggles for paladin/maester/guard/double-turn. Build is ready in dist/ (assets index-D1chnv_q.js) — publish as v0.6.3 when Saar says go.
Awaiting Saar: (1) paladin pick — recommended rules given 2026-09-14: as today + survives a pawn capture (Q7 depth-4 confirmation queued), (2) maester pick (data: swapAny is free; my lean: no, a teleport for no measured gain), (3) publish v0.6.3. Decided: guard = Wall; double turn = no (RULES.md §6.14); AI data = running (Q6). **→ all answered: paladin `nonPawn` shipped, `maesterSwapAny` not adopted, v0.7.0 published.**
All agents finished (2026-09-14). Nothing running.
Saar (2026-09-14): draws are the first thing to avoid → the two-square guard (Warden) is OUT. His idea: a double step only from the home rank, like a pawn. Lab toggle `guardDoubleFirst` (off | slide | leap) landed with tests (122 green); run queued, not launched.
Run queue: docs/QUEUE.md — LAUNCHED 2026-09-14 on Saar's word: Q1–Q5 as one chain (log sim/out/queue-2026-09-14.log), Q6 prep agent in parallel, Q6 generation after the chain.
Resolved (Saar, 2026-09-14): "always just one guard per army" = at most one; the pool stays. Q1 (pawn-style double step) stays queued.
Ability matrix started: docs/MATRIX.md — pieces × abilities (arriving, shield, handicap, movement, control, specials) and zones × rules with a capital grid; Saar will add more.

Q6 prep done (2026-09-14, agent): material + residual evaluator in the tree behind `setEvaluator('residual')` — `evalBoard = linear + clip(net, ±150 cp)`, so material never passes through the net (the −129 Elo failure in `ai-nnue-2026-09-13.md` §5). Int16 blob, feature layout and shape unchanged; default evaluator is still `linear`. `npm run nnue -- train --loss res` fits the net to the gap between the search score and the linear evaluation (the clip binds on 2.3% of the old corpus); `sample` now requires `--runs` (a stored `rules: {}` is not today's rules, so `todayRuns()` is gone). 128 tests green, `tsc --noEmit` clean. Commands, timings and the acceptance bar: `docs/research/ai-residual-plan-2026-09-14.md`. NOTHING RUN — generation (~2.3 h on 16 cores, 80k games), sampling (9 min) and training (18 min) wait for `sim/out/queue-2026-09-14.done`.

### Queue ran 2026-09-14 (Q1-Q5) - `docs/research/sim-queue-2026-09-14.md`, ledger `docs/RUNS.md` batch 4
41 600 games, depth 3, all paired A/Bs. Q6 (AI: 80k games, residual net, acceptance matches) is RUNNING - log `sim/out/q6-2026-09-14.log`, plan `docs/research/ai-residual-plan-2026-09-14.md`. **→ the inherited chain finished 2026-09-14 09:03 but its corpus was audited and excluded (old paladin, unstamped); the `nnue-g2` replacement runs via `tools/q6-chain.sh` (`docs/research/ai-q6-audit-2026-09-16.md`).**

- [x] Q1 guard double step from home (`ab-guard-dbl-slide`, `ab-guard-dbl-leap` vs `ab-warden-wall`, 1 500 games an arm, 60 one-guard ranks): **rejected**. `slide` clears nothing but branching (+0.7 +/- 0.2); `leap` costs capped +0.017 +/- 0.010 (1.5% -> 3.3%) and +5.2 +/- 3.9 plies. The guard does play more (4.43 -> 5.49 -> 6.18 moves a side-game; 8.9 -> 11.0 -> 12.4 counting both armies) - and **both readings drag drawn games to 51.5% / 51.9%, against the Wall's 40.5% and the rejected Warden's 52.0%**. "A move-one rule cannot touch the endgame" does not survive the measurement.
- [x] Q2 `paladinKamikaze=nonPawn` (`pb-ab-L-nonPawn` vs the clean control `pb-ab-base24`, 1 600 an arm): **nothing measurable** - score -0.003 +/- 0.018, decisive -0.008 +/- 0.022, draws +0.009 +/- 0.022, plies -0.3 +/- 1.3.
- [x] Q3 `maesterSwapAny` (`pb-ab-M-swapAny` vs `pb-ab-base24`): **balance and draws unchanged** (score -0.010 +/- 0.030, decisive +0.005 +/- 0.031, draws -0.004 +/- 0.030); plies -4.3 +/- 3.4, branching 33.1 -> 39.1 (+6.1 +/- 1.3), swaps 7.1 -> 13.1 a game, games where a king never moved 16.6% -> 25.4%.
- [x] Q4 `secondPlayerDoubleFirstTurn` (`dt-full`, `dt-nopal`, 4 000 an arm): **do not adopt**. Full pool White 0.533 -> 0.472 (-0.062 +/- 0.026) - it hands Black an edge the size of White's; no-paladin pool 0.526 -> 0.490 (-0.036 +/- 0.022). Everything else flat. RUNS.md R9 answered there.
- [x] Q5 `paladinKamikaze=never` (`pb-lp-never` vs `pb-lp-base`, 800 an arm, pool QRRBBNNL): White 0.554 -> **0.586**, decisive 0.846 -> 0.907, plies 90.8 -> 82.8. With the jump half (0.556, -0.004 +/- 0.045) **the paladin's White edge is neither the jump nor the sacrifice trade - it is the piece's reach on an open board.** Limit +/- 0.035 paired, +/- 0.045 on the paladin subset.
- [x] Void control found and replaced mid-chain: `pb-ab-base` mixes the two-guard and one-guard pools (79 arrangements, 384 two-guard games, only 94 of its 1 600 games on today's 40 ranks, capped 7.1%). Against it both buffs faked a cure (capped 7.1% -> 0.9%). The chain played `pb-ab-base24` clean and re-ran Q2/Q3. `pb-ab-base` stays on disk, **void for new comparisons** (RUNS.md). Lesson already in LESSONS.md.
- [ ] Known, not fixed: `leadMetrics()` in `src/sim/analyze.ts` reads the mover off ply parity, so `killerMove` and `interest` are invalid under `secondPlayerDoubleFirstTurn` (-0.21 / -0.04 in both `dt-*` files). Every parity-free metric is sound. Fix only if that rule is ever revisited. **→ fixed 2026-09-14: `moverAt(ply, rules)` is the one place that answers who moved (LESSONS.md).**

**Now waiting on Saar (four decisions):** **→ all resolved 2026-09-14: (1) paladin `nonPawn` shipped, (2) `maesterSwapAny` not adopted, (3) guard = Wall, (4) double first turn = no. v0.7.0 published.**
1. **Paladin `paladinKamikaze=nonPawn` - adopt on taste.** Value 2.21 -> 2.87 pawns (a knight is 2.96), no cost anywhere in the A/B, identity intact (`sim-lm-buffs` §6). Data says free; the call is taste.
2. **Maester `maesterSwapAny` - adopt on taste.** Value 2.18 -> 3.12 pawns, no cost to balance or draws, +6 legal moves a position, games 4 plies shorter, kings move less (25.4% never move against 16.6%). Data says free; the call is taste, and the king-stays-home row is the thing to look at.
3. **Guard = the Wall - decided by the data.** Both double-step readings drag like the Warden. No change to ship.
4. **Double first turn = no - decided by the data.** It over-corrects. R9 closed.


## v0.7.0 build + browser QA (2026-09-14, agent) — built, NOT published **→ published 2026-09-14; see the "Published v0.7.0" line below**

Source change (1 file, 1 string): the piece info card in `src/main.ts` still described the 2017
paladin ("then leaves the board"). It now reads "Removes itself after capturing anything but a
pawn" (docs/RULES.md §6.15). No other shipped text was stale — `index.html`'s piece guide was
already correct, and `public/` holds no text. The captured-pieces panel needs no change: it adds
the paladin to the other side's "took" list only when `move.selfRemove` is set, and
`paladinKamikaze='nonPawn'` does not set that flag after a pawn capture (confirmed in the browser,
case a below).

Build: `npx tsc --noEmit` clean · 129 tests green (`npx vitest run`) · `npm run build` ·
`node tools/artifact.mjs`. Assets: **`index-eaHeYinC.js`** 764.9 kB (257.6 kB gzip),
**`worker-CMvLmNQ1.js`** 137.3 kB, **`index-DQoaMBkc.css`** 6.0 kB; `dist/artifact.html` 10 kB,
`dist/files.json` 143 files.

QA — Playwright, headless Chromium, real mouse clicks, `npx vite preview --port 5223` over `dist/`.
**6 of 6 pass, zero console errors and zero page errors.** The `?rules=2017` arm is the oracle: the
same click, the same LAN, two different outcomes in the shipped bundle.

| # | Case | Result |
|---|---|---|
| a | paladin takes a pawn, default rules (`?fen=7k/7p/8/3p4/3L4/8/8/K6R w`) | `Ld4xd5`; paladin alive on d5 (FEN and the renderer's mesh map agree); pawn under "White took"; "Black took" empty; 1 burst |
| b | paladin takes a knight | both gone; knight under "White took", paladin under "Black took" (its own side's loss); 2 bursts |
| c | the same pawn capture under `?rules=2017` | paladin removed, pawn under "White took", paladin under "Black took", 2 bursts |
| d | AI vs AI to the end, think 200 ms | draw by repetition, 119 plies, setup RNMNAQGK, 509 s under the lab's CPU load; no console errors |
| e | undo across the pawn capture | FEN, both meshes and both took-lists restored |
| d2 | second AI vs AI game, setup `RNBQKLGM` (a paladin per army) | White mates in 149 plies, 503 s, **six paladin captures in one game** (one is all the 2017 rule permits per army), a paladin alive at the end, no console errors |

Known, not fixed (by design): the info card and the piece guide always describe the shipped rules,
so `?rules=2017|2021` shows today's text for the archer, the beast, promotion and the paladin.
Making one line preset-aware and not the rest would be worse; a preset-aware guide is a feature.
Harness lives in the session scratchpad (`qa.mjs`, `oracle.mjs`), not in the repo; both QA traps it
hit are now in LESSONS.md.

Published v0.7.0 (2026-09-14): https://claude.ai/code/artifact/7acdadad-e068-4a2e-a6a3-1635a2c3b1da — one guard per army, no guard promotion, eval refit, paladin survives pawn captures (§6.15); assets index-eaHeYinC.js / worker-CMvLmNQ1.js / index-DQoaMBkc.css; browser QA 6/6.
Ogre + Catapult (Saar's picks from PIECES-PROPOSED.md, two variants each: ogreMode repel|push, catapultCapture stay|land): Opus agent building + measuring (2026-09-14), report → docs/research/sim-new-pieces-2026-09-14.md.

Licensing (2026-09-14, docs/research/licensing-2026-09-14.md): the three board JPEGs derive from textures.com stock and may not be served as standalone files (ToS 6.3(a)) → procedural pixel stone tiles being built as a selectable variant with a before/after board (docs/research/tiles-proc/); DECISION for Saar: swap the default. Fonts (OFL via CDN) clear; models/sprites are Saar's own (credit line deferred at his word); Imperator not shipped.

## Takeover execution — 2026-09-16 (opencode/deepseek-v4.1-flash; plan `docs/TAKEOVER-PLAN.md`)

Evidence for every item lands beside it. Detailed records: `docs/takeover/`.

### Phase 1 — recoverable baseline
- [x] Recheck processes, Q6 logs, markers, weights and hashes: nothing running; the Q6 chain completed after the review but its output is unvalidated (`sim/out/UNVALIDATED-Q6.md`; generation exited 1 on a summary bug, records carry no rule stamps, gates skipped).
- [x] Stop automatic progression: nothing is running; the chain cannot advance again by itself.
- [x] Preserve source, v0.7 `dist` (copy at `docs/releases/v0.7.0/`, 146 files), specs, reports, chain/QA scripts and key outputs; hashes in `docs/takeover/baseline.json` (1,673 files, 5.5 GB) via `tools/hash-baseline.mjs --check`.
- [x] `.gitignore` anchor bug fixed; sim source/specs versioned; bulk data and art-src deliberately unversioned. Baseline recorded in `docs/takeover/BASELINE.md`; `tsc` clean; 149 tests pass. Git tag `baseline-2026-09-16`.

### Phase 2 — rule identity across execution and replay
- [x] Pass the active rule snapshot into browser AI workers (including respawns) and persist/restore rules in saves. `worker.ts` applies `setRules` per message; `Engine.think` sends the live rules; `Save.rules` restores before `playLan` (URL rule params win when they differ). New unit tests: rules posted to the worker and to a replacement after `cancel()`.
- [x] Immutable run identity (rules, pool, seed, search/eval settings, source version); reject unstamped/mixed/partial resumes. `Stamp` now carries the full resolved rules, `specKey` (`src/sim/identity.ts`: seed, arrangements, AI, adjudication, eval-file **contents**) and `src` (hash of `src/rules|ai|sim`). `checkResume` refuses unstamped, torn, mixed, changed-spec and changed-source files; `readRun`/`writeSummary` stream (the old `readFileSync` is what made the inherited chain exit 1).
- [x] Sampling uses recorded rules and validates replay; input fingerprints in the manifest. `gen.ts`/`tune.ts` sample under the stamp's full rules, replay every game through `src/sim/replay.ts` and compare stored events; `positions.json` carries per-run `rulesKey/specKey/src` and `sampledBy`; the write is pre-validated and atomic (`positions.bin.tmp` → rename), so a refused sample cannot truncate the corpus.
- [x] Sequential chain that stops on failure and validates before writing a success marker; candidate model separate from source. `tools/q6-chain.sh` (`set -euo pipefail`, dirty-tree check, staged `tools/q6-validate.mjs` calls) writes `q6-nnue-g2.done` only after the final validator passes; `nnue train` writes `sim/nnue/weights-candidate.ts`, never `src/`. Demonstrated: 400-game gate fixture at 0.45 exits 1.
- [x] Qualify Q4 evidence; retire Q4 commands. `RUNS.md` R9 and `QUEUE.md` Q4 now state that the *search itself* assumed alternation (mover by ply parity, score negation, turn-bit hashing, repetition paths), so the numbers are directional; the rejection stands, commands retired, prerequisites listed for a future Haste.
- [x] Enforce arrangement-sweep rejection gates or label the tool exploratory. `experiments.ts` sweep output is now an explicit "Exploratory shortlist — rejection gates NOT enforced".
- Evidence: `npx tsc --noEmit` clean; 152 tests in 6 files pass; smoke run `smoke2` stamped (`rulesKey 0e2fb239`, `specKey 826b122e7454`, `src f3e2439a8859`), refused a changed rule, sampled with fingerprints, and refused the unstamped `nnue-g1`.

### Phase 3 — Q6 dataset
- [ ] Audit the 686 prefix vs the later cohort by launch records and move replay; exclude what cannot be established.
- [ ] Freeze the accepted dataset + linear teacher; explicit old-paladin-vs-current decision; replacement data only for a demonstrated gap.
- [ ] Train one residual candidate; record source/dataset/model hashes and validation.
- [x] Staged acceptance: 400-game gate, 1,600-game depth-3, depth-4 confirmation, speed check; accept/reject report. **ACCEPTED as a candidate (2026-09-17 03:14):** gate score 0.724 (+167 ± 26 Elo, 400 games), decision **+139 ± 14 Elo** (1,600 games), depth-4 **+149 ± 37** (200 games, no sign reversal), speed residual 1s depth 5.92 (bar: 5), dataset/model hashes verified by `tools/q6-validate.mjs final`; claims checked with `tools/verify-claims.mjs` (controls 0.77/0.02). Report: `docs/research/ai-q6-acceptance-2026-09-16.md`; evidence copied to `sim/q6-g2/`; raw corpus and `positions.bin` stay in the worktree. **Adoption (changing the default evaluator) is a separate owner/release decision; the shipped default stays linear.**

### Phase 4 — Ogre/Catapult
- [x] Audit the 13,600-game outputs and `np-N` control against frozen identities. `tools/q6-audit.ts`: all 13,600 games present (3×2000 + 4×1600 + 4×300); every arm's stamp matches its reading (`{}` / `ogreMode=push` / `catapultCapture=land`) on the one-guard pool; 64-game replay per arm is clean under `paladinKamikaze=nonPawn` (15–21 of 64 distinguish it from the excluded `always`). The faulty first `np-N` is not in these files.
- [x] Finish the report sections: `docs/research/sim-new-pieces-2026-09-14.md` §0, §3–§7. `tools/newpieces-stats.ts`. Matched `np-O` vs `np-N`: decisive **−6.5 ± 2.7 pts**, draws 25.2% → 31.7%; `np-C` neutral. A/B `push − repel`: decisive **+5.3 ± 3.0 pts**, draws −5.9; `land − stay` unresolved. Guard shoves 1.95% of games (`push` 2.94%), so no blockade claim.
- [x] Browser lab QA: shove selection and animation were missing; fixed (`clickPath`, shift-click disambiguation, `shoves` highlight, renderer shove animation). `tools/qa.mjs` 8/8: paladin default/2017, rule-restoring autosave, friend shove + undo, capture-vs-shove, catapult lob, AI reply, kings save/restore.
- [x] Bounded next decision, executed 2026-09-17 (`tools/newpieces-followup.sh`): depth-4 `push` vs `repel` **grows** the effect (decisive **+10.2 ± 4.7** vs +5.3 ± 3.0 at depth 3, draws −10.4 ± 4.8) but raises White's score **+4.9 ± 3.1** (flat at depth 3); re-seeded odds read Ogre repel **2.43 ± 0.58 pawns** (not converged) and Catapult stay still **< 1.66**. Claims Jev-verified (controls 0.77/0.03). Both pieces stay lab-only; `push` is the reading to pick if ever promoted.

### Phase 5 — king powers
- [x] Reconcile semantics against the owner's rules and the proposal; the material unresolved choices are listed in `docs/research/sim-kings-2026-09-16.md` (Mercy vs guard immunity, Death Touch verb, always-on vs charged March/Leap, adjacent Mercy kings, the Darkness eval confound). The proposal's defaults are treated as proposals.
- [x] Generation, king-safety and attack-agreement coverage for all six: 21 new tests in `src/rules/rules.test.ts` (per-power generation from hand-built FENs, `crossCheckAttacks` under each power, asymmetric choices, powers-off equivalence, undo, and a Death Touch search test that is the worker's own search). Browser QA 10/10 (`tools/qa.mjs`) incl. a real-worker Death Touch move, a Darkness capture through the UI, and rule-restoring save/restore.
- [x] Variant-aware guide text: `main.ts` renders each active power's effect in the info line; `index.html` gains the six-power section; powers stay off by default; no picker added.
- [x] Paired tests, run 2026-09-17 (`tools/kings-pilot.sh` behind the Q6 chain): pilots 200/arm, then 1,600-game paired A/Bs against fresh default controls, depth 4 for the five consequential powers. **Result:** Darkness/ March/ Leap sharpen decisively (depth-3 paired decisive **+15.4 ± 3.9**, **+13.2 ± 3.0**, **+7.4 ± 2.9** points; all keep their sign at depth 4); Mercy sharpens at depth 3 (+5.4 ± 3.2, depth-4 interval includes zero); Holy Light flat; **Death Touch lowers decisive share (−5.0 ± 2.7; −9.8 ± 5.0 at depth 4)** — contrary to the plan's "best anti-draw" expectation. Report + owner questions: `docs/research/sim-kings-2026-09-16.md`, options: `docs/research/kings-decisions-2026-09-16.md`. Claims Jev-verified (controls 0.81/0.02). Powers stay off by default.

### Phase 6 — supporting analysis, art, docs
- [x] Liveliness: one frozen depth-3 dataset, split by arrangement, held-out integer score, bootstrap CIs; the gain is real but the filter thins the guard and maester of games, so **no filter adopted**. Report: `docs/research/setup-liveliness-2026-09-14.md` (completed 2026-09-16); tool `tools/liveliness.ts`.
- [x] Tiles: before/after report and browser QA written (`docs/research/tiles-proc/README.md`, `tools/tiles-proc.mjs` now measures fps and fails on console errors; artifacts regenerated). B4 option presented; default unchanged; the JPEGs must leave the published file list if B4 is adopted. fps re-checked on a free machine (21.4 vs 21.6, no difference).
- [x] Docs/queues reconciled: TASKS stale "waiting/not published/running" lines annotated with their resolution; QUEUE's Q4/Q6/Q7 rewritten (Phase 2); RUNS batch-2 dangling reference repaired and batch 3 marked ran; MATRIX status note (six tier-1 powers built lab-only); RULES §4/§6.10 updated; PIECES-PROPOSED notes O/C built lab-only; STATUS-2026-09-13 and docs/status carry historical banners; dashboard regenerated (221 runs, 122 reports, 461,833 games).

### Phase 7 — release preparation (no publication)
- [x] Smallest validated change set chosen; unvalidated candidates stay disabled (powers off, lab pieces out of the pool, linear evaluator, B4 not default).
- [x] `tsc` clean; 173 tests pass; review build in `dist-review/` (built from `ce90454`, 144 files, digest `fb150cec4218bd6a`, worker bundle `worker-C8IVcIyN.js` verified); browser QA **16/16** incl. full game (draw by repetition, 71 plies, 39 s on a free machine), cancellation, promotion, undo, save/restore, mobile, 2017/2021 presets and `?style=` over the autosave.
- [x] Release summary: `docs/RELEASE-REVIEW-2026-09-16.md` — tested behaviour, disabled candidates, limitations (licensing blocks publication), and the publication note. **Not published.**

## Phase 2 — Later (not scheduled)
- [ ] Kings' powers (docs/RULES.md §4) behind a variant config
- [ ] Card/spell effects (§5)
- [x] Threefold repetition, insufficient material (2026-09-13): `insufficientMaterial()` + `Game` position counts; `Status` gains `drawRepetition`/`drawMaterial`. Tests 18/18 green.
- [ ] Stronger AI (see research report), online play

## Claude local-record recovery — 2026-09-14
- [x] Locate project sessions, Desktop metadata, memory, and related backups. Evidence: `docs/claude-recovery/README.md`.
- [x] Verify transcript parsing and create a source inventory with explicit gaps. All 88 project JSONL files parse; `docs/claude-recovery/inventory.json` records paths and hashes.

## Takeover review and plan — 2026-09-14 (inspection only)
- [x] Reconcile main sessions, all 85 background-agent transcripts/results, 331 scratchpad task outputs, and queues against current files. Evidence: `docs/claude-recovery/review/TASK-LEDGER.md`, `BACKGROUND-INDEX.md`, `SPEC-INDEX.md` and JSON inventories.
- [x] Review latest source against recorded decisions; run bounded verification without changing the published build or ongoing jobs. TypeScript clean; 149 tests pass; two focused replay/FEN reproductions; 199 source/tool/build hashes unchanged. Evidence: `docs/claude-recovery/review/VERIFICATION.md`.
- [x] Write evidence-backed completion ledger, review findings, and an ordered takeover plan. Review: `docs/TAKEOVER-REVIEW-2026-09-14.md`; plan: `docs/TAKEOVER-PLAN.md`. **Implementation plan NOT STARTED**, per the owner's instruction. The inherited Q6 process remains active; new-piece chain completed after Claude stopped.

## Jev (TypeSafe) balancing review — 2026-09-17
- [x] Claim-review of the current rules, rejected rules and tested candidates against the measured numbers: `tools/jev-review.ts` → `docs/research/jev-review-2026-09-17.md` (3 runs per theme, controls every run, majority+median gating). Endorsed: guard draw engine, beast ornamental, draws are quiet; the Warden/double-step/double-turn rejection rationales; `maesterSwapAny` is a taste call; the depth-3 sign pattern; Catapult numbers; liveliness-filter facts. It also caught a real arithmetic slip in this ledger's draft (March's depth-4 interval excludes zero; only Mercy's includes it).
- [x] Instruments that failed control validation, deleted rather than trusted: game-pattern classification, rule red-teaming (`tools/jev-redteam.ts`), guide-text checking, document triage. Calibration in `LESSONS.md`: facts and directions confirmed; interval arithmetic and long acceptance conjunctions are refused even when true; evaluative conclusions are refused by design (the value judgment is the owner's).
- [x] Advisory (opinion, unvalidated): biggest hidden balance risk = **archer** (p 0.97, consistent with the known eval/odds mispricing); next A/B = **ogre push repricing** (p 0.51, low confidence).
- [x] Jev session player (`tools/jev-play.ts`): engine enforces legality/tactics, Jev picks a plan among code-described candidates, confidence-gated and fully logged. 82 games run (40 engine control, 16 feature-only, 26 full ballot). **Finding:** the generic "improve position" plan dominated overrides and cost strength (0.250 vs 0.500 control, ~2.4 SE); a feature-only ballot removes the cost (0.562, interval covers control) and keeps overrides at 8%. Report: `docs/research/jev-sessions-2026-09-17.md`.
- [x] Actions on Jev's advisory picks, run 2026-09-17: **archer pricing A/B** (`ab-archer-val`, A=270 vs 337, 800/arm) — null on every game metric; **Ogre push repricing at depth 4** (`ab-O-push-d4-reprice`, O=195 both arms) — sharpening holds (+9.0 ± 4.9) and the White shift disappears (+0.5 ± 2.8), so the adoption blocker was an artefact of the over-priced Ogre. Written into `docs/research/jev-review-2026-09-17.md` §5 and the Ogre report.

## Interaction improvement loop — 2026-09-17
- [x] Instrumentation: `tools/interactions.ts` (streaming profile of every interaction in the 80k shipped-rules corpus and lab corpora) and `tools/jev-interest.ts` (rubric 0–3 interestingness with anchored controls — first Jev judgment instrument to pass controls: routine 0.08, highlight 2.92). Reports: `docs/research/interactions-2026-09-17.md`, `docs/research/jev-interest-2026-09-17.md`.
- [x] **Reaver (V) built, priced, measured and nerfed-to-default**: full 8-direction step overpowered (non-convergent, +188 Elo at a 5.04-pawn price); orthogonal step is the measured default at 4.04 ± 0.56 pawns with +7.1 ± 2.5 decisive points and neutral balance. 6 new tests; full suite 180 (7 new). Report: `docs/research/sim-reaver-2026-09-17.md`. Follow-up: depth-4 confirmation **null** (+0.5 ± 6.5) and the four-arm combination check **no interaction** (−2.3 ± 3.9) → **not confirmed**, lab-only, outside pool/promotions.
- [x] Jev-interest calibration: measured descriptions score ~0.6 below the proposal pitch (2.50 → 1.93); score the measured text, not the pitch.
- [x] **Templar (T) built and rejected**: queen-on-capital design never fires (4–8% of moves from a capital); implied value 2.15–2.39 pawns, decisive −5.4 ± 2.7 (bonus: −2.5 ± 2.6), draws up. Report: `docs/research/sim-templar-2026-09-17.md`; PIECES-PROPOSED updated. The interest axis (Jev 2.23) and the game-priority axis disagree — both recorded.
- [x] `tools/jev-interest.ts` hardened to 3 runs with spread and controls in every run (spreads ≤0.11; routine 0.06, highlight 2.95): the measured-interest ranking is now stable.
- [x] Paired placement experiments (2026-09-17): maester near-king (−1.3 ± 5.4 decisive), bishop near-king (+0.5 ± 4.8), Ogre a-file (+1.4 ± 4.3) — **all null**; the location screens were rank-sampling confounds. `docs/research/conditions-2026-09-17.md` §3 corrected.
- [ ] **Next by measured-interest ranking: Strike 2.87 / Squire 2.86 / Flight 2.56 / Sacrifice 2.40 / Ice Wall 2.16 / Freeze 2.07.** Strike, Flight, Freeze and Ice Wall all need the same tier-2 plumbing first: per-side charge state (and Freeze/Ice Wall a one-turn mark) carried through `Position`, `makeMove`, Zobrist, FEN's seventh field and the search's make/unmake — the plan's documented design (`docs/KINGS-POWERS-PLAN.md` §2, "the single easiest bug to ship in tier 2" is the hash). Build that plumbing once, then add the powers one at a time with tests and fresh-control pilots.

### Piece evaluation practice (owner direction, 2026-09-17)
- **Value is one axis, not the verdict.** Every piece evaluation now reports, besides the odds-match value:
  - **paralysis** (share of owner-armies where the piece never moves) and activity (moves per army per game),
  - **condition tables** (how the piece's role changes with the army's composition — guards, pawns, screens — and with phase),
  - the interaction counters (shots, chains, shoves, swaps, lobs) so the reader can see what the piece actually did.
- Tooling: `tools/conditions.ts` (activity/paralysis + paired runs), `tools/placement.ts` (starting-file and king-adjacency screens), `tools/interactions.ts` (event profile), `tools/jev-interest.ts` (3-run rubric with controls). Combination tests use the 4-arm factorial `sim/specs/newpieces/cx-*`.
- **Results 2026-09-17:** Ogre vs guard-heavy **refuted** (shoves guards 0.22/game, 10×, decisive −5.8 ± 4.3); Ogre+Beast combination **no interaction** (+3.7 ± 4.9, beast captures unchanged); two Reavers compound sharpening (+4.5 ± 2.9 decisive, −12 plies, balance neutral); location screens flag maester-beside-king (+8) and bishop-beside-king (−12) for paired placement tests; game-breaking is now a code screen (value non-convergence / matched-price dominance / interaction / condition collapse). Report: `docs/research/conditions-2026-09-17.md`.
- Evidence so far: Templar 7.7% paralysis (busy, ineffective, capital visited 4-8% of moves); Reaver 3.9% (active, 0.85 captures/game); guard ~6%; rook 3-4%; Catapult fires in only 63.5% of games (no screen, no attack); Ogre guard-heavy condition run in flight (`gh2-N`/`gh2-O`).
