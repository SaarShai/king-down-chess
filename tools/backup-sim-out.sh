#!/bin/zsh
# Back up sim/out (the raw run data, git-ignored) to Google Drive, through the Drive desktop folder.
# .jsonl and .log files go gzipped; the rest is copied. A file is copied only when it is new or changed.
#   tools/backup-sim-out.sh            (run it after each pull of a run)
set -e
src="${0:A:h}/../sim/out"
dst="$HOME/Library/CloudStorage/GoogleDrive-saar.shai@gmail.com/My Drive/king-down-sim-out"
mkdir -p "$dst"
cd "$src"
n=0
find . -type f ! -name '.DS_Store' | while read -r f; do
  case "$f" in *.jsonl|*.log) out="$dst/$f.gz";; *) out="$dst/$f";; esac
  [[ -e "$out" && ! "$f" -nt "$out" ]] && continue
  mkdir -p "${out:h}"
  case "$f" in *.jsonl|*.log) gzip -c "$f" > "$out.tmp" && mv "$out.tmp" "$out";; *) cp "$f" "$out";; esac
  n=$((n + 1))
done
echo "backup-sim-out: $n file(s) copied to $dst"
