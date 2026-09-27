// Digital card component (the trailer now, the game later). Not a shot: shots import it.
// Obsidian glass body, element metal rim, gem medallion, gilded Cinzel name, living art (slow push and
// element motes), 3D tilt with a glare, a holo foil and a reflected strip light that all follow the card's
// real angle, a back face for flip reveals, and a projected, flickering, scan-lined hologram for king cards.
//
//   const card = await makeCard({ name: 'STRIKE', element: 'fire', art: url, emblem: url, back: url });
//   group.append(card.el);                     // group: a full-frame div with PERSPECTIVE (see perspectiveGroup)
//   card.set(t, matrix, { lit, push, motes, aura, heat });   // every frame; matrix maps card px to frame px
//   const holo = makeHologram(kingImage, 'water');
//   drawProjection(g, card, holo, t, { power, reveal, alpha, defocus });  // on a 2D canvas above the card
import { particles, rand, canvas, clamp, lerp } from '../runtime.mjs';

export const CARD_W = 400, CARD_H = 560;
export const ART = { x: 16, y: 16, w: 368, h: 380 };      // art window, card px
export const GEM = { x: 200, y: 396, r: 46 };             // gem medallion centre and radius, card px
// Mirrors .layer in engine/index.html (perspective 1700px, origin 50% 40%).
export const PERSPECTIVE = 1700, ORIGIN = [960, 432];
const NAME_MAX = 330;                                     // widest name, card px (longer names shrink)
// A tall strip light stands off to one side. Its reflection is a bright band whose place on the face follows the
// card's angle (the lean: 0 = facing the eye), so it sweeps across whenever a card turns or flips, and rests off
// the face when a card is still. Place 0..1 across the face = at + lean · dir · gain; strength is its opacity.
const SHINE = { at: -0.72, dir: [1, 0], gain: 1.8, strength: 0.9 };
const HEAT = { bright: 0.4, saturate: 0.7, sepia: 0.25 };   // how the art glows as `heat` goes 0 → 1

// Element looks: rim metal, glow colour, art motes, hologram tint and the painted field behind a king.
export const ELEMENTS = {
  fire: { metal: 'linear-gradient(135deg, #ffe0b0, #d9771f 22%, #5b230a 45%, #ff9f45 68%, #fff0d0 88%)', rim: '#f3a04a',
    glow: [255, 120, 30], mote: '255,170,80', holo: [255, 165, 80], field: ['#2a0603', '#9c2a0c', '#ff8f36', '#ffd9a0'] },
  water: { metal: 'linear-gradient(135deg, #f0fbff, #7fcff0 22%, #173a5a 45%, #a6e8ff 68%, #ffffff 88%)', rim: '#9fe3ff',
    glow: [90, 210, 255], mote: '170,235,255', holo: [100, 225, 255], field: ['#041226', '#17558a', '#7fd0f5', '#e8f8ff'] },
  earth: { metal: 'linear-gradient(135deg, #f2f0c0, #8fa23a 22%, #2c3a10 45%, #c9b25a 68%, #fbf3cf 88%)', rim: '#c7c26a',
    glow: [170, 210, 80], mote: '255,240,180', holo: [150, 240, 110], field: ['#101806', '#3d5a16', '#a8b847', '#f1e2a0'] },
  air: { metal: 'linear-gradient(135deg, #fffbe6, #e8c870 22%, #6b5420 45%, #f5dc8e 68%, #ffffff 88%)', rim: '#f3dc92',
    glow: [255, 225, 150], mote: '255,245,225', holo: [215, 195, 255], field: ['#140e2e', '#503a8f', '#e39ad0', '#fff1e0'] },
};
const BACK_METAL = 'linear-gradient(135deg, #fff1c9, #c9a052 22%, #4a3210 45%, #e8c77a 68%, #fff8e0 88%)';

const CSS = `
.kdc-group { position: absolute; inset: 0; perspective: ${PERSPECTIVE}px; perspective-origin: ${ORIGIN[0]}px ${ORIGIN[1]}px; }
.kdc { position: absolute; left: 0; top: 0; width: ${CARD_W}px; height: ${CARD_H}px; transform-origin: 0 0; transform-style: preserve-3d; }
.kdc-face { position: absolute; inset: 0; border-radius: 30px; overflow: hidden; backface-visibility: hidden; -webkit-backface-visibility: hidden;
  background: radial-gradient(120% 90% at 50% 0%, #1d2331 0%, #0b0d13 70%); }
.kdc-back { transform: rotateY(180deg); --metal: ${BACK_METAL}; }
.kdc-face::before { content: ''; position: absolute; inset: 0; border-radius: 30px; padding: 4px; z-index: 6; background: var(--metal);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask-composite: exclude; }
.kdc-face::after { content: ''; position: absolute; inset: 11px; border-radius: 22px; z-index: 6; border: 1px solid rgba(255,255,255,.12); }
.kdc-art { position: absolute; left: ${ART.x}px; top: ${ART.y}px; width: ${ART.w}px; height: ${ART.h}px; border-radius: 20px; overflow: hidden; }
.kdc-art img, .kdc-back img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.kdc-art::after { content: ''; position: absolute; inset: 0; box-shadow: inset 0 0 70px rgba(0,0,0,.6), inset 0 -120px 80px -40px rgba(8,10,16,.95); }
.kdc-art canvas { position: absolute; inset: 0; mix-blend-mode: screen; }
.kdc-gem { position: absolute; left: ${GEM.x - GEM.r}px; top: ${GEM.y - GEM.r}px; width: ${GEM.r * 2}px; height: ${GEM.r * 2}px; z-index: 7; border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #3a4150, #0c0f16 70%); }
.kdc-gem img { position: absolute; inset: 10px; width: ${GEM.r * 2 - 20}px; height: ${GEM.r * 2 - 20}px; }
.kdc-kicker { position: absolute; left: 0; right: 0; top: 449px; text-align: center; z-index: 7; font: 700 21px/1 Cinzel, Georgia, serif;
  letter-spacing: .5em; text-indent: .5em; color: #f3d38e; text-shadow: 0 1px 0 rgba(0,0,0,.9), 0 0 10px rgba(0,0,0,.6); }
.kdc-name { position: absolute; left: 0; right: 0; top: 462px; text-align: center; z-index: 7; font: 700 36px/1 Cinzel, Georgia, serif;
  letter-spacing: .22em; text-indent: .22em; white-space: nowrap;
  background: linear-gradient(180deg, #fff6dc 0%, #f2c46b 45%, #a8661e 100%); -webkit-background-clip: text; background-clip: text; color: transparent;
  filter: drop-shadow(0 2px 0 rgba(0,0,0,.8)); }
.kdc.kicked .kdc-name { top: 478px; }
.kdc-rule { position: absolute; left: 90px; right: 90px; top: 522px; height: 1px; z-index: 7; background: linear-gradient(90deg, transparent, var(--rim), transparent); }
.kdc-rule::after { content: ''; position: absolute; left: 50%; top: -4px; width: 8px; height: 8px; margin-left: -4px; transform: rotate(45deg); background: var(--rim); }
.kdc-foil { position: absolute; inset: 0; z-index: 8; mix-blend-mode: color-dodge; opacity: .42; border-radius: 30px;
  -webkit-mask: linear-gradient(180deg, rgba(0,0,0,.28), rgba(0,0,0,.18) 60%, rgba(0,0,0,.5) 78%, rgba(0,0,0,.28));
  background: repeating-linear-gradient(115deg, rgba(255,0,140,.35) 0%, rgba(255,210,0,.3) 7%, rgba(0,255,170,.3) 14%, rgba(0,160,255,.35) 21%, rgba(200,0,255,.3) 28%),
    repeating-radial-gradient(circle at 30% 20%, rgba(255,255,255,.35) 0 1px, transparent 1px 7px);
  background-size: 260% 260%, 100% 100%; background-blend-mode: overlay; }
.kdc-glare { position: absolute; inset: 0; z-index: 9; mix-blend-mode: overlay; border-radius: 30px;
  background: radial-gradient(circle at var(--gx, 50%) var(--gy, 30%), rgba(255,255,255,.58), rgba(255,255,255,0) 42%); }
.kdc-glint { position: absolute; inset: 0; z-index: 9; mix-blend-mode: screen; border-radius: 30px; opacity: 0;
  background: linear-gradient(110deg, transparent 42%, rgba(255,250,235,.55) 50%, transparent 58%) no-repeat; background-size: 250% 100%; }
`;

/** A full-frame div whose children render in 3D with the stage's perspective, painted in DOM order. */
export function perspectiveGroup() {
  if (!document.getElementById('kdc-css')) document.head.append(Object.assign(document.createElement('style'), { id: 'kdc-css', textContent: CSS }));
  return Object.assign(document.createElement('div'), { className: 'kdc-group' });
}

/** Frame position of a point (card px, or any local px) under matrix m, with the stage perspective. s = scale there. */
export function project(m, x, y, z = 0) {
  const p = m.transformPoint(new DOMPoint(x, y, z, 1)), k = PERSPECTIVE / (PERSPECTIVE - p.z);
  return { x: ORIGIN[0] + (p.x - ORIGIN[0]) * k, y: ORIGIN[1] + (p.y - ORIGIN[1]) * k, s: k };
}

// How far a face's normal leans from the line to the eye, in frame x and y (0,0 = facing the viewer).
function lean(m) {
  const c = m.transformPoint(new DOMPoint(CARD_W / 2, CARD_H / 2, 0, 1)), n = m.transformPoint(new DOMPoint(0, 0, 1, 0));
  const e = [ORIGIN[0] - c.x, ORIGIN[1] - c.y, PERSPECTIVE - c.z], nl = Math.hypot(n.x, n.y, n.z), el = Math.hypot(...e);
  return [n.x / nl - e[0] / el, n.y / nl - e[1] / el];
}
const FLIP = new DOMMatrix().translate(CARD_W / 2, 0).rotateAxisAngle(0, 1, 0, 180).translate(-CARD_W / 2, 0);

const fitName = (text, px) => {
  const g = canvas(8, 8).getContext('2d'); g.font = `700 ${px}px Cinzel`; g.letterSpacing = `${px * 0.22}px`;
  return Math.min(px, Math.floor(px * NAME_MAX / g.measureText(text).width));
};

/**
 * Builds one card. spec: { name, kicker?, element, art (url), emblem (url), back (url), focus? [fx, fy] of the art
 * to push toward, altArt? (url) }. Returns { el, set(t, m, state), point(x, y, z), artPoint(fx, fy, push?) }.
 */
export async function makeCard({ name, kicker = '', element, art, altArt, emblem, back, focus = [0.5, 0.5] }) {
  const E = ELEMENTS[element], el = document.createElement('div');
  el.className = `kdc${kicker ? ' kicked' : ''}`;
  el.style.setProperty('--metal', E.metal); el.style.setProperty('--rim', E.rim);
  el.innerHTML = `<div class="kdc-face kdc-front"><div class="kdc-art"><img src="${art}">${altArt ? `<img class="kdc-alt" src="${altArt}">` : ''}<canvas width="${ART.w}" height="${ART.h}"></canvas></div>
    <div class="kdc-gem"><img src="${emblem}"></div>${kicker ? `<div class="kdc-kicker">${kicker}</div>` : ''}<div class="kdc-name">${name}</div>
    <div class="kdc-rule"></div><div class="kdc-foil"></div><div class="kdc-glare"></div><div class="kdc-glint"></div></div>
    <div class="kdc-face kdc-back"><img src="${back}"><div class="kdc-foil"></div><div class="kdc-glare"></div><div class="kdc-glint"></div></div>`;
  const q = s => el.querySelector(s), front = q('.kdc-front'), img = q('.kdc-art img'), alt = q('.kdc-alt'), motes = q('.kdc-art canvas').getContext('2d');
  const gem = q('.kdc-gem'), gemImg = q('.kdc-gem img');
  q('.kdc-name').style.fontSize = `${fitName(name, kicker ? 40 : 36)}px`;
  for (const i of [img, alt]) if (i) i.style.transformOrigin = `${focus[0] * 100}% ${focus[1] * 100}%`;
  await Promise.all([...el.querySelectorAll('img')].map(i => i.decode()));
  const faces = [[front, null], [q('.kdc-back'), FLIP]].map(([f, flip]) => ({ flip, glare: f.querySelector('.kdc-glare'), foil: f.querySelector('.kdc-foil'), glint: f.querySelector('.kdc-glint') }));
  const [r, g, b] = E.glow, seed = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
  const card = {
    el, m: new DOMMatrix(), push: 0,
    /**
     * Pose and state for time t. state: lit 0..1 (gem glow; above 1 flares), push (art zoom), motes (particle amount),
     * aura (rim glow), dim 0..1 (art darkens), alt 0..1 (crossfade to altArt), heat 0..1 (the art glows hot).
     * The glare, the foil and the strip-light band are not state: they follow the card's angle in m.
     */
    set(t, m, { lit = 1, push = 0, motes: mo = 1, aura = 1, dim = 0, alt: al = 0, heat = 0 } = {}) {
      card.m = m; card.push = push;
      el.style.transform = m.toString();
      for (const f of faces) {
        const [x, y] = lean(f.flip ? m.multiply(f.flip) : m), band = SHINE.at + (x * SHINE.dir[0] + y * SHINE.dir[1]) * SHINE.gain;
        f.glare.style.setProperty('--gx', `${50 - x * 126}%`); f.glare.style.setProperty('--gy', `${32 - y * 115}%`);
        f.foil.style.backgroundPosition = `${50 + x * 230}% ${50 - y * 230}%, 0 0`;
        // background-size 250 %: position p puts the band at 1.25 − 1.5·p of the face width
        f.glint.style.opacity = SHINE.strength; f.glint.style.backgroundPosition = `${(1.25 - band) / 1.5 * 100}% 0`;
      }
      const art = `scale(${1.04 + push})`;
      const shade = [dim ? `brightness(${1 - 0.7 * dim}) saturate(${1 - 0.5 * dim})` : '',
        heat ? `sepia(${HEAT.sepia * heat}) saturate(${1 + HEAT.saturate * heat}) brightness(${1 + HEAT.bright * heat})` : ''].join(' ').trim();
      img.style.transform = art; img.style.filter = shade;
      if (alt) { alt.style.transform = art; alt.style.filter = shade; alt.style.opacity = al; }
      motes.clearRect(0, 0, ART.w, ART.h);
      if (mo > 0) particles(motes, t, { n: Math.round(60 * mo), seed: seed % 97, color: E.mote, rise: 60, area: [0, 0, ART.w, ART.h], size: [1, 2.6], bokeh: 6 });
      gemImg.style.opacity = lit; gemImg.style.filter = `drop-shadow(0 0 ${8 * lit}px rgba(${r},${g},${b},.9)) brightness(${0.4 + 0.6 * lit})`;
      gem.style.boxShadow = `0 0 0 3px ${E.rim}, 0 0 ${30 * lit}px rgba(${r},${g},${b},${0.8 * lit}), inset 0 0 18px rgba(0,0,0,.8)`;
      front.style.boxShadow = `0 50px 90px rgba(0,0,0,.65), 0 0 ${60 * aura}px rgba(${r},${g},${b},${0.35 * aura})`;
    },
    /** Frame position of a card-px point under the current pose. */
    point: (x, y, z = 0) => project(card.m, x, y, z),
    /** Card-px position [x, y, px per image px] of a point of the art image given as fractions, under object-fit cover and a push. */
    artPoint(fx, fy, push = card.push) {
      const k = Math.max(ART.w / img.naturalWidth, ART.h / img.naturalHeight), dw = img.naturalWidth * k, dh = img.naturalHeight * k;
      const px = (ART.w - dw) / 2 + fx * dw, py = (ART.h - dh) / 2 + fy * dh, s = 1.04 + push;
      const ox = focus[0] * ART.w, oy = focus[1] * ART.h;
      return [ART.x + ox + (px - ox) * s, ART.y + oy + (py - oy) * s, k * s];
    },
  };
  return card;
}

/** Art for a king card without its own illustration: the king cut-out framed over a painted field in its element colours. */
export function kingArt(king, element, seed = 1) {
  const w = ART.w * 2, h = ART.h * 2, c = canvas(w, h), g = c.getContext('2d'), r = rand(seed), [c0, c1, c2, c3] = ELEMENTS[element].field;
  const base = g.createLinearGradient(0, h, w * 0.6, 0);
  base.addColorStop(0, c0); base.addColorStop(0.55, c1); base.addColorStop(1, c2);
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  g.lineCap = 'round';
  for (let i = 0; i < 420; i++) {   // painted brush strokes
    const x = r() * w, y = r() * h, l = 40 + r() * 180, a = -0.9 + (r() - 0.5) * 0.5;
    g.strokeStyle = r() < 0.5 ? c3 : c0; g.globalAlpha = 0.03 + r() * 0.1; g.lineWidth = 4 + r() * 22;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  g.globalAlpha = 1;
  const halo = g.createRadialGradient(w / 2, h * 0.42, 0, w / 2, h * 0.42, h * 0.5);   // a pale disc behind the king
  halo.addColorStop(0, c3); halo.addColorStop(0.45, `${c3}88`); halo.addColorStop(1, `${c3}00`);
  g.fillStyle = halo; g.fillRect(0, 0, w, h);
  const k = trim(king), s = (h * 0.96) / k.height;
  g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 30;
  g.drawImage(k, (w - k.width * s) / 2, h * 0.05, k.width * s, k.height * s);
  return c.toDataURL('image/jpeg', 0.92);
}

/** Procedural card back (used when no painted back exists): obsidian with a gold compass rose. */
export function cardBack() {
  const w = CARD_W * 2, h = CARD_H * 2, c = canvas(w, h), g = c.getContext('2d');
  const bg = g.createRadialGradient(w / 2, h * 0.45, 0, w / 2, h / 2, h * 0.7);
  bg.addColorStop(0, '#1f2533'); bg.addColorStop(1, '#06070b'); g.fillStyle = bg; g.fillRect(0, 0, w, h);
  const gold = g.createLinearGradient(0, 0, w, h);
  gold.addColorStop(0, '#fff1c9'); gold.addColorStop(0.4, '#d7a650'); gold.addColorStop(0.7, '#8a5a1c'); gold.addColorStop(1, '#f3d58e');
  g.strokeStyle = 'rgba(215,166,80,.07)'; g.lineWidth = 2;   // fine lattice
  for (let i = -h; i < w + h; i += 44) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + h, h); g.moveTo(i, h); g.lineTo(i + h, 0); g.stroke(); }
  g.translate(w / 2, h / 2); g.strokeStyle = gold; g.fillStyle = gold;
  for (const [rad, lw] of [[300, 4], [284, 1.5], [180, 3], [120, 1.5]]) { g.lineWidth = lw; g.beginPath(); g.arc(0, 0, rad, 0, 6.283); g.stroke(); }
  for (let i = 0; i < 8; i++) {   // compass rose: four long points, four short
    const l = i % 2 ? 190 : 340, wd = i % 2 ? 26 : 40;
    g.save(); g.rotate(i * Math.PI / 4); g.globalAlpha = i % 2 ? 0.7 : 1;
    g.beginPath(); g.moveTo(0, -l); g.lineTo(wd, 0); g.lineTo(0, wd * 0.6); g.lineTo(-wd, 0); g.closePath(); g.fill(); g.restore();
  }
  const core = g.createRadialGradient(-12, -12, 0, 0, 0, 60);
  core.addColorStop(0, '#5a6680'); core.addColorStop(1, '#0a0c12');
  g.fillStyle = core; g.beginPath(); g.arc(0, 0, 58, 0, 6.283); g.fill(); g.lineWidth = 5; g.stroke();
  return c.toDataURL('image/jpeg', 0.92);
}

/** Crops an image to its visible (non-transparent) pixels. */
export function trim(img) {
  const c = canvas(img.naturalWidth || img.width, img.naturalHeight || img.height), g = c.getContext('2d');
  g.drawImage(img, 0, 0);
  const { data } = g.getImageData(0, 0, c.width, c.height);
  let x0 = c.width, y0 = c.height, x1 = 0, y1 = 0;
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (data[(y * c.width + x) * 4 + 3] > 12) {
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  const out = canvas(x1 - x0 + 1, y1 - y0 + 1);
  out.getContext('2d').drawImage(c, -x0, -y0);
  return out;
}

// ---- holograms ----
const SCAN = { period: 3, drift: 10, dark: 0.62 };    // scanlines: period (frame px), crawl up the figure (px/s), darkness
const BEAM = { sweep: 34, streaks: 26, base: 0.4 };   // light streaks slide across the projector beam (texture px/s); dim between them
const REFRESH = { every: 1.6, band: 46, alpha: 0.5, line: 0.55 };   // a refresh line of light climbs each figure every `every` s:
                                                                        // a soft band inside the figure (px tall) and a scan line across it
const BOKEH = { n: 14, size: [9, 26], alpha: 0.22 };  // defocus 1: motes in the beam open into discs this big (frame px)
const scanPattern = (() => { const c = canvas(1, SCAN.period), g = c.getContext('2d'); g.fillStyle = `rgba(0,0,0,${SCAN.dark})`; g.fillRect(0, 0, 1, 1); return c; })();
const beam = (() => {   // projector beam texture: narrow at the lens, wide at the top
  const w = 256, h = 512, c = canvas(w, h), g = c.getContext('2d');
  g.filter = 'blur(10px)';
  const gr = g.createLinearGradient(0, h, 0, 0);
  gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(0.35, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.beginPath(); g.moveTo(w * 0.36, h); g.lineTo(w * 0.64, h); g.lineTo(w - 12, 12); g.lineTo(12, 12); g.closePath(); g.fill();
  return c;
})();
const streaks = (() => {   // the beam's light streaks as an alpha mask: two identical 256 px periods, so an offset wraps
  const c = canvas(512, 1), g = c.getContext('2d'), r = rand(5);
  g.fillStyle = `rgba(0,0,0,${BEAM.base})`; g.fillRect(0, 0, 512, 1);
  for (let i = 0; i < BEAM.streaks; i++) {
    const x = r() * 256, w = 4 + r() * 18; g.fillStyle = `rgba(0,0,0,${0.35 + r() * 0.65})`;
    g.fillRect(x, 0, w, 1); g.fillRect(x + 256, 0, w, 1); if (x + w > 256) g.fillRect(x - 256, 0, w, 1);
  }
  return c;
})();
const beamNow = canvas(beam.width, beam.height);
let scratch = canvas(8, 8);

/** Tints a king cut-out into hologram light for its element. */
export function makeHologram(img, element) {
  const [R, G, B] = ELEMENTS[element].holo, src = trim(img), w = src.width, h = src.height;
  const tint = canvas(w, h), tg = tint.getContext('2d');
  tg.drawImage(src, 0, 0);
  const d = tg.getImageData(0, 0, w, h), p = d.data, lum = i => (0.3 * p[i] + 0.59 * p[i + 1] + 0.11 * p[i + 2]) / 255;
  // Normalise brightness so dark and pale kings project equally bright (5th..97th percentile of visible pixels).
  const ls = []; for (let i = 0; i < p.length; i += 16) if (p[i + 3] > 128) ls.push(lum(i));
  ls.sort((a, b) => a - b);
  const lo = ls[Math.floor(ls.length * 0.05)] ?? 0, hi = ls[Math.floor(ls.length * 0.97)] ?? 1;
  for (let i = 0; i < p.length; i += 4) {
    const l = clamp((lum(i) - lo) / Math.max(0.05, hi - lo), 0, 1), v = Math.pow(l, 0.75), hot = Math.max(0, v - 0.6) * 1.5;
    p[i] = Math.min(255, R * (0.34 + 1.15 * v) + 255 * hot); p[i + 1] = Math.min(255, G * (0.34 + 1.15 * v) + 255 * hot);
    p[i + 2] = Math.min(255, B * (0.34 + 1.15 * v) + 255 * hot); p[i + 3] *= 0.62 + 0.38 * v;
  }
  tg.putImageData(d, 0, 0);
  const glow = canvas(Math.ceil(w / 4) + 24, Math.ceil(h / 4) + 24), gg = glow.getContext('2d');
  gg.filter = 'blur(7px)'; gg.drawImage(tint, 12, 12, w / 4, h / 4);
  const ray = canvas(beam.width, beam.height), rg = ray.getContext('2d');   // the projector beam in a paler tint
  rg.drawImage(beam, 0, 0); rg.globalCompositeOperation = 'source-in';
  rg.fillStyle = `rgb(${lerp(R, 255, 0.3)},${lerp(G, 255, 0.3)},${lerp(B, 255, 0.3)})`; rg.fillRect(0, 0, ray.width, ray.height);
  return { tint, glow, beam: ray, aspect: w / h, color: `${R},${G},${B}` };
}

/**
 * Draws a hologram standing on frame point (x, y), h px tall. reveal 0..1 builds it from the feet up;
 * glitch 0..1 adds slice offsets; seed varies flicker and glitches between holograms.
 */
export function drawHologram(g, holo, x, y, h, t, { reveal = 1, alpha = 1, glitch = 0, seed = 1 } = {}) {
  if (reveal <= 0 || alpha <= 0) return;
  const w = h * holo.aspect, pad = 16, sw = Math.ceil(w + pad * 2), sh = Math.ceil(h + pad * 2);
  if (scratch.width < sw || scratch.height < sh) scratch = canvas(Math.max(sw, scratch.width), Math.max(sh, scratch.height));
  const s = scratch.getContext('2d'), cut = h * (1 - reveal);
  s.clearRect(0, 0, scratch.width, scratch.height);
  s.save(); s.beginPath(); s.rect(0, pad + cut, sw, sh); s.clip(); s.drawImage(holo.tint, pad, pad, w, h); s.restore();
  s.globalCompositeOperation = 'destination-out';   // scanlines, crawling slowly up the figure
  const lines = s.createPattern(scanPattern, 'repeat'); lines.setTransform(new DOMMatrix().translate(0, -((t * SCAN.drift) % SCAN.period)));
  s.fillStyle = lines; s.fillRect(0, 0, sw, sh);
  s.globalCompositeOperation = 'source-atop';   // the refresh: a line of light climbs the figure, a soft band trailing it
  const k = ((t + seed * 0.53) % REFRESH.every) / REFRESH.every, by = pad + h * (1.08 - 1.25 * k), band = s.createLinearGradient(0, by - REFRESH.band, 0, by + 4);
  band.addColorStop(0, 'rgba(255,255,255,0)'); band.addColorStop(0.8, `rgba(255,255,255,${REFRESH.alpha * 0.45})`);
  band.addColorStop(0.93, `rgba(255,255,255,${REFRESH.alpha})`); band.addColorStop(1, 'rgba(255,255,255,0)');
  s.fillStyle = band; s.fillRect(0, by - REFRESH.band, sw, REFRESH.band + 4);
  s.globalCompositeOperation = 'source-over';

  // Flicker: a steady shimmer plus brief deterministic dropouts.
  const drop = ((t * 1.7 + seed * 0.61) % 1) < 0.035 ? 0.45 : 1;
  const a = alpha * drop * (0.86 + 0.08 * Math.sin(t * 41 + seed) + 0.05 * Math.sin(t * 13 + seed * 2));
  const ox = x - w / 2 - pad, oy = y - h - pad;
  g.save(); g.globalCompositeOperation = 'lighter';
  g.globalAlpha = a * 0.7; g.beginPath(); g.rect(ox - w, oy + cut - 30, w * 3 + sw, sh); g.clip();
  g.drawImage(holo.glow, x - w * 0.62, y - h * 1.03, w * 1.24, h * 1.08);
  // Glitch: on a slow deterministic beat (or forced by `glitch`) horizontal slices jump sideways.
  const beat = Math.floor(t * 2.3 + seed * 0.37), on = ((t * 2.3 + seed * 0.37) % 1) < 0.1 || glitch > 0;
  const r = rand(seed * 7919 + beat * 31 + (glitch > 0 ? Math.floor(t * 24) : 0)), slices = [];
  if (on) for (let i = 0, n = 2 + Math.round(glitch * 8); i < n; i++) slices.push([r() * sh, 4 + r() * (18 + 40 * glitch), (r() - 0.5) * (26 + 90 * glitch)]);
  const bands = []; let y0 = 0;
  for (const [sy, sl, dx] of slices.sort((p, q) => p[0] - q[0])) {
    const a0 = Math.max(sy, y0), a1 = Math.min(sh, sy + sl);
    if (a1 > a0) { bands.push([y0, a0, 0], [a0, a1, dx]); y0 = a1; }
  }
  bands.push([y0, sh, 0]);
  g.globalAlpha = a;
  for (const [b0, b1, dx] of bands) if (b1 > b0) g.drawImage(scratch, 0, b0, sw, b1 - b0, ox + dx, oy + b0, sw, b1 - b0);
  if (on) { g.globalAlpha = a * 0.35; g.drawImage(scratch, 0, 0, sw, sh, ox + 5 + glitch * 12, oy, sw, sh); }
  const edge = (ey, a) => {   // a horizontal line of light across the figure
    const eg = g.createLinearGradient(x - w * 0.7, 0, x + w * 0.7, 0);
    eg.addColorStop(0, `rgba(${holo.color},0)`); eg.addColorStop(0.5, 'rgba(255,255,255,1)'); eg.addColorStop(1, `rgba(${holo.color},0)`);
    g.globalAlpha = a; g.fillStyle = eg; g.fillRect(x - w * 0.7, ey - 1.5, w * 1.4, 3);
    g.globalAlpha = a * 0.35; g.fillRect(x - w * 0.7, ey - 8, w * 1.4, 16);
  };
  if (reveal < 1) edge(y - h * reveal, alpha * Math.min(1, (1 - reveal) * 10));   // the building edge, gone as the figure completes
  if (reveal >= 1 && by > pad && by < pad + h) edge(oy + by, alpha * REFRESH.line * Math.sin(Math.PI * (by - pad) / h));   // the refresh
  g.restore();
}

/**
 * A king card's projection on a 2D canvas: pulsing rings on the card face around the gem, a projector beam whose
 * light streaks sweep across, and the hologram standing on the gem. height is in card px (scaled by the perspective
 * at the gem). defocus 0..1: the caller blurs g for depth of field; the motes then open into bokeh discs.
 */
export function drawProjection(g, card, holo, t, { power = 1, reveal = 1, alpha = 1, glitch = 0, height = 470, seed = 1, defocus = 0 } = {}) {
  if (power <= 0) return;
  const base = card.point(GEM.x, GEM.y, 2), h = height * base.s, w = h * holo.aspect;
  g.save(); g.globalCompositeOperation = 'lighter'; g.lineWidth = 2;
  for (let i = 0; i < 3; i++) {   // rings on the card face
    const k = (t * 0.6 + i / 3 + seed * 0.13) % 1, rad = GEM.r * 1.2 + 190 * k;
    g.strokeStyle = `rgba(${holo.color},${0.55 * (1 - k) * power})`;
    g.beginPath();
    for (let j = 0; j <= 48; j++) { const a = j / 48 * 6.283, p = card.point(GEM.x + Math.cos(a) * rad, GEM.y + Math.sin(a) * rad, 2); j ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y); }
    g.stroke();
  }
  const lens = g.createRadialGradient(base.x, base.y, 0, base.x, base.y, 90 * base.s);
  lens.addColorStop(0, `rgba(255,255,255,${0.7 * power})`); lens.addColorStop(0.3, `rgba(${holo.color},${0.45 * power})`); lens.addColorStop(1, `rgba(${holo.color},0)`);
  g.fillStyle = lens; g.fillRect(base.x - 100 * base.s, base.y - 100 * base.s, 200 * base.s, 200 * base.s);
  // The beam rises with the power, then flickers with the hologram; its streaks slide across like a turning lens.
  const bn = beamNow.getContext('2d'), off = ((t * BEAM.sweep + seed * 57) % 256 + 256) % 256;
  bn.globalCompositeOperation = 'copy'; bn.drawImage(holo.beam, 0, 0);
  bn.globalCompositeOperation = 'destination-in'; bn.drawImage(streaks, -off, 0, 512, beam.height);
  const bh = h * 1.08 * clamp(power * 1.4, 0, 1), bw = w * 1.35;
  g.globalAlpha = (0.32 + 0.06 * Math.sin(t * 29 + seed)) * power * alpha;
  g.drawImage(beamNow, base.x - bw / 2, base.y - bh, bw, bh);
  g.globalAlpha = 1;
  particles(g, t + seed, { n: Math.round(22 * power), seed: 40 + seed, color: holo.color, rise: 70, area: [base.x - w * 0.45, base.y - h, w * 0.9, h], size: [1, 2.2], bokeh: 2 });
  if (defocus > 0) {   // out of focus, bright motes become discs with a faint rim (drawn sharp, over the blur)
    g.filter = 'none';
    const r = rand(90 + seed);
    for (let i = 0; i < BOKEH.n; i++) {
      const x = base.x + (r() - 0.5) * w * 0.95 + Math.sin(t * 0.7 + i) * 10, y = base.y - ((r() + t * 0.08 * (0.5 + r())) % 1) * h;
      bokeh(g, x, y, lerp(BOKEH.size[0], BOKEH.size[1], r()) * defocus, holo.color, BOKEH.alpha * defocus * power * alpha * (0.55 + 0.45 * Math.sin(t * 2.1 + i * 1.7)));
    }
  }
  g.restore();
  drawHologram(g, holo, base.x, base.y, h, t, { reveal, alpha, glitch, seed });
}

/** One out-of-focus highlight: an even disc with a slightly brighter rim (use with 'lighter'). */
export function bokeh(g, x, y, rad, color, a) {
  if (rad < 0.5 || a <= 0) return;
  const d = g.createRadialGradient(x, y, 0, x, y, rad);
  d.addColorStop(0, `rgba(${color},${a * 0.5})`); d.addColorStop(0.82, `rgba(${color},${a * 0.75})`);
  d.addColorStop(0.94, `rgba(255,255,255,${a})`); d.addColorStop(1, `rgba(${color},0)`);
  g.fillStyle = d; g.beginPath(); g.arc(x, y, rad, 0, 6.283); g.fill();
}
