#!/bin/bash
# Collect all local and M1 spools, then publish a checksum-verified Drive snapshot.
set -euo pipefail
exec python3 "$(dirname "$0")/results-store.py" maintain --m1 "$@"
