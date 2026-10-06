# Handoff: a retro of the recent sessions, then specs and their implementation

Start this **after the Workshop rework** (`docs/HANDOFF-2026-10-06.md` on `claude/workshop`, given to a Codex agent on gpt-6-astra) is finished. Use a fresh Claude Code session in the main checkout, `/Users/za/Documents/king down chess`.

## For the owner: what you type, in order

The skills come from https://github.com/mattpocock/skills (v1.3.1, MIT). Some of them are **user-invoked**: only you can start them, by typing the slash command. The agent cannot start them for you, and one user-invoked skill cannot start another one. So you type each step below.

1. **Install** (once): `claude plugins install mattpocock-skills` in a terminal, or `/plugin install mattpocock-skills` in a session. Restart the session if the skills do not show. Install only one way. The plugin and `npx skills` together give every skill twice.
2. **Paste the agent prompt below.** The agent reads this file, checks the skills, and gets the session records ready. Then it stops.
3. `/setup-matt-pocock-skills` (once for this repo). It asks you three things:
   - **Issue tracker:** I suggest **local files**. This repo does not use GitHub issues; TASKS.md and docs/QUEUE.md are the trackers.
   - **Triage labels:** keep the defaults.
   - **Where docs go:** suggest `docs/specs/`.
4. `/retro`: the review. It reads the sessions and the Workshop work listed below, and gives its suggestions, the most severe first.
5. `/grill-me`: the agent asks you about the suggestions you want to act on, until each decision is clear.
6. **Specs.**
   - For one or a few changes: `/to-spec`. The agent writes the spec from the conversation, with no new interview.
   - For a large set of changes that more than one session can hold: `/wayfinder` first. It makes a map of decision tickets and resolves them one at a time. Then `/to-spec` for each part.
   - Read each spec before step 7.
7. `/implement-spec`: it builds the spec on one integration branch. Subagents work in their own worktrees, test first (the `tdd` skill), and close with `code-review`. It does not merge into main. You choose when to merge.

## Agent prompt (paste at step 2)

```text
Read AGENTS.md, TASKS.md, LESSONS.md and docs/HANDOFF-retro.md, and follow the handoff. The skills plugin mattpocock-skills is installed. Before I run the skills, do the "Preparation" section: read the SKILL.md of retro, grill-me, wayfinder, to-spec, implement-spec and setup-matt-pocock-skills; tell me in short plain sentences what each one will do in this repo, and anything in them that conflicts with AGENTS.md. Then list the session records and the Workshop work that /retro will review, and stop. Write to me in plain ASD-STE100 English.
```

## For the agent

### Preparation (before the owner runs the skills)

- **Read each skill's SKILL.md** in the installed plugin, and tell the owner what it will write and where. These skills are code from the internet, so read them before they run.
- **Conflicts with this repo:** AGENTS.md and the owner's rules come first. Report each conflict to the owner, and do not change AGENTS.md to fit a skill without the owner's go. Possible conflicts:
  - `setup-matt-pocock-skills` and `domain-modeling` write `GLOSSARY.md` and ADRs. This repo already has its own records: AGENTS.md, LESSONS.md, TASKS.md, docs/MATRIX.md and docs/RULES.md. A glossary can point to them; it must not copy them.
  - The skills prefer a PR. Here, a PR is opened only when the owner asks.
- **Find the material for the retro:**
  - **Claude Code sessions:** `~/.claude/projects/-Users-za-Documents-king-down-chess/*.jsonl`, the most recent first. One of them is the session of 2026-10-06 (`1c5adfa2-c747-4b20-ac72-5d45fc6131ab`). It covered:
    - the Workshop build 1a and its two fix rounds;
    - the Spawn, Morph, MorphP and MorphS cards, with the M1 and Kaggle runs;
    - an independent review by Codex.
    These files are large. Read them with a script or with helpers (Sonnet for search and summary), not whole into the context.
  - **Codex sessions:** `~/.codex/sessions/<year>/<month>/<day>/*.jsonl`. These include the Workshop rework on gpt-6-astra and the review of 2026-10-06.
  - **Subagent transcripts:** they are under each Claude session's folder.

### What `/retro` must cover

1. **The Workshop rework by the Codex agent on gpt-6-astra.** This is the first item. Find its work:
   - **the branch:** `claude/workshop`, or the branch it made from it; read `git log` from `efd260e` (the handoff commit);
   - **the docs:** its changes to `docs/WORKSHOP.md`;
   - **the visuals:** its mockups and screenshots in `docs/visual-design/workshop/`.

   Review two things:
   - **The result.** Call the `code-review` skill on the diff from `efd260e`, if the skill lets the agent call it. Run the Workshop in the browser at phone and desktop sizes, and check the result against `docs/visual-design/workshop/REVIEW-2026-10-06.md`.
   - **The process.** Did it show design directions to the owner before it built? Did it keep the tests passing? Did it follow AGENTS.md: no model names in commits, no secrets, no deploy?
2. **The recent Claude sessions.** Look for patterns that cost time or made errors. Examples from 2026-10-06:
   - **Dev servers and worktrees:** a dev server ran from the main checkout and not from the worktree under test, and `.claude/launch.json` in the main checkout is the only one the preview tool reads.
   - **Bare `node --test`:** it picks up the vitest files; the real command is `npm test`.
   - **The motion preview:** it worked only when a server served it.
   - **Codex flags:** `-i` takes several values, so the prompt must come from stdin.
   - **Kaggle and the M1:** the PATH on the M1, and `report --id`.
   - **Workshop problems:** the problems the owner found by hand that the browser checks had not caught.
3. **The environment.** Look at the checks that are missing or too weak; for example, the Workshop checks passed while the owner saw clear UX faults. Also look at:
   - steering files: AGENTS.md is long, and the TASKS.md entries are long;
   - navigation: where the agent spent many tool calls to find a thing;
   - tool economy: what took many steps that one script could do.

### Rules for the specs and the implementation

- **The owner approves each spec before `/implement-spec`.** A spec that changes rules, pieces or cards starts from docs/MATRIX.md. A spec that changes visuals or motion needs the owner's approval of the visuals before it enters the game.
- **Prefer a deterministic check** (a test, a lint rule, a browser check, a hook) to a new line of prose in AGENTS.md. When you add a rule, merge it into the existing rule; do not append a dated note.
- **Never merge into main or deploy** unless the owner asks. Runs (tournaments) need the owner's go. Compute goes to the M1 or Kaggle, not this Mac.
- **Commits:**
  - Put no model names in commits, PRs, code or AGENTS.md.
  - End each commit with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Secrets:** never print or commit them. That includes `.secrets/`, the Kaggle token, and the OAuth and Porkbun keys.
- **Language:** write to the owner in plain ASD-STE100 English. Answer his question before you do more work.
</content>
</invoke>
