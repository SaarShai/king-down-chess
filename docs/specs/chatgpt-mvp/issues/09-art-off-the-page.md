# 09 · Art off the page

Status: ready-for-agent
Type: AFK
Size: M
Blocked by: none

## Scope

- The plugin build stops inlining images. It copies the board art (piece sheets, king sheets, the stone board, the effect masks) and the UI art to hashed file names in the plugin's static output, served from the plugin origin, with long cache headers.
- The page's CSP lists the plugin origin in `_meta.ui.csp.resourceDomains` and in the legacy `openai/widgetCSP.resource_domains`.
- The website build does not change (the shared board code keeps its imports; the plugin build rewrites them).
- The local harness and the HTTP check serve the same files.

## Acceptance

- The page payload falls below 1,000,000 bytes; record the number.
- `npm run plugin:build`, `plugin:server:check`, `plugin:smoke`, `check:vercel`, `check:browser plugin-ui plugin-ui-http` pass; the board draws every piece and king (screenshot in the check output).
- The website build output is byte-identical in its asset list (`npm run build`).

## Notes

- Explorer note E §2, §9; note F §8 (CSP). The size gate: `tools/plugin-ui-build.mjs`.
- A real-host check of the CSP (ChatGPT web and iPhone) is part of ticket 19.
