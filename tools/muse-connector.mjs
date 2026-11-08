/** The one switch for the Muse connector (docs/specs/muse-connector). It is on only for a staging build
 * (`KINGDOWN_STAGE=staging`, which tools/deploy.sh refuses), so production has no Muse code and no Muse routes: each
 * Muse path answers the parked 404. Set it to true for the production release that turns the connector on (ticket 17).
 * The checks of the Muse source build their own artifact with `muse: true`. */
export const MUSE_CONNECTOR = globalThis.process?.env?.KINGDOWN_STAGE === 'staging';

/** The Muse paths: the MCP endpoint and its RFC 9728 metadata. The consent page (/authorize, /consent.mjs) serves
 *  when either connector is on. */
export const MUSE_PATHS = ['/muse/mcp', '/.well-known/oauth-protected-resource/muse/mcp'];
