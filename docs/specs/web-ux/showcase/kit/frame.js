// Optional demo chrome: a thin top bar with the demo's title, Phone or Desktop, Replay, Reduced motion
// and Notes (from the demo's meta.json). A classic script, not a module. Put it in <head>:
//
//   <script src="../../kit/frame.js"></script>
//
// How it works. Without ?bare=1 the page becomes a viewer: this script turns the rest of the demo page
// into hidden text, so the demo's own markup and code do not run here, and shows the bar and the demo
// itself in a frame (index.html?bare=1), full width (Desktop) or in a 390 x 844 phone (Phone).
// So a demo never has to make room for the bar. The script must be a plain <script src> in <head>
// (not async, not defer, not a module), before the demo's own styles and scripts.
// With ?bare=1 (the frame's own view, and kit/capture.mjs) this script only applies ?motion=reduce.
(function () {
  'use strict';
  const params = new URLSearchParams(location.search);
  const root = document.documentElement;
  if (params.get('motion') === 'reduce') root.dataset.motion = 'reduce';
  if (params.get('bare') === '1' || window.top !== window.self) { root.classList.add('is-bare'); return; }

  const KIT = new URL('.', document.currentScript.src).href;
  const store = {
    get(k, d) { try { return localStorage.getItem('kd-frame-' + k) ?? d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem('kd-frame-' + k, v); } catch { /* private mode */ } },
  };

  // The rest of the demo page belongs in the frame, not in the viewer: an open <plaintext> element takes
  // every byte after this script as text, so no markup, style or script after it takes effect.
  // (window.stop() does the same, but Chromium then never paints the page.)
  document.write('<plaintext hidden>');
  for (const el of document.querySelectorAll('link[rel="stylesheet"], style, script:not([src$="frame.js"])')) el.remove();
  const css = href => { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = KIT + href; document.head.appendChild(l); };
  css('tokens.css'); css('ui.css'); css('frame.css');
  if (!document.querySelector('meta[name="viewport"]')) {
    const m = document.createElement('meta'); m.name = 'viewport'; m.content = 'width=device-width, initial-scale=1'; document.head.appendChild(m);
  }
  if (!document.body) root.appendChild(document.createElement('body'));
  const body = document.body;
  body.replaceChildren();
  body.className = 'kdf';
  const title = document.title || 'Demo';

  let view = params.get('view') || store.get('view', 'desktop');
  let reduced = store.get('motion', '') === 'reduce' || params.get('motion') === 'reduce';
  let meta = null;

  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const ICON = {
    back: 'M15 6l-6 6 6 6', replay: 'M4 12a8 8 0 1 0 2.3-5.6M4 4v4.5h4.5', notes: 'M7 4h10a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM9 9h6M9 13h6M9 17h3',
    motion: 'M4 12h3l2-5 3 10 3-8 2 3h3', phone: 'M8 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM11 18h2',
    desktop: 'M4 5h16v11H4zM9 20h6M12 16v4', close: 'M6 6l12 12M18 6 6 18',
  };
  const icon = n => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${ICON[n]}"/></svg>`;

  body.innerHTML = `
    <header class="kdf-bar">
      <a class="btn btn-icon kdf-home" href="../../index.html" aria-label="All demos">${icon('back')}</a>
      <div class="kdf-title"><h1>${esc(title)}</h1><span class="pill kdf-group" hidden></span></div>
      <div class="kdf-actions">
        <div class="kdf-seg" role="group" aria-label="View">
          <button type="button" class="btn btn-quiet" data-view="phone" aria-pressed="false">${icon('phone')}<span>Phone</span></button>
          <button type="button" class="btn btn-quiet" data-view="desktop" aria-pressed="false">${icon('desktop')}<span>Desktop</span></button>
        </div>
        <button type="button" class="btn btn-quiet" id="kdf-replay">${icon('replay')}<span>Replay</span></button>
        <button type="button" class="btn btn-quiet" id="kdf-motion" aria-pressed="false">${icon('motion')}<span>Reduced motion</span></button>
        <button type="button" class="btn btn-quiet" id="kdf-notes">${icon('notes')}<span>Notes</span></button>
      </div>
    </header>
    <main class="kdf-stage"><div class="kdf-device"><iframe title="${esc(title)}" class="kdf-frame"></iframe></div></main>
    <dialog class="sheet kdf-sheet" aria-labelledby="kdf-notes-title">
      <div class="sheet-grip"></div>
      <div class="sheet-head"><h2 id="kdf-notes-title">Notes</h2><button type="button" class="btn btn-icon" data-close aria-label="Close">${icon('close')}</button></div>
      <div class="sheet-body kdf-notes-body"><p class="muted">No meta.json yet.</p></div>
    </dialog>`;

  const $ = s => body.querySelector(s);
  const frame = $('.kdf-frame'), device = $('.kdf-device'), stage = $('.kdf-stage'), sheet = $('.kdf-sheet');
  const src = () => { const u = new URL(location.href); u.searchParams.set('bare', '1'); u.searchParams.delete('view'); if (reduced) u.searchParams.set('motion', 'reduce'); else u.searchParams.delete('motion'); return u.href; };
  frame.src = src();

  const inner = () => frame.contentWindow;
  const applyMotion = () => {
    root.dataset.motion = reduced ? 'reduce' : '';
    $('#kdf-motion').setAttribute('aria-pressed', String(reduced));
    try { inner().document.documentElement.dataset.motion = reduced ? 'reduce' : ''; } catch { /* not loaded */ }
  };
  frame.addEventListener('load', applyMotion);

  // On a narrow screen the page is already phone sized: show the demo full size, with no phone around it.
  const shown = () => (view === 'phone' && innerWidth >= 560 ? 'phone' : 'desktop');
  const fit = () => {
    body.dataset.view = shown();
    if (shown() !== 'phone') { device.style.transform = ''; return; }
    const r = stage.getBoundingClientRect();
    const k = Math.min(1, (r.height - 32) / 868, (r.width - 32) / 414);
    device.style.transform = `scale(${Math.max(0.3, k)})`;
  };
  const setView = v => {
    view = v === 'phone' ? 'phone' : 'desktop';
    store.set('view', view);
    for (const b of body.querySelectorAll('[data-view]')) b.setAttribute('aria-pressed', String(b.dataset.view === view));
    fit();
  };
  for (const b of body.querySelectorAll('[data-view]')) b.addEventListener('click', () => setView(b.dataset.view));
  addEventListener('resize', fit);
  setView(view);

  $('#kdf-motion').addEventListener('click', () => { reduced = !reduced; store.set('motion', reduced ? 'reduce' : ''); applyMotion(); });
  applyMotion();

  const demo = () => inner()?.demo;
  $('#kdf-replay').addEventListener('click', async () => {
    const d = demo();
    if (!d) return;
    try { await d.reset?.(); await d.play?.(); } catch (e) { console.error(e); }
  });

  // Notes: the demo's meta.json, with buttons that show each state and option.
  const list = (items, fn) => (items?.length ? `<ul>${items.map(fn).join('')}</ul>` : '');
  const section = (h, html) => (html ? `<section><h3>${esc(h)}</h3>${html}</section>` : '');
  const score = (label, n) => (n ? `<span class="pill" title="${label} ${n} of 5">${label} ${'●'.repeat(n)}${'○'.repeat(5 - n)}</span>` : '');
  function renderNotes() {
    if (!meta) return;
    const m = meta;
    $('.kdf-notes-body').innerHTML = `
      ${m.summary ? `<p class="kdf-lede">${esc(m.summary)}</p>` : ''}
      <div class="cluster">${score('Joy', m.joy)}${score('Ease', m.ease)}${m.effort ? `<span class="pill">Effort ${esc(m.effort)}</span>` : ''}${m.feature ? `<span class="pill">${esc(m.feature)}</span>` : ''}</div>
      ${section('Problem', m.problem ? `<p>${esc(m.problem)}</p>` : '')}
      ${section('Idea', m.idea ? `<p>${esc(m.idea)}</p>` : '')}
      ${section('Borrows', list(m.borrows, b => `<li><b>${esc(b.from)}</b>: ${esc(b.what)}</li>`))}
      ${section('Options', list(m.options, o => `<li class="kdf-opt"><div><b>${esc(o.key ? o.key + '. ' : '')}${esc(o.name)}</b><br><span class="muted">${esc(o.summary)}</span></div>${o.state ? `<button type="button" class="btn btn-quiet" data-state="${esc(o.state)}">Show</button>` : ''}</li>`))}
      ${section('Recommendation', m.recommendation ? `<p>${esc(m.recommendation)}</p>` : '')}
      ${section('States', m.states?.length ? `<div class="cluster">${m.states.map(s => `<button type="button" class="chip" data-state="${esc(s)}">${esc(s)}</button>`).join('')}</div>` : '')}
      ${section('Notes', list(m.notes, n => `<li>${esc(n)}</li>`))}`;
  }
  sheet.addEventListener('click', async e => {
    const b = e.target.closest('[data-state]');
    if (!b) return;
    // A bottom sheet covers the demo: close it so the state shows. A side panel stays open.
    if (innerWidth < 760) close();
    try { await demo()?.state?.(b.dataset.state); } catch (err) { console.error(err); }
  });

  fetch('meta.json', { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).then(m => {
    if (!m) return;
    meta = m;
    if (m.title) { $('.kdf-title h1').textContent = m.title; document.title = m.title; }
    if (m.group) { const g = $('.kdf-group'); g.hidden = false; g.textContent = m.group; }
    renderNotes();
  }).catch(() => {});

  // The sheet: a <dialog>. ui.js is a module, so the few lines it needs live here.
  const opener = { el: null };
  $('#kdf-notes').addEventListener('click', () => { opener.el = document.activeElement; sheet.showModal(); });
  const close = () => {
    sheet.classList.add('is-closing');
    const done = () => { sheet.classList.remove('is-closing'); sheet.close(); opener.el?.focus(); };
    if (reduced || matchMedia('(prefers-reduced-motion: reduce)').matches) done(); else setTimeout(done, 200);
  };
  sheet.addEventListener('cancel', e => { e.preventDefault(); close(); });
  let downOnBackdrop = false;
  sheet.addEventListener('pointerdown', e => { downOnBackdrop = e.target === sheet; });
  sheet.addEventListener('click', e => { if ((e.target === sheet && downOnBackdrop) || e.target.closest('[data-close]')) close(); downOnBackdrop = false; });
})();
