/**
 * The New game dialog (index.html #new-game): three suggested games, the computer's level, a king
 * picker per side and a folded "More options". The dialog edits a copy of the next game's setup;
 * Start game hands it to main.ts, Cancel drops it.
 */
import type { SkillName } from './ai/skill';
import type { Side } from './game';
import { KINGS, PLAIN_KINGS, type Color, type KingChoice, type KingName, type PowerName, type Rules } from './rules/engine';
import { emblemArt, powerArt } from './power-motion';
import { POWER_NAME, powerOptions } from './powers-ui';

/** Play the computer (no powers), Kings' powers against the computer, or two people. */
export type Mode = 'computer' | 'powers' | 'two';
/** One side's king in the picker; `power: null` is "No power". */
export interface Pick { king: KingName; power: PowerName | null }
export interface Setup {
  mode: Mode;
  level: SkillName;
  /** The side the person plays against the computer. */
  side: Color;
  /** Two players: the "Kings' powers" box. */
  twoPowers: boolean;
  picks: [Pick, Pick];
  /** 'random', 'daily', 'classic', 'custom', an example army's code, or 'ogre'. */
  army: string;
}

export const LEVELS: readonly SkillName[] = ['beginner', 'casual', 'club', 'strong'];
export const isLevel = (v: unknown): v is SkillName => typeof v === 'string' && (LEVELS as readonly string[]).includes(v);
const KING_NAMES = Object.keys(KINGS) as KingName[];
const SIDE = ['White', 'Black'] as const;

export const defaultSetup = (): Setup => ({
  mode: 'computer', level: 'club', side: 0, twoPowers: false,
  picks: [{ king: PLAIN_KINGS[0], power: null }, { king: PLAIN_KINGS[1], power: null }],
  army: 'random',
});

export const powersOn = (s: Setup): boolean => s.mode === 'powers' || (s.mode === 'two' && s.twoPowers);
export const playersOf = (s: Setup): [Side, Side] =>
  s.mode === 'two' ? ['human', 'human'] : s.side ? ['ai', 'human'] : ['human', 'ai'];
/** The rules' kings: a king with "No power", and every king in a game without powers, is null. */
export const kingsOf = (s: Setup): [KingChoice | null, KingChoice | null] => {
  const one = (p: Pick): KingChoice | null => (powersOn(s) && p.power ? { king: p.king, power: p.power } : null);
  return [one(s.picks[0]), one(s.picks[1])];
};

const copy = (s: Setup): Setup => ({ ...s, picks: [{ ...s.picks[0] }, { ...s.picks[1] }] });

/** A new mode or Kings' powers box. Turning powers on gives each king with no power its first power. */
export function withMode(s: Setup, mode: Mode, twoPowers = s.twoPowers): Setup {
  const next = { ...copy(s), mode, twoPowers };
  if (!powersOn(s) && powersOn(next)) for (const p of next.picks) p.power ??= KINGS[p.king][0];
  return next;
}

/** A king's emblem pressed: that king, with its first power. */
export function withKing(s: Setup, c: Color, king: KingName): Setup {
  const next = copy(s);
  if (next.picks[c].king !== king) next.picks[c] = { king, power: KINGS[king][0] };
  return next;
}

/** The setup of a game in progress, for a saved game from before the dialog remembered its own. */
export function setupOfGame(sides: readonly [Side, Side], kings: readonly [KingChoice | null, KingChoice | null], level: SkillName): Setup {
  const s = defaultSetup(), humans = sides.filter(x => x === 'human').length, powered = !!(kings[0] || kings[1]);
  s.mode = humans === 2 ? 'two' : powered ? 'powers' : 'computer';
  s.twoPowers = humans === 2 && powered;
  s.side = humans === 1 && sides[1] === 'human' ? 1 : 0;
  s.level = level;
  kings.forEach((k, c) => { if (k) s.picks[c] = { ...k }; });
  return s;
}

/** A remembered setup, checked field by field; null when it is not one. */
export function parseSetup(v: unknown): Setup | null {
  const s = v as Partial<Setup> | null;
  const pick = (p: Partial<Pick> | undefined): Pick | null =>
    p && KING_NAMES.includes(p.king as KingName) && (p.power === null || KINGS[p.king as KingName].includes(p.power as PowerName))
      ? { king: p.king as KingName, power: p.power as PowerName | null } : null;
  if (!s || !['computer', 'powers', 'two'].includes(s.mode as string) || !isLevel(s.level) || (s.side !== 0 && s.side !== 1)
    || typeof s.twoPowers !== 'boolean' || typeof s.army !== 'string' || !Array.isArray(s.picks)) return null;
  const [w, b] = [pick(s.picks[0]), pick(s.picks[1])];
  return w && b ? { mode: s.mode as Mode, level: s.level, side: s.side, twoPowers: s.twoPowers, picks: [w, b], army: s.army } : null;
}

/* ---- the dialog ---- */

/**
 * Builds the king pickers (in the KINGS order of src/rules/rules.ts) and wires every control once.
 * `preset`: the page's `?rules=` preset, which the games it starts play over the official readings.
 */
export function newGameDialog(start: (s: Setup) => void, preset?: Partial<Rules>): { open(s: Setup): void } {
  const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;
  const dlg = $<HTMLDialogElement>('new-game');
  const radios = (name: string) => [...dlg.querySelectorAll<HTMLInputElement>(`input[name="${name}"]`)];
  let draft = defaultSetup();
  let options = new Map(powerOptions(preset).map(g => [g.king, g.options]));

  for (const c of [0, 1] as const) {
    $(`pick-${c}`).innerHTML = `<h3 id="pick-${c}-title">${SIDE[c]}'s king <span class="who"></span></h3>`
      + `<div class="emblems" role="group" aria-labelledby="pick-${c}-title">${KING_NAMES.map(k =>
        `<button type="button" class="emblem" data-king="${k}" aria-pressed="false" title="${k} king: ${KINGS[k].map(p => POWER_NAME[p]).join(' or ')}">`
        + emblemArt(k, `<img src="./ui/emblems/${k.toLowerCase()}.webp" alt="" width="128" height="128" decoding="async" />`)
        + `<span class="em-name">${k}</span></button>`).join('')}</div>`
      + `<div class="power-choice" role="group" aria-label="${SIDE[c]}'s power">`
      + '<button type="button" data-slot="0"></button><button type="button" data-slot="1"></button>'
      + `<button type="button" data-slot="none" data-power="">${powerArt(null)}<span class="pm-label">No power</span></button></div>`
      + `<p class="power-text" aria-live="polite"></p>`;
    for (const b of $(`pick-${c}`).querySelectorAll<HTMLButtonElement>('.emblem')) {
      b.onclick = () => { draft = withKing(draft, c, b.dataset.king as KingName); render(); };
    }
    for (const b of $(`pick-${c}`).querySelectorAll<HTMLButtonElement>('.power-choice button')) {
      b.onclick = () => {
        const slot = b.dataset.slot!, pick = draft.picks[c];
        pick.power = slot === 'none' ? null : KINGS[pick.king][+slot];
        render();
      };
    }
  }
  for (const r of radios('mode')) r.onchange = () => { draft = withMode(draft, r.value as Mode); render(); };
  for (const r of radios('level')) r.onchange = () => { draft.level = r.value as SkillName; };
  for (const r of radios('side')) r.onchange = () => { draft.side = +r.value as Color; render(); };
  $<HTMLInputElement>('two-powers').onchange = e => { draft = withMode(draft, draft.mode, (e.target as HTMLInputElement).checked); render(); };
  const army = $<HTMLSelectElement>('army');
  army.onchange = () => { draft.army = army.value; };
  $('start-game').onclick = () => start(copy(draft));

  function render(): void {
    for (const r of radios('mode')) r.checked = r.value === draft.mode;
    for (const r of radios('level')) r.checked = r.value === draft.level;
    for (const r of radios('side')) r.checked = +r.value === draft.side;
    $<HTMLInputElement>('two-powers').checked = draft.twoPowers;
    const two = draft.mode === 'two';
    $('level').hidden = $('side-choice').hidden = two;
    $('two-powers-row').hidden = !two;
    $('king-picker').hidden = !powersOn(draft);
    for (const c of [0, 1] as const) {
      const box = $(`pick-${c}`), { king, power } = draft.picks[c];
      box.querySelector('.who')!.textContent = two ? '' : c === draft.side ? '· you' : '· computer';
      for (const b of box.querySelectorAll<HTMLButtonElement>('.emblem')) b.setAttribute('aria-pressed', String(b.dataset.king === king));
      const opts = options.get(king)!;
      for (const b of box.querySelectorAll<HTMLButtonElement>('.power-choice button')) {
        const slot = b.dataset.slot!, p = slot === 'none' ? null : KINGS[king][+slot];
        // A new power gets its own vignette; the label is the button's text (the art has none).
        if (p && b.dataset.power !== p) { b.innerHTML = `${powerArt(p)}<span class="pm-label">${POWER_NAME[p]}</span>`; b.dataset.power = p; }
        if (p) b.title = opts[+slot].title;
        b.setAttribute('aria-pressed', String(p === power));
      }
      const chosen = power ? opts[KINGS[king].indexOf(power)] : null, line = box.querySelector('.power-text')!;
      const text = chosen ? `${chosen.label} — ${chosen.title}.` : 'No power: a plain chess king.';
      if (line.textContent !== text) line.textContent = text; // a live region: say only a change
    }
    army.value = draft.army;
    if (army.value !== draft.army) army.value = draft.army = 'random'; // an example army that is gone
  }

  return {
    open(s: Setup): void {
      draft = copy(s);
      options = new Map(powerOptions(preset).map(g => [g.king, g.options])); // the use counts of the rules in force
      render();
      dlg.showModal();
    },
  };
}
