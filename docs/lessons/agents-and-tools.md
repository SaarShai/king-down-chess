# Lessons: Agents and tools

The lessons on agents, helpers, worktrees, shell commands and tools. [LESSONS.md](../../LESSONS.md) holds the Always rules and the index of all topic files.

## 2026-10-10 — one independent review a PR found a real item every time
- Tickets 03 to 05 of the after-redesign spec (PRs #35 to #37) each got a read-only review of the diff by a reviewer that did not write it, and a three-lens panel with an adversarial check of each should-fix. Each round found an item that the builder's own tests and checks had passed: a browser case that could pass without a search in flight, a label condition that tested the wrong value, spec rows that said the wrong file, a slot count whose tests still covered the old count, and a workload that no test had run. → Before the merge of a step that moves or changes code, get one review from a reader that did not write it, on the diff and the before-and-after files. Fix each confirmed should-fix, record the findings and the fixes in the ticket and in a "Reviews" section of the PR body, and merge only after that. Run the reviewer inside the worktree with the read-only sandbox (`codex exec -C <worktree> -s read-only …`), so it reads the neighbours itself: a bundle of copied files made one review downgrade a finding to "missing evidence". (2026-10-10)

## 2026-10-10 — a push from the main checkout fails while another session edits there
- The pre-push hook refuses a push when a tracked file differs from HEAD, because `npm test` would not run on the commit that goes out. Another session's uncommitted edits in the main checkout refused a tracker commit's push for the whole day. → Commit from the main checkout with only your own hunk staged (`git diff` of `git show HEAD:<file>` against the new file, `git apply --cached`), then `tools/push-main.sh [<commit>]`: it pushes the commit from a clean detached worktree, where the hook runs its tests, and removes the worktree. Leave the other session's edits as they are. (2026-10-10)

## 2026-10-02 — a `pgrep -f` wait loop matched its own shell
- A wait loop `while pgrep -f "<pattern>"` never ended: `pgrep -f` matched the loop's own shell, whose command line contains the pattern. → Write the pattern so it cannot match itself (`pgrep -f "powers-net.ts [m]atch"`), or wait on the process's own output (a "done" line). (2026-10-02)

## 2026-10-02 — a short commit SHA fails as a session source
- `create_session` with a short commit SHA as the source revision failed at start (`ref_not_found`). → Start compute sessions on a branch name and have the prompt check out the full 40-character SHA. (2026-10-02)

## 2026-10-02 — build main beside a branch in a worktree
- To build main beside a branch, `git checkout main -- .` overwrote the branch's tracked files in place (recovered with `git checkout HEAD -- .`). → Build another revision from `git worktree add <dir> main` (symlink `node_modules`), never by checking its files out over the working tree. (2026-10-02)

## 2026-09-16 — Google Drive `read_file_content` returns `{}`
- Google Drive MCP `read_file_content` returned `{}` for every doc/sheet in this project. → Use `download_file_content` (base64) or, for link-shared files, `curl` the export URL (`/export?format=txt|xlsx`, `uc?export=download&id=`) and `gdown --folder` for folders.

## 2026-09-16 — macOS `base64` takes no positional file
- macOS `base64` has no positional file arg. → `base64 -D -i in -o out`.

## 2026-09-16 — `gdown --folder` has no `--remaining-ok` flag
- `gdown --folder` in the current release has no `--remaining-ok` flag. → Run it plain; check `find dir -type f | wc -l` for the 50-file cap.

## 2026-09-16 — image-only PDFs come back as garbage text
- Image-only PDFs come back as garbage text. → Rasterize with PyMuPDF (`page.get_pixmap(dpi=110)`) and read the PNGs.

## 2026-09-16 — the Artifact `files` list form
- Artifact `files` list form needs `{path}` objects; a bare string array is rejected. → Use the map form `{"published/path": "source/path"}` with `root: "dist"`, and `null` to drop stale hashed bundles.

## 2026-09-16 — `navigate` in `browser_batch` needs `tabId`
- In `browser_batch`, `navigate` without `tabId` hits the fronted tab (it replaced the dev-server tab once). → Always pass `tabId`.

## 2026-09-13 — in-place edits with `|` in the text
- **Mistake:** `perl -pi -e "s|…\|\|…|…|"` inside shell double quotes mangled every line of `src/render/sprites.ts` (the pattern collapsed to empty and matched each line start).
- **Rule:** for edits whose text contains `|`, `$` or quotes, use the Edit tool or a Python snippet / quoted heredoc; never a perl/sed one-liner with a `|` delimiter. Run `npx tsc --noEmit` right after and `git`-less projects get a `cat -A | head` sanity check.

## 2026-09-13 — session rate limit killed 8 parallel agents
- **What happened:** ten agents in flight hit the account's session limit (HTTP 429); each stopped mid-task with partial files on disk.
- **Rule:** before resuming, survey the disk (`ls`/`tsc`/`vitest`) to know what landed, then resume each agent with `SendMessage` (its transcript is kept) telling it to re-read its files first. Keep no more than ~6 Opus agents running at once when the limit window is close, and stagger research (cheap) after builds (expensive).

## Measuring without adding a file to the repo (2026-09-14)
- **Mistake:** a throwaway `.mts` benchmark in the scratchpad imported `./src/rules/engine` and died with `ERR_MODULE_NOT_FOUND` — an ESM specifier resolves against the *script's* directory, not the cwd, so every project import was missing.
- **Rule:** run it from the project root and load the project through dynamic import off the cwd: `const root = pathToFileURL(process.cwd() + '/src/').href; const { trainNet } = await import(root + 'sim/gen.ts');`. The `.ts` extension is required and the file URL survives a path with a space. Two 6-second read-only runs replaced two guessed numbers in the Q6 plan (sampler 156 games/s, trainer 6.5 s an epoch) without writing a file anywhere.

## Cursor recovery — 2026-09-24
- A completed agent turn is not a completed product. Reconcile child registries, transcripts, saved checks and the final files before trusting a parent's checkboxes; piped test output can hide failure behind a successful shell status. The recovery of `0213b442` found all 887 children complete, but no final combined suite or production build.
- Identify the accepted branch before integrating recovered changes. Cursor's old checkout lacked the approved clay presentation and already-proven repetition repair; its edited guide claimed a pool change that never reached the named worktree. Preserve the accepted implementation and port useful changes selectively.
- Prefer a semantic regression over hundreds of shallow score/move-order locks. A failed prediction may expose an incorrect fixture, and a later terminal fix may correctly obsolete its expected score. Keep exploratory datasets tied to their source/rules, separating adjudications and unfinished caps from completed outcomes. See `dd34fa5:docs/cursor-recovery/2026-09-24-0213b442/README.md` for the evidence.

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
