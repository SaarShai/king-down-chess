#!/usr/bin/env node
// Tool gate: a Claude Code PreToolUse hook on Bash.
// It refuses commands that print the environment, process command lines or a secret file.
// It also refuses an npm install into a linked node_modules folder.
// It asks before production, DNS and pages actions and before a git hook bypass.
// In bypassPermissions and dontAsk mode an ask can pass with no prompt, so there an ask becomes a deny.
// It stops mistakes, not an adversary. A fault or bad input gives "ask", never a pass.
import { lstatSync, readFileSync, realpathSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const MAX_DEPTH = 8;

// ---------------------------------------------------------------- shell lexer

/**
 * Splits a command line into simple commands.
 * Each simple command is { words, redirects }. Text in $(...), (...) and back quotes
 * becomes more simple commands. Heredoc bodies and comments are ignored.
 */
export function parse(line, depth = 0) {
  return scan(line, 0, depth, '').commands;
}

/** Scans from `start` to the end of the line, or to `closer` (")" or a back quote). */
function scan(line, start, depth, closer) {
  if (depth > MAX_DEPTH) throw new Error('the command nests too deep');
  const commands = [];
  let words = [], redirects = [], word = '', inWord = false, redirect = null, heredocs = [];
  let i = start;
  const n = line.length;

  const endWord = () => {
    if (!inWord) return;
    if (redirect) { redirects.push({ op: redirect, target: word }); redirect = null; }
    else words.push(word);
    word = ''; inWord = false;
  };
  const endCommand = () => {
    endWord();
    if (words.length || redirects.length) commands.push({ words, redirects });
    words = []; redirects = [];
  };
  // Scans a nested part that starts at `from`; returns its text and moves i past its closer.
  const sub = (from, close) => {
    const result = scan(line, from, depth + 1, close);
    commands.push(...result.commands);
    i = result.end;
    return line.slice(from, result.end - 1);
  };
  // Skips $(( ... )) arithmetic.
  const arithmetic = () => {
    let level = 0;
    for (; i < n; i++) {
      if (line[i] === '(') level++;
      else if (line[i] === ')' && --level === 0) { i++; return; }
    }
    throw new Error('unclosed "$(("');
  };
  const skipHeredocBodies = () => {
    // i is just after a newline. Skip each pending heredoc body up to its end line.
    for (const { tag, strip } of heredocs) {
      for (;;) {
        if (i >= n) throw new Error(`heredoc "${tag}" has no end line`);
        let end = line.indexOf('\n', i);
        if (end < 0) end = n;
        const text = strip ? line.slice(i, end).replace(/^\t+/, '') : line.slice(i, end);
        i = end + 1;
        if (text === tag) break;
      }
    }
    heredocs = [];
  };

  while (i < n) {
    const c = line[i];
    if (c === closer) { endCommand(); return { commands, end: i + 1 }; }
    if (c === '\\') { inWord = true; if (line[i + 1] !== '\n') word += line[i + 1] ?? ''; i += 2; continue; }
    if (c === "'") {
      const end = line.indexOf("'", i + 1);
      if (end < 0) throw new Error('unclosed single quote');
      word += line.slice(i + 1, end); inWord = true; i = end + 1; continue;
    }
    if (c === '"') {
      inWord = true; i++;
      for (;;) {
        if (i >= n) throw new Error('unclosed double quote');
        const d = line[i];
        if (d === '"') { i++; break; }
        if (d === '\\' && '"\\$`\n'.includes(line[i + 1])) { word += line[i + 1]; i += 2; continue; }
        if (d === '$' && line.startsWith('$((', i)) { const from = i; i++; arithmetic(); word += line.slice(from, i); continue; }
        if (d === '$' && line[i + 1] === '(') { word += `$(${sub(i + 2, ')')})`; continue; }
        if (d === '`') { word += `\`${sub(i + 1, '`')}\``; continue; }
        word += d; i++;
      }
      continue;
    }
    if (c === '$' && line.startsWith('$((', i)) { const from = i; i++; arithmetic(); word += line.slice(from, i); inWord = true; continue; }
    if (c === '$' && line[i + 1] === '(') { word += `$(${sub(i + 2, ')')})`; inWord = true; continue; }
    if (c === '`') { word += `\`${sub(i + 1, '`')}\``; inWord = true; continue; }
    if (c === '#' && !inWord) { while (i < n && line[i] !== '\n') i++; continue; }
    if (c === '\n') { endCommand(); i++; skipHeredocBodies(); continue; }
    if (c === ' ' || c === '\t') { endWord(); i++; continue; }
    if (c === '&' && line[i + 1] === '>') { endWord(); redirect = line[i + 2] === '>' ? '>>' : '>'; i += redirect.length + 1; continue; }
    if (c === '(') { endCommand(); sub(i + 1, ')'); continue; }
    if (c === ';' || c === '|' || c === '&' || c === ')') { endCommand(); i++; continue; }
    if (c === '<' || c === '>') {
      if (inWord && /^\d+$/.test(word)) { word = ''; inWord = false; } // a file descriptor number
      endWord();
      if (line.startsWith('<<<', i)) { redirect = '<<<'; i += 3; continue; }
      if (line.startsWith('<<', i)) {
        i += 2;
        const strip = line[i] === '-';
        if (strip) i++;
        while (line[i] === ' ' || line[i] === '\t') i++;
        const m = /^(['"]?)([^\s'";|&<>()]+)\1/.exec(line.slice(i));
        if (!m) throw new Error('a heredoc has no end word');
        heredocs.push({ tag: m[2], strip });
        i += m[0].length;
        continue;
      }
      redirect = c === '>' && line[i + 1] === '>' ? '>>' : c;
      i += redirect.length;
      if (line[i] === '&' || line[i] === '|') i++; // >&2, <&0, >|
      continue;
    }
    word += c; inWord = true; i++;
  }
  if (closer) throw new Error(closer === ')' ? 'unclosed "("' : 'unclosed back quote');
  endCommand();
  return { commands, end: i };
}

// ---------------------------------------------------------------- rules

const SECRET_PATH = /(^|[\/~])\.secrets(\/|$)|(^|\/)\.config\/typesafe\/key$/;
const PROC_FILE = /\/proc\/[^/\s]+\/(environ|cmdline)\b/;
const READERS = new Set([
  'cat', 'head', 'tail', 'less', 'more', 'bat', 'nl', 'tac', 'rev', 'od', 'xxd', 'hexdump', 'strings',
  'base64', 'jq', 'grep', 'egrep', 'fgrep', 'rg', 'sed', 'awk', 'cut', 'sort', 'uniq', 'fold', 'column',
  'diff', 'cmp',
]);
const NPM_INSTALL = new Set([
  'ci', 'clean-install', 'ic', 'install-clean', 'isntall-clean', 'install', 'i', 'in', 'ins', 'inst',
  'insta', 'instal', 'isnt', 'isnta', 'isntal', 'isntall', 'add',
]);
const SHELLS = new Set(['sh', 'bash', 'zsh', 'dash', 'ksh', 'fish']);
// Options that take a value, per wrapper.
const WRAPPER_VALUE_OPTIONS = {
  sudo: new Set(['-u', '-g', '-h', '-p', '-C', '-D', '-r', '-t', '-U']),
  doas: new Set(['-u', '-C']),
  npx: new Set(['-p', '--package', '-c', '--call']),
  bunx: new Set(['-p', '--package']),
  pnpx: new Set(['-p', '--package']),
  env: new Set(['-u', '--unset', '-C', '--chdir', '-S', '--split-string', '-P']),
  nice: new Set(['-n', '--adjustment']),
  timeout: new Set(['-s', '--signal', '-k', '--kill-after']),
  xargs: new Set(['-I', '-L', '-n', '-P', '-s', '-d', '-E', '-a']),
  time: new Set(['-f', '--format', '-o', '--output']),
};
// Shell words that can stand before a command.
const KEYWORDS = new Set(['{', '!', 'if', 'then', 'else', 'elif', 'do', 'while', 'until']);
const PLAIN_WRAPPERS = new Set(['time', 'nohup', 'command', 'builtin', 'exec', 'nice', 'xargs', 'sudo', 'doas', 'npx', 'bunx', 'pnpx', 'timeout', 'env', 'caffeinate', 'stdbuf']);
// Package managers that run a package through a sub-command, such as `pnpm dlx vercel`.
const RUNNER_SUBCOMMANDS = { pnpm: new Set(['dlx', 'exec']), yarn: new Set(['dlx', 'exec']), npm: new Set(['exec', 'x']) };
const RUNNER_VALUE_OPTIONS = new Set(['-C', '--dir', '-F', '--filter', '-w', '--workspace', '-p', '--package']);
const SSH_VALUE_OPTIONS = new Set('BbcDEeFIiJLlmOoPpQRSWw'.split('').map(c => `-${c}`));

const SAFE_PROCESS = 'Use `pgrep -x <name>` for a PID, or `ps -o pid,stat -p <pid>` for its state.';
const SAFE_ENV = 'To test one variable, use `echo "${VAR:+set}"`.';
const deny = reason => ({ decision: 'deny', reason });
const ask = reason => ({ decision: 'ask', reason });
const NO_PROMPT_MODES = new Set(['bypassPermissions', 'dontAsk']);
const PORKBUN_API = /\bapi\.porkbun\.com\b|\bporkbun\.com\/api\b/i;
const HOOKS_PATH = /^core\.hookspath$/i;
// Global git options that take a value as the next word.
const GIT_VALUE_OPTIONS = new Set(['-C', '-c', '--git-dir', '--work-tree', '--namespace', '--config-env', '--super-prefix']);
// git commit short options that take a value.
const COMMIT_VALUE_FLAGS = 'mFcCt';

/** Removes leading VAR=value words and wrappers such as sudo, npx, env and time. */
function unwrap(words) {
  let rest = words;
  for (;;) {
    while (rest.length && (KEYWORDS.has(rest[0]) || /^[A-Za-z_][A-Za-z0-9_]*=/.test(rest[0]))) rest = rest.slice(1);
    const name = rest.length ? basename(rest[0]) : '';
    if (RUNNER_SUBCOMMANDS[name]) {
      let k = 1;
      while (k < rest.length && rest[k].startsWith('-')) k += RUNNER_VALUE_OPTIONS.has(rest[k]) ? 2 : 1;
      if (!RUNNER_SUBCOMMANDS[name].has(rest[k])) return rest;
      rest = ['npx', ...rest.slice(k + 1)]; // the same shape as npx, so the npx loop below strips it
      continue;
    }
    if (!PLAIN_WRAPPERS.has(name)) return rest;
    const valueOptions = WRAPPER_VALUE_OPTIONS[name] ?? new Set();
    let k = 1;
    while (k < rest.length && rest[k].startsWith('-') && rest[k] !== '-') {
      if (rest[k] === '--') { k++; break; }
      k += valueOptions.has(rest[k]) ? 2 : 1;
    }
    if (name === 'env') while (k < rest.length && /^[A-Za-z_][A-Za-z0-9_]*=/.test(rest[k])) k++;
    if (name === 'timeout') k++; // the duration
    if (name === 'env' && k >= rest.length) return ['env']; // bare env prints all
    rest = rest.slice(k);
  }
}

/** The text of a nested command line: ssh's remote command, sh -c, eval. Else null. */
function innerLine(name, args) {
  if (name === 'ssh') {
    let k = 0;
    while (k < args.length && args[k].startsWith('-')) k += SSH_VALUE_OPTIONS.has(args[k]) ? 2 : 1;
    return args.slice(k + 1).join(' ') || null; // args[k] is the host
  }
  if (SHELLS.has(name)) {
    const k = args.findIndex(a => /^-[a-zA-Z]*c[a-zA-Z]*$/.test(a));
    return k >= 0 && k + 1 < args.length ? args[k + 1] : null;
  }
  if (name === 'eval') return args.join(' ');
  return null;
}

const operands = args => args.filter(a => !a.startsWith('-') && !a.startsWith('+'));

function psRule(args) {
  // ps shows a command line unless every column comes from -o lists without a command column.
  const columns = [];
  let formatFlags = false;
  for (let k = 0; k < args.length; k++) {
    const a = args[k];
    const bsd = k === 0 && !a.startsWith('-');
    if (!a.startsWith('-') && !bsd) continue;
    if (a === '--format' || a === '-o' || a === 'o') { columns.push(args[++k] ?? ''); continue; }
    if (a.startsWith('--format=')) { columns.push(a.slice(9)); continue; }
    if (a.startsWith('--')) continue;
    const flags = bsd ? a : a.slice(1);
    const o = flags.indexOf('o');
    if (o >= 0) {
      if (/[fFljuvOsX]/.test(flags.slice(0, o))) formatFlags = true;
      columns.push(o + 1 < flags.length ? flags.slice(o + 1) : (args[++k] ?? ''));
      continue;
    }
    if (/[fFljuvOsX]/.test(flags)) formatFlags = true;
    if (/^[pUGgtq]$/.test(flags)) k++; // a selection value, such as -p 123
  }
  const names = columns.join(',').split(/[,\s]+/).map(c => c.replace(/=.*$/, '').toLowerCase());
  if (formatFlags || !columns.length || names.some(c => ['command', 'args', 'cmd'].includes(c))) {
    return deny(`ps here shows process command lines, which can hold secrets. ${SAFE_PROCESS}`);
  }
  return null;
}

/** A git hook bypass or a core.hooksPath change, else null. */
function gitRule(args) {
  let k = 0;
  for (; k < args.length && args[k].startsWith('-'); k++) {
    if ((args[k] === '-c' || args[k] === '--config-env') && HOOKS_PATH.test((args[k + 1] ?? '').replace(/=.*$/, ''))) {
      return ask(`\`git ${args[k]} ${args[k + 1]}\` changes core.hooksPath, so the git hooks do not run.`);
    }
    if (GIT_VALUE_OPTIONS.has(args[k])) k++;
  }
  const sub = args[k];
  const subArgs = args.slice(k + 1);
  if (subArgs.includes('--no-verify')) return ask(`\`git ${sub} --no-verify\` skips the git hooks.`);
  if (sub === 'commit') {
    for (let j = 0; j < subArgs.length; j++) {
      const a = subArgs[j];
      if (a === '--') break;
      if (!/^-[^-]/.test(a)) continue;
      for (let c = 1; c < a.length; c++) {
        if (a[c] === 'n') return ask('`git commit -n` skips the git hooks.');
        if (COMMIT_VALUE_FLAGS.includes(a[c])) { if (c === a.length - 1) j++; break; }
      }
    }
  }
  if (sub === 'config') {
    const key = subArgs.findIndex(a => HOOKS_PATH.test(a));
    if (key < 0) return null;
    const read = subArgs.some(a => ['--get', '--get-all', '--get-regexp', 'get', '--list', '-l', 'list'].includes(a))
      || (key === subArgs.length - 1 && !subArgs.some(a => ['--unset', '--unset-all', 'unset', 'set', '--add', '--replace-all'].includes(a)));
    if (!read) return ask('This changes core.hooksPath, so the git hooks can stop running.');
  }
  return null;
}

/** Commands that change production, DNS or the pages site, or skip the git hooks. Else null. */
function askRule(name, rest, words) {
  const all = rest.slice(1);
  if (/^vercel(@.*)?$/.test(name)) return ask('vercel can change the production site, its domains or its environment.');
  if (name === 'psql') return ask('psql can change the production database.');
  if (/^supabase(@.*)?$/.test(name)) return ask('supabase can change the production database or project.');
  if (rest.some(w => /^deploy(\.sh)?$/.test(basename(w))) && all.some(a => a === '--publish' || a.startsWith('--publish='))) {
    return ask('The deploy script with --publish puts a build on the live site.');
  }
  if (name === 'gh') {
    const w = all.indexOf('workflow');
    if (w >= 0 && all.slice(w + 1).find(a => !a.startsWith('-')) === 'run') {
      return ask('gh workflow run starts a GitHub workflow, such as the pages deploy.');
    }
  }
  if (name === 'git') {
    const result = gitRule(all);
    if (result) return result;
  }
  if (words.some(w => /^GIT_CONFIG_(KEY_\d+|PARAMETERS)=/.test(w) && /core\.hookspath/i.test(w))) {
    return ask('A GIT_CONFIG variable changes core.hooksPath, so the git hooks can stop running.');
  }
  return null;
}

function checkCommand({ words, redirects }, cwd, depth) {
  const proc = [...words, ...redirects.map(r => r.target)].find(w => PROC_FILE.test(w));
  if (proc) return deny(`${proc} holds a process environment or command line. ${SAFE_PROCESS}`);
  const input = redirects.find(r => r.op === '<' && SECRET_PATH.test(r.target));
  if (input) {
    return deny(`This sends the secret file ${input.target} into a command. Let the tool read the file itself, or test it with \`test -s ${input.target}\`.`);
  }

  const porkbun = [...words, ...redirects.map(r => r.target)].some(w => PORKBUN_API.test(w));
  const porkbunAsk = porkbun ? ask('This calls the Porkbun API, which can change DNS for the domain.') : null;

  const rest = unwrap(words);
  if (!rest.length) return porkbunAsk ?? askRule('', rest, words);
  const name = basename(rest[0]);
  const args = rest.slice(1);

  const inner = innerLine(name, args);
  if (inner !== null) return strongest(decideLine(inner, cwd, depth + 1), porkbunAsk);

  switch (name) {
    case 'printenv':
      return deny(`printenv prints environment values, which can hold secrets. ${SAFE_ENV}`);
    case 'env':
      return deny(`Bare env prints every environment value, which can hold secrets. ${SAFE_ENV}`);
    case 'export': case 'set': case 'declare': case 'typeset': case 'readonly':
      if (operands(args).length === 0 && (name !== 'set' || args.length === 0)) {
        return deny(`\`${rest.join(' ')}\` prints every variable, which can hold secrets. ${SAFE_ENV}`);
      }
      return null;
    case 'pgrep':
      if (args.some(a => /^-[a-zA-Z]*[la]/.test(a) || a === '--list-name' || a === '--list-full')) {
        return deny(`pgrep with -l or -a prints process command lines, which can hold secrets. Use \`pgrep -x <name>\` for the PID only.`);
      }
      return null;
    case 'ps':
      return psRule(args);
    case 'npm': {
      const sub = args.find(a => !a.startsWith('-'));
      if (sub && NPM_INSTALL.has(sub) && isLink(join(cwd, 'node_modules'))) {
        return deny(`node_modules in ${cwd} is a link to a shared folder; \`npm ${sub}\` changes or empties it for every worktree. Use \`wt add <path>\` to give a worktree its own packages.`);
      }
      break;
    }
  }
  if (READERS.has(name)) {
    const secret = args.find(a => SECRET_PATH.test(a));
    if (secret) {
      return deny(`${name} would send the secret file ${secret} to the transcript. Let the tool read the file itself, or test it with \`test -s ${secret}\`.`);
    }
  }
  return porkbunAsk ?? askRule(name, rest, words);
}

/** deny is stronger than ask, and ask is stronger than a pass (null). */
const strongest = (a, b) => (a?.decision === 'deny' ? a : b?.decision === 'deny' ? b : a ?? b);

function isLink(path) {
  try { return lstatSync(path).isSymbolicLink(); } catch { return false; }
}

function decideLine(line, cwd, depth) {
  let result = null;
  for (const command of parse(line, depth)) {
    result = strongest(result, checkCommand(command, cwd, depth));
    if (result?.decision === 'deny') return result;
  }
  return result;
}

/** In a mode with no prompt, an ask becomes a deny that tells the agent to ask the owner. */
function forMode(result, mode) {
  if (result?.decision !== 'ask' || !NO_PROMPT_MODES.has(mode)) return result;
  return deny(`${result.reason} In ${mode} mode a hook ask can pass with no prompt, so the gate refuses it: ask the owner in chat.`);
}

/**
 * The pure decision. In: the command line, the working folder and the permission mode.
 * Out: { decision, reason } or null for a pass.
 */
export function decide({ command, cwd, mode }) {
  if (typeof command !== 'string') throw new TypeError(`command is ${typeof command}, not a string`);
  if (typeof cwd !== 'string') throw new TypeError(`cwd is ${typeof cwd}, not a string`);
  return forMode(decideLine(command, cwd, 0), mode);
}

// ---------------------------------------------------------------- hook wrapper

const output = (decision, reason, mode) => {
  const result = forMode({ decision, reason }, mode);
  return JSON.stringify({
    hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: result.decision, permissionDecisionReason: result.reason },
  });
};

/** Hook JSON text in; PreToolUse JSON text out, or '' for a pass. */
export function hook(stdin) {
  let input;
  try { input = JSON.parse(stdin); } catch (error) {
    return output('ask', `Tool gate fault: the hook input is not JSON (${error.message}).`);
  }
  const mode = input?.permission_mode;
  if (!input || typeof input.tool_input !== 'object' || input.tool_input === null) {
    return output('ask', 'Tool gate fault: the hook input has no tool_input.', mode);
  }
  if (input.tool_name !== 'Bash') return '';
  try {
    const result = decide({ command: input.tool_input.command, cwd: input.cwd ?? process.cwd(), mode });
    return result ? output(result.decision, `Tool gate: ${result.reason}`) : '';
  } catch (error) {
    return output('ask', `Tool gate fault: ${error.message}. Check the command by hand.`, mode);
  }
}

// Run as the hook: always exit 0, because another exit code lets the call through.
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let text;
  try { text = hook(readFileSync(0, 'utf8')); } catch (error) {
    text = output('ask', `Tool gate fault: ${error.message}. Check the command by hand.`);
  }
  if (text) process.stdout.write(`${text}\n`);
}
