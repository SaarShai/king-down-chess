import { button, choiceGroup, closeX, icon, switchRow } from '../ui/kit.js';
import { K, KINGS, LETTERS, type Color, type KingName, type PowerName } from '../../rules/engine';
import { kingDisplayName } from '../../king-label';
import { DEAL_CARDS, POOL_KINDS } from '../../match/setup';
import { RELEASED_CARDS } from '../../content/cards';
import { powerText, ruleLine, POWER_NAME } from '../../powers-ui';
import { POWERS_BALANCED, type KingChoice } from '../../rules/rules';
import { nameSearch, sendPersonLink, type PersonHost } from '../people/screens/person';
import { nameSheet, signInSheet } from '../people/screens/sign-in';
import type { PeopleSheet } from '../people/screens/sheet';
import { ObsoleteAction } from '../people/server';
import { computerPortrait } from '../people/host/portrait';
import { cardSummary, homeText, type Art } from './home';
import { levelPill } from './level-pill';
import { ms } from './motion';
import { at, burst, ease, later, onFrame, pulse, reducedMotion, sound, Spring, tween, type Effect } from './fx';
import { cardLocked, changeDraft, DOUBLE_KINDS, kingChoices, onlinePanelOptions, poolLetters, poolLocked, restorePanel, selectCard, selectPiece, shownKing, type GameOptions, type NewGameDraft, type PanelMemory } from './new-game';
import { hasCards, hasPowers, typeName, typeOfFlags, type GameType } from './saved';
import { sideText } from './sides';
import { cardLine, kingLabel, panelText, pieces, text } from './texts';

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, className = '', content = '') => {
  const node = document.createElement(tag); node.className = className; node.textContent = content; return node;
};
const keyed = <T extends HTMLElement>(node: T, name: string) => { node.dataset.focus = name; return node; };
const emblem = (name: KingName) => {
  const img = el('img'); img.src = `/ui/emblems/${name.toLowerCase()}.webp`; img.alt = ''; return img;
};
const portrait = (level: NewGameDraft['level']) => {
  const img = el('img', 'profile-portrait'); img.src = computerPortrait(level); img.alt = ''; return img;
};

export interface PanelData {
  next: NewGameDraft;
  memory?: PanelMemory | null;
  opponent?: PanelMemory['opponent'];
  backLabel?: string;
  /** Set only after a successful sign-in return. */
  resumeInviteAction?: boolean;
  people(): Promise<PersonHost>;
  remember(value: PanelMemory | null): void;
  replacement(): string;
  onStart(draft: NewGameDraft, replacement: string): Promise<void>;
  onInvite(draft: NewGameDraft): void;
  onClose(): void;
  openView(show: () => void): void;
  backView(all?: boolean): boolean;
}
type Choice = 'king' | 'opponent' | 'cards' | 'more' | 'confirm' | 'people';

export function newGamePanel(d: PanelData, art: Art): { element: HTMLDialogElement; open(source: HTMLElement): void; close(): void; back(): boolean } {
  const dialog = el('dialog', 'kd-dialog new-game-panel'), table = el('div', 'setup-table');
  const heading = el('h2', '', text.newGame), summary = el('p', 'setup-summary');
  heading.id = 'new-game-title'; heading.tabIndex = -1;
  dialog.setAttribute('aria-labelledby', heading.id);
  const head = el('header', 'setup-head'), body = el('div', 'setup-body'), foot = el('footer', 'setup-foot');
  const mode = el('div', 'setup-mode'), desk = el('div', 'setup-match'), controls = el('div', 'setup-controls');
  const match = el('div', 'setup-figures'), features = el('div', 'setup-features'), links = el('div', 'setup-links');
  const swap = el('p', 'king-change'); swap.setAttribute('role', 'status');
  const start = button(homeText.startGame, { kind: 'main', onPress: () => {
    if (closing) return;
    const next = d.replacement();
    if (!next) void begin(next);
    else { replacement = next; openChoice('confirm', start); }
  } });
  const saved = d.memory;
  let draft = saved ? restorePanel(saved) : d.next, opponent = d.opponent ?? saved?.opponent ?? 'computer';
  let resumeAction = d.resumeInviteAction && saved?.opponent === 'person' ? saved.action : undefined;
  let choice: Choice | null = null, replacement = '', signingIn = false;
  let opener: HTMLElement | null = null, choiceSource = '', starting = false, busy = false, actionId = 0;
  let sheetEffect: Effect | undefined, sheetOffset = 0, closing = false;
  let pull: { id: number; y: number } | undefined;
  let poolSelected = saved?.section === 'pieces', poolOpen = false;
  const setOptions = (change: Partial<GameOptions>) => edit({ options: { ...draft.options, ...change } });
  const edit = (change: Parameters<typeof changeDraft>[1]) => {
    cancelPerson();
    draft = changeDraft(draft, change);
  };
  const friendFoot = el('div', 'setup-friend-foot'), status = el('p', 'panel-status');
  status.setAttribute('role', 'status');
  const send = keyed(button(panelText.inviteLink, { kind: 'main', onPress: () => void person('link') }), 'invite-link');
  const byName = keyed(button(panelText.byName, { kind: 'quiet', onPress: () => void person('name') }), 'invite-name');
  friendFoot.append(status, send, byName);

  const modes = choiceGroup(panelText.opponent, [{ value: 'computer', label: text.computer }, { value: 'person', label: 'Friend' }], opponent);
  modes.querySelector('legend')!.classList.add('kd-sr');
  modes.addEventListener('kd-change', event => {
    const { value } = (event as CustomEvent<{ value: typeof opponent }>).detail;
    if (value === opponent) return;
    cancelPerson(); opponent = value; draw();
  });
  mode.append(modes);

  head.append(button(d.backLabel ?? 'Back to Home', { icon: 'back', iconOnly: true, onPress: () => close() }), heading, summary);
  desk.append(match, swap); controls.append(features, links); body.append(mode, desk, controls);
  foot.append(start); table.append(head, body, foot);
  foot.append(friendFoot);

  const overlay = el('div', 'setup-overlay'), panel = el('section', 'setup-sheet');
  const panelHead = el('header', 'panel-head'), panelTitle = el('h2'), panelBody = el('div', 'panel-body');
  panelTitle.id = 'setup-choice-title'; panelTitle.tabIndex = -1;
  panel.setAttribute('aria-labelledby', panelTitle.id);
  const back = button(panelText.back, { icon: 'back', iconOnly: true });
  panelHead.append(back, panelTitle, closeX(text.close, closeChoice)); panel.append(panelHead, panelBody); overlay.append(panel);
  overlay.hidden = true; table.append(overlay); dialog.append(table);
  const level = levelPill(draft.level, value => homeText.levels[value], value => { edit({ level: value }); draw(); });
  controls.prepend(level);

  function openControl(label: string, name: Choice, className = '') {
    const node = keyed(button(label, { onPress: () => openChoice(name, node) }), name);
    node.classList.add(className || 'setup-link');
    node.setAttribute('aria-haspopup', 'dialog');
    return node;
  }

  function seat(side: Color, own: boolean) {
    const friend = !own && opponent === 'person';
    const king = own || opponent === 'computer' && draft.options.opponentKing
      ? draft.game.context.rules.kings[own ? draft.player : draft.player ^ 1] : null;
    const name = own ? panelText.yourKing : panelText.opponent;
    const node = friend ? el('div', 'setup-seat setup-seat-static') : openControl(name, own ? 'king' : 'opponent', 'setup-seat');
    const figure = art.figure(K, side, { kings: [null, null] }); figure.alt = '';
    if (king) figure.src = `/ui/kings/${king.king.toLowerCase()}${side ? '-b' : ''}.webp`;
    else if (!own) figure.src = `/ui/pieces/king-shadow-${side ? 'b' : 'w'}.webp`;
    const stage = el('span', 'setup-figure'); stage.append(figure);
    const copy = el('span', 'setup-seat-copy'), power = el('span', 'setup-seat-power');
    if (king) power.append(emblem(king.king));
    power.append(king ? POWER_NAME[king.power] : friend || hasPowers(draft.setup) && !own ? '' : 'No power');
    const caption = el('span', 'setup-seat-edit');
    if (!own && opponent === 'computer') caption.append(portrait(draft.level));
    caption.append(own ? name : friend ? 'A friend' : text.computer);
    const title = !king && !own && hasPowers(draft.setup) ? (friend ? "Friend's king" : panelText.randomKing)
      : !king && opponent === 'person' ? 'Random side' : kingLabel(king?.king, side);
    const kingName = el('strong', '', title);
    kingName.id = own ? 'setup-own-king' : 'setup-opponent-king';
    power.id = own ? 'setup-own-power' : 'setup-opponent-power';
    copy.append(kingName, power, caption);
    node.append(stage, copy);
    if (!friend) {
      caption.append(icon('next'));
      node.querySelector('[data-button-label]')!.classList.add('kd-sr');
      node.setAttribute('aria-label', name);
      node.setAttribute('aria-describedby', `${kingName.id} ${power.id}`);
    }
    return node;
  }
  function choiceValues(label: string, values: { value: string; label: string }[], value: string, change: (value: string) => void) {
    const group = choiceGroup(label, values, value);
    group.addEventListener('kd-change', event => {
      // The change can redraw the group. Keep the focus on the selected radio through the redraw.
      if (group.contains(document.activeElement)) group.querySelector<HTMLElement>('[aria-checked="true"]')?.focus({ preventScroll: true });
      change((event as CustomEvent).detail.value);
    });
    group.querySelectorAll<HTMLElement>('[role="radio"]').forEach((radio, i) => keyed(radio, label + values[i].value));
    return group;
  }
  function setFeature(name: 'powers' | 'cards', on: boolean) {
    const powers = name === 'powers', before = shownKing(draft.setup, draft.options.king);
    if (!powers && on) setOptions({ cardPool: DEAL_CARDS });
    edit({ setup: typeOfFlags(powers ? on : hasPowers(draft.setup), powers ? hasCards(draft.setup) : on) });
    draw();
    if (!on) return;
    const after = shownKing(draft.setup, draft.options.king);
    if (powers || hasPowers(draft.setup) && (before.king !== after.king || before.power !== after.power)) stampKing(after.king);
    if (!powers) dealCards();
  }
  function feature(name: 'powers' | 'cards', on: boolean) {
    const powers = name === 'powers', label = powers ? 'Powers' : text.cards, box = el('section', 'setup-feature');
    const picture = el('span', powers ? 'setup-emblem' : 'setup-deck'); picture.setAttribute('aria-hidden', 'true');
    const king = shownKing(draft.setup, draft.options.king);
    if (powers) picture.append(emblem(king.king));
    else {
      const cards = draft.game.context.rules.hands[draft.player];
      picture.append(...(cards.length ? cards.slice(0, 2).map(card => RELEASED_CARDS.findIndex(c => c.id === card)) : [0, 1]).map(art.card));
    }
    const artwork = keyed(button(label, { onPress: () => {
      if (!powers && !on) setFeature(name, true);
      openChoice(powers ? 'king' : 'cards', artwork);
    } }), name);
    artwork.classList.add('setup-feature-label');
    artwork.setAttribute('aria-haspopup', 'dialog');
    artwork.prepend(picture);
    const toggle = keyed(switchRow(label, '', on), `${name}-switch`);
    toggle.querySelector('.kd-switch-copy')!.remove();
    toggle.removeAttribute('aria-labelledby');
    toggle.setAttribute('aria-label', label);
    toggle.addEventListener('kd-change', event => setFeature(name, (event as CustomEvent<{ checked: boolean }>).detail.checked));
    box.append(artwork, toggle);
    return box;
  }
  function draw() {
    const focus = (document.activeElement as HTMLElement | null)?.dataset.focus;
    const friend = opponent === 'person', mine = friend ? 0 : draft.player;
    const king = shownKing(draft.setup, draft.options.king), preferred = draft.options.king;
    summary.textContent = friend ? typeName[draft.setup] : `${text[draft.level]} · ${typeName[draft.setup]}`;
    match.replaceChildren(seat(mine, true), el('span', 'setup-vs', 'VS'), seat((mine ^ 1) as Color, false));
    const forced = hasPowers(draft.setup) && hasCards(draft.setup) && preferred && (preferred.king !== king.king || preferred.power !== king.power);
    swap.textContent = forced ? panelText.changedKing(`${kingDisplayName(preferred.king)} · ${POWER_NAME[preferred.power]}`, `${kingDisplayName(king.king)} · ${POWER_NAME[king.power]}`) : '';
    if (forced) {
      swap.id = 'setup-king-change';
      match.firstElementChild!.setAttribute('aria-describedby', `setup-own-king setup-own-power ${swap.id}`);
    }
    level.hidden = start.hidden = friend;
    friendFoot.hidden = !friend;
    features.replaceChildren(feature('powers', hasPowers(draft.setup)), feature('cards', hasCards(draft.setup)));
    links.replaceChildren(openControl(panelText.more, 'more'));
    if (focus) table.querySelector<HTMLElement>(`[data-focus="${CSS.escape(focus)}"]`)?.focus({ preventScroll: true });
  }

  const choiceTitles = { king: panelText.yourKing, opponent: panelText.opponentKing, cards: text.cards, more: panelText.more, confirm: text.newTitle };
  function openChoice(next: Choice, source: HTMLElement) {
    const key = source.dataset.focus ?? '';
    if (next === 'confirm') showSetupChoice(next, key);
    else d.openView(() => showSetupChoice(next, key));
  }
  function showSetupChoice(next: Choice, source: string, showPool = false) {
    const focusPool = next === 'more' && (showPool || poolOpen);
    if (closing) sheetEffect?.finish();
    if (choice === 'people') d.remember(null);
    cancelPerson();
    poolOpen = showPool;
    choiceSource = source;
    showChoice(next); redrawChoice(false);
    const control = focusPool ? panelBody.querySelector<HTMLElement>('[role="radio"][aria-checked="true"]') : panelTitle;
    control?.focus({ preventScroll: true });
  }
  function showChoice(next: Choice) {
    const opening = choice !== next;
    choice = next; overlay.hidden = false; head.inert = body.inert = true;
    panel.dataset.choice = next; dialog.setAttribute('aria-labelledby', panelTitle.id);
    if (!opening) return;
    sheetEffect?.cancel();
    sound('pass'); pulse('light');
    if (reducedMotion()) return;
    const spring = new Spring(1, 320, 27); spring.to = 0;
    sheetFrame(1);
    sheetEffect = onFrame(dt => {
      sheetFrame(spring.step(dt));
      if (spring.still) return false;
    }, clearSheet);
  }
  const wideChoice = () => matchMedia('(min-width: 900px)').matches;
  function sheetFrame(offset: number) {
    sheetOffset = offset;
    panel.style.transform = `translate${wideChoice() && choice !== 'confirm' ? 'X' : 'Y'}(${offset * 100}%)`;
    overlay.style.setProperty('--setup-dim', String(Math.min(1, Math.max(0, 1 - offset))));
  }
  function clearSheet() {
    sheetOffset = 0; panel.style.removeProperty('transform'); overlay.style.removeProperty('--setup-dim');
  }
  function closeChoice() {
    if (!d.backView(true)) hideChoice();
  }
  function hideChoice() {
    if (!choice) return;
    if (closing) { sheetEffect?.finish(); return; }
    sheetEffect?.cancel(); pull = undefined;
    if (choice === 'people') d.remember(null);
    cancelPerson(); closing = true; sound('tick');
    const done = () => {
      clearSheet(); closing = poolOpen = false; choice = null; overlay.hidden = true; head.inert = body.inert = false;
      dialog.setAttribute('aria-labelledby', heading.id);
      (table.querySelector<HTMLElement>(`[data-focus="${choiceSource}"]`) ?? start).focus({ preventScroll: true });
    };
    if (reducedMotion()) { done(); return; }
    const from = sheetOffset;
    sheetEffect = tween(180, k => sheetFrame(from + (1 - from) * k), { curve: ease.in2, done });
  }
  panelHead.addEventListener('pointerdown', event => {
    if (closing || wideChoice() || event.button !== 0 || (event.target as Element).closest('button')) return;
    sheetEffect?.finish();
    pull = { id: event.pointerId, y: event.clientY }; panelHead.setPointerCapture(event.pointerId);
  });
  panelHead.addEventListener('pointermove', event => {
    if (pull?.id === event.pointerId && !reducedMotion()) sheetFrame(Math.max(0, event.clientY - pull.y) / panel.clientHeight);
  });
  for (const type of ['pointerup', 'pointercancel']) panelHead.addEventListener(type, event => {
    const { pointerId, clientY } = event as PointerEvent;
    if (pull?.id !== pointerId) return;
    const distance = clientY - pull.y; pull = undefined;
    if (type === 'pointerup' && distance > 70) { closeChoice(); return; }
    const from = sheetOffset;
    if (from) sheetEffect = tween(160, k => sheetFrame(from * (1 - k)), { done: clearSheet });
  });
  function redrawChoice(restore = true) {
    if (!choice || choice === 'people') return;
    const focus = (document.activeElement as HTMLElement | null)?.dataset.focus, scroll = panelBody.scrollTop;
    panelTitle.textContent = choiceTitles[choice]; back.hidden = true; back.onclick = null;
    const content = choice === 'king' ? kings() : choice === 'opponent' ? kings(false) : choice === 'cards' ? cards() : choice === 'more' ? more() : confirmation();
    panelBody.replaceChildren(content);
    panelBody.scrollTop = restore ? scroll : 0;
    if (restore && focus) panelBody.querySelector<HTMLElement>(`[data-focus="${CSS.escape(focus)}"]`)?.focus({ preventScroll: true });
  }
  const update = () => { draw(); redrawChoice(); };

  function kings(own = true) {
    const box = el('div', 'panel-section'), grid = el('div', 'king-grid');
    const preferred = own ? draft.options.king : draft.options.opponentKing;
    const chosen = own || preferred ? shownKing(draft.setup, preferred ?? null) : null;
    const side = opponent === 'person' ? 0 : own ? draft.player : draft.player ^ 1;
    const legal = kingChoices(hasCards(draft.setup) ? 'both' : 'powers');
    const on = hasPowers(draft.setup);
    const pick = (king: KingChoice) => {
      edit({ setup: typeOfFlags(true, hasCards(draft.setup)), options: { ...draft.options, [own ? 'king' : 'opponentKing']: king } });
      update(); stampKing(king.king, own);
    };
    if (!own) {
      const random = keyed(button(panelText.randomKing, { onPress: () => {
        setOptions({ opponentKing: undefined }); update();
      } }), 'random-king');
      random.setAttribute('aria-pressed', String(!preferred));
      box.append(random);
    }
    if (!on) box.append(el('p', 'panel-note', 'Select a king to turn Powers on.'));
    grid.setAttribute('role', 'group'); grid.setAttribute('aria-label', own ? panelText.yourKing : panelText.opponentKing);
    for (const king of Object.keys(KINGS) as KingName[]) {
      const available = legal.find(k => k.king === king);
      const control = keyed(button(kingDisplayName(king), {
        disabledReason: available ? '' : 'In cards',
        onPress: () => { if (available) pick(chosen?.king === king ? chosen : available); },
      }), king);
      control.setAttribute('aria-pressed', String(on && chosen?.king === king));
      control.classList.add('king-choice'); control.dataset.king = king;
      if (!available) control.setAttribute('aria-describedby', 'setup-king-rule');
      const figure = el('img'); figure.src = `/ui/kings/${king.toLowerCase()}${side ? '-b' : ''}.webp`; figure.alt = '';
      control.prepend(figure); grid.append(control);
    }
    box.append(grid);
    if (hasCards(draft.setup)) {
      const note = el('p', 'panel-note', 'With cards, the powers of Frost, Flame and Sky come as cards.');
      note.id = 'setup-king-rule'; box.append(note);
    }
    if (chosen) {
      const powers = choiceValues(panelText.power, legal.filter(k => k.king === chosen.king).map(k => ({ value: k.power, label: POWER_NAME[k.power] })), chosen.power,
        value => pick({ king: chosen.king, power: value as PowerName }));
      // With Powers off, show the rules that a tap on a king turns on (rulesOf), not the printed ones.
      box.append(powers, el('p', 'panel-note', ruleLine(powerText(chosen.power, { ...draft.game.context.rules, ...POWERS_BALANCED }))));
    }
    return box;
  }

  function stampKing(king: KingName, own = true) {
    const portrait = panelBody.querySelector<HTMLImageElement>(`[data-king="${king}"] > img`);
    const seal = match.querySelector<HTMLImageElement>(`[data-focus="${own ? 'king' : 'opponent'}"] .setup-seat-power > img`);
    const strike = () => { sound('clink'); pulse('light'); if (seal) burst('dust', at(seal), { count: 4, ms: 200 }); };
    if (reducedMotion()) { strike(); return; }
    if (portrait) tween(220, (_, t) => {
      const lift = Math.sin(t * Math.PI);
      portrait.style.transform = `translateY(${-8 * lift}px) scale(${1 + .14 * lift})`;
    }, { done: () => portrait.style.removeProperty('transform') });
    if (seal) {
      seal.style.transform = 'translateY(-8px) scale(1.6)';
      tween(140, k => { seal.style.transform = `translateY(${-8 * (1 - k)}px) scale(${1.6 - .6 * k})`; },
        { curve: ease.in2, done: () => { seal.style.removeProperty('transform'); strike(); } });
    }
  }

  function dealCards() {
    const cards = features.querySelectorAll<HTMLImageElement>('.setup-deck img');
    if (reducedMotion()) { sound('pass'); return; }
    cards.forEach((card, i) => {
      card.style.opacity = '0'; card.style.translate = '20px -12px';
      later(i * 70, () => {
        if (!card.isConnected || reducedMotion()) { card.style.removeProperty('opacity'); card.style.removeProperty('translate'); return; }
        sound('pass', { volume: .85 }); pulse('tick');
        tween(180, k => {
          card.style.opacity = String(k); card.style.translate = `${20 * (1 - k)}px ${-12 * (1 - k)}px`;
        }, { done: () => { card.style.removeProperty('opacity'); card.style.removeProperty('translate'); } });
      });
    });
  }

  function cards() {
    const box = el('div', 'panel-section'), grid = el('div', 'panel-card-grid');
    box.append(el('p', 'panel-note card-count', cardSummary(draft.options.cardPool)));
    if (draft.options.cardPool.length === 4) box.append(el('p', 'panel-note', panelText.cardPoolLock));
    for (const [i, card] of RELEASED_CARDS.entries()) {
      const selected = draft.options.cardPool.includes(card.id);
      const tile = keyed(button(card.name, {
        disabledReason: cardLocked(draft.options.cardPool, card.id) ? panelText.locked : '',
        onPress: () => {
          setOptions({ cardPool: selectCard(draft.options.cardPool, card.id, !selected) }); update();
          if (!selected && !reducedMotion()) panelBody.querySelector(`[data-focus="${card.id}"]`)?.classList.add('card-lift');
        },
      }), card.id);
      tile.classList.add('panel-card');
      tile.setAttribute('aria-pressed', String(selected));
      tile.setAttribute('aria-label', card.name);
      const rule = el('span', 'panel-card-rule', cardLine(card.id));
      rule.id = `card-rule-${card.id}`;
      const described = [tile.getAttribute('aria-describedby'), rule.id].filter(Boolean).join(' ');
      tile.setAttribute('aria-describedby', described);
      tile.prepend(art.card(i));
      tile.append(rule);
      grid.append(tile);
    }
    box.append(grid); return box;
  }

  function more() {
    const box = el('div', 'panel-section setup-more'), list = el('div', 'pool-list');
    if (opponent === 'person') box.append(el('p', 'panel-note', 'Sides are random.'));
    const full = poolLetters(draft.options.pool, draft.options.seconds) === poolLetters(POOL_KINDS);
    box.append(choiceValues(panelText.pieces, [{ value: 'all', label: panelText.allPieces }, { value: 'pool', label: panelText.pool }], full && !poolSelected && !poolOpen ? 'all' : 'pool', value => {
      poolSelected = value === 'pool';
      if (poolSelected) {
        if (!poolOpen) d.openView(() => showSetupChoice('more', 'more', true));
      } else {
        setOptions({ pool: POOL_KINDS, seconds: DOUBLE_KINDS }); draw();
        if (!poolOpen) redrawChoice(); else d.backView();
      }
    }));
    if (poolOpen) {
      const lock = el('p', 'panel-note', panelText.poolLock); lock.id = 'pool-lock';
      for (const letter of POOL_KINDS) for (const copy of (DOUBLE_KINDS.includes(letter) ? [1, 2] : [1]) as (1 | 2)[]) {
        const type = LETTERS.indexOf(letter), name = pieces[type].name + (DOUBLE_KINDS.includes(letter) ? copy === 1 ? ' x1' : ' 2nd' : '');
        const row = el('label', 'pool-row'), chosen = (copy === 1 ? draft.options.pool : draft.options.seconds ?? DOUBLE_KINDS).includes(letter);
        const locked = poolLocked(draft.options.pool, letter, draft.options.seconds, copy);
        row.dataset.letter = letter;
        const figure = art.figure(type, opponent === 'person' ? 0 : draft.player, draft.game.context.rules);
        const toggle = keyed(el('input', 'kd-sr'), `${letter}-${copy}`);
        toggle.type = 'checkbox'; toggle.checked = chosen; toggle.disabled = locked;
        toggle.setAttribute('aria-label', name);
        if (locked) toggle.setAttribute('aria-describedby', lock.id);
        const check = el('span', 'pool-check'), mark = icon('check');
        mark.querySelector('path')!.setAttribute('pathLength', '24');
        check.append(mark);
        toggle.addEventListener('change', () => {
          const on = toggle.checked;
          const copies = copy === 2 && !draft.options.pool.includes(letter) ? [1, 2] : [copy];
          edit({ options: selectPiece(draft.options, letter, copy, on) }); update();
          if (on && !reducedMotion()) for (const n of copies) {
            panelBody.querySelector(`[data-focus="${letter}-${n}"] + .pool-check`)?.classList.add('draw-check');
          }
        });
        row.append(figure, el('span', 'pool-name', name));
        if (locked) row.append(el('span', 'pool-lock', panelText.locked));
        row.append(toggle, check); list.append(row);
      }
      box.append(lock, list);
    }
    box.append(choiceValues(panelText.arrangement, [{ value: 'random', label: panelText.random }, { value: 'manual', label: panelText.manual }], draft.options.arrangement, value => {
      setOptions({ arrangement: value === 'manual' ? 'manual' : 'random' }); update();
    }), el('p', 'panel-note', draft.options.arrangement === 'manual' ? panelText.manualLine : panelText.randomLine));
    if (opponent === 'computer') box.append(choiceValues(homeText.side, [{ value: 'light', label: sideText.light }, { value: 'dark', label: sideText.dark }], draft.player ? 'dark' : 'light', value => {
      edit({ sideChoice: value === 'dark' ? 'dark' : 'light' }); update();
    }));
    return box;
  }

  function confirmation() {
    const box = el('div', 'panel-section setup-confirm');
    box.append(el('p', '', 'Your saved game against the computer ends.'), button('Start a new game', { kind: 'main', onPress: () => {
      const current = d.replacement();
      if (!current || current === replacement) void begin(current);
      else { replacement = current; panelTitle.focus(); }
    } }), button(text.keepGame, { onPress: closeChoice }));
    return box;
  }

  const memory = (): PanelMemory => ({ setup: draft.setup, level: draft.level, sideChoice: draft.sideChoice, options: draft.options, opponent,
    section: poolSelected ? 'pieces' : null, deal: { back: draft.back, player: draft.player, rules: draft.rules } });
  function cancelPerson() {
    actionId++; busy = signingIn = false; status.textContent = '';
  }
  async function person(action: 'name' | 'link') {
    if (busy) return;
    const submitted = draft, pending = memory(), own = ++actionId, current = () => dialog.open && own === actionId;
    choiceSource = (action === 'name' ? byName : send).dataset.focus!;
    const sheet: PeopleSheet = { element: dialog, get isOpen() { return current(); },
      show(view) {
        if (!current()) return;
        status.textContent = '';
        showChoice('people');
        panelTitle.textContent = view.title; panelBody.replaceChildren(...view.body);
        back.hidden = false; back.onclick = view.back ?? closeChoice; panelBody.scrollTop = 0; panelTitle.focus();
      },
      close() {
        if (!current()) return;
        if (signingIn) closeChoice(); else close();
      } };
    busy = true; status.textContent = panelText.loading;
    try {
      const host = await d.people(); if (!current()) return;
      const invited = () => { if (!current()) throw new ObsoleteAction(); d.onInvite(submitted); };
      const scoped = { ...host, toast: (message: string) => { if (current()) host.toast(message); },
        createLink: async (rules: GameType) => { const link = await host.createLink(rules, onlinePanelOptions(submitted.options)); invited(); return link; },
        invite: async (handle: string, rules: GameType) => { await host.invite(handle, rules, onlinePanelOptions(submitted.options)); invited(); } };
      const proceed = () => {
        if (!current()) return;
        if (action === 'name') nameSearch(sheet, scoped, submitted.setup, closeChoice);
        else void sendPersonLink(sheet, scoped, submitted.setup, closeChoice);
      };
      const named = () => {
        if (!current()) return;
        const me = host.me();
        if (!me) return;
        d.remember(pending);
        signingIn = false;
        if (me.handle) proceed(); else nameSheet(sheet, host, proceed);
      };
      if (host.me()) named();
      else {
        d.remember({ ...pending, opponent: 'person', action });
        signingIn = true;
        // "Play the computer" in the sign-in recovery view: the Computer side of the switch, with Start game.
        signInSheet(sheet, { ...host, playComputer: () => modes.querySelector<HTMLElement>('[role="radio"]')?.click() }, { kind: 'person' }, named);
      }
    } catch { if (current()) status.textContent = panelText.onlineFailed; }
    finally { if (current()) busy = false; }
  }

  function shut() {
    if (!dialog.open) return;
    sheetEffect?.cancel(); clearSheet(); actionId++; d.remember(null); dialog.dispatchEvent(new CustomEvent('kd-before-close', { bubbles: true })); dialog.close();
    if (opener?.isConnected) opener.focus();
  }
  function close(history = true) { if (!dialog.open || starting) return; shut(); if (history) d.onClose(); }
  dialog.addEventListener('keydown', event => {
    if (event.key === 'Escape' && choice) { event.preventDefault(); closeChoice(); }
  });
  dialog.addEventListener('cancel', event => { event.preventDefault(); if (choice) closeChoice(); else close(); });
  overlay.addEventListener('click', event => { if (event.target === overlay) closeChoice(); });
  async function begin(accepted: string) {
    if (starting || closing || !dialog.open) return;
    starting = true;
    const swallow = (event: Event) => {
      if ((event.target as Element).closest('.play-game, dialog[open]')) return;
      event.preventDefault(); event.stopPropagation();
    };
    document.addEventListener('click', swallow, true); setTimeout(() => document.removeEventListener('click', swallow, true), ms('--dur-sheet-in') + 300);
    try { shut(); await d.onStart(draft, accepted); } finally { starting = false; }
  }
  return {
    element: dialog,
    open(source) {
      opener = source; draw(); dialog.showModal(); heading.focus();
      if (resumeAction === 'link' || resumeAction === 'name') {
        const action = resumeAction;
        resumeAction = undefined;
        d.remember(memory());
        void person(action);
      }
    },
    close: () => close(false),
    back() {
      if (!choice || closing) return false;
      hideChoice();
      return true;
    },
  };
}
