import './result-picker.css';
import type { StudyClient } from './client';
import type { StudyDocument } from './browser-service';
import { evidenceRelation, measurementSummary, type MeasurementEvidence, type ResearchDocument } from './evidence';
import { MAX_RESULT_BYTES, type ResultCatalogue, type ResultRowPage, type ResultRunPage } from './measurement-service';

interface PickerOptions {
  client: StudyClient;
  document: StudyDocument;
  save: (evidence: MeasurementEvidence) => Promise<boolean>;
  close: () => void;
  error: (error: unknown) => void;
  clearError: () => void;
}
const esc = (value: unknown): string => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** Keep only the visible pages and selected IDs. The worker holds the file. */
export function mountResultPicker(body: HTMLElement, options: PickerOptions): () => void {
  let active = true, busy = false;
  let catalogue: ResultCatalogue | undefined;
  let runs: ResultRunPage = { total: 0, offset: 0, runs: [] };
  let rows: ResultRowPage = { total: 0, offset: 0, rows: [] };
  let run = '', element = '';
  const selected = new Set<string>();
  const record: ResearchDocument = options.document.schema === 'kingdown-research/1' ? options.document : {
    schema: 'kingdown-research/1', document: options.document, plan: null, evidence: [],
  };
  const linked = new Set(record.evidence.flatMap(e => e.measurements.map(m => m.id)));
  body.classList.add('study-result-picker');

  function cleanup(): void {
    if (!active) return;
    active = false;
    body.removeEventListener('click', click);
    body.removeEventListener('change', change);
    body.removeAttribute('aria-busy');
    // Post clear now, before another picker can post its open request.
    void options.client.clearResults().catch(() => {});
    selected.clear(); rows = { total: 0, offset: 0, rows: [] }; catalogue = undefined;
  }
  function close(): void { cleanup(); options.close(); }
  async function perform(action: () => Promise<void>): Promise<void> {
    if (!active || busy) return;
    options.clearError();
    busy = true; render();
    try { await action(); } catch (error) { if (active) options.error(error); }
    finally { if (active) { busy = false; render(); } }
  }
  function pageLabel(offset: number, count: number, total: number): string {
    return total ? `${offset + 1}–${offset + count} of ${total}` : '0';
  }
  function render(): void {
    body.setAttribute('aria-busy', String(busy));
    body.innerHTML = `<p>Choose a balance export, then select the measurements to keep with this study.</p>
      <input class="study-result-file" type="file" accept=".json,application/json" hidden ${busy ? 'disabled' : ''}>
      <button type="button" data-results="open" ${busy ? 'disabled' : ''}>Choose result file</button>
      <p class="study-result-note">${catalogue ? `${esc(catalogue.source.path)} · ${catalogue.total} measurements · ${catalogue.runCount} runs.` : 'JSON result file · at most 64 MiB.'} The file stays on this device.</p>
      ${catalogue ? `<details class="study-result-source"><summary>Result file source</summary><p>${esc(catalogue.source.path)}</p><p>SHA-256 ${esc(catalogue.source.sha256)}</p></details>
      <div class="study-result-fields"><label>Run<select name="run" ${busy ? 'disabled' : ''}>${runs.runs.map(r => `<option value="${esc(r.run)}" ${r.run === run ? 'selected' : ''}>${esc(r.run)} · ${r.count} rows</option>`).join('')}</select></label>
      <div class="study-result-pages"><button type="button" data-results="previous-runs" ${busy || runs.offset === 0 ? 'disabled' : ''}>Previous runs</button><span>${pageLabel(runs.offset, runs.runs.length, runs.total)} runs</span><button type="button" data-results="next-runs" ${busy || runs.offset + runs.runs.length >= runs.total ? 'disabled' : ''}>Next runs</button></div>
      <label>Element · exact name, optional<input name="element" value="${esc(element)}" ${busy ? 'disabled' : ''}></label></div>
      <ul class="study-result-rows">${rows.rows.map(m => `<li><label><input type="checkbox" data-result-id="${esc(m.id)}" ${selected.has(m.id) ? 'checked' : ''} ${busy || linked.has(m.id) ? 'disabled' : ''}><span>${esc(m.element)} · ${esc(m.criterion ?? m.measure)} <span class="study-result-tag">${esc(m.validity)}</span>${linked.has(m.id) ? ' · already linked' : ''}<small>${esc(measurementSummary(m))}</small><small>${esc(evidenceRelation(record, m))}</small></span></label><details><summary>Original context and full measurement</summary><p>Imported result. Raw sources are not checked here.</p><pre>${esc(JSON.stringify(m, null, 2))}</pre></details></li>`).join('')}</ul>
      ${rows.total === 0 ? '<p>No measurements match this run and element.</p>' : ''}
      <div class="study-result-pages"><button type="button" data-results="previous-rows" ${busy || rows.offset === 0 ? 'disabled' : ''}>Previous rows</button><span>${pageLabel(rows.offset, rows.rows.length, rows.total)} rows</span><button type="button" data-results="next-rows" ${busy || rows.offset + rows.rows.length >= rows.total ? 'disabled' : ''}>Next rows</button></div>` : ''}
      <p class="study-result-note" role="status">${selected.size} selected · limit 500. Original validity, intervals, rules and source hashes are kept. Linking does not make these results proof for this design.</p>
      <div class="study-result-actions"><button type="button" class="primary" data-results="link" ${busy || !selected.size ? 'disabled' : ''}>Link ${selected.size} measurements</button><button type="button" data-results="cancel">Cancel</button></div>`;
  }
  async function loadRows(nextRun: string, nextElement: string, offset = 0): Promise<void> {
    const page = await options.client.resultRows(catalogue!.token, { run: nextRun, ...(nextElement ? { element: nextElement } : {}), offset, limit: 100 });
    if (!active) return;
    run = nextRun; element = nextElement; rows = page;
  }
  function click(event: Event): void {
    const button = (event.target as Element).closest<HTMLButtonElement>('button[data-results]');
    if (!button || button.disabled) return;
    const action = button.dataset.results;
    if (action === 'cancel') { close(); return; }
    if (busy) return;
    if (action === 'open') { body.querySelector<HTMLInputElement>('.study-result-file')!.click(); return; }
    void perform(async () => {
      if (action === 'link') {
        const evidence = await options.client.selectResults(catalogue!.token, [...selected]);
        if (!active) return;
        const saved = await options.save(evidence);
        if (active && saved) close();
      } else if (action === 'next-runs' || action === 'previous-runs') {
        const page = await options.client.resultRuns(catalogue!.token, { offset: runs.offset + (action === 'next-runs' ? 100 : -100), limit: 100 });
        if (!active) return;
        const nextRun = page.runs[0]?.run ?? '';
        const nextRows = nextRun ? await options.client.resultRows(catalogue!.token, { run: nextRun, ...(element ? { element } : {}), limit: 100 }) : { total: 0, offset: 0, rows: [] };
        if (!active) return;
        runs = page; run = nextRun; rows = nextRows;
      } else if (action === 'next-rows' || action === 'previous-rows') {
        await loadRows(run, element, rows.offset + (action === 'next-rows' ? 100 : -100));
      }
    });
  }
  function change(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!active || busy) return;
    if (input.matches('.study-result-file')) {
      const file = input.files?.[0];
      if (!file) return;
      void perform(async () => {
        if (file.size > MAX_RESULT_BYTES) throw new Error('Result file must be at most 64 MiB.');
        const opened = await options.client.openResults(file, file.name);
        if (!active) return;
        catalogue = opened; selected.clear(); element = ''; run = opened.runs[0]?.run ?? '';
        runs = { total: opened.runCount, offset: 0, runs: opened.runs };
        rows = { total: 0, offset: 0, rows: [] };
        if (run) await loadRows(run, '');
      });
    } else if (input.name === 'run' || input.name === 'element') {
      void perform(() => loadRows(input.name === 'run' ? input.value : run, input.name === 'element' ? input.value : element));
    } else if (input.dataset.resultId) {
      const id = input.dataset.resultId;
      if (input.checked && selected.size >= 500) { input.checked = false; options.error(new Error('Select at most 500 measurements.')); return; }
      if (input.checked) selected.add(id); else selected.delete(id);
      render();
      body.querySelectorAll<HTMLInputElement>('[data-result-id]').forEach(box => { if (box.dataset.resultId === id) box.focus(); });
    }
  }
  body.addEventListener('click', click);
  body.addEventListener('change', change);
  render();
  return cleanup;
}
