# Lessons

Reusable corrections. Pattern → rule.

- Recording the painted scene with a fake `requestAnimationFrame` clock gave the same frame over and over: the scene asks for its idle frames from a real 33 ms timer, which never fires inside one synchronous `page.evaluate` loop, and the lava mask (loaded on first draw) never arrived either. → Each recorded step asks for its frame (`scene.redraw()`, then step the clock), and the recording waits once on the real clock for an effect's own art before the first frame. (2026-10-04)
- A position held one Freeze/Ice Wall mark, so the side it bound could play its own mark and erase it; under `markFree` (the official reading) it then made the forbidden move, and the search found the trick. It lived from the free-mark reading (2026-10-02) until a review of card mode (2026-10-03), because every test marked with one side only. → State that each side can set keeps one slot per side (`Position.marks`); test every two-sided power with both sides using it in turn, before measuring it. (2026-10-03)
- The hash's high half was drawn from the same xorshift stream as the low half; xorshift is linear, so the high half was a fixed function of the low one and keys carried 32 bits, not the 52 the comment claimed. → Draw independent halves from independent generators, and test a claim about key width (distinct low halves with equal high halves must exist). (2026-10-03)
- Recolouring one army's half of a painted sheet and saving its lossy WebP re-encoded the untouched half too (mean change 0.6–0.7 of 255), and re-running the figure-cut script then rewrote the other army's title and Guide crops; the strike-sheet tool likewise rewrites all eleven sheets. → Check "untouched" on the PNG master (pixel-identical), restore derived files of the side that did not change, and keep only the regenerated files the change is about. (2026-10-02)
- Two branches built at the same time met in review: the new screens asked the move generator "as if it were the other side's turn" by copying the whole position, so a pending Haste second move came along and the threat markers vanished; and the screen-reader line took the piece on `from` as the mover, which a Freeze (an enemy square) breaks. → After a new move kind or position field lands, check every helper outside the engine that reads `pseudoMoves`, `m.from` or `m.to` (`grep -n "pseudoMoves\|board\[m.from\]" src/*.ts`), and give power moves their own wording. (2026-10-02)
- The random-army pool gained the Ogre after the residual net was trained, and the evaluator's "lab piece → plain evaluation" fallback quietly switched the net off on about half of all browser games from 2026-09-25 (commit bda05fb) until today, unnoticed. → After any change to `POOL`, check which evaluator a random army actually gets (`evalBoard` vs `evaluateBoard` on a board with each pool piece), and retrain or extend the net. (2026-10-02)
- A wait loop `while pgrep -f "<pattern>"` never ended: `pgrep -f` matched the loop's own shell, whose command line contains the pattern. → Write the pattern so it cannot match itself (`pgrep -f "powers-net.ts [m]atch"`), or wait on the process's own output (a "done" line). (2026-10-02)
- A kings' powers tournament let its random opening moves include power moves. Flight alone adds about 200 moves to a position, so most powers were spent by chance in the first four plies and the run measured nothing. → Random opening moves come from the pieces' own moves only (`m.power` excluded); after any new move kind, check what the opening randomiser can pick. (2026-10-02)
- `create_session` with a short commit SHA as the source revision failed at start (`ref_not_found`). → Start compute sessions on a branch name and have the prompt check out the full 40-character SHA. (2026-10-02)
- tsx compiles with `keepNames`, which wraps every inner arrow function in a naming call; in the attack test's hot loop that cost more than the work. → Keep closures out of hot paths (module-level helpers, precomputed tables) and measure the search with node counts held equal. (2026-10-02)
- Sim workers stopped loading TypeScript under Node 22 (`new Worker(file.ts)` ignores the parent's tsx loader), and the runner waited forever for games a dead worker would never play. → Start workers through `src/sim/worker-boot.mjs` (`tsWorker()`), and fail the run when a worker exits with games unplayed. (2026-10-02)
- Cloud sessions ship a Chromium build that Playwright 1.63 does not look for. → `.claude/hooks/cloud-setup.sh` links it (`tools/pw-cloud-link.mjs`); run browser tools with `PLAYABLE_BROWSER=chromium`. (2026-10-02)
- A new timing check failed twice for reasons outside the code: its King-walk position (two bare kings) was an immediate draw, so no move could be played; and the Fast timing ran on into the computer's reply, which started the moment the timed move ended. → Test positions need material on both sides (or check the game is not over), and time only the animation you mean: `view.scene.playing` names it, so stop when it changes. Also: a background wait `while pgrep -f "tools/qa.mjs"` matched its own shell's command line and never ended; wait on the PID (`kill -0 $pid`). (2026-10-02)
- The committed trial strike sheets differ byte for byte from a fresh run on unchanged `main` in a cloud session (another Chromium build). → "Byte-identical" means identical to the same tool's run on `main` in the same environment; save that run first, then compare. (2026-10-02)
- A load measurement with a service worker looked 4× faster and showed 0.14 MB transferred: once `clients.claim()` took over, the page's files came through the worker, whose own fetches the CDP network emulation does not throttle or count. The worker had also started precaching on `load`, in parallel with the first visit's own downloads. → Register the worker only after the board is drawn, and cross-check every load measurement with one run under `serviceWorkers: 'block'`; the numbers must agree. Bound any wait on `navigator.serviceWorker.ready`: it never resolves on a page with no registration, which hung the first script for 28 min. (2026-10-02)
- To build main beside a branch, `git checkout main -- .` overwrote the branch's tracked files in place (recovered with `git checkout HEAD -- .`). → Build another revision from `git worktree add <dir> main` (symlink `node_modules`), never by checking its files out over the working tree. (2026-10-02)
- A baseline of the browser tools on main ran with tool files already edited for the new UI (Guide cards, title skip), so `verify-playable-clay.mjs` "failed on main" waiting for `.piece-card`, a selector main's build cannot have. Screenshot runs against the same preview server during that baseline also coincided with a clay figure's "Failed to fetch". → Take a baseline from a clean worktree of the base branch (`git worktree add /tmp/main-wt main`, symlink `node_modules`), and run nothing else against its server while it runs. Then edit tools. (2026-10-02)

- A lesson's `save()` guard did not protect the match: changing a player cleared lesson mode first, then saved the lesson position over the match. → Keep the live `Game` separate from the lesson `Game`, preserve its rules and player sides, and test lifecycle controls as well as lesson moves. Lessons must run under the rules their instructions teach. (2026-09-29)

- Moving the lessons button into the Guide dialog broke two tools that closed the Guide with `#rules button` (strict mode: two buttons). Only the painted check was rerun after the move, so the break showed one batch later. → After adding or moving a control, grep the tools for selectors of that container (`grep -n "#rules button" tools/*.mjs`) and prefer specific selectors (`#rules form button`); rerun every tool after any UI move, not only the one that tests the feature. (2026-09-27)

- The trailer's cue sheet and score copied the intros' timing (ramps, reveal starts). The copies drifted during the motion pass, so the name-reveal sounds played 50–160 ms after their hits, and the "within one frame" check passed because it measured the copies against themselves. → Shot modules export their timing and the sound imports it; never copy a timing value into a second file. A sync check compares against the picture's own values. (2026-09-27)

- The trailer's motion blur sampled a shutter centred on each frame time. Every hard cut then blended the last shot into the first frame of the next, and every hit peaked one frame late; shots began to shift their own events half a frame to compensate. → Open the shutter on the frame time (sub-frames at `t + s/N · shutter`), as a film camera does. Fix timing faults in the renderer, not in each shot. (2026-09-27)
- Trailer mastering: two-pass `loudnorm` silently fell back to dynamic mode (it lifts quiet passages) because the mix's peak-to-loudness ratio was above what −14 LUFS at −1 dBTP allows; and raising the title hit's level did not make it the loudest, since every big hit reached the limiter. → Master as one linear gain, then a true-peak limiter, and fail when the target is missed. At a peak ceiling, rank hits by density (crest factor), not by level. (2026-09-27)
- Parallel headless renders shared one `python3 -m http.server` (listen backlog 5) and intermittently failed with "Failed to fetch dynamically imported module". → A render tool serves its own files on a free port (`node:http`, port 0). Build its root with `fileURLToPath(new URL(...))`: `URL.pathname` keeps `%20` for the spaces in this repo's path. (2026-09-27)

- Painted became the default look and three browser tools were pinned to clay, but `tools/qa.mjs` was missed: after the switch it failed 15 of 17 cases with `window.view.pieces is not iterable`, and its Ogre cases still expected rules and dialogs that had changed. → When a default changes (look, rule mode, UI flow), grep every tool for what depended on it (`grep -l "window.view" tools/*.mjs`) and run each one, not only those you remember. (2026-09-27)
- A browser check slept 450 ms for a 400 ms camera tween. The renderer clamps each frame step to 50 ms and headless WebGL draws ~21 fps, so animation time runs slower than wall time and the drag aimed at a moving camera. → Never wait a fixed time for an animation in a browser check; wait on its state (`window.view.tweens.list.length === 0`). (2026-09-27)
- The same trap, twice more (2026-09-27): a clay skip check timed from tap to settled board read 667 ms (headless WebGL rebuilt the figure), though the skip itself was instant; and the painted phone screenshot waited only for the canvas size, so it showed "Loading pieces…". → Assert the state change itself (`view.moving` false right after the tap), and take screenshots only after `view.ready()`. Time a behaviour only against its own control in the same run (Normal vs Fast).
- A colour-only generated revision can also change framing and clip equipment. → Recheck alpha gutters, complete weapon edges and source registration after every revision, even when the prompt locks geometry. The Paladin required a separate framing correction after recolouring. (2026-09-26)
- Board feedback can exist in the DOM and still be invisible below a tall board. → Responsive verification must check the actual status rectangle after board interaction, not only horizontal overflow or successful clicks. Zero-action selections must not instruct the player to choose a nonexistent marker. (2026-09-26)
- Graphics animation export (2026-09-21): Blender's broad action export included the other character's compatible action and kept a nonzero start time. → Export only the selected rig's active action, shift its time to zero, and verify one clip per asset, duration, first/last pose and actual skinned foot contact. A convincing static preview does not establish correct animation playback or contour deformation.

- Graphics feature correction (2026-09-21): identifying colours belong to specific modeled parts (Guard shoulder plates, Archer hood), and broad smoothing can distort those parts. → Fit masks to each feature's actual orientation and outline, inspect neutral source geometry from multiple angles, preserve crease edges/corner normals, and use less smoothing on structural forms. The Archer's diagonal head needs a local-frame hood mask; passing render tests alone does not validate art placement.

- Graphics cleanup correction (2026-09-21): tidier detail means simplifying/smoothing selected sculpt features as well as cleaning colour boundaries. → Keep the approved pixel resolution fixed; reduce small surface clutter while protecting the forms that identify the character, and judge both actual play size and a close view.

- Graphics detail correction (2026-09-21): the owner's request for more pixels meant richer figures closer to the source art, not resolution alone. → Treat model/paint detail and rendering resolution as separate changes; increasing samples does not fulfill a request to recover character detail.

- Graphics feedback (2026-09-21): preserving a detailed sculpt by merely changing its renderer can preserve the very detail density that makes it unreadable. → Compare an intentionally authored low-resolution model against the original, using the same recognizable design and judging at actual game size; do not assume higher fidelity is the preferred style.

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

## 2026-09-16 — never print a process environment
- **Mistake:** `pgrep -fl vite` during Phase 6 printed the whole environment of the matching process,
  which contained a `GITHUB_TOKEN`. The token is now in this session's tool output.
- **Rule:** to find a process, print only the command line (`ps -o pid=,command= -p <pid>` or
  `pgrep -f pattern`), never `ps aux`/`pgrep -fl` output that may carry the environment; rotate any
  secret that was printed. A shell that launches a dev server inherits the whole session environment.
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

## 2026-09-17 — one-off action powers drain decisiveness (measured twice)
- **What happened:** both readings of Strike (Flame A) were built and measured at depth 3 and depth 4:
  the reading as written (queen-move, decisive −15.5 ± 3.2 then −20.2 ± 5.8) and the card game's
  verb (capture without moving, −10.1 ± 3.4 then −29.5 ± 7.3, draws +31.5 ± 7.4). Death Touch's
  second reading failed the same way (−6.0 ± 2.7, −6.3 ± 6.0). Every one was used near its maximum
  (Death Touch aside), and every one lowered the decisive share.
- **Pattern:** a power that gives each side one *forced action* (a free capture, a free displacement)
  is spent on the most valuable piece on the board, the material balance collapses, and the ending
  is thin and drawn. Games get **shorter and less decisive at the same time** — plies −27 to −38.
  "A surprise per game" is not what a decisive game is made of.
- **Rule:** before building a power with charges, predict its decisive-share direction from its shape:
  powers that *add* material or *anchor* it (drops, walls, shields) may be fine; powers that let a
  side remove material for free are draw engines until measured otherwise. Build the A/B at depth 3
  and a depth-4 arm in the same campaign, and shelve on a negative depth-4 interval (Strike's shape
  was cheap to build, so this cost one evening, not a day).

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

## Reconstructed Ogre integration (2026-09-22)
- Blender can bake parent normalization into exported skinned vertex positions. Export the rig in source coordinates, then add the board transform to its parent node; validate against the accepted GLB. Texture-space feature selection and clay relief depend on those bind coordinates.
- A spatial arm mask must exclude spread toes and skirt corners. Preserve short reconstructed knee/hand forms with a restrained motion suited to the mesh; measure actual skinned edges and rigid-hand distances, not bone paths alone.
- A study that replaces renderer-owned figures must disable the renderer's asynchronous model load. Otherwise a late resolved asset draws a second model and looks like broken surface shading. Rebuild/undo must also invalidate pending movement callbacks.

## Playable clay picking and layout — 2026-09-22
- Three.js raycasts invisible label sprites. A hidden letter chip above a king/queen intercepted the pawn square even after the sculpt fitted the square; skip invisible ray hits and test all eight initial pawn-square centres with real pointer input. Reducing the visible model alone did not repair the interaction.
- A responsive canvas inside CSS grid needs an explicit `minmax(0, 1fr)` column and `min-width: 0`; otherwise resizing from a wide viewport can preserve an oversized intrinsic canvas column. Keep the mobile HUD above the board, and verify both resize and actual element bounds, not just document overflow.

## Clay facing and fixed presentation — 2026-09-22
- The accepted clay sculpts face local +Z. White advances toward world −Z, so its resting parent rotates by π; Black's stays at zero. Do not reuse the legacy voxel orientation. Movement/contact turns are relative to that parent and must reset after movement and undo. Check both armies visually as well as their transforms.
- The owner selected handmade clay at the study's 0.5 px double-detail setting for the playable game, with no rendering choices. Remove obsolete UI and URL/save overrides instead of merely changing the default; keep experimental presentation controls in the separate graphics study. Verify actual render-target dimensions and material state, not just a preset label.

## Cursor recovery — 2026-09-24
- A completed agent turn is not a completed product. Reconcile child registries, transcripts, saved checks and the final files before trusting a parent's checkboxes; piped test output can hide failure behind a successful shell status. The recovery of `0213b442` found all 887 children complete, but no final combined suite or production build.
- Identify the accepted branch before integrating recovered changes. Cursor's old checkout lacked the approved clay presentation and already-proven repetition repair; its edited guide claimed a pool change that never reached the named worktree. Preserve the accepted implementation and port useful changes selectively.
- Prefer a semantic regression over hundreds of shallow score/move-order locks. A failed prediction may expose an incorrect fixture, and a later terminal fix may correctly obsolete its expected score. Keep exploratory datasets tied to their source/rules, separating adjudications and unfinished caps from completed outcomes. See `docs/cursor-recovery/2026-09-24-0213b442/README.md` for the evidence.

## Selective adoption — 2026-09-24
- A new default invalidates a test's implicit rules, not necessarily its fixture. Keep historical repel regressions explicit while separately checking the new push default; preserve the accepted whole-history repetition repair.
- Search must agree with game endings before ordinary evaluation, including at the capture horizon. Keep checkmate ahead of a fifty-move draw and honor disabled draw rules and a live Strike power; share the material-draw predicate instead of duplicating exceptions.
- Mobile piece guidance in an auto-sized header moved the board under an active touch. Put changing explanations in the scrolling panel and assert stable board bounds across a real touch gesture. Wait for the camera flip to finish before sampling automation coordinates.

## 2D artwork direction — 2026-09-25
- Owner wants army colour dominant across each figure, with limited recognition-colour accents. Coloured bases alone do not satisfy that. Keep full feet, hems and equipment; no portrait-style bottom cutoff. Original King Down art is reference input for derived poses, variations and new pieces.
- Display sprite-sheet frames with preserved aspect ratio when both width and height are constrained. Check actual phone layout; a fixed-height portrait with a clamped width can silently squeeze the figure.

## Continuous 2D character motion — 2026-09-25
- Additional independently generated poses do not solve proportion and registration drift. For smooth character motion, use one consistent set of painted parts and interpolate joint transforms; keep frame drawings for changes the rig cannot represent. Ground contacts and hand-to-prop attachments must remain fixed through the action.

## Archer anatomy correction — 2026-09-25
- Connected joints are not enough for a convincing painted rig. Check rest, full draw and intermediate poses for anatomy; overlapping neck tabs can double the visible neck, and a mathematically connected arm can still bend in the wrong plane. Separate hands from forearms so wrist rotation and projected arm length do not stretch the fingers.
- For an authored elbow path, verify that its projected segments cannot collapse while crossing the shoulder. Aim should rotate the arm targets together, preserving prop attachments and reach.

## Rejected Archer rig — 2026-09-25
- Owner found the anatomy correction much worse. Do not treat finite joint coordinates, attached hands or passing motion tests as visual success. Compare intermediate silhouettes with coherent source drawings; stop patching a failed art/rig approach.
- Stretching separately generated arm bitmaps to fit hand-authored elbow paths is not a substitute for correct perspective, layered artwork, mesh weights and alternate pose drawings. A professional runtime does not make poor source art anatomically correct.
- Attachment constraints have phases: the drawing hand follows the string during draw, then releases it and follows through independently. The prior test asserting attachment throughout release encoded an animation error.

## 2026-09-26 — coherent geometry is not finished character art
- The original static Archer sculpt has body, costume and weapons fused into one surface. Spatial arm masks tore neighbouring geometry during a large pose change. → Do not promote static/scanned sculpts to an animation rig by region heuristics; start with suitable topology and authored weights or retopologize deliberately.
- A height-based crop of an unposed human removed fingertips that happened to sit below the cutoff. → Preserve complete limbs using semantic mesh/weight membership, and inspect the rendered hands close up. Valid bones alone cannot catch missing surfaces.
- A body rendered successfully from Blender still looked stiff and unlike the preferred painted artwork. → Treat source validity, anatomical/pose quality, style match and owner acceptance as separate gates. Do not launch frame production just because a still renders.

## 2026-09-26 — preserve the Archer's original weapon and 2D direction
- The owner rejected the 3D test and replaced the introduced longbow with the original wrist bow. → Preserve meaningful source equipment before designing movement: the wrist bow removes the unnecessary string-drawing pose and its difficult arm assembly. Current direction is illustrated 2D, with natural shoulder/elbow/wrist proportions.
- A coherent complete pose plus restrained projectile/recoil effects can serve this shot study without rebuilding limbs. → Keep the illustration's aspect ratio and anatomy fixed; describe this accurately as one pose with effects, not a full articulated animation or multiple drawn frames.

## 2026-09-26 — preserve the animation goal when simplifying the weapon
- Replacing the longbow with a wrist bow did not remove the requested cursor-following arm movement. Whole-sprite recoil and a projectile were insufficient. → Recheck the original interaction requirement after changing the visual method; report which part actually moves.
- A small shoulder mesh can preserve a coherent painted figure while the forearm, hand and attached weapon rotate together. Keep the aim arc within the drawing's usable projection, check the shoulder at both limits, and test mesh orientation across the full arc including recoil. Do not infer visual acceptance from geometric invariants.

## 2026-09-26 — rigid weapons and source-sheet registration
- Deforming a complete already-aimed figure by image height can bend a long weapon when its lowered tip enters the stance region. → Apply weight shift to the body, then draw the aimed arm/weapon with one rigid thrust translation. Check actual low-angle contact as well as neutral motion.
- Generated army pairs can drift from equal cell boundaries. → Inspect the alpha gutter and calibrate each army's source window, pivot and display origin; preserve complete shield edges and tips without destructive recropping.

## 2026-09-26 — aiming drawings on a real board
- A convincing sideways aiming study does not supply every facing a top-down board needs. → Keep the authored angle limits explicit. Test actual opponents and contact coordinates; use additional facing art before claiming fully directional motion. The board trial's steep-shot encounter panel is an experiment, not owner approval of that presentation.
- Equipment can extend beyond a figure's occupied square. → Keep input tied to square occupancy, with visual selection/target markers, rather than letting overlapping sprite bounds capture a neighbouring piece's clicks.

## 2026-09-26 — adding the painted Ogre
- A destination square does not uniquely identify an Ogre action: the same enemy can be captured or pushed. → Preserve both engine moves in the presentation, show an explicit choice, and verify different piece counts and final squares. Do not collapse actions into a map that keeps only one move per target.
- A coherent braced pose can carry a restrained shove with one rigid upper-body weight shift and planted feet. → Describe it as that; it does not provide independent arm articulation or a walking cycle. Preserve the hands rather than stretching them to exaggerate the action.

## 2026-09-26 — painted Knight identity and airborne presentation
- Inspect the original character before interpreting a chess name: King Down's Knight is a foot soldier with a horse-head helmet, spear and cape, not a horse or mounted rider.
- Recognition colour must not take over a large costume surface. The first Knight generation's burgundy cape violated the army-colour direction; recolour its main area to the army and retain only a narrow accent.
- Separate an airborne figure's lift from its board position so its shadow stays on the ground. Check the entire weapon at board edges, and maintain relative character scale in motion previews. Whole-figure travel is not an articulated leg cycle.

## 2026-09-26 — Knight anticipation
- Owner asked for knees to bend before jumping. A whole-sprite tilt was not enough. → Add an actual planted crouch in the shared character renderer, used by both the study and board; make the preparatory phase visible before travel begins and flex again at landing.
- Keep a long grounded spear and its grip out of the leg deformation. Use bounded leg guides and inspect both army registrations; mathematical bone lengths and positive triangles supplement, not replace, visual review.

## 2026-09-26 — reviewing parallel painted pieces
- Equal-cell generation instructions do not prove the figures fit equal cells. The Rook’s fist crossed x=768; resizing the entire sheet did not repair that boundary. → Preserve the generated PNG and register actual complete source windows (the accepted Rook gutter is x=780).
- A planted-motion test must assert actual opaque boot/contact points, not just a bounded curve or a translated anchor. The Guard’s soles ended above the original deformation cutoff; parent review moved the cutoff above the boots. A rigid Rook rock keeps one stone contact fixed and honestly lifts the rear foot.
- Canvas aspect ratio and overlays are part of artwork quality. Preserve source proportions and draw board selection borders behind tall figures so they cannot appear to sever a neck or helmet.
## Full-cast sculpt and animation work (2026-09-21)
- Label coordinate units at the profile boundary. Joint landmarks are world units after scaling to the target figure height; paint volumes use a height fraction only on their vertical axis. A unit-height sketch is not a world-space rig.
- Triangulate non-planar source faces before cutting paint boundaries. Keep the surface-area assertion; do not loosen it to hide incorrect tessellation. Check silhouette bounds after reduction: the Paladin lost extremities under collapse reduction and needs its usable source density preserved.
- No-UV sculpt exports need deliberate texture coordinates before assigning bump/roughness maps. Keep material experiments scoped to the intended comparison.
- Test a brief animation impulse by advancing known timesteps on the actual model; wall-clock screenshot delays can miss the entire transient under software-renderer load. Verify compression, rebound across rest and exact reset, and keep floor-contact appendages out of generic angular spring motion.

## M1 local-agent supervision (2026-09-21)
- Owner stopped delegation on 2026-09-22 because coordination and monitoring cost outweighed the benefit. Work directly; the observations below are historical. See `docs/DELEGATION.md` for measured capabilities and compact prompts if the owner explicitly authorizes future delegation. Keep suitability evidence separate from permission.
- A new node-bound test that also passes the original engine does not prove a stall repair. Compare the exact legal case before/after and require a failing baseline; retain a useful negative result without accepting an unsupported fix. Head-to-head budgets count each physical game once, even though both evaluators participate, and a depth-only spec can imply an infinite time budget.
- A passing read/write/tool smoke check does not establish sustained progress. The first broad campaign round spent 33 minutes reading and compacting, with no code changes and stale status. Supervision must compare actual diffs, test evidence and game counts, not just live processes or model activity.
- Give the local agent one concrete implementation deliverable per fresh round, exact file locations and checkable acceptance criteria. Avoid loading the entire tracker, lessons and campaign history repeatedly. Reduce context when memory pressure rises; the initial 64k Muse run grew to 28 GB with 6.1 GB system swap. A restart is not verified recovery until useful artifacts appear.
- Pass OpenCode an explicit --dir on headless launches. The first smoke used the home directory despite the wrapper subprocess cwd; confirm the stored session directory before permitting source edits.
- A narrow task prompt alone cannot prevent context churn when standing instructions load a large historical tracker. On M1, a 64 KB TASKS read pushed the 32k window past 30k tokens, compaction restarted the same reads, and no edits appeared in 19 minutes. Preserve full documents with hashes, provide bounded task-specific startup summaries in the isolated copy, and verify recovery by actual source/test artifacts rather than process liveness.

- An agent’s report can claim fixture coherence or a printed explanation that its files do not contain. Inspect exact CLI columns and source artifacts; derive synthetic expectations independently. A failing test caused by an incorrect fixture is not a valid negative control for the intended arithmetic repair. Preserve the original handoff when supervisor finishing edits are needed.

- Short startup summaries alone did not stop Qwen from rereading supporting code/reports: the paired-validation round made 29 read/status calls, compacted twice and produced no edits. Split deliverables further and constrain discovery in the task-local runner; verify recovery by a useful artifact, since accepting the configuration proves only configuration validity.

- Passing model-written tests is not an independent acceptance criterion. Gemma passed all 15 of its tests while reporting a zero effect with zero matched games and omitting uncertainty qualifications. Compare against the predeclared behavior and audit sparse/invalid inputs; preserve raw model candidates separately from supervisor repairs. M1’s prescribed execution passed exact repeat/replay audits, supporting compute delegation without autonomous model management.

## 2026-09-22 — a saved evaluator label does not freeze its other parameters
The stopped campaign proposed the repository's old `sim/nnue/eval-linear.json` against a residual arm copied from today's evaluator. The linear file still priced Archer at 337, Paladin at 326 and Beast at 308, versus current 505/408/434. That confounds evaluator choice with material values. The direct review caught it before main studies; 72 operational trial games remain throughput-only. Pin both full parameter sets from the same current snapshot and assert every field except the intended evaluator selection is identical. A real network blob and a valid source hash alone do not prove a controlled comparison.

## 2026-09-22 — fairy pawn movement invalidates orthodox repetition bounds
An Ogre can shove a pawn backward; a Maester can swap it. Pawn moves reset the fifty-move clock but need not make older board positions unreachable. The legal cycle `Od3>d4-d5`, `d5-d4` in `7k/8/8/8/3p4/2BOK3/8/8 w - - 0 1` repeats with the clock at zero. Search must check full-path/history repetition, including capture/check continuations; the halfmove clock is only for the fifty-move rule. Require a real baseline-failing regression, and distinguish fixing this proven failure from reconstructing an old warm-state stall.

## 2026-09-22 — test counterplay before the observed advantage forms
The 24 strongest selected Paladin opening examples still scored White +505 to +1,215 at deeper searches from their late positions. That did not show an unavoidable opening flaw. Replaying from Black’s first reply, replacing the remaining random opening plies with 200/400 ms search for both players, avoided the original large advantage in all 24 short branches. Several exposed Paladins could simply be captured. Preserve the same selected cases, source prefix and finite horizon; distinguish late-position rescue from earlier counterplay. Do not weaken a rule from extreme examples created partly by random opening decisions, and never label short unfinished branches as draws or forced outcomes.

## Playable clay picking and layout — 2026-09-22
- Three.js raycasts invisible label sprites. A hidden letter chip above a king/queen intercepted the pawn square even after the sculpt fitted the square; skip invisible ray hits and test all eight initial pawn-square centres with real pointer input. Reducing the visible model alone did not repair the interaction.
- A responsive canvas inside CSS grid needs an explicit `minmax(0, 1fr)` column and `min-width: 0`; otherwise resizing from a wide viewport can preserve an oversized intrinsic canvas column. Keep the mobile HUD above the board, and verify both resize and actual element bounds, not just document overflow.

## Clay facing and fixed presentation — 2026-09-22
- The accepted clay sculpts face local +Z. White advances toward world −Z, so its resting parent rotates by π; Black's stays at zero. Do not reuse the legacy voxel orientation. Movement/contact turns are relative to that parent and must reset after movement and undo. Check both armies visually as well as their transforms.
- The owner selected handmade clay at the study's 0.5 px double-detail setting for the playable game, with no rendering choices. Remove obsolete UI and URL/save overrides instead of merely changing the default; keep experimental presentation controls in the separate graphics study. Verify actual render-target dimensions and material state, not just a preset label.

## 2026-10-03 — a balance round measures only the armies it drew
- **What happened:** round 12 re-ran round 11's exact rules and engine with a new seed. Mercy went
  60.4 → 48.7 and Leap 46.2 → 57.6 against intervals of ±5.5 per round. Mercy had been "the one
  power to watch" on the strength of single rounds.
- **Cause:** `src/sim/tournament.ts` draws one army per pair slot (`armies[p]`) and every matchup
  reuses it, so 12 pairs = 12 armies. A power's strength depends on the army, and the per-game
  interval leaves the army-to-army variation out. Resampling the armies gives ±4–10 per power in
  one round. Pair-level and game-level intervals agree (ratio 0.99): the colour-swapped pairs are
  not the problem.
- **Rules:** (1) judge a power on pooled rounds with different seeds, or on many armies, not on one
  round of 12; new rounds use `--armies perPair` (a fresh army for every pair); (2) read the
  "±95% armies" columns of `report`, not the per-game ones; a power is off centre only on the
  report's "all tested together" line — twelve separate 95% intervals flag a power by chance in
  about half of all rounds, so the per-power list is a screen of candidates; and with 12–24 armies
  intervals need t quantiles, not 1.96 (a first reading of rounds 11–12 called Haste, then Flight and
  Darkness, "clearly off centre"; calibrated, Haste is borderline and the rest are candidates);
  (3) before changing a power for being high or low, check it on fresh armies.
- A pooled report grouped games by `pairId`, which restarts at 0 in every round, so rounds with
  different layouts would have merged unrelated pairs (found by review before round 13). → Key
  anything per round (`poolRounds`) before pooling rounds; test a pool of two different layouts.

