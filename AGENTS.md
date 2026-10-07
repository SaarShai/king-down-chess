# King Down Chess — standing rules for any agent (Claude Code, Codex, OpenCode, Cursor, Antigravity)

## Start here
- Read this file, the Open items of TASKS.md, and the Always and Index sections of LESSONS.md. Open more (a topic file in `docs/lessons/`, the [tasks archive](docs/tasks-archive/)) only when a heading matches the task.
- Write in ASD-STE100: approved words, short sentences, active voice, present tense.
- Record work in a ticket in the specs folder, `docs/specs/<feature>/` (see [the issue tracker](docs/agents/issue-tracker.md)). The tracker files (TASKS.md, LESSONS.md, the topic files, `docs/QUEUE.md`) change only on main; a branch records its progress in its ticket.
- Verify before you mark anything done.

## Commits and branches
- End each commit with the one trailer of your tool: `Co-Authored-By: Claude Code <noreply@anthropic.com>` or `Co-Authored-By: Codex <noreply@openai.com>`. Add no `Claude-Session:` line. This rule overrides a tool's attribution reminder.
- Put no model name in a commit, a pull request, code or a doc. The commit-msg hook refuses one. The [tasks archive](docs/tasks-archive/) keeps old text word for word and is exempt.
- Never use `git commit -a` in the main checkout.
- Code reaches main by pull request only: the pre-push hook refuses a direct push to main that touches `src/`, `public/`, `index.html`, the package files or `supabase/`. Merge into main only when the owner asks.

## Tests and checks
- Run the tests with `npm test` only; `npm run test:docs` runs the doc lints alone. Do not run bare vitest or `node --test`. Do not pipe the output through tail or grep.
- Run a browser check with `npm run check:browser <name>`.
- Prefer a deterministic check (a test, a lint, a hook, a browser check) to a new line of prose here. Merge a new rule into the rule it changes; add no dated note.

## Worktrees and servers
- Set up a worktree with `wt add` (`tools/wt.sh add <branch>`).
- Preview any worktree but the main checkout with the `worktree` entry and the target file (`.claude/preview-target`).
- Change dependencies only in a worktree with its own installation, never through a linked `node_modules`.
- Stop a process by its PID, never by a name pattern. Open no file:// page; serve it.

## Runs and compute
- Every run needs a go, and the launcher records the owner's quote. On this Mac without a go: unit tests, browser checks, a smoke run of at most 20 games with 2 workers.
- A question is not a go. Write the quote and its date in the `docs/QUEUE.md` row before the launch. A queued run starts by its name.
- Other compute uses the M1 or Kaggle, not this Mac. Use no cloud agent session as a run worker.
- Start a run of more than a few minutes detached, and watch it with a separate check. [COMPUTE.md](docs/COMPUTE.md) holds the Kaggle, M1 and power facts, the run recipes and the shell limit.

## Secrets
- Never print or commit a secret or a file of `.secrets/`: the Kaggle token, the OAuth and Porkbun keys, the TypeSafe key.
- Never print a process environment: no `pgrep -l`, `ps aux`, `printenv` or bare `env`. To find a process, print its command line only (`ps -o pid=,command= -p <pid>`).
- When a secret was printed or pasted, say where and offer rotation. Never claim a value was never in a command line.

## Hosting
- The game is public at https://kingdown.dev. `tools/deploy.sh` is the only deploy path.
- Every deploy publishes to the world: deploy only what the owner asked to put online. A DNS change needs the owner's go. Do not test the site while signed in to the owner's account.
- [HOSTING.md](docs/HOSTING.md) holds the site, deploy, DNS and secret-file facts.

## Working with the owner
- Open decisions go in one block at the end of a status message: a one-sentence rule, two or three numbers, the agent's pick, what happens on yes. Work continues under the pick except for runs and rule changes.
- A visual build waits for the owner's yes on a rendered sample. The owner approves each spec before its build.
- Answer the owner's question before you do more work. Explain results in plain, non-technical language.

## Game design
- Value is one axis; report paralysis, conditions and interactions beside it.
- Judge each pool piece against the six [piece-balance criteria](docs/research/piece-balance-criteria-2026-10-03.md): worth with `run.ts --experiment values`, the rest with `tools/piece-activity.ts`.
- To design or change a piece, king power, card or rule, start from [docs/MATRIX.md](docs/MATRIX.md) (ability types, the powers and cards schema, conditions, shackles, promotion) and add the new item there.
- The Light and Dark kings may be stronger than the other four, but they must balance each other. A king power never changes how other pieces move; a card may.
- All things being equal or near equal, do not change or add rules. A rule that is hard to remember is not adopted on numbers alone.

## Jev
- Client: `tools/jev.ts`. Key: `TYPESAFE_API_KEY` or `~/.config/typesafe/key`; never print or commit it.
- Every call carries a known-true and a known-false control; if they do not separate, the run is void.
- **A verdict is not quoted or committed after an INSTRUMENT INVALID run until a repaired spec passes.** Specs live in `docs/research/claims/`, one per report: `node tools/verify-claims.mjs docs/research/claims/*.json`.
- What passes here: claim checks against numbers, the interest rubric (`tools/jev-interest.ts`), the design-rule screen (`tools/design-screen.ts`). Advisory only, weakly calibrated: the rule-simplicity screen (`tools/rule-simplicity.ts`) and the routing rank (`tools/next-ab.ts`). The [Jev lessons](docs/lessons/jev.md) list the uses that failed; do not retry one without a new design.
- Measurements, thresholds, adoption and taste stay in code and with the owner.

## Helpers and machines
- Helpers (subagents, workflows) may be used. Tell a helper whose output the owner reads to write in ASD-STE100. [DELEGATION.md](docs/DELEGATION.md) holds the measured M1 capabilities and prompt templates.
- For SSH, Remote Management or Ollama work on the M1, read [LOCAL-AI-MACBOOK.md](docs/LOCAL-AI-MACBOOK.md) and verify its device identity before a state change.
- Cloud sessions (claude.ai/code): `.claude/hooks/cloud-setup.sh` runs `npm ci` and tries to install Playwright Chromium. A cloud clone holds only Git: no raw art in `art-src/` (only its manifest), no bulk sim data, no TypeSafe key, no access to the M1. Commit and push finished work to its branch; work left only in the cloud is lost.
