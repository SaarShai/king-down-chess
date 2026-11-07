# Method B: boot keypoint tracking -> measured walk stride per shipped move bank.
# Usage: python3 stride_b.py <catalog> <runtime-dir (public/character-runtime)> <outdir> [character[:facing] ...]
# Reads only. Writes results.json, results.csv and per-character contact sheets into <outdir>.
import json, sys, os, math, csv
import numpy as np, cv2
from PIL import Image, ImageDraw

CAT, RTDIR, OUT = sys.argv[1:4]
RT = f'{RTDIR}/manifest.json'
SEED = next((a[7:] for a in sys.argv[4:] if a.startswith('--seed=')), None)
ONLY = [a for a in sys.argv[4:] if not a.startswith('--')]
TILE = 112.0  # game px per board square (scene.mjs TILE; flat top-down board, same in x and y)
HEIGHT = {'pawn': 96, 'knight': 112, 'bishop': 114, 'rook': 132, 'queen': 120, 'archer': 120, 'paladin': 124,
          'maester': 112, 'ogre': 136, 'guard': 114}  # character-runtime.mjs MEASURED_HEIGHT: strides stay in these units
BACK_MAX, FWD_TOL, PERP_MAX, TOUCH = 0.5, 0.03, 0.10, 0.15
FOOT_MIN = 0.4
FACINGS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']

def unit(facing):
    a = FACINGS.index(facing) * math.pi / 4
    return np.array([math.sin(a), -math.cos(a)])  # screen x right, y down; N = up

def load(url):
    a = np.asarray(Image.open(f'{RTDIR}/{url}').convert('RGBA')).astype(np.float32)
    al = a[:, :, 3:4] / 255.0
    rgb = a[:, :, :3] * al + 128.0 * (1 - al)  # over mid grey: silhouette mismatch costs score
    return rgb.astype(np.uint8), a[:, :, 3] > 128

def bottom_contour(mask):
    h = mask.shape[0]
    return np.where(mask.any(axis=0), h - 1 - np.argmax(mask[::-1, :], axis=0), -1)  # lowest opaque row per column

QB = 8  # colour bins per channel
def qbin(rgb):
    q = (rgb.astype(np.int32) * QB) // 256
    return (q[..., 0] * QB + q[..., 1]) * QB + q[..., 2]

def build_models(prev, banks):
    """Boot colour per character and army, seeded by the stance patches of side views (E, W) from a first pass,
    plus any bank whose first-pass track was clean. Background = all other material near the ground."""
    models = {}
    rows = {(r['character'], r['army'], r['facing']): r for r in prev}
    for key in {(b['character'], b['army']) for b in banks}:
        pos = np.zeros(QB ** 3); neg = np.zeros(QB ** 3)
        for b in [x for x in banks if (x['character'], x['army']) == key]:
            r = rows.get((b['character'], b['army'], b['facing']))
            imgs = [load(f['url']) for f in b['frames']]
            H = b['registrationHeightPx']; gy = b['pivot'][1]; half = int(round(0.07 * H)) // 2
            for rgb, m in imgs:
                band = m.copy(); band[:int(gy - 0.30 * H)] = False
                neg += np.bincount(qbin(rgb)[band], minlength=QB ** 3)
            d = r and r['detail']
            seed = r and d and (b['facing'] in ('E', 'W') or (d['track_residual_game'] <= 2.5 and d['min_score'] >= 0.75))
            if not seed: continue
            for k, stc in enumerate(r['stance']):
                rgb, m = imgs[k]
                for x, y in stc['pts']:
                    sl = (slice(y - half, y + half + 1), slice(x - half, x + half + 1))
                    pos += np.bincount(qbin(rgb[sl])[m[sl]], minlength=QB ** 3)
        if pos.sum() < 50: continue
        pos /= pos.sum(); neg /= max(1, neg.sum())
        models[key] = (pos + 1e-4) / (neg + 1e-4)
    return models

def footfrac(lr, rgb, m):
    v = lr[qbin(rgb)][m]
    return float((v >= 1.0).mean()) if v.size else 0.0

def analyse(rb, LR=None):
    """Works on the shipped runtime frames (runtime px). Pivot and scale come from the runtime manifest."""
    cb = json.load(open(f"{CAT}/banks/{rb['sourceSha256']}.json"))
    assert [f['sourceSha256'] for f in rb['frames']] == [f['sha256'] for f in cb['frames']], 'runtime frames differ from catalog bank'
    kgame = HEIGHT.get(rb['character'], 130) / rb['registrationHeightPx']  # game px per runtime px (character-runtime.mjs sample().scale)
    H = rb['registrationHeightPx']
    gx, gy = rb['pivot']
    times = [f['timeMs'] for f in rb['frames']]
    T = rb['durationMs']
    holds = [(times[i + 1] if i + 1 < len(times) else T) - times[i] for i in range(len(times))]
    mids = [times[i] + holds[i] / 2 for i in range(len(times))]
    u = unit(rb['facing'])
    imgs = [load(f['url']) for f in rb['frames']]
    n = len(imgs)
    P = int(round(0.07 * H)) | 1
    half = P // 2
    R = int(BACK_MAX * H)
    # allowed displacements (stance): backward along the facing up to BACK_MAX*H, a little forward, small sideways
    oy, ox = np.mgrid[-R:R + 1, -R:R + 1]
    bk = -(ox * u[0] + oy * u[1]); pp = u[0] * oy - u[1] * ox
    allowed = (bk >= -FWD_TOL * H) & (bk <= BACK_MAX * H) & (np.abs(pp) <= PERP_MAX * H)
    trans = []
    for k in range(n):
        (A, Am), (B, Bm) = imgs[k], imgs[(k + 1) % n]
        botA, botB = bottom_contour(Am), bottom_contour(Bm)
        Bp = cv2.copyMakeBorder(B, R + half, R + half, R + half, R + half, cv2.BORDER_CONSTANT, value=(128, 128, 128))
        cand = []
        y0, y1 = int(gy - 0.30 * H), int(gy + 0.15 * H)
        y1 = min(y1, A.shape[0] - half - 1)
        xs = np.where(Am[y0:int(gy + 0.2 * H)].any(axis=0))[0]
        if not len(xs):
            trans.append([]); continue
        step = max(3, P // 4)
        for cy in range(y0 + half, y1 + 1, step):
            for cx in range(max(half, xs[0] + half), min(A.shape[1] - half - 1, xs[-1] - half) + 1, step):
                if Am[cy - half:cy + half + 1, cx - half:cx + half + 1].mean() < 0.5: continue
                patch = A[cy - half:cy + half + 1, cx - half:cx + half + 1]
                if patch.std() < 8: continue
                ff = footfrac(LR, patch, Am[cy - half:cy + half + 1, cx - half:cx + half + 1]) if LR is not None else 1.0
                cols = botA[cx - half:cx + half + 1]; cols = cols[cols >= 0]
                if not len(cols): continue
                lowest = np.median(cols)
                # ground touch in frame k: the patch holds the lowest material of its columns, near the ground line
                if lowest > cy + half + 2 or lowest < gy - TOUCH * H: continue
                win = Bp[cy:cy + 2 * R + 2 * half + 1, cx:cx + 2 * R + 2 * half + 1]
                res = cv2.matchTemplate(win, patch, cv2.TM_CCOEFF_NORMED)
                res = np.where(allowed, res, -1).astype(np.float32)
                _, best, _, loc = cv2.minMaxLoc(res)
                dx, dy = loc[0] - R, loc[1] - R
                bx, by = cx + dx, cy + dy
                colsB = botB[max(0, bx - half):bx + half + 1]; colsB = colsB[colsB >= 0]
                if not len(colsB): continue
                lowB = np.median(colsB)
                touchB = lowB <= by + half + 2 and lowB >= gy - TOUCH * H
                cand.append(dict(p=(cx, cy), q=(bx, by), d=(dx, dy), s=float(best), touchB=bool(touchB), ff=ff))
        trans.append(cand)
    return dict(rb=rb, kgame=kgame, H=H, g=(gx, gy), times=times, holds=holds, mids=mids, u=u, imgs=imgs, P=P, trans=trans)

def clusters(good, H):
    D = np.array([c['d'] for c in good], float); Pp = np.array([c['p'] for c in good], float)
    W = np.array([c['s'] for c in good]) - 0.4
    left = np.ones(len(good), bool); out = []
    while left.any():
        best = None
        for i in np.where(left)[0]:
            idx = np.where(left & (np.linalg.norm(D - D[i], axis=1) < 0.03 * H) & (np.linalg.norm(Pp - Pp[i], axis=1) < 0.12 * H))[0]
            w = W[idx].sum()
            if best is None or w > best[0]: best = (w, idx)
        w, idx = best; left[idx] = False
        d = np.median(D[idx], axis=0)
        out.append(dict(w=float(w), d=d, p=np.median(Pp[idx], axis=0), score=float(np.mean(W[idx] + 0.4)), n=int(len(idx)),
                        spread=float(np.sqrt(np.mean(np.sum((D[idx] - d) ** 2, axis=1)))), pts=[tuple(Pp[j]) for j in idx]))
    return out

RULES = ('back', 'oneboot', 'weight')

def pick_stance(r, rule='oneboot'):
    """Per transition: among strong clusters of good, ground-touching, boot-coloured patches, the stance foot is the
    one that moves back the most. If no patch has boot colour, fall back to any colour and flag it.
    rule: 'back' = backward-most strong cluster; 'oneboot' = same, after the one-boot rule; 'weight' = heaviest cluster."""
    H = r['H']
    out = []
    for cand in r['trans']:
        pick = None
        for colour in (True, False):
            for thr in (0.7, 0.6, 0.5):
                good = [c for c in cand if c['s'] >= thr and c['touchB'] and (not colour or c['ff'] >= FOOT_MIN)]
                if not good: continue
                cl = clusters(good, H)
                for c in cl: c['q'] = c['p'] + c['d']
                wmax = max(c['w'] for c in cl)
                strong = [c for c in cl if c['w'] >= 0.35 * wmax and c['n'] >= 2] or [max(cl, key=lambda c: c['w'])]
                # two patches cannot land on one boot: when two clusters arrive at the same place, the one that moved
                # less is the boot that was already there; the other is a false match onto it.
                back = lambda c: -float(np.dot(c['d'], r['u']))
                keep = strong if rule == 'back' else [c for c in strong if not any(o is not c and np.linalg.norm(o['q'] - c['q']) < 0.06 * H and back(o) < back(c) - 0.03 * H for o in strong)]
                pick = max(cl, key=lambda c: c['w']) if rule == 'weight' else max(keep, key=back)  # planted foot moves back the most; body-fixed parts stay
                pick.update(thr=thr, colour=colour, rivals=len(keep) - 1)
                break
            if pick: break
        out.append(pick)
    return out

def chain_feet(r, st):
    """Give the stance foot of each transition a foot identity (0/1). Same foot when the stance patch of
    transition k starts where transition k-1 ended; otherwise the other foot took over."""
    n = len(st); H = r['H']
    ids = [None] * n
    if any(s is None for s in st): return ids, [[None] * n, [None] * n]
    ids[0] = 0
    for k in range(1, n):
        same = np.linalg.norm(st[k]['p'] - st[k - 1]['q']) < 0.06 * H
        ids[k] = ids[k - 1] if same else 1 - ids[k - 1]
    feet = [[None] * n, [None] * n]
    for k in range(n):
        f = ids[k]
        feet[f][k] = tuple(st[k]['p'])
        feet[f][(k + 1) % n] = tuple(st[k]['q'])
    return ids, feet

def fill_swing(r, feet):
    """Track each foot through the poses where it is not in stance (free search, for the contact sheet)."""
    n = len(r['imgs']); H = r['H']; half = r['P'] // 2; R = int(0.5 * H)
    for f in range(2):
        for _ in range(2):
            for k in range(n):
                j = (k - 1) % n
                if feet[f][k] is not None or feet[f][j] is None: continue
                x, y = map(int, feet[f][j]); A = r['imgs'][j][0]; B = r['imgs'][k][0]
                patch = A[y - half:y + half + 1, x - half:x + half + 1]
                sx0, sy0 = max(0, x - half - R), max(0, y - half - R)
                res = cv2.matchTemplate(B[sy0:y + half + 1 + R, sx0:x + half + 1 + R], patch, cv2.TM_CCOEFF_NORMED)
                _, best, _, loc = cv2.minMaxLoc(res)
                feet[f][k] = (sx0 + loc[0] + half, sy0 + loc[1] + half)
    return feet

def stride_of(r, st):
    k, u = r['kgame'], r['u']
    ok = [s for s in st if s is not None]
    n = len(st)
    if len(ok) < n:
        return None
    back = [float(-np.dot(s['d'], u)) for s in st]  # source px backward along facing per transition
    perp = [float(u[0] * s['d'][1] - u[1] * s['d'][0]) for s in st]
    stride = sum(back) * k / TILE
    # reprojection: planted foot world position at hold midpoints with travel v = stride per cycle
    T = r['rb']['durationMs']
    v_src = sum(back) / T  # source px per ms along facing
    res = []
    for i, s in enumerate(st):
        dt = (r['mids'][(i + 1) % n] - r['mids'][i]) % T
        e = np.array(s['d'], float) + v_src * dt * u  # foot moved d in body frame; body moved v*dt*u on board
        res.append(float(np.linalg.norm(e)))
    rms = math.sqrt(sum(x * x for x in res) / n)
    # tracking residual: a planted foot moves only backward and rigidly. Sideways motion and patch disagreement are error.
    perp_rms = math.sqrt(sum(x * x for x in perp) / n) * k
    spread_rms = math.sqrt(sum(s['spread'] ** 2 for s in st) / n) * k
    track = math.sqrt(perp_rms ** 2 + spread_rms ** 2)
    return dict(stride=stride, back=back, perp=perp, skate_px_game=rms * k, skate_rel=(rms / (abs(sum(back)) / n)) if sum(back) else None,
                perp_rms_game=perp_rms, spread_rms_game=spread_rms, track_residual_game=track,
                score=float(np.mean([s['score'] for s in st])), min_score=float(min(s['score'] for s in st)),
                patches=int(min(s['n'] for s in st)))

def main():
    rt = json.load(open(RT))
    banks = [b for b in rt['banks'] if b['kind'] == 'move']
    if ONLY:
        sel = []
        for o in ONLY:
            ch, _, fc = o.partition(':')
            sel += [b for b in banks if b['character'] == ch and (not fc or b['facing'] == fc)]
        banks = sel
    models = {}
    if SEED:
        prev = json.load(open(SEED))
        allmv = [b for b in rt['banks'] if b['kind'] == 'move' and b['character'] in {x['character'] for x in banks}]
        models = build_models(prev, allmv)
        print('colour models:', sorted(models), flush=True)
    rows = []; vis = []
    os.makedirs(OUT, exist_ok=True)
    for b in banks:
        r = analyse(b, models.get((b['character'], b['army'])))
        # three stance-selection rules; keep the hypothesis with the smallest reprojection residual
        variants = {}
        for rule in RULES:
            st_ = pick_stance(r, rule); m_ = stride_of(r, st_)
            variants[rule] = (st_, m_)
        ok = [k for k in RULES if variants[k][1] is not None]
        rule = min(ok, key=lambda k: variants[k][1]['track_residual_game']) if ok else 'oneboot'
        st, m = variants[rule]
        ids, feet = chain_feet(r, st)
        r['feet'] = fill_swing(r, [list(f) for f in feet]) if ids[0] is not None else [None, None]
        row = dict(id=b['id'], character=b['character'], army=b['army'], facing=b['facing'], frames=len(b['frames']),
                   cycleMs=b['durationMs'], holds=r['holds'], oldStride=b['strideSquares'],
                   stride=None if m is None else round(m['stride'], 4), detail=m,
                   rule=rule, variants={k: None if v[1] is None else dict(stride=round(v[1]['stride'], 4), residual=round(v[1]['track_residual_game'], 2)) for k, v in variants.items()},
                   footIds=ids, stance=[None if s is None else dict(p=[round(x, 1) for x in s['p']], d=[round(x, 1) for x in s['d']], score=round(s['score'], 3), n=s['n'], thr=s['thr'], rivals=s['rivals'], colour=s['colour'], spread=round(s['spread'], 2), pts=[[int(a), int(b)] for a, b in s['pts']]) for s in st])
        rows.append(row); vis.append((r, st, f"{b['character']} {b['army']} {b['facing']}\nold {b['strideSquares']} new {row['stride']}\nrule {rule}" + ('' if m is None else f"\nresid {m['track_residual_game']:.1f} px")))
        print(b['character'], b['army'], b['facing'], 'old', b['strideSquares'], 'new', row['stride'],
              '' if m is None else f"trk {m['track_residual_game']:.1f}px skate {m['skate_px_game']:.1f}px sc {m['score']:.2f} back {[round(x) for x in m['back']]} perp {[round(x) for x in m['perp']]} ids {ids}")
    json.dump(rows, open(f'{OUT}/proto.json', 'w'), indent=1, default=float)
    for ch in dict.fromkeys(b['character'] for b in banks):
        sheet([v for v, b in zip(vis, banks) if b['character'] == ch], f'{OUT}/sheet-{ch}.png')


def sheet(results, path, cell=260):
    """results: list of (r, st, label). One row per bank: lower body of each pose with tracked points."""
    rows = []
    for r, st, label in results:
        H = r['H']; gx, gy = r['g']; n = len(r['imgs'])
        x0, y0, x1, y1 = int(gx - 0.6 * H), int(gy - 0.42 * H), int(gx + 0.6 * H), int(gy + 0.18 * H)
        sc = cell / (x1 - x0)
        row = Image.new('RGB', (180 + cell * n, int((y1 - y0) * sc)), (255, 255, 255))
        d0 = ImageDraw.Draw(row)
        for i, line in enumerate(label.split('\n')): d0.text((4, 4 + 12 * i), line, fill=(0, 0, 0))
        for k in range(n):
            rgb = Image.fromarray(r['imgs'][k][0]).crop((x0, y0, x1, y1)).resize((cell, row.height))
            d = ImageDraw.Draw(rgb)
            to = lambda x, y: ((x - x0) * sc, (y - y0) * sc)
            d.line([to(x0, gy), to(x1, gy)], fill=(0, 0, 255), width=1)
            # stance of transition k (from this pose): green; arrival of transition k-1 in this pose: red
            for kk, colr, key in ((k, (0, 200, 0), 'p'), ((k - 1) % n, (230, 0, 0), 'q')):
                s = st[kk]
                if s is None: continue
                for pt in s['pts']:
                    x, y = (pt if key == 'p' else (pt[0] + s['d'][0], pt[1] + s['d'][1]))
                    X, Y = to(x, y); d.ellipse([X - 1.5, Y - 1.5, X + 1.5, Y + 1.5], fill=colr)
                x, y = s[key]; X, Y = to(x, y); d.ellipse([X - 5, Y - 5, X + 5, Y + 5], outline=colr, width=2)
            for f, colr in ((0, (255, 140, 0)), (1, (160, 0, 200))):
                kp = r.get('feet', [None, None])[f]
                if kp and kp[k] is not None:
                    X, Y = to(*kp[k]); d.rectangle([X - 4, Y - 4, X + 4, Y + 4], outline=colr, width=2)
            d.text((3, 3), f"{k}:{r['holds'][k]}ms", fill=(0, 0, 0))
            row.paste(rgb, (180 + cell * k, 0))
        rows.append(row)
    W = max(x.width for x in rows); Ht = sum(x.height for x in rows)
    S = Image.new('RGB', (W, Ht), (255, 255, 255)); y = 0
    for x in rows: S.paste(x, (0, y)); y += x.height
    S.save(path)

if __name__ == '__main__':
    main()
