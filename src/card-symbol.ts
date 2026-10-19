import type { CardName } from './rules/rules';
import './card-symbol.css';

const marks = {
  frost: '<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9 5l3 3 3-3M9 19l3-3 3 3"/>',
  shield: '<path d="M12 3l8 3v6c0 5-8 9-8 9S4 17 4 12V6z"/>',
  strike: '<path d="M15 3L5 14h7l-3 7 10-12h-7z"/>',
  haste: '<path d="M4 6l6 6-6 6M13 6l6 6-6 6"/>',
  flight: '<path d="M3 15c5 0 6-8 9-10 3 2 4 10 9 10M7 18l5-3 5 3M12 5v10"/>',
  sacrifice: '<path d="M5 20L18 4M12 4h6v6M4 13l7 7M3 17l4 4"/>',
  march: '<path d="M7 21V4M3 8l4-4 4 4M17 21V4M13 8l4-4 4 4"/>',
  leap: '<path d="M3 18Q12-8 21 18M16 15l5 3 1-5M10 19h4"/>',
  light: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>',
  mercy: '<path d="M12 20S2 14 3 8c1-5 7-5 9 0 2-5 8-5 9 0 1 6-9 12-9 12z"/>',
  death: '<circle cx="12" cy="9" r="6"/><path d="M8 14v6h8v-6M9 8v2M15 8v2M12 17v3"/>',
  dark: '<path d="M18 4a9 9 0 1 0 2 15A10 10 0 0 1 18 4z"/>',
  mimic: '<path d="M4 4h10v14H4zM10 7h10v14H10M7 9h4M13 12h4"/>',
  curse: '<path d="M3 12h17M16 7l5 5-5 5"/><circle cx="7" cy="5" r="2"/><path d="M5 19h5"/>',
  swap: '<path d="M3 7h17M16 3l4 4-4 4M21 17H4M8 13l-4 4 4 4"/>',
  return: '<path d="M4 10h10a6 6 0 0 1 0 12M8 5l-5 5 5 5M13 3h8M17 0v6"/>',
  rage: '<path d="M3 9l4 4 5-8 5 8 4-4-2 11H5z"/>',
  mirror: '<path d="M3 4h11v14H3zM10 7h11v14H10M13 11h5M13 15h5"/>',
  quake: '<path d="M2 15h5l3-10 4 16 3-9h5"/>',
  burn: '<path d="M13 2c2 6-3 7-1 11 2-1 3-3 3-5 8 8 4 14-3 14S1 16 6 10c0 4 2 5 3 5C6 9 12 8 13 2z"/>',
  firestarter: '<path d="M3 3h18M13 6c2 4-2 5-1 8l3-3c5 6 2 10-3 10s-8-4-4-8c0 3 1 3 2 3-2-4 2-6 3-10z"/>',
  control: '<circle cx="6" cy="7" r="3"/><circle cx="18" cy="7" r="3"/><path d="M2 20v-4a4 4 0 0 1 8 0v4M14 20v-4a4 4 0 0 1 8 0v4M9 7h6"/>',
  growth: '<path d="M12 21V9M12 15C3 16 3 9 3 7c7 0 9 3 9 8M12 11c0-7 5-8 9-8 0 7-3 9-9 8"/>',
  rally: '<path d="M3 21V5h8l-2 4 2 4H3M14 21V5h7l-2 4 2 4h-7"/>',
  morph: '<path d="M3 12h17M16 7l5 5-5 5M3 5h5v4H3M3 19l3-5 3 5z"/>',
  spawn: '<circle cx="8" cy="7" r="3"/><path d="M6 10v5l-3 5h10l-3-5v-5M18 5v8M14 9h8"/>',
} as const;
const family: Record<CardName, keyof typeof marks> = {
  Freeze:'frost', IceWall:'shield', Strike:'strike', Haste:'haste', Flight:'flight', Sacrifice:'sacrifice', March:'march', Leap:'leap', HolyLight:'light', Mercy:'mercy', DeathTouch:'death', Darkness:'dark',
  Mimic:'mimic', Vault:'leap', Curse:'curse', SkyLift:'swap', Salvation:'return', Rage:'rage', RageB:'rage', Mirror:'mirror', MirrorB:'mirror', Firewall:'shield', FirewallB:'swap', EarthQuake:'quake', EarthQuakeB:'quake', Burn:'burn', FireStarter:'firestarter', Control:'control', Rescue:'return', Growth:'growth', GrowthB:'growth', Rally:'rally', Morph:'morph', MorphB:'morph', MorphP:'morph', MorphS:'swap', Spawn:'spawn', SpawnK:'spawn', Spawn2:'spawn', SpawnK2:'spawn',
};
/** data-card belongs to the card controls, so pictures use their own attributes. */
export function cardSymbol(card: CardName): string {
  return `<svg class="card-symbol" data-card-symbol="${card}" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${marks[family[card]]}</svg>`;
}

const pawn = (x: number, dark = false) => `<g data-piece="pawn" transform="translate(${x} 16)" fill="${dark ? '#514638' : '#fff5da'}" stroke="#514638" stroke-width="1.2"><circle cx="8" cy="4" r="3"/><path d="M5 7h6l-1 6 3 3H3l3-3z"/></g>`;
const knight = (x: number, dark = false) => `<g data-piece="knight" transform="translate(${x} 14)" fill="${dark ? '#514638' : '#fff5da'}" stroke="#514638" stroke-width="1.2"><path d="M1 18h15c0-8-1-14-8-17l1 3-7 6 5 2 3-3-3 5z"/></g>`;
const arrow = '<path d="M33 24h13m-4-4 4 4-4 4"/>';
/** A small rule picture. The text remains the full rule. */
export function cardPicture(card: CardName): string {
  const kind = family[card];
  let scene: string;
  if (kind === 'quake') scene = '<path d="M40 10V3m-4 4 4-4 4 4M40 38v7m-4-4 4 4 4-4M26 24H15m4-4-4 4 4 4M54 24h11m-4-4 4 4-4 4"/><circle cx="40" cy="24" r="6"/>';
  else if (kind === 'shield') scene = pawn(16) + pawn(32) + pawn(48) + '<path d="M12 36V21a28 18 0 0 1 56 0v15"/>';
  else if (kind === 'rally') scene = pawn(12) + pawn(44) + '<path d="M20 15V5m-4 4 4-4 4 4M52 15V5m-4 4 4-4 4 4"/>';
  else if (kind === 'mirror' || kind === 'mimic' || kind === 'growth') scene = `<g transform="translate(12 12)">${marks[kind]}</g>${arrow}<g transform="translate(48 12)">${marks[kind]}</g>`;
  else if (kind === 'control' || kind === 'swap') scene = (kind === 'control' ? knight(12) + knight(52) : pawn(12) + pawn(52)) + '<path d="M25 10h30m-4-4 4 4-4 4M55 38H25m4-4-4 4 4 4"/>';
  else if (kind === 'spawn') {
    const two = card === 'Spawn2' || card === 'SpawnK2', king = card === 'SpawnK' || card === 'SpawnK2';
    scene = (king ? '<g data-piece="king" fill="#fff5da"><path d="M17 19h10l-1 13h-8zM22 8v9M18 12h8"/></g>' : '<path d="M20 18v12m-6-6h12"/>')
      + (king ? '' : arrow) + (two ? pawn(40) + pawn(55) : pawn(48)) + '<path d="M55 9v3M65 15l-2 2"/>';
  }
  else if (kind === 'morph') scene = pawn(12) + arrow + '<path d="M53 32h15c0-8-1-14-8-17l1 3-7 6 5 2 3-3-3 5z" fill="#fff5da"/>';
  else scene = (kind === 'burn' || kind === 'firestarter' ? knight(12) : pawn(12, kind === 'curse')) + arrow + `<g transform="translate(49 12)">${marks[kind]}</g>`;
  return `<svg class="card-picture" data-card-picture="${card}" viewBox="0 0 80 48" aria-hidden="true" focusable="false"><rect x="10" y="6" width="60" height="36" rx="6" fill="#d9cdb6"/><path d="M30 6v36M50 6v36M10 24h60" stroke="#c4b69c" fill="none"/><g fill="none" stroke="#695035" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${scene}</g></svg>`;
}
