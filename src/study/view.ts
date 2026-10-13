import './view.css';
import { PaintedView } from '../render/PaintedView';
import { colorOf, findKing, inCheck, nameOf, sqName, typeOf } from '../rules/engine';
import { clickPath, marksModel, railsOf } from '../marks-model';
import { checkersOf } from '../move-text';
import { pieceArt } from '../ui/guide';
import { BODY_TYPE } from '../workshop/moves';
import { figureUrl, selectedFigure } from '../workshop/figures';
import { designCode, parseDesign, specOf, type PieceDesign } from '../workshop/model';
import { esc } from '../workshop/text';
import { createStudyClient } from './client';
import { studyOf, withChecks, type StudyDocument, type StudyResult } from './browser-service';
import { loadStudies, saveStudyDocument } from './store';
import { exampleStudies } from './examples';
import { positionOf, withRules } from './model';
import type { Fact, StudyReport, StudyTest } from './check';

const button = (act: string, label: string): string => `<button type="button" data-study="${act}">${label}</button>`;
const copy = <T>(v: T): T => structuredClone(v);

/** One full-state study, separate from the Workshop's Try board and the live game. */
export function studyDialog(parent: HTMLElement): { open(design: PieceDesign): Promise<void> } {
  const dlg = document.createElement('dialog');
  dlg.className = 'pg-sheet study'; dlg.id = 'study'; dlg.setAttribute('aria-labelledby', 'study-heading');
  dlg.innerHTML = `<header class="study-top">${button('back', '‹ Proving Ground')}<h2 id="study-heading">Studies</h2></header>
    <div class="study-main"><aside class="study-about"></aside><section class="study-boardcol">
    <p class="study-state" aria-live="polite"></p><div class="study-board" tabindex="0" role="group" aria-label="Study board. Use arrow keys and Enter to choose a square."></div>
    <p class="study-hint" role="status"></p><div class="study-play">${button('undo', 'Undo')}${button('actions', 'Legal actions')}</div></section></div>
    <footer class="study-strip"><small class="study-label"></small>${button('save', 'Save study')}${button('test', 'Test')}${button('results', 'Results')}${button('more', 'More')}</footer>
    <p class="study-alert" role="alert" hidden></p><p class="study-notice" role="status"></p>
    <input class="study-import" type="file" accept=".json,application/json" hidden>`;
  parent.append(dlg);
  const q = <T extends Element = HTMLElement>(selector: string): T => dlg.querySelector(selector)!;
  const client = createStudyClient(), host = q('.study-board'), view = new PaintedView(host, { floor: null, webInk: true });
  view.setPace('off');
  let data: StudyResult | null = null, report: StudyReport | null = null;
  let dirty = false, busy = false, selected: number | null = 27, cursor = 27, currentDesign: PieceDesign;
  let panel: HTMLDialogElement | null = null;
  const error = (value: unknown): void => {
    const message = value instanceof Error ? value.message : String(value);
    q('.study-alert').textContent = message; q('.study-alert').hidden = false;
    if (panel?.open) {
      let alert = panel.querySelector<HTMLElement>('.study-panel-alert');
      if (!alert) { alert = document.createElement('p'); alert.className = 'study-alert study-panel-alert'; alert.setAttribute('role', 'alert'); panel.querySelector('header')!.after(alert); }
      alert.textContent = message;
    }
  };
  const clearError = (): void => { q('.study-alert').hidden = true; panel?.querySelector('.study-panel-alert')?.remove(); };
  const notice = (text: string): void => { q('.study-notice').textContent = text; };
  const documentOf = (): StudyDocument => data!.document;
  const study = () => studyOf(documentOf());
  const testOf = (): StudyTest | null => data?.document.schema === 'kingdown-test/1' ? data.document : null;

  function sheet(title: string, html: string, wire?: (body: HTMLElement, close: () => void) => void): void {
    panel?.close();
    const s = document.createElement('dialog'), opener = document.activeElement as HTMLElement | null;
    s.className = 'pg-sheet study-panel'; s.setAttribute('aria-labelledby', 'study-panel-heading');
    s.innerHTML = `<header><h2 id="study-panel-heading" tabindex="-1" autofocus>${esc(title)}</h2><button type="button" aria-label="Close">×</button></header><div class="pg-sheet-body">${html}</div>`;
    dlg.append(s); panel = s;
    const close = (): void => s.close();
    s.querySelector('header button')!.addEventListener('click', close);
    s.addEventListener('close', () => { s.remove(); if (panel === s) panel = null; if (opener?.isConnected) opener.focus(); });
    wire?.(s.querySelector('.pg-sheet-body')!, close); s.showModal();
  }
  function render(): void {
    dlg.querySelectorAll<HTMLButtonElement>('.study-strip button:not([data-study="more"]),.study-play button').forEach(b => b.disabled = busy || !data);
    if (!data) return;
    const s = study(), pos = positionOf(data.snapshot.position), d = s.design && parseDesign(s.design.code);
    const art = d && ((!d.look.figure && d.look.body !== 'token' && pieceArt(BODY_TYPE[d.look.body], false)) || figureUrl(selectedFigure(d).id, 0));
    q('.study-about').innerHTML = `<h3>${esc(d?.name ?? s.title)}</h3><p>Constructed study · version ${s.version}</p>${art ? `<img src="${esc(art)}" alt="">` : ''}<p>${esc(s.question)}</p>`;
    q('.study-state').textContent = `${pos.turn ? 'Black' : 'White'} to act · ${data.snapshot.status} · ${s.actions.length} recorded actions`;
    q('.study-label').textContent = `${s.title}${dirty ? ' · not saved' : ' · saved'}`;
    q<HTMLButtonElement>('[data-study="undo"]').disabled = busy || !s.actions.length;
    withRules(s.rules, () => {
      const choices = data!.moves.filter(m => m.move.from === selected && !m.move.power).map(m => m.move);
      const marks = marksModel(choices);
      view.sync(pos); view.highlight({ selected, ...marks, check: inCheck(pos) ? findKing(pos.board, pos.turn) : null,
        checkers: checkersOf(pos), rails: selected === null ? [] : railsOf(pos.board, selected, [...marks.moves, ...marks.captures], marks.captures) });
      const at = selected === null ? 0 : pos.board[selected];
      q('.study-hint').textContent = at ? `${nameOf(typeOf(at))} on ${sqName(selected!)} · ${choices.length ? 'Choose a marked square.' : 'No ordinary move. Open Legal actions for all choices.'}` : 'Choose a piece or open Legal actions.';
      host.setAttribute('aria-label', `Study board. ${sqName(cursor)}: ${pos.board[cursor] ? `${colorOf(pos.board[cursor]) ? 'Black' : 'White'} ${nameOf(typeOf(pos.board[cursor]))}` : 'empty'}. Arrow keys move; Enter selects.`);
    });
    view.setPreview(cursor);
  }
  async function run(work: () => Promise<void>): Promise<void> {
    if (busy) return;
    busy = true; dlg.setAttribute('aria-busy', 'true'); clearError(); render();
    try { await work(); } catch (e) { error(e); }
    finally { busy = false; dlg.removeAttribute('aria-busy'); render(); }
  }
  function persist(): boolean {
    if (!data) return false;
    const records = loadStudies();
    if (records.error) { error(`Study not saved. ${records.error} Export a copy from More.`); return false; }
    const doc = copy(documentOf()), s = studyOf(doc), versions = records.documents.map(studyOf).filter(x => x.id === s.id);
    if (dirty && versions.length) { s.parentVersion = s.version; s.version = Math.max(s.version, ...versions.map(x => x.version)) + 1; }
    const saved = saveStudyDocument(doc);
    if (!saved.ok) { error(`Study not saved. ${saved.error} Export a copy from More.`); return false; }
    data.document = doc; dirty = false; notice('Saved on this device.'); render(); return true;
  }
  async function load(input: unknown, saved = false): Promise<void> {
    const next = await client.request({ type: 'inspect', document: input });
    // Validate first, then preserve the current draft before changing the screen.
    if (dirty && !persist()) return;
    data = next; dirty = !saved; report = null; selected = 27; cursor = 27; notice(''); render();
    await view.ready(); dlg.dataset.ready = 'true';
  }
  async function play(lan: string): Promise<void> {
    await run(async () => {
      data = await client.request({ type: 'play', document: documentOf(), lan });
      dirty = true; report = null; selected = null; notice(`Played ${lan}.`);
    });
  }
  function choose(square: number): void {
    if (!data || busy) return;
    cursor = square;
    const choices = data.moves.filter(m => !m.move.power && m.move.from === selected && clickPath(m.move)[0] === square);
    if (choices.length === 1) { void play(choices[0].lan); return; }
    if (choices.length > 1) { actions(choices); return; }
    selected = data.snapshot.position.board[square] ? square : null; render();
  }
  view.onSquareClick = choose;
  host.addEventListener('keydown', e => {
    const delta = ({ ArrowLeft: -1, ArrowRight: 1, ArrowUp: 8, ArrowDown: -8 } as Record<string, number>)[e.key];
    if (delta) { e.preventDefault(); cursor = Math.max(0, Math.min(63, cursor + delta)); render(); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(cursor); }
  });
  function actions(items = data!.moves): void {
    sheet('Legal actions', `<p>Each button plays one complete legal action.</p><div class="study-actions">${items.map((m, i) => `<button type="button" data-move="${i}">${esc(m.lan)}</button>`).join('') || '<p>No legal action.</p>'}</div>`, (body, close) => {
      body.querySelectorAll<HTMLButtonElement>('[data-move]').forEach(b => b.onclick = () => { close(); void play(items[Number(b.dataset.move)].lan); });
    });
  }
  function results(): void {
    if (!report) { sheet('Results', '<p>No result for this version yet. Open Test to run the declared checks.</p>'); return; }
    sheet('Results', `<p><strong>${esc(report.status)} · ${report.facts.filter(f => f.passed).length} of ${report.facts.length} checks pass</strong></p>${report.error ? `<p>${esc(report.error)}</p>` : ''}
      <ul>${report.facts.map(f => `<li>${esc(f.label)} · after action ${f.after} · ${f.passed ? 'as expected' : `expected ${esc(JSON.stringify(f.expected))}; got ${esc(JSON.stringify(f.actual))}`}</li>`).join('')}</ul>
      <details><summary>Coverage and support limits</summary><ul>${report.coverage.map(c => `<li>${esc(c.items.join(' + '))}: ${c.state}. ${esc(c.reason)}</li>`).join('')}</ul></details>
      <details><summary>Observed state changes · ${report.trace.length} actions</summary><ol>${report.trace.map(t => `<li>${esc(t.action)}: ${esc(t.changes.map(c => c.field).join(', '))}</li>`).join('')}</ol><p>These are state changes, not proof of which rule causes them.</p></details>
      <p>These checks do not measure balance or enjoyment.</p>`);
  }
  function tests(): void {
    const test = testOf();
    sheet('Test this position', `<p>${test ? `${test.checks.length} declared checks. Index 0 is before the recorded actions. Add another check before removing the last one.` : 'Add an expected fact before running a test.'}</p>
      <ul>${test?.checks.map(f => `<li>${esc(f.label)} · action ${f.after} <button type="button" data-remove="${esc(f.id)}" ${test.checks.length === 1 ? 'disabled' : ''} aria-label="Remove ${esc(f.label)}">Remove</button></li>`).join('') ?? ''}</ul>
      <form class="study-fact"><label>Action <input name="lan" required maxlength="1024" placeholder="Td4-e4" list="study-legal"></label><datalist id="study-legal">${data!.snapshot.legal.map(l => `<option value="${esc(l)}">`).join('')}</datalist>
      <label>Expected <select name="expected"><option value="yes">Legal</option><option value="no">Refused</option></select></label><button type="submit">Add check at this position</button></form>
      <button type="button" data-run ${test ? '' : 'disabled'}>Run checks</button>`, (body, close) => {
      body.querySelector<HTMLFormElement>('form')!.onsubmit = e => {
        e.preventDefault(); const form = new FormData(e.currentTarget as HTMLFormElement), lan = String(form.get('lan')).trim();
        const fact: Fact = { id: crypto.randomUUID(), label: `${lan} ${form.get('expected') === 'yes' ? 'legal' : 'refused'}`, after: study().actions.length, kind: 'legal', lan, expected: form.get('expected') === 'yes' };
        void run(async () => { await changeFacts([...(test?.checks ?? []), fact]); close(); tests(); });
      };
      body.querySelectorAll<HTMLButtonElement>('[data-remove]').forEach(b => b.onclick = () => void run(async () => { await changeFacts(test!.checks.filter(f => f.id !== b.dataset.remove)); close(); tests(); }));
      body.querySelector<HTMLButtonElement>('[data-run]')!.onclick = () => void run(async () => {
        const checked = await client.request({ type: 'check', document: documentOf() }); report = checked.report!; close(); results();
      });
    });
  }
  async function changeFacts(checks: Fact[]): Promise<void> {
    const doc = withChecks(documentOf(), checks);
    data = await client.request({ type: 'inspect', document: doc }); dirty = true; report = null;
  }
  function library(): void {
    const saved = loadStudies(), examples = exampleStudies(__STUDY_SOURCE__);
    const all = [...saved.documents, ...examples];
    sheet('Open study', `<p>Your current draft is saved before another study opens.</p>${all.map((d, i) => `<button type="button" data-open="${i}">${i < saved.documents.length ? 'Saved' : 'Example'} · ${esc(studyOf(d).title)} · version ${studyOf(d).version}</button>`).join('')}`, (body, close) => {
      body.querySelectorAll<HTMLButtonElement>('[data-open]').forEach(b => b.onclick = () => void run(async () => { const i = Number(b.dataset.open); await load(all[i], i < saved.documents.length); close(); }));
    });    if (saved.error) error(saved.error);
  }
  function draft(design?: PieceDesign): StudyDocument {
    const doc = exampleStudies(__STUDY_SOURCE__)[0];
    doc.study.id = crypto.randomUUID(); doc.study.actions = [];
    doc.checks = doc.checks.filter(c => c.after === 0);
    doc.coverage[0].checks = doc.checks.map(c => c.id);
    if (!design) return doc;
    const d = copy(design), code = designCode(d);
    doc.study.design = { code, version: 1 }; doc.study.rules.design = { ...specOf(d), code };
    doc.study.title = `${d.name} study`; doc.study.question = `Which moves and interactions does ${d.name} allow?`;
    return doc.study;
  }
  function saveSheet(): void {
    sheet('Save study', `<form><label>Title <input name="title" maxlength="500" required value="${esc(study().title)}"></label><label>Design question <textarea name="question" maxlength="10000" required>${esc(study().question)}</textarea></label><button type="submit">Save on this device</button></form>`, (body, close) => {
      body.querySelector('form')!.onsubmit = e => {
        e.preventDefault(); const form = new FormData(e.currentTarget as HTMLFormElement), doc = copy(documentOf());
        studyOf(doc).title = String(form.get('title')).trim(); studyOf(doc).question = String(form.get('question')).trim();
        void run(async () => { const changed = JSON.stringify(doc) !== JSON.stringify(documentOf()); data = await client.request({ type: 'inspect', document: doc }); dirty ||= changed; close(); persist(); });
      };
    });
  }
  function more(): void {
    sheet('Study', `<div class="study-options">${button('open', 'Open study')}${button('import', 'Import file')}${data ? button('export', 'Export copy') : ''}${button('new', `New study with ${esc(currentDesign.name)}`)}</div>
      <details><summary>Support limits</summary><p>One distinct design per study. History conditions are not supported. All positions are constructed. Entity identity and causal events are not yet tracked.</p><p>Import a study file for other boards, cards, powers or rules. A source mismatch is refused.</p></details>`);
  }
  const file = q<HTMLInputElement>('.study-import');
  file.onchange = () => void run(async () => {
    const selectedFile = file.files?.[0]; file.value = ''; if (!selectedFile) return;
    if (selectedFile.size > 1_000_000) throw new Error('Study file exceeds 1 MB.');
    await load(JSON.parse(await selectedFile.text())); panel?.close();
  });
  dlg.addEventListener('click', e => {
    const act = (e.target as Element).closest<HTMLElement>('[data-study]')?.dataset.study;
    if (!act || busy) return;
    if (act === 'back') dlg.close();
    else if (act === 'save') saveSheet();
    else if (act === 'test') tests();
    else if (act === 'results') results();
    else if (act === 'more') more();
    else if (act === 'actions') actions();
    else if (act === 'open') library();
    else if (act === 'import') file.click();
    else if (act === 'new') void run(async () => { await load(draft(currentDesign)); panel?.close(); });
    else if (act === 'undo') void run(async () => { data = await client.request({ type: 'undo', document: documentOf() }); dirty = true; report = null; selected = null; notice('Last action undone.'); });
    else if (act === 'export') {
      const doc = copy(documentOf()), exported = studyOf(doc);
      // A draft copy has its own identity, so it cannot replace an immutable saved version.
      if (dirty) { exported.id = crypto.randomUUID(); exported.version = 1; exported.parentVersion = null; }
      const url = URL.createObjectURL(new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' }));
      const a = document.createElement('a'); a.href = url; a.download = `${exported.id}-v${exported.version}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); notice('Copy exported.');
    }
  });
  dlg.addEventListener('close', () => { panel?.close(); parent.querySelector<HTMLButtonElement>('.pg-more')?.focus(); });
  return { async open(design) {
    currentDesign = copy(design); if (!dlg.open) dlg.showModal();
    if (!data) await run(() => load(draft())); else render();
  } };
}
