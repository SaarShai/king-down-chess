import { mkdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { buildDataset, writeDataset, type DatasetOptions, type SourceOverride } from '../src/balance/dataset';
import { buildFramework } from '../src/balance/report';
import { readWorkbook } from '../src/balance/workbook';

const args = process.argv.slice(2);
const options: DatasetOptions = { root: process.cwd(), onProgress: message => console.log(message) };
let output = '', overrideFile = '', workbookFile = '';
for (let i = 0; i < args.length; i++) {
  const flag = args[i], value = args[++i];
  if (!value) throw new Error(`Missing value for ${flag}`);
  if (flag === '--root') options.root = resolve(value);
  else if (flag === '--source') (options.sources ??= []).push(value);
  else if (flag === '--out') output = resolve(value);
  else if (flag === '--overrides') overrideFile = value;
  else if (flag === '--workbook') workbookFile = resolve(value);
  else throw new Error(`Unknown option ${flag}`);
}
if (overrideFile) options.overrides = JSON.parse(await readFile(overrideFile, 'utf8')) as SourceOverride[];
const dataset = await buildDataset(options);
if (new Set(dataset.measurements.map(m => m.id)).size !== dataset.measurements.length) throw new Error('Duplicate measurement IDs. Do not write an ambiguous dataset.');
const out = output || resolve(options.root, 'docs/balance');
await mkdir(out, { recursive: true });
const workbookSource = 'docs/status/king-down-status-2026-10-09.xlsx';
const workbook = readWorkbook(workbookFile || resolve(options.root, workbookSource), workbookSource);
dataset.warnings.push('Remote-only M1 sources are not inventoried by this local command. The 2026-10-09 read-only access check cannot resolve its host name.');
buildFramework(options.root, dataset, workbook, out);
await writeDataset(dataset, out);
console.log(`Built ${dataset.measurements.length} measurements; ${dataset.sources.length} sources; ${dataset.runs.length} run IDs.`);
