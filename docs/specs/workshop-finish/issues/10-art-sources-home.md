# 10: A home for the figure sources and their prompts

**What to build:** The owner keeps one approved source and one prompt per Workshop figure, so that an art helper can redraw it. The builder copies each of the 34 chosen paired PNGs from the Codex working copy into a new workshop folder in the main checkout's art-source folder, named by figure id, with a prompt file beside it named by the same id. The prompt text comes from the batch prompt records; where none exists, the file says "prompt not recorded". The art manifest gets a workshop section with one row per figure, after the cards precedent for generated art. The figures test asserts that the cast list equals the figure module, that the manifest has a row per figure, and that the shipped art folder holds only the two webp of each figure (68 files). The sources stay untracked; only the manifest is tracked.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] The main checkout's art-source workshop folder holds 34 PNG files and 34 prompt files, one pair per figure id, and nothing else.
- [ ] Each PNG has the same sha256 as its chosen source in the Codex working copy; the list of 34 pairs of hashes is in Comments.
- [ ] Each prompt file holds the recorded prompt text, or "prompt not recorded".
- [ ] The art manifest has a workshop section with a count and size in its heading and one row per figure: file, source, size, why kept, licence note.
- [ ] The figures test asserts: the cast list's ids, names and tags equal the figure module; the manifest has a row for each figure id; the shipped art folder holds exactly `{id}-w.webp` and `{id}-b.webp` for each id. It holds no literal cast size.
- [ ] `git status` in this branch shows no tracked change outside the manifest and the figures test.
- [ ] `npm test` passes.

**Verify:** `npm test`; `ls "<main checkout>/art-src/workshop" | wc -l` gives 68; `shasum -a 256` on each pair

**Owns:** art-src/MANIFEST.md (the workshop section), src/workshop/figures.test.ts; the untracked art-src/workshop/ folder of the main checkout
