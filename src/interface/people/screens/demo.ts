/**
 * The test page of the people screens (`people.html`, docs/specs/people-screens). Each state has an address:
 * `people.html#<state>`. A fixture stands in for the server and the sign-in service: the page signs in nowhere and
 * calls no server. `window.peopleDemo` gives the calls and the faults to the browser checks.
 */
import '../../ui/tokens.css';
import '../../ui/components.css';
import type { Icon } from '../../../account/profile';
import type { JoinPreview } from '../../../match/protocol';
import { INVITE_NOTICES } from '../../../match/invite-notices';
import { OnlineError } from '../../../online/client';
import { button } from '../../ui/kit.js';
import { recoveryText, type Way } from './copy';
import { landingPage, type LandingHost } from './landing';
import { nameSearch, personSheet, playPerson, type PersonHost, type Recent, type Rules } from './person';
import { recoveryPanel, signInAgain } from './recovery';
import { node, peopleSheet } from './sheet';
import { nameSheet, serviceDown, signInSheet, EMAIL_STEP_KEY } from './sign-in';

type Fault = { code: string; status: number; message?: string } | 'network' | 'banned';
const calls: string[] = [], faults = new Map<string, Fault[]>(), copied: string[] = [], shared: ShareData[] = [], toasts: string[] = [];
const query = new URLSearchParams(location.search);
const slow = Number(query.get('wait') ?? 300);
const wait = (ms = slow) => new Promise(done => setTimeout(done, ms));
let seed = 7;
const random = () => (seed = seed * 16807 % 2147483647) / 2147483647;
const DAY = 86_400_000, now = Date.parse('2026-11-14T12:00:00Z');
const TOKEN = 'k'.repeat(43), LINK = `${location.origin}/j#${TOKEN}`;
let me: { handle: string | null; icon: Icon | null } | null = { handle: 'alex', icon: 'frost' };
let rules: Rules = 'pieces';
const taken = new Set(['quiet-flame-36']);
const players = ['dana-r', 'danny-k', 'noor-k', 'eli-stone', 'ezra-m'].map((handle, i) => ({ handle, icon: (['frost', 'flame', 'shadow', 'ogre', 'knight'] as Icon[])[i] }));
let recent: Recent[] = [
  { handle: 'dana-r', icon: 'frost', result: 'won', at: new Date(now - 2 * DAY).toISOString() },
  { handle: 'noor-k', icon: 'flame', result: 'drawn', at: new Date(now - 6 * DAY).toISOString() },
  { handle: 'eli-stone', icon: 'shadow', result: 'lost', at: new Date(now - 20 * DAY).toISOString() },
  { handle: 'ezra-m', icon: 'knight', result: 'won', at: new Date(now - 40 * DAY).toISOString() },
];

/** One fixture call: it logs, waits, and throws a fault from the queue. */
async function call<T>(name: string, answer: () => T, ms = slow): Promise<T> {
  calls.push(name); await wait(ms);
  const fault = faults.get(name)?.shift();
  if (fault === 'network') throw new TypeError('Failed to fetch');
  if (fault === 'banned') throw Object.assign(new Error('banned'), { status: 403, code: 'user_banned' });
  if (fault) throw fault.code.startsWith('auth:') ? Object.assign(new Error(fault.code), { status: fault.status }) : new OnlineError(fault.code as never, fault.status, fault.message ?? `Fixture ${fault.code}`);
  return answer();
}
const preview = (handle: string, icon: Icon): JoinPreview => ({ code: 'ABCDEF', options: { kingPowers: false, cards: false } as JoinPreview['options'], colour: 'black', kind: 'friend', creator: { handle, icon }, expires_at: new Date(now + 6 * DAY).toISOString() });

const live = node('p', 'demo-toast'); live.setAttribute('role', 'status'); live.hidden = true;
function toast(text: string) { toasts.push(text); live.textContent = text; live.hidden = false; }
const host: PersonHost & LandingHost = {
  me: () => me,
  get rules() { return rules; }, setRules: value => { rules = value; calls.push(`rules:${value}`); },
  ways: () => call<Way[]>('ways', () => (query.get('ways') ?? 'email,github,google,facebook').split(',') as Way[], 150),
  start: way => call(`start:${way}`, () => { me = { handle: null, icon: null }; }),
  sendCode: email => call(`sendCode:${email}`, () => undefined),
  verifyCode: (email, code) => call(`verifyCode:${code}`, () => { if (code !== '123456') throw Object.assign(new Error('bad code'), { status: 400 }); me = { handle: null, icon: null }; void email; }),
  checkName: handle => call(`checkName:${handle}`, () => !taken.has(handle), 100),
  saveName: name => call(`saveName:${name.handle}`, () => { me = { handle: name.handle, icon: name.icon }; }),
  changeName: () => toast('The name editor (S4) opens here. It is not in this stage.'),
  playComputer: () => { calls.push('playComputer'); toast('Play the computer opens here.'); },
  recent: () => call('recent', () => recent, 100),
  known: () => call('known', () => players.slice(0, 3), 100),
  find: text => call(`find:${text}`, () => { const found = players.filter(p => p.handle.startsWith(text)); if (!found.length) throw new OnlineError('NOT_FOUND', 404, INVITE_NOTICES.notFound); return found; }, 100),
  createLink: value => call(`createLink:${value}`, () => LINK, Number(query.get('make') ?? 600)),
  invite: (handle, value) => call(`invite:${handle}:${value}`, () => undefined),
  toast,
  copy: async text => { copied.push(text); return query.get('copy') !== 'fail'; },
  ...(query.has('touch') && { coarse: true, share: async (data: ShareData) => { shared.push(data); if (query.get('share') === 'cancel') throw new DOMException('Share canceled', 'AbortError'); } }),
  storage: sessionStorage, random, now: () => now,
  preview: () => call('preview', () => { if (!me) throw new OnlineError('UNAUTHENTICATED', 401, 'Sign in to play online'); return preview(state === 'landing-own' ? 'alex' : 'jo-m', 'flame'); }),
  join: () => call('join', () => { root.replaceChildren(node('h1', '', 'Joined'), node('p', '', 'The board opens here. The join of the parts wires the game screen.')); }),
  inviteBack: handle => call(`inviteBack:${handle}`, () => undefined),
  toPlay: () => { calls.push('toPlay'); location.hash = ''; },
  href: LINK,
};
Object.assign(window, { peopleDemo: { calls, faults, copied, shared, toasts, fail: (name: string, ...list: Fault[]) => faults.set(name, [...(faults.get(name) ?? []), ...list]), host } });

const root = document.querySelector<HTMLElement>('#people-demo')!;
let state = '';
const STATES: Record<string, () => void> = {
  'person': () => open(row => playPerson(host, row)),
  'person-new': () => { recent = []; open(row => playPerson(host, row)); },
  'person-signed-out': () => { me = null; open(row => playPerson(host, row)); },
  'person-no-name': () => { me = { handle: null, icon: null }; open(row => playPerson(host, row)); },
  'by-name': () => open(row => { const sheet = peopleSheet(row); nameSearch(sheet, host, rules, () => personSheet(sheet, host)); }),
  'sign-in': () => { me = null; open(row => signInSheet(peopleSheet(row), host, { kind: 'person' }, () => toast('Signed in.'))); },
  'sign-in-retry': () => { me = null; open(row => signInSheet(peopleSheet(row), host, { kind: 'person' }, () => toast('Signed in.'), 'retry')); },
  'sign-in-expired': () => { me = null; open(row => signInSheet(peopleSheet(row), host, { kind: 'person' }, () => toast('Signed in.'), 'expired')); },
  'sign-in-down': () => { me = null; open(row => serviceDown(peopleSheet(row), host, () => toast('Try again.'))); },
  'code': () => { me = null; sessionStorage.setItem(EMAIL_STEP_KEY, JSON.stringify({ address: 'jo@example.com', at: now - 60_000 })); open(row => signInSheet(peopleSheet(row), host, { kind: 'person' }, () => toast('Signed in.'))); },
  'name': () => { me = { handle: null, icon: null }; open(row => nameSheet(peopleSheet(row), host, name => toast(`Saved ${name.handle}.`))); },
  'again': () => open(row => signInAgain(host, () => toast(recoveryText.signedIn), row)),
  'landing-valid': () => landing(TOKEN),
  'landing-plain': () => { me = null; landing(TOKEN); },
  'landing-own': () => landing(TOKEN),
  'landing-ended': () => { faults.set('preview', [{ code: 'INVITE_UNAVAILABLE', status: 409, message: INVITE_NOTICES.expired }]); landing(TOKEN); },
  'landing-ended-known': () => { faults.set('join', [{ code: 'INVITE_UNAVAILABLE', status: 409, message: INVITE_NOTICES.closed }]); landing(TOKEN); },
  'landing-limit': () => { faults.set('join', [{ code: 'FRIEND_GAME_LIMIT', status: 409, message: INVITE_NOTICES.gameLimit(5, 'jo-m', true) }]); landing(TOKEN); },
  'landing-blocked': () => { faults.set('preview', [{ code: 'INVITE_UNAVAILABLE', status: 404, message: INVITE_NOTICES.unavailable }]); landing(TOKEN); },
  'landing-bad': () => landing('ABCDEF'),
  'landing-service': () => { faults.set('preview', ['network']); landing(TOKEN); },
  'account': () => panel(recoveryPanel('account', { toPlay: host.toPlay, switchAccount: () => toast('Signed out. The sign-in sheet opens here.'), retry: () => {} }, 'alex')),
  'gone': () => panel(recoveryPanel('gone', { toPlay: host.toPlay, switchAccount: () => {}, retry: () => {} })),
  'down': () => panel(recoveryPanel('down', { toPlay: host.toPlay, switchAccount: () => {}, retry: () => toast('The game reads again.') })),
};
/** A stand-in for Play: the row that opens the sheet. */
function open(start: (row: HTMLElement) => void) {
  const row: HTMLButtonElement = button('Play a person', { onPress: () => start(row) });
  row.dataset.demoOpen = '';
  root.replaceChildren(node('h1', '', 'King Down'), node('p', 'people-muted', 'Test page: the Play screen is not part of this stage.'), row, live);
  start(row);
}
function landing(fragment: string) { root.replaceChildren(landingPage(host, fragment), live); }
function panel(element: HTMLElement) { root.replaceChildren(element, live); }
function index() {
  const list = node('ul', 'demo-states');
  for (const name of Object.keys(STATES)) { const item = node('li'), link = node('a', '', name); link.href = `#${name}`; item.append(link); list.append(item); }
  root.replaceChildren(node('h1', '', 'People screens'), node('p', 'people-muted', 'Test page of stage people2. A fixture answers; nothing leaves this page.'), list, live);
}
function route() {
  document.querySelectorAll('dialog').forEach(dialog => dialog.remove());
  state = location.hash.slice(1); live.hidden = true;
  (STATES[state] ?? index)();
}
addEventListener('hashchange', route);
route();
