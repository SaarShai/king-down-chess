// The showcase presentation: renders window.DECK (deck-data.js) into the page.
// Content fields named `html` are trusted text written by the lead; all other fields are escaped.
(() => {
  const D = window.DECK;
  const main = document.querySelector('main');
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const dots = (n, max = 5) => n == null ? '' : `<span class="score" role="img" aria-label="${n} of ${max}">${Array.from({ length: max }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</span>`;
  const chips = list => list?.length ? `<div class="chips">${list.map(c => typeof c === 'string' ? `<span class="chip">${esc(c)}</span>` : `<span class="chip ${esc(c.kind || '')}">${esc(c.text)}</span>`).join('')}</div>` : '';
  const img = (src, alt, cls = '') => `<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy" data-full="${esc(src)}" class="${cls}">`;

  // A device frame with a poster image; "Try it live" swaps in the demo page.
  const device = (shot, demo, alt, desk = false) => `
    <div class="device ${desk ? 'desk' : ''}" data-demo="${esc(demo || '')}" data-desk="${desk ? 1 : ''}">
      <div class="screen">${shot ? img(shot, alt) : ''}
        ${demo ? `<button class="play-btn" type="button">${PLAY} Try it live</button>` : ''}
      </div>
    </div>`;
  const PLAY = '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 1.8v10.4L12 7z" fill="currentColor"/></svg>';

  const verdicts = list => list?.length ? `<div class="verdicts">${list.map(v => `<div class="verdict"><b>${esc(v.who)} · ${esc(v.verdict)}</b><span>${esc(v.note)}</span></div>`).join('')}</div>` : '';
  const demoLinks = (demo, extra = []) => demo || extra.length ? `<div class="demo-links">${demo ? `<a href="demos/${esc(demo)}/index.html" target="_blank" rel="noopener">Open the demo in a full page</a>` : ''}${extra.map(l => `<a href="${esc(l.href)}" target="_blank" rel="noopener">${esc(l.text)}</a>`).join('')}</div>` : '';

  const blocks = {
    prose: b => `<div class="prose">${b.html}</div>`,
    principles: b => `<ol class="principles">${b.items.map(p => `<li><b>${esc(p.title)}</b><span>${esc(p.line)}</span>${p.cite ? `<cite>${esc(p.cite)}</cite>` : ''}</li>`).join('')}</ol>`,
    cards: b => `${b.title ? `<h3 style="margin-block:28px 14px">${esc(b.title)}</h3>` : ''}<div class="grid">${b.items.map(c => `<div class="slab">${c.shot ? img(c.shot, c.title, 'cardshot') : ''}${c.kicker ? `<h4>${esc(c.kicker)}</h4>` : ''}<h3 style="font-size:19px">${esc(c.title)}</h3>${c.html ? `<p>${c.html}</p>` : `<p>${esc(c.text)}</p>`}${chips(c.chips)}</div>`).join('')}</div>`,
    direction: b => `
      <article class="direction" id="${esc(b.id)}">
        ${device(b.shot, b.demo, b.name + ' game screen')}
        <div class="body">
          <h4>${esc(b.kicker || 'Direction')}</h4>
          <h3 style="font-size:30px">${esc(b.name)}</h3>
          <p class="thesis">${esc(b.thesis)}</p>
          ${chips(b.feel?.map(f => ({ text: f, kind: 'gold' })))}
          <dl>${(b.facts || []).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
          ${b.shots?.length ? `<div class="shots">${b.shots.map(s => `<figure class="${s.wide ? 'wide' : ''}">${img(s.src, s.caption)}<figcaption>${esc(s.caption)}</figcaption></figure>`).join('')}</div>` : ''}
          ${verdicts(b.verdicts)}
          ${demoLinks(b.demo, b.links)}
        </div>
      </article>`,
    feature: b => `
      <article class="feature" id="${esc(b.id)}">
        <div class="head">
          <h4>${esc(b.kicker || 'Feature')}</h4>
          <h3 style="font-size:27px">${esc(b.name)}</h3>
          ${b.problem ? `<p class="problem">${esc(b.problem)}</p>` : ''}
        </div>
        <div class="options">${(b.options || []).map(o => `
          <div class="option ${o.key === b.pick ? 'picked' : ''}">
            <div class="tag"><span class="letter">${esc(o.key)}</span>${o.key === b.pick ? '<span class="chip pick">The pick</span>' : ''}</div>
            ${o.shot ? img(o.shot, o.name) : ''}
            <h3 style="font-size:17.5px">${esc(o.name)}</h3>
            <p>${esc(o.summary)}</p>
            <div class="meta">${o.borrows ? `<span>From ${esc(o.borrows)}</span>` : ''}${o.joy != null ? `<span>Joy ${dots(o.joy)}</span>` : ''}${o.ease != null ? `<span>Ease ${dots(o.ease)}</span>` : ''}${o.effort ? `<span>Effort ${esc(o.effort)}</span>` : ''}</div>
          </div>`).join('')}
        </div>
        ${b.why ? `<div class="pickline"><b>Why this pick</b><span>${esc(b.why)}</span></div>` : ''}
        ${b.demo || b.shots?.length ? `<div class="direction" style="border:0;padding:0">${device(b.demoShot || b.options?.find(o => o.key === b.pick)?.shot, b.demo, b.name + ' demo')}<div class="body">${b.shots?.length ? `<div class="shots">${b.shots.map(s => `<figure class="${s.wide ? 'wide' : ''}">${img(s.src, s.caption)}<figcaption>${esc(s.caption)}</figcaption></figure>`).join('')}</div>` : ''}${verdicts(b.verdicts)}${demoLinks(b.demo, b.links)}</div></div>` : verdicts(b.verdicts)}
      </article>`,
    story: b => `${b.title ? `<h3 style="margin-block:30px 6px">${esc(b.title)}</h3>` : ''}${b.text ? `<p class="lead" style="font-size:16px;margin-bottom:16px">${esc(b.text)}</p>` : ''}<div class="story">${b.frames.map(f => `<figure>${img(f.shot, f.caption)}<figcaption>${esc(f.caption)}</figcaption></figure>`).join('')}</div>`,
    decisions: b => `<div class="decisions">${b.items.map((d, i) => `
      <section class="decision" id="decision-${i + 1}"><h4>Decision ${i + 1}</h4><h3>${esc(d.title)}</h3>
        <dl><dt>Rule</dt><dd>${esc(d.rule)}</dd><dt>Options</dt><dd>${esc(d.options)}</dd><dt>Pick</dt><dd class="pick">${esc(d.pick)}</dd><dt>On yes</dt><dd>${esc(d.onYes)}</dd></dl>
      </section>`).join('')}</div>`,
    phases: b => `<ol class="phases">${b.items.map(p => `<li><h3 style="font-size:19px">${esc(p.title)}</h3><p style="color:var(--soft);font-size:15px">${esc(p.text)}</p>${p.list ? `<ul>${p.list.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}</li>`).join('')}</ol>`,
    demo: b => `<div class="direction" style="border:0">${device(b.shot, b.id, b.title, b.desk)}<div class="body"><h3>${esc(b.title)}</h3><p class="lead" style="font-size:17px">${esc(b.text)}</p>${chips(b.chips)}${verdicts(b.verdicts)}${demoLinks(b.id, b.links)}</div></div>`,
  };

  // ---- render ----
  const c = D.cover;
  main.insertAdjacentHTML('beforeend', `
    <section class="chapter cover" id="top" data-nav="${esc(c.nav || 'Cover')}">
      <div>
        <p class="kicker">${esc(c.kicker)}</p>
        <h1 style="margin-top:16px">${esc(c.title)}<span>${esc(c.subtitle)}</span></h1>
        <p class="thesis">${esc(c.thesis)}</p>
        <div class="meta">${(c.meta || []).map(m => `<span>${esc(m)}</span>`).join('')}</div>
      </div>
      <div class="hero">${device(c.shot, c.demo, 'The recommended game screen')}</div>
    </section>`);
  for (const ch of D.chapters) {
    main.insertAdjacentHTML('beforeend', `
      <section class="chapter" id="${esc(ch.id)}" data-nav="${esc(ch.nav || ch.title)}">
        <header><p class="kicker">${esc(ch.kicker)}</p><h2>${esc(ch.title)}</h2>${ch.lead ? `<p class="lead">${esc(ch.lead)}</p>` : ''}</header>
        ${ch.blocks.map(b => (blocks[b.type] || (() => ''))(b)).join('')}
      </section>`);
  }

  // ---- rail and top bar ----
  const rail = document.querySelector('.rail');
  const list = rail.querySelector('ol');
  const sections = [...main.querySelectorAll('.chapter')];
  list.innerHTML = sections.map(s => `<li><a href="#${s.id}">${esc(s.dataset.nav)}</a></li>`).join('');
  const links = [...list.querySelectorAll('a')];
  const where = document.querySelector('.topbar .where');
  const menuBtn = document.querySelector('.topbar button');
  menuBtn.addEventListener('click', () => { const open = rail.classList.toggle('open'); menuBtn.setAttribute('aria-expanded', open); });
  list.addEventListener('click', () => { rail.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); });
  let current = 0;
  const setCurrent = i => {
    current = i;
    links.forEach((a, k) => a.setAttribute('aria-current', k === i ? 'true' : 'false'));
    if (where) where.textContent = sections[i].dataset.nav;
  };
  const io = new IntersectionObserver(entries => {
    const vis = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
    if (vis) setCurrent(sections.indexOf(vis.target));
  }, { rootMargin: '-35% 0px -60% 0px' });
  sections.forEach(s => io.observe(s));
  setCurrent(0);

  // ---- keys: next and previous chapter, present mode ----
  const go = i => { const k = Math.max(0, Math.min(sections.length - 1, i)); sections[k].scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); };
  addEventListener('keydown', e => {
    if (e.target.closest?.('input, textarea, select, [contenteditable]') || e.metaKey || e.ctrlKey || e.altKey) return;
    if (document.querySelector('dialog[open]')) return;
    if (e.key === 'ArrowRight' || e.key === 'j') { e.preventDefault(); go(current + 1); }
    else if (e.key === 'ArrowLeft' || e.key === 'k') { e.preventDefault(); go(current - 1); }
    else if (e.key === 'p') document.body.classList.toggle('present');
  });

  // ---- live demos: swap the poster for the demo page, scaled to the frame ----
  const fit = (dev, frame) => {
    const w = dev.dataset.desk ? 1440 : 390;
    frame.style.transform = `scale(${dev.querySelector('.screen').clientWidth / w})`;
  };
  main.addEventListener('click', e => {
    const btn = e.target.closest('.play-btn');
    if (!btn) return;
    const dev = btn.closest('.device');
    const screen = dev.querySelector('.screen');
    const frame = document.createElement('iframe');
    frame.className = 'live';
    frame.title = 'Live demo';
    frame.src = `demos/${dev.dataset.demo}/index.html?bare=1`;
    screen.replaceChildren(frame);
    fit(dev, frame);
    new ResizeObserver(() => fit(dev, frame)).observe(screen);
    frame.focus();
  });

  // ---- lightbox for still images ----
  const box = document.querySelector('dialog.lightbox');
  main.addEventListener('click', e => {
    const im = e.target.closest('img[data-full]');
    if (!im) return;
    box.querySelector('img').src = im.dataset.full;
    box.querySelector('img').alt = im.alt;
    box.querySelector('p').textContent = im.alt;
    box.showModal();
  });
  box.addEventListener('click', () => box.close());
})();
