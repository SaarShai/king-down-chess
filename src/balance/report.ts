import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { assessBand, assessGame, oddsWorth, type Band, type Estimate } from './criteria';
import { predictEffect, type EffectAnchor } from './effects';
import { newDesigns, type WorkbookSource } from './workbook';
import { auditDesign, mapWorkbookVersions } from './design';
import { DIMENSIONS, RULE_DIMENSIONS } from './schema';
import { markdownTables, numericCell, stable, unknownContext, type Measurement } from './measurements';
import type { BalanceDataset } from './dataset';
import { matchesTarget, type TargetContext } from './context';
import { measuredVersions } from './versions';

interface Source { id: string; path: string | null; line?: number; section?: string }
interface Criterion {
  id: string; scope: string; target: Record<string, unknown>; status: string;
  sourceIds: string[]; approvalSourceIds: string[] | null; notes: string | null;
}
interface ReportMeasurement {
  id: string; element: string; version: string; criterionIds?: string[];
  metric: string; value: number | null; unit: string;
  interval: { level: number; low: number; high: number } | null;
  n: number | null; depth: number | null; runIds: string[]; sourceIds: string[];
  context: string; commit: string | null; flags: Record<string, unknown> | null;
  status: string; bound: { operator: '<' | '>'; value: number } | null;
  calibration?: { eloPerPawn: number; relativeError: number | null; errorIncludedInPrintedInterval: boolean | null };
  nUnit?: string;
  simultaneousInterval?: { low: number; high: number };
  calibratedInterval?: { low: number; high: number; kind: string };
}
interface Evidence {
  sources: Source[]; criteria: Criterion[]; measurements: ReportMeasurement[];
  conflicts: { id: string; text: string; sourceIds: string[] }[];
  pendingRuns: { id: string }[];
  nextRuns: { id: string; rank: number; machine: string; games: number; command: string; notebookMinutes: number; estimate: string; preconditions: string; decision: string; proposedSourceCommit?: string; skipIfCompletedRunIds?: string[]; requirements?: { mode: 'ordinary' | 'powers' | 'cards' | 'classic-odds'; measures?: string[]; criteria?: string[]; elements?: string[]; captureExempt?: string[]; paired?: boolean } }[];
}

const escape = (s: unknown) => String(s ?? 'unknown').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const number = (n: number | null) => n === null ? 'unknown' : Number(n.toFixed(4)).toString();
const evidenceId = (id: string) => `evidence:${id}`;
// Tracker lines move. Cite their reviewed heading instead of a line number.
const isTracker = (path: string) => /(?:^|\/)(?:TASKS|LESSONS|QUEUE|HANDOFF[^/]*)\.md$/.test(path);
const sourceLocation = (s: Source) => s.path ? `${s.path}${isTracker(s.path) ? s.section ? ` § ${s.section.replace(/^#+\s*/, '')}` : '' : s.line ? `:${s.line}` : ''}` : s.id;

function canonicalMeasurement(row: ReportMeasurement, sources: Source[]): Measurement {
  const percent = /percent|points/.test(row.unit);
  const scale = percent ? 0.01 : 1;
  const measure: Measurement['measure'] = row.unit === 'pawns' ? /gain|difference/i.test(row.metric) ? 'worthDifference' : 'pawnWorth' : row.unit === 'Elo' ? 'elo' : row.unit === 'turns' ? 'meanTurns' : row.unit === 'plies' ? 'meanPlies' : /draw/i.test(row.metric) ? 'drawRate' : /White/.test(row.metric) ? 'whiteScore' : /length/.test(row.metric) ? 'relativeLengthChange' : /score vs powers|Spirit minus Shadow/.test(row.metric) ? 'score' : 'activity';
  const interval = row.calibratedInterval ?? row.simultaneousInterval ?? row.interval;
  const error = interval && row.value !== null ? Math.max(row.value - interval.low, interval.high - row.value) * scale : null;
  return {
    criterion: row.criterionIds?.[0], id: evidenceId(row.id), run: row.runIds.join('+'), element: row.element, version: row.version,
    context: { ...unknownContext(), flags: row.flags, flagsKind: row.flags ? 'diff' : 'unknown', commit: row.commit, depth: row.depth, population: 'report' },
    measure, value: (row.value ?? row.bound?.value ?? null) === null ? null : (row.value ?? row.bound!.value) * scale,
    error, errorKind: interval ? row.calibratedInterval?.kind ?? (row.simultaneousInterval ? '95% simultaneous armies interval' : `source ${row.interval!.level * 100}% interval; asymmetric limits remain in evidence.json; calibration error may be separate`) : null,
    sample: row.n, sampleUnit: /opening draws/.test(row.nUnit ?? '') ? 'openings' : /arrangements/.test(row.nUnit ?? '') ? 'arrangements' : /games/.test(row.nUnit ?? '') ? 'games' : /pairs|openings/.test(row.nUnit ?? '') ? 'pairs' : 'unknown', unit: percent ? (/points/.test(row.unit) ? 'fraction difference' : 'fraction') : row.unit,
    validity: 'unverified', reasons: ['Report evidence has a stated context. It does not certify the full target rules.', row.context],
    sources: row.sourceIds.map(id => { const s = sources.find(s => s.id === id); return s ? sourceLocation(s) : id; }),
    method: `cited report: ${row.metric}; an alternative view of this run, never an independent sample`,
    ...(row.calibratedInterval ? { interval: row.calibratedInterval } : {}),
    ...(row.bound ? { bound: row.bound.operator === '<' ? 'lessThan' as const : 'greaterThan' as const } : {}),
    ...(row.calibration ? { calibration: { eloPerPawn: row.calibration.eloPerPawn, relativeError: row.calibration.relativeError } } : {}),
  };
}

function criterionBand(criterion: Criterion): Band | null {
  const min = criterion.target.min, max = criterion.target.max;
  if (!(typeof min === 'number' || typeof max === 'number')) return null;
  return { id: criterion.id, min: typeof min === 'number' ? min : null, max: typeof max === 'number' ? max : null,
    approval: criterion.status === 'adopted' ? 'approved' : criterion.status === 'open' ? 'open' : 'proposed' };
}

function rowEstimate(row: ReportMeasurement): Estimate {
  const interval = row.calibratedInterval ?? row.simultaneousInterval ?? row.interval;
  return { id: evidenceId(row.id), value: row.value, low: interval?.low ?? null, high: interval?.high ?? null };
}

function applies(row: ReportMeasurement, criterion: string) {
  if (criterion === 'piece-worth' && /gain|difference/i.test(row.metric)) return false;
  if (row.criterionIds?.includes(criterion)) return true;
  const metrics: Record<string, string[]> = {
    'piece-worth': ['piece worth'], 'piece-captures': ['captures', 'capture ratio'], 'piece-moves': ['moves'],
    'piece-use': ['use'], 'piece-phase': ['best-phase-self'], 'piece-phase-4b': ['best-phase-4b'], 'power-field': ['score vs powers', 'DeathTouch score vs powers'], 'card-worth': ['card worth'],
  };
  return (metrics[criterion] ?? []).includes(row.metric);
}

function historicalCheck(criterion: Criterion, rows: ReportMeasurement[]): { status: string; reason: string; ids: string[] } {
  if (criterion.id === 'piece-game') {
    const part = (metric: RegExp, limit: number) => {
      const row = rows.find(r => metric.test(r.metric));
      return assessBand({ id: criterion.id, min: -limit, max: limit, approval: 'approved' }, row && rowEstimate(row));
    };
    const check = assessGame(part(/draw/, 3), part(/White/, 2), part(/length/, 10));
    return { status: check.status, reason: check.reason, ids: check.evidence };
  }
  const band = criterionBand(criterion);
  if (!band) return { status: 'no-data', reason: criterion.notes ?? 'This criterion needs a comparison or an owner margin.', ids: rows.map(r => evidenceId(r.id)) };
  if (!rows.length) return { status: 'no-data', reason: 'No cited matching measurement.', ids: [] };
  // Retain every version. Choosing a good old result must never hide a bad one.
  const checks = rows.map(row => {
    if (['piece-worth', 'card-worth'].includes(criterion.id) && !row.calibratedInterval && row.calibration?.errorIncludedInPrintedInterval !== true) return { status: 'no-data', reason: 'The printed interval excludes or does not establish inclusion of pawn-scale uncertainty.', evidence: [evidenceId(row.id)] };
    if (row.bound && (row.bound.operator === '<' && band.min !== null && row.bound.value < band.min || row.bound.operator === '>' && band.max !== null && row.bound.value > band.max)) return { status: 'fail', reason: 'The reported bound is outside the band.', evidence: [evidenceId(row.id)] };
    if (criterion.id === 'power-field') return row.simultaneousInterval ? assessBand(band, { id: evidenceId(row.id), value: row.value, ...row.simultaneousInterval }) : { status: 'no-data', reason: 'A field decision needs simultaneous intervals; the pointwise screen is not a verdict.', evidence: [evidenceId(row.id)] };
    return assessBand(band, rowEstimate(row));
  });
  const states = [...new Set(checks.map(c => c.status))];
  return { status: states.length === 1 ? states[0] : 'mixed versions', reason: checks.map((c, i) => `${rows[i].version}: ${c.reason}`).join(' '), ids: rows.map(r => evidenceId(r.id)) };
}

export function currentCheck(measurements: Measurement[], reviewed: TargetContext[], name: string, criterion: Criterion) {
  const none = { status: 'no-data', reason: 'No complete, checked target-context measurement with this criterion and a usable interval.', evidence: [] as string[] };
  const names: Record<string, string> = { Q: 'Queen', R: 'Rook', B: 'Bishop', N: 'Knight', A: 'Archer', G: 'Guard', M: 'Maester', S: 'Beast', O: 'Ogre', L: 'Paladin' };
  const normalize = (s: string) => (names[s] ?? s.replace(/^card:/, '')).replace(/\s/g, '').toLowerCase();
  const candidates = measurements.filter(m => m.validity === 'valid' && (normalize(m.element) === normalize(name) || criterion.id === 'light-dark' && m.element === 'Spirit minus Shadow' || name === 'Card mode' && m.element === 'cards4') && matchesTarget(m.context, reviewed)
    && m.value !== null && m.error !== null && !/over games|game interval|game-level/.test(m.errorKind ?? '') && /arm(?:y|ies)|arrangements|pairs|paired openings|source-error envelope/.test(m.errorKind ?? '') && !m.bound && (!m.calibration?.relativeError || !!m.interval));
  const checkRows = (rows: Measurement[], band: Band, scale: number) => {
    if (!rows.length) return none;
    const checks = rows.map(m => assessBand(band, { id: m.id, value: m.value! * scale, low: (m.interval?.low ?? m.value! - m.error!) * scale, high: (m.interval?.high ?? m.value! + m.error!) * scale }));
    if (checks.some(c => c.status !== checks[0].status)) return { ...none, reason: 'Matching target contexts give different verdicts. Keep the versions separate.', evidence: rows.map(r => r.id) };
    return { status: checks[0].status, reason: checks[0].reason, evidence: rows.map(r => r.id) };
  };
  if (criterion.id === 'piece-game') {
    const groups = new Map<string, Measurement[]>();
    for (const m of candidates.filter(m => m.criterion === 'piece-game' && m.comparison)) {
      const key = `${m.run}:${m.context.sourceHash}:${m.context.specKey}:${stable(m.comparison)}`;
      groups.set(key, [...groups.get(key) ?? [], m]);
    }
    if (!groups.size) return none;
    const checks = [...groups.values()].map(rows => {
      const part = (measure: string, unit: string, limit: number, scale: number) => {
        const result = checkRows(rows.filter(m => m.measure === measure && m.unit === unit), { id: criterion.id, min: -limit, max: limit, approval: 'approved' }, scale);
        return { ...result, status: result.status as 'pass' | 'fail' | 'no-data', approval: 'approved' as const };
      };
      return assessGame(part('drawRate', 'fraction difference', 3, 100), part('whiteScore', 'fraction difference', 2, 100), part('relativeLengthChange', 'fraction', 10, 100));
    });
    return checks.every(c => c.status === checks[0].status) ? { status: checks[0].status, reason: checks[0].reason, evidence: checks.flatMap(c => c.evidence) } : { ...none, reason: 'Separate target-context game comparisons disagree.', evidence: checks.flatMap(c => c.evidence) };
  }
  const band = criterionBand(criterion);
  if (!band) return { ...none, evidence:candidates.filter(m=>m.criterion===criterion.id).map(m=>m.id), reason: criterion.notes ?? 'This criterion needs a defined comparison and an approved numeric margin.' };
  const price = ['piece-worth', 'card-worth'].includes(criterion.id);
  const power = criterion.id === 'power-field';
  const scale = power || criterion.id === 'piece-use' ? 100 : 1;
  const unit = price ? 'pawns' : power || criterion.id === 'piece-use' ? 'fraction' : 'ratio';
  const rows = candidates.filter(m => m.unit === unit && (price ? m.measure === 'pawnWorth' : power ? m.measure === 'score' && /simultaneous/.test(m.errorKind ?? '') && m.context.population === 'field' && !m.context.settings?.anchor : m.measure === 'activity' && m.criterion === criterion.id));
  return checkRows(rows, band, scale);
}

export function buildFramework(root: string, dataset: BalanceDataset, workbook: WorkbookSource, output: string): void {
  const evidence = JSON.parse(readFileSync(join(root, 'docs/balance/evidence.json'), 'utf8')) as Evidence;
  const targetContexts = JSON.parse(readFileSync(join(root, 'docs/balance/target-contexts.json'), 'utf8')) as { contexts: TargetContext[] };
  if (new Set(evidence.measurements.map(r => r.id)).size !== evidence.measurements.length) throw new Error('Duplicate cited evidence ID.');
  for (const row of evidence.measurements) {
    if (row.metric === 'piece worth') {
      const source = evidence.sources.find(s => row.sourceIds.includes(s.id) && s.path?.endsWith('.md') && !isTracker(s.path));
      const path = source?.path ? join(root, source.path) : null;
      if (path && existsSync(path)) {
        const report = readFileSync(path, 'utf8');
        const scale = /One pawn = (\d+(?:\.\d+)?)(?: ± (\d+(?:\.\d+)?))? Elo/.exec(report);
        const reference = /Implied value = \w+ \(([\d.]+)\)/.exec(report);
        const table = markdownTables(report).find(t => t.headers[0] === 'arm');
        const arm = table?.rows.find(r => r[0] === ({ Ogre:'O', Rook:'R', Bishop:'B', Maester:'M', Beast:'S', Guard:'G', Archer:'A' } as Record<string,string>)[row.element]);
        const eloIndex = table?.headers.findIndex(h => h.startsWith('Elo')) ?? -1;
        if (scale) row.calibration = { eloPerPawn: +scale[1], relativeError: scale[2] ? +scale[2]/+scale[1] : null, errorIncludedInPrintedInterval: null };
        if (scale?.[2] && reference && arm && eloIndex >= 0) {
          const elo = numericCell(arm[eloIndex]);
          if (elo.value !== null && elo.error !== null) {
            const worth = oddsWorth({id:row.id,value:elo.value,low:elo.value-elo.error,high:elo.value+elo.error}, {id:'pawn',value:+scale[1],low:+scale[1]-+scale[2],high:+scale[1]+ +scale[2]}, +reference[1]);
            if (worth?.interval) row.calibratedInterval = {low:worth.interval[0],high:worth.interval[1],kind:worth.intervalKind!};
          }
        }
      }
    }

    if (!row.element || !row.version) throw new Error(`Evidence needs an element and a version: ${row.id}`);
    if (row.interval && row.value !== null) assessBand({ id: 'validate', min: null, max: null, approval: 'proposed' }, rowEstimate(row));
  }
  dataset.measurements = dataset.measurements.filter(m => !m.id.startsWith('evidence:'));
  dataset.measurements.push(...evidence.measurements.map(row => canonicalMeasurement(row, evidence.sources)));
  dataset.measurements.sort((a, b) => a.id.localeCompare(b.id));
  const findings = auditDesign({ matrixDoc: readFileSync(join(root, 'docs/MATRIX.md'), 'utf8'), rulesDoc: readFileSync(join(root, 'docs/RULES.md'), 'utf8'), rulesSource: readFileSync(join(root, 'src/rules/rules.ts'), 'utf8'), workbook });
  const versions = mapWorkbookVersions(workbook);
  const testedVersions = measuredVersions(dataset.measurements);
  const sourceLink = (id: string) => {
    const s = evidence.sources.find(s => s.id === id);
    const anchor = s?.path && isTracker(s.path) ? s.section ? '#' + s.section.replace(/^#+\s*/, '').toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-') : '' : s?.line ? `#L${s.line}` : '';
    return s?.path ? `[${id}](${s.path.startsWith('docs/') ? '../' + s.path.slice(5) : '../../' + s.path}${anchor})` : escape(id);
  };
  const resultLink = (id: string) => `[${escape(id)}](#${id.replace(/[^a-z0-9-]/gi, '-').toLowerCase()})`;
  const text = [
    '# Balance and rules framework', '',
    'This framework reads and checks. It does not change the game or choose a rule. Historical evidence is frozen on 2026-10-09. The coverage digest identifies the current collected input set.', '',
    'The declared target is far2, a Guard next to its king, the Paladin beside the Ogre in the pool, Death Touch T2, and four starting cards. The workbook records these approvals. The reviewed main source implements the piece and power choices, with an Archer price of 3.39 pawns. Card mode stays in the lab. No cited run measures the complete target together.', '',
    '## Rebuild and check', '',
    'For campaign decisions, run `npm run balance:build -- --source <main sim/out> --queue <main docs/QUEUE.md> --campaign <saved campaign>`. All input roots are explicit. A build without --campaign can inventory historical local output and the available Drive backup. The command also reads the workbook, approved documents, and cited reports. It writes this report, `measurements.json`, `coverage.md`, `workbook.json`, and `status.json`. Use repeated `--source <folder>` arguments to select a fixed source set. It performs analysis only. It starts no games and contacts no remote machine.', '',
    'Run `npm run balance:check` for a strict schema and document check. Any source conflict or drift makes it fail. `npm run balance:check -- --report` prints the audit without a failing exit status. A source change still requires review. `npm test` tests the parsers, context boundaries, criteria, workbook reader, and drift detection.', '',
    '## Typed design model', '',
    '`src/balance/schema.ts` defines the allowed dimensions. A piece records movement, capture, hop, shield, limits, control, triggers, and zones. A power or card records its source, effect, use count, turn cost, captures, targets, duration, rarity, and conditions. A rule records its flag and allowed value. Shared fields retain approval, version, source, and any text that the matrix cannot express.', '',
    `There are ${Object.keys(DIMENSIONS).length} dimension families and ${Object.keys(RULE_DIMENSIONS).length} code rule fields. The workbook holds ${versions.length} version records. The audit finds ${findings.length} source gaps or drift items. See the complete lists below. A typed record is not proof of approval.`, '',
    'The code is the source for shipped behavior. Dated owner choices and this request are the source for the target. The workbook can retain stale text inside an updated cell. Each layer stays separate. The check pins reviewed document sections, rule choices, defaults, and official power readings. It fails on added, changed, or removed source dimensions.', '',
    `The dataset supplies ${testedVersions.length} distinct measured element/context points. The machine-readable list in status.json links to each measurement's rule values. It lists each non-fitting or unknown dimension. Historical source flags remain intact. They are never coerced to current values.`, '',
    '## Measurements and units', '',
    `The dataset has ${dataset.measurements.length} rows from ${dataset.sources.length} inventoried sources and ${dataset.runs.length} run IDs. The [coverage ledger](coverage.md) lists every source and every known run. It also lists unsupported files, missing metadata, partial files, duplicates, void runs, and conflicts. The M1 copy manifest records 6,966 files from nine run folders. Each copied file matches the remote SHA256 at the 9 October audit. The build checks the saved copies again. See [the manifest](m1-snapshot.json) and coverage gaps for absent or changed copies.`, '',
    'A row records element, version, run, flags, commit or source hash, pool, depth, machine, value, error, sample, units, method, and source. Unknown fields are null. Empty historical flags never mean current rules. Rates use fractions. Rate differences use fraction differences. Piece and card worth use pawns. Game length uses plies or turns as named. Activity keeps its denominator.', '',
    'Copies and shards do not add new games. Report views and cited summaries are alternative views of the same games. Do not sum their samples. Void, incomplete, pending, and conflicting sources cannot supply a result. A stopped run can supply its verified selected sample. Its original plan remains incomplete. A run needs a proved schedule and an exact set of selected game IDs before its sample changes state. Report-only and unstamped results retain their limits.', '',
    'Use the calibration from the same experiment. Reports use about 64–70 Elo per pawn, and some depth-4 runs use 92 ± 13. The card reports carry 64 with about 25% scale uncertainty. Do not replace these with one global constant. Odds worth is reference price plus Elo difference divided by Elo per pawn. Beyond the local ±1.5-pawn range, retain a bound. `oddsWorth` carries scale error and refuses out-of-range point prices. A guard placement gain or defence-probe gain is not the Guard price.', '',
    'A pass needs the whole reported interval inside the target band. A fail needs the whole interval outside it. A crossing interval is no-data at this precision. Raw normal intervals over games exclude army variation. Use stored paired or army intervals for a decision. Historical passes do not certify the new rule context. A non-significant difference does not prove equality.', '',
    '## Criteria and approval', '',
    '| Criterion | Scope | Target | Approval state | Source |', '|---|---|---|---|---|',
    ...evidence.criteria.map(c => `| ${c.id} | ${c.scope} | ${escape(JSON.stringify(c.target))} | ${c.status} | ${c.sourceIds.map(sourceLink).join(', ')} |`), '',
    'Criterion 4 is a weighted-mean identity. It cannot reject a piece. Criterion 4b stays open. The Queen is exempt from the piece worth band. The Guard cannot capture and is flagged on capture share. Rage is legendary and stays outside the common-card band. Global White equivalence and Light–Dark equality have no approved numeric margin. The draw gate comes before other outcome gates.', '',
    '## Element status', '',
    'Each row links to the cited evidence in this report and to the same row ID in `measurements.json`. “Evidence check” applies the criterion in the named historical version. “Checked context” needs matching rule and setup evidence. A classic-odds context certifies only that substitution experiment; it does not certify random-pool play. Cards marked testing are included so the whole candidate deal remains visible. The reviewed context list in `target-contexts.json` records only explicitly checked populations. Register immutable sourceHash and specKey values, full flags, pool, mode and a price-source review only after source review. Ordinary, power and card modes have distinct target contexts. A context registration is necessary but not sufficient: each input path must supply a checked measure and a decision interval. Campaign imports check source, spec, schedule and raw hashes before joining. Do not infer a match from a run name.', '',
    '| Element | Evidence version | Criterion | Evidence check | Checked context | Evidence rows |', '|---|---|---|---|---|---|',
  ];
  const statuses: Record<string, unknown>[] = [];
  const chosen = versions.filter(v => ['Approved', 'Testing', 'Legendary', 'Pending decision'].includes(v.status));
  const seen = new Set<string>();
  for (const v of chosen) {
    const kind = v.sheet === 'Pieces' ? 'piece' : v.element?.kind;
    const name = v.element?.name ?? v.name;
    const key = `${v.sheet}:${name}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const exceptionalPower = ['Holy Light', 'Mercy', 'Death Touch', 'Darkness'].includes(v.name);
    const ids = kind === 'piece' ? ['piece-worth', 'piece-captures', 'piece-moves', 'piece-phase', 'piece-use', 'piece-game', 'piece-phase-4b', 'odds-price'] : kind === 'kingPower' ? [...(exceptionalPower ? [] : ['power-field']), 'light-dark', 'draws-first', 'white-parity'] : v.sheet === 'Cards' && name !== 'Card mode' ? ['card-worth', 'draws-first', 'white-parity'] : ['draws-first', 'white-parity'];
    for (const id of ids) {
      if (id === 'light-dark' && !['Holy Light', 'Mercy', 'Death Touch', 'Darkness'].includes(v.name)) continue;
      const criterion = evidence.criteria.find(c => c.id === id)!;
      const rows = evidence.measurements.filter(r => (r.element.replace(/\s/g, '').toLowerCase() === name.replace(/\s/g, '').toLowerCase() || id === 'light-dark' && r.element === 'Spirit minus Shadow' || name === 'Card mode' && r.element === 'cards4') && applies(r, id));
      const groups = new Map<string, ReportMeasurement[]>();
      for (const row of rows) { const key = `${row.version}; ${row.runIds.join('+')}`; groups.set(key, [...groups.get(key) ?? [], row]); }
      if (!groups.size) groups.set('no measurement', []);
      for (const [version, group] of groups) {
        const check = historicalCheck(criterion, group);
        if (name === 'Queen' && id === 'piece-worth' || name === 'Guard' && id === 'piece-captures' || ['Pawn', 'King'].includes(name) && id.startsWith('piece-')) { check.status = 'exempt'; check.reason = 'The pool criterion does not apply to this case.'; }
        const current = currentCheck(dataset.measurements, targetContexts.contexts, name, criterion);
        const targetVersion = ({ Archer: 'far2', Guard: 'next to king', Paladin: 'nonPawn; in pool with Ogre', DeathTouch: 'T2', 'Card mode': 'four cards' } as Record<string, string>)[name] ?? v.version;
        const diagnostics = Object.fromEntries(['paralysis', 'conditions', 'interactions'].map(kind => [kind, dataset.measurements.filter(m => m.element === name || ({O:'Ogre',R:'Rook',B:'Bishop',M:'Maester',S:'Beast',L:'Paladin',A:'Archer',G:'Guard'} as Record<string,string>)[m.element] === name).filter(m => m.criterion?.startsWith(kind)).map(m => ({id:m.id,value:m.value,unit:m.unit}))]));
        const status = { diagnostics, element: name, version, targetVersion, sheet: v.sheet, criterion: id, evidenceStatus: check.status, status: check.status === 'exempt' ? 'exempt' : current.status, reason: check.status === 'exempt' ? check.reason : current.reason + ' Historical: ' + check.reason, evidence: [...check.ids, ...current.evidence] };
        statuses.push(status);
        text.push(`| ${escape(name)} | ${escape(version)} | ${id} | ${check.status} | ${status.status} | ${[...new Set([...check.ids, ...current.evidence])].map(resultLink).join(', ') || 'none'} |`);
      }
    }
  }
  text.push('', 'Paralysis, conditions and interactions remain not measured unless the source explicitly supplies them. They are not inferred from value.', '', 'Status follows the named evidence version and its interval. A pointwise power screen is not a simultaneous field verdict. Anchor schedules cannot certify all twelve powers together.', '', '## Effects supported by the data', '',
    'The only numeric response curve here uses hand size within one recorded deal and rule context. `predictEffect` interpolates between measured sizes. It refuses other contexts and extrapolation. Its envelope carries source error only. Unknown curvature and cross-arm covariance prevent a new 95% prediction claim. A controlled contrast is stronger evidence than this interpolation.', '',
    'Four-card draw reductions replicate within separate contexts: early eight-card pool, later 27-card pool, and two depth-4 seeds. These are not one pooled experiment. The published combined depth-4 rates are 29.7% with no cards and 12.6% with four. White-score intervals do not establish a stable unchanged edge. These results do not give the worth of a new piece or card.', '',
    '| Contrast | Effect | Reported interval | Evidence |', '|---|---:|---|---|',
    ...evidence.measurements.filter(r => /0to4-draw/.test(r.id)).map(r => `| ${r.runIds.join('+')} | ${number(r.value)} ${r.unit} | ${r.interval ? `${number(r.interval.low)} to ${number(r.interval.high)}` : 'unknown'} | ${resultLink(evidenceId(r.id))} |`), '',
    'Shot geometry, Guard location, and power restrictions have direct measured contrasts. They do not identify a general feature-to-worth law. Several properties change together, the samples use different depths and prices, and many variants share armies. A regression across all rows would treat duplicate and incompatible evidence as independent.', '');
  const anchors: EffectAnchor[] = evidence.measurements.filter(r => r.metric === 'draw rate' && r.runIds.length === 1 && /hand-size-d4b?$/.test(r.runIds[0]) && /^(none|cards[2346])$/.test(r.element) && r.value !== null).map(r => ({ id: evidenceId(r.id), context: r.runIds[0], feature: r.element === 'none' ? 0 : Number(r.element.slice(5)), value: r.value! / 100, low: r.interval ? r.interval.low / 100 : null, high: r.interval ? r.interval.high / 100 : null }));
  const models = [...new Set(anchors.map(a => a.context))].map(context => ({ context, feature: 'hand size', measure: 'draw rate', unit: 'fraction', anchors: anchors.filter(a => a.context === context), example: predictEffect(anchors, 5, context) }));
  text.push('| Source context | Model example: five cards | Source-error envelope |', '|---|---:|---|',
    ...models.map(m => `| ${m.context} | ${m.example.value === null ? 'no data' : number(m.example.value * 100) + '% draws'} | ${m.example.low === null || m.example.high === null ? 'unknown' : number(m.example.low * 100) + '% to ' + number(m.example.high * 100) + '%'} |`), '',
    'These examples interpolate the four- and six-card observations. They are not new run results. They do not include unknown model error. No extra hand-size run is proposed.', '');
  if (dataset.measurements.some(m=>m.id.startsWith('campaign:') && m.context.settings?.kind==='classic-odds')) text.push('The completed worth campaign uses classic knight substitutions at depth 3, one price pass, and one pawn calibration. It has no Guard arm and uses same-colour bishops. Shared seeds correlate arm and calibration errors; the displayed bounds are source-error envelopes, not joint 95% intervals. An envelope can extend beyond the local 1.5-pawn calibration range. Price updates printed by the source experiment report are not approved.', '');
  const designs = newDesigns(workbook).map(d => ({ ...d, status: 'no-data', value: null, error: null, reason: d.specified ? 'No validated property-to-worth model covers this design. An exact version and rule context need measured evidence.' : 'The NEW column has no design properties. No worth is inferred.' }));
  for (const d of designs) text.push(`- ${d.sheet}, column B: ${d.reason}`);
  const reviewedIds = [...new Set([...evidence.pendingRuns.map(p=>p.id), ...dataset.measurements.filter(m=>m.id.startsWith('campaign:')).map(m=>m.run)])];
  const reviewedRuns = reviewedIds.map(id => ({id})).map(p => {
    const run = dataset.runs.find(r => r.run === p.id);
    const rows = dataset.measurements.filter(m => (m.run === p.id || m.run.startsWith(p.id + '.')) && !m.id.startsWith('evidence:') && m.value !== null && ['valid', 'unverified'].includes(m.validity));
    return { id: p.id, lifecycle: run?.lifecycle ?? 'pending', validity: run?.status ?? 'pending', observed: run?.observedGames ?? 0, selected: run?.selectedGames ?? null, planned: run?.expectedGames ?? null, rows };
  });
  text.push('', '## Reviewed run results', '', 'These runs were pending in the request. A stopped sample is not completion of its original plan. A result in an old or unstamped context does not pass the current target.', '', '| Run | Lifecycle / validity | Observed / selected / planned games | Evidence rows | Dependent conclusion |', '|---|---|---|---|---|');
  for (const run of reviewedRuns) {
    text.push(`| ${run.id} | ${run.lifecycle} / ${run.validity} | ${run.observed} / ${run.selected ?? 'unknown'} / ${run.planned ?? 'unknown'} | ${run.rows.length ? `[${run.rows.length} rows](#run-${run.id})` : 'none'} | ${run.rows.some(m => matchesTarget(m.context, targetContexts.contexts)) ? 'Checked target context is present.' : 'No checked target context.'} ${run.rows.some(m => m.comparison?.kind === 'paired') ? 'Paired rows are present; use each row sample.' : 'No verified paired rows in this dataset view.'} |`);
  }
  const proposals = evidence.nextRuns.filter(r => !r.requirements || !dataset.runs.some(run => {
    if (![r.id, ...r.skipIfCompletedRunIds ?? []].includes(run.run) || run.lifecycle !== 'complete' || run.status !== 'valid' || (run.selectedGames ?? 0) < r.games) return false;
    const required = r.requirements!;
    const rows = dataset.measurements.filter(m => m.run === run.run && m.validity === 'valid' && m.value !== null && matchesTarget(m.context, targetContexts.contexts.filter(t => t.mode === required.mode)) && (!required.paired || m.comparison?.kind === 'paired'));
    if (!rows.length) return false;
    const covered = (group: Measurement[]) => (required.measures ?? []).every(measure => group.some(m => m.measure === measure)) && (required.criteria ?? []).every(criterion => criterion === 'piece-captures' && required.captureExempt?.includes(group[0]?.element === 'G' ? 'Guard' : group[0]?.element) ? true : criterion === 'piece-game' ? group.some(m => m.criterion === criterion && m.comparison && ['drawRate', 'whiteScore', 'relativeLengthChange'].every(measure => group.some(other => other.criterion === criterion && other.measure === measure && stable(other.comparison) === stable(m.comparison)))) : group.some(m => m.criterion === criterion));
    const groups = new Map<string, Measurement[]>();
    for (const m of rows) { const key = `${m.context.sourceHash}:${required.mode === 'classic-odds' ? stable(m.calibration) : m.context.specKey}:${required.paired ? stable(m.comparison) : ''}`; groups.set(key, [...groups.get(key) ?? [], m]); }
    return [...groups.values()].some(group => required.elements?.length ? required.elements.every(element => covered(group.filter(m => m.element === element || ({O:'Ogre',R:'Rook',B:'Bishop',N:'Knight',M:'Maester',S:'Beast',L:'Paladin',A:'Archer',G:'Guard',Q:'Queen'} as Record<string,string>)[m.element] === element))) : covered(group));
  }));
  text.push('', '## Ranked run proposals', '', 'These rows use QUEUE format. They are proposals only. The main queue is unchanged. Each notebook estimate stays below nine hours. Time one shard before a wave. A complete matching run with at least the proposed sample removes its duplicate. Historical samples do not remove a target check. The completed, checked campaign studies can remove their matching proposal. Required measures must also share the same comparison.', '', '| id | machine / commit | command | games | result / decision rule |', '|---|---|---|---:|---|');
  for (const r of proposals) text.push(`| ${r.rank}. ${r.id} | ${escape(r.machine)}; proposed source ${r.proposedSourceCommit?.slice(0, 7) ?? 'not pinned'} | \`${escape(r.command)}\` | ${r.games} | ${dataset.runs.find(run => run.run === r.id)?.lifecycle === 'complete' ? 'collected; integration or target coverage remains' : (dataset.runs.find(run => run.run === r.id)?.observedGames ?? 0) > 0 ? 'running / partial' : 'proposed'}; ${r.notebookMinutes} ${r.machine.startsWith('Kaggle') ? 'min/notebook' : 'min budget'}. ${escape(r.decision)} |`);
  for (const r of proposals) text.push('', `**${r.id}:** ${r.estimate} ${r.preconditions}`);
  text.push('', '## Open owner choices and proposed changes', '',
    '1. Keep criterion 4 as the current rule, or approve 4b. The present test cannot fail. Pick: 4b for review; retain 4 until approval.',
    '2. Confirm the common-card band and numeric equality margins. The current band is 0.7–3 pawns. Light–Dark and global White equality have no numeric margin. Pick: approve margins before a formal adoption verdict.',
    '3. Resolve the final deal and Salvation with the reviewed samples below. Pick: retain the approved four-card starting hand and use a paired target-deal test. The stopped four-card sample uses the old pool and has no paired overlap.',
    '4. Keep the approved rule choices while the target checks are incomplete. far2 capture share and old Haste strength remain measured concerns. Pick: request the ranked target checks before another balance change.', '',
    '## Source conflicts and stale evidence', '', ...evidence.conflicts.map(c => `- **${c.id}:** ${c.text} ${c.sourceIds.map(sourceLink).join(', ')}`), '',
    '## Matrix and schema audit', '', '| Code | Source | Approval | Finding |', '|---|---|---|---|',
    ...findings.map(f => `| ${f.code} | ${escape(f.source)} | ${f.approval} | ${escape(f.message)} |`), '',
    ...(findings.length ? [] : ['No source gaps or drift items remain.', '']),
    '## Workbook version coverage', '', '| Element | Version | Status | Cell | Typed mapping |', '|---|---|---|---|---|',
    ...versions.map(v => `| ${escape(v.name)} | ${escape(v.version)} | ${v.status} | ${escape(v.sheet)}!${v.cell} | ${v.element ? v.element.unmapped ? 'partial; see audit' : v.element.kind : 'no mapping; see audit'} |`), '',
    '## Cited measurements', '', 'The IDs below also occur in `measurements.json`. The values here retain source units for review. The dataset converts percentages to fractions. A bound is not a point price.', '');
  for (const r of evidence.measurements) {
    const id = evidenceId(r.id);
    text.push(`<a id="${id.replace(/[^a-z0-9-]/gi, '-').toLowerCase()}"></a>`, `**${id}** — ${r.element}, ${r.version}. ${r.metric}: ${r.bound ? `${r.bound.operator} ${r.bound.value}` : number(r.value)} ${r.unit}. Interval: ${r.interval ? `${number(r.interval.low)} to ${number(r.interval.high)} (${r.interval.level * 100}%)` : 'unknown'}. Sample: ${r.n ?? 'unknown'}. Depth: ${r.depth ?? 'unknown'}. Run: ${r.runIds.join(', ')}. ${r.context} ${r.sourceIds.map(sourceLink).join(', ')}`, '');
  }
  const used = new Set(statuses.flatMap(s => s.evidence as string[]));
  const currentRows = dataset.measurements.filter(m => !m.id.startsWith('evidence:') && used.has(m.id));
  if (currentRows.length) text.push('## Checked context evidence', '');
  for (const m of currentRows) text.push(`<a id="${m.id.replace(/[^a-z0-9-]/gi, '-').toLowerCase()}"></a>`, `**${escape(m.id)}** — ${escape(m.element)}; ${m.measure}: ${number(m.value)} ${escape(m.unit)}; interval ${m.interval ? number(m.interval.low)+' to '+number(m.interval.high)+' ('+escape(m.interval.kind)+')' : '± '+number(m.error)}. Sample: ${m.sample} ${m.sampleUnit}. ${escape(m.method)}`, '');
  text.push('## Rebuilt rows for reviewed runs' , '', 'These are direct dataset rows. Curated report rows above retain any additional comparison limits. Rows from the same games are alternative views, not additional samples.', '');
  for (const run of reviewedRuns) {
    text.push(`<a id="run-${run.id}"></a>`, `### ${run.id}`, '', '| Row ID | Element / measure | Value ± error | Sample / unit | Method / context limit |', '|---|---|---|---|---|');
    for (const m of run.rows) text.push(`| ${escape(m.id)} | ${escape(m.element)} / ${m.measure} | ${number(m.value)} ± ${number(m.error)} ${escape(m.unit)} | ${m.sample ?? 'unknown'} ${m.sampleUnit} | ${escape(m.method)}; ${m.validity}; ${escape(m.reasons.join(' '))} |`);
    text.push('');
  }
  writeFileSync(join(output, 'workbook.json'), JSON.stringify(workbook, null, 2) + '\n');
  writeFileSync(join(output, 'status.json'), JSON.stringify({ sourceDate: '2026-10-09', inputDigest:dataset.inputDigest ?? null, statuses, findings, versions, testedVersions, models, newDesigns: designs, reviewedRuns: reviewedRuns.map(({ rows, ...run }) => ({ ...run, evidence: rows.map(r => r.id) })), nextRuns: proposals }) + '\n');
  writeFileSync(join(output, 'FRAMEWORK.md'), text.join('\n').trimEnd() + '\n');
}
