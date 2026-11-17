import { installErrorRecorder } from '../diagnostics/browser';
// The recorder starts before the interface module graph loads, so main is a dynamic import.
installErrorRecorder();
declare const __KINGDOWN_SOLO_LAUNCH__: boolean;
const boot = window as unknown as { kdBooted?: boolean; kdBootFault?: () => void };
try {
  if ((window as Window & { kingdownSupported?: boolean }).kingdownSupported !== false) {
    if (__KINGDOWN_SOLO_LAUNCH__) {
      const { startPlatform } = await import('./platform');
      await startPlatform();
    } else await import('./play/main');
    boot.kdBooted = true;
  }
} catch { boot.kdBootFault?.(); }
export {};
