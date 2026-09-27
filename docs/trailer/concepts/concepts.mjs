// Trailer concept frames. Every scene draws from a time t in seconds, so stills and video frames are exact.
// Serve docs/ and open trailer/concepts/?scene=intro|board|cards ; window.renderAt(t) draws one frame.
const SCENE = new URLSearchParams(location.search).get('scene') || 'intro';
const W = 1920, H = 1080;

// Deterministic clock: the game's painted scene reads performance.now() and requestAnimationFrame().
let clock = 0;
const queued = [];
performance.now = () => clock;
window.requestAnimationFrame = cb => { queued.push(cb); return queued.length; };
const flush = to => { clock = to; queued.splice(0).forEach(f => f(clock)); };

const fx = document.getElementById('fx').getContext('2d');
const over = document.getElementById('over').getContext('2d');
const load = src => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error(src)); i.src = src; });
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const easeOut = k => 1 - (1 - clamp(k, 0, 1)) ** 3;
const easeBack = k => { k = clamp(k, 0, 1); return 1 + 2.7 * (k - 1) ** 3 + 1.7 * (k - 1) ** 2; };
const rand = seed => { let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; };
const canvas = (w, h) => Object.assign(document.createElement('canvas'), { width: w, height: h });

// ---- shared finishing: vignette, film grain, letterbox ----
const grain = (() => {
  const c = canvas(512, 512), g = c.getContext('2d'), d = g.createImageData(512, 512), r = rand(7);
  for (let i = 0; i < d.data.length; i += 4) { const v = r() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
  g.putImageData(d, 0, 0); return c;
})();
function finish(g, t, bars = 132) {
  const v = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.98);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.75)');
  g.fillStyle = v; g.fillRect(0, 0, W, H);
  g.save(); g.globalAlpha = 0.06; g.globalCompositeOperation = 'overlay';
  const ox = Math.floor((t * 97) % 1 * 512), oy = Math.floor((t * 61) % 1 * 512);
  for (let x = -ox; x < W; x += 512) for (let y = -oy; y < H; y += 512) g.drawImage(grain, x, y);
  g.restore();
  g.fillStyle = '#000'; g.fillRect(0, 0, W, bars); g.fillRect(0, H - bars, W, bars);
}
function particles(g, t, { n = 140, seed = 3, color = '255,190,110', rise = 30, area = [0, 0, W, H], size = [1, 3], bokeh = 10 } = {}) {
  const r = rand(seed);
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const x0 = area[0] + r() * area[2], y0 = r() * area[3], s = lerp(size[0], size[1], r()), sp = lerp(0.4, 1.3, r()), ph = r() * 6.28;
    const x = x0 + Math.sin(t * 0.7 + ph) * 18, y = area[1] + (((y0 - t * rise * sp) % area[3]) + area[3]) % area[3];
    const a = (0.35 + 0.65 * r()) * (0.6 + 0.4 * Math.sin(t * 3 + ph)), big = i < bokeh, rad = (big ? s * 9 : s) * 2.2;
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, `rgba(${color},${big ? a * 0.16 : a})`); gr.addColorStop(1, `rgba(${color},0)`);
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad, 0, 6.283); g.fill();
  }
  g.restore();
}
/** Name plate text: gilded gradient with an optional light sweep (0..1). */
function goldText(text, px, { spacing = 0, sweep = -1 } = {}) {
  const font = `900 ${px}px Cinzel`, m = canvas(8, 8).getContext('2d');
  m.font = font; m.letterSpacing = `${spacing}px`;
  const tw = Math.ceil(m.measureText(text).width) + 60, th = Math.ceil(px * 1.5);
  const c = canvas(tw, th), g = c.getContext('2d');
  g.font = font; g.letterSpacing = `${spacing}px`; g.textBaseline = 'middle';
  const gr = g.createLinearGradient(0, th * 0.2, 0, th * 0.8);
  gr.addColorStop(0, '#fffbea'); gr.addColorStop(0.45, '#f6cd76'); gr.addColorStop(0.6, '#b9741f'); gr.addColorStop(1, '#6a3a0a');
  g.fillStyle = gr; g.fillText(text, 30, th / 2);
  if (sweep >= 0 && sweep <= 1) {
    g.globalCompositeOperation = 'source-atop';
    const x = lerp(-tw * 0.3, tw * 1.3, sweep), s = g.createLinearGradient(x - 140, 0, x + 140, th);
    s.addColorStop(0, 'rgba(255,255,255,0)'); s.addColorStop(0.5, 'rgba(255,255,255,.95)'); s.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = s; g.fillRect(0, 0, tw, th);
  }
  return c;
}

// ---- scene 1: a character intro (the Archer) ----
async function intro() {
  const sheet = await load('../../2d-first-pieces/wrist-bow/archer.png');
  const fig = canvas(768, 1024); fig.getContext('2d').drawImage(sheet, 0, 0, 768, 1024, 0, 0, 768, 1024);
  const glow = canvas(968, 1224);
  { const g = glow.getContext('2d'); g.filter = 'blur(24px)'; g.drawImage(fig, 100, 100); g.filter = 'none';
    g.globalCompositeOperation = 'source-in'; g.fillStyle = '#ffb14f'; g.fillRect(0, 0, 968, 1224); }
  const slab = canvas(W, H);
  { const g = slab.getContext('2d'), r = rand(11), base = g.createLinearGradient(0, H, W, 0);
    base.addColorStop(0, '#4a1006'); base.addColorStop(0.55, '#b9471a'); base.addColorStop(1, '#f2a54a');
    g.fillStyle = base; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 1100; i++) {
      const x = r() * W, y = r() * H, l = 80 + r() * 300, a = -0.52 + (r() - 0.5) * 0.25;
      g.strokeStyle = `rgba(${r() < 0.5 ? '255,214,160' : '60,12,4'},${0.04 + r() * 0.12})`; g.lineWidth = 3 + r() * 24; g.lineCap = 'round';
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
    } }
  return t => {
    const g = fx; g.save(); g.clearRect(0, 0, W, H);
    const cam = 1 + t * 0.015; g.translate(W / 2, H / 2); g.scale(cam, cam); g.translate(-W / 2, -H / 2);
    g.fillStyle = '#0a0504'; g.fillRect(0, 0, W, H);
    // A painted diagonal banner sweeps in behind the character.
    const off = lerp(-760, 0, easeOut(t / 0.45));
    g.save(); g.beginPath(); g.moveTo(off - 520, H + 60); g.lineTo(off + 300, H + 60); g.lineTo(off + 1900, -90); g.lineTo(off + 1080, -90); g.closePath(); g.clip(); g.drawImage(slab, 0, 0); g.restore();
    g.save(); g.strokeStyle = 'rgba(255,232,190,.85)'; g.lineWidth = 3; g.beginPath(); g.moveTo(off + 300, H + 60); g.lineTo(off + 1900, -90); g.stroke(); g.restore();
    // Light rays from the upper right.
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 8; i++) {
      const a = 2.15 + i * 0.1 + Math.sin(t * 0.6 + i) * 0.015, w = 0.012 + (i % 3) * 0.01;
      g.fillStyle = `rgba(255,205,140,${0.03 + (i % 3) * 0.018})`;
      g.beginPath(); g.moveTo(1800, -80); g.lineTo(1800 + Math.cos(a - w) * 2800, -80 + Math.sin(a - w) * 2800); g.lineTo(1800 + Math.cos(a + w) * 2800, -80 + Math.sin(a + w) * 2800); g.fill();
    }
    g.restore();
    // A giant ghost of the name drifts behind everything.
    g.save(); g.globalAlpha = 0.05 * easeOut((t - 0.3) / 0.6); g.font = '900 440px Cinzel'; g.letterSpacing = '30px';
    g.strokeStyle = '#ffe6bb'; g.lineWidth = 3; g.textBaseline = 'middle'; g.strokeText('ARCHER', 480 - t * 45, 540); g.restore();
    // The figure lands with a motion smear, rim-lit from behind.
    const k = easeOut(t / 0.5), x0 = lerp(-560, 140, k), y0 = 118, fh = 1040, fw = fh * 768 / 1024, s = fh / 1024;
    for (let i = 5; i > 0 && k < 1; i--) { g.globalAlpha = 0.1 * (1 - k); g.drawImage(fig, x0 - i * 70 * (1 - k), y0, fw, fh); }
    g.globalAlpha = 1;
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.9; g.drawImage(glow, x0 - 100 * s + 12, y0 - 100 * s - 8, 968 * s, 1224 * s); g.restore();
    g.drawImage(fig, x0, y0, fw, fh);
    // The shot, frozen mid-flight: a light streak from the wrist-bow.
    const hand = { x: x0 + 735 * s, y: y0 + 236 * s }, tip = lerp(hand.x + 30, 1880, easeOut((t - 0.15) / 1.4));
    g.save(); g.globalCompositeOperation = 'lighter';
    const streak = g.createLinearGradient(hand.x, 0, tip, 0);
    streak.addColorStop(0, 'rgba(255,220,160,0)'); streak.addColorStop(0.85, 'rgba(255,236,200,.55)'); streak.addColorStop(1, 'rgba(255,255,255,1)');
    g.strokeStyle = streak; g.lineCap = 'round';
    for (const [w, a] of [[26, 0.12], [10, 0.35], [3, 1]]) { g.globalAlpha = a; g.lineWidth = w; g.beginPath(); g.moveTo(hand.x, hand.y); g.lineTo(tip, hand.y - (tip - hand.x) * 0.02); g.stroke(); }
    g.restore();
    particles(g, t, { n: 150, seed: 5, rise: 26, bokeh: 14 });
    // The name slams in, a rule draws out from the centre, light sweeps across the gilding.
    const n = (t - 0.35) / 0.35, NX = 1420, NY = 690;
    if (n > 0) {
      const sc = lerp(1.6, 1, easeBack(n)), a = clamp(n * 2, 0, 1), txt = goldText('ARCHER', 164, { spacing: 24, sweep: (t - 0.95) / 0.7 });
      g.save(); g.globalAlpha = a; g.translate(NX, NY); g.scale(sc, sc);
      g.shadowColor = 'rgba(0,0,0,.8)'; g.shadowBlur = 44; g.shadowOffsetY = 12; g.drawImage(txt, -txt.width / 2, -txt.height / 2); g.restore();
      const lw = 660 * easeOut((t - 0.55) / 0.5);
      g.save(); g.globalAlpha = a;
      const lg = g.createLinearGradient(NX - lw / 2, 0, NX + lw / 2, 0);
      lg.addColorStop(0, 'rgba(255,215,140,0)'); lg.addColorStop(0.5, '#ffd88e'); lg.addColorStop(1, 'rgba(255,215,140,0)');
      g.fillStyle = lg; g.fillRect(NX - lw / 2, NY + 110, lw, 2);
      g.translate(NX, NY + 111); g.rotate(Math.PI / 4); g.fillStyle = '#ffe6ad'; g.fillRect(-6, -6, 12, 12); g.restore();
    }
    g.restore();
    finish(g, t);
  };
}

// ---- scene 2: a real capture from the game, in slow motion ----
async function board() {
  const R = await import('../../2d-first-pieces/board/rules.mjs');
  const { createPosition, actionsFor } = await import('../../2d-first-pieces/board/model.mjs');
  const { createScene } = await import('../../2d-first-pieces/board/scene.mjs');
  // Double resolution: the scene draws in 960-unit board space through one context, so pre-scaling it is enough.
  const src = canvas(1920, 1920); src.getContext('2d').scale(2, 2);
  const scene = createScene({ canvas: src, pieces: R });
  await scene.load();
  const pos = createPosition('beast'); scene.setPosition(pos); scene.setSelected(null); scene.setCoords(false);
  const move = actionsFor(pos, R.parseSq('d4')).filter(m => m.captures.length).sort((a, b) => b.captures.length - a.captures.length)[0];
  flush(1000); const start = 1000; scene.play(move);
  const ghosts = [canvas(1920, 1920), canvas(1920, 1920)], sharp = canvas(W, H);
  return t => {
    const tt = 240 + t * 1000 * 0.3;  // 0.3x slow motion from the first lunge
    [tt - 60, tt - 30].forEach((x, i) => { flush(start + x); const c = ghosts[i].getContext('2d'); c.clearRect(0, 0, 1920, 1920); c.drawImage(src, 0, 0); });
    flush(start + tt);
    const g = fx; g.save(); g.clearRect(0, 0, W, H); g.fillStyle = '#0b0806'; g.fillRect(0, 0, W, H);
    const f = scene.foot(move.captures[0]), zoom = 2.1 + t * 0.06, cx = f.x - 40, cy = f.y - 80;
    const place = (c, img) => c.drawImage(img, W / 2 - cx * zoom, H / 2 - cy * zoom, 960 * zoom, 960 * zoom);
    g.save(); g.filter = 'blur(8px) brightness(.72) saturate(.9)'; place(g, src); g.restore();  // out-of-focus board
    const s = sharp.getContext('2d'); s.clearRect(0, 0, W, H);
    s.globalAlpha = 0.22; place(s, ghosts[0]); s.globalAlpha = 0.4; place(s, ghosts[1]); s.globalAlpha = 1; place(s, src);
    s.globalCompositeOperation = 'destination-in';
    const m = s.createRadialGradient(W / 2, H / 2 - 20, 260, W / 2, H / 2 - 20, 720);
    m.addColorStop(0, '#000'); m.addColorStop(1, 'rgba(0,0,0,0)'); s.fillStyle = m; s.fillRect(0, 0, W, H);
    s.globalCompositeOperation = 'source-over';
    g.drawImage(sharp, 0, 0);
    // Torchlight grade: warm pool on the action, cool falloff.
    g.save(); g.globalCompositeOperation = 'soft-light';
    const warm = g.createRadialGradient(W / 2, H / 2, 80, W / 2, H / 2, 900);
    warm.addColorStop(0, 'rgba(255,170,80,.75)'); warm.addColorStop(1, 'rgba(30,50,90,.8)');
    g.fillStyle = warm; g.fillRect(0, 0, W, H); g.restore();
    // Impact sparks on the bite.
    const bite = 391, since = tt - bite;
    if (since > 0 && since < 260) {
      const p = { x: W / 2 + (f.x - cx) * zoom, y: H / 2 + (f.y - 48 - cy) * zoom }, r = rand(9), k = since / 260;
      g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
      for (let i = 0; i < 26; i++) {
        const a = r() * 6.283, l0 = 30 + 260 * easeOut(k) * (0.5 + r() * 0.8), l1 = l0 + 30 + r() * 50;
        g.strokeStyle = `rgba(255,${200 + r() * 55 | 0},140,${(1 - k) * (0.5 + r() * 0.5)})`; g.lineWidth = 1.5 + r() * 3;
        g.beginPath(); g.moveTo(p.x + Math.cos(a) * l0, p.y + Math.sin(a) * l0); g.lineTo(p.x + Math.cos(a) * l1, p.y + Math.sin(a) * l1); g.stroke();
      }
      const flash = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, 240); flash.addColorStop(0, `rgba(255,230,190,${0.55 * (1 - k)})`); flash.addColorStop(1, 'rgba(255,230,190,0)');
      g.fillStyle = flash; g.fillRect(0, 0, W, H); g.restore();
    }
    particles(g, t, { n: 90, seed: 12, rise: 12, color: '255,200,140', bokeh: 18 });
    g.restore();
    finish(g, t);
  };
}

// ---- scene 3: the redesigned digital cards, with a holographic king ----
async function cards() {
  const root = document.getElementById('cards'), A = '../assets/';
  const make = (cls, art, name, emblem, x, y) => {
    const el = document.createElement('div'); el.className = `card ${cls}`; el.style.left = `${x}px`; el.style.top = `${y}px`;
    el.innerHTML = `<div class="card-inner"><div class="art"><img src="${art}"><canvas width="368" height="392"></canvas></div>
      <div class="gem"><img src="${A}${emblem}.png"></div><div class="name">${name}</div><div class="rule"></div><div class="foil"></div><div class="glare"></div></div>`;
    root.append(el); return el;
  };
  const left = make('fire', `${A}strike.jpg`, 'STRIKE', 'fire', 250, 300);
  const right = make('earth', `${A}leap.jpg`, 'LEAP', 'earth', 1270, 300);
  const mid = make('water', `${A}king-frost-card.jpg`, 'KING FROST', 'water', 760, 430);
  const beam = Object.assign(document.createElement('div'), { className: 'beam' });
  Object.assign(beam.style, { left: '720px', top: '190px', width: '480px', height: '520px' });
  const holo = document.createElement('div'); holo.className = 'holo'; holo.innerHTML = `<img src="${A}king-frost.png">`;
  Object.assign(holo.style, { left: '800px', top: '172px', width: '320px' });
  const glitch = holo.cloneNode(true);
  root.append(beam, holo, glitch);
  await Promise.all([...root.querySelectorAll('img')].map(i => i.decode()));
  const embers = (c, t, color, seed) => {
    const g = c.getContext('2d'); g.clearRect(0, 0, c.width, c.height); particles(g, t, { n: 60, seed, color, rise: 60, area: [0, 0, c.width, c.height], size: [1, 2.6], bokeh: 6 });
  };
  const tilt = (el, rx, ry, rz, z = 0) => {
    el.style.transform = `translateZ(${z}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)`;
    el.querySelector('.glare').style.setProperty('--gx', `${50 - ry * 2.2}%`); el.querySelector('.glare').style.setProperty('--gy', `${32 + rx * 2}%`);
    el.querySelector('.foil').style.backgroundPosition = `${50 + ry * 4}% ${50 + rx * 4}%, 0 0`;
  };
  return t => {
    const g = fx; g.clearRect(0, 0, W, H);
    const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#05070d'); bg.addColorStop(1, '#0d0a12'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const [x, y, r, c] of [[430, 560, 560, '255,110,40'], [1500, 560, 560, '120,190,60'], [960, 420, 620, '60,190,255']]) {
      const n = g.createRadialGradient(x, y, 0, x, y, r); n.addColorStop(0, `rgba(${c},.22)`); n.addColorStop(1, `rgba(${c},0)`); g.fillStyle = n; g.fillRect(0, 0, W, H);
    }
    g.restore();
    particles(g, t, { n: 120, seed: 21, color: '190,225,255', rise: 18, bokeh: 16 });
    tilt(left, 4 * Math.sin(t * 0.9), 26 + 7 * Math.sin(t * 0.7), -7, -40);
    tilt(right, -4 * Math.sin(t * 0.8), -26 + 7 * Math.sin(t * 0.75 + 1), 7, -40);
    tilt(mid, 62, 0, 0, 0);
    left.style.translate = `0 ${Math.sin(t * 1.3) * 10}px`; right.style.translate = `0 ${Math.sin(t * 1.2 + 2) * 10}px`;
    embers(left.querySelector('canvas'), t, '255,170,80', 4);
    embers(right.querySelector('canvas'), t, '255,240,180', 8);
    embers(mid.querySelector('canvas'), t, '170,235,255', 6);
    left.querySelector('.art img').style.transform = `scale(${1.06 + 0.02 * Math.sin(t * 2)})`;
    // The king rises out of the card as a flickering hologram.
    const rise = easeOut(t / 0.9), flick = 0.82 + 0.1 * Math.sin(t * 41) + 0.05 * Math.sin(t * 13);
    holo.style.clipPath = `inset(${(1 - rise) * 100}% 0 0 0)`; holo.style.opacity = flick; holo.style.transform = `translateY(${(1 - rise) * 40}px)`;
    beam.style.opacity = 0.35 + 0.35 * rise + 0.08 * Math.sin(t * 29);
    const slice = (t * 3) % 1 < 0.12;
    glitch.style.opacity = slice ? 0.7 : 0; glitch.style.clipPath = 'inset(38% 0 54% 0)'; glitch.style.transform = `translateX(${slice ? 16 : 0}px)`;
    // Projector rings on the card face, drawn over the DOM.
    const o = over; o.clearRect(0, 0, W, H); o.save(); o.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) {
      const k = (t * 0.6 + i / 3) % 1; o.strokeStyle = `rgba(130,230,255,${0.5 * (1 - k)})`; o.lineWidth = 2;
      o.beginPath(); o.ellipse(960, 690, 110 + 160 * k, (110 + 160 * k) * 0.3, 0, 0, 6.283); o.stroke();
    }
    particles(o, t, { n: 50, seed: 33, color: '140,235,255', rise: 90, area: [820, 200, 280, 500], size: [1, 2.4], bokeh: 4 });
    o.restore();
    finish(o, t);
  };
}

const scenes = { intro, board, cards };
window.ready = (async () => {
  await document.fonts.load('900 100px Cinzel'); await document.fonts.load('700 36px Cinzel');
  const draw = await scenes[SCENE]();
  window.renderAt = t => draw(t);
  draw(0);
  return true;
})();
