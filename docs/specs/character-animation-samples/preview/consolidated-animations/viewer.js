const $ = id => document.getElementById(id);
const canvas = $('canvas'), ctx = canvas.getContext('2d');
const labels = { ready: 'Ready', 'awaiting-human-playback-review': 'Pending visual review', 'needs-repair': 'Needs repair' };
const initial = new URLSearchParams(location.search);
let entries = [], bank, bankKind, tracks = [], current = 0, elapsed = 0, playing = false, anchor = 0, anchorTime = 0, request = 0;

async function json(url) {
  const response = await fetch(url);
  if (!response.ok) throw Error(`${response.status}: ${url}`);
  return response.json();
}
function pause() { playing = false; $('play').textContent = 'Play'; }
function start() { playing = true; anchor = performance.now(); anchorTime = elapsed; $('play').textContent = 'Pause'; }
function turnTime(time) {
  const cycle = bank.selectedSchedule?.previewCycle || bank.schedule?.previewCycle || {};
  const start = cycle.startHoldMs ?? 0, forward = cycle.forwardMs ?? bank.durationMs;
  const end = cycle.endHoldMs ?? 200, reverse = cycle.reverseMs ?? bank.durationMs, final = cycle.finalHoldMs ?? 200;
  let phase = time % (start + forward + end + reverse + final);
  if (phase < start) return 0;
  phase -= start;
  if (phase < forward) return phase / forward * bank.durationMs;
  phase -= forward;
  if (phase < end) return bank.durationMs;
  phase -= end;
  if (phase < reverse) return (1 - phase / reverse) * bank.durationMs;
  return 0;
}
function at(frames, time, useSchedule = false) {
  if (frames.some(item => Array.isArray(item.visibleIntervalMs))) {
    return frames.findLast(item => item.visibleIntervalMs?.[0] <= time && time <= item.visibleIntervalMs[1]);
  }
  const sampling = [bank?.sampling, bank?.schedule?.sampling, bank?.selectedSchedule?.sampling, bank?.approvedPlayerSchedule?.sampling];
  const floor = sampling.some(value => typeof value === 'string' && /\bfloor\b/.test(value));
  if (useSchedule && !floor && (bankKind === 'turn' || sampling.some(value => value === 'nearest' || typeof value === 'string' && /Math\.round\(progress\s*\*\s*\(frameCount\s*-\s*1\)\)/.test(value)))) {
    return frames[Math.round(Math.min(1, Math.max(0, time / bank.durationMs)) * (frames.length - 1))];
  }
  const frame = frames.findLast(item => item.timeMs <= time);
  const end = frame?.endMs ?? (frame?.durationMs == null ? null : frame.timeMs + frame.durationMs);
  return end != null && time >= end ? null : frame;
}
function draw(time) {
  current = time;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const track of tracks) {
    const frame = at(track.frames, time, true), effect = at(track.effects, time);
    if (frame) ctx.drawImage(frame.image, 0, 0);
    if (effect) ctx.drawImage(effect.image, 0, 0);
  }
  $('seek').value = String(time);
  $('time').textContent = `${Math.round(time)} / ${bank?.durationMs || 0} ms`;
}
function resize() {
  if (!bank) return;
  const scale = $('scale').value === 'native' ? 1 : bank.boardScale || 160 / canvas.height;
  canvas.style.width = `${canvas.width * scale}px`;
  $('metadata').textContent = `${canvas.width} × ${canvas.height} px · ${bank.frames.length} timed frames · ${bank.durationMs} ms · Display ${Math.round(scale * 100)}%`;
}
async function select() {
  const token = ++request;
  pause(); bank = undefined; tracks = []; elapsed = 0; draw(0);
  $('play').disabled = $('seek').disabled = true;
  const entry = $('action').value === '' ? null : entries[Number($('action').value)];
  $('details').hidden = !entry;
  if (!entry) { $('message').textContent = 'No actions match these filters. Choose another status, character or army.'; return; }
  const params = new URLSearchParams();
  if ($('status').value) params.set('status', $('status').value);
  params.set('character', entry.character); params.set('army', entry.army);
  params.set('id', entry.id); history.replaceState(null, '', '?' + params);
  $('bank-status').textContent = labels[entry.status] || entry.status;
  $('defects').replaceChildren(...(entry.defects.length ? entry.defects : [entry.statusReason || 'No defects are recorded in this selection.']).map(text => {
    const li = document.createElement('li'); li.textContent = text; return li;
  }));
  for (const [id, url] of [['bank-link', entry.manifest], ['source-link', entry.sourceManifest], ['audit-link', entry.auditReport]]) $(id).href = url;
  $('review-link').hidden = !entry.visualReview;
  if (entry.visualReview) $('review-link').href = entry.visualReview.url;
  $('message').textContent = 'Loading frozen RGBA frames…';
  try {
    const url = new URL(entry.manifest, document.baseURI), selected = await json(url);
    if (token !== request) return;
    $('provenance').textContent = JSON.stringify(selected._consolidation);
    if (!selected.frames?.length) {
      if (token !== request) return;
      $('metadata').textContent = 'No frame bank is recorded for this selection.';
      $('message').textContent = 'This selection has no frames. Its source status is retained in the catalog.';
      return;
    }
    const images = new Map();
    async function load(frame) {
      const imageUrl = new URL(frame.url, url).href;
      if (!images.has(imageUrl)) images.set(imageUrl, (async () => {
        const image = new Image(); image.src = imageUrl; await image.decode(); return image;
      })());
      return { ...frame, image: await images.get(imageUrl) };
    }
    const loaded = await Promise.all((selected.tracks || [selected]).map(async track => ({
      frames: await Promise.all(track.frames.map(load)), effects: await Promise.all((Array.isArray(track.effects) ? track.effects : []).map(load)),
    })));
    if (token !== request) return;
    bank = selected; bankKind = entry.kind || selected.kind; tracks = loaded;
    [canvas.width, canvas.height] = bank.canvasSize || [tracks[0].frames[0].image.width, tracks[0].frames[0].image.height];
    canvas.setAttribute('aria-label', `${entry.character}, ${entry.army}, ${entry.id}`);
    $('provenance').textContent = JSON.stringify(bank._consolidation);
    $('seek').max = String(bank.durationMs);
    $('play').disabled = $('seek').disabled = false;
    $('message').textContent = 'Frozen RGBA frames loaded. Use Play or move the time slider.';
    resize(); draw(0);
  } catch (error) {
    if (token === request) $('message').textContent = `Cannot load this bank: ${error.message}. Select another action or check the frozen bank link.`;
  }
}
function filter(first = false) {
  const old = $('action').value;
  const matches = entries.map((entry, index) => ({ entry, index })).filter(({ entry }) => ['status', 'character', 'army'].every(key => !$(key).value || entry[key] === $(key).value));
  $('action').replaceChildren(...matches.map(({ entry, index }) => new Option(`${entry.character} · ${entry.army} · ${entry.kind || entry.action || ''} · ${entry.direction || entry.from && `${entry.from}→${entry.to}` || entry.id}`, String(index))));
  $('action').disabled = !matches.length;
  if (matches.some(item => String(item.index) === old)) $('action').value = old;
  if (first) {
    const selected = matches.find(({ entry }) => entry.id === initial.get('id'));
    if (selected) $('action').value = String(selected.index);
  }
  void select();
}
$('play').onclick = () => playing ? pause() : start();
$('seek').oninput = () => {
  pause();
  const time = Number($('seek').value), cycle = bank.selectedSchedule?.previewCycle || bank.schedule?.previewCycle || {};
  if (bankKind === 'turn') {
    const start = cycle.startHoldMs ?? 0, forward = cycle.forwardMs ?? bank.durationMs;
    const end = cycle.endHoldMs ?? 200, reverse = cycle.reverseMs ?? bank.durationMs, final = cycle.finalHoldMs ?? 200;
    const phase = elapsed % (start + forward + end + reverse + final);
    const returning = phase >= start + forward && phase < start + forward + end + reverse;
    elapsed = returning ? start + forward + end + (1 - time / bank.durationMs) * reverse : start + time / bank.durationMs * forward;
  } else elapsed = time;
  draw(time);
};
$('speed').onchange = () => { if (playing) start(); };
$('background').onchange = () => { $('stage').dataset.background = $('background').value; };
$('scale').onchange = resize;
$('action').onchange = select;
for (const key of ['status', 'character', 'army']) $(key).onchange = () => filter();
function tick(now) {
  if (playing && bank) {
    elapsed = anchorTime + (now - anchor) * Number($('speed').value);
    // A turn returns through its outward frames instead of snapping from last to first.
    draw(bankKind === 'turn' ? turnTime(elapsed) : elapsed % bank.durationMs);
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
try {
  entries = (await json('./manifest.json')).entries;
  // Resolve the unique action before filters: its status can change after a review.
  if (initial.has('id') && initial.has('character') && initial.has('army')) {
    const selected = entries.find(e => e.id === initial.get('id') && e.character === initial.get('character') && e.army === initial.get('army'));
    if (selected && initial.has('status')) initial.set('status', selected.status);
  }
  for (const key of ['status', 'character', 'army']) {
    for (const value of [...new Set(entries.map(entry => entry[key]))].sort()) $(key).add(new Option(labels[value] || value, value));
    if ([...$(key).options].some(option => option.value === initial.get(key))) $(key).value = initial.get(key);
  }
  $('summary').textContent = `${entries.length} selected actions · ` + [...new Set(entries.map(entry => entry.status))].map(status => `${entries.filter(entry => entry.status === status).length} ${labels[status] || status}`).join(' · ');
  filter(true);
} catch (error) { $('summary').textContent = 'Catalog unavailable.'; $('message').textContent = `Cannot load the catalog: ${error.message}. Run the consolidation importer, then reload this page.`; }
