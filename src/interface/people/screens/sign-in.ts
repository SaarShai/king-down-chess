/**
 * The sign-in sheet (account spec S1), the email code (S2), the name sheet (S3) and the sheet "Sign-in does not work
 * now" (S11), in the design project's `runs/account/account-spec.md`. The host gives the sign-in service
 * and the server; the sheet changes no data itself. After sign-in the task goes on by itself (`done`).
 */
import { button, setButtonState } from '../../ui/kit.js';
import { WAYS, recoveryText, signInText, type Way } from './copy';
import { freeName, readyName, saveName, type ReadyName } from './names';
import { emailProblem } from './problems';
import { node, picture, say, statusLine, type PeopleSheet } from './sheet';

export type { Way };
export interface SignInHost {
  pictureFor?(name: string): HTMLElement;
  /** The ways that the sign-in service reports as on (`availableProviders`). */
  ways(): Promise<Way[]>;
  /** A service way: the page leaves for the service and returns. */
  start(way: Exclude<Way, 'email'>): Promise<void>;
  sendCode(email: string): Promise<void>;
  verifyCode(email: string, code: string): Promise<void>;
  /** True when the name is free (`POST /api/me/handle` with `check`). */
  checkName(handle: string): Promise<boolean>;
  saveName(name: ReadyName): Promise<void>;
  /** The name and picture editor (S4, not in this stage). */
  changeName?(): void;
  playComputer(): void;
  /** The tab's storage for the email step (`sessionStorage`). */
  storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
  online?: () => boolean;
  random?: () => number;
  now?: () => number;
}
export type Purpose = { kind: 'person' } | { kind: 'join'; inviter: string | null } | { kind: 'again' };
/** What the sheet says first when the player returns from a service: no sign-in, more than 10 minutes, a suspended account. */
export type ReturnNote = 'retry' | 'expired' | 'suspended';

/** The old form's key and shape (`src/account/email-code.ts`), so a reload on either page keeps the code step for 1 hour. */
export const EMAIL_STEP_KEY = 'kingdown.email-code', CODE_LIFE_MS = 3_600_000;
export function rememberedEmail(storage: SignInHost['storage'], now = Date.now()): string {
  try {
    const step = JSON.parse(storage?.getItem(EMAIL_STEP_KEY) ?? 'null');
    return typeof step?.address === 'string' && typeof step.at === 'number' && now - step.at >= 0 && now - step.at < CODE_LIFE_MS ? step.address : '';
  } catch { return ''; }
}
const remember = (storage: SignInHost['storage'], address: string, at: number) => { try { storage?.setItem(EMAIL_STEP_KEY, JSON.stringify({ address, at })); } catch { /* storage blocked: the step lasts until a reload */ } };
const forget = (storage: SignInHost['storage']) => { try { storage?.removeItem(EMAIL_STEP_KEY); } catch { /* storage blocked */ } };

const titleOf = (purpose: Purpose) => purpose.kind === 'person' ? signInText.person : purpose.kind === 'join' ? signInText.join(purpose.inviter) : signInText.again;
/** A third action: text on the sheet, 44 px high. */
export function plain(label: string, onPress: () => void) { const control = button(label, { onPress }); control.classList.add('people-plain'); return control; }

function field(label: string, input: HTMLInputElement) {
  const wrap = node('label', 'people-field'); wrap.append(node('span', '', label), input); return wrap;
}
/** One form for one field: Enter and the main button use the same product validation. */
function form(parts: HTMLElement[], submit: () => void) {
  const element = node('form', 'people-form'); element.noValidate = true; element.append(...parts);
  element.addEventListener('submit', event => { event.preventDefault(); submit(); });
  return element;
}

/** S1: the sign-in ways, then `done` after a sign-in in this page (the email code). A service way leaves the page. */
export function signInSheet(sheet: PeopleSheet, host: SignInHost, purpose: Purpose, done: () => void, note?: ReturnNote) {
  const now = host.now ?? Date.now;
  const remembered = rememberedEmail(host.storage, now());
  if (remembered) return codeStep(sheet, host, purpose, done, remembered);
  const status = statusLine(), list = node('div', 'people-ways');
  // The links have their own line: with 44 px targets, a link that wraps inside the sentence leaves a gap.
  const small = node('p', 'people-small', signInText.private), legal = node('p', 'people-small people-legal');
  const privacy = node('a', '', signInText.privacy), terms = node('a', '', signInText.terms);
  privacy.href = '/privacy.html'; terms.href = '/terms.html'; privacy.target = terms.target = '_blank';
  legal.append(privacy, ' · ', terms);
  if (note) say(status, signInText[note]);
  let timer: ReturnType<typeof setTimeout>;
  // Open with the complete list. A late answer cannot put a sign-in way under Not now.
  void Promise.race([host.ways(), new Promise<Way[]>((_, reject) => { timer = setTimeout(() => reject(new Error('Sign-in ways time out.')), 1500); })]).then(reported => {
    const ways = WAYS.filter(way => reported.includes(way));
    if (!ways.length) throw new Error('No sign-in way is on.');
    list.replaceChildren(...ways.map(way => {
      const control: HTMLButtonElement = button(signInText.way(way), { onPress: () => {
        if (way === 'email') { emailStep(sheet, host, purpose, done); return; }
        setButtonState(control, { busy: true, label: signInText.opening(way) }); say(status);
        host.start(way).then(() => { if (sheet.isOpen) done(); }, (error: unknown) => {
          if (!sheet.isOpen) return;
          setButtonState(control, { label: signInText.way(way) });
          const code = (error as { code?: unknown })?.code;
          say(status, code === 'CANCELED' ? '' : code === 'user_banned' ? signInText.suspended : signInText.noReach);
        });
      } });
      if (way === 'apple') control.classList.add('apple-sign-in');
      return control;
    }));
    sheet.show({ title: titleOf(purpose), body: [node('p', '', purpose.kind === 'again' ? signInText.againLine : signInText.line), status, list, plain(signInText.notNow, () => sheet.close()), small, legal] });
  }).catch(() => serviceDown(sheet, host, () => signInSheet(sheet, host, purpose, done))).finally(() => clearTimeout(timer));
}

/** S11: the ways do not load. The sheet offers the computer, another try and Cancel. */
export function serviceDown(sheet: PeopleSheet, host: SignInHost, retry: () => void) {
  const offline = host.online ? !host.online() : !navigator.onLine;
  sheet.show({ title: recoveryText.downTitle, body: [node('p', '', offline ? recoveryText.offline : recoveryText.downLine),
    button(recoveryText.computer, { kind: 'main', onPress: () => { sheet.close(); host.playComputer(); } }),
    button(recoveryText.tryAgain, { onPress: retry }), plain(recoveryText.cancel, () => sheet.close())] });
}

/** S2, step 1: the address. */
function emailStep(sheet: PeopleSheet, host: SignInHost, purpose: Purpose, done: () => void, address = '') {
  const status = statusLine(), input = node('input');
  input.type = 'email'; input.name = 'email'; input.autocomplete = 'email'; input.required = true; input.value = address;
  input.setAttribute('aria-describedby', status.id);
  const send: HTMLButtonElement = button(signInText.sendCode, { kind: 'main', onPress: () => element.requestSubmit() });
  const element = form([field(signInText.email, input), status, send], async () => {
    if (send.getAttribute('aria-busy') === 'true') return;
    const value = input.value.trim();
    input.value = value;
    if (!input.validity.valid) { say(status, signInText.badAddress); input.focus(); return; }
    setButtonState(send, { busy: true }); say(status);
    try { await host.sendCode(value); if (!sheet.isOpen) return; remember(host.storage, value, (host.now ?? Date.now)()); codeStep(sheet, host, purpose, done, value); }
    catch (error) { if (!sheet.isOpen) return; setButtonState(send, {}); say(status, emailProblem(error, true)); input.focus(); }
  });
  sheet.show({ title: signInText.emailTitle, body: [node('p', '', signInText.emailLine), element], back: () => signInSheet(sheet, host, purpose, done) });
  input.focus();
}

/** S2, step 2: the code. Supabase sets its length (6 to 10 digits, decision 109). The phone can fill the field from the mail (`one-time-code`). */
function codeStep(sheet: PeopleSheet, host: SignInHost, purpose: Purpose, done: () => void, address: string) {
  const status = statusLine(), input = node('input');
  input.name = 'code'; input.inputMode = 'numeric'; input.autocomplete = 'one-time-code'; input.required = true;
  input.pattern = '[0-9]{6,10}'; input.className = 'people-code'; input.setAttribute('aria-describedby', status.id);
  input.addEventListener('input', () => { input.value = input.value.replace(/\D/g, '').slice(0, 10); });
  const go: HTMLButtonElement = button(signInText.continue, { kind: 'main', onPress: () => element.requestSubmit() });
  const again: HTMLButtonElement = plain(signInText.newCode, async () => {
    if (again.getAttribute('aria-busy') === 'true') return;
    setButtonState(again, { busy: true }); say(status);
    try { await host.sendCode(address); if (!sheet.isOpen) return; remember(host.storage, address, (host.now ?? Date.now)()); codeStep(sheet, host, purpose, done, address); }
    catch (error) { if (!sheet.isOpen) return; setButtonState(again, {}); say(status, emailProblem(error, true)); }
  });
  const element = form([field(signInText.code, input), status, go], async () => {
    if (go.getAttribute('aria-busy') === 'true') return;
    if (!input.validity.valid) { say(status, signInText.badCode); input.focus(); return; }
    setButtonState(go, { busy: true }); say(status);
    try { await host.verifyCode(address, input.value.trim()); if (!sheet.isOpen) return; forget(host.storage); done(); }
    catch (error) { if (!sheet.isOpen) return; setButtonState(go, {}); say(status, emailProblem(error, false)); input.focus(); }
  });
  sheet.show({ title: signInText.codeTitle, body: [node('p', '', signInText.codeLine(address)), element, again],
    back: () => { forget(host.storage); emailStep(sheet, host, purpose, done, address); } });
  input.focus();
}

/** S3: the ready name and picture. The main button waits until the check says that the name is free. */
export function nameSheet(sheet: PeopleSheet, host: SignInHost, done: (name: ReadyName) => void) {
  const random = host.random ?? Math.random;
  let name = readyName(random);
  const status = statusLine(), image = host.pictureFor?.(name.handle) ?? picture(name.icon, 'large'), label = node('strong', 'people-name', name.handle);
  const main: HTMLButtonElement = button(signInText.checkingName, { kind: 'main', onPress: async () => {
    if (main.getAttribute('aria-busy') === 'true') return;
    setButtonState(main, { busy: true }); say(status);
    try { name = await saveName(next => host.saveName(next), name, random); }
    catch { if (!sheet.isOpen) return; show(); setButtonState(main, {}); say(status, signInText.nameFailed); return; }
    if (sheet.isOpen) done(name);
  } });
  const show = () => { who.style.visibility = 'visible'; if (image instanceof HTMLImageElement) image.src = picture(name.icon).src; label.textContent = name.handle; setButtonState(main, { label: signInText.playAs(name.handle) }); };
  setButtonState(main, { busy: true });
  main.querySelector('.kd-reason')?.classList.add('kd-sr');
  const who = node('div', 'people-who'); who.append(image, label); who.style.visibility = 'hidden';
  sheet.show({ title: signInText.nameTitle, body: [who, node('p', '', host.changeName ? signInText.nameLine : 'Other players see this name.'), status, main, ...(host.changeName ? [plain(signInText.change, () => host.changeName!())] : [])] });
  void freeName(handle => host.checkName(handle), random, name).then(free => { if (!sheet.isOpen) return; name = free; show(); });
}
