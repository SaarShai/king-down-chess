import json, sys
import cv2
import numpy as np

BAND = 0.28          # head and shoulders: top 28% of the reference figure
SCALES = np.arange(0.80, 1.2001, 0.01)


def load(path):
    im = cv2.imread(path, cv2.IMREAD_UNCHANGED)
    return cv2.cvtColor(im, cv2.COLOR_BGRA2RGBA).astype(np.float32) / 255.0


def save(path, rgba):
    out = (np.clip(rgba, 0, 1) * 255 + 0.5).astype(np.uint8)
    cv2.imwrite(path, cv2.cvtColor(out, cv2.COLOR_RGBA2BGRA))


def box(alpha):
    ys, xs = np.nonzero(alpha >= 0.5)
    return ys.min(), ys.max(), xs.min(), xs.max()


def matchable(rgba):
    """Colour over mid grey, so the match sees both the painted detail and the silhouette."""
    a = rgba[:, :, 3:4]
    return (rgba[:, :, :3] * a + 0.5 * (1 - a)).astype(np.float32)


def transform(rgba, s, tx, ty, shape):
    """Scale by s about the origin, then move by (tx, ty); premultiplied so edges stay clean."""
    pre = rgba.copy(); pre[:, :, :3] *= pre[:, :, 3:4]
    m = np.float32([[s, 0, tx], [0, s, ty]])
    out = cv2.warpAffine(pre, m, (shape[1], shape[0]), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    out = np.clip(out, 0, 1)
    a = out[:, :, 3:4]
    out[:, :, :3] = np.where(a > 1e-4, out[:, :, :3] / np.maximum(a, 1e-4), 0)
    out[:, :, 3] = np.where(out[:, :, 3] < 1 / 255, 0, out[:, :, 3])
    return out


def despeckle(rgba, keep=0.005):
    """Drop loose matte specks: alpha islands smaller than `keep` of the largest island."""
    mask = (rgba[:, :, 3] > 0).astype(np.uint8)
    n, labels, stats, _ = cv2.connectedComponentsWithStats(mask, connectivity=8)
    if n <= 2:
        return rgba, 0
    areas = stats[1:, cv2.CC_STAT_AREA]; big = areas.max()
    drop = [i + 1 for i, a in enumerate(areas) if a < big * keep]
    if drop:
        rgba = rgba.copy(); rgba[np.isin(labels, drop)] = 0
    return rgba, len(drop)


def head_template(rgba, half):
    top, bot, _, _ = box(rgba[:, :, 3])
    y1 = top + int((bot - top) * BAND)
    band = rgba[top:y1 + 1]
    cols = np.nonzero((band[:, :, 3] >= 0.5).any(0))[0]
    x0, x1 = cols.min(), cols.max()
    t = matchable(rgba)[top:y1 + 1, x0:x1 + 1]
    return cv2.resize(t, None, fx=half, fy=half, interpolation=cv2.INTER_AREA), (x0, top)


def best_scale(rgba, tmpl, half):
    """Scale and template corner (full-res, after scaling) that best match the reference head band."""
    img = matchable(rgba)
    best = (-2, None, None)
    for s in SCALES:
        scaled = cv2.resize(img, None, fx=s * half, fy=s * half, interpolation=cv2.INTER_AREA)
        if scaled.shape[0] < tmpl.shape[0] or scaled.shape[1] < tmpl.shape[1]:
            continue
        r = cv2.matchTemplate(scaled, tmpl, cv2.TM_CCOEFF_NORMED)
        _, v, _, loc = cv2.minMaxLoc(r)
        if v > best[0]:
            best = (v, s, (loc[0] / half, loc[1] / half))
    return best


def head_x(rgba):
    top, bot, _, _ = box(rgba[:, :, 3])
    height = bot - top
    band = rgba[top + int(height * 0.05):top + max(int(height * 0.2), 1), :, 3] >= 0.5
    weights = band.sum(0)
    return float((weights * np.arange(len(weights))).sum() / weights.sum())


def fit(paths, baseline, rest_indexes):
    frames = [load(path) for path in paths]
    rest = frames[0]
    indices = [i for i in range(1, len(frames) - 1) if i not in rest_indexes]
    result = [{} for _ in frames[1:-1]]
    if not indices:
        return result
    walk = [frames[i] for i in indices]
    tmpl, (hx, hy) = head_template(walk[0], 0.5)
    fits = [(1.0, 1.0, (hx, hy))] + [best_scale(f, tmpl, 0.5) for f in walk[1:]]
    rt, rb, _, _ = box(rest[:, :, 3])
    heights = [(box(f[:, :, 3])[1] - box(f[:, :, 3])[0]) * s for f, (_, s, _) in zip(walk, fits)]
    group = (rb - rt) / max(heights)
    rest_band = rest[rt:rt + int((rb - rt) * BAND) + 1, :, 3]
    weights = rest_band.sum(0)
    rest_hx = float((weights * np.arange(len(weights))).sum() / weights.sum())
    for index, f, (score, scale, loc) in zip(indices, walk, fits):
        factor = scale * group
        tx = rest_hx - (loc[0] + tmpl.shape[1]) * group
        bottom = box(f[:, :, 3])[1]
        ty = baseline - bottom * factor
        placed, specks = despeckle(transform(f, factor, tx, ty, rest.shape))
        # The gate measures the alpha > 8 boundary, not the opaque core.
        rows = np.nonzero((placed[:, :, 3] > 8 / 255).any(1))[0]
        correction = baseline - int(rows[-1])
        if correction:
            ty += correction
            placed, specks = despeckle(transform(f, factor, tx, ty, rest.shape))
        for _ in range(4):
            rows = np.nonzero((np.floor(placed[:, :, 3] * 255 + 0.5) > 8).any(1))[0]
            correction = baseline - int(rows[-1])
            if abs(correction) <= 2:
                break
            ty += correction
            placed, specks = despeckle(transform(f, factor, tx, ty, rest.shape))
        save(paths[index], placed)
        result[index - 1] = {'scale': factor, 'dx': tx, 'dy': ty, 'matchScore': float(score), 'headScale': float(scale), 'groupScale': float(group), 'specks': specks}
    fitted = [load(paths[i]) for i in indices]
    reference, _ = head_template(fitted[0], 0.5)
    for position, (index, image) in enumerate(zip(indices, fitted)):
        result[index - 1]['measuredHeadX'] = head_x(image)
        result[index - 1]['measuredHeadScale'] = 1.0 if position == 0 else float(best_scale(image, reference, 0.5)[1])
    return result


if __name__ == '__main__':
    args = json.loads(sys.argv[1])
    print(json.dumps(fit(args['paths'], args['baseline'], args['restIndexes'])))
