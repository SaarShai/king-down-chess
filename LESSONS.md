# Lessons

Reusable corrections. Pattern → rule.

Read the section Always. Then read the Index, and open a topic file only when a heading matches the task. Each lesson is under its dated heading in one topic file of `docs/lessons/`. Add a new lesson to its topic file and its entry to the Index.

## Always

### 2026-09-16 — never print a process environment
- **Mistake:** `pgrep -fl vite` during Phase 6 printed the whole environment of the matching process,
  which contained a `GITHUB_TOKEN`. The token is now in this session's tool output.
- **Rule:** to find a process, print only the command line (`ps -o pid=,command= -p <pid>` or
  `pgrep -f pattern`), never `ps aux`/`pgrep -fl` output that may carry the environment; rotate any
  secret that was printed. A shell that launches a dev server inherits the whole session environment.

## Index

### Engine and tests

- [2026-10-03 — one mark slot per side for two-sided powers](docs/lessons/engine-and-tests.md)
- [2026-10-03 — the hash's high half came from the same stream](docs/lessons/engine-and-tests.md)
- [2026-10-02 — helpers outside the engine after a new move kind](docs/lessons/engine-and-tests.md)
- [2026-10-02 — the random-army pool switched the net off](docs/lessons/engine-and-tests.md)
- [2026-10-02 — closures in hot paths under tsx `keepNames`](docs/lessons/engine-and-tests.md)
- [2026-10-02 — sim workers under Node 22 and a hung `npm test`](docs/lessons/engine-and-tests.md)
- [Merging two code paths behind a flag changed the one I was not touching (2026-09-14)](docs/lessons/engine-and-tests.md)
- [Selective adoption — 2026-09-24](docs/lessons/engine-and-tests.md)
- [2026-09-22 — fairy pawn movement invalidates orthodox repetition bounds](docs/lessons/engine-and-tests.md)

### Runs

- [2026-10-02 — random opening moves spent the kings' powers](docs/lessons/runs.md)
- [2026-09-13 — balance-lab traps (from the stage-2 run)](docs/lessons/runs.md)
- [2026-09-13 — batch 3](docs/lessons/runs.md)
- [2026-09-13 — a recorded `rules: {}` is not "today's rules"](docs/lessons/runs.md)
- [A resumed control run silently mixes pools (2026-09-14)](docs/lessons/runs.md)
- [A metric that reads the mover off ply parity breaks under a rule that changes whose turn it is (2026-09-14)](docs/lessons/runs.md)
- [Editing the engine while a run launches plays a different game (2026-09-14)](docs/lessons/runs.md)
- [2026-09-17 — one-off action powers drain decisiveness (measured twice)](docs/lessons/runs.md)
- [2026-09-22 — a saved evaluator label does not freeze its other parameters](docs/lessons/runs.md)
- [2026-09-22 — test counterplay before the observed advantage forms](docs/lessons/runs.md)
- [2026-10-03 — a balance round measures only the armies it drew](docs/lessons/runs.md)

### Jev

- [2026-09-16 — TypeSafe judgments (standing rule)](docs/lessons/jev.md)
- [2026-09-17 — Jev cannot label game narratives from features (instrument failed 6/6)](docs/lessons/jev.md)
- [2026-09-16 — keep the decision out of the state](docs/lessons/jev.md)
- [2026-09-17 — "game-breaking" is measurable, not judicable](docs/lessons/jev.md)
- [2026-09-21 — claim checks: the state must say what a sign means; one run is not enough](docs/lessons/jev.md)

### Art and motion

- [2026-10-04 — check a vector from a PDF against the PDF's own render](docs/lessons/art-and-motion.md)
- [2026-10-04 — measure an effect anchor through the figure's transform](docs/lessons/art-and-motion.md)
- [2026-10-04 — record the painted scene with a fake frame clock](docs/lessons/art-and-motion.md)
- [2026-10-02 — a recolour re-encoded the untouched half of a sheet](docs/lessons/art-and-motion.md)
- [2026-09-27 — the trailer sound copied the picture's timing](docs/lessons/art-and-motion.md)
- [2026-09-27 — motion blur opens the shutter on the frame time](docs/lessons/art-and-motion.md)
- [2026-09-27 — trailer mastering: one linear gain, then a limiter](docs/lessons/art-and-motion.md)
- [2026-09-27 — parallel renders shared one Python server](docs/lessons/art-and-motion.md)
- [2026-09-26 — a colour-only revision changed the framing](docs/lessons/art-and-motion.md)
- [2026-09-21 — graphics animation export](docs/lessons/art-and-motion.md)
- [2026-09-21 — graphics feature correction](docs/lessons/art-and-motion.md)
- [2026-09-21 — graphics cleanup correction](docs/lessons/art-and-motion.md)
- [2026-09-21 — graphics detail correction](docs/lessons/art-and-motion.md)
- [2026-09-21 — graphics feedback: an authored low-resolution model](docs/lessons/art-and-motion.md)
- [2026-09-16 — voxelized sculpts at 36 voxels](docs/lessons/art-and-motion.md)
- [Reconstructed Ogre integration (2026-09-22)](docs/lessons/art-and-motion.md)
- [Clay facing and fixed presentation — 2026-09-22](docs/lessons/art-and-motion.md)
- [2D artwork direction — 2026-09-25](docs/lessons/art-and-motion.md)
- [Continuous 2D character motion — 2026-09-25](docs/lessons/art-and-motion.md)
- [Archer anatomy correction — 2026-09-25](docs/lessons/art-and-motion.md)
- [Rejected Archer rig — 2026-09-25](docs/lessons/art-and-motion.md)
- [2026-09-26 — coherent geometry is not finished character art](docs/lessons/art-and-motion.md)
- [2026-09-26 — preserve the Archer's original weapon and 2D direction](docs/lessons/art-and-motion.md)
- [2026-09-26 — preserve the animation goal when simplifying the weapon](docs/lessons/art-and-motion.md)
- [2026-09-26 — rigid weapons and source-sheet registration](docs/lessons/art-and-motion.md)
- [2026-09-26 — aiming drawings on a real board](docs/lessons/art-and-motion.md)
- [2026-09-26 — adding the painted Ogre](docs/lessons/art-and-motion.md)
- [2026-09-26 — painted Knight identity and airborne presentation](docs/lessons/art-and-motion.md)
- [2026-09-26 — Knight anticipation](docs/lessons/art-and-motion.md)
- [2026-09-26 — reviewing parallel painted pieces](docs/lessons/art-and-motion.md)
- [Full-cast sculpt and animation work (2026-09-21)](docs/lessons/art-and-motion.md)

### Browser checks and UI

- [2026-10-10 — a render compare against one render of main lists the unstable states as changes](docs/lessons/browser-checks-and-ui.md)
- [2026-10-02 — the cloud Chromium build for Playwright](docs/lessons/browser-checks-and-ui.md)
- [2026-10-02 — a timing check failed for reasons outside the code](docs/lessons/browser-checks-and-ui.md)
- [2026-10-02 — "byte-identical" means the same environment](docs/lessons/browser-checks-and-ui.md)
- [2026-10-02 — a service worker hid the load cost](docs/lessons/browser-checks-and-ui.md)
- [2026-10-02 — take a tool baseline from a clean worktree](docs/lessons/browser-checks-and-ui.md)
- [2026-09-29 — a lesson saved its position over the match](docs/lessons/browser-checks-and-ui.md)
- [2026-09-27 — a moved control broke the selectors of two tools](docs/lessons/browser-checks-and-ui.md)
- [2026-09-27 — a changed default broke `tools/qa.mjs`](docs/lessons/browser-checks-and-ui.md)
- [2026-09-27 — a fixed sleep for a camera tween](docs/lessons/browser-checks-and-ui.md)
- [2026-09-27 — the same trap, twice more: assert the state change](docs/lessons/browser-checks-and-ui.md)
- [2026-09-26 — board feedback hidden below a tall board](docs/lessons/browser-checks-and-ui.md)
- [A click on the 3D board can land on the piece in front of the square (2026-09-14)](docs/lessons/browser-checks-and-ui.md)
- [Playable clay picking and layout — 2026-09-22](docs/lessons/browser-checks-and-ui.md)

### Agents and tools

- [2026-10-10 — two `npm test` runs at once trip the 5-second test limits](docs/lessons/agents-and-tools.md)
- [2026-10-10 — one independent review a PR found a real item every time](docs/lessons/agents-and-tools.md)
- [2026-10-10 — a push from the main checkout fails while another session edits there](docs/lessons/agents-and-tools.md)
- [2026-10-02 — a `pgrep -f` wait loop matched its own shell](docs/lessons/agents-and-tools.md)
- [2026-10-02 — a short commit SHA fails as a session source](docs/lessons/agents-and-tools.md)
- [2026-10-02 — build main beside a branch in a worktree](docs/lessons/agents-and-tools.md)
- [2026-09-16 — Google Drive `read_file_content` returns `{}`](docs/lessons/agents-and-tools.md)
- [2026-09-16 — macOS `base64` takes no positional file](docs/lessons/agents-and-tools.md)
- [2026-09-16 — `gdown --folder` has no `--remaining-ok` flag](docs/lessons/agents-and-tools.md)
- [2026-09-16 — image-only PDFs come back as garbage text](docs/lessons/agents-and-tools.md)
- [2026-09-16 — the Artifact `files` list form](docs/lessons/agents-and-tools.md)
- [2026-09-16 — `navigate` in `browser_batch` needs `tabId`](docs/lessons/agents-and-tools.md)
- [2026-09-13 — in-place edits with `|` in the text](docs/lessons/agents-and-tools.md)
- [2026-09-13 — session rate limit killed 8 parallel agents](docs/lessons/agents-and-tools.md)
- [Measuring without adding a file to the repo (2026-09-14)](docs/lessons/agents-and-tools.md)
- [Cursor recovery — 2026-09-24](docs/lessons/agents-and-tools.md)
- [M1 local-agent supervision (2026-09-21)](docs/lessons/agents-and-tools.md)
