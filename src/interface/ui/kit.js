// @ts-check
/** King Down UI. Native DOM, no dependency, no game or network state. */
let nextId = 0;
const id = (prefix = 'kd') => `${prefix}-${++nextId}`;

/** @param {string} tag @param {string} [className] @param {string} [text] */
function el(tag, className = '', text = '') {
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = text;
  return node;
}
/** @param {string} value @param {string} name */
function required(value, name) {
  if (!value?.trim()) throw new TypeError(`${name} needs visible text.`);
  return value;
}
/** @param {HTMLElement} node @param {string} type @param {unknown} detail */
function emit(node, type, detail) {
  node.dispatchEvent(new CustomEvent(type, { bubbles: true, detail }));
}
/** Move focus on route entry, or after the focused content is removed.
 * @param {HTMLElement} target */
export function focusEntry(target) {
  if (!target.matches('button, a[href], input, select, summary, [tabindex]')) target.tabIndex = -1;
  target.focus();
}
/** @param {HTMLElement|null} source @param {HTMLElement} fallback */
export function restoreFocus(source, fallback) {
  focusEntry(source?.isConnected && !source.closest('[hidden], [inert]') ? source : fallback);
}
/** @param {'back'|'close'|'play'|'learn'|'you'|'check'|'next'|'more'|'undo'|'down'} name */
export function icon(name) {
  const paths = {
    back: 'M15 5l-7 7 7 7M8 12h13', close: 'M6 6l12 12M18 6L6 18',
    play: 'M7 4l13 8-13 8z', learn: 'M3 4h7l2 2 2-2h7v15h-7l-2 2-2-2H3zM12 6v15',
    you: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M4 21v-3a8 6 0 0 1 16 0v3',
    check: 'M4 12l5 5L20 6', next: 'M9 5l7 7-7 7',
    more: 'M5 12h.01M12 12h.01M19 12h.01', undo: 'M9 14L4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11', down: 'M5 9l7 7 7-7'
  };
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('class', 'kd-icon');
  svg.dataset.icon = name;
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(svg.namespaceURI, 'path');
  path.setAttribute('d', paths[name]);
  svg.append(path);
  return svg;
}
/** @typedef {{kind?: 'main'|'quiet'|'danger', icon?: Parameters<typeof icon>[0], iconOnly?: boolean, pressed?: boolean, disabledReason?: string, busy?: boolean, onPress?: (event: MouseEvent) => void}} ButtonOptions */
/** A disabled button stays focusable. Its reason stays visible.
 * @param {string} label @param {ButtonOptions} [options] */
export function button(label, options = {}) {
  required(label, 'Button');
  const node = document.createElement('button');
  node.type = 'button';
  node.className = 'kd-button';
  node.dataset.kind = options.kind || 'quiet';
  const title = el('span', options.iconOnly ? 'kd-sr' : '', label);
  title.dataset.buttonLabel = '';
  if (options.icon) node.append(icon(options.icon));
  if (options.iconOnly) {
    if (!options.icon) throw new TypeError('An icon-only button needs an icon.');
    node.classList.add('kd-icon-button');
  }
  node.append(title);
  if (options.pressed !== undefined) node.setAttribute('aria-pressed', String(options.pressed));
  node.addEventListener('click', event => {
    if (node.getAttribute('aria-disabled') === 'true') { event.preventDefault(); event.stopImmediatePropagation(); }
  }, true);
  if (options.onPress) node.addEventListener('click', options.onPress);
  setButtonState(node, { reason: options.disabledReason, busy: options.busy });
  return node;
}
/** The plain X of Close and Cancel at the corner of a surface (owner playtest section 4): no raised shape, a 44 px target, a specific name. @param {string} label @param {() => void} [onPress] */
export function closeX(label, onPress) {
  return asCloseX(button(label, { onPress }), label);
}
/** Keep an existing close handler and give its control the kit's plain X. @param {HTMLButtonElement} node @param {string} label */
export function asCloseX(node, label) {
  node.classList.add('kd-x', 'kd-icon-button');
  node.querySelector('[data-button-label]')?.classList.add('kd-sr');
  node.setAttribute('aria-label', required(label, 'Close control'));
  if (!node.querySelector('[data-icon="close"]')) node.prepend(icon('close'));
  return node;
}
/** @param {HTMLButtonElement} node @param {{reason?: string, busy?: boolean, label?: string}} state */
export function setButtonState(node, { reason = '', busy = false, label }) {
  node.setAttribute('aria-disabled', String(Boolean(reason || busy)));
  node.setAttribute('aria-busy', String(busy));
  const title = node.querySelector('[data-button-label]');
  if (label && title) title.textContent = label;
  let note = node.querySelector('.kd-reason');
  if (reason || busy) {
    if (!note) {
      note = el('span', 'kd-reason');
      note.id = id('reason');
      node.append(note);
      node.setAttribute('aria-describedby', note.id);
    }
    note.textContent = reason || 'Please wait.';
  } else {
    note?.remove();
    node.removeAttribute('aria-describedby');
  }
}
/** @param {'Play'|'Learn'|'Guide'|'You'} current @param {(name: string) => void} onNavigate @param {{guide?: boolean}} [options] */
export function navigation(current, onNavigate, options = {}) {
  const nav = el('nav', 'kd-nav');
  nav.setAttribute('aria-label', 'Main');
  for (const name of /** @type {const} */ (['Play', options.guide ? 'Guide' : 'Learn', 'You'])) {
    const a = document.createElement('a');
    a.href = `#${name.toLowerCase()}`;
    a.append(icon(/** @type {'play'|'learn'|'you'} */ (name === 'Guide' ? 'learn' : name.toLowerCase())), el('span', '', name));
    if (name === current) a.setAttribute('aria-current', 'page');
    a.addEventListener('click', e => { e.preventDefault(); onNavigate(name); });
    nav.append(a);
  }
  return nav;
}
/** @param {string} title @param {() => void} onBack */
export function screenHeader(title, onBack) {
  const node = el('header', 'kd-header');
  node.append(button('Back', { icon: 'back', onPress: onBack }), el('h2', '', required(title, 'Header')));
  return node;
}
/** @param {string} text @param {'time'|'check'|'effect'|'success'} [kind] */
export function pill(text, kind = 'time') {
  const node = el('span', 'kd-pill', required(text, 'Pill'));
  node.dataset.kind = kind;
  return node;
}
/** @param {string} src */
function portrait(src) {
  const image = document.createElement('img');
  image.className = 'kd-portrait'; image.src = src; image.alt = '';
  return image;
}
/** @param {{opponent: string, king: string, portrait: string, state: 'Your turn'|'Waiting', time: string, onOpen: () => void}} data */
export function gameRow(data) {
  const row = button(`Continue game with ${data.opponent}`, { onPress: data.onOpen });
  row.className = 'kd-game-row'; row.replaceChildren();
  const copy = el('span', 'kd-game-copy');
  const pills = el('span', 'kd-pills');
  pills.append(pill(data.state, data.state === 'Your turn' ? 'success' : 'time'), pill(data.time));
  copy.append(el('strong', '', data.opponent), el('span', 'kd-muted', data.king), pills);
  row.append(portrait(data.portrait), copy, icon('next'));
  row.setAttribute('aria-label', `Continue game with ${data.opponent}. ${data.king}. ${data.state}. ${data.time}.`);
  return row;
}
/** @typedef {{value: string, label: string, description?: string}} Choice */
/** Native buttons form one radio tab stop. Arrows select at once, including in RTL.
 * @param {string} label @param {Choice[]} choices @param {string} value @param {'segments'|'cards'} [style] */
export function choiceGroup(label, choices, value, style = 'segments') {
  if (!choices.length || !choices.some(c => c.value === value)) throw new TypeError('Select one existing choice.');
  const group = document.createElement('fieldset'); group.className = 'kd-group';
  const legend = document.createElement('legend'); legend.textContent = required(label, 'Choice group'); legend.id = id('choice');
  const list = el('div', style === 'segments' ? 'kd-segments' : 'kd-choices');
  list.setAttribute('role', 'radiogroup'); list.setAttribute('aria-labelledby', legend.id);
  /** @type {HTMLButtonElement[]} */ const controls = [];
  const choose = (/** @type {number} */ index) => {
    controls.forEach((control, i) => { control.setAttribute('aria-checked', String(i === index)); control.tabIndex = i === index ? 0 : -1; });
    const previous = choices.findIndex(choice => choice.value === value);
    value = choices[index].value;
    emit(group, 'kd-change', { value, previous });
  };
  choices.forEach((choice, index) => {
    const control = button(choice.label);
    control.className = style === 'segments' ? 'kd-segment' : 'kd-choice';
    control.setAttribute('role', 'radio'); control.setAttribute('aria-checked', String(choice.value === value));
    control.tabIndex = choice.value === value ? 0 : -1;
    if (style === 'cards') {
      const copy = el('span', 'kd-choice-copy'); copy.append(el('strong', '', choice.label));
      if (choice.description) copy.append(el('span', '', choice.description));
      const mark = el('span', 'kd-choice-mark'); mark.setAttribute('aria-hidden', 'true');
      control.replaceChildren(copy, mark);
    }
    control.addEventListener('click', () => choose(index));
    control.addEventListener('keydown', e => {
      const rtl = getComputedStyle(list).direction === 'rtl';
      const delta = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : e.key === 'ArrowRight' ? (rtl ? -1 : 1) : e.key === 'ArrowLeft' ? (rtl ? 1 : -1) : 0;
      if (!delta && e.key !== 'Home' && e.key !== 'End') return;
      e.preventDefault();
      const next = e.key === 'Home' ? 0 : e.key === 'End' ? choices.length - 1 : (index + delta + choices.length) % choices.length;
      choose(next); controls[next].focus();
    });
    controls.push(control); list.append(control);
  });
  group.append(legend, list);
  return group;
}
/** @param {string} label @param {string} description @param {boolean} checked */
export function switchRow(label, description, checked) {
  const control = button(label); control.className = 'kd-switch';
  control.setAttribute('role', 'switch'); control.setAttribute('aria-checked', String(checked));
  const copy = el('span', 'kd-switch-copy');
  const title = el('strong', '', required(label, 'Switch')); title.id = id('switch');
  copy.append(title);
  // An empty description adds no note (launch decision 24: a short switch row).
  if (description) { const note = el('span', 'kd-muted', description); note.id = id('switch-note'); copy.append(note); control.setAttribute('aria-describedby', note.id); }
  // The state as a word and as a track with a knob: the colour is not the only sign.
  const indicator = el('span', 'kd-switch-indicator'), state = el('span', 'kd-switch-state', checked ? 'On' : 'Off'), track = el('span', 'kd-switch-track');
  track.append(el('span', 'kd-switch-knob')); indicator.append(state, track); indicator.setAttribute('aria-hidden', 'true');
  control.replaceChildren(copy, indicator);
  control.setAttribute('aria-labelledby', title.id);
  control.addEventListener('click', () => {
    checked = !checked;
    control.setAttribute('aria-checked', String(checked)); state.textContent = checked ? 'On' : 'Off';
    emit(control, 'kd-change', { checked });
  });
  return control;
}
/** Persistent live region. Mount before announcing. Never steals focus. */
export function liveRegion() {
  const element = el('div', 'kd-sr'); element.setAttribute('role', 'status'); element.setAttribute('aria-live', 'polite'); element.setAttribute('aria-atomic', 'true');
  return { element, announce(/** @type {string} */ text) { element.textContent = text; }, clear() { element.textContent = ''; } };
}
/** No timeout: messages stay until replaced or closed. Clear on route change.
 * @param {ReturnType<typeof liveRegion>} live @param {HTMLElement} fallback */
export function toast(live, fallback) {
  const element = el('div', 'kd-toast'); element.hidden = true;
  const message = el('p');
  const close = closeX('Close notice', () => {
    element.hidden = true; live.clear(); document.removeEventListener('keydown', escape, true); focusEntry(fallback);
  });
  const escape = (/** @type {KeyboardEvent} */ event) => { if (event.key === 'Escape' && !element.hidden && !document.querySelector('dialog[open]')) { event.preventDefault(); event.stopImmediatePropagation(); close.click(); } };
  element.append(message, close);
  return { element, show(/** @type {string} */ text) { message.textContent = required(text, 'Toast'); element.hidden = false; live.announce(text); document.addEventListener('keydown', escape, true); }, clear() {
    const focused = element.contains(document.activeElement); element.hidden = true; live.clear(); document.removeEventListener('keydown', escape, true); if (focused) focusEntry(fallback);
  } };
}
/** Non-modal sheet. Put it in .kd-game-dock, never in the board.
 * @param {string} title @param {HTMLElement} content @param {HTMLElement} fallback */
export function sheet(title, content, fallback) {
  const element = el('section', 'kd-sheet'); element.id = id('sheet'); element.hidden = true;
  const heading = el('h2', '', required(title, 'Sheet')); heading.id = id('sheet-title'); heading.tabIndex = -1;
  element.setAttribute('aria-labelledby', heading.id);
  /** @type {HTMLElement|null} */ let opener = null;
  const close = () => {
    if (element.hidden) return;
    element.hidden = true; opener?.setAttribute('aria-expanded', 'false');
    document.removeEventListener('keydown', escape, true); restoreFocus(opener, fallback);
    emit(element, 'kd-close', {});
  };
  const escape = (/** @type {KeyboardEvent} */ e) => {
    if (e.key === 'Escape' && !document.querySelector('dialog[open]')) { e.preventDefault(); e.stopImmediatePropagation(); close(); }
  };
  const header = el('div', 'kd-sheet-head'); header.append(heading, closeX(`Close ${title}`, close));
  element.append(header, content);
  return { element, close, open(/** @type {HTMLElement} */ source) {
    if (element.closest('.kd-game-board')) throw new Error('A sheet must use the reserved dock.');
    opener?.setAttribute('aria-expanded', 'false'); opener = source;
    source.setAttribute('aria-controls', element.id); source.setAttribute('aria-expanded', 'true');
    element.hidden = false; document.addEventListener('keydown', escape, true); focusEntry(heading);
  } };
}
/** The only modal in this kit. Cancel has initial focus.
 * @param {{title: string, consequence: string, action: string, cancel?: string, fallback: HTMLElement, onConfirm: () => void}} options */
export function confirmDialog(options) {
  const element = document.createElement('dialog'); element.className = 'kd-dialog';
  const form = document.createElement('form'); form.method = 'dialog';
  const heading = el('h2', '', required(options.title, 'Dialog')); heading.id = id('dialog-title');
  const text = el('p', '', required(options.consequence, 'Consequence')); text.id = id('consequence');
  element.setAttribute('aria-labelledby', heading.id); element.setAttribute('aria-describedby', text.id);
  /** @type {HTMLElement|null} */ let opener = null;
  const cancel = closeX(`Cancel ${options.title.replace(/\?$/, '').toLowerCase()}`, () => close('cancel'));
  const confirm = button(required(options.action, 'Final action'), { kind: 'danger', onPress: () => close('confirm') });
  const header = el('div', 'kd-sheet-head'); header.append(heading, cancel);
  const actions = el('div', 'kd-row'); actions.append(confirm); form.append(header, text, actions); element.append(form);
  const close = (/** @type {string} */ value) => { emit(element, 'kd-before-close', {}); element.close(value); };
  element.addEventListener('cancel', () => emit(element, 'kd-before-close', {}));
  element.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    if (e.shiftKey && document.activeElement === cancel) { e.preventDefault(); confirm.focus(); }
    else if (!e.shiftKey && document.activeElement === confirm) { e.preventDefault(); cancel.focus(); }
  });
  element.addEventListener('close', () => {
    restoreFocus(opener, options.fallback);
    if (element.returnValue === 'confirm') options.onConfirm();
  });
  return { element, open(/** @type {HTMLElement} */ source) { opener = source; element.returnValue = ''; element.showModal(); cancel.focus(); } };
}
/** @typedef {'ready'|'armed'|'spent'|'opponent'|'always-on'|'read'} ResourceState */
/** @typedef {{name: string, rule: string, state?: ResourceState, uses?: number, art?: string, canArm?: boolean}} ResourceData */
/** @param {ResourceData} data @param {'power'|'card'} kind */
function resource(data, kind) {
  const control = button(data.name); control.className = `kd-resource${kind === 'power' ? ' kd-power' : ''}`;
  let state = data.state || 'ready';
  if (data.uses !== undefined && (!Number.isInteger(data.uses) || data.uses < 0)) throw new TypeError('Uses must be a non-negative integer.');
  if (kind === 'power' && data.uses === 0 && ['ready', 'armed'].includes(state)) state = 'spent';
  const name = el('strong', '', required(data.name, 'Resource'));
  const status = el('span', 'kd-pill');
  const rule = el('small', '', required(data.rule, 'Rule'));
  rule.id = id('rule');
  const image = document.createElement('img'); image.src = data.art || ''; image.alt = '';
  control.replaceChildren(); if (data.art) control.append(image);
  control.append(name, status, rule);
  control.setAttribute('aria-describedby', rule.id);
  const update = () => {
    control.dataset.state = state;
    const count = kind === 'power' && data.uses !== undefined ? ` · ${data.uses} ${data.uses === 1 ? 'use' : 'uses'} left` : '';
    const states = { ready: `Ready${count}`, armed: `Armed${count} · Tap to cancel`, spent: 'Spent · Read rule', opponent: `Opponent’s${count} · Read rule`, 'always-on': 'Always on · Read rule', read: 'Read · Tap to arm' };
    status.textContent = data.canArm === false && ['ready', 'read'].includes(state) ? `Read rule${count}` : states[state];
    const canArm = data.canArm !== false && ['ready', 'armed', 'read'].includes(state);
    if (canArm) control.setAttribute('aria-pressed', String(state === 'armed')); else control.removeAttribute('aria-pressed');
  };
  control.addEventListener('click', () => {
    const canArm = data.canArm !== false && ['ready', 'armed', 'read'].includes(state);
    if (canArm) state = state === 'armed' ? 'ready' : 'armed';
    update(); emit(control, 'kd-resource', { name: data.name, kind, state, intent: canArm ? (state === 'armed' ? 'arm' : 'cancel') : 'read' });
  });
  update();
  return { element: control, setState(/** @type {ResourceState} */ next, uses = data.uses) {
    if (uses !== undefined && (!Number.isInteger(uses) || uses < 0)) throw new TypeError('Uses must be a non-negative integer.');
    state = kind === 'power' && uses === 0 && ['ready', 'armed'].includes(next) ? 'spent' : next;
    data.uses = uses; update();
  } };
}
/** @param {ResourceData} data */
export function powerChip(data) { return resource(data, 'power'); }
/** @param {ResourceData} data */
export function card(data) { return resource(data, 'card'); }
/** @param {{name: string, king: string, portrait: string, power: HTMLElement, cards: HTMLElement[]}} data */
export function playerStrip(data) {
  const element = el('section', 'kd-player'); element.setAttribute('aria-label', `${data.name}. ${data.king}`);
  const name = el('div', 'kd-player-name'); name.append(portrait(data.portrait), el('strong', '', data.name), el('span', 'kd-muted', data.king));
  const hand = el('div', 'kd-hand'); hand.setAttribute('aria-label', `${data.name}: cards`); hand.setAttribute('role', 'group'); hand.append(...data.cards);
  element.append(name, data.power, hand); return element;
}
/** The engine owns the record. This list never adds sample entries.
 * @param {string[]} initial @param {string} [resourceName] */
export function turnSteps(initial = [], resourceName = '') {
  const element = el('section', 'kd-steps'); element.setAttribute('aria-label', 'Turn steps');
  const title = el('div', 'kd-steps-title'); title.append(el('strong', '', 'Turn steps'));
  const status = pill('Not sent'); title.append(status);
  const resourceNote = el('p', 'kd-muted', resourceName); resourceNote.hidden = !resourceName;
  const list = document.createElement('ol');
  const empty = el('p', 'kd-muted', 'No steps yet.');
  element.append(title, resourceNote, list, empty);
  const update = (/** @type {string[]} */ steps, sent = false) => {
    list.replaceChildren(...steps.map(step => el('li', '', step)));
    empty.hidden = steps.length > 0; list.hidden = !steps.length;
    status.textContent = sent ? 'Sent' : 'Not sent';
  };
  update(initial); return { element, update };
}
/** @typedef {'idle'|'draft'|'sending'|'sent'|'failed'|'waiting'} TurnState */
/** @typedef {{steps: string[], canFinish: boolean, instruction: string}} Draft */
/** A submission stays locked until the adapter reports its result. A failed request
 * with an unknown result exposes Check status, never another Send.
 * @param {{mode?: 'solo'|'person', onUndo?: (step: string) => Draft}} [options] */
export function turnBar(options = {}) {
  const element = el('section', 'kd-turn'); element.setAttribute('aria-label', 'Turn controls');
  /** @type {TurnState} */ let state = 'idle';
  /** @type {Draft} */ let draft = { steps: [], canFinish: false, instruction: 'Choose a piece, then choose a square.' };
  let uncertain = false;
  let final = false;
  const stateLine = el('p', 'kd-turn-state'); stateLine.tabIndex = -1; stateLine.setAttribute('role', 'status'); stateLine.setAttribute('aria-atomic', 'true');
  const instruction = el('p', 'kd-turn-instruction'); instruction.id = id('turn-instruction');
  const steps = turnSteps();
  const undo = button('Undo', { onPress: () => {
    const last = draft.steps.at(-1);
    if (!last || final || !['draft', 'failed'].includes(state) || uncertain) return;
    draft = options.onUndo ? options.onUndo(last) : { steps: draft.steps.slice(0, -1), canFinish: false, instruction: 'Last step removed. Choose the next action.' };
    state = draft.steps.length ? 'draft' : 'idle'; render(); undo.focus(); emit(element, 'kd-undo', { step: last, steps: [...draft.steps] });
  }});
  const finish = button(options.mode === 'solo' ? 'End turn' : 'Send', { kind: 'main', onPress: () => {
    if (!draft.canFinish || final || !['draft', 'failed'].includes(state) || uncertain) return;
    state = 'sending'; render(); focusEntry(stateLine); emit(element, 'kd-submit', { steps: [...draft.steps] });
  }});
  finish.setAttribute('aria-describedby', instruction.id);
  const check = button('Check status', { onPress: () => { focusEntry(stateLine); emit(element, 'kd-check-status', {}); } });
  const actions = el('div', 'kd-turn-actions'); actions.append(undo, finish, check);
  element.append(stateLine, instruction, actions);
  const render = () => {
    element.dataset.state = state;
    const labels = { idle: 'Your turn', draft: 'Your turn · Not sent', sending: options.mode === 'solo' ? 'Ending turn' : 'Sending turn', sent: options.mode === 'solo' ? 'Turn ended' : 'Turn sent', failed: uncertain ? 'Send result unknown' : 'Turn not sent', waiting: 'Waiting' };
    stateLine.textContent = labels[state];
    instruction.textContent = state === 'sending' ? 'Please wait. Your steps stay here.' : state === 'sent' ? 'This turn is final. You cannot undo it.' : draft.instruction;
    steps.update(draft.steps, final);
    steps.element.hidden = !draft.steps.length || state === 'waiting';
    const editable = !final && ['draft', 'failed'].includes(state) && !uncertain;
    undo.hidden = final || state === 'waiting'; finish.hidden = final || state === 'waiting' || uncertain;
    check.hidden = state !== 'failed' || !uncertain;
    setButtonState(undo, { reason: editable && draft.steps.length ? '' : (state === 'sending' ? 'The turn is sending.' : uncertain ? 'Check the send result first.' : 'No step to undo.') });
    setButtonState(finish, { busy: state === 'sending', reason: state === 'sending' ? 'Please wait.' : draft.canFinish ? '' : 'Complete a legal move first.' });
  };
  render();
  return {
    element, stepsElement: steps.element,
    /** @param {Draft} next */
    stage(next) {
      if (final || state === 'sending' || state === 'waiting' || uncertain) throw new Error('This turn cannot be edited.');
      draft = { ...next, steps: [...next.steps], canFinish: next.canFinish && next.steps.length > 0 }; state = draft.steps.length ? 'draft' : 'idle'; render();
    },
    accept() {
      if (state !== 'sending' && !(state === 'failed' && uncertain)) throw new Error('No submission to accept.');
      const hadFocus = element.contains(document.activeElement); final = true; state = 'sent'; render(); if (hadFocus) focusEntry(stateLine);
    },
    /** @param {string} reason @param {boolean} [resultUnknown] */
    fail(reason, resultUnknown = true) {
      if (state !== 'sending' && !(state === 'failed' && uncertain)) throw new Error('No submission to fail.');
      uncertain = resultUnknown; state = 'failed'; draft.instruction = required(reason, 'Failure'); render();
    },
    /** Call only after acceptance or on a loaded opponent turn.
     * @param {string} opponent @param {string} time */
    wait(opponent, time) {
      if (state !== 'idle' && state !== 'sent' && state !== 'waiting') throw new Error('Resolve the unsent turn first.');
      const hadFocus = element.contains(document.activeElement); final = true; state = 'waiting'; draft.instruction = `${opponent} to move. ${time}.`;
      render(); if (hadFocus) focusEntry(stateLine);
    },
    /** The adapter calls this only when a new turn arrives. No player action is needed. */
    begin() {
      if (state !== 'waiting' && state !== 'sent') throw new Error('The current turn is not final.');
      final = false; uncertain = false; state = 'idle'; draft = { steps: [], canFinish: false, instruction: 'Choose a piece, then choose a square.' }; render();
    },
    get state() { return state; }
  };
}
/** @param {{name: string, symbol: string, shortRule: string, fullRule: string, diagram: HTMLElement}} data */
export function pieceHelp(data) {
  const element = el('section', 'kd-help'); element.setAttribute('aria-label', `${data.name}: rule`);
  const title = el('div', 'kd-help-title'); const symbol = document.createElement('img'); symbol.src = data.symbol; symbol.alt = ''; symbol.className = 'kd-symbol';
  title.append(symbol, el('h3', '', data.name));
  const details = document.createElement('details'); const summary = document.createElement('summary'); summary.textContent = 'Full rule';
  details.append(summary, el('p', '', data.fullRule));
  element.append(title, el('p', '', data.shortRule), data.diagram, details); return element;
}
/** Position this adjacent to the target in a reserved board toolbar; do not hide a square.
 * @param {string} square @param {(action: 'Capture'|'Push') => void} onChoose */
export function targetChoice(square, onChoose) {
  const element = el('section', 'kd-target-choice'); element.setAttribute('aria-label', `Action at ${square}`);
  const actions = el('div', 'kd-row');
  for (const action of /** @type {const} */ (['Capture', 'Push'])) actions.append(button(action, { onPress: () => onChoose(action) }));
  element.append(el('strong', '', `At ${square}`), actions); return element;
}
/** @param {string} label @param {number} value */
export function progress(label, value) {
  if (!Number.isFinite(value) || value < 0 || value > 100) throw new RangeError('Progress must be 0 to 100.');
  const element = el('div', 'kd-progress'); const title = el('span', '', `${label} · ${value}%`); title.id = id('progress');
  const meter = document.createElement('progress'); meter.max = 100; meter.value = value; meter.setAttribute('aria-labelledby', title.id);
  element.append(title, meter); return element;
}
/** Static placeholders never shimmer while the player reads.
 * @param {string} label */
export function loading(label) {
  const node = el('div', 'kd-loading'); node.setAttribute('role', 'status'); node.setAttribute('aria-label', required(label, 'Loading'));
  node.append(el('p', '', label));
  for (let i = 0; i < 3; i++) { const line = el('div', 'kd-placeholder'); line.setAttribute('aria-hidden', 'true'); node.append(line); }
  return node;
}
/** @param {{title: string, text: string, action: string, onAction: () => void}} data @param {'empty'|'error'} kind */
function messageState(data, kind) {
  const node = el('section', 'kd-message'); node.dataset.kind = kind;
  node.append(el('h3', '', data.title), el('p', '', data.text), button(data.action, { kind: 'main', onPress: data.onAction }));
  return node;
}
/** @param {Parameters<typeof messageState>[0]} data */
export function emptyState(data) { return messageState(data, 'empty'); }
/** Announce this through the shared live region when the error occurs.
 * @param {Parameters<typeof messageState>[0]} data */
export function errorState(data) { return messageState(data, 'error'); }
