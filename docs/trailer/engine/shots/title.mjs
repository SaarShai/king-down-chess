// Title (Act V, row 11, 7 s). The kings end in white; it clears from the edges into the King Down helmet, which cools
// from white heat. The sword settles over the crown with a glint, draws back, hangs and drops through it: the impact
// lands on the beat (1.5 s). The capital at night appears behind, the call to action (params.cta) lands on a beat,
// and the hold lives (rising embers, breathing light shafts, a slow push-in, one light sweep on the gilding)
// until the last second fades to black.
import { W, H, finish, load, canvas, rand, clamp, lerp } from '../runtime.mjs';
import { ease, bezier, keys, spring, camera, embers, sparks, flare, aberration } from '../motion.mjs';

// ---- timing (seconds, local to the shot; beats every 0.5 s) ----
const WHITE = { hold: 0, clear: 0.5, curve: bezier(0.3, 0, 0.3, 1) };  // the kings' white clears from the cut (a beat) and closes on the helmet on the next beat
const COOL = [0.15, 1.3];        // the helmet cools from white heat to its painted colours
const GLOW_IN = [0.3, 2];        // the warm light behind the logo comes up
const SWORD = { enter: 0.5, settle: 1.0, back: 1.2, hang: 1.28 };  // slides in, settles over the crown, draws back, hangs, drops
const GLINT = [0.88, 1.0, 1.3];  // the glint on the tip: rises, peaks as the sword settles, gone
const IMPACT = 1.5;              // the sword hits the crown (global 66.5 s: the sound cue)
const HOLD = 0.1, PULL = 0.45;   // the camera hangs on the impact, then recoils with this time constant
const BACKDROP_IN = [1.6, 4.4];  // the capital (or the night fallback) appears behind
const CTA_AT = 3.5;              // the call to action lands
const SWEEP = [4.5, 5.9];        // one slow light sweep across the gilding
const PUSH = [2, 7];             // the slow push-in over the hold
const FADE_OUT = 1;              // fade to black over the last second

// ---- look ----
const art = path => new URL(path, import.meta.url).href;  // paths are relative to this file
const LOGO_SRC = art('../../assets/logo.png');
const BACKDROP_SRC = art('../../assets/gen/capital-bg.png');  // optional; a procedural night stands in when it is missing
// floor: darkening behind the call to action; scale: margin for the camera sway
const BACKDROP = { alpha: 0.85, filter: 'brightness(.6) saturate(.85) blur(1.5px)', floor: 0.6, scale: 1.04 };
const BARS = 132;                // letterbox height (runtime.finish)
const WHITE_RGB = '255,255,255'; // the kings shot's white (pure white; kings.mjs WHITE.color)
// The white's edge: centre (the helmet), radius at half strength (px), soft edge (share of the radius), height/width,
// and when (s) the last glow round the helmet fades. radius[0] × (1 − soft[0]) must reach the far picture corners
// (1265 px in the squashed space at this centre and aspect), so the cut frame is pure white and the first frame after it clears.
const IRIS = { at: [960, 495], radius: [1700, 230], soft: [0.25, 0.9], aspect: [0.55, 1.25], fade: [0.4, 0.8] };
const LOGO_SCALE = 0.47;         // logo.png pixels → screen pixels (after the pull-back)
const LOGO_AT = [960, 190];      // screen position of the top of the pommel (after the pull-back): ~45 px under the bar at full push
const PIVOT = [960, 508];        // the camera zooms about this screen point (the helmet)
// Zoom before the impact, extra that settles over `settleT` s as the logo cools, the lean into the drop, the push over the hold.
const ZOOM = { close: 1.28, settle: 0.05, settleT: 1.4, lean: 0.03, push: 0.04 };
const HANDHELD = 0.3;            // camera sway
const DEPTH = { backdrop: 4, far: 2, near: 0.6 };  // parallax: more than 1 moves less than the logo
// The impact stack. Decays are rates (1/s): higher is shorter.
const HIT = {
  shake: 18, shakeDecay: 6,        // camera shake at full trauma (px)
  fringe: 8, fringeDecay: 14,      // colour fringing (px)
  art: 20, bloom: 6,               // the logo's overexposure and its bloom
  light: 360, lightDecay: 8,       // the light on the crown: radius (px)
  streak: 1000, streakDecay: 3.5,  // the anamorphic streak: half-length (px)
  raysDecay: 2,                    // the light shafts' burst
};
const ENTER_PX = -1330, HANG = -1000, WINDUP_PX = 60;  // sword offset (logo px, 0 = home): where it starts (the tip shows the frame after the beat), where it hangs; the draw-back
const SMEAR = { n: 6, dt: 0.006, alpha: 0.16 };  // echoes behind the falling sword: count, spacing (s), strength
const GLINT_LOOK = { size: 110, alpha: 0.9 };    // the four-point glint on the tip
const GLOW = { at: [960, 450], r: 720, rest: 0.22, hit: 0.3, decay: 3 };  // warm light behind the logo: centre, radius, strength, impact extra
// Call to action: position, size, letter spacing and the extra it tightens from, rise, gap to the diamonds, hairline length;
// seconds after it lands: to appear, settle and cool from white heat to gold; the diamonds spring in; the hairlines draw;
// then it grows by `drift` until the end, so it never sits dead still.
const CTA = { y: 890, px: 34, spacing: 10, track: 14, rise: 8, gap: 26, rule: 120, fade: 0.3, settle: 1.1, cool: 0.6, diamonds: 0.05, rules: [0.1, 1], drift: 0.015 };
const GOLD = ['#fff3d2', '#e9c27a', '#b98437'];  // call-to-action gilding, top to bottom
const WARM = '255,140,60', EMBER = '255,146,62', RAY = '255,196,130', STREAK = '215,230,255';
// Light shafts from behind the crown: resting strength, extra on the impact, breath depth and period (s; the breath is lowest
// on the impact and swells a period later: 2.5, 4.5, 6.5 s), turn (rad/s), centre below the impact (px).
const RAYS = { rest: 1.2, hit: 2, breathe: 0.4, period: 2, spin: 0.02, below: 90 };
// Embers: a burst off the crown on the impact, a steady trickle off the helmet, a far field and near bokeh (parallax layers)
// that come up over `fadeIn` s after the impact.
const EMBERS = {
  fadeIn: 1.5,
  burst: { n: 46, seed: 5, spread: 0.2, w: 200, speed: 150, life: 2.6, size: 2.6 },
  trickle: { n: 120, seed: 9, x: 960, y: 520, w: 460, speed: 70, life: 3.2, size: 2.3, alpha: 0.9 },
  far: { n: 110, seed: 29, rise: 34, bokeh: 8, size: [1, 2.6], color: EMBER },
  near: { n: 12, seed: 44, rise: 60, bokeh: 12, size: [2, 4.5], color: EMBER },
};
const SHEEN = { strength: 0.95, width: 170, tilt: 0.58, row: 560 };  // the sweep: strength, half-width and slant (logo px), row it is centred on
const GILD = { min: 60, range: 50 };  // what the sweep counts as gilding: warmth (red and green over blue) threshold and ramp
const SPARKS = { n: 60, seed: 17, speed: [500, 1900], dir: -Math.PI / 2, spread: Math.PI * 0.95, gravity: 700, drag: 3.2, life: [0.15, 0.7], width: [1, 3], color: '255,200,120' };
const RING = { radius: 680, dur: 0.45, squash: 0.26, alpha: 0.35 };  // the soft shock ring in the crown's plane

// ---- anatomy of logo.png (700 × 1400), measured from the art ----
const ART = {
  top: 24, cx: 342,              // top of the pommel; the sword's centre line
  clear: 300,                    // above this row there is only the sword
  blade: [283, 400],             // columns of the ricasso and upper blade
  entry: 400,                    // the blade enters the helmet (the broken collar) at this row
  spike: [[345, 389], [342, 400], [348.5, 400]],  // tip of the crown's centre spike, in front of the blade
  plate: 860,                    // the blade comes out under the DOWN plate at this row
  gap: [302, 379, 975],          // below the plate the blade covers columns between these two, down to this row
  lit: 1000,                     // the plate shades the blade above this row
  rowTop: [383, 305, 382],       // lit blade rows [row, x0, x1] (opaque part) that rebuild the stretch hidden in the helmet
  rowBot: [1000, 308, 374],
  hit: [343, 400], tip: [343, 1335],  // impact point; blade tip
};

const span = (t, [a, b]) => clamp((t - a) / (b - a), 0, 1);
const spike = g => { const [a, b, c] = ART.spike; g.moveTo(...a); g.lineTo(...b); g.lineTo(...c); g.closePath(); };

/** Split the logo into the helmet (no sword) and the whole sword, pommel to tip. */
function splitLogo(img) {
  const w = img.width, h = img.height, layer = () => { const c = canvas(w, h); return [c, c.getContext('2d')]; };
  const [sword, s] = layer(), [top, bot] = [ART.rowTop, ART.rowBot], [bx, bw] = [ART.blade[0], ART.blade[1] - ART.blade[0]];
  s.drawImage(img, 0, 0, w, ART.clear, 0, 0, w, ART.clear);
  s.drawImage(img, bx, ART.clear, bw, top[0] - ART.clear, bx, ART.clear, bw, top[0] - ART.clear);
  // The art hides the blade inside the helmet and shades it under the plate: blend a lit row from above into one from below.
  for (let y = top[0]; y < ART.lit; y++) {
    const k = (y - top[0]) / (ART.lit - top[0]), x0 = lerp(top[1], bot[1], k), x1 = lerp(top[2], bot[2], k);
    s.globalAlpha = 1; s.drawImage(img, top[1], top[0], top[2] - top[1], 1, x0, y, x1 - x0, 1);
    s.globalAlpha = k; s.drawImage(img, bot[1], bot[0], bot[2] - bot[1], 1, x0, y, x1 - x0, 1);
  }
  s.globalAlpha = 1; s.drawImage(img, bx, ART.lit, bw, h - ART.lit, bx, ART.lit, bw, h - ART.lit);
  // The falling blade is clean (the stab draws the blood): paint each red pixel with the steel just above it.
  const b = s.getImageData(bx, ART.lit - 1, bw, h - ART.lit + 1), q = b.data, row = bw * 4;
  for (let o = row; o < q.length; o += 4) if (q[o] - Math.max(q[o + 1], q[o + 2]) > 10) for (let c = 0; c < 3; c++) q[o + c] = q[o - row + c];
  s.putImageData(b, bx, ART.lit - 1);

  const [helmet, g] = layer();
  g.drawImage(img, 0, 0); g.clearRect(0, 0, w, ART.clear); g.clearRect(bx, ART.clear, bw, ART.entry - ART.clear);
  g.save(); g.beginPath(); spike(g); g.clip(); g.drawImage(img, 0, 0); g.restore();
  // Below the plate, fill the blade's gap row by row between the pixels either side of it.
  const [x0, x1, y1] = ART.gap, d = g.getImageData(x0, ART.plate, x1 - x0 + 1, h - ART.plate), n = x1 - x0, p = d.data;
  for (let y = 0; y < d.height; y++) {
    const L = y * d.width * 4, R = L + n * 4, inside = y + ART.plate < y1;
    for (let x = 1; x < n; x++) {
      const k = x / n, o = L + x * 4, aL = p[L + 3] * (1 - k), aR = p[R + 3] * k, a = inside ? aL + aR : 0;
      for (let c = 0; c < 3; c++) p[o + c] = a ? (p[L + c] * aL + p[R + c] * aR) / a : 0;
      p[o + 3] = a;
    }
  }
  g.putImageData(d, x0, ART.plate);
  return { helmet, sword };
}

/** Where the logo is gilded (the crown and the letters): white, with alpha from how warm each pixel is. */
function gilding(img) {
  const c = canvas(img.width, img.height), g = c.getContext('2d');
  g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height), p = d.data;
  for (let i = 0; i < p.length; i += 4) {
    const warm = Math.min(p[i] - p[i + 2], 1.6 * (p[i + 1] - p[i + 2]));  // gold is warm in red and green; blood only in red
    p[i + 3] *= clamp((warm - GILD.min) / GILD.range, 0, 1); p[i] = p[i + 1] = p[i + 2] = 255;
  }
  g.putImageData(d, 0, 0);
  return c;
}

/** A copy of `src` in one flat colour, optionally blurred into a glow (padded by `pad`). */
function silhouette(src, color, blur = 0, pad = 0) {
  const c = canvas(src.width + pad * 2, src.height + pad * 2), g = c.getContext('2d');
  if (blur) g.filter = `blur(${blur}px)`;
  g.drawImage(src, pad, pad); g.filter = 'none';
  g.globalCompositeOperation = 'source-in'; g.fillStyle = color; g.fillRect(0, 0, c.width, c.height);
  return c;
}

/** Procedural stand-in for the capital: a cold night sky, stars, and hazy rows of towers with a few lit windows. */
function nightFallback() {
  const c = canvas(W, H), g = c.getContext('2d'), r = rand(41);
  const sky = g.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#03050b'); sky.addColorStop(0.55, '#0b1020'); sky.addColorStop(1, '#24170f');
  g.fillStyle = sky; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 240; i++) { g.fillStyle = `rgba(215,228,255,${0.06 + 0.5 * r() ** 4})`; g.fillRect(r() * W, r() * H * 0.6, 1.3, 1.3); }
  const [mx, my] = [W * 0.8, H * 0.24], moon = g.createRadialGradient(mx, my, 0, mx, my, 260);
  moon.addColorStop(0, 'rgba(225,235,255,.9)'); moon.addColorStop(0.17, 'rgba(200,215,245,.75)'); moon.addColorStop(0.19, 'rgba(150,175,230,.14)'); moon.addColorStop(1, 'rgba(150,175,230,0)');
  g.fillStyle = moon; g.fillRect(mx - 260, my - 260, 520, 520);
  const towers = (base, tall, color, lit, blur) => {
    const l = canvas(W, H), t = l.getContext('2d');
    for (let x = -40; x < W + 40;) {
      const w = 22 + r() * 56, mid = Math.max(0, 1 - Math.abs(x + w / 2 - W / 2) / (W * 0.42));
      const top = base - (18 + r() * tall * (0.4 + mid * mid)), roof = r();
      t.fillStyle = color; t.fillRect(x, top, w, H - top);
      if (roof < 0.45) { t.beginPath(); t.moveTo(x - 3, top); t.lineTo(x + w / 2, top - w * (1.1 + 1.2 * r())); t.lineTo(x + w + 3, top); t.fill(); }
      else if (roof < 0.7) for (let bx = x; bx < x + w - 3; bx += 9) t.fillRect(bx, top - 7, 5, 7);
      for (let wy = top + 14; wy < base + 60; wy += 19) for (let wx = x + 7; wx < x + w - 7; wx += 13) {
        if (r() > lit) continue;
        t.fillStyle = `rgba(255,${170 + r() * 50 | 0},90,${0.4 + 0.5 * r()})`; t.fillRect(wx, wy, 3, 5);
      }
      x += w + (r() < 0.2 ? r() * 40 : -r() * 8);
    }
    g.filter = `blur(${blur}px)`; g.drawImage(l, 0, 0); g.filter = 'none';
  };
  const haze = (y, a) => { const f = g.createLinearGradient(0, y - 160, 0, y + 60); f.addColorStop(0, `rgba(${WARM},0)`); f.addColorStop(1, `rgba(${WARM},${a})`); g.fillStyle = f; g.fillRect(0, y - 160, W, 220); };
  towers(H * 0.78, 260, '#161a2a', 0.04, 3);
  haze(H * 0.8, 0.12);
  towers(H * 0.9, 150, '#08090f', 0.08, 1.2);
  haze(H, 0.1);
  return c;
}

/** Cover-fit a backdrop image into the frame, graded dark so the logo reads over it. */
function cover(img) {
  const c = canvas(W, H), g = c.getContext('2d'), s = Math.max(W / img.width, H / img.height);
  g.filter = BACKDROP.filter; g.drawImage(img, (W - img.width * s) / 2, (H - img.height * s) / 2, img.width * s, img.height * s);
  return c;
}

/** Embers born between `from` and `from + spread` around (x, y), rising and swaying until they burn out. */
function rising(g, t, { n, seed, from, spread, x, y, w, speed, life, size = 2.4, alpha = 1 }) {
  const r = rand(seed);
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const born = from + r() * spread, x0 = x + (r() - 0.5) * w, y0 = y + (r() - 0.5) * 40, sp = speed * (0.5 + r());
    const lf = life * (0.6 + 0.8 * r()), s = size * (0.5 + r()), ph = r() * 6.28, drift = (r() - 0.5) * 70, age = t - born;
    if (age < 0 || age > lf) continue;
    const k = age / lf, px = x0 + drift * age + Math.sin(age * 2.1 + ph) * 16, py = y0 - sp * age * (1 - 0.25 * k);
    const a = alpha * Math.min(1, age / 0.15) * (1 - k) ** 1.3 * (0.7 + 0.3 * Math.sin(t * 17 + ph * 5));
    const gr = g.createRadialGradient(px, py, 0, px, py, s * 3.2);
    gr.addColorStop(0, `rgba(255,236,190,${a})`); gr.addColorStop(0.35, `rgba(${EMBER},${a * 0.8})`); gr.addColorStop(1, `rgba(${EMBER},0)`);
    g.fillStyle = gr; g.fillRect(px - s * 3.2, py - s * 3.2, s * 6.4, s * 6.4);
  }
  g.restore();
}

/** Soft shafts of light fanning out from a centre, drawn at half size and blurred (draw it at 2×). */
function rayFan() {
  const R = 800, c = canvas(R * 2, R * 2), g = c.getContext('2d'), r = rand(23);
  g.translate(R, R);
  for (let i = 0; i < 18; i++) {
    const ang = r() * 6.283, w = 0.015 + 0.045 * r(), l = R * (0.5 + 0.5 * r()), k = 0.35 + 0.65 * r();
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, l);
    gr.addColorStop(0, `rgba(${RAY},${0.12 * k})`); gr.addColorStop(1, `rgba(${RAY},0)`);
    g.fillStyle = gr; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, l, ang - w, ang + w); g.closePath(); g.fill();
  }
  const soft = canvas(R * 2, R * 2), sg = soft.getContext('2d'); sg.filter = 'blur(5px)'; sg.drawImage(c, 0, 0);
  return soft;
}

/** A four-point star glint. */
function glint(g, x, y, size, a) {
  if (a <= 0) return;
  g.save(); g.globalCompositeOperation = 'lighter'; g.translate(x, y);
  for (const [sx, sy] of [[size, size * 0.06], [size * 0.06, size * 0.4]]) {
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1); gr.addColorStop(0, `rgba(255,250,235,${a})`); gr.addColorStop(1, 'rgba(255,250,235,0)');
    g.save(); g.scale(sx, sy); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 1, 0, 6.283); g.fill(); g.restore();
  }
  g.restore();
}

export async function create(params, { fx, dur }) {
  const cta = params.cta ?? 'Play free';
  const [logo, backdrop] = await Promise.all([load(LOGO_SRC), load(BACKDROP_SRC).then(cover, () => null),
    document.fonts.load(`600 ${CTA.px}px Cinzel`)]);
  const night = backdrop ?? nightFallback(), fan = rayFan(), gild = gilding(logo);
  const { helmet, sword } = splitLogo(logo);
  const PAD = 60, white = silhouette(helmet, '#fff');
  const bloom = { helmet: silhouette(helmet, '#ffd9a0', 36, PAD), logo: silhouette(logo, '#ff9a45', 26, PAD) };
  const shade = silhouette(logo, '#000', 30, PAD);
  const sheen = canvas(logo.width, logo.height), sg = sheen.getContext('2d');  // the light sweep, masked to the gilding
  const S = LOGO_SCALE, toScreen = ([x, y]) => [LOGO_AT[0] + (x - ART.cx) * S, LOGO_AT[1] + (y - ART.top) * S];
  const hit = toScreen(ART.hit);
  // Sword offset from home (logo px): slides in and settles, draws back, hangs, then drops like a weight into the crown.
  const drop = t => keys(t, [[SWORD.enter, ENTER_PX], [SWORD.settle, HANG, ease.out], [SWORD.back, HANG - WINDUP_PX, ease.smooth],
    [SWORD.hang, HANG - WINDUP_PX], [IMPACT, 0, ease.in]]);
  // The camera: close on the helmet, leaning in faster and faster with the drop until the impact stops it dead;
  // it hangs on the impact, recoils, then pushes in slowly.
  const lean = t => ZOOM.close + ZOOM.settle * (1 - ease.out(t / ZOOM.settleT)) + ZOOM.lean * ease.in(span(t, [SWORD.back, IMPACT]));
  const zoom = t => (t < IMPACT ? lean(t)
    : 1 + (lean(IMPACT) - 1) * Math.exp(-Math.max(0, t - IMPACT - HOLD) / PULL) + ZOOM.push * ease.smooth(span(t, PUSH)));
  const cam = camera({
    path: t => { const z = zoom(t); return { x: PIVOT[0] - (PIVOT[0] - W / 2) / z, y: PIVOT[1] - (PIVOT[1] - H / 2) / z, zoom: z }; },
    handheld: HANDHELD, shakes: [{ at: IMPACT, amount: 1, decay: HIT.shakeDecay }], shake: HIT.shake,
  });

  function backdropLayer(g, t) {
    const k = ease.smooth(span(t, BACKDROP_IN));
    if (k <= 0) return;
    g.save(); g.globalAlpha = k * BACKDROP.alpha; cam.apply(g, t, DEPTH.backdrop);
    g.translate(W / 2, H / 2); g.scale(BACKDROP.scale, BACKDROP.scale); g.drawImage(night, -W / 2, -H / 2); g.restore();
    const floor = g.createLinearGradient(0, H * 0.58, 0, H - BARS);
    floor.addColorStop(0, 'rgba(2,3,6,0)'); floor.addColorStop(1, `rgba(2,3,6,${BACKDROP.floor * k})`);
    g.fillStyle = floor; g.fillRect(0, H * 0.58, W, H * 0.42);
  }
  // The logo in logo.png pixels: the cooling helmet and the falling sword before the impact, the original art after.
  function logoLayer(g, t, tau) {
    g.save(); g.translate(LOGO_AT[0] - ART.cx * S, LOGO_AT[1] - ART.top * S); g.scale(S, S); g.imageSmoothingQuality = 'high';
    if (tau < 0) {
      const heat = 1 - ease.smooth(span(t, COOL));
      g.drawImage(helmet, 0, 0);
      if (heat > 0) {  // overexposed: the art adds onto itself, white only at the very start, with a bloom
        g.globalCompositeOperation = 'lighter';
        g.globalAlpha = Math.min(1, heat * 2); g.drawImage(helmet, 0, 0); g.drawImage(helmet, 0, 0);
        g.globalAlpha = heat; g.drawImage(bloom.helmet, -PAD, -PAD);
        g.globalCompositeOperation = 'source-over'; g.globalAlpha = clamp(heat * 3 - 2, 0, 1); g.drawImage(white, 0, 0);
        g.globalAlpha = 1;
      }
      // The sword shows above the collar (behind the spike) and below the plate, smeared over its last positions as it falls.
      if (t > SWORD.enter) {
        g.save(); g.beginPath(); g.rect(0, -2000, logo.width, 2000 + ART.entry); spike(g); g.rect(0, ART.plate, logo.width, 2000); g.clip('evenodd');
        for (let i = t > SWORD.hang ? SMEAR.n : 0; i >= 0; i--) { g.globalAlpha = i ? SMEAR.alpha * (1 - i / (SMEAR.n + 1)) : 1; g.drawImage(sword, 0, drop(t - i * SMEAR.dt)); }
        g.restore();
      }
    } else {
      g.drawImage(shade, -PAD, -PAD + 18);
      g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.3 + 0.7 * Math.exp(-tau * HIT.bloom); g.drawImage(bloom.logo, -PAD, -PAD);
      g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
      g.drawImage(logo, 0, 0);
      g.globalCompositeOperation = 'lighter';
      const flash = Math.exp(-tau * HIT.art);  // the impact overexposes the art for a moment
      if (flash > 0.01) { g.globalAlpha = flash; g.drawImage(logo, 0, 0); g.drawImage(logo, 0, 0); g.globalAlpha = 1; }
      const sw = span(t, SWEEP);
      if (sw > 0 && sw < 1) {  // one slow light sweep across the gilding, slanted, centred on the gilded rows
        const { strength: a, width: w, tilt, row } = SHEEN, x = lerp(-w - 400 * tilt, logo.width + w + 400 * tilt, ease.smooth(sw));
        const band = sg.createLinearGradient(x - w, row - w * tilt, x + w, row + w * tilt);
        [[0, 0], [0.3, 0.12], [0.44, 0.5], [0.5, 1], [0.56, 0.5], [0.7, 0.12], [1, 0]].forEach(([o, k]) => band.addColorStop(o, `rgba(255,244,215,${a * k})`));
        sg.globalCompositeOperation = 'copy'; sg.fillStyle = band; sg.fillRect(0, 0, sheen.width, sheen.height);
        sg.globalCompositeOperation = 'destination-in'; sg.drawImage(gild, 0, 0);
        g.drawImage(sheen, 0, 0);
      }
    }
    g.restore();
  }
  function impact(g, tau) {
    if (tau < 0 || tau > 1.2) return;
    const [x, y] = hit, f = Math.exp(-tau * HIT.lightDecay), R = HIT.light;
    g.save(); g.globalCompositeOperation = 'lighter';
    const fl = g.createRadialGradient(x, y, 0, x, y, R);
    fl.addColorStop(0, `rgba(255,236,200,${f})`); fl.addColorStop(1, 'rgba(255,236,200,0)'); g.fillStyle = fl; g.fillRect(x - R, y - R, R * 2, R * 2);
    g.restore();
    flare(g, x, y, Math.exp(-tau * HIT.streakDecay), { color: STREAK, length: HIT.streak });  // anamorphic streak
    const rk = ease.out(tau / RING.dur), rr = 40 + (RING.radius - 40) * rk;  // a soft ring, so it blurs smoothly (motion.shockwave strobes under --blur)
    if (rk < 1) {
      g.save(); g.globalCompositeOperation = 'lighter'; g.translate(x, y + 10); g.scale(1, RING.squash);
      const ring = g.createRadialGradient(0, 0, rr * 0.84, 0, 0, rr);
      ring.addColorStop(0, 'rgba(255,214,160,0)'); ring.addColorStop(0.8, `rgba(255,214,160,${RING.alpha * (1 - rk)})`); ring.addColorStop(1, 'rgba(255,214,160,0)');
      g.fillStyle = ring; g.fillRect(-rr, -rr, rr * 2, rr * 2); g.restore();
    }
    sparks(g, tau, { x, y, ...SPARKS });
  }
  function callToAction(g, t) {
    const k = t - CTA_AT;
    if (!cta || k < 0) return;
    const a = ease.out(k / CTA.fade), s = ease.out(k / CTA.settle), hot = 1 - ease.out(k / CTA.cool), z = 1 + CTA.drift * ease.smooth(k / (dur - CTA_AT));
    const sp = lerp(CTA.spacing + CTA.track, CTA.spacing, s), y = CTA.y + CTA.rise * (1 - s);
    g.save(); g.translate(W / 2, y); g.scale(z, z); g.translate(-W / 2, -y); g.font = `600 ${CTA.px}px Cinzel`; g.letterSpacing = `${sp}px`; g.textAlign = 'center'; g.textBaseline = 'middle';
    const tw = g.measureText(cta).width - sp, x = W / 2 + sp / 2, tg = g.createLinearGradient(0, y - CTA.px / 2, 0, y + CTA.px / 2);
    GOLD.forEach((col, i) => tg.addColorStop(i / (GOLD.length - 1), col));
    g.globalAlpha = a; g.shadowColor = 'rgba(0,0,0,.85)'; g.shadowBlur = 18; g.fillStyle = tg; g.fillText(cta, x, y);
    if (hot > 0.01) {  // it lands white-hot and cools to gold, like the logo
      g.globalCompositeOperation = 'lighter'; g.shadowColor = `rgba(255,170,90,${hot})`; g.shadowBlur = 24;
      g.fillStyle = `rgba(255,244,222,${0.85 * hot})`; g.fillText(cta, x, y); g.globalCompositeOperation = 'source-over';
    }
    g.shadowBlur = 0;
    const d = spring(k - CTA.diamonds, { freq: 2.6, zeta: 0.45 }), lw = CTA.rule * ease.out((k - CTA.rules[0]) / (CTA.rules[1] - CTA.rules[0]));
    for (const side of [-1, 1]) {  // diamonds spin in either side, then hairlines draw outward from them
      const x0 = W / 2 + side * (tw / 2 + CTA.gap);
      if (lw > 0.5) {
        const rl = g.createLinearGradient(x0, 0, x0 + side * lw, 0); rl.addColorStop(0, GOLD[1]); rl.addColorStop(1, 'rgba(233,194,122,0)');
        g.fillStyle = rl; g.fillRect(Math.min(x0, x0 + side * lw), y - 0.75, lw, 1.5);
      }
      g.save(); g.translate(x0 - side * 6, y); g.rotate(Math.PI / 4 + side * (1 - d) * Math.PI); g.scale(d, d);
      g.fillStyle = GOLD[1]; g.fillRect(-3.5, -3.5, 7, 7); g.restore();
    }
    g.restore();
  }
  /** The kings' white, over the finished frame (no vignette or grain on it): it clears from the edges into the helmet. */
  function whiteOut(g, t) {
    const k = WHITE.curve(span(t, [WHITE.hold, WHITE.clear])), a = 1 - ease.smooth(span(t, IRIS.fade));
    if (a <= 0) return;
    const r = lerp(IRIS.radius[0], IRIS.radius[1], k), w = r * lerp(IRIS.soft[0], IRIS.soft[1], k);
    g.save(); g.beginPath(); g.rect(0, BARS, W, H - 2 * BARS); g.clip();
    g.translate(IRIS.at[0], IRIS.at[1]); g.scale(1, lerp(IRIS.aspect[0], IRIS.aspect[1], k));
    const wf = g.createRadialGradient(0, 0, r - w, 0, 0, r + w);
    for (let i = 0; i <= 8; i++) { const u = i / 8; wf.addColorStop(u, `rgba(${WHITE_RGB},${a * (1 - u) ** 2 * (1 + 2 * u)})`); }  // a smooth edge, no ring
    g.fillStyle = wf; g.fillRect(-W, -H * 4, W * 2, H * 8);
    g.restore();
  }

  return t => {
    const g = fx, tau = t - IMPACT, after = ease.out(span(t, [IMPACT, IMPACT + EMBERS.fadeIn]));
    g.save(); g.clearRect(0, 0, W, H); g.fillStyle = '#020306'; g.fillRect(0, 0, W, H);
    backdropLayer(g, t);
    { const a = GLOW.rest * ease.out(span(t, GLOW_IN)) + (tau > 0 ? GLOW.hit * Math.exp(-tau * GLOW.decay) : 0), [gx, gy] = GLOW.at, gl = g.createRadialGradient(gx, gy, 0, gx, gy, GLOW.r);
      gl.addColorStop(0, `rgba(${WARM},${a})`); gl.addColorStop(1, `rgba(${WARM},0)`); g.fillStyle = gl; g.fillRect(0, 0, W, H); }  // warm light behind the logo
    if (tau > 0) { g.save(); g.globalAlpha = after; cam.apply(g, t, DEPTH.far); embers(g, t, EMBERS.far); g.restore(); }

    g.save(); cam.apply(g, t);
    if (tau >= 0) {  // the impact's light fans out behind the logo, then breathes slowly
      const breath = 1 - RAYS.breathe * Math.cos(2 * Math.PI * tau / RAYS.period);
      g.save(); g.globalCompositeOperation = 'lighter'; g.translate(W / 2, hit[1] + RAYS.below); g.rotate(t * RAYS.spin); g.scale(2, 2);
      for (let a = RAYS.rest * breath + RAYS.hit * Math.exp(-tau * HIT.raysDecay); a > 0.005; a--) { g.globalAlpha = Math.min(1, a); g.drawImage(fan, -fan.width / 2, -fan.height / 2); }
      g.restore();
    }
    logoLayer(g, t, tau);
    const shine = keys(t, [[GLINT[0], 0], [GLINT[1], 1, ease.out], [GLINT[2], 0]]);
    if (tau < 0 && shine > 0) { const tip = toScreen([ART.tip[0], ART.tip[1] + drop(t)]); glint(g, tip[0] + 2, tip[1] - 24, GLINT_LOOK.size, GLINT_LOOK.alpha * shine); }
    impact(g, tau);
    // Embers rise off the crown: a burst on the impact, then a steady trickle.
    rising(g, t, { ...EMBERS.burst, from: IMPACT, x: hit[0], y: hit[1] + 20 });
    rising(g, t, { ...EMBERS.trickle, from: IMPACT, spread: dur - IMPACT });
    g.restore();

    callToAction(g, t);
    if (tau > 0) { g.save(); g.globalAlpha = after; cam.apply(g, t, DEPTH.near); embers(g, t, EMBERS.near); g.restore(); }
    g.restore();
    if (tau >= 0) aberration(g, HIT.fringe * Math.exp(-tau * HIT.fringeDecay));
    finish(g, t);
    whiteOut(g, t);
    const out = ease.smooth(span(t, [dur - FADE_OUT, dur]));
    if (out > 0) { g.fillStyle = `rgba(0,0,0,${out})`; g.fillRect(0, 0, W, H); }
  };
}
