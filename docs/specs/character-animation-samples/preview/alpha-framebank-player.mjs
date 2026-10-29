// Published reviews draw only frozen bank URLs, with an empty alpha canvas each frame.
export async function loadPlayer(host) {
  host.innerHTML = `<div class="alpha-controls"><button data-play disabled>Loading…</button><label>Speed <select data-speed><option value="1">Normal</option><option value=".5">Half</option><option value=".25">Quarter</option></select></label><label>Background <select data-background><option value="checkerboard">Checkerboard</option><option value="light">Light</option><option value="dark">Dark</option><option value="board">Board</option></select></label><input data-seek type="range" min="0" value="0" step="1" aria-label="Animation time" disabled></div><div class="alpha-tracks"></div><p data-status role="status">Loading frozen RGBA frames…</p>`;
  const qa = host.hasAttribute('data-playback-qa');
  if (qa) {
    host.querySelector('.alpha-controls').insertAdjacentHTML('beforeend', `<label>Size <select data-size><option value="native">Native</option><option value="board">Board size</option></select></label><button data-step-back>Previous frame</button><button data-step-next>Next frame</button><output data-gap>Draw gap: not measured</output>`);
  }
  const play = host.querySelector('[data-play]'), seek = host.querySelector('[data-seek]'), speed = host.querySelector('[data-speed]');
  const status = host.querySelector('[data-status]');
  try {
    const bankUrl = new URL(host.dataset.alphaBank, document.baseURI);
    const response = await fetch(bankUrl);
    if (!response.ok) throw Error(`Bank HTTP ${response.status}`);
    const bank = await response.json();
    if (bank.runtimeFormat !== 'RGBA PNG framebank') throw Error('No published RGBA framebank');
    const tracks = bank.tracks || [{ label: 'Character', frames: bank.frames, effects: bank.effects }];
    const images = new Map();
    async function load(record) {
      const url = new URL(record.url, bankUrl).href;
      if (!images.has(url)) images.set(url, (async () => {
        const image = new Image(); image.src = url; await image.decode(); return image;
      })());
      return { ...record, image: await images.get(url) };
    }
    const loaded = await Promise.all(tracks.map(async track => ({ ...track,
      frames: await Promise.all(track.frames.map(load)), effects: await Promise.all((track.effects || []).map(load)),
    })));
    const canvases = loaded.map(track => {
      const figure = document.createElement('figure'), caption = document.createElement('figcaption'), canvas = document.createElement('canvas');
      caption.textContent = track.label; canvas.setAttribute('aria-label', `${track.label} alpha animation`);
      [canvas.width, canvas.height] = bank.canvasSize || [track.frames[0].image.width, track.frames[0].image.height];
      figure.append(caption, canvas); host.querySelector('.alpha-tracks').append(figure); return canvas;
    });
    if (qa) {
      const scale = Number(host.dataset.boardScale);
      if (!(scale > 0 && Number.isFinite(scale))) throw Error('QA requires a positive data-board-scale');
      const size = host.querySelector('[data-size]');
      size.onchange = () => canvases.forEach(canvas => {
        canvas.style.width = `${canvas.width * (size.value === 'board' ? scale : 1)}px`;
        canvas.style.maxHeight = 'none';
      });
      size.dispatchEvent(new Event('change'));
      if (host.dataset.boardImage) {
        const url = new URL(host.dataset.boardImage, document.baseURI);
        const boardImage = new Image(); boardImage.src = url.href; await boardImage.decode();
        host.style.setProperty('--qa-board-image', `url(${JSON.stringify(url.href)})`);
        host.dataset.qaBoard = 'true';
      } else host.querySelector('[data-background] option[value=board]').textContent = 'Board approximation';
    }
    const at = (records, time) => records.findLast(record => record.timeMs <= time);
    let current = 0, playing = false, anchor = 0, anchorTime = 0, lastTick = null, maxGap = 0, ticks = 0;
    const gap = host.querySelector('[data-gap]');
    function draw(time) {
      current = time;
      loaded.forEach((track, index) => {
        const canvas = canvases[index], ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const frame = at(track.frames, time), effect = at(track.effects, time);
        if (frame) ctx.drawImage(frame.image, 0, 0);
        if (effect) ctx.drawImage(effect.image, 0, 0);
      });
      seek.value = String(time);
    }
    function pause() { playing = false; lastTick = null; play.textContent = 'Play'; }
    function start() { playing = true; anchor = performance.now(); anchorTime = current; lastTick = null; maxGap = 0; ticks = 0; if (gap) gap.textContent = 'Draw gap: not measured'; play.textContent = 'Pause'; }
    play.onclick = () => playing ? pause() : start();
    seek.max = String(bank.durationMs); seek.oninput = () => { pause(); draw(Number(seek.value)); };
    speed.onchange = () => { if (playing) start(); };
    host.querySelector('[data-background]').onchange = event => { host.dataset.background = event.target.value; };
    if (qa) {
      const times = [...new Set(loaded.flatMap(track => [...track.frames, ...track.effects].map(frame => frame.timeMs)))].sort((a, b) => a - b);
      host.querySelector('[data-step-back]').onclick = () => { pause(); draw(times.findLast(time => time < current) ?? times[0]); };
      host.querySelector('[data-step-next]').onclick = () => { pause(); draw(times.find(time => time > current) ?? times.at(-1)); };
    }
    function tick(now) {
      if (playing) {
        draw((anchorTime + (now - anchor) * Number(speed.value)) % bank.durationMs);
        if (gap) {
          const delivered = performance.now();
          if (lastTick !== null) { maxGap = Math.max(maxGap, delivered - lastTick); ticks++; gap.textContent = `Max canvas draw gap: ${maxGap.toFixed(1)} ms (${ticks} intervals)`; }
          lastTick = delivered;
        }
      }
      requestAnimationFrame(tick);
    }
    host.dataset.background = 'checkerboard'; draw(0); seek.disabled = false; play.disabled = false;
    status.textContent = 'Frozen RGBA framebank loaded. Light, dark, checkerboard and board views are available.';
    host.dataset.ready = 'true'; pause(); requestAnimationFrame(tick);
  } catch (error) { status.textContent = `Alpha playback unavailable: ${error.message}`; play.textContent = 'Unavailable'; }
}
const style = document.createElement('style');
style.textContent = `.alpha-controls{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:12px 0}.alpha-controls input{min-width:120px;flex:1}.alpha-tracks{display:flex;gap:12px}.alpha-tracks figure{margin:0;min-width:0;flex:1}.alpha-tracks canvas{display:block;width:100%;height:auto;max-height:600px;object-fit:contain;background-color:#ddd;background-image:conic-gradient(#aaa 25%,transparent 0 50%,#aaa 0 75%,transparent 0);background-size:24px 24px}[data-background=light] canvas{background:#fff}[data-background=dark] canvas{background:#202a25}[data-background=board] canvas{background-color:#d9c8a6;background-image:conic-gradient(#6e765b 25%,transparent 0 50%,#6e765b 0 75%,transparent 0);background-size:120px 120px}`;
style.textContent += `[data-qa-board=true][data-background=board] canvas{background-image:var(--qa-board-image);background-size:cover}`;
document.head.append(style);
for (const host of document.querySelectorAll('[data-alpha-bank]')) void loadPlayer(host);
