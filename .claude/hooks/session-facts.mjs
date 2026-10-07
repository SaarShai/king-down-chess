#!/usr/bin/env node
// Session facts: a Claude Code SessionStart hook for the sources `startup` and `compact`.
// It reads the hook JSON on stdin and writes facts, never commands, on stdout. Claude Code adds
// that text to the context. It always exits 0, so it never blocks a session.
//
// compact: the main checkout's open items (the first section of TASKS.md) and its live runs
// (from each docs/QUEUE.md section whose heading starts with "Running": the table header and
// each row whose state does not start with "done"). The text stays under 9,500 characters: longer
// text stops at a row boundary, and one line names the file to read.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const LIMIT = 9500;

/** Runs git in `cwd`; gives its trimmed output, or undefined outside git. */
function git(cwd, ...args) {
  try {
    return execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return undefined;
  }
}

/** The main checkout: the folder that holds git's common folder, else CLAUDE_PROJECT_DIR. */
function mainCheckout(cwd) {
  const common = git(cwd, 'rev-parse', '--path-format=absolute', '--git-common-dir');
  return common ? dirname(common) : process.env.CLAUDE_PROJECT_DIR || cwd;
}

/** The lines of `path`, or undefined when the file is missing. */
function readLines(path) {
  return existsSync(path) ? readFileSync(path, 'utf8').replace(/\n+$/, '').split('\n') : undefined;
}

/** The first section of the task index: from the start to the second "## " heading. */
function firstSection(lines) {
  const headings = lines.flatMap((line, i) => (line.startsWith('## ') ? [i] : []));
  return headings.length > 1 ? lines.slice(0, headings[1]) : lines;
}

/** The cells of a table row; a "\|" stays in its cell. */
const cells = row => row.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map(c => c.trim());
const isSeparator = line => /^\|[\s:|-]+$/.test(line.trim()) && line.includes('-');

/** From each section whose heading starts with "Running": the heading, table headers, live rows. */
function liveRuns(lines) {
  const out = [];
  let level = 0; // The heading level of the current Running section; 0 outside one.
  let state = -1; // The state column of the current table; -1 outside a table.
  lines.forEach((line, i) => {
    const heading = /^(#+)\s+(.*)$/.exec(line);
    if (heading) {
      if (heading[2].startsWith('Running')) { level = heading[1].length; out.push(line); }
      else if (heading[1].length <= level) level = 0;
      state = -1;
      return;
    }
    if (!level) return;
    if (!line.trim().startsWith('|')) { state = -1; return; }
    if (state === -1 && isSeparator(lines[i + 1] ?? '')) {
      state = cells(line).findIndex(c => c.toLowerCase() === 'state');
      out.push(line, lines[i + 1]);
      return;
    }
    if (isSeparator(line)) return;
    if (!(cells(line)[state] ?? '').toLowerCase().startsWith('done')) out.push(line);
  });
  return out;
}

/** Facts for the compaction: [line, file] pairs, so that a cut can name its file. */
function compactFacts(cwd) {
  const main = mainCheckout(cwd);
  const tasksPath = join(main, 'TASKS.md');
  const queuePath = join(main, 'docs', 'QUEUE.md');
  const facts = [[`Facts from the main checkout ${main}, read after the compaction.`, tasksPath]];
  const tasks = readLines(tasksPath);
  if (!tasks) facts.push([`Fact: ${tasksPath} is missing.`, tasksPath]);
  else {
    facts.push([`The first section of ${tasksPath}:`, tasksPath]);
    for (const line of firstSection(tasks)) facts.push([line, tasksPath]);
  }
  const queue = readLines(queuePath);
  if (!queue) facts.push([`Fact: ${queuePath} is missing.`, queuePath]);
  else {
    const runs = liveRuns(queue);
    if (!runs.length) facts.push([`Fact: ${queuePath} has no section whose heading starts with "Running".`, queuePath]);
    else {
      facts.push(['', queuePath], [`The live runs in ${queuePath} (each row whose state does not start with "done"):`, queuePath]);
      for (const line of runs) facts.push([line, queuePath]);
    }
  }
  return facts;
}

/** Joins the facts; text that would reach LIMIT stops at a row boundary and names the file. */
function fit(facts) {
  const out = [];
  let length = 0;
  for (const [line, file] of facts) {
    const cut = `Fact: the text stops here at the ${LIMIT}-character limit; the rest is in ${file}.`;
    if (length + line.length + 1 + cut.length + 1 >= LIMIT) {
      out.push(cut);
      break;
    }
    out.push(line);
    length += line.length + 1;
  }
  return out.join('\n') + '\n';
}

async function main() {
  let input = {};
  try {
    let text = '';
    for await (const chunk of process.stdin) text += chunk;
    input = JSON.parse(text);
  } catch {
    // Bad or empty input: use the defaults below.
  }
  const cwd = typeof input.cwd === 'string' && input.cwd ? input.cwd : process.cwd();
  if (input.source === 'compact') process.stdout.write(fit(compactFacts(cwd)));
}

try {
  await main();
} catch (error) {
  process.stdout.write(`Fact: the session hook failed: ${error instanceof Error ? error.message : String(error)}\n`);
}
process.exitCode = 0;
