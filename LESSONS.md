# Lessons

Reusable corrections. Pattern → rule.

- Google Drive MCP `read_file_content` returned `{}` for every doc/sheet in this project. → Use `download_file_content` (base64) or, for link-shared files, `curl` the export URL (`/export?format=txt|xlsx`, `uc?export=download&id=`) and `gdown --folder` for folders.
- macOS `base64` has no positional file arg. → `base64 -D -i in -o out`.
- `gdown --folder` in the current release has no `--remaining-ok` flag. → Run it plain; check `find dir -type f | wc -l` for the 50-file cap.
- Image-only PDFs come back as garbage text. → Rasterize with PyMuPDF (`page.get_pixmap(dpi=110)`) and read the PNGs.
- Voxelized sculpts at 14–20 voxels read as blobs; at 36 voxels with normals taken from the occupancy gradient (not face normals) they shade like the original sculpt and stay legible at pixel size 2. → `tools/voxelize.py --height 36` is the baseline; keep `VOXEL`/`TARGET_HEIGHT` in `src/render/voxels.ts` in step with the pixel size.
- Artifact `files` list form needs `{path}` objects; a bare string array is rejected. → Use the map form `{"published/path": "source/path"}` with `root: "dist"`, and `null` to drop stale hashed bundles.
- In `browser_batch`, `navigate` without `tabId` hits the fronted tab (it replaced the dev-server tab once). → Always pass `tabId`.

## 2026-09-13 — in-place edits with `|` in the text
- **Mistake:** `perl -pi -e "s|…\|\|…|…|"` inside shell double quotes mangled every line of `src/render/sprites.ts` (the pattern collapsed to empty and matched each line start).
- **Rule:** for edits whose text contains `|`, `$` or quotes, use the Edit tool or a Python snippet / quoted heredoc; never a perl/sed one-liner with a `|` delimiter. Run `npx tsc --noEmit` right after and `git`-less projects get a `cat -A | head` sanity check.

## 2026-09-13 — session rate limit killed 8 parallel Opus agents
- **What happened:** ten agents in flight hit the account's session limit (HTTP 429); each stopped mid-task with partial files on disk.
- **Rule:** before resuming, survey the disk (`ls`/`tsc`/`vitest`) to know what landed, then resume each agent with `SendMessage` (its transcript is kept) telling it to re-read its files first. Keep no more than ~6 Opus agents running at once when the limit window is close, and stagger research (cheap) after builds (expensive).

## 2026-09-13 — balance-lab traps (from the stage-2 run)
- Pawn-odds calibration with one pawn removed measures that pawn's file, not a pawn: the h-pawn alone read −17 ± 42 Elo because it opens the rook's file. → Average pawn odds over all eight files.
- A stored report is only a baseline if the engine was deterministic when it ran: the first smoke predates `resetSearchState()`/`positionKey()`. → Re-run baselines after any search change; the summary records the search version.
- Sweep spreads must be compared with sampling noise before naming "best/worst" arrangements: 20 games per rank gives sd 0.09 on the score, wider than the observed spread. → Size runs from the noise formula in `docs/SIM-PLAN.md` §3 first.
- Animations must not depend on rAF alone: a hidden tab stops `requestAnimationFrame`, so an awaited tween never resolves and the game loop stalls. → `Tweens` now flushes on `visibilitychange` and resolves instantly while hidden.
- Cross-cutting analysis tools must not import from `src/` while other agents edit it (a mid-edit file breaks the tool). → Import only stable constants; port hot functions with a provenance comment (`tools/mine.ts` does this).
- A "minimum over pieces" term in a composite score is dominated by the weakest piece (the inert beast pulled every rank's interest to the same value). → Use means or per-piece columns; check each term's correlation with the total before ranking.
- Unquoted `$VAR` in zsh does not word-split, so `npm run sim -- $RULES` silently dropped every `--rule` flag. → `parseFlags` now rejects keys with whitespace and the runner prints the live rule diff at start; always read that line before trusting a run.
- A rule can be degenerate only in company: `guardCaptures=pawns` and `guardStep=2` each measured harmless alone, together they made an uncapturable pawn harvester (44% of games). → A/B every combination you intend to ship, and count abuse patterns, not just balance.

## 2026-09-13 — batch 3
- A colour-swapped pair cancels the thing an asymmetric run measures: `byConfig.score` is White's, so `b3-armies` read 0.537 (White's first move) and not the court's 0.566. → For an `asymmetric` spec, score the arm from the JSONL as `0.5 × (result as White + 1 − result as Black)`; the analyzer's own column answers a different question.
- A spec pair is not a control pair until the two armies differ: `tools/mine.ts` gave `b3-nobeast` the same army as `b3-rule-base` (`QLRBAGM`), so 3 200 games measured replication, not the beast. → Print each arm's army and value before a batch runs; `node tools/rebase-batch3.mjs` does this.
- A piece-value table is a dependency of every value-matched spec. The Texel fit moved A 1.70 → 3.4 and G 1.70 → < 1.5, which turned the "A→G isolates a piece" swap into a 1.9-pawn handicap. → Re-derive every matched army after a values pass, and say in the spec `note` which table it was matched against.
- A ranking of arrangements does not survive a rule change: the pre-buff residual-interest order correlates −0.16 with today's, because it was counting beasts. It does survive a ply (+0.81 from depth 3 to depth 4). → Re-measure any stored ranking after a rule change; depth is the cheaper thing to trust.

## 2026-09-13 — a recorded `rules: {}` is not "today's rules"
- **Mistake:** the guard study filtered runs on `spec.rules` and put every `b3-*` run in the
  "immortal guard" pool. An empty diff means *the defaults on the day the run played*, and batch 3
  ran while `DEFAULT_RULES` still carried the buff set. Its guards capture 1.1–2.6 pawns a game
  (`Ge3xd4` appears in `b3-guard2`), so those 68 000 games measure a different piece.
- **Rule:** never read a rule off a stored spec. Read it off the **moves**: a guard capture, a guard
  step of 2, an archer's diagonal step, a guard taken by a non-king. `tools/guard-study.ts
  --list` classifies every run this way and prints the pool it lands in. Cross-check with
  `report.json` → `degeneracy.guardCapturesPerGame` before pooling anything.

## A resumed control run silently mixes pools (2026-09-14)
`pb-ab-base` was played 1 544 games under the two-guard pool, then resumed for 56 games under the one-guard pool: 79 arrangements, 384 two-guard games, and today's arms (`--seed 21 --sample 40`, one-guard pool) share only the 56 resumed games with it — the A/B was void and both buffs looked like miracles (capped 7.1% → 0.9%). The runner records the rule *diff* against the defaults of the day, so "all defaults" is not a fixed thing.
**Rule:** after any change to `POOL` or `DEFAULT_RULES`, never resume an old control: give the control a new id (or list `backRanks` in the spec). Before reading an A/B, check that the control's `configId` set equals the arm's (`python3` one-liner over the JSONL). Better still: the runner should refuse to resume a run whose arrangements do not match its current sampling.
**Now enforced (`checkResume` in `src/sim/run.ts`):** a run stops instead of resuming when a stored game's arrangement is not the one the spec plays for that game id, or when the rules-and-pool stamp now written on every game line differs from today's.

## Measuring without adding a file to the repo (2026-09-14)
- **Mistake:** a throwaway `.mts` benchmark in the scratchpad imported `./src/rules/engine` and died with `ERR_MODULE_NOT_FOUND` — an ESM specifier resolves against the *script's* directory, not the cwd, so every project import was missing.
- **Rule:** run it from the project root and load the project through dynamic import off the cwd: `const root = pathToFileURL(process.cwd() + '/src/').href; const { trainNet } = await import(root + 'sim/gen.ts');`. The `.ts` extension is required and the file URL survives a path with a space. Two 6-second read-only runs replaced two guessed numbers in the Q6 plan (sampler 156 games/s, trainer 6.5 s an epoch) without writing a file anywhere.

## Merging two code paths behind a flag changed the one I was not touching (2026-09-14)
- **Mistake:** adding `--loss res` to the NNUE trainer, I folded the new residual clip into the shared `target()` with the base defaulting to 0 for the old losses. With base 0 the clip still applied, so `--loss wdl` — the path that produced the shipped net's numbers — silently started fitting the score clipped to ±150 cp. Every test still passed, because no test pinned the old target.
- **Rule:** when a new mode joins an existing function, the old mode must come out bit-identical, and that is a thing to check on purpose: read the merged expression with the new parameter at its default and ask what it computes. Gate the new behaviour on the new state being present (`if (bases)`), never on a neutral-looking default value.

## A metric that reads the mover off ply parity breaks under a rule that changes whose turn it is (2026-09-14)
`leadMetrics()` in `src/sim/analyze.ts` picks the mover with `idx[i] % 2 === 0 ? 1 : -1`. Under
`secondPlayerDoubleFirstTurn` Black plays two moves in a row at the start, so the parity is inverted
for the rest of the game: `killerMove` measured the largest swing *against* the mover and then clamped
it at zero, and `interest` (a weighted sum that includes it) inherited the fault. Both `dt-*` runs read
−0.21 and −0.04 with a ±0.01 bar, in two different pools — the same size twice is the signature of a
systematic fault, not an effect.
**Rule:** a rule that changes *who moves when* invalidates every metric that infers the side from a
ply index. Before reading an A/B of such a rule, list the metrics that use ply parity and strike them
from the table; derive the side from the move record, not from the index. Equal-and-identical
differences across two independent pools mean a bug until proven otherwise.
**Fixed 2026-09-14:** `moverAt(ply, rules)` in `src/rules/engine.ts`, beside `makeMove`, is now the
only place that answers "who moved at this index". `analyze.ts` (`killerMove`, `decisionCost`),
`tools/mine.ts`, `tools/guard-study.ts` and `tools/warden-report.ts` all call it; a stored game
carries its own rule stamp, and a file written before the stamp falls back to the run summary and
then to the defaults. `dt-full` and `dt-nopal` were re-read with `--experiment ab --noReplay`, which
rebuilds an experiment page from the JSONL without playing a game: `killerMove` moves from
−0.209 / −0.211 to +0.010 ± 0.010 / +0.007 ± 0.009, and `interest` from −0.041 / −0.042 to
+0.003 / +0.002. The balance answer does not move, so §5.4 stands.

## A click on the 3D board can land on the piece in front of the square (2026-09-14)
- **Mistake:** the v0.7.0 QA harness clicked `view.screenOf('d5')` to capture with the paladin on
  d4. The raycast hit the paladin, the click re-selected d4, and the move never played — 30 s spent
  waiting for a ply that could not come. At the 54 deg camera a tall mesh covers the tile centre of
  the square behind it.
- **Rule:** hover first and read `#hover` (it names the square the raycaster picks); click only when
  it names the square you want, else move ~18 px up the screen and probe again.
- **Same session, second trap:** `refresh()` publishes the move list, the FEN and the took-lists
  *before* `animateMove` runs, so a fixed `waitForTimeout` after a click reads a half-animated
  scene — `view.pieces` still held the pre-move board and the burst count was 0. That looks exactly
  like a stale-renderer bug. Wait for the autosave's `moves.length`; it is written after
  `view.sync()`.

## Editing the engine while a run launches plays a different game (2026-09-14)
- **Mistake:** benchmarking `isAttacked` by editing `src/rules/engine.ts` between timed runs, I left
  the file in a half-edited state for three minutes — a slice that was meant to delete the catapult
  rays also deleted the pawn and archer loops beside them. The lab chain started `np-N` inside that
  window. A `Worker` snapshots the module graph when it spawns, so all 16 workers played 2 000 games
  under an engine in which pawns and archers gave no check, and neither `tsc` nor the file on disk
  afterwards showed anything wrong. The run had to be thrown away.
- **Rules.** (1) A/B a hot path in a **copy**, never in the file the lab imports; if it must be the
  real file, do it with nothing queued and re-run the suite before anything launches.
  (2) A timing number measured on a broken build is not a timing number: the first "60% of perft"
  reading came from a function that had lost two of its loops.
  (3) Before reporting any run, replay it: parse each stored LAN back and assert it is legal under
  today's engine (`verify.mjs` pattern — `legalMoves(pos).find(x => toLan(pos, x) === lan)` over ~60
  games a file). A broken engine shows up immediately as a move that is not legal now, and it is the
  only check that sees *which* engine actually played.

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
- Keep the *decision* out of the state: the first Phase 6 docs-classification call put my own
  conclusion into the entry text ("was never completed", "is absent") and Jev echoed it back
  (all `doc-only`, stale ≈ 0.65). State should carry raw evidence; the judgment belongs in the
  question.
