/** The one switch for the Muse connector (docs/specs/muse-connector). While it is false, the built server and the Vercel
 * tree have no Muse code and no Muse routes: each Muse path answers the parked 404. The owner sets it to true for a
 * deploy that turns the connector on. The checks of the Muse source build their own artifact with `muse: true`. */
export const MUSE_CONNECTOR = false;

/** The Muse paths: the MCP endpoint and its RFC 9728 metadata. The consent page (/authorize, /consent.mjs) serves
 *  when either connector is on. */
export const MUSE_PATHS = ['/muse/mcp', '/.well-known/oauth-protected-resource/muse/mcp'];
