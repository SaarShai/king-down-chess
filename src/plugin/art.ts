const files = import.meta.glob('../../public/ui/{kings/*.webp,pieces/*-w.webp,emblems/*.webp,stone-board.webp}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
export const art = (path: string): string => files[`../../public/${path}`];
export const symbols = import.meta.glob('../../public/ui/icons/*.svg', { eager: true, query: '?symbol', import: 'default' }) as Record<string, [string, string]>;
