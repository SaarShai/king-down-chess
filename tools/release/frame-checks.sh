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
