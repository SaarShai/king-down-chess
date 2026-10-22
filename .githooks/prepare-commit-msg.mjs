// prepare-commit-msg: removes each `Claude-Session:` line, then adds each required tool trailer.
// Git gives the path of the message file as the first argument.
//
// Markers: Codex sets CODEX_THREAD_ID in each shell (read in a Codex shell, 2026-10-07); Claude
// Code sets CLAUDECODE. Codex work needs both tool trailers under the house rule.
// With no marker, the hook adds no trailer.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const file = process.argv[2];
const codex = 'Co-Authored-By: Codex <noreply@openai.com>';
const claudeCode = 'Co-Authored-By: Claude Code <noreply@anthropic.com>';
const trailers = process.env.CODEX_THREAD_ID ? [claudeCode, codex]
  : process.env.CLAUDECODE ? [claudeCode] : [];

const text = readFileSync(file, 'utf8').replace(/^Claude-Session:.*(?:\n|$)/gim, '');
writeFileSync(file, text);

// A message with no text of its own gets no trailer, so that git still refuses an empty message.
const configured = spawnSync('git', ['config', 'core.commentChar'], { encoding: 'utf8' }).stdout?.trim() ?? '';
const comment = configured.length === 1 ? configured : '#';
const lines = text.split('\n');
const scissors = lines.findIndex(line => line.startsWith(`${comment} -`) && line.includes('>8'));
const own = (scissors < 0 ? lines : lines.slice(0, scissors)).filter(line => !line.startsWith(comment)).join('').trim();

if (trailers.length && own) {
  const result = spawnSync('git', ['interpret-trailers', '--in-place', '--if-exists', 'addIfDifferent', ...trailers.flatMap(trailer => ['--trailer', trailer]), file], { stdio: 'inherit' });
  if (result.status !== 0) {
    console.error(`prepare-commit-msg: git interpret-trailers failed. Add each missing line at the end of the message:\n  ${trailers.join('\n  ')}`);
    process.exit(1);
  }
}
