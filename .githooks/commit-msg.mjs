// commit-msg: refuses a message that holds a model name (decision 4). Git gives the path of the
// message file as the first argument. The check reads no comment line and nothing below the
// scissors line of `git commit -v`, because git removes these parts before it records the commit.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { findModelNames } from '../tools/lib/model-names.mjs';

const file = process.argv[2];
const configured = spawnSync('git', ['config', 'core.commentChar'], { encoding: 'utf8' }).stdout?.trim() ?? '';
const comment = configured.length === 1 ? configured : '#';
const lines = readFileSync(file, 'utf8').split('\n');
const scissors = lines.findIndex(line => line.startsWith(`${comment} -`) && line.includes('>8'));
// Comment lines become empty, so that each line number stays the line number in the file.
const message = (scissors < 0 ? lines : lines.slice(0, scissors)).map(line => (line.startsWith(comment) ? '' : line)).join('\n');

const finds = findModelNames(message);
if (finds.length) {
  console.error(`commit-msg: the message holds a model name (decision 4):
${finds.map(f => `  line ${f.line}: "${f.word}"`).join('\n')}
  Remove each name. For the trailer, use the neutral trailer of your tool:
    Co-Authored-By: Claude Code <noreply@anthropic.com>
    Co-Authored-By: Codex <noreply@openai.com>
  Git keeps the message in ${file}. Edit it, then commit again:
    git commit -F "${file}"`);
  process.exit(1);
}
