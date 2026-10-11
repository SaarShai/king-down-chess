# Scroll roller review

Review task for [ticket 02](../../../issues/02-visual-sample.md).
Status: Ready for the owner's choice.

The owner selects one scroll. Nothing replaces `sample/art/scroll.webp` before that choice.

## Candidates

| Id | Direction | WebP bytes | Prompt and attempt notes |
|---|---|---:|---|
| current | Glossy brass reference | 31,294 | Use the current scroll master. This is the reference for the matte edits. |
| bronze | Matte aged bronze | 27,306 | The prompt asks for muted brown-green bronze. Its finish refinement removes bright cap spots and narrow gold collar stripes. |
| wood | Matte dark walnut | 27,798 | The prompt asks for dry walnut on all hardware. Keep the turned shapes, soft grain, and cream parchment. |
| woodcap | Warm wood with dark bronze caps | 28,602 | The prompt asks for wood cylinders and dull brown bronze caps. Keep the shapes fixed. Remove bright gold rims and glints. |

The source masters are in `art-src/chatgpt-mvp/` in the main checkout. The reference uses `scroll.png`. The other files use `candidates/scroll-<id>.png`. Each candidate has a matching `.prompt.txt`. The notes above come from those files.

## Plan and checks

1. Make four web copies. Check their size and alpha.
2. Render each copy in the profile screen. Check each render.
3. Make the comparison. Check the finish, parchment, edges, and joins.
4. Restore all sample files. Commit only this folder. Push the branch.

Steps 1 to 3 pass. The sample files match Git after restoration. The owner reviews the files before a change to the sample art.

## How the files are made

Sharp resizes each PNG master to 512 × 768 with Lanczos3. It writes WebP with `quality: 85`, `alphaQuality: 100`, and `effort: 6`. It keeps the canvas and alpha. The decoded alpha matches the resized master exactly. All four files stay within 12% of the current sample's 30,870 bytes.

For each id, copy `scroll-<id>.webp` to `sample/art/scroll.webp`. Run this command from the worktree root:

```sh
node docs/specs/chatgpt-mvp/sample/render.mjs profile
```

Copy the phone and desktop PNGs here as `profile-<id>-phone.png` and `profile-<id>-desktop.png`. The phone viewport is 390 × 844 at DPR 2. Its PNG is 780 × 1,688. The desktop PNG is 1,440 × 900. The renderer also checks the 400 × 900 panel. Each id passes all three sizes with no page, file, text, or sideways-scroll fault. The renderer uses a 256-colour palette for its PNGs.

Sharp makes [compare.png](compare.png), at 2,496 × 1,690. Each labelled column holds one phone render at 390 × 844. The current scroll comes first. The second row shows the same top-right roller crop and the full painted Guard beside it. The crop starts at x=430, y=8 in each WebP. It measures 66 × 90 and becomes 132 × 180. `public/ui/pieces/guard-w.webp` measures 236 × 320 and becomes 472 × 640. Both assets use 2× scale and Lanczos3. A light cream background shows their alpha edges.

Restore the sample with:

```sh
git checkout -- docs/specs/chatgpt-mvp/sample/art/scroll.webp docs/specs/chatgpt-mvp/sample/png/ docs/specs/chatgpt-mvp/sample/contact-sheet.png docs/specs/chatgpt-mvp/sample/compare.png
```

Only the four WebPs, eight profile PNGs, comparison, and this README enter the commit. The repository push hook runs `npm test` before the push.

## Visual checks

- All three candidates reduce the bright brass finish.
- Woodcap changes the cream wraps on both rollers to brown wood. This is clear in the profile renders.
- All three candidate masters have small parchment colour and texture changes. The parchment is not pixel-identical to the current master.
- No clear new halo or join seam shows in the renders or the detail crops.
- The desktop sheet clips part of the bottom roller in all four renders. This also occurs with the current scroll.
- The render palette makes some parchment shading appear in blocks. This occurs in all four renders.
