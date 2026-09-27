#!/bin/sh
# Fetches the orchestral samples the trailer score plays into the git-ignored docs/trailer/assets/audio/vsco/.
# Source: VS Chamber Orchestra 2: Community Edition, Versilian Studios, CC0-1.0, https://github.com/sgossner/VSCO-2-CE
# A blobless, shallow, sparse clone pinned to one commit, then a sparse checkout of exactly the files that
# docs/trailer/engine/audio/score.mjs lists (samples()). Rerun it after changing the score. Needs git and node.
set -eu
cd "$(dirname "$0")/.."
URL=https://github.com/sgossner/VSCO-2-CE.git
COMMIT=440300901dfe9275fd84e0b7763af1f8443ae62e
DEST=docs/trailer/assets/audio/vsco
[ -d "$DEST/.git" ] || git clone --filter=blob:none --sparse --depth 1 "$URL" "$DEST"
[ "$(git -C "$DEST" rev-parse HEAD)" = "$COMMIT" ] || { echo "VSCO-2-CE is not at $COMMIT: check its license, then update COMMIT" >&2; exit 1; }
LIST="$DEST/.git/trailer-samples"
node --input-type=module -e "
  const { samples } = await import('./docs/trailer/engine/audio/score.mjs');
  console.log(samples().map(f => '/' + f).join('\n'));" > "$LIST"
git -C "$DEST" sparse-checkout set --no-cone --stdin < "$LIST"
missing=0
while IFS= read -r f; do [ -f "$DEST$f" ] || { echo "missing: $f" >&2; missing=1; }; done < "$LIST"
[ "$missing" = 0 ]
echo "ok: $(wc -l < "$LIST" | tr -d ' ') samples, $(du -sh "$DEST" | cut -f1) on disk in $DEST"
