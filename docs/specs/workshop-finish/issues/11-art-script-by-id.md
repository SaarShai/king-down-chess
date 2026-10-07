# 11: One command remakes the figure webp in any checkout

**What to build:** An art helper adds a new source and ships it in one step, from any checkout. The cast list loses its source field. The art script finds each figure's PNG and prompt by id in the main checkout's art-source workshop folder, through git's common directory, and writes the two webp into the current checkout. It stops, and names the id, when a PNG or a prompt is missing. One run of the script from a checkout of this branch leaves the 68 tracked webp unchanged; this proves the sources of ticket 10. An art-script test runs the script in a temporary repository with a linked worktree and a fixture PNG.

**Blocked by:** 02, 10; checks-and-hooks/02 (the `tempRepo()` harness); checks-and-hooks/01 (`sharp` 0.35.4 as a dev dependency)

**Status:** ready-for-agent

- [x] The cast list has no source field; the figures test still passes.
- [x] The art-script test starts from `tempRepo()`, adds a linked worktree and a fixture PNG with its prompt in the main folder's art-source workshop folder, runs the script in the worktree, and asserts the two webp in the worktree.
- [x] The same test asserts that a missing PNG and a missing prompt each stop the script with a non-zero exit and the id in the message.
- [x] One run of the script from a checkout of this branch, reading the main checkout's 34 sources, leaves `git status --porcelain public/ui/workshop` empty.
- [x] `npm run check:browser workshop-cast` passes.
- [x] `npm test` passes.

**Verify:** `npm test`; `node tools/prepare-workshop-art.mjs && git status --porcelain public/ui/workshop`; `npm run check:browser workshop-cast`

**Owns:** tools/prepare-workshop-art.mjs, tools/prepare-workshop-art.test.ts (new), docs/visual-design/workshop/cast.json

## Comments

Builder, 2026-10-07, branch `build/workshop-finish-11`.

**What changed.** `tools/prepare-workshop-art.mjs` finds the checkout with `git rev-parse --show-toplevel` and the main checkout with `git rev-parse --path-format=absolute --git-common-dir` (its parent folder). It reads `art-src/workshop/{id}.png` and `{id}.prompt.txt` there and writes `public/ui/workshop/{id}-w.webp` and `{id}-b.webp` into the current checkout. The packing steps (split in half, trim, fit 384×448, webp quality 88) do not change. Before it writes, it checks every figure: when a PNG or a prompt is missing, it writes nothing, prints one line per missing file (`<id>: no <id>.png in <folder>`) and stops with exit 1. `docs/visual-design/workshop/cast.json` has only `id`, `name` and `tags` now.

**Tests.** New file `tools/prepare-workshop-art.test.ts`, 4 tests, red first (3 failed on the old script: "Invalid input" from sharp; then 1 failed on the old cast list), then green:
- "reads a cast list that names each figure by id, name and tags only, with no source path" (the real cast list).
- "finds the source by id in the main checkout and writes the two webp into the linked worktree": `tempRepo({ hooks: false })`, a commit of a one-figure cast list, `git worktree add`, a 200×120 fixture PNG made with sharp and its prompt in the main folder's `art-src/workshop/`. It asserts exactly the two webp in the worktree, format webp, 40×40 ivory and 30×50 charcoal (the trimmed halves), and no `public/` folder in the main folder.
- "stops with a non-zero exit and names the id when the PNG is missing" and "... when the prompt is missing": exit not 0, the id and the file name in stderr, no `public/` folder in the worktree.

**Commands run.**
- `npx vitest run tools/prepare-workshop-art.test.ts src/workshop/figures.test.ts`: 9 passed (the figures test still passes without the source field).
- `node tools/prepare-workshop-art.mjs && git status --porcelain public/ui/workshop` in this worktree: "Prepared 34 approved pairs from /Users/za/Documents/king down chess/art-src/workshop.", then empty output. The file times show that the script wrote all 68 files; they stay byte-identical. Run two times, before and after the merge of the integration tip.
- `npm run check:browser` is not on the integration branch yet (checks-and-hooks/06). So, as the brief says: `npx vite build`, `npx vite preview --host 127.0.0.1 --port 63334 --strictPort`, `PLAYABLE_URL=http://127.0.0.1:63334/ node tools/verify-workshop-cast.mjs`: "ok 390" and "ok 1280" (all 34 choices, both armies, filters, undo, save/reload, share and Try it). The server stopped by its PID. `git status --porcelain` was empty after it. The merger can run `npm run check:browser workshop-cast` when the runner lands.
- `npm test` after the merge of `9d141fb`: the type check passes, vitest 51 files and 882 tests pass, the node tests 42 pass. Before the merge: 47 files, 844 tests, 42.

**Left for other tickets.** `docs/WORKSHOP.md` (line 1811: "cast.json records the selected sources") and `TASKS.md` (line 19: "the selected-source list") still describe the old source field. Ticket 12 and steering-cut own those files. The ticket names ticket 02 as a blocker; it is not merged, and this change does not touch the two check files.
