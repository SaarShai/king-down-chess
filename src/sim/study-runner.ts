import { parseArgs } from 'node:util';
import { readdirSync } from 'node:fs';
import { validateAndReport } from '../../tools/study-runs/report';
import { verifyBundle } from '../../tools/study-runs/bundle';
import { resolve } from 'node:path';
import { loadBundle } from '../../tools/study-runs/bundle';
import { executePart } from '../../tools/study-runs/execution';
const { values } = parseArgs({ options: { bundle: { type: 'string' }, part: { type: 'string' }, out: { type: 'string' }, 'parts-directory': { type: 'string' } } });
if (!values.bundle || !values.out) throw new Error('Use --bundle --out and --part or --parts-directory');
const bundle = loadBundle(values.bundle);
verifyBundle(bundle, process.cwd());
if (process.version !== bundle.nodeVersion) throw new Error('Runtime mismatch');
if (values['parts-directory']) {
  const root = resolve(values['parts-directory']);
  const result = await validateAndReport(bundle, readdirSync(root, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => resolve(root, e.name)), resolve(values.out));
  console.log(JSON.stringify(result));
} else if (values.part) await executePart(bundle, values.part, resolve(values.out), process.cwd());
else throw new Error('Use --part or --parts-directory');
