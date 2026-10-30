# Animation tools

## Army color adaptation

Adapt a finished bank with the approved rest masters for the same character:

```sh
node tools/anim/recolor.mjs --character pawn --from white --to black --bank white-turn-SE-S --out /tmp/pawn-black
```

`--bank` is a selected bank ID, a manifest path, or a directory with
`manifest.json`. The default catalog root is the consolidated preview in this checkout. In a
worktree, the command also checks the main checkout for the frozen media. The
media is not in Git. Use `--catalog-root` for a different catalog location. The command checks the pinned catalog, selected rest
banks, master hashes, and each source frame hash. The source records are in
`sources/`.

The Python environment needs Pillow, NumPy, SciPy, and scikit-image. Set
`KINGDOWN_ANIM_PYTHON` to its Python executable when `/usr/bin/python3` does not
have those packages. The command creates a new output directory. It writes a
mapping, RGBA frames, a manifest, and frame hashes. It keeps frame times and
alpha. The gate checks the exterior and the low-alpha edge next to the solid
body. Inspect all frames on light and dark squares for halos and color errors.
The output needs visual review. Effects and multiple tracks need separate work.
The focused mapping tests need the same Python packages. They skip when the
packages are absent.
