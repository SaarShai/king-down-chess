import type { KingName } from './rules/rules';

// Display only. The IDs in saves, tools and asset paths stay unchanged.
const labels: Record<KingName, string> = {
  Frost: 'Frost', Flame: 'Flame', Stratus: 'Sky', Mud: 'Earth', Spirit: 'Spirit', Shadow: 'Shadow',
};
export const kingDisplayName = (id: string): string => Object.hasOwn(labels, id) ? labels[id as KingName] : id;
