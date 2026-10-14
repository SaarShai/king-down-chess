/** Check the fixed design contract. --report keeps the findings but returns success. */
import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { auditDesign, mapWorkbookVersions, parseWorkbook } from '../src/balance/design';
import { readWorkbook } from '../src/balance/workbook';
import { stable } from '../src/balance/measurements';
import { RULE_DIMENSIONS } from '../src/balance/schema';

const args = process.argv.slice(2);
const root = fileURLToPath(new URL('../', import.meta.url));
const at = args.indexOf('--workbook');
const workbookPath = at >= 0 ? resolve(args[at + 1] ?? '') : resolve(root, 'docs/balance/workbook.json');
if (at >= 0 && !args[at + 1]) throw new Error('--workbook needs a JSON path');
const workbook = existsSync(workbookPath) ? parseWorkbook(JSON.parse(readFileSync(workbookPath, 'utf8'))) : undefined;
const findings = auditDesign({
  matrixDoc: readFileSync(resolve(root, 'docs/MATRIX.md'), 'utf8'),
  rulesDoc: readFileSync(resolve(root, 'docs/RULES.md'), 'utf8'),
  rulesSource: readFileSync(resolve(root, 'src/rules/rules.ts'), 'utf8'),
  workbook,
});
if (workbook && (!existsSync(resolve(root, workbook.source)) || createHash('sha256').update(readFileSync(resolve(root, workbook.source))).digest('hex') !== workbook.sha256)) findings.push({code:'WORKBOOK_HASH_MISMATCH', severity:'error', approval:'unresolved', source:workbook.source, message:'The workbook export is absent or stale. Re-extract the saved workbook.'});
if (workbook && existsSync(resolve(root, workbook.source)) && stable(parseWorkbook(readWorkbook(resolve(root, workbook.source),workbook.source))) !== stable(workbook)) findings.push({code:'WORKBOOK_EXPORT_MISMATCH',severity:'error',approval:'unresolved',source:workbook.source,message:'The saved cells do not match the workbook export.'});
if (!workbook) findings.push({ code: 'WORKBOOK_MISSING', severity: 'error', approval: 'unresolved', source: workbookPath, message: 'The extracted workbook is absent. Rebuild it or pass --workbook. Versions are not checked.' });
const summary = { ruleAxes: Object.keys(RULE_DIMENSIONS).length, workbookVersions: workbook ? mapWorkbookVersions(workbook).length : 0, errors: findings.filter(f => f.severity === 'error').length, warnings: findings.filter(f => f.severity === 'warning').length };
if (args.includes('--json')) console.log(JSON.stringify({ summary, findings }, null, 2));
else {
  console.log(`Design check: ${summary.ruleAxes} rule axes; ${summary.workbookVersions} workbook versions; ${summary.errors} errors; ${summary.warnings} warnings.`);
  for (const finding of findings) console.log(`${finding.severity.toUpperCase()} ${finding.code} [${finding.approval}] ${finding.source}: ${finding.message}`);
}
if (summary.errors && !args.includes('--report')) process.exitCode = 1;
