import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { handleProblem, ICONS } from './profile';

describe('online profile rules', () => {
  it('accepts plain handles: 3 to 20 characters, a letter first, a letter or a digit last', () => {
    for (const good of ['ann', 'bob-2', 'queen_of_mud', 'a'.repeat(20), 'images', 'gmail-fan', 'mode-x', 'grape'])
      expect(handleProblem(good), good).toBeNull();
    for (const bad of ['ab', 'a'.repeat(21), 'Ann', '1ann', 'ann-', 'ann_', 'an n', 'ann!', 'ánn'])
      expect(handleProblem(bad), bad).toMatch(/^Use 3 to 20 characters/);
  });

  it('refuses chess titles, staff words and slurs, also with digits for letters', () => {
    for (const title of ['gm_bob', 'im-ann', 'bob_wgm', 'fm-x9', 'wim']) expect(handleProblem(title), title).toMatch(/chess title/);
    for (const blocked of ['admin', 'the-admin1', 'kingdown-help', 'mod', 'top-mod', 'staff_ann', 'king-moderator', 'fuck-it', 'f_u_c_k', 'n1gg4', 'h1tler'])
      expect(handleProblem(blocked), blocked).toBe('This handle is not available.');
  });

  it('gives each preset icon a picture that exists', () => {
    expect(Object.keys(ICONS).length).toBeGreaterThanOrEqual(12);
    for (const [key, path] of Object.entries(ICONS)) {
      expect(key).toMatch(/^[a-z0-9-]{1,40}$/); // the database check on profiles.icon
      expect(existsSync(`public/${path}`), path).toBe(true);
    }
  });
});
