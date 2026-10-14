import './measurement-form.css';
import { ALL_CARDS } from '../rules/rules';
import { POOL_2BEASTS } from '../rules/setup';
import { ALL_POWERS } from '../sim/tournament-plan';
import { baseDocument, studyOf, type StudyDocument } from './browser-service';
import type { StudyClient } from './client';
import type { SavedMeasurementPlan } from './evidence';
import type { MeasurementRequest } from './measurement-plan';
import type { MeasurementPlanResult } from './measurement-service';

const recipes = { activity: 'Piece activity', worth: 'Piece worth', field: 'Power field', 'four-cell': 'Two-factor interaction', 'cross-play': 'Power cross-play' } as const;
type Options = { client: StudyClient; document: StudyDocument; save: (plan: SavedMeasurementPlan) => Promise<boolean>; link: () => void; close: () => void; error: (error: unknown) => void; clearError: () => void };

/** The sheet owns its lifetime. A closed sheet ignores worker replies. */
export function mountMeasurementForm(body: HTMLElement, options: Options): () => void {
  const study = studyOf(options.document);
  const existing = options.document.schema === 'kingdown-research/1' ? options.document.plan : null;
  const original = existing?.definition.request;
  let active = true, generation = 0, busy = false, result: MeasurementPlanResult | undefined;
  const root = document.createElement('div'); root.className = 'measurement-form'; body.replaceChildren(root);
  const intro = document.createElement('p'); intro.append('Choose what to measure for ');
  const title = document.createElement('strong'); title.textContent = study.title; intro.append(title, '.'); root.append(intro);
  const note = (text: string, parent: HTMLElement = root) => { const p = document.createElement('p'); p.className = 'measurement-note'; p.textContent = text; parent.append(p); };
  note('Uses this study’s rules and design. New games start from population armies.');
  const form = document.createElement('form'); root.append(form);
  const fields = document.createElement('div'); fields.className = 'measurement-fields'; form.append(fields);
  const controls = new Map<string, HTMLInputElement | HTMLSelectElement>();
  function field(parent: HTMLElement, name: string, label: string, value: string | number, choices?: readonly (string | readonly [string, string])[], wide = false) {
    const wrap = document.createElement('label'); if (wide) wrap.className = 'measurement-wide'; wrap.append(label);
    const control = choices ? document.createElement('select') : document.createElement('input');
    control.name = name;
    if (control instanceof HTMLSelectElement) for (const choice of choices!) {
      const option = document.createElement('option'); option.value = typeof choice === 'string' ? choice : choice[0]; option.textContent = typeof choice === 'string' ? choice : choice[1]; control.append(option);
    }
    control.value = String(value); wrap.append(control); parent.append(wrap); controls.set(name, control); return control;
  }
  const recipe = field(fields, 'recipe', 'Test', original?.recipe ?? 'activity', Object.entries(recipes), true);
  const standard = POOL_2BEASTS, custom = 'TTTTTTT';
  const presets: [string, string][] = [...(study.rules.design ? [[custom, `${study.title} only`]] as [string, string][] : []), [standard, 'Standard pool'], ...(study.rules.design ? [[standard + 'T', `Standard pool + ${study.title}`]] as [string, string][] : []), ['custom', 'Custom pool']];
  const initialPool = original?.pool ?? (study.rules.design ? custom : standard);
  const preset = field(fields, 'poolPreset', 'Army pool', presets.some(p => p[0] === initialPool) ? initialPool : 'custom', presets, true);
  const pool = field(fields, 'pool', 'Pool letters', initialPool, undefined, true);
  function number(parent: HTMLElement, name: string, label: string, value: number | undefined, min: number, max: number) {
    const input = field(parent, name, label, value ?? '', undefined) as HTMLInputElement; input.type = 'number'; input.min = String(min); input.max = String(max); input.step = '1'; input.required = name !== 'powerPlies'; return input;
  }
  number(fields, 'pairs', 'Pairs', original?.pairs ?? 20, 1, 10000);
  number(fields, 'depth', 'Search depth', original?.depth ?? 2, 1, 20);
  const recipeFields = document.createElement('div'); recipeFields.className = 'measurement-fields'; form.append(recipeFields);
  const more = document.createElement('details'), summary = document.createElement('summary'); summary.textContent = 'More settings'; more.append(summary); form.append(more);
  const settings = document.createElement('div'); settings.className = 'measurement-fields'; more.append(settings);
  number(settings, 'seed', 'Seed', original?.seed ?? 214211, 0, 0xffffffff);
  number(settings, 'maxPlies', 'Game cap · plies', original?.maxPlies ?? 300, 1, 1000);
  number(settings, 'openingRandomPlies', 'Random opening plies', original?.openingRandomPlies ?? 4, 0, 100);
  number(settings, 'powerPlies', 'Power search plies (blank uses default)', original ? original.powerPlies : 2, 0, 20);
  note('The complete rules and saved design stay fixed. Existing evaluation settings stay with the plan.', more);
  note('Activity reports use, blocked turns, conditions and interactions. A report does not establish fun or fair value.', form);
  const status = document.createElement('p'); status.setAttribute('role', 'status'); root.append(status);
  const preview = document.createElement('section'); preview.className = 'measurement-preview'; root.append(preview);
  const actions = document.createElement('div'); actions.className = 'measurement-actions'; root.append(actions);
  function button(name: string, label: string, action: () => void) {
    const b = document.createElement('button'); b.type = 'button'; b.dataset.measurement = name; b.textContent = label; b.addEventListener('click', action); actions.append(b); return b;
  }
  const value = (name: string) => controls.get(name)!.value;
  const numeric = (name: string) => Number(value(name));
  const selected = (name: string) => Array.from((controls.get(name) as HTMLSelectElement).selectedOptions, o => o.value);
  function multi(name: string, label: string, choices: readonly string[], values: readonly string[]) {
    const select = field(recipeFields, name, label, '', choices, true) as HTMLSelectElement; select.multiple = true; select.size = Math.min(6, choices.length);
    for (const option of select.options) option.selected = values.includes(option.value);
  }
  function recipeInputs() {
    recipeFields.replaceChildren();
    if (recipe.value === 'worth') {
      field(recipeFields, 'pieces', 'Worth piece letters (no repeats)', original?.pieces ?? (study.rules.design ? 'T' : 'A'), undefined, true);
      field(recipeFields, 'vs', 'Reference piece', original?.vs ?? 'N', ['N', 'B', 'R', 'Q']);
    } else if (recipe.value === 'field' || recipe.value === 'cross-play') {
      multi('entrants', 'Named power entrants (select at least two)', ['none', ...ALL_POWERS], original?.entrants ?? ['none', 'Haste']);
    } else if (recipe.value === 'four-cell') {
      for (const i of [0, 1] as const) {
        const factor = original?.factors?.[i];
        const kind = field(recipeFields, `factor${i}Kind`, `Factor ${i + 1} type`, factor?.kind ?? 'piece', ['piece', 'card']);
        field(recipeFields, `factor${i}Piece`, `Factor ${i + 1} piece`, factor?.kind === 'piece' ? factor.piece : i === 0 ? 'A' : 'G', [...'ABRNGMLSO']);
        field(recipeFields, `factor${i}Replacement`, `Factor ${i + 1} replacement`, factor?.kind === 'piece' ? factor.replacement : 'N', ['B', 'N', 'R']);
        field(recipeFields, `factor${i}Card`, `Factor ${i + 1} card`, factor?.kind === 'card' ? factor.card : i === 0 ? 'Haste' : 'Flight', ALL_CARDS);
        kind.addEventListener('change', factorVisibility);
      }
      multi('cardPool', 'Card pool (select one or more)', ALL_CARDS, original?.cardPool ?? ['Haste', 'Flight']);
      note('Four-cell needs plain kings, empty saved hands and piles, no custom design, depth 1–4, at most 1,000 pairs, a cap of 2–500, four random opening plies and two power plies. Evaluation overrides and adjudication are unsupported.', recipeFields);
      factorVisibility();
    }
  }
  function factorVisibility() {
    for (const i of [0, 1]) {
      const isCard = value(`factor${i}Kind`) === 'card';
      for (const suffix of ['Piece', 'Replacement', 'Card']) controls.get(`factor${i}${suffix}`)!.parentElement!.hidden = (suffix === 'Card') !== isCard;
    }
  }
  function request(): MeasurementRequest {
    const r: MeasurementRequest = { recipe: recipe.value as MeasurementRequest['recipe'], start: 'population', pool: pool.value, pairs: numeric('pairs'), depth: numeric('depth'), seed: numeric('seed'), maxPlies: numeric('maxPlies'), openingRandomPlies: numeric('openingRandomPlies'), ...(value('powerPlies') === '' ? {} : { powerPlies: numeric('powerPlies') }), values: original?.values ?? {}, powerHold: original?.powerHold ?? {}, adjudicate: original?.adjudicate ?? false, ...(original?.powerHoldSides ? { powerHoldSides: original.powerHoldSides } : {}) };
    if (r.recipe === 'worth') { r.pieces = value('pieces'); r.vs = value('vs') as MeasurementRequest['vs']; }
    if (r.recipe === 'field' || r.recipe === 'cross-play') r.entrants = selected('entrants');
    if (r.recipe === 'four-cell') {
      const factor = (i: number): NonNullable<MeasurementRequest['factors']>[number] => value(`factor${i}Kind`) === 'piece' ? { kind: 'piece', piece: value(`factor${i}Piece`), replacement: value(`factor${i}Replacement`) } : { kind: 'card', card: value(`factor${i}Card`) as typeof ALL_CARDS[number] };
      r.factors = [factor(0), factor(1)]; r.cardPool = selected('cardPool') as typeof ALL_CARDS[number][];
    }
    return r;
  }
  function sync() {
    body.setAttribute('aria-busy', String(busy)); previewButton.disabled = busy; saveButton.disabled = busy || !result; editButton.disabled = busy; form.hidden = !!result; preview.hidden = !result; previewButton.hidden = !!result; saveButton.hidden = !result; editButton.hidden = !result;
  }
  function invalidate() { options.clearError(); generation++; busy = false; result = undefined; preview.replaceChildren(); status.textContent = ''; sync(); }
  function fail(error: unknown) { status.textContent = error instanceof Error ? error.message : String(error); options.error(error); }
  function show(data: MeasurementPlanResult) {
    const cost = document.createElement('div'); cost.className = 'measurement-cost';
    const count = document.createElement('strong'); count.textContent = `${data.preview.games} games`; cost.append(count, ` · ${data.preview.blocks} paired blocks`); preview.append(cost);
    const dl = document.createElement('dl'); preview.append(dl);
    const r = data.plan.definition.request;
    const input = data.plan.definition.input, plannedStudy = 'study' in input ? input.study : input;
    for (const [label, text] of [['Test', recipes[r.recipe]], ['Army pool', r.pool], ['Search depth', r.depth], ['Seed', r.seed], ['Game cap', `${r.maxPlies} plies`], ['Random opening', `${r.openingRandomPlies} plies`], ['Time and money', 'No measured estimate']]) {
      const dt = document.createElement('dt'), dd = document.createElement('dd'); dt.textContent = String(label); dd.textContent = String(text); dl.append(dt, dd);
    }
    const details = document.createElement('details'), heading = document.createElement('summary'); heading.textContent = 'Full settings and support limits'; details.append(heading); preview.append(details);
    const list = document.createElement('ul'); details.append(list);
    for (const limit of data.preview.limits) { const li = document.createElement('li'); li.textContent = limit; list.append(li); }
    const pre = document.createElement('pre'); pre.textContent = JSON.stringify({ request: r, rules: plannedStudy.rules, policy: data.preview.policy, measures: data.preview.measures, missingResults: data.preview.missingResults, source: data.plan.source, fingerprint: data.plan.fingerprint, contexts: data.plan.contexts }, null, 2); details.append(pre);
    note('Saving a plan starts no games. A campaign needs a separate run approval.', preview);
  }
  async function makePreview(saved = false) {
    if (busy || !active || !saved && !form.reportValidity()) return;
    options.clearError(); const attempt = ++generation; busy = true; status.textContent = 'Check plan…'; sync();
    try {
      const data = saved && existing ? await options.client.verifyPlan(existing) : await options.client.plan(baseDocument(options.document), request());
      if (!active || attempt !== generation) return;
      result = data; preview.replaceChildren(); show(data); status.textContent = 'Plan checked. No games start.';
    } catch (error) { if (active && attempt === generation) fail(error); }
    finally { if (active && attempt === generation) { busy = false; sync(); } }
  }
  const previewButton = button('preview', 'Preview plan', () => { void makePreview(); }); previewButton.className = 'primary';
  const saveButton = button('save', 'Save plan', () => { void save(); }); saveButton.className = 'primary';
  const editButton = button('edit', 'Edit settings', invalidate);
  button('link', 'Link existing results', () => { dispose(); options.link(); });
  button('cancel', 'Cancel', () => { dispose(); options.close(); });
  async function save() {
    if (!active || busy || !result) return;
    options.clearError(); const checked = result, attempt = ++generation; busy = true; sync();
    try { if (await options.save(checked.plan) && active && attempt === generation) { dispose(); options.close(); } }
    catch (error) { if (active && attempt === generation) fail(error); }
    finally { if (active && attempt === generation) { busy = false; sync(); } }
  }
  function changed(event: Event) {
    invalidate();
    if (event.target === recipe) recipeInputs();
    if (event.target === preset) { if (preset.value !== 'custom') pool.value = preset.value; pool.parentElement!.hidden = preset.value !== 'custom'; }
  }
  form.addEventListener('input', changed); form.addEventListener('change', changed);
  form.addEventListener('submit', event => { event.preventDefault(); void makePreview(); });
  function dispose() { active = false; generation++; body.setAttribute('aria-busy', 'false'); }
  recipeInputs(); pool.parentElement!.hidden = preset.value !== 'custom'; sync();
  if (existing) void makePreview(true);
  return dispose;
}
