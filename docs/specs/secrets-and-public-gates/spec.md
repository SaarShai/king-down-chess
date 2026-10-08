# Secrets and public gates
Status: ready-for-agent
Source: docs/specs/retro-2026-10-06/retro.md items 5, 6, 8 (the size gate and the batch ignore lines), 26 (the size gate)

## Problem Statement

The repository is public, and nothing stops a secret or a production change from leaving. On 2026-10-03 a `pgrep -fl` printed two live keys into a transcript. 77 session transcripts (17.5 MB) under `docs/claude-recovery` and `docs/cursor-recovery` are public on main. The legal pages went live from an unmerged branch; a test ran in the owner's signed-in pane. Git tracks `sim/nnue/policy.bin` (6.6 MB), but `.gitignore` lists it.

## Solution

Gates sit at the three exits: tool calls, git and deploy. A Claude Code tool gate refuses secret printers and asks before production actions. A repo gate in the git hooks refuses large files, secret values and files in private folders. One deploy script is the only path to the live site. The transcripts leave the tree.

## User Stories

Each story's check runs in `npm test`; git cases run in a temporary repository.

1. As the owner, I want commands that print environments, command lines or secret files refused, with a safe form named, also inside `ssh`, `sh -c` and pipes, so that no key reaches a transcript.
2. As the owner, I want a prompt before production, DNS and pages actions, hook bypasses and production site visits, even with a hook missing, so that these happen only on my yes.
3. As the owner, I want a push refused when a pushed commit or message adds a secret value, even one a later commit removes, so that no key goes public.
4. As the owner, I want a commit or push refused when it adds a file over 2,000,000 bytes that is not on the size allowlist, so that image rounds stay out of git history.
5. As the owner, I want a commit or push refused when it adds a file in the transcript, secrets or art source folders, so that these stay private.
6. As the owner, I want a scan of all public history for the current secret values, so that I know if a key needs rotation.
7. As the owner, I want to store a secret from the clipboard without printing it, so that no key enters a chat.
8. As the owner, I want one deploy command that tests a fresh origin/main, publishes only on a flag and confirms the live site, so that only merged, tested code goes live.
9. As a reader, I want the 77 transcripts gone in one commit, with no link into them and no tracked file that the ignore rules match, so that no link breaks and `policy.bin` stays out.

## Implementation Decisions

- **Tool gate.** One Node module: a pure decision function and a stdin/stdout hook wrapper. Bad input or a fault gives `ask`, because a crashed hook lets the call through.
- It splits a command line, strips wrappers such as `npx` and `sudo`, and parses `ssh` and `sh -c` strings again. It stops mistakes, not an adversary.
- Deny: `printenv`; the print-all forms of `env`, `export`, `set`, `declare` and `typeset`; `pgrep` with `l` or `a`; `ps` with a command or environment column; a process environ file; a command that sends a secret file to stdout, such as `cat`; `npm ci`, `npm install` and `npm i` when `node_modules` in the input's `cwd` is a link, because `npm ci` empties the linked folder; the reason names `wt add <path>`.
- Ask: `vercel`, `psql`, `supabase`, the deploy publish flag, a Porkbun API URL, `gh workflow run` (pages), git `--no-verify`, `git commit -n`, and each `core.hooksPath` change.
- Ask for a browser URL, also in a batch step, on kingdown.dev, `kingdown*.vercel.app`, vercel.com, supabase.com, `*.supabase.co`, porkbun.com and their sub-domains.
- In `bypassPermissions` and `dontAsk` mode, each ask becomes deny ("ask the owner in chat"), because there a hook ask can pass with no prompt.
- **Settings.** Matchers: `Bash`; the browser pane's `navigate`, `preview_start` and `browser_batch` with the `mcp__Claude_Browser__` and `mcp__remote-devices__Claude_Browser__` prefixes; the Chrome extension's navigate and new-tab tools.
- `permissions.deny` holds the plain printer forms and Read on the secret files. `permissions.ask` holds the `vercel` runner forms, `psql`, `supabase` and `gh workflow run`. These rules hold in every mode and when a hook is missing. The gates apply only in checkouts that hold the merged settings.
- **Repo gate.** One Node command. Exit 0 passes, 1 refuses, 2 is a gate fault and refuses. Each fault is one line on stderr: rule, short commit, path, secret file name, never a value.
- `staged` mode runs from the checks spec's pre-commit. `push` mode reads the blobs and messages that the pushed SHAs reach and no origin ref reaches.
- `history` mode reads every blob and message that any origin ref reaches. It runs only the secret rule and prints found or not found per secret file.
- Rules: a blob over 2,000,000 bytes fails unless the size allowlist holds its path with a reason. Staged mode reads only added and changed files, so files already on origin pass. This spec owns the allowlist; it starts with the Workshop branch's two motion videos and five figure samples over the limit. An added or changed path in the transcript, secrets or art source folders fails; the art manifest passes. A secret value is a fixed byte search, so binary files count.
- Secret values come from the main checkout's secrets folder and the Typesafe key file that AGENTS.md names. A JSON file gives only strings under a key that holds `secret`, `token`, `password` or `apikey`. `GATE_SECRETS_DIR` and `GATE_TYPESAFE_KEY` override the sources for tests.
- **Clipboard script.** It writes one named file, mode 600, into the main checkout's secrets folder (mode 700), even from a worktree, or into `GATE_SECRETS_DIR`. It refuses an empty clipboard and, unless forced, an existing file. It prints only the name, size and a short hash, then clears the clipboard.
- **Deploy script.** It takes no ref. It makes a detached worktree of a fresh origin/main with git, then calls `wt add <path>` (dev environment spec) for the packages. It runs `npm test` and the checks spec's browser-check runner, and stops at the first failure.
- Only the publish flag runs the pinned Vercel CLI through npx with its yes flag, because the dev environment spec blocks unasked installs. Then the live check fetches `DEPLOY_LIVE_URL` with no cookies, for up to 2 minutes. It confirms the bundle name and byte-identical privacy, terms and delete-data pages. The script removes its worktree on every exit.
- **Transcripts.** One commit removes the 77 files, fixes the links, adds ignore lines for both folders and untracks `policy.bin`. A link becomes the path plus the short id of the last main commit that held the file, or the builder drops it. The takeover hash baseline, `original-TASKS.md.txt` and the retro and spec records keep the path as data.
- After this commit git tracks no rules PDF; copies stay in the main checkout's git-ignored art source rules folder (same SHA-256) and on the Drive.
- Ignore lines also cover the Workshop figure batch, final run, swarm and figures folders. The figure samples folder gets none, because git tracks its 41 files.
- **Shared files.** This spec owns `hooks.PreToolUse` and `permissions`; the dev environment spec owns the other settings keys and its ignore line. The Workshop finish spec owns the art and batch folders. The checks spec owns the git hooks, their harness, decision 10's main-branch rule and the cursor adoption check's output default. In steering cut files this spec changes only links and lands first; that spec adds the AGENTS.md line on printed secrets and points the hosting recipe here.

## Testing Decisions

- A good test drives the real entry point and checks decision, reason, exit code, output and files.
- Tool gate: one table; each row goes as JSON on stdin to the hook command in the settings. Rows: each deny and ask form, nested forms, `npm ci` with a linked and a real `node_modules`, passes such as `grep vercel`, each matcher tool and URL, each permission mode, bad JSON. Settings: hooks are executable; each matcher and rule exists.
- Repo gate: the checks spec's harness, a bare remote and fake secret sources. Push cases: a value in text, a binary and a commit message; a value added then removed; a public JSON value; a 3 MB file with and without an allowlist line; a transcript added and deleted; a forced art file. A manifest edit and a file in `docs/research/m1-results/*-context-recovery` pass.
- Also: an oversize file through pre-commit; history mode finds an old value on a non-main remote branch; a corrupt input gives exit 2. The output must not hold the value.
- Clipboard: fake `pbpaste` and `pbcopy` on `PATH`; a run from a worktree writes into the main checkout.
- Deploy: stub `npm`, `npx` and the runner on `PATH`. A local commit has no effect; with no flag it never calls `vercel`; a failed `npm test` stops it; the worktree goes on every exit. The live check runs against a local server, with a matching and a changed build.
- Link lint: it finds a path into either transcript folder, with or without `docs/`, except in the kept records. The relative link in `docs/RULES.md` fails until fixed; `docs/takeover/baseline.json`, `original-TASKS.md.txt` and the `/tmp` paths in the painted-game continuation checks pass.
- Ignore lint: no tracked file matches the ignore rules, and `.gitignore` holds `figure-batch-*`, `figure-final-run`, `figure-swarms` and `figures-*`.
- Prior art: `src/account/account.test.ts` (a secret-pattern scan) and `src/sim/sim.test.ts` (it starts a CLI through `execFileSync`).

## Out of Scope

- A history purge: it needs a force-push and its own decision.
- GitHub branch protection: decision 10 chose the checks spec's pre-push hook.
- Codex tool calls: only the git gates apply there.
- The owner rotates `TYPESAFE_API_KEY` and renews the messaging token (ticket 09).
- A value only in the process environment: no file holds it.
- The redaction of the live session log: a session-end task (decision 7).
- Retro item 7 and the rest of item 8: not in decision 1.
- Retro items 9 to 13, 18, 19, 21, 22, 23 and 28 to 30: other efforts.

## Further Notes

- The merge deletes the transcripts and `policy.bin` from the main checkout's disk; the builder saves a copy of `policy.bin` for the trainer first and restores it.
- Builder tasks (results in the build ticket): a history scan of origin; a deploy rehearsal with no publish flag; a probe that a hook ask in bypass mode gives a deny; a push-mode run before the first push, each fault shown to the owner.
- The transcripts stay public until the owner merges (decision 5). This spec has no visual change.
