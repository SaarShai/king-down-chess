/** The iOS app serves the bundled build from capacitor://localhost (Capacitor's default origin); the website is http(s). */
export const inApp = typeof location !== 'undefined' && location.protocol === 'capacitor:';

/** Where /api lives: the page's own origin on the website; in the app, the site of the build's stage. */
export const apiOrigin = !inApp ? '' : import.meta.env.VITE_KINGDOWN_STAGE === 'staging' ? 'https://kingdown-staging.vercel.app' : 'https://kingdown.dev';
