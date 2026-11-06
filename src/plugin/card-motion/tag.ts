/** The motion layer of a painted card, placed after its <img>. A card with no recipe has only its still picture. */
const maps = import.meta.glob<string>('../assets/card-motion/*.webp', { eager: true, query: '?url', import: 'default' });
export const mapOf = (name: string): string | undefined => maps[`../assets/card-motion/${name}.webp`];
export const motionTag = (card: string, url: string): string => mapOf(card.toLowerCase()) ? `<card-motion data-motion="${card.toLowerCase()}" data-painting="${url}"></card-motion>` : '';
