# Local frame-time evidence uses the tree ID and the names of both passing checks.
frame_passed_at() {
  local record=$1 tree=$2
  [ -f "$record" ] && LC_ALL=C awk -v tree="$tree" '
    NR == 1 && $0 == "pass " tree " " $3 " king-effects painted-game" &&
      $3 ~ /^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])T([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]Z$/ { time=$3 }
    END { if (NR != 1 || !time) exit 1; print time }
  ' 2>/dev/null < "$record"
}

find_frame_record() {
  local base=$1 tree=$2 record run
  for run in "$base"/release-[1-9]*-*; do
    [[ "${run##*/}" =~ ^release-[1-9][0-9]*-[0-9a-f]{40}$ ]] || continue
    for record in "$run/live/frame-checks-$tree.pass" "$run/live/frame-checks.pass"; do
      frame_passed_at "$record" "$tree" >/dev/null || continue
      printf '%s\n' "$record"
      return
    done
  done
  return 1
}

# The paths that king-effects and painted-game can load, play or measure (tools/verify-king-effects.mjs and
# tools/verify-painted-game.mjs open index.html, which loads src/main.ts; king-effects also serves
# docs/king-effects from disk). A change to a path in this list runs the frame checks again.
# The list holds all of src/ and public/. It leaves out only the files that a lead-read tweak may change
# (leadRead in tools/lib/ci-paths.mjs): texts.ts, scenes.ts, style.css and the play and plugin screen CSS files.
# Docs outside docs/king-effects and docs/2d-first-pieces are not in the list.
# Add a path when you are not sure: a long list is safe, a missing path is not.
frame_paths=(
  src public index.html engines docs/king-effects docs/2d-first-pieces
  tools/verify-king-effects.mjs tools/verify-painted-game.mjs tools/app-ui.mjs tools/new-game-ui.mjs
  tools/check.mjs tools/lib tools/release/frame-checks.sh
  'tools/plugin-*.mjs' tools/staging-config.mjs tools/chatgpt-plugin.mjs tools/muse-connector.mjs
  package.json package-lock.json vite.config.ts tsconfig.json
  ':(exclude)src/interface/play/texts.ts' ':(exclude)src/interface/play/scenes.ts' ':(exclude)src/style.css'
  ':(exclude)src/interface/play/help/help.css' ':(exclude)src/interface/play/menus.css'
  ':(exclude)src/interface/play/reading-b.css' ':(exclude)src/interface/play/sides.css'
  ':(exclude)src/interface/play/shell.css' ':(exclude)src/interface/play/play.css'
  ':(exclude)src/plugin/screens/board.css' ':(exclude)src/plugin/screens/end.css'
  ':(exclude)src/plugin/screens/collection.css' ':(exclude)src/plugin/screens/seat.css'
  ':(exclude)src/plugin/screens/setup.css'
)

# Exit 0 when the frame paths of two commits or trees are the same. Run in the repository (default .).
frame_same() {
  git -C "${3:-.}" diff --quiet "$1" "$2" -- "${frame_paths[@]}" 2>/dev/null
}

# frame_reuse <history> <commit> [repository]: walk the first-parent ancestors of the commit, nearest first.
# Stop at the first ancestor whose frame paths differ. Print "<tree> <time> <record>" for the first ancestor
# with a pass record in the history. Exit 1 when there is no such ancestor or the commit is not known.
frame_reuse() {
  local history=$1 commit=$2 dir=${3:-.} c tree record
  [ -n "$history" ] || return 1
  for c in $(git -C "$dir" rev-list --first-parent --max-count=100 "$commit" 2>/dev/null); do
    frame_same "$c" "$commit" "$dir" || return 1
    tree=$(git -C "$dir" rev-parse "$c^{tree}") || return 1
    record=$(find_frame_record "$history" "$tree") || continue
    printf '%s %s %s\n' "$tree" "$(frame_passed_at "$record" "$tree")" "$record"
    return 0
  done
  return 1
}

# frame_record_reuse <record> <commit>: print the pass time of the record when its own tree has the
# same frame paths as the commit. The release copies an ancestor's record to its run (release.sh stage ci).
frame_record_reuse() {
  local record=$1 commit=$2 tree time
  [ -f "$record" ] || return 1
  tree=$(awk 'NR == 1 { print $2 }' "$record") || return 1
  [[ "$tree" =~ ^[0-9a-f]{40}$ ]] && time=$(frame_passed_at "$record" "$tree") && frame_same "$tree" "$commit" || return 1
  printf '%s %s\n' "$tree" "$time"
}

write_frame_record() {
  local record=$1 tree=$2 log=$3 time checks
  time=$(date -u +%FT%TZ) || return
  checks=$(awk '$1 == "ok" && $2 == "king-effects" { king++ }
    $1 == "ok" && $2 == "painted-game" { painted++ }
    END { if (king == 1 && painted == 1) print "king-effects painted-game"; else exit 1 }' "$log") || return
  mkdir -p "$(dirname "$record")" &&
    printf 'pass %s %s %s\n' "$tree" "$time" "$checks" > "$record.tmp" &&
    mv -f "$record.tmp" "$record"
}
