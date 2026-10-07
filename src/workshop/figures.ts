/** Approved Workshop identities. Tags suggest a look; they never grant rules. */
import type { PieceDesign } from './model';
export const FIGURE_TAGS = ['Fast', 'Strong', 'Ranged', 'Magic', 'Support'] as const;
export type FigureTag = typeof FIGURE_TAGS[number];
export interface Figure { id: string; name: string; tags: readonly FigureTag[] }
export const FIGURES: readonly Figure[] = [
  {
    "id": "blade-dancer",
    "name": "Blade Dancer",
    "tags": [
      "Fast"
    ]
  },
  {
    "id": "ram-bastion",
    "name": "Ram Bastion",
    "tags": [
      "Strong"
    ]
  },
  {
    "id": "crossbow-warden",
    "name": "Crossbow Warden",
    "tags": [
      "Ranged"
    ]
  },
  {
    "id": "lantern-witch",
    "name": "Lantern Witch",
    "tags": [
      "Magic"
    ]
  },
  {
    "id": "banner-keeper",
    "name": "Banner Keeper",
    "tags": [
      "Support"
    ]
  },
  {
    "id": "javelin-runner",
    "name": "Javelin Runner",
    "tags": [
      "Fast",
      "Ranged"
    ]
  },
  {
    "id": "wind-courier",
    "name": "Wind Courier",
    "tags": [
      "Fast"
    ]
  },
  {
    "id": "iron-warden",
    "name": "Iron Warden",
    "tags": [
      "Strong"
    ]
  },
  {
    "id": "stone-slinger",
    "name": "Stone Slinger",
    "tags": [
      "Ranged"
    ]
  },
  {
    "id": "mirror-seer",
    "name": "Mirror Seer",
    "tags": [
      "Magic"
    ]
  },
  {
    "id": "field-mender",
    "name": "Field Mender",
    "tags": [
      "Support"
    ]
  },
  {
    "id": "antler-guardian",
    "name": "Antler Guardian",
    "tags": [
      "Strong"
    ]
  },
  {
    "id": "bell-sage",
    "name": "Bell Sage",
    "tags": [
      "Magic",
      "Support"
    ]
  },
  {
    "id": "drum-marshal",
    "name": "Drum Marshal",
    "tags": [
      "Support"
    ]
  },
  {
    "id": "rooftop-vaulter",
    "name": "Rooftop Vaulter",
    "tags": [
      "Fast"
    ]
  },
  {
    "id": "shell-bastion",
    "name": "Shell Bastion",
    "tags": [
      "Strong"
    ]
  },
  {
    "id": "reed-hunter",
    "name": "Reed Hunter",
    "tags": [
      "Ranged"
    ]
  },
  {
    "id": "hourglass-keeper",
    "name": "Hourglass Keeper",
    "tags": [
      "Magic"
    ]
  },
  {
    "id": "forge-bearer",
    "name": "Forge Bearer",
    "tags": [
      "Strong",
      "Support"
    ]
  },
  {
    "id": "owl-archivist",
    "name": "Owl Archivist",
    "tags": [
      "Support"
    ]
  },
  {
    "id": "hare-scout",
    "name": "Hare Scout",
    "tags": [
      "Fast"
    ]
  },
  {
    "id": "hornet-swarm",
    "name": "Hornet Swarm",
    "tags": [
      "Fast",
      "Ranged"
    ]
  },
  {
    "id": "mechanical-spiders",
    "name": "Mechanical Spiders",
    "tags": [
      "Fast",
      "Strong"
    ]
  },
  {
    "id": "dart-sentinel",
    "name": "Dart Sentinel",
    "tags": [
      "Ranged"
    ]
  },
  {
    "id": "fox-pathfinder",
    "name": "Fox Pathfinder",
    "tags": [
      "Fast"
    ]
  },
  {
    "id": "eagle-keeper",
    "name": "Eagle Keeper",
    "tags": [
      "Ranged"
    ]
  },
  {
    "id": "tide-caller",
    "name": "Tide Caller",
    "tags": [
      "Support"
    ]
  },
  {
    "id": "wooden-catapult",
    "name": "Wooden Catapult",
    "tags": [
      "Ranged"
    ]
  },
  {
    "id": "battering-ram",
    "name": "Battering Ram",
    "tags": [
      "Strong"
    ]
  },
  {
    "id": "drill-crawler",
    "name": "Drill Crawler",
    "tags": [
      "Strong"
    ]
  },
  {
    "id": "water-deity",
    "name": "Water Deity",
    "tags": [
      "Magic"
    ]
  },
  {
    "id": "fire-spirit",
    "name": "Fire Spirit",
    "tags": [
      "Magic"
    ]
  },
  {
    "id": "clay-golem",
    "name": "Clay Golem",
    "tags": [
      "Strong"
    ]
  },
  {
    "id": "storm-spirit",
    "name": "Storm Spirit",
    "tags": [
      "Magic",
      "Fast"
    ]
  }
];
export const figureById = (id: string): Figure | undefined => FIGURES.find(f => f.id === id);
export const figureUrl = (id: string, army: 0 | 1 = 0): string => `${import.meta.env?.BASE_URL ?? './'}ui/workshop/${id}-${army ? 'b' : 'w'}.webp`;
type Design = Pick<PieceDesign, 'squares' | 'lines' | 'rules'>;
export function suggestedFigures(d: Design): Figure[] {
  const has = (...abilities: string[]) => d.rules.some(r => abilities.includes(r.does.a));
  const scores: Record<FigureTag, number> = {
    Fast: Number(d.lines.length > 0 || d.squares.some(s => Math.max(Math.abs(s.x), Math.abs(s.y)) > 1) || has('step2', 'linesPass', 'chain')) * 2,
    Strong: Number(has('push', 'cannotBeTaken') || d.rules.some(r => r.when.on === 'firstTake')) * 3,
    Ranged: Number(d.squares.some(s => s.mark === 'shoot' || s.mark === 'moveShoot')) * 4,
    Magic: Number(has('becomes', 'removedAfter', 'movesLike') || d.rules.some(r => ['afterCard', 'fromMove', 'beforeMove'].includes(r.when.on))) * 2,
    Support: Number(has('swap', 'cannotTake')) * 3,
  };
  return [...FIGURES].sort((a, b) => Math.max(...b.tags.map(t => scores[t])) - Math.max(...a.tags.map(t => scores[t]))).slice(0, 3);
}
/** Saved choices stay fixed; an unset choice follows the design until the player picks. */
export const selectedFigure = (d: Design & Pick<PieceDesign, 'look'>): Figure =>
  (d.look.figure && figureById(d.look.figure)) || suggestedFigures(d)[0];
