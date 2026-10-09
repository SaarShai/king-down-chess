import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { buildDataset, writeDataset, type DatasetOptions, type SourceOverride } from '../src/balance/dataset';

const args = process.argv.slice(2);
const options: DatasetOptions = { root: process.cwd(), onProgress: message => console.log(message) };
let output = '', overrideFile = '';
for (let i = 0; i < args.length; i++) {
  const flag = args[i], value = args[++i];
  if (!value) throw new Error(`Missing value for ${flag}`);
  if (flag === '--root') options.root = resolve(value);
  else if (flag === '--source') (options.sources ??= []).push(value);
  else if (flag === '--out') output = resolve(value);
  else if (flag === '--overrides') overrideFile = value;
  else throw new Error(`Unknown option ${flag}`);
}
if (overrideFile) options.overrides = JSON.parse(await readFile(overrideFile, 'utf8')) as SourceOverride[];
const dataset = await buildDataset(options);
await writeDataset(dataset, output || resolve(options.root, 'docs/balance'));
console.log(`Built ${dataset.measurements.length} measurements; ${dataset.sources.length} sources; ${dataset.runs.length} run IDs.`);
