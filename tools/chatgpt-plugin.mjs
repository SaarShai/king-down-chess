/** The one switch for the ChatGPT plugin surface (owner, 2026-10-28: "park all of these outside the build").
 * While it is false, the built server and the Vercel tree leave out /mcp, the OAuth metadata under /.well-known,
 * /authorize, /consent.mjs, the board widget (board.html) and its /plugin-art/ files: each answers 404. The website,
 * /play/, /g/<id>, /j, /api/* and /internal/* do not change. All plugin source stays in the repository; the checks
 * that test it build their own artifact with `chatgpt: true`. Set it to true to bring the plugin back
 * (docs/HOSTING.md, "Parked: the ChatGPT plugin"). */
export const CHATGPT_PLUGIN = false;

/** The paths that the parked surface answered. Each must answer 404 while CHATGPT_PLUGIN is false. */
export const PARKED_PATHS = ['/mcp', '/.well-known/oauth-protected-resource', '/.well-known/oauth-protected-resource/mcp', '/authorize', '/consent.mjs', '/.well-known/openai-apps-challenge'];
