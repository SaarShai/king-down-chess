# 03: Tool gate asks before an agent opens a production site

**What to build:** When an agent opens a production or dashboard site in a browser tool, Claude Code shows the owner a prompt first. The sites are kingdown.dev, `kingdown*.vercel.app`, vercel.com, supabase.com, `*.supabase.co`, porkbun.com and each of their sub-domains. The gate reads the URL of the browser pane's `navigate` and `preview_start`, of each navigate step in a `browser_batch`, and of the Chrome extension's navigate and new-tab tools. It matches the host, not a text search, so a local preview or a search page that names a site passes. A URL that does not parse gives `ask`. The bypass-mode rule of ticket 02 applies here too.

**Blocked by:** 02

**Status:** ready-for-agent

**Owns:** `.claude/hooks/tool-gate.mjs`, `.claude/hooks/tool-gate.test.ts`, `.claude/settings.json` (only `hooks.PreToolUse`). Shared file: dev-environment/04 and dev-environment/05 also edit `.claude/settings.json` (other keys); they block on this ticket, so tickets 01 to 03 finish their settings edits first

**Verify:** `npm test`

- [ ] The settings hold `PreToolUse` matchers for `navigate`, `preview_start` and `browser_batch` with both the `mcp__Claude_Browser__` and the `mcp__remote-devices__Claude_Browser__` prefix, and for the Chrome extension's navigate and new-tab tools. The builder takes the exact Chrome tool names from a tool listing and writes them in this ticket. The settings test asserts each matcher.
- [ ] Ask rows: each site above and a sub-domain of it (for example `www.kingdown.dev`, `kingdown-git-x.vercel.app`, `app.supabase.com`, `abc.supabase.co`), for each matched tool.
- [ ] A `browser_batch` with one production navigate step among other steps gives `ask`; a batch with no such step passes.
- [ ] Pass rows: `http://127.0.0.1:5189/`, `http://localhost:5173/`, `https://example.com/?q=kingdown.dev`, `https://notkingdown.dev/`, `https://vercel.com.example.org/`.
- [ ] A URL that does not parse gives `ask`; with `bypassPermissions` each ask row gives deny.
