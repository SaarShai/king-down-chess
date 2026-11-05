const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const smooth = t => t * t * (3 - 2 * t);

export const DURATION = 1180;
// Shared canvas coordinates after registration: the boot line is y≈1018.
export const ANCHOR = { x: 576, y: 1018 };
// Incoming action target: center torso. Hands, book and dagger stay intact.
export const HIT = { x: 576, y: 500 };

// A compact wind-up, forward book presentation, hold, and recovery. The return
// value is deliberately normalized so callers can choose the display scale.
export function actionAt(progress) {
  const t = clamp(progress);
  if (t <= 0 || t >= 1) return 0;
  if (t < 0.2) return -0.16 * smooth(t / 0.2);
  if (t < 0.5) return -0.16 + 1.16 * smooth((t - 0.2) / 0.3);
  if (t < 0.72) return 1;
  return 1 - smooth((t - 0.72) / 0.28);
}

// Both generated figures are a single painted pose. The source render reads
// left-facing, so the preview mirrors each cell into the canonical +x/right
// facing direction. The charcoal source cell is then shifted 95 px left of the
// ivory destination to share feet, scale and action pivot. Motion is a rigid
// translation/rotation;
// it never invents joints or stretches the hands, book or dagger.
export function drawBishop(canvas, image, side, extension = 0) {
  const ctx = canvas.getContext('2d');
  const sourceX = side ? 768 : 0;
  const destinationX = side ? 173 : 268;
  const amount = clamp(extension, -1, 1);
  const travel = amount * 22;
  const lift = Math.abs(amount) * 3;
  const rotation = amount * 0.018;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(travel, -lift);
  ctx.translate(ANCHOR.x, ANCHOR.y);
  ctx.rotate(rotation);
  ctx.translate(-ANCHOR.x, -ANCHOR.y);
  ctx.translate(destinationX + 768, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(image, sourceX, 0, 768, 1024, 0, 0, 768, 1024);
  ctx.restore();
}

// Dagger slash rig. The sleeve, hand and dagger hang clear of the robe, so the
// arm is cut along its painted outline and swung rigidly about the shoulder.
// The pad is redrawn on top to hide the sleeve root. Ivory cell coordinates;
// the charcoal figure sits 93 px further left in its cell.
const ARM_SHIFT = [0, -93];
const ARM = [[495,388],[560,388],[585,430],[598,500],[610,580],[622,660],[628,705],[615,718],[598,712],[590,745],[574,752],[546,718],[526,670],[512,668],[494,650],[490,600],[500,575],[506,530],[505,470],[498,420]];
const PAD = [[470,300],[612,300],[612,402],[560,396],[500,392],[470,392]];
export const PIVOT = { x: 535, y: 402 };
const TIP = { x: 578, y: 744 };
// Swing angle in the source cell: positive sweeps the dagger forward and up.
export const SLASH = { duration: 1150, approach: 380, wind: [200, 420], strike: [420, 545], hold: 720, back: -0.45, reach: 1.7, follow: 1.8, contact: 1.35 };
export function slashAngle(ms) {
  const s = SLASH;
  if (ms <= s.wind[0] || ms >= s.duration) return 0;
  if (ms < s.wind[1]) return s.back * smooth((ms - s.wind[0]) / (s.wind[1] - s.wind[0]));
  if (ms < s.strike[1]) return s.back + (s.reach - s.back) * smooth((ms - s.strike[0]) / (s.strike[1] - s.strike[0]));
  if (ms < s.hold) return s.reach + (s.follow - s.reach) * smooth((ms - s.strike[1]) / (s.hold - s.strike[1]));
  return s.follow * (1 - smooth((ms - s.hold) / (s.duration - s.hold)));
}
// First moment the swing passes the contact angle.
export const CONTACT_MS = (() => { for (let ms = SLASH.strike[0]; ms < SLASH.strike[1]; ms++) if (slashAngle(ms) >= SLASH.contact) return ms; return SLASH.strike[1]; })();
const shifted = (p, side) => ({ x: p.x + ARM_SHIFT[side], y: p.y });
const toCanvas = (p, side) => ({ x: (side ? 173 : 268) + 768 - p.x, y: p.y });
export function tipAt(swing, side = 0) { return toCanvas(rotate(shifted(TIP, side), swing, shifted(PIVOT, side)), side); }
function trace(ctx, points, side, fresh = true) { if (fresh) ctx.beginPath(); points.forEach(([x, y], i) => ctx[i ? 'lineTo' : 'moveTo'](x + ARM_SHIFT[side], y)); ctx.closePath(); }
function rotate(p, a, c) { const x = p.x - c.x, y = p.y - c.y; return { x: c.x + x * Math.cos(a) - y * Math.sin(a), y: c.y + x * Math.sin(a) + y * Math.cos(a) }; }
export function drawSlash(canvas, image, side, swing) {
  const ctx = canvas.getContext('2d'), sourceX = side ? 768 : 0, pivot = shifted(PIVOT, side);
  const paint = () => ctx.drawImage(image, sourceX, 0, 768, 1024, 0, 0, 768, 1024);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save(); ctx.translate((side ? 173 : 268) + 768, 0); ctx.scale(-1, 1);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 768, 1024); trace(ctx, ARM, side, false); ctx.clip('evenodd'); paint(); ctx.restore();
  ctx.save(); ctx.translate(pivot.x, pivot.y); ctx.rotate(swing); ctx.translate(-pivot.x, -pivot.y); trace(ctx, ARM, side); ctx.clip(); paint(); ctx.restore();
  ctx.save(); trace(ctx, PAD, side); ctx.clip(); paint(); ctx.restore();
  ctx.restore();
}
