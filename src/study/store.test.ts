import { describe, expect, it } from 'vitest';
import { DEFAULT_RULES } from '../rules/rules';
import { fromFen } from '../rules/setup';
import { createStudy, positionData } from './model';
import { loadStudies, saveStudyDocument } from './store';
function fixture() {
  return createStudy({ id: 'one', version: 1, parentVersion: null, title: 'Rook', question: 'Can it move?', engine: 'old-source', rules: structuredClone(DEFAULT_RULES), start: positionData(fromFen('7k/8/8/8/3R4/8/8/K7 w - - 0 1')), prefix: [], actions: [], origin: 'constructed' });
}
function storage() {
  const data = new Map<string, string>();
  return { data, getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); } };
}
describe('study storage', () => {
  it('keeps each source and saved version and accepts an exact repeat', () => {
    const s = storage(), one = fixture();
    expect(saveStudyDocument(one, s)).toEqual({ ok: true });
    expect(saveStudyDocument(one, s)).toEqual({ ok: true });
    const two = { ...one, version: 2, parentVersion: 1, actions: ['Rd4-d5'] };
    expect(saveStudyDocument(two, s)).toEqual({ ok: true });
    expect(loadStudies(s)).toEqual({ documents: [one, two], error: null });
    expect(s.data.size).toBe(1);
  });
  it('refuses edits to a saved version and leaves the bytes intact', () => {
    const s = storage(), one = fixture(); saveStudyDocument(one, s);
    const before = s.getItem('kingdown.studies');
    expect(saveStudyDocument({ ...one, title: 'changed' }, s).ok).toBe(false);
    expect(s.getItem('kingdown.studies')).toBe(before);
  });
  it('preserves corrupt boxes and unknown or corrupt records on save', () => {
    for (const raw of ['broken', '{"version":2,"documents":[]}', JSON.stringify({ version: 1, documents: [{ schema: 'future' }] }), JSON.stringify({ version: 1, documents: [fixture(), { ...fixture(), version: 2, start: {} }] })]) {
      const s = storage(); s.setItem('kingdown.studies', raw);
      expect(loadStudies(s).error).toBeTruthy();
      expect(saveStudyDocument(fixture(), s).ok).toBe(false);
      expect(s.getItem('kingdown.studies')).toBe(raw);
    }
  });
  it('reports read, write, and quota failures', () => {
    const inaccessible = { getItem() { throw new Error('Blocked'); }, setItem() {} };
    expect(loadStudies(inaccessible).error).toBe('Blocked');
    expect(saveStudyDocument(fixture(), inaccessible).error).toBe('Blocked');
    const full = { getItem() { return null; }, setItem() { throw new Error('Quota exceeded'); } };
    expect(saveStudyDocument(fixture(), full).error).toBe('Quota exceeded');
  });
  it('bounds version count and box size without overwriting', () => {
    const s = storage();
    for (let version = 1; version <= 50; version++) expect(saveStudyDocument({ ...fixture(), version }, s).ok).toBe(true);
    const before = s.getItem('kingdown.studies');
    expect(saveStudyDocument({ ...fixture(), version: 51 }, s).ok).toBe(false);
    expect(s.getItem('kingdown.studies')).toBe(before);
    s.setItem('kingdown.studies', ' '.repeat(8 * 1024 * 1024 + 1));
    expect(loadStudies(s).error).toMatch(/size limit/);
  });
});
