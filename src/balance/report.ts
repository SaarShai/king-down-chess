import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { assessBand, assessGame, type Band, type Estimate } from './criteria';
import { predictEffect, type EffectAnchor } from './effects';
import { newDesigns, type WorkbookSource } from './workbook';
import { auditDesign, mapWorkbookVersions } from './design';
import { DIMENSIONS, RULE_DIMENSIONS } from './schema';
import { unknownContext, type Measurement } from './measurements';
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
}
interface Evidence {
  sources: Source[]; criteria: Criterion[]; measurements: ReportMeasurement[];
  conflicts: { id: string; text: string; sourceIds: string[] }[];
  pendingRuns: { id: string }[];
  nextRuns: { id: string; rank: number; machine: string; games: number; command: string; notebookMinutes: number; estimate: string; preconditions: string; decision: string; proposedSourceCommit?: string }[];
}

const escape = (s: unknown) => String(s ?? 'unknown').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const number = (n: number | null) => n === null ? 'unknown' : Number(n.toFixed(4)).toString();
const evidenceId = (id: string) => `evidence:${id}`;

function canonicalMeasurement(row: ReportMeasurement, sources: Source[]): Measurement {
  const percent = /percent|points/.test(row.unit);
  const scale = percent ? 0.01 : 1;
  const measure: Measurement['measure'] = row.unit === 'pawns' ? 'pawnWorth' : row.unit === 'Elo' ? 'elo' : /draw/i.test(row.metric) ? 'drawRate' : /White/.test(row.metric) ? 'whiteScore' : /length/.test(row.metric) ? 'relativeLengthChange' : /score vs powers|Spirit minus Shadow/.test(row.metric) ? 'score' : 'activity';
  const interval = row.interval;
  const error = interval && row.value !== null ? Math.max(row.value - interval.low, interval.high - row.value) * scale : null;
  return {
    id: evidenceId(row.id), run: row.runIds.join('+'), element: row.element, version: row.version,
    context: { ...unknownContext(), flags: row.flags, flagsKind: row.flags ? 'diff' : 'unknown', commit: row.commit, depth: row.depth, population: 'report' },
    measure, value: (row.value ?? row.bound?.value ?? null) === null ? null : (row.value ?? row.bound!.value) * scale,
    error, errorKind: interval ? `source ${interval.level * 100}% interval; asymmetric limits remain in evidence.json; calibration error may be separate` : null,
    sample: row.n, sampleUnit: /games/.test(row.nUnit ?? '') ? 'games' : /pairs/.test(row.nUnit ?? '') ? 'pairs' : 'unknown', unit: percent ? (/points/.test(row.unit) ? 'fraction difference' : 'fraction') : row.unit,
    validity: 'unverified', reasons: ['Report evidence has a stated context. It does not certify the full target rules.', row.context],
    sources: row.sourceIds.map(id => { const s = sources.find(s => s.id === id); return s?.path ? `${s.path}${s.line ? `:${s.line}` : ''}` : id; }),
    method: `cited report: ${row.metric}; an alternative view of this run, never an independent sample`,
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
  return { id: evidenceId(row.id), value: row.value, low: row.interval?.low ?? null, high: row.interval?.high ?? null };
}

function applies(row: ReportMeasurement, criterion: string) {
  if (row.criterionIds?.includes(criterion)) return true;
  const metrics: Record<string, string[]> = {
    'piece-worth': ['piece worth'], 'piece-captures': ['captures', 'capture ratio'], 'piece-moves': ['moves'],
    'piece-use': ['use'], 'piece-phase-4b': ['best-phase-4b'], 'power-field': ['score vs powers', 'DeathTouch score vs powers'], 'card-worth': ['card worth'],
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
    if (row.calibration && row.calibration.errorIncludedInPrintedInterval !== true) return { status: 'no-data', reason: 'The printed interval excludes or does not establish inclusion of pawn-scale uncertainty.', evidence: [evidenceId(row.id)] };
    if (row.bound && (row.bound.operator === '<' && band.min !== null && row.bound.value < band.min || row.bound.operator === '>' && band.max !== null && row.bound.value > band.max)) return { status: 'fail', reason: 'The reported bound is outside the band.', evidence: [evidenceId(row.id)] };
    return assessBand(band, rowEstimate(row));
  });
  const states = [...new Set(checks.map(c => c.status))];
  return { status: states.length === 1 ? states[0] : 'mixed versions', reason: checks.map((c, i) => `${rows[i].version}: ${c.reason}`).join(' '), ids: rows.map(r => evidenceId(r.id)) };
}

function currentCheck(measurements: Measurement[], reviewed: TargetContext[], name: string, criterion: Criterion) {
  const band = criterionBand(criterion);
  const none = { status: 'no-data', reason: 'No complete, checked target-context measurement with this criterion and a usable interval.', evidence: [] as string[] };
  if (!band) return none;
  const metric = ({ 'piece-worth': 'pawnWorth', 'card-worth': 'pawnWorth', 'power-field': 'score' } as Record<string, string>)[criterion.id];
  if (!metric) return none;
  const names: Record<string, string> = { Q: 'Queen', R: 'Rook', B: 'Bishop', N: 'Knight', A: 'Archer', G: 'Guard', M: 'Maester', S: 'Beast', O: 'Ogre', L: 'Paladin' };
  const normalize = (s: string) => (names[s] ?? s.replace(/^card:/, '')).replace(/\s/g, '').toLowerCase();
  const rows = measurements.filter(m => m.validity === 'valid' && m.measure === metric && normalize(m.element) === normalize(name) && matchesTarget(m.context, reviewed)
    && m.value !== null && m.error !== null && /armies|pairs|source|report/.test(m.errorKind ?? '') && !m.bound && !m.calibration?.relativeError);
  if (!rows.length) return none;
  const checks = rows.map(m => {
    const scale = criterion.target.unit === 'percent_score_vs_other_powers' ? 100 : 1;
    return assessBand(band, { id: m.id, value: m.value! * scale, low: (m.value! - m.error!) * scale, high: (m.value! + m.error!) * scale });
  });
  if (checks.some(c => c.status !== checks[0].status)) return { ...none, reason: 'Matching target contexts give different verdicts. Keep the versions separate.', evidence: rows.map(r => r.id) };
  return { status: checks[0].status, reason: checks[0].reason, evidence: rows.map(r => r.id) };
}

export function buildFramework(root: string, dataset: BalanceDataset, workbook: WorkbookSource, output: string): void {
  const evidence = JSON.parse(readFileSync(join(root, 'docs/balance/evidence.json'), 'utf8')) as Evidence;
  const targetContexts = JSON.parse(readFileSync(join(root, 'docs/balance/target-contexts.json'), 'utf8')) as { contexts: TargetContext[] };
  if (new Set(evidence.measurements.map(r => r.id)).size !== evidence.measurements.length) throw new Error('Duplicate cited evidence ID.');
  for (const row of evidence.measurements) {
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
    return s?.path ? `[${id}](${s.path.startsWith('docs/') ? '../' + s.path.slice(5) : '../../' + s.path}${s.line ? `#L${s.line}` : ''})` : escape(id);
  };
  const resultLink = (id: string) => `[${escape(id)}](#${id.replace(/[^a-z0-9-]/gi, '-').toLowerCase()})`;
  const text = [
    '# Balance and rules framework', '',
    'This framework reads and checks. It does not change the game or choose a rule. The source snapshot is 2026-10-09.', '',
    'The declared target is far2, a Guard next to its king, the Paladin beside the Ogre in the pool, Death Touch T2, and four cards. The request sets this target. The workbook records the first four approvals. Its hand-size cell still says six. The reviewed main source now implements the piece and power choices, with an Archer price of 3.39 pawns. QUEUE records the four-card choice; card mode stays in the lab. No cited run measures the complete target together.', '',
    '## Rebuild and check', '',
    'Run `npm run balance:build`. The command reads local output, the available Drive backup, the workbook, the approved documents, and the cited reports. It writes this report, `measurements.json`, `coverage.md`, `workbook.json`, and `status.json`. Use repeated `--source <folder>` arguments to select a fixed source set. It performs analysis only. It starts no games and contacts no remote machine.', '',
    'Run `npm run balance:check` for a strict schema and document check. Known source gaps make it fail on this snapshot. `npm run balance:check -- --report` prints the audit without a failing exit status. A source change still requires review. `npm test` tests the parsers, context boundaries, criteria, workbook reader, and drift detection.', '',
    '## Typed design model', '',
    '`src/balance/schema.ts` defines the allowed dimensions. A piece records movement, capture, hop, shield, limits, control, triggers, and zones. A power or card records its source, effect, use count, turn cost, captures, targets, duration, rarity, and conditions. A rule records its flag and allowed value. Shared fields retain approval, version, source, and any text that the matrix cannot express.', '',
    `There are ${Object.keys(DIMENSIONS).length} dimension families and ${Object.keys(RULE_DIMENSIONS).length} code rule fields. The workbook holds ${versions.length} version records. The audit finds ${findings.length} source gaps or drift items. See the complete lists below. A typed record is not proof of approval.`, '',
    'The code is the source for shipped behavior. Dated owner choices and this request are the source for the target. The workbook can retain stale text inside an updated cell. Each layer stays separate. The check pins reviewed document sections, rule choices, defaults, and official power readings. It fails on added, changed, or removed source dimensions.', '',
    `The dataset supplies ${testedVersions.length} distinct measured element/context points. The machine-readable list in status.json links to each measurement's rule values. It lists each non-fitting or unknown dimension. Historical source flags remain intact. They are never coerced to current values.`, '',
    '## Measurements and units', '',
    `The dataset has ${dataset.measurements.length} rows from ${dataset.sources.length} inventoried sources and ${dataset.runs.length} run IDs. The [coverage ledger](coverage.md) lists every source and every known run. It also lists unsupported files, missing metadata, partial files, duplicates, void runs, and conflicts. The M1 name does not resolve during this audit. Remote-only data cannot be certified.`, '',
    'A row records element, version, run, flags, commit or source hash, pool, depth, machine, value, error, sample, units, method, and source. Unknown fields are null. Empty historical flags never mean current rules. Rates use fractions. Rate differences use fraction differences. Piece and card worth use pawns. Game length uses plies or turns as named. Activity keeps its denominator.', '',
    'Copies and shards do not add new games. Report views and cited summaries are alternative views of the same games. Do not sum their samples. Void, incomplete, pending, and conflicting sources cannot supply a result. A pending run needs a proved schedule and a complete set of game IDs before it changes state. Report-only and unstamped results retain their limits.', '',
    'Use the calibration from the same experiment. Reports use about 64–70 Elo per pawn, and some depth-4 runs use 92 ± 13. The card reports carry 64 with about 25% scale uncertainty. Do not replace these with one global constant. Odds worth is reference price plus Elo difference divided by Elo per pawn. Beyond the local ±1.5-pawn range, retain a bound. `oddsWorth` carries scale error and refuses out-of-range point prices. A guard placement gain or defence-probe gain is not the Guard price.', '',
    'A pass needs the whole reported interval inside the target band. A fail needs the whole interval outside it. A crossing interval is no-data at this precision. Raw normal intervals over games exclude army variation. Use stored paired or army intervals for a decision. Historical passes do not certify the new rule context. A non-significant difference does not prove equality.', '',
    '## Criteria and approval', '',
    '| Criterion | Scope | Target | Approval state | Source |', '|---|---|---|---|---|',
    ...evidence.criteria.map(c => `| ${c.id} | ${c.scope} | ${escape(JSON.stringify(c.target))} | ${c.status} | ${c.sourceIds.map(sourceLink).join(', ')} |`), '',
    'Criterion 4 is a weighted-mean identity. It cannot reject a piece. Criterion 4b stays open. The Queen is exempt from the piece worth band. The Guard cannot capture and is flagged on capture share. Rage is legendary and stays outside the common-card band. Global White equivalence and Light–Dark equality have no approved numeric margin. The draw gate comes before other outcome gates.', '',
    '## Element status', '',
    'Each row links to the cited evidence in this report and to the same row ID in `measurements.json`. “Evidence check” applies the criterion in the named historical version. “Full target” needs matching rule and setup evidence. Cards marked testing are included so the whole candidate deal remains visible. The checked context list in `target-contexts.json` is empty because no complete measured context proves the full target. Register an immutable sourceHash and specKey only after source review. The next build then joins complete matching rows. Do not infer a match from a run name.', '',
    '| Element | Evidence version | Criterion | Evidence check | Full target | Evidence rows |', '|---|---|---|---|---|---|',
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
    const ids = kind === 'piece' ? ['piece-worth', 'piece-captures', 'piece-moves', 'piece-phase', 'piece-use', 'piece-game', 'piece-phase-4b', 'odds-price'] : kind === 'kingPower' ? ['power-field', 'light-dark', 'draws-first', 'white-parity'] : v.sheet === 'Cards' && name !== 'Card mode' ? ['card-worth', 'draws-first', 'white-parity'] : ['draws-first', 'white-parity'];
    for (const id of ids) {
      if (id === 'light-dark' && !['Holy Light', 'Mercy', 'Death Touch', 'Darkness'].includes(v.name)) continue;
      const criterion = evidence.criteria.find(c => c.id === id)!;
      const rows = evidence.measurements.filter(r => r.element.replace(/\s/g, '').toLowerCase() === name.replace(/\s/g, '').toLowerCase() && applies(r, id));
      const groups = new Map<string, ReportMeasurement[]>();
      for (const row of rows) { const key = `${row.version}; ${row.runIds.join('+')}`; groups.set(key, [...groups.get(key) ?? [], row]); }
      if (!groups.size) groups.set('no measurement', []);
      for (const [version, group] of groups) {
        const check = historicalCheck(criterion, group);
        if (name === 'Queen' && id === 'piece-worth' || name === 'Guard' && id === 'piece-captures' || ['Pawn', 'King'].includes(name) && id.startsWith('piece-')) { check.status = 'exempt'; check.reason = 'The pool criterion does not apply to this case.'; }
        const current = currentCheck(dataset.measurements, targetContexts.contexts, name, criterion);
        const targetVersion = ({ Archer: 'far2', Guard: 'next to king', Paladin: 'nonPawn; in pool with Ogre', DeathTouch: 'T2', 'Card mode': 'four cards' } as Record<string, string>)[name] ?? v.version;
        const status = { element: name, version, targetVersion, sheet: v.sheet, criterion: id, evidenceStatus: check.status, status: check.status === 'exempt' ? 'exempt' : current.status, reason: check.status === 'exempt' ? check.reason : current.reason + ' Historical: ' + check.reason, evidence: [...check.ids, ...current.evidence] };
        statuses.push(status);
        text.push(`| ${escape(name)} | ${escape(version)} | ${id} | ${check.status} | ${status.status} | ${check.ids.map(resultLink).join(', ') || 'none'} |`);
      }
    }
  }
  text.push('', 'The status is deliberately conditional on the version. far2 has a measured worth inside the piece band, but its capture ratio 1.55 [1.51, 1.60] fails the 1.5 limit. Old activity gives Rook and Guard use failures. Haste has a high historical field score. T2 scores near 50%, but an anchor schedule cannot certify all twelve powers together.', '', '## Effects supported by the data', '',
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
  const designs = newDesigns(workbook).map(d => ({ ...d, status: 'no-data', value: null, error: null, reason: d.specified ? 'No validated property-to-worth model covers this design. An exact version and rule context need measured evidence.' : 'The NEW column has no design properties. No worth is inferred.' }));
  for (const d of designs) text.push(`- ${d.sheet}, column B: ${d.reason}`);
  text.push('', '## Pending evidence', '', '| Run | State | Result | Dependent conclusion |', '|---|---|---|---|');
  for (const p of evidence.pendingRuns) {
    const run = dataset.runs.find(r => r.run === p.id);
    text.push(`| ${p.id} | ${run?.status ?? 'pending'} | ${run?.status === 'valid' ? 'See completed rows in measurements.json; review their context.' : 'none'} | ${p.id === 'deal-c4k' ? 'Four-card deal and card interactions.' : p.id === 'deal-d4k' ? 'Six-card deal precision; does not substitute for four cards.' : p.id === 'deal-nosalv2' ? 'Salvation removal on a second seed.' : 'Guard drop anywhere against the king-adjacent start.'} |`);
  }
  text.push('', '## Ranked run proposals', '', 'These rows use QUEUE format. They are proposals only. The main queue is unchanged. Reconcile the pending files first. Pin an engine that implements the target before any launch. Each notebook estimate stays below nine hours. The recorded throughput is an estimate, not a guarantee. A matching completed pending run removes its proposed duplicate.', '', '| id | machine / commit | command | games | result / decision rule |', '|---|---|---|---:|---|');
  for (const r of evidence.nextRuns) text.push(`| ${r.rank}. ${r.id} | ${escape(r.machine)}; proposed source ${r.proposedSourceCommit?.slice(0, 7) ?? 'not pinned'} | \`${escape(r.command)}\` | ${r.games} | proposed; ${r.notebookMinutes} min/notebook. ${escape(r.decision)} |`);
  for (const r of evidence.nextRuns) text.push('', `**${r.id}:** ${r.estimate} ${r.preconditions}`);
  text.push('', '## Open owner choices and proposed changes', '',
    '1. Keep criterion 4 as the current rule, or approve 4b. The present test cannot fail. Pick: 4b for review; retain 4 until approval.',
    '2. Confirm the common-card band and numeric equality margins. The current band is 0.7–3 pawns. Light–Dark and global White equality have no numeric margin. Pick: approve margins before a formal adoption verdict.',
    '3. Reconcile the matrix gaps and the stale six-card workbook cell. Main now has the 9 October piece and power choices. Pick: use this audit to update the design records; do not change game behavior.',
    '4. Resolve the final deal and Salvation after pending evidence arrives. Pick: keep all pending results unset. The four-card deal must supply its own data.',
    '5. Keep the approved rule choices while the target checks are incomplete. far2 capture share and old Haste strength remain measured concerns. Pick: request the ranked target checks before another balance change.', '',
    '## Source conflicts and stale evidence', '', ...evidence.conflicts.map(c => `- **${c.id}:** ${c.text} ${c.sourceIds.map(sourceLink).join(', ')}`), '',
    '## Matrix and schema audit', '', '| Code | Source | Approval | Finding |', '|---|---|---|---|',
    ...findings.map(f => `| ${f.code} | ${escape(f.source)} | ${f.approval} | ${escape(f.message)} |`), '',
    '## Workbook version coverage', '', '| Element | Version | Status | Cell | Typed mapping |', '|---|---|---|---|---|',
    ...versions.map(v => `| ${escape(v.name)} | ${escape(v.version)} | ${v.status} | ${escape(v.sheet)}!${v.cell} | ${v.element ? v.element.unmapped ? 'partial; see audit' : v.element.kind : 'no mapping; see audit'} |`), '',
    '## Cited measurements', '', 'The IDs below also occur in `measurements.json`. The values here retain source units for review. The dataset converts percentages to fractions. A bound is not a point price.', '');
  for (const r of evidence.measurements) {
    const id = evidenceId(r.id);
    text.push(`<a id="${id.replace(/[^a-z0-9-]/gi, '-').toLowerCase()}"></a>`, `**${id}** — ${r.element}, ${r.version}. ${r.metric}: ${r.bound ? `${r.bound.operator} ${r.bound.value}` : number(r.value)} ${r.unit}. Interval: ${r.interval ? `${number(r.interval.low)} to ${number(r.interval.high)} (${r.interval.level * 100}%)` : 'unknown'}. Sample: ${r.n ?? 'unknown'}. Depth: ${r.depth ?? 'unknown'}. Run: ${r.runIds.join(', ')}. ${r.context} ${r.sourceIds.map(sourceLink).join(', ')}`, '');
  }
  writeFileSync(join(output, 'workbook.json'), JSON.stringify(workbook, null, 2) + '\n');
  writeFileSync(join(output, 'status.json'), JSON.stringify({ sourceDate: '2026-10-09', statuses, findings, versions, testedVersions, models, newDesigns: designs }) + '\n');
  writeFileSync(join(output, 'FRAMEWORK.md'), text.join('\n').trimEnd() + '\n');
}
