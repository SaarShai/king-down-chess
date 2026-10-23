# 14: No model name in any doc, outside the exempt files

Status: ready-for-human
Branch: staging/docs-model-names

**What to build:** AGENTS.md says that no doc holds a model name, but before this ticket only commit messages and some steering files had a check. A review bot found four model names in ticket 77 of `staging-first-game`. A docs lint now reads each Markdown file of the tree with `findModelNames` and fails on each find outside the exempt files. A fault names the file, the line and the word. The docs that the first run found are clean, or are on the exempt list for the owner to approve.

**Owns:** `tools/model-names.docs.test.ts`; the model-name line of `AGENTS.md`; the doc lines that held a model name.

## Plan

1. Scan each tracked Markdown file outside the tasks archive with `findModelNames`.
2. Change each find to the tool or the role (Codex, Claude Code, the Codex agent, Medium effort). Where a doc must name models to do its work, do not remove facts: put the file on the exempt list, with its reason.
3. Add `tools/model-names.docs.test.ts` (run by `npm run test:docs`).
4. Change the AGENTS.md rule so that it names the exempt list.

## Checks

- [x] The lint fails on a planted name in a tracked ticket and in a new, untracked file, and names the file, the line and the word.
- [x] The lint passes on the real tree. Each exempt entry matches a file.
- [x] `npm run test:docs` and `npx tsc --noEmit -p .` pass.
- [ ] The owner approves the exempt list (see Comments).

## Comments

**Base.** The branch starts at `origin/main` (`bdd886c7`).

**First run.** 151 finds in 44 files (864 Markdown files read, the tasks archive not read).

**Changed (30 files).** Each model name now names the tool or the role. 23 spec files take the exact lines of the open checks branch (`staging/ci-guards`, ticket 78 of `staging-first-game`), so the two branches merge without a conflict. The other seven: `docs/lessons/agents-and-tools.md` (two words: "the local model", "Another local model"), `docs/submission/checklist.md`, `docs/takeover/BASELINE.md`, `docs/research/chatgpt-plugin-environment.md`, `docs/research/chatgpt-plugin-preparation.md` (a diagram node name), and the two ChatGPT research files below (model names only). Git history keeps the old words.

**Exempt list (owner decision).** The lint does not read these files. Each reason is in the lint.

| Entry | Finds | Reason |
| --- | --- | --- |
| `docs/tasks-archive/` | not read | Old records; AGENTS.md exempts it already. |
| `docs/DELEGATION.md` | 19 | Which model does which work, with the tested model IDs. AGENTS.md links it as the M1 facts and prompts. |
| `docs/LOCAL-AI-MACBOOK.md` | 4 | The M1 model inventory; the commands need the exact model tags. |
| `docs/research/m1-*`, `docs/research/direct-campaign-2026-09-22.md` | 62 in 12 files | The records of the 2026-09-21 and 2026-09-22 model trials: they compare named models, and folder and branch names hold the model names. |
| `docs/research/chatgpt-plugin-feasibility-2026-10-07.md` | 10 | Cites the earlier ChatGPT plugin project by its folder name, also in three link targets. |
| `docs/research/chatgpt-chess-market.md` | 2 | Cites an outside repository by its name and address. |

If the owner refuses an entry: remove it from the lint, and change the file's words (and, for the last two, the folder name or the link).

**Red.** With a planted name in `docs/specs/after-redesign/issues/05-measure-slots.md` and in a new, untracked `docs/specs/plant-new.md`, `npm run test:docs`: 1 failed, 169 passed. The faults (name replaced here by `<name>`):

    docs/specs/plant-new.md:3: "<name>"
    docs/specs/after-redesign/issues/05-measure-slots.md:61: "<name> 5.5"

**Green.** `npm run test:docs`: 14 files, 170 tests passed. `npx tsc --noEmit -p .`: exit 0 (it reads `src` only). The new test also type-checks under the `tsconfig.tools.json` of `staging/ci-guards`.

**Other branches.** `staging-first-game` changes seven Markdown files after `origin/main`; none holds a model name, and none is a file of this branch. The open pull request branches (#56, #78, #83, #87, #88, #89, #90) add no Markdown file with a model name.

**Tracker file.** `docs/lessons/agents-and-tools.md` is a tracker file, which changes only on main. This branch changes two words in it, so that the lint passes at the merge. If the owner prefers, the main session makes the same change on main first.

**Overlap.** The open checks branch adds a specs-only model-name rule to `tools/steering.docs.test.ts`. This lint covers all docs, so that rule can go after both merge.
