/** The fault report has no player or game data. Keep these limits on both sides. */
export const MAX_ERROR_BODY = 4096;
export const BUNDLE_FRAME = /^\/assets\/(?:[\w-]+\/)*[\w.-]+\.js:[1-9]\d{0,7}:[1-9]\d{0,7}$/;
export const BUILD_ID = /^[a-f0-9]{40}$/;
export const ERROR_NAMES = ['Error', 'TypeError', 'RangeError', 'ReferenceError', 'SyntaxError', 'URIError', 'EvalError', 'AggregateError', 'InternalError', 'AbortError', 'NetworkError', 'SecurityError', 'DataCloneError', 'QuotaExceededError'] as const;
export type ClientErrorReport = {
 kind: 'error' | 'rejection' | 'worker'; name: string; message: string; frames: string[];
 route: string; build: string; browser: string; size: 'phone' | 'desktop'; fingerprint: string;
};
export type ErrorReport = Omit<ClientErrorReport, 'kind' | 'browser' | 'size'> & {
 kind: ClientErrorReport['kind'] | 'server'; browser?: string; size?: ClientErrorReport['size'];
};

declare const __KINGDOWN_ERROR_FORMS__: string[][];
const sourceForms = (typeof __KINGDOWN_ERROR_FORMS__ === 'undefined' ? [] : __KINGDOWN_ERROR_FORMS__).map(parts => ({ parts, text: scrub(parts.join('[value]')) }));

/** Match template parts in order, with no regular-expression backtracking. */
function matchesSource(value: string, parts: string[]): boolean {
 if (parts.length === 1) return value === parts[0];
 if (!value.startsWith(parts[0]) || !value.endsWith(parts[parts.length - 1])) return false;
 let cursor = parts[0].length;
 for (const part of parts.slice(1, -1)) {
  const next = value.indexOf(part, cursor);
  if (next < 0) return false;
  cursor = next + part.length;
 }
 return cursor <= value.length - parts[parts.length - 1].length;
}
const identifier = '(?:\\[redacted\\]|[A-Za-z_$][A-Za-z0-9_$]{0,31}(?:\\.[A-Za-z_$][A-Za-z0-9_$]{0,31}){0,3})';
const engineForms = [
 [new RegExp(`^Cannot read properties of (?:undefined|null) \\(reading '?${identifier}'?\\)$`), 'Cannot read properties of [value] (reading [value])'],
 [new RegExp(`^${identifier} is not a function$`), '[value] is not a function'],
 [new RegExp(`^(?:undefined|null) is not an object \\(evaluating '?${identifier}'?\\)$`), '[value] is not an object (evaluating [value])'],
 [new RegExp(`^${identifier} is not defined$`), '[value] is not defined'],
] as const;
const fixedMessages = new Set(['Unlisted message', 'Failed to fetch', 'fetch failed', 'Load failed', 'NetworkError when attempting to fetch resource.', 'Maximum call stack size exceeded', 'too much recursion']);

/** Keep approved forms only. The scrub is a second layer, not a free-text filter. */
export function errorMessage(value: string): string {
 if (value.length > 16_384) return 'Unlisted message';
 if (fixedMessages.has(value)) return value;
 for (const form of sourceForms) if (value === form.text || matchesSource(value, form.parts)) return form.text;
 if (/^(?:Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed)(?::[^\r\n]*)?\.?$/.test(value)) return 'Dynamic import failed';
 if (value === 'Dynamic import failed') return value;
 for (const [pattern, text] of engineForms) if (value === text || pattern.test(value)) return text;
 return 'Unlisted message';
}

/** Scrub before truncation, so a cut value cannot escape a full-value match. */
export function scrub(value: string): string {
 if (value.length > 16_384) return 'Error message exceeds limit';
 return value
  .replace(/\b[a-z][a-z\d+.-]*:\/\/[^\s)\]}>]+/gi, '[redacted]')
  .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[redacted]')
  .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '[redacted]')
  .replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '[redacted]')
  .replace(/(?:[a-f0-9]{0,4}:){2,}[a-f0-9]{0,4}/gi, '[redacted]')
  .replace(/(["'`])[^"'`\r\n]*\1/g, '[redacted]')
  .replace(/\b(?:bearer\s+\S+|(?:token|password|secret|authorization|api[_-]?key|access[_-]?token|refresh[_-]?token)\s*[:=]\s*\S+)/gi, '[redacted]')
  .replace(/\b(?:sb_(?:secret|publishable)_[A-Za-z0-9_-]+|(?:sk|ghp|gho)_[A-Za-z0-9_-]+|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)\b/g, '[redacted]')
  .replace(/[A-Za-z0-9_+\/-]{32,}={0,2}/g, '[redacted]')
  .replace(/\b[0-9a-f]{16,}\b/gi, '[redacted]')
  .replace(/\/[\w%/.-]+[?#][^\s)\]}>]*/g, '[redacted]')
  .replace(/\b[prnbqkpalgmso1-8]+(?:\/[prnbqkpalgmso1-8]+){7}\b/gi, '[redacted]')
  .replace(/\b(?:[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?[+#]?)\b/g, '[redacted]')
  .replace(/\b(?:[KQRBNPALGMSO]?[a-h][1-8][-x]?[a-h][1-8][^\s,;]*|O-O(?:-O)?)\b/g, '[redacted]')
  .replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, 300);
}

export function errorName(value: unknown): string {
 return typeof value === 'string' && (ERROR_NAMES as readonly string[]).includes(value) ? value : 'Error';
}

/** Keep fixed path words only. Every other segment is an ID. No query or fragment. */
export function errorRoute(path: string): string {
 const words = new Set(['play', 'profile', 'settings', 'g', 'j', 'api', 'games', 'me', 'status', 'client-errors', 'seen', 'commands', 'preview', 'invite', 'invites', 'redeem', 'lobby', 'find', 'accept', 'cancel', 'handle', 'deletion', 'notifications', 'relations', 'reports', 'record', 'blocks']);
 const parts = path.split(/[?#]/, 1)[0].split('/').filter(Boolean).slice(0, 8);
 return '/' + parts.map((part, i) => words.has(part) && !(i > 0 && ['g', 'games'].includes(parts[i - 1]) && !['find'].includes(part)) ? part : parts[i - 1] === 'g' || parts[i - 1] === 'play' || parts[i - 1] === 'games' ? ':game' : ':id').join('/');
}

/** Send locations only, with no function names, origins or URL parameters. */
export function browserFrames(stack: string, origin: string): string[] {
 const frames: string[] = [];
 for (const match of stack.slice(0, 32_768).matchAll(/https?:\/\/[^\s()]+?:\d+:\d+/g)) {
  const location = /^(.*):(\d+):(\d+)$/.exec(match[0])!;
  try {
   const url = new URL(location[1]);
   const frame = `${url.pathname}:${location[2]}:${location[3]}`;
   if (url.origin === origin && BUNDLE_FRAME.test(frame)) frames.push(frame);
  } catch { /* An invalid location is not a frame. */ }
  if (frames.length === 10) break;
 }
 return frames;
}

export function browserFamily(ua: string): string {
 for (const [name, pattern] of [
  ['Edge', /(?:Edg|EdgA|EdgiOS)\/(\d+)/], ['Opera', /(?:OPR|OPiOS)\/(\d+)/],
  ['Firefox', /(?:Firefox|FxiOS)\/(\d+)/], ['Chrome', /(?:Chrome|CriOS)\/(\d+)/],
  ['Safari', /Version\/(\d+).*Safari\//],
 ] as const) {
  const version = pattern.exec(ua)?.[1];
  if (version && version.length <= 3) return `${name} ${Number(version)}`;
 }
 return 'Other';
}

/** FNV-1a 64-bit groups the scrubbed message pattern and first location. */
export function errorFingerprint(name: string, message: string, top: string): string {
 let hash = 0xcbf29ce484222325n;
 for (const c of `${name}\n${message.replace(/\b\d+\b/g, ':n')}\n${top}`) hash = BigInt.asUintN(64, (hash ^ BigInt(c.codePointAt(0)!)) * 0x100000001b3n);
 return hash.toString(16).padStart(16, '0');
}
