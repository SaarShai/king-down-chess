/** The one switch for the ChatGPT plugin surface: /mcp, the OAuth metadata under /.well-known, /authorize,
 * /consent.mjs, the board widget (board.html) and its /plugin-art/ files (docs/HOSTING.md, "The ChatGPT plugin").
 * It is on for the production build and off for a staging build, which serves only the Muse connector. It does not
 * follow the Muse switch (tools/muse-connector.mjs): one build can serve both connectors. While it is false, each of
 * those paths answers 404, except the consent page when Muse is on; the website, /play/, /g/<id>, /j, /api/* and
 * /internal/* do not change. */
export const CHATGPT_PLUGIN = globalThis.process?.env?.KINGDOWN_STAGE !== 'staging';

/** The paths of the plugin surface. Each must answer 404 while CHATGPT_PLUGIN is false, except the consent page
 *  (/authorize, /consent.mjs) while the Muse connector is on. */
export const PARKED_PATHS = ['/mcp', '/.well-known/oauth-protected-resource', '/.well-known/oauth-protected-resource/mcp', '/authorize', '/consent.mjs', '/.well-known/openai-apps-challenge'];
