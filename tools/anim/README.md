# Animation tools

## Animation bank pipeline

One command makes an animation bank. It registers the key frames, checks the result and writes a preview. For other
kinds, it also makes in-between frames. The tools use Node ESM, Python and the retained alpha RIFE.

### Quick start

```
node tools/anim/bank.mjs make --character pawn --army white --kind turn --facing SE-S --keys <key folder>
```

The command prints one JSON line with the candidate bank path. A failed gate stops the command with a clear message
and writes `gates.json` for the reviewer.

Other commands:

```
node tools/anim/queue.mjs add --job <job.json>          # also: list, claim, done, fail, accept, reject
node tools/anim/dispatch.mjs --slots 2                  # claim queued jobs and run bank.mjs for each
node tools/anim/compare.mjs <candidate> --catalog <dir> # compare a rebuild with the shipped bank
node tools/anim/promote.mjs <candidate> --catalog <dir> # publish a green candidate into the frozen catalog
```

### Inputs

- `--keys <folder>` reads every `*.png` in name order. A comma list of files also works.
- `--timing <json>` takes `{"durationMs":120,"frameMs":15}`. For non-movement banks the default is 15 ms and 4 steps for each key gap.
  Each key gap must hold a power-of-two number of steps, because the midpoint recursion halves one gap at a time.
- `--kind` is `idle`, `turn`, `attack` or `movement`. A turn takes two facings (`SE-S`); other kinds take one.
- `--output` defaults to `<repo parent>/anim-out/<character>/<army>/<id>`, outside git.
- `--ghost-repair hold` replaces each in-between over the ghost limit with the nearest clean frame. Ties use the earlier frame.
- `--geometry <json>` takes a fixed geometry record. Normal runs read the locked geometry instead.

### Locked geometry

`tools/anim/geometry.mjs` reads the pivot, canvas, body height and board scale of one character and army. It prefers
`tools/anim/sources/<character>.json` when that file holds geometry. Otherwise it reads the shipped runtime manifest
`public/character-runtime/manifest.json` and records its SHA-256 as the authority. If the manifest is absent, it reads
the frozen catalog banks. Runtime values are half size; the tool converts them to source pixels.

A key that is already on the locked canvas, within 2 px of the pivot baseline and within 4 px of the body height,
keeps every pixel. This keeps shared endpoints byte-identical. A key that is not in place is scaled by body height and
its measured foot contact moves to the locked pivot.

Movement uses the shipped rest of the requested facing instead of the common idle geometry. Both ends must use that
same source frame. The runtime manifest supplies its pivot and display scale; the visible rest supplies the pose height
and baseline. The tool adds transparent padding around the rest and keys. Padding offsets and canvas dimensions are
even, so the runtime's half-size conversion keeps the same pixel grid. The runtime manifest must be available and match
its recorded hash. The current builder supports rests with no explicit board scale.

Movement uses authored keys only, at 120 ms per pose by default. The duration is `(keys - 1) * 120` ms.
Do not make blended in-betweens for movement (owner, 2026-10-30). The fit matches the head and shoulders,
sets one group scale to balance head size, seam height and seam body height, aligns head x, keeps each lowest row on the rest baseline,
and removes small alpha islands. The rest keys keep their pixels. The runtime should loop walking frames
1 through n-2 and show the standing pose only at the start and end. If a source repeats the rest inside
the sequence, the builder keeps it unchanged; remove that rest from the loop before use.
The head fit replaces the old 3 px foot-centre pin: the walking foot centre moves by a median 62 px by design.
The lowest row of every key still stays within 2 px of the standing ground line.

The movement fitter needs Python with NumPy and OpenCV (`opencv-python-headless`). Set `KINGDOWN_ANIM_PYTHON`
to that Python executable when `python3` does not have both packages. OpenCV provides the multi-scale template
match and connected-component cleanup used by the proven fit. The fit records each transform and match score.

### In-between frames

`rife.py` loads the retained RIFE network once and runs a plan of midpoints. Colour and alpha travel through the same
motion field as premultiplied channels. The tool checks the runtime manifest hash first.

The tool uses this Mac when it has a torch environment and `~/.cache/kingdown/rife`. Otherwise it uses the M1, but
only when the M1 has 15 GiB free. Set `KINGDOWN_RIFE_PYTHON`, `KINGDOWN_RIFE_RUNTIME`, `KINGDOWN_M1_SSH`,
`KINGDOWN_M1_RIFE_PYTHON` or `KINGDOWN_M1_RIFE_RUNTIME` to change the paths. `--machine local` or `--machine m1`
forces one machine.

### Gates

`bank.mjs make` runs these gates after the frames exist:

1. `rgba`: the PNG has an alpha channel.
2. `exterior`: every border pixel is transparent, alpha 0 exists, and a fully opaque pixel exists.
3. `matte-halo`: at most 30 percent of the low-coverage exterior edge may be near the interpolation matte and
   clearly closer to it than to the nearest opaque interior colour. This is a screen; look at the preview.
4. `ghost`: each in-between stays within 0.035 of the highest authored ghost score. The score counts semi-transparent
   pixels more than 3 px from the opaque body, divided by opaque pixels. This is a screen; look at the preview.
5. `geometry`: the bank pivot equals the locked pivot, and the first and last frames stand within 2 px of the baseline.
6. `steadiness` (movement): a recorded head template is matched again on the saved frames. Matches below 0.6 fail. Head x stays within 20 px
   inside the walk and at the start, end and loop seams. Head y stays within 4% of standing height between adjacent
   poses and at each seam. Head scale stays within 10%, including both standing seams and the loop. A body height
   difference over 8% at either standing seam fails.
7. `endpoints`: turns and other banks use shipped endpoint hashes. Movement compares each padded end pixel to the
   shipped facing rest at the same pivot, with only transparent pixels outside it.
8. `timing`: frame count, frame step, start time and end time match the plan.
9. `provenance`: every frame has a known method and a SHA-256.

### Output

```
<output>/bank.json          candidate bank in the catalog schema, status "candidate"
<output>/frames/NNN.png     RGBA frames
<output>/provenance.json    method, source hashes and registration transform for each frame
<output>/gates.json         gate results and measurements
<output>/previews/          light, dark, checkerboard and board GIFs at 160 px, plus a sheet
<output>/rife/              the interpolation plan, inputs, outputs and report
```

### Queue and dispatch

The queue is one JSON file (`/Users/za/Documents/king down chess (new)/anim-out/queue.json` by default). It uses one
lock file, so parallel workers claim each job once. A job holds `character`, `army`, `kind`, `facing`, `keys` and
optional `timing` and `output`. The dispatcher refuses to start below 30 GiB free on this Mac; set
`KINGDOWN_ANIM_MIN_FREE_GIB` to change that floor.

### Promotion

`promote.mjs` takes a candidate whose gates pass. It checks every frame hash and the locked geometry. It then calls
`publish_bank.py`, which holds the catalog's own `.catalog.lock`, copies the frames to content-hashed files, writes
the bank and updates the catalog manifest. A repeated promotion of the same candidate writes the same bank hash.

Promotion does not change `runtime-selection.json`. The owner re-pins the selection after review, and the next
`tools/build-character-runtime.mjs` run makes the bank public. Do not deploy from this tool.

### Tests

```
KINGDOWN_TEST_FILE=tools/animation-bank.test.ts npm test
KINGDOWN_TEST_FILE=tools/animation-queue.test.ts npm test
```

The tests cover the geometry source, the timing plan, registration, all gates, queue claims, dispatch, failure
records and promotion. They use a stub in-betweener and do not need RIFE, the M1 or the frozen catalog.

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
