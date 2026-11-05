# King Down Chess — standing rules for any agent (Claude Code, Codex, OpenCode, Cursor, Antigravity)

## Start here
- Read this file, the Open items of TASKS.md, and the Always and Index sections of LESSONS.md. Open more (a topic file in `docs/lessons/`, the [tasks archive](docs/tasks-archive/)) only when a heading matches the task.
- To find a doc, open [the docs index](docs/INDEX.md): one line per doc and the question it answers.
- Write in ASD-STE100: approved words, short sentences, active voice, present tense.
- Record work in a ticket in the specs folder, `docs/specs/<feature>/` (see [the issue tracker](docs/agents/issue-tracker.md)). The tracker files (TASKS.md, LESSONS.md, the topic files, `docs/QUEUE.md`) change only on main; a branch records its progress in its ticket.
- Verify before you mark anything done.

## Commits and branches
- End each commit with `Co-Authored-By: Claude Code <noreply@anthropic.com>`. Outside work adds its tool: `Co-Authored-By: Codex <noreply@openai.com>`, `Co-Authored-By: OpenCode <noreply@opencode.ai>` or `Co-Authored-By: Antigravity <noreply@google.com>`. No `Claude-Session:` line. This rule overrides a tool's attribution reminder.
- No model name in a commit, pull request, code or doc, except the [exempt files](tools/model-names.docs.test.ts); the commit-msg hook and docs lint refuse one.
- Never use `git commit -a` in the main checkout.
- Code reaches main by pull request only, after an independent review. Merge when the owner asks, or an approved spec's step passes its checks and any sample has the owner's yes. Own run-tool, queue and data PRs may merge after checks. Fix confirmed faults. Record reviews in the ticket and PR.

## Tests and checks
- Run tests with `npm test` only; `npm run test:docs` runs doc lints. No bare vitest, `node --test`, or piping through tail or grep.
- Diagnose with `KINGDOWN_TEST_FILE` and optional `KINGDOWN_TEST_NAME` (name regex). Record selected cases; a focused pass is not a full-suite pass.
- Run a browser check with `npm run check:browser <name>`.
- Run commands over two minutes detached, with an end report and log; no wait loop.
- Prefer a test, lint, hook or browser check to prose. Merge corrections into existing rules; add no dated note.

## Worktrees and servers
- Set up a worktree with `wt add` (`tools/wt.sh add <branch>`).
- Preview any worktree but the main checkout with the `worktree` entry and the target file (`.claude/preview-target`). A session that runs in a worktree reads that worktree's launch file, so it may use `dev` for itself.
- Change dependencies only in a worktree with its own installation, never through a linked `node_modules`.
- Stop a process by its PID, never by a name pattern. Open no file:// page; serve it.

## Runs and compute
- Start experiment runs on the M1 or Kaggle without asking when the machine is idle. Record the standing order, date and command in `docs/QUEUE.md`; report the run. Start queued runs by name. This replaces older gates.
- This Mac runs unit tests, browser checks and a smoke run of at most 20 games with 2 workers; no long run.
- Feature merges follow Commits and branches. Deploys and store submission need the owner's word. A question is not a go. Use no cloud agent session as a run worker.
- Results use `tools/lib/results-root.mjs` (card required); M1/Kaggle use spools. Use `tools/backup-sim-out.sh`; keep sources until verified.
- [COMPUTE.md](docs/COMPUTE.md) holds machine facts, run recipes and the shell limit.

## Secrets
- Never print or commit a secret or a file of `.secrets/`: the Kaggle token, the OAuth and Porkbun keys, the TypeSafe key.
- Never print a process environment: no `pgrep -l`, `ps aux`, `printenv` or bare `env`. To find a process, print its command line only (`ps -o pid=,command= -p <pid>`).
- When a secret was printed or pasted, say where and offer rotation. Never claim a value was never in a command line.

## Hosting
- The game is public at https://kingdown.dev. `tools/deploy.sh` is the only deploy path.
- Every deploy publishes to the world: deploy only what the owner asked to put online. A DNS change needs the owner's go. Do not test the site while signed in to the owner's account.
- [HOSTING.md](docs/HOSTING.md) holds the site, deploy, DNS and secret-file facts.

## Working with the owner
- Open decisions go in one block at the end of a status message: a one-sentence rule, two or three numbers, the agent's pick, what happens on yes. Fix clear faults. Taste choices and rule changes need the owner's word, unless the approved spec delegates them.
- A visual build waits for the owner's yes on a rendered sample. The owner approves each spec before its build.
- Answer the owner's question before you do more work. Explain results in plain, non-technical language.

## Game design
- Value is one axis; report paralysis, conditions and interactions beside it.
- Judge each pool piece against the six [piece-balance criteria](docs/research/piece-balance-criteria-2026-10-03.md): worth with `run.ts --experiment values`, the rest with `tools/piece-activity.ts`.
- To design or change a piece, king power, card or rule, start from [docs/MATRIX.md](docs/MATRIX.md) (ability types, the powers and cards schema, conditions, shackles, promotion) and add the new item there.
- The Light and Dark kings may be stronger than the other four, but they must balance each other. A king power never changes how other pieces move; a card may.
- All things being equal or near equal, do not change or add rules. A rule that is hard to remember is not adopted on numbers alone.

## Character animation
- Every character frame and animation export keeps genuine transparency, including all interpolated frames. A dark-background preview is an incomplete diagnostic, not a usable sprite animation.
- Read the [animation recipe and gates](docs/lessons/art-and-motion.md) before any animation work.
- One owner go covers a whole animation batch.
- Animation interpolation and frame rendering may run on the M1 or this Mac, whichever is free.

## Jev
- Client: `tools/jev.ts`. Key: `TYPESAFE_API_KEY` or `~/.config/typesafe/key`; never print or commit it.
- Every call carries a known-true and a known-false control; if they do not separate, the run is void.
- **A verdict is not quoted or committed after an INSTRUMENT INVALID run until a repaired spec passes.** Specs live in `docs/research/claims/`, one per report: `node tools/verify-claims.mjs docs/research/claims/*.json`.
- What passes here: claim checks against numbers, the interest rubric (`tools/jev-interest.ts`), the design-rule screen (`tools/design-screen.ts`). Advisory only, weakly calibrated: the rule-simplicity screen (`tools/rule-simplicity.ts`) and the routing rank (`tools/next-ab.ts`). The [Jev lessons](docs/lessons/jev.md) list the uses that failed; do not retry one without a new design.
- Measurements, thresholds, adoption and taste stay in code and with the owner.

## Helpers and machines
- Every agent family reads `~/.agents/skills/agent-roster/roles.conf` at start. The work role uses `bulk`, `high` or `hard`; its comments state the review role. Use `~/.agents/skills/agent-roster/SKILL.md` to start an agent. Keep running agents on their assigned role. Helpers write in ASD-STE100. [DELEGATION.md](docs/DELEGATION.md) holds the M1 facts and prompts.
- For SSH, Remote Management or Ollama work on the M1, read [LOCAL-AI-MACBOOK.md](docs/LOCAL-AI-MACBOOK.md) and verify its device identity before a state change.
- Cloud setup: `.claude/hooks/cloud-setup.sh` installs dependencies and tries Playwright Chromium. Cloud clones have only Git: no raw art, bulk sim data, TypeSafe key or M1 access. Commit and push finished work to its branch; work left only in the cloud is lost.
