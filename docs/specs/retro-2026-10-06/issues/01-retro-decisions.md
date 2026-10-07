# Retro decisions, round 1

Type: grilling
Status: resolved

## Question

Which retro findings go into specs now, and what are the owner's answers on the open design points (Set A, the landscape layout, the commit trailer, the public transcripts, the run gate, the local logs, the art home, the tracker, pushes to main, the decision format, the checkpoint)?

## Answer

The owner (2026-10-06): "for all - do what you recommend."

1. Scope (b): items 1, 2, 3, 4, 5, 6, 14, 15, 16, 17, 20, 24, 25, 26, 27 of retro.md, in five specs: Workshop finish, checks and hooks, secrets and public gates, steering cut, dev environment.
2. Motion Set A is wired into the one-screen card; a vitest guards the 600 ms limit and the reduced-motion cancel.
3. At 568×320 the two boards sit side by side with smaller cells; a mockup comes before the build.
4. Commits end with one neutral trailer per tool: `Co-Authored-By: Claude Code <noreply@anthropic.com>` or `Co-Authored-By: Codex <noreply@openai.com>`. No model names anywhere. A commit-msg hook rejects model names; a prepare-commit-msg hook adds the trailer.
5. The 77 transcript files leave the tree in one commit on the integration branch; history is untouched; they stay public until the owner merges.
6. Every run needs a go, and the launcher records the owner's quote. On this Mac without a go: unit tests, browser checks, a smoke run of at most 20 games with 2 workers.
7. The local session logs are redacted in place.
8. One approved PNG per figure in `art-src/` (git-ignored, main checkout) with a manifest row; the shipped webp in `public/`; rejected batches deleted.
9. `docs/specs/` holds specs and tickets; TASKS.md shrinks to a short index of open items with links; old sections move to an archive.
10. A pre-push hook refuses direct pushes to main that touch src/, public/, index.html, package files or supabase/. Docs and trackers may push directly.
11. Open decisions go in one block at the end of a status message: a one-sentence rule, two or three numbers, the agent's pick, what happens on yes. Work continues under the pick except for runs and rule changes.
12. The Codex working tree is committed as one checkpoint before the integration branch starts.
