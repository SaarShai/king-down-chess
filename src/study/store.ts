import { parseDocument, studyOf, type StudyDocument } from './browser-service';

type StudyStorage = Pick<Storage, 'getItem' | 'setItem'>;
const KEY = 'kingdown.studies', MAX_DOCUMENT = 1024 * 1024, MAX_BOX = 8 * MAX_DOCUMENT;
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
  if (!box || typeof box !== 'object' || Array.isArray(box) || Object.keys(box).sort().join(',') !== 'documents,version' || box.version !== 1 || !Array.isArray(box.documents) || box.documents.length > 50) throw new Error('Unsupported or corrupt study storage.');
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
    const raw = JSON.stringify({ version: 1, documents: [...documents, document] });
    if (new TextEncoder().encode(raw).length > MAX_BOX) throw new Error('Study storage size limit.');
    target.setItem(KEY, raw); return { ok: true };
  } catch (error) { return { ok: false, error: message(error) }; }
}
