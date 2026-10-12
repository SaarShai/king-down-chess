/** Headers of the board art files: hashed names never change content, and a cross-origin board reads the art into a canvas. */
export const ART_HEADERS = { 'Cache-Control': 'public, max-age=31536000, immutable', 'Access-Control-Allow-Origin': '*', 'Cross-Origin-Resource-Policy': 'cross-origin' };
export const ART_TYPES = { webp: 'image/webp', png: 'image/png', svg: 'image/svg+xml', woff2: 'font/woff2' };
export const artType = name => /^[\w-]+\.(webp|png|svg|woff2)$/.test(name) ? ART_TYPES[name.split('.').at(-1)] : undefined;
