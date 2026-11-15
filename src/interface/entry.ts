import { installErrorRecorder } from '../diagnostics/browser';
// The recorder starts before the interface module graph loads, so main is a dynamic import.
installErrorRecorder();
// A failed load shows the static Try again of next.html (launch decision 12); a loaded page turns that off.
const boot = window as unknown as { kdBooted?: boolean; kdBootFault?: () => void };
try { await import('./play/main'); boot.kdBooted = true; } catch { boot.kdBootFault?.(); }
export {};
