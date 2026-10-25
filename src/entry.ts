import { installErrorRecorder } from './diagnostics/browser';
import { parseAccountRoute } from './online/routes';
installErrorRecorder();
if (parseAccountRoute(new URL(location.href))) await import('./online/entry');
else await import('./main');
export {};
