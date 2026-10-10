import type { SkillName } from '../ai/skill';
import type { Pace } from '../render/PaintedView';

/** The settings controls' values, and the computer's level. */
export interface Controls { skill: SkillName; coords: boolean; sound: boolean; queen: boolean; pace: Pace; threats: boolean; labels: boolean }

/** The save's settings fields (screen/save.ts SETTINGS), in the order the save writes them. */
export const settingsOf = (c: Controls) => ({
  skill: c.skill,
  coords: c.coords,
  sound: c.sound,
  queen: c.queen,
  pace: c.pace,
  threats: c.threats,
  labels: c.labels || undefined, // a new setting: written only when on
});
