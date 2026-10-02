#!/bin/bash
# Cloud sessions (claude.ai/code) start from a fresh clone: install dependencies.
# Local sessions skip this.
[ "$CLAUDE_CODE_REMOTE" = "true" ] || exit 0
cd "$CLAUDE_PROJECT_DIR" || exit 0
[ -d node_modules ] || npm ci --no-audit --no-fund || echo "npm ci failed" >&2
# Browser checks (tools/verify-*.mjs) need Chromium. Best effort: the network may block it.
npx playwright install chromium >/dev/null 2>&1 \
  || echo "Playwright Chromium not installed; browser checks unavailable" >&2
exit 0
