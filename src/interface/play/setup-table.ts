import { button, choiceGroup, closeX, icon, setButtonState, switchRow } from '../ui/kit.js';
import { K, KINGS, LETTERS, type Color, type KingName, type PowerName } from '../../rules/engine';
import { kingDisplayName } from '../../king-label';
import { DEAL_CARDS, POOL_KINDS } from '../../match/setup';
import { RELEASED_CARDS } from '../../content/cards';
import { powerText, ruleLine, POWER_NAME } from '../../powers-ui';
import type { KingChoice } from '../../rules/rules';
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
import { kingLabel, panelText, pieces, text } from './texts';

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
  people(): Promise<PersonHost>;
  remember(value: PanelMemory | null): void;
  replacement(): string;
  onStart(draft: NewGameDraft, replacement: string): Promise<void>;
  onInvite(draft: NewGameDraft): void;
  onClose(): void;
}
type Choice = 'king' | 'opponent' | 'cards' | 'more' | 'confirm' | 'people';

export function newGamePanel(d: PanelData, art: Art): { element: HTMLDialogElement; open(source: HTMLElement): void; close(): void } {
  const dialog = el('dialog', 'kd-dialog new-game-panel'), table = el('div', 'setup-table');
  const heading = el('h2', '', text.newGame), summary = el('p', 'setup-summary');
  heading.id = 'new-game-title'; heading.tabIndex = -1;
  dialog.setAttribute('aria-labelledby', heading.id);
  const head = el('header', 'setup-head'), body = el('div', 'setup-body'), foot = el('footer', 'setup-foot');
  const desk = el('div', 'setup-match'), controls = el('div', 'setup-controls');
  const match = el('div', 'setup-figures'), features = el('div', 'setup-features'), links = el('div', 'setup-links');
  const swap = el('p', 'king-change'); swap.setAttribute('role', 'status');
  const start = button(homeText.startGame, { kind: 'main', onPress: () => {
    if (opponent === 'person') { openChoice('opponent', start); return; }
    const next = d.replacement();
    if (!next) void begin(next);
    else { replacement = next; openChoice('confirm', start); }
  } });
  const saved = d.memory;
  let draft = saved ? restorePanel(saved) : d.next, opponent = saved?.opponent ?? 'computer';
  let choice: Choice | null = null, replacement = '';
  let opener: HTMLElement | null = null, choiceSource = '', starting = false, busy = false, actionId = 0;
  let sheetEffect: Effect | undefined, sheetOffset = 0, closing = false;
  let pull: { id: number; y: number } | undefined;
  let poolOpen = !!saved && saved.section === 'pieces';
  const setOptions = (change: Partial<GameOptions>) => edit({ options: { ...draft.options, ...change } });
  const edit = (change: Parameters<typeof changeDraft>[1]) => { draft = changeDraft(draft, change); };

  head.append(button('Back to Play', { icon: 'back', iconOnly: true, onPress: () => close() }), heading, summary);
  desk.append(match, swap); controls.append(features, links); body.append(desk, controls);
  foot.append(start); table.append(head, body, foot);

  const overlay = el('div', 'setup-overlay'), panel = el('section', 'setup-sheet');
  const panelHead = el('header', 'panel-head'), panelTitle = el('h2'), panelBody = el('div', 'panel-body');
  panelTitle.id = 'setup-choice-title'; panelTitle.tabIndex = -1;
  panel.setAttribute('aria-labelledby', panelTitle.id);
  const back = button(panelText.back, { icon: 'back', iconOnly: true });
  panelHead.append(back, panelTitle, closeX(text.close, closeChoice)); panel.append(panelHead, panelBody); overlay.append(panel);
  overlay.hidden = true; dialog.append(table, overlay);
  const status = el('p', 'panel-status'); status.setAttribute('role', 'status');
  const level = levelPill(draft.level, value => homeText.levels[value], value => { edit({ level: value }); draw(); });
  controls.prepend(level);

  function openControl(label: string, name: Choice, className = '') {
    const node = keyed(button(label, { onPress: () => openChoice(name, node) }), name);
    node.classList.add(className || 'setup-link');
    node.setAttribute('aria-haspopup', 'dialog');
    return node;
  }

  function seat(side: Color, own: boolean) {
    const king = own || opponent === 'computer' && draft.options.opponentKing
      ? draft.game.context.rules.kings[own ? draft.player : draft.player ^ 1] : null;
    const name = own ? panelText.yourKing : panelText.opponent;
    const node = openControl(name, own ? 'king' : 'opponent', 'setup-seat');
    const figure = art.figure(K, side, { kings: [null, null] }); figure.alt = '';
    if (king) figure.src = `/ui/kings/${king.king.toLowerCase()}${side ? '-b' : ''}.webp`;
    else if (!own) figure.src = `/ui/pieces/king-shadow-${side ? 'b' : 'w'}.webp`;
    const stage = el('span', 'setup-figure'); stage.append(figure);
    const copy = el('span', 'setup-seat-copy'), power = el('span', 'setup-seat-power');
    if (king) power.append(emblem(king.king));
    power.append(king ? POWER_NAME[king.power] : hasPowers(draft.setup) && !own ? '' : 'No power');
    const caption = el('span', 'setup-seat-edit');
    if (!own && opponent === 'computer') caption.append(portrait(draft.level));
    caption.append(own ? name : opponent === 'computer' ? text.computer : panelText.player);
    const title = !king && !own && hasPowers(draft.setup) ? panelText.randomKing : kingLabel(king?.king, side);
    const kingName = el('strong', '', title);
    kingName.id = own ? 'setup-own-king' : 'setup-opponent-king';
    power.id = own ? 'setup-own-power' : 'setup-opponent-power';
    copy.append(kingName, power, caption);
    node.append(stage, copy);
    node.querySelector('[data-button-label]')!.classList.add('kd-sr');
    node.setAttribute('aria-label', name);
    node.setAttribute('aria-describedby', `${kingName.id} ${power.id}`);
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
    const powers = name === 'powers', label = powers ? 'Powers' : 'Cards', box = el('section', 'setup-feature');
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
    const mine = opponent === 'person' ? 0 : draft.player;
    const king = shownKing(draft.setup, draft.options.king), preferred = draft.options.king;
    summary.textContent = [opponent === 'computer' ? text[draft.level] : panelText.player, typeName[draft.setup]].join(' · ');
    match.replaceChildren(seat(mine, true), el('span', 'setup-vs', 'VS'), seat((mine ^ 1) as Color, false));
    const forced = hasPowers(draft.setup) && hasCards(draft.setup) && preferred && (preferred.king !== king.king || preferred.power !== king.power);
    swap.textContent = forced ? panelText.changedKing(`${kingDisplayName(preferred.king)} · ${POWER_NAME[preferred.power]}`, `${kingDisplayName(king.king)} · ${POWER_NAME[king.power]}`) : '';
    if (forced) {
      swap.id = 'setup-king-change';
      match.firstElementChild!.setAttribute('aria-describedby', `setup-own-king setup-own-power ${swap.id}`);
    }
    level.hidden = opponent === 'person';
    features.replaceChildren(feature('powers', hasPowers(draft.setup)), feature('cards', hasCards(draft.setup)));
    links.replaceChildren(openControl('More options', 'more'));
    setButtonState(start, { label: opponent === 'computer' ? homeText.startGame : 'Choose how to invite' });
    if (focus) table.querySelector<HTMLElement>(`[data-focus="${CSS.escape(focus)}"]`)?.focus({ preventScroll: true });
  }

  const choiceTitles: Record<Choice, string> = { king: panelText.yourKing, opponent: panelText.opponent, cards: 'Cards', more: 'More options', confirm: text.newTitle, people: panelText.player };
  function openChoice(next: Choice, source: HTMLElement) {
    choiceSource = source.dataset.focus ?? '';
    choice = next; overlay.hidden = false; table.inert = true;
    panel.dataset.choice = next; dialog.setAttribute('aria-labelledby', panelTitle.id);
    redrawChoice(false); panelTitle.focus();
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
    if (!choice) return;
    if (closing) { sheetEffect?.finish(); return; }
    sheetEffect?.cancel(); pull = undefined;
    if (choice === 'people' || choice === 'opponent') d.remember(null);
    closing = true; actionId++; busy = false; sound('tick');
    const done = () => {
      clearSheet(); closing = false; choice = null; overlay.hidden = true; table.inert = false;
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
    if (!choice) return;
    const focus = (document.activeElement as HTMLElement | null)?.dataset.focus, scroll = panelBody.scrollTop;
    panelTitle.textContent = choiceTitles[choice]; back.hidden = true; back.onclick = null; status.textContent = '';
    const content = choice === 'king' ? kings() : choice === 'opponent' ? opponents() : choice === 'cards' ? cards() : choice === 'more' ? more() : confirmation();
    panelBody.replaceChildren(content);
    panelBody.scrollTop = restore ? scroll : 0;
    if (restore && focus) panelBody.querySelector<HTMLElement>(`[data-focus="${CSS.escape(focus)}"]`)?.focus({ preventScroll: true });
  }
  const update = () => { draw(); redrawChoice(); };

  function opponents() {
    const box = el('div', 'panel-section');
    const computer = keyed(button(text.computer, { onPress: () => { opponent = 'computer'; draw(); closeChoice(); } }), 'computer');
    computer.classList.add('opponent-computer');
    computer.setAttribute('aria-pressed', String(opponent === 'computer'));
    computer.prepend(portrait(draft.level));
    const invite = el('div', 'person-choices');
    invite.append(el('h3', '', 'Play a person'), button(panelText.byName, { icon: 'next', onPress: () => void person('name') }),
      button(panelText.send, { icon: 'next', onPress: () => void person('link') }));
    box.append(computer);
    if (opponent === 'computer') box.append(kings(false));
    box.append(invite, status);
    return box;
  }

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
      box.append(powers, el('p', 'panel-note', ruleLine(powerText(chosen.power, draft.game.context.rules))));
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
      tile.prepend(art.card(i));
      grid.append(tile);
    }
    box.append(grid); return box;
  }

  function more() {
    const box = el('div', 'panel-section setup-more'), list = el('div', 'pool-list');
    const full = poolLetters(draft.options.pool, draft.options.seconds) === poolLetters(POOL_KINDS);
    box.append(choiceValues(panelText.pieces, [{ value: 'all', label: panelText.allPieces }, { value: 'pool', label: panelText.pool }], full && !poolOpen ? 'all' : 'pool', value => {
      poolOpen = value === 'pool';
      if (!poolOpen) setOptions({ pool: POOL_KINDS, seconds: DOUBLE_KINDS });
      update();
    }));
    if (poolOpen || !full) {
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
    section: poolOpen ? 'pieces' : null, deal: { back: draft.back, player: draft.player, rules: draft.rules } });
  // The existing sign-in and name views use the same panel and history entry.
  const sheet: PeopleSheet = {
    element: dialog, get isOpen() { return dialog.open; }, close: () => close(),
    show(view) {
      choice = 'people'; panel.dataset.choice = choice;
      panelTitle.textContent = view.title; panelBody.replaceChildren(...view.body);
      back.hidden = false; back.onclick = view.back ?? closeChoice; panelBody.scrollTop = 0; panelTitle.focus();
    },
  };
  async function person(action: 'name' | 'link') {
    if (busy) return;
    const submitted = draft, own = ++actionId, current = () => dialog.open && own === actionId;
    const redraw = () => {
      if (!current()) return;
      actionId++; busy = false; // Back ends the pending action: a late reply must not act
      choice = 'opponent'; panel.dataset.choice = choice; redrawChoice(false); panelTitle.focus();
    };
    const activeSheet: PeopleSheet = { element: dialog, get isOpen() { return current(); },
      show: view => { if (current()) sheet.show(view); }, close: () => { if (current()) close(); } };
    busy = true; status.textContent = panelText.loading;
    try {
      const host = await d.people(); if (!current()) return;
      d.remember({ ...memory(), opponent: 'person' });
      const named = () => { if (!current()) return; if (!host.me()?.handle) nameSheet(activeSheet, host, redraw); else redraw(); };
      if (!host.me()) { signInSheet(activeSheet, host, { kind: 'person' }, named); return; }
      if (!host.me()!.handle) { nameSheet(activeSheet, host, redraw); return; }
      const invited = () => { if (!current()) throw new ObsoleteAction(); d.onInvite(submitted); };
      const scoped = { ...host, toast: (message: string) => { if (current()) host.toast(message); },
        createLink: async (rules: GameType) => { const link = await host.createLink(rules, onlinePanelOptions(submitted.options)); invited(); return link; },
        invite: async (handle: string, rules: GameType) => { await host.invite(handle, rules, onlinePanelOptions(submitted.options)); invited(); } };
      if (action === 'name') nameSearch(activeSheet, scoped, submitted.setup, redraw);
      else await sendPersonLink(activeSheet, scoped, submitted.setup, redraw);
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
    const swallow = (event: Event) => { if ((event.target as Element).closest('.play-game')) return; event.preventDefault(); event.stopPropagation(); };
    document.addEventListener('click', swallow, true); setTimeout(() => document.removeEventListener('click', swallow, true), ms('--dur-sheet-in') + 300);
    try { shut(); await d.onStart(draft, accepted); } finally { starting = false; }
  }
  return {
    element: dialog,
    open(source) {
      opener = source; draw(); dialog.showModal(); heading.focus();
      if (saved?.opponent === 'person') openChoice('opponent', table.querySelector<HTMLElement>('[data-focus="opponent"]')!);
    },
    close: () => close(false),
  };
}
