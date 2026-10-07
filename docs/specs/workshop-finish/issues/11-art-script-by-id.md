# 11: One command remakes the figure webp in any checkout

**What to build:** An art helper adds a new source and ships it in one step, from any checkout. The cast list loses its source field. The art script finds each figure's PNG and prompt by id in the main checkout's art-source workshop folder, through git's common directory, and writes the two webp into the current checkout. It stops, and names the id, when a PNG or a prompt is missing. One run of the script from a checkout of this branch leaves the 68 tracked webp unchanged; this proves the sources of ticket 10. An art-script test runs the script in a temporary repository with a linked worktree and a fixture PNG.

**Blocked by:** 02, 10; checks-and-hooks/02 (the `tempRepo()` harness); checks-and-hooks/01 (`sharp` 0.35.4 as a dev dependency)

**Status:** ready-for-agent

- [ ] The cast list has no source field; the figures test still passes.
- [ ] The art-script test starts from `tempRepo()`, adds a linked worktree and a fixture PNG with its prompt in the main folder's art-source workshop folder, runs the script in the worktree, and asserts the two webp in the worktree.
- [ ] The same test asserts that a missing PNG and a missing prompt each stop the script with a non-zero exit and the id in the message.
- [ ] One run of the script from a checkout of this branch, reading the main checkout's 34 sources, leaves `git status --porcelain public/ui/workshop` empty.
- [ ] `npm run check:browser workshop-cast` passes.
- [ ] `npm test` passes.

**Verify:** `npm test`; `node tools/prepare-workshop-art.mjs && git status --porcelain public/ui/workshop`; `npm run check:browser workshop-cast`

**Owns:** tools/prepare-workshop-art.mjs, tools/prepare-workshop-art.test.ts (new), docs/visual-design/workshop/cast.json
