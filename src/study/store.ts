import { parseDocument, studyOf, type StudyDocument } from './browser-service';
import { MAX_STUDY_BYTES } from './evidence';
import { parseDiscovery, digest, proposals, type DiscoveryDocument } from './discovery';

export type StudyStorage = Pick<Storage, 'getItem' | 'setItem'>;
const KEY = 'kingdown.studies', MAX_DOCUMENT = MAX_STUDY_BYTES, MAX_BOX = 8 * MAX_DOCUMENT;
function message(error: unknown): string { return error instanceof Error ? error.message : String(error); }
function storageOf(storage?: StudyStorage): StudyStorage {
  const found = storage ?? globalThis.localStorage;
  if (!found) throw new Error('Study storage is unavailable.');
  return found;
}
function read(storage: StudyStorage): StudyDocument[] {
  const raw = storage.getItem(KEY);
  if (raw === null) return [];
  if (new TextEncoder().encode(raw).length > MAX_BOX) throw new Error('Study storage size limit.');
  const box = JSON.parse(raw);
  if (!box || typeof box !== 'object' || Array.isArray(box) || !['documents,version','discoveries,documents,version'].includes(Object.keys(box).sort().join(',')) || box.version !== 1 || !Array.isArray(box.documents) || box.documents.length > 50) throw new Error('Unsupported or corrupt study storage.');
  const documents = box.documents.map((doc: unknown) => {
    if (new TextEncoder().encode(JSON.stringify(doc)).length > MAX_DOCUMENT) throw new Error('Study document size limit.');
    return parseDocument(doc);
  });
  const ids = documents.map((doc: StudyDocument) => { const s = studyOf(doc); return JSON.stringify([s.id, s.version]); });
  if (new Set(ids).size !== ids.length) throw new Error('Duplicate saved study version.');
  return documents;
}
export function loadStudies(storage?: StudyStorage): { documents: StudyDocument[]; error: string | null } {
  try { return { documents: read(storageOf(storage)), error: null }; }
  catch (error) { return { documents: [], error: message(error) }; }
}
export function saveStudyDocument(input: StudyDocument, storage?: StudyStorage): { ok: boolean; error?: string } {
  try {
    const encoded = JSON.stringify(input);
    if (new TextEncoder().encode(encoded).length > MAX_DOCUMENT) throw new Error('Study document size limit.');
    const document = parseDocument(input), study = studyOf(document), target = storageOf(storage), documents = read(target);
    const existing = documents.find(doc => studyOf(doc).id === study.id && studyOf(doc).version === study.version);
    if (existing) {
      if (JSON.stringify(existing) !== JSON.stringify(document)) throw new Error('This study version is already saved. Save a new version.');
      return { ok: true };
    }
    if (documents.length >= 50) throw new Error('Study storage holds at most 50 versions.');
    const prior = JSON.parse(target.getItem(KEY) ?? '{}');
    const raw = JSON.stringify({ version: 1, documents: [...documents, document], ...(prior.discoveries ? { discoveries: prior.discoveries } : {}) });
    if (new TextEncoder().encode(raw).length > MAX_BOX) throw new Error('Study storage size limit.');
    target.setItem(KEY, raw); return { ok: true };
  } catch (error) { return { ok: false, error: message(error) }; }
}

export async function loadDiscoveries(storage?: StudyStorage): Promise<DiscoveryDocument[]> {
  const target = storageOf(storage); read(target);
  const box = JSON.parse(target.getItem(KEY) ?? '{}');
  if (box.discoveries === undefined) return [];
  if (!Array.isArray(box.discoveries) || box.discoveries.length > 50) throw new Error('Corrupt discovery storage.');
  const docs = await Promise.all(box.discoveries.map(parseDiscovery));
  const studies = read(target);
  for (const doc of docs) for (const entry of doc.entries) {
    const found = studies.find(s => studyOf(s).id === entry.test.study.id && studyOf(s).version === entry.test.study.version);
    if (JSON.stringify(found) !== JSON.stringify(entry.test)) throw new Error('Regression and provenance differ.');
  }
  return docs;
}
/** One setItem publishes both the ordinary tests and their provenance. */
export async function saveDiscoveryDocument(input: unknown, storage?: StudyStorage): Promise<DiscoveryDocument> {
  const document = await parseDiscovery(input), target = storageOf(storage);
  const before = target.getItem(KEY), discoveries = await loadDiscoveries(target), documents = read(target);
  const parent = documents.find(d=>studyOf(d).id===document.parent.id && studyOf(d).version===document.parent.version);
  if (!parent || await digest(studyOf(parent))!==document.parent.hash) throw new Error('Import the exact parent study version before this discovery.');
  const expected = await proposals(studyOf(parent), document.scope);
  if (expected.context !== document.context || [...document.entries, ...document.drafts].some(e=>e.obligation!==null && !expected.obligations.some(o=>o.id===e.obligation))) throw new Error('Discovery scope or obligation binding differs.');
  const index = discoveries.findIndex(d => d.context === document.context);
  if (index >= 0) {
    const prior = discoveries[index];
    for (const e of prior.entries) if (!document.entries.some(n => JSON.stringify(n) === JSON.stringify(e))) throw new Error('Saved regression cannot be overwritten.');
    discoveries[index] = document;
  } else discoveries.push(document);
  for (const entry of document.entries) {
    const existing = documents.find(d => studyOf(d).id === entry.test.study.id && studyOf(d).version === entry.test.study.version);
    if (existing && JSON.stringify(existing) !== JSON.stringify(entry.test)) throw new Error('Saved study identity differs.');
    if (!existing) documents.push(entry.test);
  }
  if (documents.length > 50 || discoveries.length > 50) throw new Error('Study storage holds at most 50 versions.');
  const raw = JSON.stringify({ version: 1, documents, discoveries });
  if (new TextEncoder().encode(raw).length > MAX_BOX) throw new Error('Study storage size limit.');
  if (target.getItem(KEY) !== before) throw new Error('Study library changed. Reload before saving.');
  target.setItem(KEY, raw);
  return document;
}
