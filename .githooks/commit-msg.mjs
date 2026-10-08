// commit-msg: refuses a message that holds a model name (decision 4), and a commit that removes
// assertion lines from the registered browser checks with fewer `Removed-check:` trailers than
// removed lines (story 8; the counter is tools/lib/removed-checks.mjs). The hook does not judge the
// reasons in the trailers; a reviewer does. Git gives the path of the message file as the first
// argument. The hook reads no comment line and nothing below the scissors line of `git commit -v`,
// because git removes these parts before it records the commit.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { findModelNames } from '../tools/lib/model-names.mjs';
import { stagedRemovedAssertions } from '../tools/lib/removed-checks.mjs';

const file = process.argv[2];
const configured = spawnSync('git', ['config', 'core.commentChar'], { encoding: 'utf8' }).stdout?.trim() ?? '';
const comment = configured.length === 1 ? configured : '#';
const lines = readFileSync(file, 'utf8').split('\n');
const scissors = lines.findIndex(line => line.startsWith(`${comment} -`) && line.includes('>8'));
// Comment lines become empty, so that each line number stays the line number in the file.
const message = (scissors < 0 ? lines : lines.slice(0, scissors)).map(line => (line.startsWith(comment) ? '' : line)).join('\n');

const faults = [];
const finds = findModelNames(message);
if (finds.length) {
  faults.push(`the message holds a model name (decision 4):
${finds.map(f => `  line ${f.line}: "${f.word}"`).join('\n')}
  Remove each name. For the trailer, use the neutral trailer of your tool:
    Co-Authored-By: Claude Code <noreply@anthropic.com>
    Co-Authored-By: Codex <noreply@openai.com>`);
}
const removed = stagedRemovedAssertions();
const named = message.split('\n').filter(line => /^Removed-check:[ \t]*\S/i.test(line)).length;
if (named < removed.length) {
  const plural = (/** @type {number} */ n, /** @type {string} */ word) => `${n} ${word}${n === 1 ? '' : 's'}`;
  faults.push(`the commit removes ${plural(removed.length, 'assertion line')} from registered checks, and the message has ${plural(named, 'Removed-check: trailer')}.
${removed.map(r => `  ${r.file}:${r.line}: ${r.text}`).join('\n')}
  Add one trailer for each removed line at the end of the message:
    Removed-check: <file>: <what the line checked>, <why it goes>
  A line that the commit adds again (a moved line) needs no trailer.`);
}
if (faults.length) {
  console.error(`${faults.map(fault => `commit-msg: ${fault}`).join('\n')}
  Git keeps the message in ${file}. Edit it, then commit again:
    git commit -F "${file}"`);
  process.exit(1);
}
