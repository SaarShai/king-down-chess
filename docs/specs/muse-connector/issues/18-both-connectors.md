# Serve both connectors from one build

Type: task
Status: claimed
Blocked by: none
Parent: [Muse connector map](../map.md)
Labels: wayfinder:task

## Question

Can one production build serve the ChatGPT plugin (`/mcp`) and the Muse connector (`/muse/mcp`) at once, so that the Muse release does not stop the ChatGPT plugin?

## Design

- Each OAuth client ID maps to one resource in `kingdown_oauth.client_resources` (one row per client). No new setting: `KINGDOWN_PLUGIN_OAUTH_CLIENT_IDS` lists both client IDs.
- The start check (`checkPluginDatabase`) accepts each listed client whose resource is one of the served resources. It returns those rows. A listed client without such a row stops the start (503), as before.
- Each connector accepts a token only when its `aud` is the resource of its path and its `client_id` maps to that resource. A served connector without a client refuses every token and logs a warning; the server starts.
- `CHATGPT_PLUGIN` no longer follows `MUSE_CONNECTOR`: it is on for production and off for staging. Staging stays Muse only; production stays ChatGPT only until the Muse release sets `MUSE_CONNECTOR` to true.
- The consent page of a build with both has both texts in `[data-connector]` parts. `src/plugin/consent.ts` shows the Muse text when the client of the authorization is in `museClientIds` of the page configuration. The review password form stays.
- `tools/vercel-check.mjs` takes `--chatgpt` and `--muse` for a tree built with the same flags. `tools/deploy-plugin-live-check.mjs` checks the connectors of the tree: metadata and the unsigned challenge for each, 404 for each path of a connector that is off.

## Progress

- Branch `muse-chatgpt-both`: the code, the tests and the docs ([MUSE.md, "The switch"](../../../MUSE.md#the-switch)). Evidence is in the PR.
