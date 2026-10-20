import { parseAccountRoute } from './online/routes';
if (parseAccountRoute(new URL(location.href))) await import('./online/entry');
else await import('./main');
export {};
