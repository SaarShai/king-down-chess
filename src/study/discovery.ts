import { z } from 'zod';
import { ALL_CARDS, KINGS, DEFAULT_RULES } from '../rules/rules';
import { R, T, typeOf, colorOf } from '../rules/engine';
import { canonicalMeasurementJSON as canonical } from './measurement-plan';
import { parseStudy, type Study } from './model';
import { parseTest, checkStudy, type Fact, type StudyTest } from './check';
import { openStudy, type StudySnapshot } from './session';
import { exampleStudies } from './examples';

export const DISCOVERY_VERSION = 'pairs-1';
export interface Descriptor { id: string; label: string; source: string; fields: string[]; phases: string[]; modes: string[]; dependencies: string[]; conflicts: string[] }
const item = (id: string, label: string, fields: string[], phases: string[]): Descriptor => ({ id, label, fields, phases, source: 'docs/MATRIX.md', modes: ['kingdown'], dependencies: [], conflicts: [] });
export const discoveryCatalog: Descriptor[] = [
  item('piece:R', 'Rook', ['board', 'capture'], ['move']),
  item('piece:T', 'Study design', ['board', 'capture'], ['move']),
  item('rule:blockers', 'Path blockers', ['board', 'capture'], ['move']),
  ...ALL_CARDS.map(name => item(`card:${name}`, name, ['board', 'used', 'turn', ...(name === 'Freeze' || name === 'HolyLight' ? ['marks'] : [])], ['card', 'turn-end'])),
  ...Object.entries(KINGS).flatMap(([king, powers]) => powers.map(power => item(`power:${king}:${power}`, `${king} ${power}`, ['board', 'used', 'turn', ...(power === 'Freeze' || power === 'HolyLight' ? ['marks'] : [])], ['power', 'turn-end']))),
];
export async function digest(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(canonical(value));
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), b => b.toString(16).padStart(2, '0')).join('');
}
export type CoverageState = 'missing' | 'draft' | 'ready' | 'passed' | 'failed' | 'blocked' | 'unsupported' | 'stale';
export interface Obligation { id: string; items: string[]; order: string[]; ownership: 'same' | 'opposed'; template: string | null; reason: string; priority: number }
export interface ProposalSet { context: string; scope: string[]; obligations: Obligation[]; selected: string[]; omitted: string[]; exclusions: { items: string[]; reason: string }[] }
export async function proposals(input: Study, scope: string[], budget = 24): Promise<ProposalSet> {
  const study = parseStudy(input);
  if (!Number.isInteger(budget) || budget < 1 || budget > 200) throw new Error('Choose a budget from 1 to 200.');
  if (scope.length < 2 || scope.length > 12 || new Set(scope).size !== scope.length) throw new Error('Choose 2 to 12 distinct items.');
  const ids = [...scope].sort();
  if (ids.some(id => !discoveryCatalog.some(d => d.id === id))) throw new Error('Unknown catalog item.');
  const context = await digest({ version: DISCOVERY_VERSION, catalog: discoveryCatalog, study, scope: ids });
  const obligations: Obligation[] = [], exclusions: ProposalSet['exclusions'] = [];
  for (let a = 0; a < ids.length; a++) for (let b = a + 1; b < ids.length; b++) {
    const pair = [ids[a], ids[b]], descriptors = pair.map(id => discoveryCatalog.find(d => d.id === id)!);
    for (const ownership of ['same', 'opposed'] as const) {
      if (ownership === 'same' && pair.every(id => id.startsWith('power:'))) {
        exclusions.push({ items: pair, reason: 'One king power per side (rules.kings; docs/MATRIX.md).' }); continue;
      }
      const orders = pair.some(id => id.startsWith('card:') || id.startsWith('power:')) ? [pair, [...pair].reverse()] : [pair];
      for (const order of orders) {
        const piece = pair.find(id => id === 'piece:R' || id === 'piece:T');
        let template: string | null = null;
        if (piece && pair.includes('rule:blockers') && ownership === 'opposed') template = 'paths';
        if (piece && pair.includes('card:Haste') && ownership === 'same' && order[0] === 'card:Haste') template = 'extra-action';
        if (piece && pair.includes('power:Frost:Freeze') && ownership === 'opposed' && order[0] === 'power:Frost:Freeze') template = 'protection-expiry';
        const shared = descriptors[0].fields.filter(f => descriptors[1].fields.includes(f));
        const reason = template ? `Authored ${template} fixture with positive and negative checks. ${shared.length ? `Shared state: ${shared.join(', ')}.` : ''}` : 'No authored adapter for this order and ownership. This cell remains unsupported.';
        obligations.push({ id: await digest({ context, pair, ownership, order, template }), items: pair, order, ownership, template, reason, priority: shared.length ? 2 : 3 });
      }
    }
  }
  if (obligations.length > 200) throw new Error(`${obligations.length} obligations exceed the 200-cell limit. Narrow the scope.`);
  obligations.sort((a,b) => a.priority-b.priority || canonical([a.items,a.ownership,a.order]).localeCompare(canonical([b.items,b.ownership,b.order])));
  return { context, scope: ids, obligations, selected: obligations.slice(0,budget).map(c=>c.id), omitted: obligations.slice(budget).map(c=>c.id), exclusions };
}
/** Fixtures vary only the named resources. Other rule changes need their own authored adapter. */
export function scenario(parent: Study, obligation: Obligation): StudyTest {
  if (!obligation.template) throw new Error('This obligation has no scenario adapter.');
  const examples = exampleStudies(parent.engine);
  const fixture = structuredClone(examples[{ paths: 0, 'extra-action': 1, 'protection-expiry': 2 }[obligation.template] ?? -1]);
  if (!fixture) throw new Error('Unknown scenario template.');
  for (const key of Object.keys(DEFAULT_RULES) as (keyof typeof DEFAULT_RULES)[]) {
    if (['hands','kings','design'].includes(key)) continue;
    if (canonical(parent.rules[key]) !== canonical(DEFAULT_RULES[key])) throw new Error(`No fixture adapter for changed rule ${key}.`);
  }
  if (obligation.items.includes('piece:T')) {
    if (canonical(parent.rules.design) !== canonical(fixture.study.rules.design)) throw new Error('This fixture supports the authored Rook design only. Choose Rook for the standard piece.');
    fixture.study.design = structuredClone(parent.design);
  } else {
    fixture.study.start.board = fixture.study.start.board.map(p => typeOf(p) === T ? R | colorOf(p) * 16 : p);
    fixture.study.actions = fixture.study.actions.map(a => a.replace(/^T/, 'R'));
    fixture.checks = fixture.checks.map(f => f.kind === 'legal' ? { ...f, lan: f.lan.replace(/^T/, 'R'), label: f.label.replace(/^T/, 'R') } : f.kind === 'piece' && f.expected === T ? { ...f, expected: R } : f);
    fixture.study.rules.design = null; delete fixture.study.design;
    if (fixture.challenge) fixture.challenge.solutions = fixture.challenge.solutions.map(line=>line.map(a=>a.replace(/^T/,'R')));
  }
  fixture.study.id = `proposal-${obligation.id}`;
  fixture.study.title = `${obligation.template}: ${obligation.items.join(' + ')}`;
  fixture.coverage = [{ id: obligation.id, items: obligation.items, state: 'tested', reason: obligation.reason, checks: fixture.checks.map(c=>c.id) }];
  const test = parseTest(fixture), report = checkStudy(test, parent.engine);
  if (report.status !== 'passed') throw new Error(report.error ?? 'The authored fixture no longer passes.');
  return test;
}
const text = z.string().min(1).max(2000), hash = z.string().regex(/^[a-f0-9]{64}$/);
const provenanceSchema = z.strictObject({
  kind: z.enum(['scenario','study-replay','run-replay']), inputHash: hash, source: text,
  run: text.nullable(), part: text.nullable(), game: z.number().int().nonnegative().nullable(), pair: z.number().int().nonnegative().nullable(),
  spec: text.nullable(), settings: z.json(), action: z.number().int().min(0).max(1000), actor: z.union([z.literal(0),z.literal(1)]),
});
export type Provenance = z.infer<typeof provenanceSchema>;
const entrySchema = z.strictObject({ candidate: hash, obligation: hash.nullable(), context: hash, basis: text, confirmed: z.literal(true), test: z.unknown(), provenance: provenanceSchema, testHash: hash });
const scanSchema = z.strictObject({ inputHash: hash, source: text, games: z.number().int().min(1).max(200), actions: z.number().int().min(0).max(20000), threshold: z.number().int().min(1).max(10000), candidates: z.number().int().nonnegative(), inputs: z.array(z.strictObject({id:text,hash})).min(1).max(200) });
const schema = z.strictObject({ schema: z.literal('kingdown-discovery/1'), version: z.literal(1), parent: z.strictObject({ id: text, version: z.number().int().positive(), hash }), scope: z.array(text).min(2).max(12), context: hash, scans: z.array(scanSchema).max(50).optional(), drafts: z.array(z.strictObject({ obligation: hash, test: z.unknown(), testHash: hash })).max(50), entries: z.array(entrySchema).max(50) });
export type DiscoveryEntry = Omit<z.infer<typeof entrySchema>, 'test'> & { test: StudyTest };
export type DiscoveryDocument = Omit<z.infer<typeof schema>, 'entries' | 'drafts'> & { entries: DiscoveryEntry[]; drafts: { obligation: string; test: StudyTest; testHash: string }[] };
export async function parseDiscovery(input: unknown): Promise<DiscoveryDocument> {
  if (new TextEncoder().encode(JSON.stringify(input)).length > 8*1024*1024) throw new Error('Discovery file exceeds 8 MiB.');
  const parsed = schema.parse(input);
  const entries: DiscoveryEntry[] = [];
  for (const e of parsed.entries) {
    const test = parseTest(e.test);
    if (await digest(test) !== e.testHash || e.context !== parsed.context) throw new Error('Discovery content binding differs.');
    if (e.provenance.action > test.study.actions.length || e.provenance.source !== test.study.engine && e.provenance.kind !== 'run-replay') throw new Error('Replay source or boundary differs.');
    entries.push({ ...e, test });
  }
  if (new Set(entries.map(e=>e.test.study.id)).size !== entries.length || new Set(parsed.scope).size !== parsed.scope.length) throw new Error('Duplicate discovery identity.');
  const drafts = [];
  for (const draft of parsed.drafts) {
    const test = parseTest(draft.test);
    if (await digest(test) !== draft.testHash) throw new Error('Draft binding differs.');
    drafts.push({ ...draft, test });
  }
  return { ...parsed, entries, drafts };
}
export async function newDiscovery(parent: Study, set: ProposalSet): Promise<DiscoveryDocument> {
  return { schema: 'kingdown-discovery/1', version: 1, parent: { id: parent.id, version: parent.version, hash: await digest(parent) }, scope: set.scope, context: set.context, drafts: [], entries: [] };
}
export async function promote(doc: DiscoveryDocument, study: Study, checks: Fact[], provenance: Provenance, basis: string, confirmed: boolean, obligation: string | null): Promise<DiscoveryDocument> {
  if (!confirmed || !basis.trim()) throw new Error('State the expected behavior and its basis, then confirm it.');
  if (!checks.length) throw new Error('Select at least one expected fact.');
  const candidate = await digest({ study, provenance }), id = await digest({ candidate, checks, basis: basis.trim(), obligation, context: doc.context });
  const test = parseTest({ schema:'kingdown-test/1', study: { ...structuredClone(study), id: `regression-${id}`, version:1, parentVersion:null }, checks,
    coverage: [{ id: obligation ?? id, items: obligation ? ['reviewed pair'] : ['reviewed replay'], state: 'tested', reason: basis.trim(), checks: checks.map(c=>c.id) }] });
  const actor = openStudy({ ...study, actions: study.actions.slice(0, Math.max(0, provenance.action - 1)) }, study.engine).snapshot().position.turn;
  if (provenance.action !== study.actions.length || provenance.actor !== actor) throw new Error('Replay boundary or actor differs.');
  const report = checkStudy(test, study.engine);
  if (report.status === 'invalid') throw new Error(report.error);
  if (doc.entries.some(e => e.test.study.id === test.study.id)) return doc;
  return parseDiscovery({ ...doc, entries: [...doc.entries, { candidate, obligation, context: doc.context, basis: basis.trim(), confirmed:true, test, provenance, testHash: await digest(test) }] });
}
export async function coverage(parent: Study, set: ProposalSet, documents: DiscoveryDocument[]): Promise<{ obligation: Obligation; state: CoverageState; reason: string }[]> {
  const rows = [];
  for (const obligation of set.obligations) {
    const entries = documents.filter(d=>d.parent.id===parent.id).flatMap(d=>d.entries.map(e=>({e,d})));
    const current = entries.filter(({e})=>e.context===set.context && e.obligation===obligation.id);
    let state: CoverageState = 'missing', reason = obligation.reason;
    try { scenario(parent, obligation); } catch (error) { state='unsupported'; reason=String(error instanceof Error ? error.message : error); }
    if (current.length) {
      const reports = current.map(({e})=> {
        let fixture: StudyTest;
        try { fixture = scenario(parent, obligation); } catch (error) { return {status:'invalid',error:String(error)} as const; }
        const context = (s: Study) => ({ engine:s.engine, rules:s.rules, design:s.design??null, start:s.start, prefix:s.prefix, actions:s.actions });
        const target = (f: Fact) => { const {id: _id,label: _label,expected: _expected,...rest}=f; return canonical(rest); };
        const relevant = fixture.checks.filter(f=> f.kind==='legal' || f.kind==='state' && ['turn','marks','haste'].includes(f.field));
        if (canonical(context(e.test.study))!==canonical(context(fixture.study)) || !e.test.checks.some(f=>relevant.some(r=>target(r)===target(f)))) return {status:'invalid',error:'No check binds this case to the interaction boundary.'} as const;
        return checkStudy(e.test,parent.engine);
      });
      state = reports.some(r=>r.status==='failed') ? 'failed' : reports.some(r=>r.status==='invalid') ? 'blocked' : 'passed';
      reason = reports.find(r=>r.error)?.error ?? `${current.length} reviewed case(s); current checks executed.`;
    } else {
      const staleIds = await Promise.all(documents.filter(d=>d.parent.id===parent.id && d.context!==set.context).map(async d=>({ d, id:await digest({context:d.context,pair:obligation.items,ownership:obligation.ownership,order:obligation.order,template:obligation.template}) })));
      if (staleIds.some(({d,id})=>d.entries.some(e=>e.obligation===id) || d.drafts.some(e=>e.obligation===id))) { state='stale'; reason='Earlier case belongs to a different source or context.'; }
      if (documents.some(d=>d.context===set.context && d.drafts.some(e=>e.obligation===obligation.id))) { state='draft'; reason='Expected checks await designer review.'; }
    }
    rows.push({obligation,state,reason});
  }
  return rows;
}
export interface Candidate { id: string; study: Study; provenance: Provenance; signals: string[]; snapshot: StudySnapshot }
/** Every candidate retains the original start and complete history. No board-only deduplication. */
export async function scanReplay(studyInput: Study, provenance: Omit<Provenance,'action'|'actor'>, engine: string, legalThreshold=12, expected: Fact[]=[]): Promise<Candidate[]> {
  if (!Number.isInteger(legalThreshold) || legalThreshold<1 || legalThreshold>10000) throw new Error('Choose a legal-action threshold from 1 to 10,000.');
  const study=parseStudy(studyInput), session=openStudy({...study,actions:[]},engine), output: Candidate[]=[];
  let before=session.snapshot(), changed=0;
  for (let i=0;i<study.actions.length;i++) {
    const next=session.play(study.actions[i]);
    const signals:string[]=[];
    const fields=['marks','used','drawn'] as const;
    if (fields.some(k=>canonical(before.position[k]??null)!==canonical(next.position[k]??null))) changed++;
    if (changed>1) signals.push('Repeated mark or resource change in one turn');
    if (before.position.turn===next.position.turn) signals.push('Extra action: the same side still acts');
    if (before.position.board.filter(Boolean).length-next.position.board.filter(Boolean).length>1) signals.push('More than one piece removed');
    if (Math.abs(before.legal.length-next.legal.length)>=legalThreshold) signals.push(`Legal action count changes by at least ${legalThreshold}`);
    if (next.status!=='playing' && (before.position.marks || before.position.haste!==undefined || study.actions[i].includes('!'))) signals.push('Terminal state near an effect');
    const at=expected.filter(f=>f.after===i+1);
    const extracted={...study, actions:study.actions.slice(0,i+1)};
    if (at.length && checkStudy({schema:'kingdown-test/1',study:extracted,checks:at,coverage:[{id:'expected',items:['expected'],state:'tested',reason:'Declared expectations',checks:at.map(f=>f.id)}]},engine).status==='failed') signals.push('Declared expectation mismatch');
    if (signals.length) {
      const source={...provenance,settings:JSON.parse(canonical({input:provenance.settings,detector:{version:DISCOVERY_VERSION,legalThreshold,signals,before:{turn:before.position.turn,legal:before.legal.length,marks:before.position.marks??null,used:before.position.used??null},after:{turn:next.position.turn,legal:next.legal.length,marks:next.position.marks??null,used:next.position.used??null}}})),action:i+1,actor:before.position.turn};
      output.push({id:await digest({study:extracted,source}),study:extracted,provenance:source,signals,snapshot:next});
    }
    if(before.position.turn!==next.position.turn) changed=0;
    before=next;
  }
  return output;
}
