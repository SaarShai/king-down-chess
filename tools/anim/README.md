# Animation tools

## Animation bank pipeline

One command makes an animation bank. It registers the key frames, makes the in-between frames, checks the result and
writes a preview. The tools are plain Node ESM, plus the retained alpha RIFE and Python Pillow.

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
- `--timing <json>` takes `{"durationMs":120,"frameMs":15}`. The default is 15 ms and 4 steps for each key gap.
  Each key gap must hold a power-of-two number of steps, because the midpoint recursion halves one gap at a time.
- `--kind` is `idle`, `turn`, `attack` or `movement`. A turn takes two facings (`SE-S`); other kinds take one.
- `--output` defaults to `<repo parent>/anim-out/<character>/<army>/<id>`, outside git.
- `--geometry <json>` takes a fixed geometry record. Normal runs read the locked geometry instead.

### Locked geometry

`tools/anim/geometry.mjs` reads the pivot, canvas, body height and board scale of one character and army. It prefers
`tools/anim/sources/<character>.json` when that file holds geometry. Otherwise it reads the shipped runtime manifest
`public/character-runtime/manifest.json` and records its SHA-256 as the authority. If the manifest is absent, it reads
the frozen catalog banks. Runtime values are half size; the tool converts them to source pixels.

A key that is already on the locked canvas, within 2 px of the pivot baseline and within 4 px of the body height,
keeps every pixel. This keeps shared endpoints byte-identical. A key that is not in place is scaled by body height and
its measured foot contact moves to the locked pivot.

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
3. `matte-halo`: the share of low-coverage edge pixels that sit on the interpolation matte stays under 30 percent.
   The shipped Pawn turns measure up to 12.8 percent (white) and 22.4 percent (black) with this screen. The screen
   catches extreme smearing only; look at the preview.
4. `geometry`: the bank pivot equals the locked pivot, and the first and last frames stand within 2 px of the baseline.
5. `endpoints`: the first and last frame hashes are shipped endpoints of the same character, army and turn edges.
6. `timing`: frame count, frame step, start time and end time match the plan.
7. `provenance`: every frame has a known method and a SHA-256.

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

### Private Kaggle movement run

`tools/anim/kaggle/stage.py` copies the frozen movement keys and checks the frame, bank and RIFE hashes. It writes one
private dataset archive. `kaggle.mjs` makes private GPU scripts with the dataset and the FILM model attached. It takes
`push`, `status` or `pull`, the Kaggle user, a zero-based part, the number of parts and a scratch directory. Use one or
two parts. Check the dataset is private before a push.

`run.py` makes the midpoint first, then the two quarter points for each key gap, including the wrap. RIFE moves
premultiplied color and alpha with its shared flow. FILM exposes motion fields but not its fusion weights; the script
warps both premultiplied inputs with those fields and blends them equally. Its output is a flow-based FILM variant,
not the RGB model's learned fusion. Both outputs keep alpha. The ghost score counts partly transparent pixels outside
the keys' soft edges as a share of visible pixels. Motion can also raise the score, so inspect the light and dark sheets.
`summary.py <pull directory>` ranks the scores. The results stay outside Git.

```
python3 tools/anim/kaggle/stage.py <catalog> <rife-runtime> <dataset-dir>
kaggle datasets create -p <dataset-dir>
node tools/anim/kaggle/kaggle.mjs push <user> 0 1 <scratch-dir>
node tools/anim/kaggle/kaggle.mjs status <user> 0 1 <scratch-dir>
node tools/anim/kaggle/kaggle.mjs pull <user> 0 1 <pull-dir>/part-0
python3 tools/anim/kaggle/summary.py <pull-dir>
```
