/** Read error message literals at build time. Template values never enter a report. */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseSync } from 'rolldown/utils';

export function sourceErrorForms(root = 'src') {
 const forms = new Map();
 function visitFile(path) {
  const source = readFileSync(path, 'utf8');
  const { program, errors } = parseSync(path, source);
  if (errors.length) throw new Error('Cannot read source error forms');
  function visit(node) {
   if (!node || typeof node !== 'object') return;
   if (node.type === 'NewExpression' && /Error$/.test(source.slice(node.callee.start, node.callee.end)) || node.type === 'ThrowStatement' && node.argument?.type === 'CallExpression' || node.type === 'CallExpression' && ['fail', 'failure'].includes(node.callee.name)) {
    const args = node.type === 'ThrowStatement' ? node.argument.arguments : node.arguments;
    const call = node.type === 'ThrowStatement' ? node.argument : node;
    const name = call.callee.name;
    // Native errors put the message first; app errors put it after the code and status.
    const text = args[name === 'AggregateError' ? 1 : /^(?:Error|TypeError|RangeError|ReferenceError|SyntaxError|URIError|EvalError)$/.test(name) ? 0 : args.length - 1];
    if (text && (text.type === 'Literal' && typeof text.value === 'string' || text.type === 'TemplateLiteral')) {
     const parts = text.type === 'TemplateLiteral' ? text.quasis.map(part => part.value.cooked) : [text.value];
     if (parts.some(part => part?.length)) forms.set(JSON.stringify(parts), parts);
    }
   }
   for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === 'object') visit(value);
   }
  }
  visit(program);
 }

 function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
   const path = join(dir, entry.name);
   if (entry.isDirectory()) walk(path);
   else if (/\.(?:ts|mjs)$/.test(entry.name) && !/\.(?:test|d)\.(?:ts|mjs)$/.test(entry.name)) visitFile(path);
  }
 }
 walk(root);
 return [...forms.values()].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
}
