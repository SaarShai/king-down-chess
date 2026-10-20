# Real web and ChatGPT game

Status: game round trip verified. [Follow-up controls](10-first-chatgpt-load.md) narrow the startup failure to an unresolved host/browser entry path.

## Scope and checks

Use the separate staging website, database and ChatGPT connection. Sign in to the same staging identity. Create one game on the website, open it in the real ChatGPT widget, commit a move there, reload the exact website game, and compare history and result. Do not infer success from OAuth or a model summary alone.

## Verified game

- Product source: `01cbe379`.
- Preview: `dpl_FtPtUzjWoYNbtzvMLXUgRhrGVW3E`.
- Alias: `https://kingdown-staging.vercel.app`.
- Game: `1e34ff0e-5f7b-84f0-8cc6-22268129d986`.
- Website: `/g/1e34ff0e-5f7b-84f0-8cc6-22268129d986`.
- Real ChatGPT host: `https://chatgpt.com/mcp-app/asdk_app_6ad777853ecc8191820df5a18fcb9e5f/kingdown_open`.
- Rules: computer, Beginner, White, Classic chess; fairy pieces, cards and king powers off for this host smoke.

The owner saved the staging GitHub provider. Public settings report GitHub enabled and Google disabled. Website sign-in and ChatGPT OAuth complete.

The website commits `e2–e4`; the computer replies `a7–a5`. ChatGPT receives an explicit `kingdown_open` request for the full game ID. Its widget opens the game from the account's game list and shows those exact two moves.

The widget commits `g1–f3`; the computer replies `e7–e6`. A fresh website reload shows all four moves, identical to the widget history. Resignation in the widget ends the game. Another website reload shows the same `Black wins · Resignation`, `You lose` and `You resigned.` result.

This is a bidirectional game-state check in the real host. The separate built HTTP/MCP browser proof covers hidden friend setup, Flame/Haste, an atomic two-action turn and an injected lost reply with one receipt. Those cases were not repeated in this live solo game.

Screenshots are in the new project's `evidence/staging-hosted/` directory:

- `chatgpt-connected.png`
- `web-first-moves.png`, `chatgpt-first-moves.png`
- `web-two-turns.png`, `chatgpt-two-turns.png`
- `web-result.png`, `chatgpt-result.png`

## Fresh-load issue and trace

Two browser-API loads of the ChatGPT standalone page show an empty sandbox, then `Couldn’t display King Down Staging` after about 30 seconds. `Try again` loads the widget, which then works. The website does not show this failure. Browser errors contain a ChatGPT React hydration error and cache warnings, but no game error. These messages do not establish the cause.

The resource MIME type, URI, domain and bootstrap order pass a read-only review against the SDK and official host reference. No auth, CSP or timeout change is justified by current evidence.

Ranked hypotheses and the next probe:

1. Host resource or sandbox loading fails: `resources/read` succeeds but no HTML-entry marker appears.
2. The bridge handshake stalls: HTML and module markers appear but `App.connect()` does not complete.
3. Application startup stalls: connect and tool-result markers appear but controls do not become ready.

The temporary probe uses source `c440744c` in an isolated worktree and preview `dpl_2CnoTCGHT9L7jkZLyCeurfXJ6FbJ`. It adds only fixed markers and static HTML byte count. Typecheck, 114 app/server tests, 53 artwork checks and the compiled artifact check pass. An independent review finds no behavior, security or private-data change. The probe is not merged into the application branch.

After refreshing ChatGPT's staging tool definitions, a fresh load fails again. The resource handler prepares 929,803 bytes and returns HTTP 200 at `2026-10-20T15:23:05.409Z`. No HTML-entry or later browser marker appears before the error. On retry, HTML entry, module entry, connect start, connect completion and the first tool result all appear at `15:23:40.989Z`; the controls become enabled.

No HTML-entry execution is observed on the failing load. HTTP 200 proves server response, not browser delivery or execution; absent console markers also do not rule out a capture gap. The evidence points to panel delivery or execution, but does not establish why loading fails or prove a specific host defect. No game-code, CSP, auth or timeout change follows from this evidence.

The verified `01cbe379` preview is restored and ChatGPT's staging tool definitions are refreshed back to it. The diagnostic preview is deleted and its clean worktree is removed. The probe commit remains unmerged; no diagnostic marker is in the active source or deployment. Browser and server traces are saved as `startup-browser-probe.json` and `startup-server-probe.json`. Screenshots show `chatgpt-first-load-failure.png` and `chatgpt-startup-retry.png`. An independent review confirms that the evidence supports the game milestone and this limited startup conclusion.

The follow-up passes five fresh widget mounts in a control tab and four native direct-URL opens without retry. A minimal panel without game code reproduces the failure in affected tabs and succeeds in the control tab. This corrects any broad attribution to application code; it does not fix or establish the exact cause. See [ticket 10](10-first-chatgpt-load.md) for evidence and cleanup. Reliable first-load behavior across the remaining failing path is still unverified.
