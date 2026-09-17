#!/bin/zsh
# 4-minute poll timer: sleeps, then prints a compact status the session relays.
sleep ${1:-240}
cd "/Users/za/Documents/king down chess"
echo "POLL $(date '+%H:%M:%S')"
echo "-- Q6: $(grep -cE '^== exit' sim/out/q6-2026-09-14.log 2>/dev/null) stages done; last: $(tail -c 300 sim/out/q6-2026-09-14.log 2>/dev/null | tail -1 | cut -c1-110)"
grep -E '^== ' sim/out/q6-2026-09-14.log 2>/dev/null | tail -2
echo "-- done markers: $(ls sim/out/*.done 2>/dev/null | xargs -n1 basename | tr '\n' ' ')"
echo "-- sims running: $(ps aux | grep -c '[t]sx src/sim')  newest sim/out files: $(ls -t sim/out | head -3 | tr '\n' ' ')"
