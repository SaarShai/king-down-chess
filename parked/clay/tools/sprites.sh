#!/usr/bin/env bash
# Bake the PSD character renders into billboard sprites for the "HD-2D" art style.
# Writes three army sets: public/sprites/<set>/<piece>-{w,b}.png
# Usage: tools/sprites.sh [source-dir]      Needs ImageMagick 7 (`magick`).
set -euo pipefail

SRC="${1:-/private/tmp/claude-501/-Users-za-Documents-king-down-chess/af00383a-be3c-43af-8c39-b2e17188dc55/scratchpad/drive/3d files/imgs/colored}"
OUT="$(cd "$(dirname "$0")/.." && pwd)/public/sprites"
OUTLINE='#14121f'
HEIGHT=128

# game name : PSD base name (the army suffix is added per set)
PIECES="
pawn:Pawn-1
knight:Knight-1
bishop:Bishop
rook:Rock
queen:Queen
archer:Archer
paladin:Paladin
guard:Guard
maester:Maester
beast:Beast
"

# set : white suffix : black suffix : white king file : black king file
SETS="
blue-red:-blue.psd:-red.psd:King-Ice-blue.psd:King-Fire-red.psd
green-purple:-green.psd:-purple.psd:King-Gaya-green.psd:King-Sky-purple.psd
ivory-charcoal:.PSD:.PSD:King-Spirit.PSD:King-Shadow.PSD
"

# ivory-charcoal has no coloured render, so it is graded out of the base one.
# PLAIN is a no-op so the array is never empty (bash 3.2 + `set -u`).
PLAIN=(+repage)
IVORY=(-modulate 112,55,100 -channel RGB -fill '#f2e6c8' -colorize 12% +channel)
CHARCOAL=(-channel RGB -modulate 32,35,100 +channel)

# bake <src.psd> <out.png> [extra ops applied before the downscale]
bake() {
  local src="$1" out="$2"; shift 2
  # trim → grade → box-filter downscale (no blur) → 1 px dark outline from the dilated alpha
  magick "$src[0]" -colorspace sRGB -background none -alpha on -trim +repage \
    "$@" -filter box -resize "x$HEIGHT" +repage -bordercolor none -border 1 \
    \( +clone -alpha extract -morphology Dilate Disk:1 -background "$OUTLINE" -alpha shape \) \
    +swap -composite -strip "$out"
}

for srow in $SETS; do
  IFS=: read -r set wsuf bsuf wking bking <<<"$srow"
  mkdir -p "$OUT/$set"
  if [ "$set" = ivory-charcoal ]; then grade_w=("${IVORY[@]}"); grade_b=("${CHARCOAL[@]}")
  else grade_w=("${PLAIN[@]}"); grade_b=("${PLAIN[@]}"); fi
  for row in $PIECES; do
    IFS=: read -r name base <<<"$row"
    bake "$SRC/$base$wsuf" "$OUT/$set/$name-w.png" "${grade_w[@]}"
    bake "$SRC/$base$bsuf" "$OUT/$set/$name-b.png" "${grade_b[@]}"
  done
  bake "$SRC/$wking" "$OUT/$set/king-w.png" "${grade_w[@]}"
  bake "$SRC/$bking" "$OUT/$set/king-b.png" "${grade_b[@]}"
  echo "$set: 22 sprites -> $OUT/$set"
done
