const files = import.meta.glob(['../../public/ui/{kings/*.webp,pieces/*-w.webp,emblems/*.webp,cards/*.webp,stone-board.webp}', './assets/*.webp'], { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
export const art = (path: string): string => path.endsWith('.svg') ? symbols[`../../public/${path}`][0] : files[path.startsWith('assets/') ? `./${path}` : `../../public/${path}`];
export const symbols = import.meta.glob('../../public/ui/icons/*.svg', { eager: true, query: '?symbol', import: 'default' }) as Record<string, [string, string]>;
