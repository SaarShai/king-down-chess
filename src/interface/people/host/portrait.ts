import type { Level } from '../../play/saved';
import { allowedAvatarUrl } from '../../../account/public-config';

export const computerPortrait = (level: Level, size = 96) => `/interface/computer-king-${{ casual: 1, clever: 2, club: 3 }[level]}-${size}.webp`;
/** A failed or absent service picture leaves the initial in the same space. */
export function profilePortrait(name: string, url: string | null = null): HTMLElement {
  const box = document.createElement('span'); box.className = 'profile-portrait'; box.setAttribute('aria-hidden', 'true');
  box.textContent = (Array.from(name.trim())[0] ?? '?').toUpperCase();
  if (url && allowedAvatarUrl(url)) {
    box.dataset.avatar = url;
    const image = document.createElement('img'); image.src = url; image.alt = ''; image.referrerPolicy = 'no-referrer'; image.decoding = 'async';
    image.addEventListener('error', () => image.remove(), { once: true }); box.append(image);
  }
  return box;
}
