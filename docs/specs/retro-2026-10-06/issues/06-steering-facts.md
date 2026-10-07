# Steering, secrets and public files facts

Type: research
Status: resolved

## Question

TASKS.md sections with dates and sizes; LESSONS.md headings and duplicates; AGENTS.md line map; handoff lines about trailers; the public transcript files; .secrets file names; MATRIX sections on main and the parked Workshop rows; trailer counts on main; repo size and large blobs. Needed by: steering cut, secrets and public gates.

Resolved by the workflow retro-spec-facts (run wf_354ee3fb-e64); the report lands in the scratchpad facts folder and its gist is appended here.

## Answer

The full report is in the session scratchpad under `facts/steering.md`.

- TASKS.md: 290 KB, 107 sections. 88 sections dated before 2026-10-05 hold 235 KB (81%). A cut at 2026-10-05 keeps 13 dated and 3 current undated sections, about 52 KB, above the 40 KB target. Three old undated phase plans and the order (not by date) go with the archive. No section links `docs/specs/`.
- LESSONS.md: 64.6 KB, 43 sections; the top list of 42 bullets has no sub-headings. Two sections are duplicated word for word (lines 300-306 and 404-410). The "never print a process environment" rule from 2026-09-16 is already there and the fault came back on 2026-10-03.
- AGENTS.md: 30 lines, 904 words; the Compute line holds 322 words, Hosting 140. Nothing in it names the commit trailer, model names, ASD-STE100, `npm test` or the specs tracker. The "2 hours" shell claim is in AGENTS.md and HANDOFF.md only.
- Handoffs: all three ask for a model-name trailer and forbid model names; HANDOFF.md also asks for a `Claude-Session:` line. HANDOFF-retro.md and HANDOFF-2026-10-06.md end with stray `</content>` and `</invoke>` lines and still route helpers to a cheaper helper model.
- Trailers: 244 of the last 300 main commits carry the model-name trailer; 222 carry `Claude-Session:`. The neutral trailer is in memory only. `main` has no branch protection and no rulesets; the repo is public.
- Transcripts: 77 files, 17.5 MB, under `docs/claude-recovery` and `docs/cursor-recovery` on origin/main. 36 other tracked files link to them. The only tracked rules PDF (7.8 MB) is among them, and no tool hard-codes that path.
- `.secrets/`: `kaggle_api_token`, `oauth.json`, `porkbun_api.json`, mode 600, never committed, ignored by `.gitignore` and `.git/info/exclude`.
- MATRIX.md: the Workshop branch adds two rows (D.1 material behind, D.2 cannotMove) and a `## Workshop (build 1a)` section that points to `src/workshop/vocab.ts`. The word "parked" does not occur.
- Size: `.git` 663 MB; main tracks 23 files over 2 MB (83 MB), among them `sim/nnue/policy.bin` (6.6 MB) although `.gitignore` lists it, and `complete-cast.blend` in 6 versions. 96 branch refs, 59 worktrees.
- Outside the repo: `~/.codex/AGENTS.md` names none of the repo rules; the Claude memory holds two decisions not yet in the repo (neutral trailer, recorded-go run gate) and two memory file names that no longer match their content.
