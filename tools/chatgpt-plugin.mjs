import { MUSE_CONNECTOR } from './muse-connector.mjs';

/** The one switch for the ChatGPT plugin surface: /mcp, the OAuth metadata under /.well-known, /authorize,
 * /consent.mjs, the board widget (board.html) and its /plugin-art/ files (docs/HOSTING.md, "The ChatGPT plugin").
 * It is on for the production build. A staging build serves the Muse connector instead, because one build cannot
 * serve both (tools/plugin-server-build.mjs). While it is false, each of those paths answers 404; the website, /play/,
 * /g/<id>, /j, /api/* and /internal/* do not change. */
export const CHATGPT_PLUGIN = !MUSE_CONNECTOR;

/** The paths of the plugin surface. Each must answer 404 while CHATGPT_PLUGIN is false. */
export const PARKED_PATHS = ['/mcp', '/.well-known/oauth-protected-resource', '/.well-known/oauth-protected-resource/mcp', '/authorize', '/consent.mjs', '/.well-known/openai-apps-challenge'];
