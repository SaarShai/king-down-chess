import { DEFAULTS, type RunSpec } from './spec-plan';
import { resultsRoot } from '../../tools/lib/results-root.mjs';
/** Run spec: what to play, how, and with which seed. JSON file and/or CLI flags. */
import { readFileSync } from 'node:fs';
import { LETTERS } from '../rules/engine';
import { Rules, parseRule } from '../rules/rules';

export const OUT_DIR = resultsRoot();
export const paths = (id: string) => ({
  jsonl: `${OUT_DIR}/${id}.jsonl`,
  summary: `${OUT_DIR}/${id}.summary.json`,
});

/**
 * Later flag wins — except for `kings`, whose two sides can arrive on two flags
 * (`--rule kingWhite=Spirit:Mercy --rule kingBlack=Mud:March`). Each of those names one side and
 * leaves the other `null`, so a plain spread would drop the side the earlier flag set.
 */
const mergeRules = (a: Partial<Rules>, b: Partial<Rules>): Partial<Rules> => {
  const out = { ...a, ...b };
  if (a.kings && b.kings) out.kings = [b.kings[0] ?? a.kings[0], b.kings[1] ?? a.kings[1]];
  return out;
};

/** Every `--rule name=value` (or `--baseRule …`) on the command line, merged left to right. */
export function parseRuleFlags(argv: readonly string[], flag = '--rule'): Partial<Rules> {
  let out: Partial<Rules> = {};
  const eq = `${flag}=`;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === flag && argv[i + 1]) out = mergeRules(out, parseRule(argv[++i]));
    else if (argv[i].startsWith(eq)) out = mergeRules(out, parseRule(argv[i].slice(eq.length)));
  }
  return out;
}

/** `"A=270,G=180"` -> `{ A: 270, G: 180 }`, in centipawns. Throws on a bad letter or number. */
export function parseValues(text: string): Record<string, number> {
  const letters = LETTERS.slice(1); // LETTERS is ' PNBRQKALGMS'; index 0 is the empty square
  const out: Record<string, number> = {};
  for (const part of text.split(',').filter(Boolean)) {
    const [key, value = ''] = part.split('=');
    if (!letters.includes(key) || key.length !== 1) throw new Error(`unknown piece "${key}" in --values (${letters})`);
    const v = Number(value);
    if (!Number.isFinite(v)) throw new Error(`--values ${key}: "${value}" is not a number`);
    out[key] = v;
  }
  return out;
}

/** `--games 200 --depth 3` -> { games: '200', depth: '3' }. Bare `--flag` is `true`. */
export function parseFlags(argv: readonly string[]): Record<string, string | true> {
  const out: Record<string, string | true> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const eq = a.indexOf('=');
    // A flag name can never contain a space, so one means a whole flag *string* arrived as a single
    // argument -- zsh does not word-split an unquoted `$VAR`, and `$BUFF` full of `--rule` flags
    // then parses as one nonsense key and every rule is silently dropped. Fail loudly instead.
    const key = eq > 0 ? a.slice(2, eq) : a.slice(2);
    if (/\s/.test(key)) throw new Error(`"${a}" is one argument: quote it as separate words, not "$VAR"`);
    if (eq > 0) out[key] = a.slice(eq + 1);
    else out[a.slice(2)] = argv[i + 1]?.startsWith('--') === false ? argv[++i] : true;
  }
  return out;
}

export function loadSpec(argv: readonly string[]): RunSpec {
  const f = parseFlags(argv);
  const num = (k: string): number | undefined => (typeof f[k] === 'string' ? Number(f[k]) : undefined);
  const base: RunSpec = typeof f.spec === 'string'
    ? JSON.parse(readFileSync(f.spec, 'utf8'))
    : { id: 'run', games: 100, ai: {}, seed: 1 };

  if (typeof f.id === 'string') base.id = f.id;
  base.games = num('games') ?? base.games;
  base.seed = num('seed') ?? base.seed;
  base.ai ??= {};
  base.ai.depth = num('depth') ?? base.ai.depth;
  base.ai.timeMs = num('timeMs') ?? base.ai.timeMs;
  base.maxPlies = num('maxPlies') ?? base.maxPlies ?? DEFAULTS.maxPlies;
  base.openingRandomPlies = num('openingRandomPlies') ?? base.openingRandomPlies ?? DEFAULTS.openingRandomPlies;
  const ruleFlags = parseRuleFlags(argv);
  if (Object.keys(ruleFlags).length) base.rules = { ...base.rules, ...ruleFlags };
  const baseRuleFlags = parseRuleFlags(argv, '--baseRule');
  if (Object.keys(baseRuleFlags).length) base.baseRules = { ...base.baseRules, ...baseRuleFlags };
  if (typeof f.values === 'string') base.values = { ...base.values, ...parseValues(f.values) };
  if (typeof f.baseValues === 'string') base.baseValues = { ...base.baseValues, ...parseValues(f.baseValues) };
  if (typeof f.baseId === 'string') base.baseId = f.baseId;
  if (f.multiPv) base.multiPv = true;
  if (f.nopairs) base.pairs = false;
  else if (f.pairs) base.pairs = true;
  if (f.noadjudicate) base.adjudicate = false;
  else {
    const over = { resignCp: num('resignCp'), resignPlies: num('resignPlies'), drawCp: num('drawCp'), drawPlies: num('drawPlies'), drawAfterPly: num('drawAfterPly') };
    if (Object.values(over).some(v => v !== undefined)) {
      base.adjudicate = { ...(base.adjudicate || {}), ...Object.fromEntries(Object.entries(over).filter(([, v]) => v !== undefined)) };
    }
  }
  if (f.sample !== undefined || typeof f.pool === 'string') {
    const prev = base.backRanks && !Array.isArray(base.backRanks) ? base.backRanks : undefined;
    base.backRanks = {
      sample: num('sample') ?? prev?.sample ?? base.games,
      pool: typeof f.pool === 'string' ? f.pool : prev?.pool,
    };
  }
  if (!base.id || !(base.games > 0)) throw new Error('spec needs an id and games > 0');
  return base;
}

/** `evalCp`/`plies` are the older flat names for the resign rule. */

export * from './spec-plan';
