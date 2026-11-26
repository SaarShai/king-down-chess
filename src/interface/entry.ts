import { installErrorRecorder } from '../diagnostics/browser';
// The recorder starts before the interface module graph loads, so the platform is a dynamic import.
installErrorRecorder();
// A failed load shows the static Try again of next.html (launch decision 12); a loaded page turns that off.
const boot = window as unknown as { kdBooted?: boolean; kdBootFault?: () => void };
try {
  // public/browser-support.js sets this flag before the page loads its modules.
  if ((window as Window & { kingdownSupported?: boolean }).kingdownSupported !== false) {
    const { startPlatform } = await import('./platform');
    await startPlatform();
    boot.kdBooted = true;
  }
} catch { boot.kdBootFault?.(); }
export {};
