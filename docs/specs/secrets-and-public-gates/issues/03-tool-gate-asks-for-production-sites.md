# 03: Tool gate asks before an agent opens a production site

**What to build:** When an agent opens a production or dashboard site in a browser tool, Claude Code shows the owner a prompt first. The sites are kingdown.dev, `kingdown*.vercel.app`, vercel.com, supabase.com, `*.supabase.co`, porkbun.com and each of their sub-domains. The gate reads the URL of the browser pane's `navigate` and `preview_start`, of each navigate step in a `browser_batch`, and of the Chrome extension's navigate and new-tab tools. It matches the host, not a text search, so a local preview or a search page that names a site passes. A URL that does not parse gives `ask`. The bypass-mode rule of ticket 02 applies here too.

**Blocked by:** 02

**Status:** resolved

**Owns:** `.claude/hooks/tool-gate.mjs`, `.claude/hooks/tool-gate.test.ts`, `.claude/settings.json` (only `hooks.PreToolUse`). Shared file: dev-environment/04 and dev-environment/05 also edit `.claude/settings.json` (other keys); they block on this ticket, so tickets 01 to 03 finish their settings edits first

**Verify:** `npm test`

- [x] The settings hold `PreToolUse` matchers for `navigate`, `preview_start` and `browser_batch` with both the `mcp__Claude_Browser__` and the `mcp__remote-devices__Claude_Browser__` prefix, and for the Chrome extension's navigate and new-tab tools. The builder takes the exact Chrome tool names from a tool listing and writes them in this ticket. The settings test asserts each matcher.
- [x] Ask rows: each site above and a sub-domain of it (for example `www.kingdown.dev`, `kingdown-git-x.vercel.app`, `app.supabase.com`, `abc.supabase.co`), for each matched tool.
- [x] A `browser_batch` with one production navigate step among other steps gives `ask`; a batch with no such step passes.
- [x] Pass rows: `http://127.0.0.1:5189/`, `http://localhost:5173/`, `https://example.com/?q=kingdown.dev`, `https://notkingdown.dev/`, `https://vercel.com.example.org/`.
- [x] A URL that does not parse gives `ask`; with `bypassPermissions` each ask row gives deny.

## Comments

**Build (branch `build/secrets-and-public-gates-03`).**

- Files: `.claude/hooks/tool-gate.mjs`, `.claude/hooks/tool-gate.test.ts`, `.claude/settings.json` (one new `hooks.PreToolUse` entry; the `Bash` entry and `permissions` do not change).
- Chrome tool names, from the tool schemas in the Claude desktop app bundle (`/Applications/Claude.app/Contents/Resources/ion-dist/assets/v1/`) and the tool lists in local transcripts: `mcp__claude-in-chrome__navigate` (input `{url, tabId}`) and `mcp__claude-in-chrome__tabs_create_mcp` (the new-tab tool; its input schema is empty, so today it opens an empty tab and passes; the gate reads a `url` if it gets one). The Chrome extension also has `mcp__claude-in-chrome__browser_batch` with the same `{actions: [{name, input}]}` shape as the pane's batch. The ticket does not name it, but a navigate step in it opens a site too, so the matcher holds it (spec: "also in a batch step").
- Matcher: one entry, an exact list split by `|` (only letters, digits, `_`, `-` and `|`, so Claude Code does not read it as a regex): the pane's `navigate`, `preview_start`, `browser_batch` with the `mcp__Claude_Browser__` and `mcp__remote-devices__Claude_Browser__` prefixes, and the three Chrome tools above. The command is the same `tool-gate.mjs` as the Bash entry.
- Rule: the gate finds each `url` value in the tool input, also in each batch step, and also in an `actions` list that comes as JSON text. It parses the URL with `new URL`; text with no scheme gets `https://` first, as the browser tools do (so `kingdown.dev` asks and `localhost:5173` passes). `view-source:` URLs are read for their inner URL. The host (lower case, trailing dot removed, user info and port ignored) asks when it is `kingdown.dev`, `vercel.com`, `supabase.com`, `supabase.co` or `porkbun.com`, or a sub-domain of one, or when its label before `vercel.app` starts with `kingdown` (and each sub-domain of that host). The bare `supabase.co` host also asks.
- Faults give `ask` ("Tool gate fault ... Check the URL by hand."): a URL that does not parse, a `url` that is not a string, a batch with no `actions` list. The ticket 02 mode rule applies: in `bypassPermissions` and `dontAsk` each ask, a fault too, becomes deny with "ask the owner in chat".
- Passes: a URL on any other host, `back` and `forward`, `about:blank`, `preview_start` by launch name, an empty Chrome new tab, and a site name in a query string, a `find` query or a typed text step.
- Tests (77 new, 284 in `tool-gate.test.ts`): settings (one entry, the exact-list form, each of the 9 tool names); 16 site rows (each site and a sub-domain, plus no scheme, upper case with a trailing dot, a port, user info, `view-source:`), each through all 9 tools; the same 16 rows in the six modes through all 9 tools; a batch with one production step among local and other steps asks, for each batch tool; a batch as JSON text asks; 15 pass rows (the five in the ticket, plus `notkingdown.vercel.app`, `vercel.app`, `myvercel.com`, `supabase.com.example.org`, `[::1]`, a search URL, `about:blank`, `back`, `forward`, `localhost:5173`) through all 9 tools; a batch with no production step passes; `preview_start` by name and an empty new tab pass; 4 URLs that do not parse ask in `default` and deny in `bypassPermissions`; non-string `url` values ask; a batch with no `actions` list asks. Each row goes as hook JSON on stdin to the exact command in the settings.
- Commands run: `npx vitest run .claude/hooks` (284 pass). `npm test` on the build commit: tsc clean, 59 vitest files, 1147 tests pass, 42 node tests pass. `npm test` after the merge of the integration tip `106b890`: tsc clean, 61 vitest files, 1193 tests pass, 42 node tests pass. An earlier run at a load average near 50 (other builders) failed only on 5 s and 30 s time-outs in other files; the tool-gate file passed in it.
- Not tested here: a live session that shows the prompt for a real browser tool call (ticket 12's rehearsal).

