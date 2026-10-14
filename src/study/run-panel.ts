import './run-panel.css';
import { esc } from '../workshop/text';
import type { StudyClient } from './client';
import { researchStatus, type ResearchDocument } from './evidence';
import { createRunClient } from './run-client';
import type { RunTarget, StudyRunSummary } from './run-types';

interface RunPanelOptions {
  document: ResearchDocument; saved: boolean; studyClient: StudyClient;
  close(): void; error(error: unknown): void; clearError(): void;
  link(file: Blob, filename: string): void;
  openDocument(document: ResearchDocument): Promise<boolean>;
}
export function mountRunPanel(body: HTMLElement, options: RunPanelOptions): () => void {
  const client = createRunClient();
  const study = options.document.document.schema === 'kingdown-test/1' ? options.document.document.study : options.document.document;
  let active = true, busy = false, connected = false, uncertain = false;
  let runs: StudyRunSummary[] = [], selected = '', target: RunTarget = 'm1';
  const canPrepare = options.saved && researchStatus(options.document).plan === 'current';
  const run = (): StudyRunSummary | undefined => runs.find(item => item.id === selected);
  function render(): void {
    if (!active) return;
    const current = run(), disabled = busy ? 'disabled' : '';
    body.setAttribute('aria-busy', String(busy));
    body.innerHTML = `<p>Run a saved measurement plan in the local studio.</p>
      <p role="status">${connected ? 'Local studio connected · transport is unverified.' : 'Local studio unavailable. Your study stays saved. Start the local studio, then connect again.'}${uncertain ? ' The approval reply was lost. Launch state is unknown. Refresh status before taking more action.' : ''}</p>
      <button data-runs="refresh" ${disabled}>${connected ? 'Refresh stored status' : 'Connect to local studio'}</button>
      <label>Run on<select name="run-target" ${disabled}><option value="m1" ${target === 'm1' ? 'selected' : ''}>M1</option><option value="kaggle" ${target === 'kaggle' ? 'selected' : ''}>Kaggle</option><option value="both" ${target === 'both' ? 'selected' : ''}>M1 and Kaggle</option></select></label>
      <button data-runs="prepare" ${busy || !connected || !canPrepare || uncertain ? 'disabled' : ''}>Prepare saved plan</button>
      ${!canPrepare ? '<p>Save a current measurement plan before you prepare a run.</p>' : ''}
      ${runs.length ? `<label>Study runs<select name="study-run" ${disabled}>${runs.map(item => `<option value="${esc(item.id)}" ${item.id === selected ? 'selected' : ''}>${esc(item.recipe)} · plan v${item.study.version} · ${esc(item.phase)} · ${esc(item.id)}</option>`).join('')}</select></label>` : '<p>No stored runs for this study.</p>'}
      ${current ? `<h3>${esc(current.study.title)} · ${esc(current.phase)}</h3><p>${current.games} games · ${current.blocks} paired blocks · plan v${current.study.version}</p>
      ${current.parts.map(part => `<section class="study-run-machine"><strong>${part.machine === 'm1' ? 'M1' : 'Kaggle'} · ${esc(part.state)}</strong><p>${part.completedGames === null ? 'Game count unknown' : `${part.completedGames} / ${part.games} games last observed`} · ${part.workers} workers</p><p>Last observed: ${esc(part.checkedAt ?? 'not checked')}<br>Next check: ${esc(part.nextCheckAt ?? 'not scheduled')}<br>Deadline: ${esc(part.deadline ?? 'not set')}</p>${part.error ? `<p>${esc(part.error)}</p>` : ''}</section>`).join('')}
      <p>Validation: ${esc(current.validation.state)} · ${current.validation.games} games · ${current.validation.legalReplays} legal replays · ${current.validation.illegalControls} illegal controls<br>${esc(current.validation.message)}</p>
      <p>Backup: ${esc(current.backup.state)}<br>${esc(current.backup.message)}</p>
      ${current.error ? `<p>${esc(current.error)}</p>` : ''}
      <details><summary>Source and full settings</summary><p>${esc(current.source)} · ${esc(current.commit)}</p><p>Bundle ${esc(current.bundleHash)}<br>Plan ${esc(current.planFingerprint)}</p><p>${esc(current.approvalText)}</p><p>Open this run's original study to inspect its saved plan.</p></details>
      ${current.phase === 'prepared' ? `<p class="study-run-approval">${esc(current.approvalText)}</p><button class="primary" data-runs="approve" ${busy || uncertain || !connected ? 'disabled' : ''}>Approve and start ${current.games} games</button>` : ''}
      ${current.phase === 'partial' ? '<p>The run is incomplete. These results do not meet the plan.</p>' : ''}
      ${['launch-unknown', 'attention-required'].includes(current.phase) ? '<p>This run needs attention. Refresh reads stored status. It does not launch work.</p>' : ''}
      ${current.result ? `<button data-runs="review" ${disabled}>Review results</button>` : ''}
      <button data-runs="open" ${disabled}>Open run's original study</button>` : ''}
      <p>Time and cost estimates are not measured. Refresh reads stored observations.</p><button data-runs="close">Close</button>`;
  }
  function remember(value: StudyRunSummary): void {
    if (!active) return;
    runs = [value, ...runs.filter(item => item.id !== value.id)]; selected = value.id;
  }
  async function perform(action: () => Promise<void>): Promise<void> {
    if (!active || busy) return;
    const focus = (body.ownerDocument.activeElement as HTMLElement | null)?.dataset.runs;
    busy = true; options.clearError(); render();
    try { await action(); } catch (error) { if (active) options.error(error); }
    finally { if (active) { busy = false; render(); if (focus) body.querySelector<HTMLButtonElement>(`[data-runs="${focus}"]:not(:disabled)`)?.focus(); } }
  }
  async function connect(): Promise<void> {
    connected = false;
    await client.connect();
    const list = await client.list(study.id);
    if (!active) return;
    connected = true; runs = list; if (!runs.some(item => item.id === selected)) selected = runs[0]?.id ?? '';
  }
  function click(event: Event): void {
    const button = (event.target as Element).closest<HTMLButtonElement>('button[data-runs]');
    if (!button || button.disabled) return;
    if (button.dataset.runs === 'close') { cleanup(); options.close(); return; }
    void perform(async () => {
      const current = run();
      switch (button.dataset.runs) {
        case 'refresh':
          if (!connected) await connect();
          else {
            try {
              const list = await client.list(study.id);
              const status = current ? await client.status(current.id) : undefined;
              if (active) { runs = list; if (status) { remember(status); if (status.phase !== 'prepared') uncertain = false; } }
            } catch (error) { if (active) connected = false; throw error; }
          }
          break;
        case 'prepare':
          if (!canPrepare || !connected || uncertain) return;
          selected = '';
          try { remember(await client.prepare(options.document, target)); }
          catch (error) { if (active) connected = false; throw error; }
          break;
        case 'approve':
          if (!current || uncertain) return;
          try { remember(await client.approve(current.id, crypto.randomUUID())); }
          catch (error) { if (active) uncertain = true; throw error; }
          break;
        case 'review':
          if (current?.result) { const file = await client.result(current); if (active) options.link(file, current.result.filename); }
          break;
        case 'open':
          if (current) { const original = await client.document(current.id); if (active && await options.openDocument(original) && active) { cleanup(); options.close(); } }
      }
    });
  }
  function change(event: Event): void {
    if (busy || !active) return;
    const input = event.target as HTMLSelectElement;
    if (input.name === 'run-target') target = input.value as RunTarget;
    if (input.name === 'study-run') { selected = input.value; render(); }
  }
  function cleanup(): void {
    active = false; client.close(); body.removeEventListener('click', click); body.removeEventListener('change', change); body.removeAttribute('aria-busy');
  }
  body.classList.add('study-run-panel'); body.addEventListener('click', click); body.addEventListener('change', change);
  render(); void perform(connect);
  return cleanup;
}
