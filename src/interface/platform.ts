import './ui/tokens.css';
import './ui/components.css';
import './platform.css';
import { button } from './ui/kit.js';

import { RETURN_NOTICE, OLD_LINK_TITLE } from '../content/launch';
export { RETURN_NOTICE };
export const NOTICE_KEY = 'kingdown.solo-launch-seen';
/** Read the old keys without changing their data. A fresh player also gets the seen mark. */
export function returningPlayer(store: Pick<Storage, 'length' | 'key' | 'getItem'>): boolean {
  if (store.getItem(NOTICE_KEY) !== null) return false;
  for (let i = 0; i < store.length; i++) if (store.key(i)?.startsWith('kingdown.')) return true;
  return false;
}
export function launchRoute(url: URL): 'home' | 'old-link' | 'missing' {
  // The iOS app starts at capacitor://localhost, whose path is empty.
  if (!['', '/', '/next.html'].includes(url.pathname)) return 'missing';
  return ['army', 'fen', 'moves', 'design'].some(key => url.searchParams.has(key)) ? 'old-link' : 'home';
}
function message(root: HTMLElement, title: string, text: string, action: string, onAction: () => void) {
  const page = document.createElement('section'); page.className = 'platform-message';
  const heading = document.createElement('h1'); heading.textContent = title; heading.tabIndex = -1;
  const line = document.createElement('p'); line.textContent = text;
  page.append(heading, line, button(action, { kind: 'main', onPress: onAction }));
  root.replaceChildren(page); heading.focus();
}
export async function startPlatform() {
  const root = document.querySelector<HTMLElement>('#app')!;
  const route = launchRoute(new URL(location.href));
  if (route !== 'home') {
    message(root, route === 'missing' ? 'Page not found' : OLD_LINK_TITLE,
      route === 'missing' ? 'This page is not available. You can start at home.' : 'This link holds a full game from the old page. You can start a new game at home.',
      'Back to home', () => location.assign('/'));
    return;
  }
  let returning = false;
  try { returning = returningPlayer(localStorage); } catch { /* A device can block storage. */ }
  if (returning) await new Promise<void>(done => message(root, 'Welcome back', RETURN_NOTICE, 'Continue', done));
  try { localStorage.setItem(NOTICE_KEY, '1'); } catch { /* The game still opens without storage. */ }
  root.replaceChildren();
  await import('./play/main');
  if (!root.hasChildNodes()) await new Promise<void>(done => {
    const observer = new MutationObserver(() => { if (root.hasChildNodes()) { observer.disconnect(); done(); } });
    observer.observe(root, { childList: true });
  });
  dispatchEvent(new Event('kingdown-interface-ready'));
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).catch(() => {});
}
