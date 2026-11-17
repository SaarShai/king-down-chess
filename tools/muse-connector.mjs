/** Builds include Muse. The listed OAuth client rows enable it at runtime (tools/plugin-server.mjs).
 * A build with muse: false still drops the connector code and routes. */
export const MUSE_CONNECTOR = true;

/** The Muse paths: the MCP endpoint and its RFC 9728 metadata. The consent page (/authorize, /consent.mjs) serves
 *  when either connector is on. */
export const MUSE_PATHS = ['/muse/mcp', '/.well-known/oauth-protected-resource/muse/mcp'];
