#!/usr/bin/env bash
set -eu

log=${1:?Usage: webkit-sampler.sh LOG}
while true; do
  {
    printf 'epoch: %s\n' "$(date +%s)"
    if [ -r /proc/loadavg ]; then
      printf 'loadavg: '
      cat /proc/loadavg
    fi
    if [ -r /proc/meminfo ]; then
      awk '/^(MemAvailable|SwapFree):/' /proc/meminfo
    fi
    ps -eo pid=,rss=,pcpu=,etime=,args= | awk '
      {
        args = $0
        sub(/^[[:space:]]*[0-9]+[[:space:]]+[^[:space:]]+[[:space:]]+[^[:space:]]+[[:space:]]+[^[:space:]]+[[:space:]]+/, "", args)
        split(args, words, /[[:space:]]+/)
        if (words[1] ~ /(^|\/)(WebKitWebProcess|WebKitNetworkProcess|WebKitGPUProcess|MiniBrowser)$/)
          printf "%s %s %s %s %s\n", $1, $2, $3, $4, substr(args, 1, 120)
      }'
    printf '\n'
  } >> "$log"
  sleep 5
done
