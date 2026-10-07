// Check lint (checks-and-hooks/11, story 13). Each check in the registry reads the three settings from the
// shared module and fails on a page error that it does not allow. Thus a check holds no port literal and no
// browser channel literal, and it uses env, trapErrors and assertNoErrors from tools/lib/checks.mjs.
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { checks } from './lib/registry.mjs';

const root = join(__dirname, '..');

/** Line rules: a line (comments left out) that matches a pattern breaks the rule. */
const lineRules = [
  // A URL or host with a port number, or a port key or flag with a number: the runner gives the server.
  { rule: 'port literal', patterns: [/\/\/[\w.[\]:-]*:\d{2,5}\b/, /\b(?:localhost|127\.0\.0\.1):\d{2,5}\b/, /\bport\b['"`]?\s*[:=,]\s*['"`]?\d/i] },
  // A quoted chrome or chromium name, or a channel key with a quoted value: PLAYABLE_BROWSER gives the channel.
  { rule: 'channel literal', patterns: [/['"`]chrom(?:e|ium)(?:-\w+)?['"`]/, /\bchannel\b['"`]?\s*:\s*['"`]/] },
];

/**
 * The text without its comments, line for line. A line that starts with `//`, `/*` or `*` is a comment line.
 * A `//` comment at the end of a line must follow a space, so that URLs stay. Strings such as '/**' can hold
 * comment marks, so the lint does not look for the end of a block comment.
 */
const code = (text: string) => text
  .split('\n')
  .map(line => (/^\s*(?:\/\/|\/\*|\*)/.test(line) ? '' : line.replace(/\s\/\/.*$/, '')));

/** The names that a check must import from the shared module and call. */
const required = ['env', 'trapErrors', 'assertNoErrors'];

/** The shared module holds the defaults (a port and the channels), so the lint does not look at it. */
const SHARED = 'tools/lib/checks.mjs';

/** Gives the faults of one file in this checkout. */
function lintFile(path: string): string[] {
  if (resolve(root, path) === resolve(root, SHARED)) return [];
  return lintCheck(path, readFileSync(join(root, path), 'utf8'));
}

/** Gives the faults of one check text. Each fault names the file and the rule. */
function lintCheck(file: string, text: string): string[] {
  const faults: string[] = [];
  const lines = code(text);
  lines.forEach((line, i) => {
    for (const { rule, patterns } of lineRules) {
      if (patterns.some(p => p.test(line))) faults.push(`${file}: ${rule} (line ${i + 1}: ${line.trim()})`);
    }
  });
  // The local name of each import from the shared module; `x as y` gives y.
  const body = lines.join('\n');
  const local = new Map<string, string>();
  for (const [, names] of body.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"][^'"]*lib\/checks\.mjs['"]/g)) {
    for (const item of names.split(',').map(n => n.trim()).filter(Boolean)) {
      const [name, alias] = item.split(/\s+as\s+/);
      local.set(name, alias ?? name);
    }
  }
  for (const name of required) {
    const as = local.get(name);
    if (!as || !new RegExp(`\\b${as}\\s*\\(`).test(body)) faults.push(`${file}: does not use ${name} from ${SHARED}`);
  }
  return faults;
}

const GOOD = `import { assertNoErrors, env, launch, trapErrors } from './lib/checks.mjs';
const base = env('PLAYABLE_URL');
const browser = await launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
trapErrors(page);
await page.goto(base);
assertNoErrors();
`;

describe('check lint fixtures', () => {
  it('a check with a port literal fails', () => {
    for (const line of ["const base = 'http://127.0.0.1:5189/';", "const base = 'http://localhost:5173';", 'const server = { port: 5189 };', "spawn('npx', ['vite', 'preview', '--port', '5189']);"]) {
      const faults = lintCheck('tools/verify-x.mjs', GOOD + line);
      expect(faults, line).toHaveLength(1);
      expect(faults[0]).toMatch(/^tools\/verify-x\.mjs: port literal/);
    }
  });

  it('a check with a chrome or chromium channel literal fails', () => {
    for (const line of ["const browser = await chromium.launch({ channel: 'chrome' });", 'const channel = "chromium";', "await launch({ channel: `chrome-beta` });"]) {
      const faults = lintCheck('tools/verify-x.mjs', GOOD + line);
      expect(faults, line).toHaveLength(1);
      expect(faults[0]).toMatch(/^tools\/verify-x\.mjs: channel literal/);
    }
  });

  it('the Playwright import and a comment are not literals', () => {
    const text = "import { chromium } from 'playwright';\n// The runner serves http://127.0.0.1:5189/ with the 'chrome' channel.\n" + GOOD;
    expect(lintCheck('tools/verify-x.mjs', text)).toEqual([]);
  });

  it('a check without env, trapErrors or assertNoErrors from the shared module fails', () => {
    for (const name of ['env', 'trapErrors', 'assertNoErrors']) {
      const text = GOOD.replace(new RegExp(`\\b${name}\\b,? ?`, 'g'), '');
      const faults = lintCheck('docs/visual-design/verify.mjs', text);
      expect(faults, name).toEqual([`docs/visual-design/verify.mjs: does not use ${name} from ${SHARED}`]);
    }
  });

  it('a name from another module or one that the check never calls does not count', () => {
    const local = GOOD.replace("import { assertNoErrors, env, launch, trapErrors } from './lib/checks.mjs';", "import { assertNoErrors, env, launch } from './lib/checks.mjs';\nimport { trapErrors } from './my-errors.mjs';");
    expect(lintCheck('tools/verify-x.mjs', local)).toEqual(['tools/verify-x.mjs: does not use trapErrors from tools/lib/checks.mjs']);
    const uncalled = GOOD.replace('assertNoErrors();\n', '');
    expect(lintCheck('tools/verify-x.mjs', uncalled)).toEqual(['tools/verify-x.mjs: does not use assertNoErrors from tools/lib/checks.mjs']);
  });

  it('a check that follows every rule passes', () => {
    expect(lintCheck('tools/verify-x.mjs', GOOD)).toEqual([]);
  });
});

describe('check lint on the registry', () => {
  // The planned faults of the runner (byName entries) are not checks; they open no page.
  const linted = checks.filter(c => !c.byName);

  it('the registry gives the 13 checks and the self-test', () => {
    expect(linted.length).toBeGreaterThanOrEqual(14);
  });

  it.each(linted.map(c => [c.name, c.script]))('%s (%s) follows every rule', (_name, script) => {
    expect(lintFile(script)).toEqual([]);
  });

  it('the shared module is not linted for its own defaults', () => {
    const shared = readFileSync(join(root, SHARED), 'utf8');
    const faults = lintCheck('tools/verify-copy.mjs', shared).join('\n');
    expect(faults).toMatch(/port literal/);
    expect(faults).toMatch(/channel literal/);
    expect(lintFile(SHARED)).toEqual([]);
  });
});
