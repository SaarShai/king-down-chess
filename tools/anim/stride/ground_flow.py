# Method A: ground-band flow stride measurement for shipped move banks.
# Usage: python3 -P ground_flow.py <repo> <outdir> [character:army:facing ...]
# Reads public/character-runtime (manifest + webp frames). Writes results.json / results.csv.
import json, sys, os, math
import numpy as np
import cv2
from PIL import Image

TILE = 112.0  # board px per square (scene.mjs TILE); travel px = squares * TILE, squares is Euclidean
HEIGHT = {'pawn': 96, 'knight': 112, 'bishop': 114, 'rook': 132, 'queen': 120, 'archer': 120,
          'paladin': 124, 'maester': 112, 'ogre': 136, 'guard': 114}  # character-runtime.mjs; default 130
S2 = math.sqrt(0.5)
# Screen unit vector of travel per facing (facingOf(dx,dy) uses screen dx,dy; N = -y).
DIRS = {'N': (0, -1), 'NE': (S2, -S2), 'E': (1, 0), 'SE': (S2, S2), 'S': (0, 1), 'SW': (-S2, S2), 'W': (-1, 0), 'NW': (-S2, -S2)}

ALPHA = 0.5
COST_H = float(os.environ.get('COST_H', '0.18'))
MAX_ANGLE = 40.0  # degrees between stance shift and backward axis


def load(rt, url):
    a = np.asarray(Image.open(os.path.join(rt, url)).convert('RGBA'), dtype=np.float32) / 255.0
    return a


def ground_row(frames, pivot):
    # Lowest opaque row near the registered foot line, per pose (median over poses).
    gy = int(round(pivot[1]))
    rows = []
    for f in frames:
        al = f[:, :, 3] > ALPHA
        lo = max(0, gy - 60); hi = min(al.shape[0], gy + 25)
        r = np.where(al[lo:hi].any(axis=1))[0]
        rows.append(lo + r[-1] if len(r) else gy)
    return int(np.median(rows)), rows


def blobs(frame, top, bot, min_area):
    al = (frame[top:bot, :, 3] > ALPHA).astype(np.uint8)
    n, lab, st, cen = cv2.connectedComponentsWithStats(al, connectivity=8)
    out = []
    for i in range(1, n):
        x, y, w, h, area = st[i]
        if area >= min_area:
            out.append({'x0': int(x), 'x1': int(x + w), 'area': int(area), 'mask': lab == i})
    return out


def match(fi, fj, x0, x1, top, bot, ptop, search, back=None, max_angle=65.0):
    """Masked SSD of frame-i patch (cols x0:x1, rows ptop:bot) over frame j, shifts within +-search.
    Returns (dx, dy, cost, ncc-like score, second-best cost ratio)."""
    H, W = fi.shape[:2]
    pad_x, pad_y = search, max(6, search // 3)
    tx0, tx1 = max(0, x0 - 3), min(W, x1 + 3)
    tpl = fi[ptop:bot, tx0:tx1].copy()
    m = (tpl[:, :, 3] > ALPHA).astype(np.float32)
    if m.sum() < 30:
        return None
    big = np.zeros((H + 2 * pad_y, W + 2 * pad_x, 4), np.float32)
    big[pad_y:pad_y + H, pad_x:pad_x + W] = fj
    sy0, sy1 = ptop, bot + 2 * pad_y
    sx0, sx1 = tx0, tx1 + 2 * pad_x
    region = big[sy0:sy1, sx0:sx1]
    T = np.dstack([tpl[:, :, :3] * tpl[:, :, 3:4], tpl[:, :, 3:4] * 1.5])
    R = np.dstack([region[:, :, :3] * region[:, :, 3:4], region[:, :, 3:4] * 1.5])
    mk = np.dstack([m] * 4)
    res = cv2.matchTemplate(R, T, cv2.TM_SQDIFF, mask=mk) / (m.sum() * 4)
    if back is not None:
        yy, xx = np.mgrid[0:res.shape[0], 0:res.shape[1]]
        ddx, ddy = xx - pad_x, yy - pad_y
        al = ddx * back[0] + ddy * back[1]
        pp = np.abs(ddx * back[1] - ddy * back[0])
        ang = np.degrees(np.arctan2(pp, np.maximum(al, 1e-6)))
        allowed = (al >= -3) & ((np.hypot(ddx, ddy) < 6) | (ang <= max_angle))
        res = np.where(allowed, res, np.inf).astype(np.float32)
    iy, ix = np.unravel_index(np.argmin(res), res.shape)
    best = res[iy, ix]
    # sub-pixel parabola
    def para(a, b, c):
        d = a - 2 * b + c
        return 0.5 * (a - c) / d if d > 1e-9 else 0.0
    fin = lambda v: np.isfinite(v)
    fx = para(res[iy, ix - 1], best, res[iy, ix + 1]) if 0 < ix < res.shape[1] - 1 and fin(res[iy, ix - 1]) and fin(res[iy, ix + 1]) else 0.0
    fy = para(res[iy - 1, ix], best, res[iy + 1, ix]) if 0 < iy < res.shape[0] - 1 and fin(res[iy - 1, ix]) and fin(res[iy + 1, ix]) else 0.0
    dx = ix + fx - pad_x
    dy = iy + fy - pad_y
    # reference cost: template vs empty canvas (energy), to normalise
    energy = float((T ** 2 * mk).sum() / (m.sum() * 4))
    # distinctness: best cost in the opposite half-plane of x shift beyond 8 px
    return {'dx': float(dx), 'dy': float(dy), 'cost': float(best), 'rel': float(best / max(energy, 1e-6)), 'idx': (int(iy), int(ix)), 'res': res, 'pad': (pad_x, pad_y)}


def contact_overlap(fj, blob_mask, top, bot, dx, dy):
    # IoU-like overlap of shifted band blob with frame j band alpha.
    bj = fj[top:bot, :, 3] > ALPHA
    M = np.float32([[1, 0, dx], [0, 1, dy]])
    sh = cv2.warpAffine(blob_mask.astype(np.uint8), M, (bj.shape[1], bj.shape[0]), flags=cv2.INTER_NEAREST) > 0
    a = sh.sum()
    return float((sh & bj).sum() / a) if a else 0.0


def cand(src, bl, dx, dy, back, **kw):
    d = np.array([dx, dy], float)
    along = float(d @ back)
    perp = float(abs(d[0] * back[1] - d[1] * back[0]))
    ang = math.degrees(math.atan2(perp, along)) if (along or perp) else 0.0
    out = {'src': src, 'x0': bl['x0'], 'x1': bl['x1'], 'area': bl['area'], 'dx': round(float(dx), 2), 'dy': round(float(dy), 2),
           'along': round(along, 2), 'perp': round(perp, 2), 'angle': round(ang, 1)}
    for key, v in kw.items():
        out[key] = round(v, 4) if isinstance(v, float) else v
    return out


def analyze(rt, b):
    frames = [load(rt, f['url']) for f in b['frames']]
    n = len(frames)
    times = [f['timeMs'] for f in b['frames']] + [b['durationMs']]
    dts = [times[i + 1] - times[i] for i in range(n)]
    regH = b['registrationHeightPx']
    k = HEIGHT.get(b['character'], 130) / regH  # board px per canvas px
    ux, uy = DIRS[b['facing']]
    # The art carries travel in the screen-x shift of the planted foot (E/W and diagonals);
    # only N/S use the screen-y (depth) shift. Diagonal art shows ~0 y shift (measured).
    lateral = ux != 0
    back = np.array([-np.sign(ux), 0.0]) if lateral else np.array([0.0, -np.sign(uy)])
    g, grows = ground_row(frames, b['pivot'])
    band = max(8, int(round(0.045 * regH)))      # thin band height (canvas px)
    taller = max(band + 8, int(round(0.10 * regH)))  # patch height for texture (foot only)
    top, bot = g - band, g + 3
    ptop = g - taller
    search = int(round(1.4 * TILE / k / max(2, n / 2)))  # covers 2.8 sq/cycle per half cycle
    steps = []
    wide = 0.4 * regH    # wider band blob = hem, cloak or merged feet, not one foot
    narrow = float(os.environ.get('NARROW', '0.065')) * regH  # thinner band blob = weapon tip, toe of a cloth fold
    def prep(bls, t0, f=None):
        out = []
        # cloth test: a band blob whose component in the taller foot patch is wide is a hem, not a foot
        lab = None
        if f is not None:
            tall = (f[ptop:bot, :, 3] > ALPHA).astype(np.uint8)
            _, lab, st, _ = cv2.connectedComponentsWithStats(tall, connectivity=8)
        for bl in bls:
            ys, xs = np.nonzero(bl['mask'])
            bl['bottom'] = t0 + int(ys.max()); bl['w'] = bl['x1'] - bl['x0']
            bl['hem'] = bl['w'] > wide
            if lab is not None:
                ids = np.unique(lab[(t0 - ptop) + ys, xs]); ids = ids[ids > 0]
                cw = max((st[c][2] for c in ids), default=0)
                bl['cloth'] = bool(cw > 1.6 * wide)
            else:
                bl['cloth'] = False
            if bl['w'] >= narrow:
                out.append(bl)
        return out
    bl_all = [prep(blobs(f, top, bot, max(12, band * 2)), top, f) for f in frames]
    etop = g - int(round(2.5 * band))  # extended band: a toe-off foot may sit a little above the ground
    bl_ext = [prep(blobs(f, etop, bot, max(12, band * 2)), etop, f) for f in frames]
    hem_frac = []
    for f, bls in zip(frames, bl_all):
        tot = (f[top:bot, :, 3] > ALPHA).sum()
        hem_frac.append(float(sum(bl['area'] for bl in bls if bl['hem'] or bl['cloth']) / tot) if tot else 0.0)

    ctop = g - int(round(COST_H * regH))  # taller patch: a foot carries its shin, a hem tip does not
    def cost_at(fi, fj, bl, dx, dy):
        x0, x1 = max(0, bl['x0'] - 3), min(fi.shape[1], bl['x1'] + 3)
        tpl = fi[ctop:bot, x0:x1]
        idx, idy = int(round(dx)), int(round(dy))
        if x0 + idx < 0 or x1 + idx > fj.shape[1] or ctop + idy < 0 or bot + idy > fj.shape[0]:
            return 9.0
        win = fj[ctop + idy:bot + idy, x0 + idx:x1 + idx]
        m = tpl[:, :, 3:4] > ALPHA
        T = np.dstack([tpl[:, :, :3] * tpl[:, :, 3:4], tpl[:, :, 3:4] * 1.5])
        Wn = np.dstack([win[:, :, :3] * win[:, :, 3:4], win[:, :, 3:4] * 1.5])
        e = float((T ** 2 * m).sum())
        return float((((T - Wn) ** 2) * m).sum() / max(e, 1e-6))

    sx = 1 if ux > 0 else -1
    fe = lambda o: o['x1'] if sx > 0 else o['x0']
    be = lambda o: o['x0'] if sx > 0 else o['x1']
    for i in range(n):
        j = (i + 1) % n
        fi, fj = frames[i], frames[j]
        cands = []
        for bl in bl_all[i]:
            if bl['hem'] or bl['cloth']:
                continue
            r = match(fi, fj, bl['x0'], bl['x1'], top, bot, ptop, search, back, 35.0)
            if r is not None:
                ov = contact_overlap(fj, bl['mask'], top, bot, r['dx'], r['dy'])
                cands.append(cand('template', bl, r['dx'], r['dy'], back, rel=r['rel'], overlap=ov))
            if not lateral:
                continue  # N/S: x edges carry no travel; the band clips y edges
            for lifted, pool in ((False, bl_all[j]), (True, bl_ext[j])):
                for bj in pool:
                    if bj['hem'] or bj['cloth']:
                        continue
                    if lifted and bj['bottom'] >= top + 2:
                        continue  # already in the ground band
                    wr = bj['w'] / max(1, bl['w'])
                    if wr < 0.85:
                        dx, rule = fe(bj) - fe(bl), 'front-edge'
                    elif wr > 1.18:
                        dx, rule = be(bj) - be(bl), 'back-edge'
                    else:
                        dx, rule = ((fe(bj) - fe(bl)) + (be(bj) - be(bl))) / 2, 'both-edges'
                    if not (-3 <= -dx * sx <= search):
                        continue
                    dy = bj['bottom'] - bl['bottom']
                    cands.append(cand('edge', bl, dx, dy, back, rule=rule, wr=wr, to=[bj['x0'], bj['x1']], lifted=lifted, rel=cost_at(fi, fj, bl, dx, dy)))
        tmpl = [c for c in cands if c['src'] == 'template' and c['overlap'] >= 0.5 and c['rel'] <= 0.10 and c['along'] >= 2 and c['angle'] <= 30]
        weak = [c for c in cands if c['src'] == 'template' and c['overlap'] >= 0.35 and c['rel'] <= 0.15 and c['along'] > -1 and c['angle'] <= 30]
        edge = [c for c in cands if c['src'] == 'edge' and not c['lifted'] and c['along'] > -3]
        edge_l = [c for c in cands if c['src'] == 'edge' and c['lifted'] and c['along'] > -3]
        stance = None; ambiguous = False
        if tmpl:
            tmpl.sort(key=lambda c: -c['area'] * c['overlap'])  # a whole planted foot beats a toe tip
            stance = dict(tmpl[0], kind='template')
            agree = [c for c in tmpl[1:] if abs(c['along'] - stance['along']) <= max(4, 0.25 * stance['along'])]
            ambiguous = len(agree) < len(tmpl) - 1
            if agree:
                w = [stance] + agree
                stance = dict(stance, along=round(float(np.mean([c['along'] for c in w])), 2), perp=round(float(np.mean([c['perp'] for c in w])), 2), blobs=len(w))
        else:
            pool = edge or edge_l
            if pool:
                pool.sort(key=lambda c: c['rel'])  # the pairing whose patch looks most alike
                best = pool[0]
                stance = dict(best, kind='edge-lifted' if best['lifted'] else 'edge')
                ambiguous = any(c['rel'] <= best['rel'] * 1.15 + 0.01 and abs(c['along'] - best['along']) > max(8, 0.3 * best['along']) for c in pool[1:])
            elif weak:
                weak.sort(key=lambda c: c['rel'])
                stance = dict(weak[0], kind='template-weak')
        if stance:
            stance['ambiguous'] = ambiguous
        steps.append({'pair': [i, j], 'dtMs': dts[i], 'stance': stance, 'candidates': cands})
    return frames, k, g, grows, band, steps, times, dts, hem_frac


def summarise(b, k, steps, dts, hem):
    cyc = b['durationMs']
    good = [s for s in steps if s['stance']]
    n = len(steps)
    if not good:
        return {'stride': None, 'confidence': 'none', 'reason': 'No planted foot found in the ground band for any pose step.'}
    rates = [s['stance']['along'] / s['dtMs'] for s in good]
    med = float(np.median(rates))
    total_px = 0.0
    filled = 0
    fills = {}
    for i, s in enumerate(steps):
        if s['stance']:
            total_px += s['stance']['along']
        else:
            mir = steps[(i + n // 2) % n] if n % 2 == 0 else None
            f = mir['stance']['along'] * s['dtMs'] / mir['dtMs'] if mir and mir['stance'] else med * s['dtMs']
            fills[i] = f; total_px += f; filled += 1
    ux, uy = DIRS[b['facing']]
    gain = abs(ux) if ux else abs(uy)  # screen component of one board px of travel on the measured axis
    stride = total_px * k / (TILE * gain)
    v = stride * TILE * gain / cyc  # measured-axis board px per ms
    res = []
    for s in good:
        res.append(math.hypot(s['stance']['along'] * k - v * s['dtMs'], s['stance']['perp'] * k))
    perp = [s['stance']['perp'] * k for s in good]
    axis = {'offAxisDriftPx': round(stride * TILE * (abs(uy) if ux else 0.0), 2)}
    for name, u, key in (('strideX', ux, 'dx'), ('strideY', uy, 'dy')):
        if abs(u) > 1e-6:
            tot = sum(-s['stance'][key] * (1 if u > 0 else -1) for s in good)
            tot *= n / len(good)
            axis[name] = round(tot * k / (TILE * abs(u)), 3)
    cv = float(np.std(rates) / np.mean(rates)) if len(rates) > 1 else 1.0
    old = b['strideSquares']
    v_old = old * TILE * gain / cyc
    res_old = [math.hypot(s['stance']['along'] * k - v_old * s['dtMs'], s['stance']['perp'] * k) for s in good]
    worst_angle = max(s['stance']['angle'] for s in good)
    # Half-cycle check: each foot's stance must carry the same travel.
    t = 0.0; halves = [0.0, 0.0]
    for s in steps:
        sh = s['stance']['along'] if s['stance'] else fills[steps.index(s)]
        halves[0 if t + s['dtMs'] / 2 < cyc / 2 else 1] += sh; t += s['dtMs']
    hs = [h * k / (TILE * gain) for h in halves]
    split = abs(hs[0] - hs[1]) / max(1e-6, hs[0] + hs[1])
    kinds = [s['stance']['kind'] for s in good]
    weak = sum(1 for x in kinds if x in ('template-weak', 'edge-lifted'))
    amb = sum(1 for s in good if s['stance'].get('ambiguous'))
    hemmed = float(np.median(hem)) > 0.4
    lateral = bool(ux)
    rms = float(np.sqrt(np.mean(np.square(res))))
    issues = []
    if not lateral: issues.append('N/S art shows almost no depth shift of the planted foot')
    if filled: issues.append(f'{filled} of {n} steps had no planted foot (filled from median rate)')
    if weak: issues.append(f'{weak} weak or lifted-foot matches')
    if amb: issues.append(f'{amb} steps could pair either foot')
    if hemmed: issues.append('a hem or cloak fills the ground band')
    if split > 0.2: issues.append(f'feet disagree: half-cycle strides {hs[0]:.2f}/{hs[1]:.2f}')
    if not (0.4 <= stride <= 2.0): issues.append(f'stride {stride:.2f} outside 0.4-2.0')
    if rms > 12: issues.append(f'uneven pose steps leave {rms:.0f} px skate at any stride')
    if lateral and not hemmed and filled == 0 and weak == 0 and amb == 0 and split <= 0.2 and 0.4 <= stride <= 2.0:
        conf = 'high'
    elif lateral and not hemmed and filled + weak + amb <= 1 and split <= 0.35 and 0.3 <= stride <= 2.4:
        conf = 'medium'
    elif len(good) >= 2:
        conf = 'low'
    else:
        conf = 'none'
    if conf == 'low' and not lateral and stride < 0.3:
        conf = 'none'  # depth-only art: a measured number here would freeze the walk
    cv = round(cv, 3)
    return {'stride': round(stride, 3), 'confidence': conf, 'stepsMeasured': len(good), 'steps': n, 'rateCV': cv, 'halfStrides': [round(h, 3) for h in hs], 'footSplit': round(split, 3), 'hemFraction': round(float(np.median(hem)), 3), 'ambiguousSteps': amb,
            'residualRmsPx': round(float(np.sqrt(np.mean(np.square(res)))), 2), 'residualMaxPx': round(float(max(res)), 2),
            'residualOldRmsPx': round(float(np.sqrt(np.mean(np.square(res_old)))), 2), 'perpMaxPx': round(float(max(perp)), 2),
            'skateRatioOld': round(old / stride, 3) if stride else None, 'issues': issues, **axis,
            'stepKinds': [s['stance']['kind'] if s['stance'] else None for s in steps]}


def main():
    repo, outdir = sys.argv[1], sys.argv[2]
    rt = os.path.join(repo, 'public/character-runtime')
    m = json.load(open(os.path.join(rt, 'manifest.json')))
    banks = [b for b in m['banks'] if b['kind'] == 'move']
    sel = sys.argv[3:]
    if sel:
        banks = [b for b in banks if f"{b['character']}:{b['army']}:{b['facing']}" in sel]
    rows = []
    for b in banks:
        frames, k, g, grows, band, steps, times, dts, hem = analyze(rt, b)
        s = summarise(b, k, steps, dts, hem)
        row = {'id': f"{b['character']}/{b['army']}/{b['id']}", 'character': b['character'], 'army': b['army'], 'facing': b['facing'],
               'framesPerCycle': len(b['frames']), 'cycleMs': b['durationMs'], 'poseMs': dts, 'k': round(k, 4), 'groundRow': g,
               'pivotY': round(b['pivot'][1], 1), 'band': band, 'oldStride': b['strideSquares'], **s,
               'stepDetail': [{'pair': st['pair'], 'dtMs': st['dtMs'], 'stance': st['stance'], 'candidates': st['candidates']} for st in steps]}
        rows.append(row)
        print(f"{row['id']:40s} {b['facing']:3s} n={len(b['frames'])} old={b['strideSquares']:<8} new={s['stride']} {s['confidence']:6s} "
              f"rms={s.get('residualRmsPx')} oldrms={s.get('residualOldRmsPx')} cv={s.get('rateCV')} "
              + ' | '.join(f"{st['stance']['along'] if st['stance'] else '-'}" for st in steps), flush=True)
    os.makedirs(outdir, exist_ok=True)
    json.dump(rows, open(os.path.join(outdir, 'results.json'), 'w'), indent=1)


if __name__ == '__main__':
    main()
