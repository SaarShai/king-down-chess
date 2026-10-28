# 20 — Character banks in the game

Status: needs-review
Type: task

## Scope and result

The painted game uses the final 433 ready banks. It keeps rules, cards, promotion, board effects and king attacks at their existing boundaries. Drafts, repair banks and movement studies stay excluded. There is no deployment.

`runtime-selection.json` pins catalog SHA-256 `8bccd8fc9c0493ee431953c7fa65d5074cffd4ac201c139dd9cfb4f1f530459a`. `runtime-effects.json` separately pins the published Archer arrow and smoke, Maester beam and Queen thorns, their native sprites and exact review receipts. The receipts include the ready fragment, source hashes and passing alpha audit.

## Plan and acceptance

1. Build a pinned package without changing frozen source bytes. Check status, bank hashes, PNG hashes and decoded alpha.
2. Prove Pawn and Knight in the actual game, then use the same schema for the ready cast.
3. Keep each frame proportional and grounded at its authored pivot. Preserve timing, both armies and separate effect cues.
4. Check joins, idle variations, forward and exact reverse turns, cancellation, undo, reduced motion, loading, network requests and retained decoded bytes.
5. Complete independent review before a pull request. Keep the generated package until its main-checkout copy passes hash checks.

## Runtime

- Selected figures alternate accepted idle variations after each complete loop. Different rest facings use ready turn edges. Other figures show a neutral drawing. A ready turn endpoint supplies that drawing when no ready idle exists; the source bank and frame hashes remain available.
- Turns follow only ready edges. The return reverses the exact outward frames, including an antipodal turn.
- Connected endpoint components share registration scale. Identical endpoint bytes have identical pivots and projection. Disconnected native resolutions keep their own registration. Per-pose preview magnification stays as source metadata.
- Actors keep the authored frame proportions. Victims retain the existing squash, spin and shrink transforms.
- Native effects use authored anchors through the same pivot and uniform projection as the body. Queen thorns continue after body rest; victim reaction follows effect contact. Archer smoke has an independent clock.
- Position changes, skip, undo and disposal invalidate pending actions. Reduced motion also cancels a move still loading frames. A late catalog or frame cannot restart an old move.
- Six body decode slots and a small frame window avoid full-cast decoding. The retained 64 MiB budget includes body images and reserved native effect textures. Missing optional data leaves a coherent game figure.

## Build and delivery

Run from the app checkout:

```sh
node tools/build-character-runtime.mjs --source /path/to/consolidated-animations
npm run build
```

The output is `public/character-runtime/`. The exporter checks the pinned catalog before it writes a new manifest. Each body PNG has half the native width and height. Canvas, pivot and target coordinates change by the same factor. Recorded times and visible intervals do not change. Valid derived files can be reused only after source/output hash, dimensions and alpha checks. Native effect sprites and original module bytes are retained; the smoke module's only adapter changes its texture URL and permits a shared decoded texture. Exact original bytes and hashes remain in its provenance.

The final bundle has 4,904 derived body assets and 4,935 total files: 485,640,665 bytes. Its manifest SHA-256 is `24e7af85463b87c84b50334a07d513d0bc2942fd04ad90d6fd16860dd13e8064`. The complete bundle is retained in this worktree's `public/character-runtime/` and copied to the main app checkout's `public/character-runtime/`. The parent task verifies every copied file hash before any worktree cleanup.

Generated media stays out of Git. A clean checkout without this package uses the existing game art. The website build detects package presence. **Exporting or restoring the verified package before the website build is required to deploy these animations. Code CI alone does not publish the assets.** Runtime URLs stay within the local content-addressed package; no producer worktree is fetched. No deploy is authorized here.

## Evidence

- `KINGDOWN_TEST_FILE='**/{character-runtime,character-runtime-package,PaintedView,scene-load,motion-concepts}.test.ts' npm test` passes type checks, 58 selected tests and 67 existing node checks. This is not a full-suite pass. The new tests cover exact reversed return, full idle loops, pre-load rest lookup, component joins, different native resolutions, cache integrity, retained pixel budget and a reduced-motion toggle during deferred preparation.
- `npm run check:browser character-runtime` passes the actual game in 56.9 seconds. Both armies, a flipped board, the 32-piece ready cast, all king designs, reduced motion, cancellation and actual Undo restoration are covered. Native raster draws are checked at release, contact, last fade and expiry. Queen has 24 thorn draws after its body reaches exact rest; the victim stays unchanged until effect contact. Mid-flight cancellation removes the travelling effect.
- The 32-piece board requests 21 runtime files and 4,381,767 bytes. The largest sampled move adds 52 requests and 4,068,493 bytes. The check limits initial runtime load to 40 requests / 8 MiB and one move to 180 requests / 16 MiB. It does not download the whole bundle eagerly.
- Maximum measured retained runtime pixels, including native effect textures, are 66,652,808 bytes, below 64 MiB. Pawn and Knight edges pass a four-background visual check for both armies.
- Browser screenshots and JSON are under the local check output `character-runtime-integration-cOjhvv/character-runtime/`. The parent task inspects the native contact, post-body-return and fade images.
- Independent review resolves victim transforms, exact reversed return, component scale, late-catalog rest caching, exporter initialization order and reduced-motion preparation cancellation. The source recheck confirms those fixes.

## Limits

The source art remains subject to its recorded review status. Existing king attack art and movement behavior remain in use. The full generated bundle is local delivery data, not a committed asset publication. CI and merge remain with the parent task.
