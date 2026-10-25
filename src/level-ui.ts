import type { SkillName } from './ai/skill';

export const MENU_LEVELS = ['beginner', 'casual', 'club'] as const;
export const LEVEL_NAMES: Record<SkillName, string> = { beginner: 'Casual', casual: 'Clever', club: 'Club', strong: 'Strong' };
export const LEVEL_LINES: Record<SkillName, string> = { beginner: 'New to King Down? Start here.', casual: 'Makes some mistakes.', club: 'Plays well. Keep your pieces safe.', strong: 'Thinks longer. Plays stronger.' };
export const menuLevel = (level: SkillName) => level === 'strong' ? 'club' : level;
export const levelPosition = (level: SkillName) => MENU_LEVELS.indexOf(menuLevel(level));
export function levelSlider(id: string) {
  return `<div id="${id}-control" class="level-control"><label for="${id}">Level<input id="${id}" type="range" min="0" max="2" step="1" aria-describedby="level-line"></label><div class="level-stops" aria-hidden="true"><span>Casual</span><span>Clever</span><span>Club</span></div></div>`;
}
