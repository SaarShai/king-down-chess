// Fixture for the git-hook tests: one script stands in for `typecheck`, `test` and `gate`.
// Each call adds one JSON line to .fixture/calls.jsonl: the script name, its arguments, its stdin
// and the names of the GIT_ variables that it sees. When .fixture/<name>.fail exists, the script
// writes the text of that file to stderr and exits 1. Else it exits 0.
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';

const [name, ...args] = process.argv.slice(2);
let stdin = '';
if (!process.stdin.isTTY) try { stdin = readFileSync(0, 'utf8'); } catch { /* no stdin */ }
const git = Object.keys(process.env).filter(key => key.startsWith('GIT_')).sort();
mkdirSync('.fixture', { recursive: true });
appendFileSync('.fixture/calls.jsonl', JSON.stringify({ name, args, stdin, git }) + '\n');
const fail = `.fixture/${name}.fail`;
if (existsSync(fail)) {
  process.stderr.write(readFileSync(fail, 'utf8'));
  process.exit(1);
}
