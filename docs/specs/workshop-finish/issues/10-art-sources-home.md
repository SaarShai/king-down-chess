# 10: A home for the figure sources and their prompts

**What to build:** The owner keeps one approved source and one prompt per Workshop figure, so that an art helper can redraw it. The builder copies each of the 34 chosen paired PNGs from the Codex working copy into a new workshop folder in the main checkout's art-source folder, named by figure id, with a prompt file beside it named by the same id. The prompt text comes from the batch prompt records; where none exists, the file says "prompt not recorded". The art manifest gets a workshop section with one row per figure, after the cards precedent for generated art. The figures test asserts that the cast list equals the figure module, that the manifest has a row per figure, and that the shipped art folder holds only the two webp of each figure (68 files). The sources stay untracked; only the manifest is tracked.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] The main checkout's art-source workshop folder holds 34 PNG files and 34 prompt files, one pair per figure id, and nothing else.
- [x] Each PNG has the same sha256 as its chosen source in the Codex working copy; the list of 34 pairs of hashes is in Comments.
- [x] Each prompt file holds the recorded prompt text, or "prompt not recorded".
- [x] The art manifest has a workshop section with a count and size in its heading and one row per figure: file, source, size, why kept, licence note.
- [x] The figures test asserts: the cast list's ids, names and tags equal the figure module; the manifest has a row for each figure id; the shipped art folder holds exactly `{id}-w.webp` and `{id}-b.webp` for each id. It holds no literal cast size.
- [x] `git status` in this branch shows no tracked change outside the manifest and the figures test.
- [x] `npm test` passes.

**Verify:** `npm test`; `ls "<main checkout>/art-src/workshop" | wc -l` gives 68; `shasum -a 256` on each pair

**Owns:** art-src/MANIFEST.md (the workshop section), src/workshop/figures.test.ts; the untracked art-src/workshop/ folder of the main checkout

## Comments

Builder, 2026-10-07, branch `build/workshop-finish-10`.

**What changed.** The main checkout's `art-src/workshop/` (ignored by `/art-src/*`, so untracked) holds `{id}.png` and `{id}.prompt.txt` for each figure, after the `cards/generated/` precedent. Tracked changes: `art-src/MANIFEST.md` (new section `## workshop — 68 files, 62.7 MB`, placed after `fonts` and before "Left on Drive") and `src/workshop/figures.test.ts`. This ticket file is the only other tracked change.

**Prompt files.** Each file names the figure, its source and the tool, then each recorded step in order: the record file, the job, the image inputs and the prompt text, verbatim. All 34 figures have a record, so no file says "prompt not recorded". 5 figures came from a chain of image edits; their files hold every step: ram-bastion (2 steps), antler-guardian (2 steps), hare-scout (4 steps), eagle-keeper (2 steps), tide-caller (3 steps). How the steps were traced:
- A job's `refs` path names the step before. The hare-scout v5 ref is a file in `~/.codex/generated_images/`; its sha256 equals `figure-batch-05/13-hare-scout-v4.png`.
- `strong.png` (ram-bastion) is the framing edit of `prompts-fast-strong.json`; its sha256 equals that record's `selected_output`. The first sheet is not kept as a file.
- The five fresh sample sheets equal their `fresh-sources.json` outputs by sha256: `fast-fresh-guard.png` is the `fast` job of `prompts-fresh-covers.json`; `support-fresh-cape.png` is `prompt-fresh-cape-framing.json`; the others are jobs of `prompts-fresh.json`.
- Inference, not proven by a hash: `tide-caller-shell-mask-v3.png` is the edit of `prompt-shell-hair-revision.json` (its `source` is `tide-caller-shell-mask.png`; `approved.json` describes the result). No record names the v3 file.

**Proof of the sources.** The packing steps of `tools/prepare-workshop-art.mjs`, run with `sharp` 0.35.4 in a scratch folder on the 34 copied PNGs, made 68 webp. All 68 are byte-identical to the tracked `public/ui/workshop/` files (sha256). Ticket 11 repeats this with the script itself.

**Commands run.**
- `ls "<main checkout>/art-src/workshop" | wc -l` gives 68: 34 `.png`, 34 `.prompt.txt`, no other file.
- `shasum -a 256` on each source and its copy: 34 pairs, 0 mismatches (table below).
- `git -C "<main checkout>" status --porcelain art-src` is empty.
- `npx vitest run src/workshop/figures.test.ts`: red first (no workshop section), then 5 passed. New or changed tests: "keeps the cast list equal to the figure module", "ships only the two armies of each approved identity, with no rejected or pending figures", "lists one source PNG per figure in the workshop section of the art manifest". The test holds no literal cast size; the heading count must equal two files per figure.
- `npx tsc --noEmit -p .`: 0 errors. `node --test "docs/2d-first-pieces/**/*.test.mjs"`: 42 passed.
- `npm test`: the type check passes; vitest 674 passed, 1 failed; three runs, the last after the merge of the integration tip `6080758`. The node tests do not run after the vitest failure. The failure is "never lowers W for an added square, line or ability" in `src/workshop/judge.test.ts`: "Test timed out in 5000ms" under full load. It fails the same way on the integration tip before this change, and `npx vitest run src/workshop/judge.test.ts` alone passes 13 of 13. Ticket 05 owns that file and gives the case a 30 s limit. So the box "`npm test` passes" stays open until ticket 05 merges.

**Note for the tracker.** The workflow named this ticket `10-art-sources-and-manifest.md` ("Art sources and the manifest"). That file does not exist; this file is ticket 10.

**sha256 pairs** (source in the Codex working copy, relative to `docs/visual-design/workshop/`; copy in `art-src/workshop/{id}.png`):

| id | Source | Source sha256 | Copy sha256 |
|---|---|---|---|
| blade-dancer | `figure-samples-2026-10-06/fast-fresh-guard.png` | `677cfca97380c9b0e0432798b229341a1ebe5deeb1f9c9db955b97b0fe7f610a` | `677cfca97380c9b0e0432798b229341a1ebe5deeb1f9c9db955b97b0fe7f610a` |
| ram-bastion | `figure-samples-2026-10-06/strong.png` | `73de8fe57bf07659a41c89bebb796e054cb482c2fec244d6476b2596e6108489` | `73de8fe57bf07659a41c89bebb796e054cb482c2fec244d6476b2596e6108489` |
| crossbow-warden | `figure-samples-2026-10-06/ranged-fresh.png` | `fc23c39f9414f991a69bdeca23afdce6cb10154806375d16f04860b2ddb1ee2a` | `fc23c39f9414f991a69bdeca23afdce6cb10154806375d16f04860b2ddb1ee2a` |
| lantern-witch | `figure-samples-2026-10-06/magic-fresh.png` | `baa3e28f4295d8d0c1e383eb55925e5c1e528c5a7cd8f417468cfea63b8b4e79` | `baa3e28f4295d8d0c1e383eb55925e5c1e528c5a7cd8f417468cfea63b8b4e79` |
| banner-keeper | `figure-samples-2026-10-06/support-fresh-cape.png` | `f5c4b12be4e6ee35806a55c2e717e36342fc70579f2ebb113a5a131c137b05de` | `f5c4b12be4e6ee35806a55c2e717e36342fc70579f2ebb113a5a131c137b05de` |
| javelin-runner | `figure-samples-2026-10-06/mixed-fresh.png` | `baca80ed9f3c6e8c760247ba1708f968f55ca058260bf79a2a8b12e2a485a9e8` | `baca80ed9f3c6e8c760247ba1708f968f55ca058260bf79a2a8b12e2a485a9e8` |
| wind-courier | `figure-batch-02/07-wind-courier-v2.png` | `94020d2983f55ac1649def0b70faa33f16e7264480359fc6aef3d06d9731e659` | `94020d2983f55ac1649def0b70faa33f16e7264480359fc6aef3d06d9731e659` |
| iron-warden | `figure-batch-02/08-iron-warden.png` | `aa4135526b37bf89d32a2900725035d142611df26d99c5f9b33719a87c5c7da5` | `aa4135526b37bf89d32a2900725035d142611df26d99c5f9b33719a87c5c7da5` |
| stone-slinger | `figure-batch-02/09-stone-slinger.png` | `31784dd5a2a8daf0aa9dd4474e312d7253ec00b4ac9dd4c6bdaac73051fc4016` | `31784dd5a2a8daf0aa9dd4474e312d7253ec00b4ac9dd4c6bdaac73051fc4016` |
| mirror-seer | `figure-batch-02/10-mirror-seer.png` | `44d315ced389200f654927e751b2288f049a4b1f2eff0b52172ee6346115c511` | `44d315ced389200f654927e751b2288f049a4b1f2eff0b52172ee6346115c511` |
| field-mender | `figure-batch-03/11-field-mender-v4.png` | `e3bdd01dd403880ad134121b0c9309c676f513afe398b49e2d37765023415ed1` | `e3bdd01dd403880ad134121b0c9309c676f513afe398b49e2d37765023415ed1` |
| antler-guardian | `figure-batch-03/12-antler-guardian-v2.png` | `f2b7fdad56199759970eab08d778281b248e65548660f9055acb77f6ac7cddd4` | `f2b7fdad56199759970eab08d778281b248e65548660f9055acb77f6ac7cddd4` |
| bell-sage | `figure-batch-03/15-bell-sage.png` | `dffac2c4c93f015b913f397e56fa97a9c37a7d4fd9b8dd9f1c02547ed39660a6` | `dffac2c4c93f015b913f397e56fa97a9c37a7d4fd9b8dd9f1c02547ed39660a6` |
| drum-marshal | `figure-batch-03/16-drum-marshal.png` | `1a2635297bfbb25e239c0103cd33bf2015573fd95294d4031c7cf36fa477d4dc` | `1a2635297bfbb25e239c0103cd33bf2015573fd95294d4031c7cf36fa477d4dc` |
| rooftop-vaulter | `figure-batch-04/17-rooftop-vaulter.png` | `c15b02cc149262543bdcbbab21004fb5fd4bd0a3545757e668a9a4cac73de0f5` | `c15b02cc149262543bdcbbab21004fb5fd4bd0a3545757e668a9a4cac73de0f5` |
| shell-bastion | `figure-batch-04/18-shell-bastion.png` | `0385ef1af8d0677145235f178cdca48737ff4b441bfde0ef6b7e431db9200fc6` | `0385ef1af8d0677145235f178cdca48737ff4b441bfde0ef6b7e431db9200fc6` |
| reed-hunter | `figure-batch-04/19-reed-hunter.png` | `4d78e01a27ddcd68e6993639ae33dbb2f02de471a91f018e3be0944bfed39089` | `4d78e01a27ddcd68e6993639ae33dbb2f02de471a91f018e3be0944bfed39089` |
| hourglass-keeper | `figure-batch-04/20-hourglass-keeper.png` | `68c4f6b1c7c4050ba1011eadb717a89c74340cb682dc4c1d3b13cd614aa9fa42` | `68c4f6b1c7c4050ba1011eadb717a89c74340cb682dc4c1d3b13cd614aa9fa42` |
| forge-bearer | `figure-batch-04/21-forge-bearer.png` | `8d05ff6d40ed153abdeae9907708399e6c6a1b05302310344cbc56a9fa7000a9` | `8d05ff6d40ed153abdeae9907708399e6c6a1b05302310344cbc56a9fa7000a9` |
| owl-archivist | `figure-batch-05/25-owl-archivist.png` | `ac18328cd7abf21c9c62a533ccad7b7372ff4cc43ff790b4278cb3083f56f912` | `ac18328cd7abf21c9c62a533ccad7b7372ff4cc43ff790b4278cb3083f56f912` |
| hare-scout | `figure-swarms/13-hare-scout-v5.png` | `4dd6dd329eead69eb410dfb92d46f7f434c9b38dc6358942b70f5cd634fd236a` | `4dd6dd329eead69eb410dfb92d46f7f434c9b38dc6358942b70f5cd634fd236a` |
| hornet-swarm | `figure-swarms/hornet-swarm-v2.png` | `81582e80f7b92bcb33659b6fd0535a7cda036d9974d1e7289d2557e80bb1d33c` | `81582e80f7b92bcb33659b6fd0535a7cda036d9974d1e7289d2557e80bb1d33c` |
| mechanical-spiders | `figure-swarms/mechanical-spider-swarm-v2.png` | `6c7e54442e76f09a8ef1b22fae0becb91b94fb26b17cd888265e6fb9d755fc81` | `6c7e54442e76f09a8ef1b22fae0becb91b94fb26b17cd888265e6fb9d755fc81` |
| dart-sentinel | `figure-final-run/dart-sentinel.png` | `13ac16137640809d9764bc530c7a6f945c71ab2b4ba82079c827519c42864d04` | `13ac16137640809d9764bc530c7a6f945c71ab2b4ba82079c827519c42864d04` |
| fox-pathfinder | `figure-final-run/fox-pathfinder.png` | `a4632bf3a903c4f6cad64557727a6a6139e3b4a848c6dc09566505c0985a8625` | `a4632bf3a903c4f6cad64557727a6a6139e3b4a848c6dc09566505c0985a8625` |
| eagle-keeper | `figures-machines-elements/eagle-keeper-v3.png` | `3115dd0fe48d486c0645ada6d3fb2cf203fedd278200675981fdf87f3bf94718` | `3115dd0fe48d486c0645ada6d3fb2cf203fedd278200675981fdf87f3bf94718` |
| tide-caller | `figures-machines-elements/tide-caller-shell-mask-v3.png` | `8aad465d67b79b6c35f7472eb5d62d3e08869bfa7ab07c867bf390c31cf74cf1` | `8aad465d67b79b6c35f7472eb5d62d3e08869bfa7ab07c867bf390c31cf74cf1` |
| wooden-catapult | `figures-machines-elements/wooden-catapult.png` | `1c02257e29f306614d3399c83660cf338821c40e61604e4bafb30082515f4eb4` | `1c02257e29f306614d3399c83660cf338821c40e61604e4bafb30082515f4eb4` |
| battering-ram | `figures-machines-elements/battering-ram.png` | `000e744a53fc34dd62ba11cffb89284814b2c0354536ba8d0174f1a13031c2ac` | `000e744a53fc34dd62ba11cffb89284814b2c0354536ba8d0174f1a13031c2ac` |
| drill-crawler | `figures-machines-elements/drill-crawler.png` | `ac6b7b60daf1b55c60ed3c87994d56d5b87bf3f2acf3580c9abf9802b0c06350` | `ac6b7b60daf1b55c60ed3c87994d56d5b87bf3f2acf3580c9abf9802b0c06350` |
| water-deity | `figures-machines-elements/water-deity.png` | `149c1c74b4b94f81c2cf5d627700d62cc45226ec6500f122c60b8418162ad23a` | `149c1c74b4b94f81c2cf5d627700d62cc45226ec6500f122c60b8418162ad23a` |
| fire-spirit | `figures-machines-elements/fire-spirit.png` | `eca7b96c189004dfb394d40fe9c2d0eb0972450627199963cffa2941f9d6c992` | `eca7b96c189004dfb394d40fe9c2d0eb0972450627199963cffa2941f9d6c992` |
| clay-golem | `figures-machines-elements/clay-golem.png` | `88bf7882f85aa3cd2b9724eceaeaf4a1fe780cc7c4c8b344d0562c326c95f87e` | `88bf7882f85aa3cd2b9724eceaeaf4a1fe780cc7c4c8b344d0562c326c95f87e` |
| storm-spirit | `figures-machines-elements/storm-spirit.png` | `f67cf856b7ad705ec4a93a0371f82f8e4c0c137b5aa6177247d746928b376577` | `f67cf856b7ad705ec4a93a0371f82f8e4c0c137b5aa6177247d746928b376577` |

Merger, 2026-10-07: merged into `claude/retro-2026-10-06` as 2a5a187. `npm test` in the integration worktree passes: the typecheck passes, vitest 38 files and 675 tests pass, the node tests 42 pass. The judge timeout ("never lowers W") did not occur in this run; it is intermittent and ticket workshop-finish/05 owns it. Open for the owner: the tide-caller v3 step (no hash proof) and the total line at the top of `art-src/MANIFEST.md`.
