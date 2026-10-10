import { describe, expect, it } from 'vitest';
import { SETTINGS as SYNCED } from '../account/sync';
import { SETTINGS } from './save';
import { settingsOf } from './settings';

const controls = { skill: 'club', coords: true, sound: false, queen: true, pace: 'fast', threats: false, labels: false } as const;

describe("the save's settings fields", () => {
  it('are the fields that account/sync.ts syncs as settings', () => {
    expect([...SETTINGS]).toEqual(SYNCED);
  });

  it('settingsNow writes each of them, in this order, and no other field', () => {
    expect(Object.keys(settingsOf(controls))).toEqual([...SETTINGS]);
  });

  it('copies the plain control values; Piece letters is written only when on', () => {
    expect(JSON.stringify(settingsOf(controls))).toBe('{"skill":"club","coords":true,"sound":false,"queen":true,"pace":"fast","threats":false}');
    expect(settingsOf({ ...controls, labels: true }).labels).toBe(true);
  });
});
