import { afterEach, expect, it, vi } from 'vitest';
import { markHintSeen, readHints, resetHints } from './hints';
afterEach(() => vi.unstubAllGlobals());
function storage() {
  const values = new Map<string, string>();
  vi.stubGlobal('localStorage', { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) });
  resetHints(); return values;
}
it('power and card hints are separate and persist once', () => {
  const values = storage(); markHintSeen('power:Freeze');
  expect(readHints().has('power:Freeze')).toBe(true); expect(readHints().has('card:Freeze')).toBe(false);
  markHintSeen('card:Freeze'); markHintSeen('card:Freeze');
  expect(JSON.parse(values.get('kingdown.hints')!)).toEqual({ version: 1, seen: ['power:Freeze', 'card:Freeze'] });
});
it('bad or refused hint storage leaves play usable', () => {
  const values = storage();
  for (const raw of ['{', '{"version":2,"seen":["card:Freeze"]}', '{"version":1,"seen":"x"}', '{"version":1,"seen":["card:Unknown"]}']) {
    resetHints(); values.set('kingdown.hints', raw); expect(readHints().size).toBe(0);
  }
  resetHints(); vi.stubGlobal('localStorage', { getItem() { throw Error('read'); }, setItem() { throw Error('write'); }, removeItem() { throw Error('reset'); } });
  markHintSeen('card:Freeze'); expect(readHints().has('card:Freeze')).toBe(true);
  expect(resetHints()).toBe(false); expect(readHints().size).toBe(0);
});
it('reset changes only hints', () => {
  const values = storage();
  for (const key of ['kingdown.save', 'kingdown.save.kept', 'kingdown.setup', 'kingdown.piece-view', 'unrelated-progress']) values.set(key, `bytes:${key}`);
  const before = [...values]; markHintSeen('card:MirrorB'); expect(resetHints()).toBe(true);
  expect([...values]).toEqual(before); expect(readHints().size).toBe(0);
});
