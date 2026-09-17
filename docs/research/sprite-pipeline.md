# Sprite pipeline: PSD sculpt renders to pixel billboards

How the miniature renders in `3d files/imgs/colored/` become the piece billboards, what
settings won the comparison, and how to use the result in the three.js board.

Contact sheets: [`sprites/`](sprites/). Source PSDs are read-only; nothing here writes to
`public/`.

---

## 1. What the source actually is

Checked before writing any recipe. Three facts changed the pipeline:

| Check | Result | Consequence |
|---|---|---|
| PSD background | **Already transparent.** Corner pixel is `srgba(255,255,255,0)` | No white keying. The "key it out without eating the rim" step is not needed. |
| Alpha-safe downscale | IM7 `-resize` is alpha-correct. 0% of edge pixels show white bleed; edge RGB (0.29, 0.50, 0.65) is *darker* than the core (0.45, 0.65, 0.77), which is the sculpt's shaded rim | No premultiply step. `-alpha associate … -alpha disassociate` actively **breaks** these files (RMSE 0.44, alpha forced opaque). |
| Source height | **266–466 px trimmed**, not ~1000 px | 128 px is a 2.1–3.6x downscale. Above ~128 px there is no source detail left to win. |

Per-piece trimmed size (blue):

```
Pawn-1 210x313   Knight-1 251x372  Bishop 207x334  Rock   331x402
Queen  207x331   King-Ice 275x466  Archer 204x307  Paladin 256x266
Guard  263x303   Maester  240x288  Beast  260x373
```

The renders are framed per piece, so their pixel sizes carry **no** shared world scale.
Normalise every sprite to one pixel height and let the renderer apply relative size —
which is exactly what `TARGET_HEIGHT` in `src/render/voxels.ts` already does. See §5.3
for the refinement.

---

## 2. The recipe

Four stages. Stages 3 and 4 are the ones under test.

1. **Flatten and trim** — `file.psd[0]` is the flattened composite; `-trim +repage` crops
   to the alpha bounding box, so the bottom edge of the image is the bottom of the base
   disc. That is the billboard's ground contact point.
2. **Tone boost, at source resolution** — `-sigmoidal-contrast 4,50% -modulate 102,140`.
   The renders are single-hue clay with soft AO; untouched they turn to mush at 64 px and
   below. Applied before the downscale so it shapes real detail rather than resample noise.
3. **Box downscale** — `-filter Box -resize x{H}`. True area averaging, crisp.
4. **1 px outline, after the downscale** so it is exactly one pixel at the shipped size.
   Dilate the alpha, flood it with the outline colour, composite underneath.

Then `-depth 8`. This is not cosmetic: `-sigmoidal-contrast` promotes the pipeline to
16-bit, which **doubled every PNG** (the h128 overview sheet went 1.00 MB → 221 kB once
fixed) for no visible gain, and the GPU discards the extra bits anyway.

### Outline colour

Hue-matched per army, not black. A flat near-black outline turns thin pieces (Bishop,
Archer) into blobs; a warm brown outline disappears into the dark board tile.

```
blue #0a1626   red #260c0a   green #0a1c10   purple #180a26   grey #121214
```

These are the *second* set. The first pass used lighter values (`#10243d`, `#3d1410`, …)
and red-on-dark failed — dark maroon sits too close to the `#3b2a20` tile in both hue and
value. Every colour is now well below both tile luminances.
See [`sprites/sheet-armies-h96-outline.png`](sprites/sheet-armies-h96-outline.png), which
shows all five armies on **both** tiles: a checkerboard would only ever show each colour
against one, hiding the red-on-dark and grey-on-light worst cases.

### Regenerate everything

```bash
#!/usr/bin/env bash
# King Down Chess - PSD -> pixel sprite pipeline + contact sheets. Idempotent.
set -euo pipefail

SRC="${SRC:?path to 3d files/imgs/colored}"
OUT="${OUT:-docs/research/sprites}"
TMP="${TMP:-$(mktemp -d)}"
FONT="/System/Library/Fonts/Supplemental/Arial Bold.ttf"

DARK='#3b2a20'   # dark board tile
LITE='#d9a066'   # light board tile
CHROME='#15120f' # sheet background / label bars

PIECES=(Pawn-1 Knight-1 Bishop Rock Queen King-Ice Archer Paladin Guard Maester Beast)
LABELS=(Pawn Knight Bishop Rook Queen King Archer Paladin Guard Maester Beast)
HEIGHTS=(48 64 96 128)
TREATMENTS=(full outline dither32 flat16)

# Tone boost at source resolution. The clay renders are low-contrast single-hue;
# without this they mush at <=64 px.
BOOST=(-sigmoidal-contrast 4,50% -modulate 102,140)

outline_colour () {
  case "$1" in
    blue)   echo '#0a1626' ;; red)    echo '#260c0a' ;;
    green)  echo '#0a1c10' ;; purple) echo '#180a26' ;;
    grey)   echo '#121214' ;;
  esac
}

src_path () { # $1=stem $2=colour   (grey masters use an upper-case .PSD extension)
  if [ "$2" = grey ]; then echo "${SRC}/$1.PSD"; else echo "${SRC}/$1-$2.psd"; fi
}

# make_sprite <stem> <colour> <height> <treatment> <dest.png>
make_sprite () {
  local stem="$1" col="$2" h="$3" treat="$4" dest="$5" in ocol
  in="$(src_path "$stem" "$col")"; ocol="$(outline_colour "$col")"

  # Flattened composite -> trim -> tone boost -> box (area) downscale.
  # PSD backgrounds are already transparent and IM7's resize is alpha-correct,
  # so there is no white-keying and no premultiply step.
  magick "${in}[0]" -alpha on -background none -trim +repage \
    "${BOOST[@]}" -filter Box -resize "x${h}" +repage "${TMP}/_s.png"

  # 1 px hue-matched outline, AFTER the downscale so it is exactly one pixel.
  if [ "$treat" != full ]; then
    magick "${TMP}/_s.png" \
      \( +clone -channel A -morphology Dilate Octagon:1 +channel \
         -fill "$ocol" -colorize 100 \) \
      -compose DstOver -composite +repage "${TMP}/_s.png"
  fi

  # Optional quantisation. Alpha is pulled out first: quantising RGBA together
  # invents semi-transparent palette entries that fringe badly under alphaTest.
  case "$treat" in
    dither32) q=(-dither FloydSteinberg -colors 32) ;;
    flat16)   q=(+dither -colors 16) ;;
    *)        q=() ;;
  esac
  if [ ${#q[@]} -gt 0 ]; then
    magick "${TMP}/_s.png" \
      \( +clone -alpha extract -write "mpr:A" +delete \) \
      -alpha off "${q[@]}" \
      "mpr:A" -alpha off -compose CopyOpacity -composite +repage "${TMP}/_s.png"
  fi

  # -depth 8: sigmoidal-contrast promotes the pipeline to 16 bit, which doubles
  # PNG size for no visible gain and is discarded by the GPU anyway.
  magick "${TMP}/_s.png" -depth 8 -strip -define png:compression-level=9 "$dest"
}

# make_row <colour> <height> <treatment> <dest.png>  -- 11 pieces on a checkerboard
make_row () {
  local col="$1" h="$2" treat="$3" dest="$4"
  local tile=$(( (h * 135) / 100 ))   # board tile ~1.35x sprite height
  local pad=$(( tile / 12 ))          # keep the base off the tile edge
  local n=${#PIECES[@]} w=$(( tile * ${#PIECES[@]} )) cells=() i
  for (( i=0; i<n; i++ )); do
    make_sprite "${PIECES[$i]}" "$col" "$h" "$treat" "${TMP}/_p${i}.png"
    magick "${TMP}/_p${i}.png" -background none \
      -gravity South -splice "0x${pad}" -gravity South -extent "${tile}x${tile}" \
      +repage "${TMP}/_c${i}.png"
    cells+=("${TMP}/_c${i}.png")
  done
  magick -size "${tile}x${tile}" xc:"$LITE" xc:"$DARK" +append \
         \( +clone -flop \) -append -write "mpr:chk" +delete \
         -size "${w}x${tile}" tile:"mpr:chk" "${TMP}/_bg.png"
  magick "${cells[@]}" +append "${TMP}/_fg.png"
  magick "${TMP}/_bg.png" "${TMP}/_fg.png" -gravity NorthWest -compose over -composite "$dest"
}

make_names () { # $1=tile $2=dest
  local tile="$1" dest="$2" parts=() i
  for (( i=0; i<${#LABELS[@]}; i++ )); do
    magick -size "${tile}x18" xc:"$CHROME" -font "$FONT" -fill '#b9a892' \
      -pointsize 11 -gravity center -annotate +0+0 "${LABELS[$i]}" "${TMP}/_n${i}.png"
    parts+=("${TMP}/_n${i}.png")
  done
  magick "${parts[@]}" +append "$dest"
}

title_bar () { # $1=width $2=text $3=dest
  magick -size "${1}x24" xc:"$CHROME" -font "$FONT" -fill '#e8d9c4' \
    -pointsize 13 -gravity West -annotate +10+0 "$2" "$3"
}

mkdir -p "$TMP" "$OUT"

# 1. the 16 per-variant sheets
for h in "${HEIGHTS[@]}"; do
  tile=$(( (h * 135) / 100 )); w=$(( tile * ${#PIECES[@]} ))
  make_names "$tile" "${TMP}/_names_${h}.png"
  for t in "${TREATMENTS[@]}"; do
    make_row blue "$h" "$t" "${TMP}/row-${h}-${t}.png"
    title_bar "$w" "h${h} · ${t} · blue   (1:1, on ${DARK} / ${LITE} board tiles)" "${TMP}/_t.png"
    magick "${TMP}/_t.png" "${TMP}/row-${h}-${t}.png" "${TMP}/_names_${h}.png" -append \
      -bordercolor "$CHROME" -border 6 "${OUT}/sheet-h${h}-${t}-blue.png"
  done
done

# 2. one all-treatment overview per height (the sheets you actually decide from)
for h in "${HEIGHTS[@]}"; do
  tile=$(( (h * 135) / 100 )); w=$(( tile * ${#PIECES[@]} )); stack=()
  for t in "${TREATMENTS[@]}"; do
    title_bar "$w" "$t" "${TMP}/_tt-${t}.png"
    stack+=("${TMP}/_tt-${t}.png" "${TMP}/row-${h}-${t}.png")
  done
  title_bar "$w" "KING DOWN CHESS · sprite height ${h} px · blue · 1:1" "${TMP}/_th.png"
  magick "${TMP}/_th.png" "${stack[@]}" "${TMP}/_names_${h}.png" -append \
    -bordercolor "$CHROME" -border 6 "${OUT}/sheet-h${h}-all-blue.png"
done

# 3. army comparison. Every army on BOTH tiles: red-on-dark and grey-on-light are
#    the worst-case pairings and a checkerboard shows each colour on only one.
ARMY_PIECE=Knight-1; ARMY_H=96
tile=$(( (ARMY_H * 135) / 100 )); cells=(); names=()
for c in blue red green purple grey; do
  make_sprite "$ARMY_PIECE" "$c" "$ARMY_H" outline "${TMP}/_a-${c}.png"
  magick "${TMP}/_a-${c}.png" -background none -gravity South -splice "0x$((tile/12))" \
    -gravity South -extent "${tile}x${tile}" +repage "${TMP}/_ac-${c}.png"
  cells+=("${TMP}/_ac-${c}.png")
  magick -size "${tile}x18" xc:"$CHROME" -font "$FONT" -fill '#b9a892' -pointsize 11 \
    -gravity center -annotate +0+0 "$c" "${TMP}/_an-${c}.png"
  names+=("${TMP}/_an-${c}.png")
done
w=$(( tile * 5 ))
magick "${cells[@]}" +append "${TMP}/_afg.png"
magick -size "${w}x${tile}" xc:"$DARK" "${TMP}/_afg.png" -gravity NorthWest -composite "${TMP}/_adark.png"
magick -size "${w}x${tile}" xc:"$LITE" "${TMP}/_afg.png" -gravity NorthWest -composite "${TMP}/_alite.png"
magick "${names[@]}" +append "${TMP}/_anames.png"
title_bar "$w" "${ARMY_PIECE} · h${ARMY_H} · outline · 4 armies + grey master" "${TMP}/_at.png"
title_bar "$w" "on dark tile ${DARK}" "${TMP}/_atd.png"
title_bar "$w" "on light tile ${LITE}" "${TMP}/_atl.png"
magick "${TMP}/_at.png" "${TMP}/_atd.png" "${TMP}/_adark.png" \
       "${TMP}/_atl.png" "${TMP}/_alite.png" "${TMP}/_anames.png" -append \
  -bordercolor "$CHROME" -border 6 "${OUT}/sheet-armies-h96-outline.png"

# Keep every sheet under 400 kB. 8-bit alone gets all but the largest overview there.
for f in "${OUT}"/sheet-*.png; do
  magick "$f" -depth 8 -strip -define png:compression-level=9 "$f"
  if [ "$(stat -f%z "$f")" -gt 409600 ]; then
    magick "$f" -depth 8 +dither -colors 256 -strip -define png:compression-level=9 "$f"
  fi
done
```

To emit a shipping set instead of sheets, call `make_sprite` directly — nothing else is
needed:

```bash
for c in blue red; do
  for i in "${!PIECES[@]}"; do
    make_sprite "${PIECES[$i]}" "$c" 96 outline \
      "public/sprites/blue-red/$(echo "${LABELS[$i]}" | tr A-Z a-z)-w.png"
  done
done
```

---

## 3. What the sheets show

Read at 1:1. Each row is 11 pieces on real `#3b2a20` / `#d9a066` board tiles.

**Outline is the decisive variable, not size.** In every `full` row the pale pieces —
Bishop, Queen, Archer, Maester — lose their edge against the light tile. The robe hems
dissolve into the tan. With the outline every piece holds a silhouette on both tiles.
At 48 px this is the difference between a readable board and a smudge.

**Quantisation is strictly dominated. Drop it.** Measured, 11 pieces x 5 armies:

| Height | full | outline | dither32 | flat16 |
|---|---|---|---|---|
| 48 | 175 kB | 185 kB | 129 kB | 82 kB |
| 64 | 278 kB | 292 kB | 227 kB | 118 kB |
| **96** | 531 kB | **555 kB** | 507 kB | 197 kB |
| 128 | 852 kB | 887 kB | 790 kB | 381 kB |

- `dither32` saves **9%** at h96 and adds visible Floyd-Steinberg speckle across the smooth
  AO gradients — worst on the Queen's gown and the Guard's armour. Under `NearestFilter`
  that speckle magnifies into dirt, not into pixel art. No upside at any size.
- `flat16` saves ~64% but bands the gradients and eats the outline in patches, because
  16 slots cannot hold one hue ramp *and* a distinct outline value. The Rook loses its
  rock texture entirely.
- Neither saves a byte of **VRAM** — a decoded texture is 4 bytes/px whatever the palette
  was. Quantisation only ever buys download, and 555 kB is already nothing.

**Height.** 48 px keeps all 11 silhouettes distinct but loses faces. 64 px brings faces
back marginally. 96 px reads comfortably: faces, weapons, armour plates. 128 px is a
detailed illustration where the pixel grid has stopped being the texture — and, given
266–466 px sources, close to the point of diminishing returns.

---

## 4. Recommendation

**Billboards on a ~1000 px board: `h96`, 1 px hue-matched baked outline, full colour, no
quantisation.** That is [`sheet-h96-outline-blue.png`](sprites/sheet-h96-outline-blue.png).

Why 96 and not 128: with `RenderPixelatedPass(2)` the scene renders into a half-size
buffer, so a 1000 px-wide board is 62.5 render px per world unit. Times the current
`TARGET_HEIGHT x 1.15`, pieces land at **61 px (Pawn) to 111 px (King)** of render
resolution. 96 px brackets that range tightly. 128 px means every piece is minified, and
minification under `NearestFilter` with no mipmaps drops texel rows unevenly — a line of
the Queen's gown vanishes and reappears as the camera moves. On a typical 900 px-tall
canvas the range is 85–114 px, so 96 holds there too.

**Phones: `h48`, same outline, full colour.** In portrait the frustum fits the *narrow*
axis (`vw = 9.4`), so a 390 px-wide viewport is ~41.5 screen px per unit, halved again by
`pixelSize: 2` → pieces render **20–37 px** tall. Anything above ~64 px is pure download
and shimmer. The outline is not optional here: the `full` row at h48 is where the pale
pieces disappear completely against the light tile.

The treatment is identical at both sizes, so one pipeline and one flag serves both.

---

## 5. three.js integration

`src/render/sprites.ts` already implements most of this. Notes below confirm what is
right, and flag three things that are not.

### 5.1 Upright plane vs camera-facing

An upright quad yawed to the camera keeps the standee "lean" but is foreshortened by
`cos(pitch)` — at the home pitch of 37.5° that is 0.79x, which destroys any texel-to-pixel
match. A quad whose normal is the camera's forward vector is undistorted and pixel-exact.

Current code takes the second option but bakes it as a constant:

```ts
const PITCH = Math.atan2(8.05, 10.5);
mesh.rotation.x = -PITCH;
mesh.rotation.y = flipped ? Math.PI : 0;
```

**This is a bug once the camera moves.** `OrbitControls` is live with
`minPolarAngle 0.25`, `maxPolarAngle 1.25` and `minZoom 0.7 / maxZoom 3`, so the user can
orbit away from the home pose while every billboard stays pinned at the home pitch —
pieces shear and lean wrong. Track the camera per frame instead:

```ts
// full billboard: undistorted at any orbit angle
mesh.quaternion.copy(camera.quaternion);
```

Keep the fixed constant only if the orbit is locked. If you want the lean back, yaw only
and counter-scale to recover the pixel height:

```ts
mesh.rotation.set(0, cameraYaw, 0);
mesh.scale.y = 1 / Math.cos(cameraPitch);
```

### 5.2 Pivot at the base

Already correct, and worth keeping exactly as is:

```ts
const g = new THREE.PlaneGeometry(w, h);
g.translate(0, h / 2, 0);   // bottom edge at y=0
```

Put the offset on the **geometry**, not on `mesh.position`. Then `mesh.position` is
literally the square centre, and `scale.y` grows the sprite upward from its feet — which
is what makes squash-and-stretch (§5.7) work without a second transform. Because
`-trim` crops to the alpha bounding box, the image's bottom row *is* the bottom of the
base disc, so the quad's bottom edge sits on the board plane. Sink it 1–2 px if the tiles
have thickness and the disc looks like it hovers.

### 5.3 One authored height, or constant texel size

Current code authors every sprite at 130 px and then scales the quad by
`TARGET_HEIGHT[t] * 1.15` world units — Pawn 0.85, King 1.55. The two multiply out to a
**texel size that varies 1.8x across the set**: the King's pixels are nearly twice the
Pawn's on screen. In pixel art that reads as a mixed-resolution set.

Fix in the pipeline, not the renderer — author each piece at a constant pixels-per-world-
unit instead of a constant height:

```bash
PPU=64   # render px per world unit; 62.5 at a 1000 px board with pixelSize 2
h=$(python3 -c "print(round($PPU * $TARGET_HEIGHT * 1.15))")
make_sprite "$stem" "$col" "$h" outline "$dest"
```

At `PPU=64` that gives Pawn 63, Rook/Beast 77, Knight/Guard/Maester 81, Archer 85,
Bishop 88, Paladin 96, Queen 103, King 114 — every piece texel-1:1 at the default zoom,
and one consistent pixel size across the board. `h96` is the midpoint of that band, which
is why it is the right single number if you keep a flat height.

### 5.4 alphaTest vs blending

Already correct:

```ts
new THREE.MeshBasicMaterial({ alphaTest: 0.5, transparent: false, side: THREE.DoubleSide })
```

`alphaTest` writes depth, so 32 overlapping pieces sort themselves in the depth buffer
with no back-to-front pass and no piece drawing through another. Blending would need
sorting and `depthWrite: false`, which on a board this dense goes wrong immediately.

The hard cut `alphaTest` makes is normally a cost — it clips the anti-aliased rim. Here
the baked outline *is* the rim, so the clip lands on dark ink and reads as deliberate.
**The outline is what makes `alphaTest` safe.** Keep them together.

`side: DoubleSide` is required, because the flip in §5.6 inverts the winding.

Use blending only for a genuine overlay — a ghost piece or a move preview — on its own
material with `transparent: true, depthWrite: false` and a higher `renderOrder`.

### 5.5 NearestFilter and no mipmaps

Already correct:

```ts
tex.magFilter = tex.minFilter = THREE.NearestFilter;
tex.generateMipmaps = false;
tex.colorSpace = THREE.SRGBColorSpace;
```

`minFilter` matters as much as `magFilter` — three's default is
`LinearMipmapLinearFilter`, which builds mipmaps and blurs the sprite the moment it is
minified at all. Also set `tex.anisotropy = 1` and leave wrapping at `ClampToEdge`
(non-power-of-two textures are fine in WebGL2 only without mipmaps).

`renderer.setPixelRatio(1)` is already set, which is the other half: a fractional device
pixel ratio would break the texel-to-pixel mapping whatever the filter says. If you ever
raise it, use `Math.floor(devicePixelRatio)`, never the raw value.

### 5.6 Baked outline vs shader outline

Bake the **army** outline — it is identity, it never changes, it costs nothing at runtime,
and it is what keeps `alphaTest` clean (§5.4). Already done in the shipped set: measured
edge-to-interior luminance ratio is 0.43–0.48, against 0.86 for an un-outlined render.

Use a runtime outline only for **state** the texture cannot know — selected, in check, a
legal target. Two options:

- *Backing quad*, the lazy one: draw the same geometry again behind the piece, flat
  colour, scaled up by `1 + 2 / spriteHeightPx`. One extra draw call, no custom material.
  Because the pivot is at the base it grows upward, so the halo is thicker over the head
  than under the feet — fine for a highlight, wrong for a true outline.
- *Shader outline*, when it must be even: sample alpha at ±1 texel in the fragment shader
  and emit the outline colour where the centre is below `alphaTest` and a neighbour is
  above. Gives a constant 1 px outline at any zoom and a uniform-driven colour. Reach for
  this only if the backing quad looks wrong.

### 5.7 Flipping for the black side

Current code yaws the plane by π:

```ts
mesh.rotation.y = flipped ? Math.PI : 0;
```

With `side: DoubleSide` this shows the back face, i.e. a mirrored sprite — which is the
intent, so both players see pieces facing them. `mesh.scale.x = -1` is equivalent and
composes better with the per-frame billboard of §5.1, since it survives
`quaternion.copy(camera.quaternion)` overwriting the rotation. Prefer it:

```ts
mesh.quaternion.copy(camera.quaternion);
mesh.scale.x = flipped ? -1 : 1;   // needs side: DoubleSide
```

Do **not** mirror via `tex.repeat.x = -1; tex.offset.x = 1`. That is texture state, so it
is shared by every piece using that texture and breaks outright once sprites share an
atlas. Mirroring belongs on the mesh.

One cosmetic note: the sculpts are lit from one side, so a mirrored piece is lit from the
other. At 48–96 px on a single-hue render this is invisible; only worth fixing if the
armies ever get multi-colour paint.

### 5.8 Animation

The PSDs give **one pose per piece**. Everything below except frame swaps works today;
frame swaps need new renders from the sculpt source.

**Frame swaps (attack, hit).** Pack poses into a horizontal strip and step the UV window:

```ts
tex.repeat.x = 1 / frameCount;
tex.offset.x = frame / frameCount;   // frame widths must be whole texels
```

`offset`/`repeat` are per-**texture** state, so a shared atlas cannot animate two pieces
independently. Use `texture.clone()` per piece — it shares the GPU image and the memory,
and keeps its own offset. With `NearestFilter` and no mipmaps there is no neighbour
bleed as long as offsets land on exact texel boundaries, so no padding is needed.

**Squash and stretch.** Pure transform, no texture work, and it is why the pivot is at the
base (§5.2) — the feet stay planted:

```ts
// pick up: stretch. land: squash, then ease back.
mesh.scale.set(0.97, 1.06, 1);  // ~90 ms
mesh.scale.set(1.08, 0.90, 1);  // ~70 ms on impact
mesh.scale.set(1.00, 1.00, 1);  // ~140 ms ease out
```

Keep it volume-preserving (`x ≈ 1/√y`) or it reads as a scale bug. There is a `Tweens`
helper in `src/render/renderer.ts` already — use it; do not add a tween dependency.

**Tinting.** `MeshBasicMaterial.color` multiplies the texture, so it can only darken:

```ts
mat.color.setHex(0xff6666);   // damage tint - one line, works
```

A white hit-flash needs addition, which multiply cannot do. Cheapest correct version is a
second quad on top, same geometry and texture, for the ~120 ms of the flash:

```ts
new THREE.MeshBasicMaterial({
  map: tex, color: 0xffffff, alphaTest: 0.5,   // same alphaTest, so it clips identically
  blending: THREE.AdditiveBlending,
  transparent: true, depthWrite: false, side: THREE.DoubleSide,
});
// flashMesh.renderOrder = mesh.renderOrder + 1; opacity tween 0 -> 0.8 -> 0
```

Matching `alphaTest` matters — a different threshold makes the flash quad a pixel wider
than the piece and the sprite gains a white fringe. The alternative, injecting a `uFlash`
uniform via `material.onBeforeCompile`, avoids the draw call but needs a custom shader;
only worth it if many pieces flash at once.

---

## 6. Files

| File | What |
|---|---|
| `sprites/sheet-h{48,64,96,128}-all-blue.png` | All four treatments stacked at one height. **Decide from these.** |
| `sprites/sheet-h{48,64,96,128}-{full,outline,dither32,flat16}-blue.png` | One treatment per sheet, exact pixels. |
| `sprites/sheet-armies-h96-outline.png` | Knight across 4 armies + grey, on both tiles. |

All 21 sheets are ≤ 400 kB; the h128 overview falls back to a 256-colour palette to get
there, so use the per-variant sheets for fine judgement.

Treatment rows are cumulative, not independent: `outline` is `full` plus the outline, and
`dither32` / `flat16` are `outline` plus quantisation. That is the order you would
actually ship them in, so the sheets read as a progression.
