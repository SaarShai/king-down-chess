#!/bin/bash
# Cloud sessions (claude.ai/code) start from a fresh clone: install dependencies.
# Local sessions skip this.
[ "$CLAUDE_CODE_REMOTE" = "true" ] || exit 0
cd "$CLAUDE_PROJECT_DIR" || exit 0
[ -d node_modules ] || npm ci --no-audit --no-fund || echo "npm ci failed" >&2
# Browser checks (tools/verify-*.mjs) need Chromium. Best effort: the network may block the
# download, and then the older build preinstalled under /opt/pw-browsers is linked instead.
npx playwright install chromium >/dev/null 2>&1 \
  || node tools/pw-cloud-link.mjs \
  || echo "Playwright Chromium not available; browser checks unavailable" >&2
exit 0
