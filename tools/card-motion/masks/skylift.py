"""Sky Lift. R: a flat plateau over each free rock, so a rock moves as one piece. G: the air, wind and clouds, which flows. B: one constant per rock (the recipe's phase). Prints the air's direction table for the recipe."""
import sys, os; sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from mask_lib import *

rgb = painting('skylift'); h, s, v = hsv(rgb); H, W = v.shape
P = lambda *pts: polygon(rgb, pts) > .5
yy, xx = np.mgrid[:H, :W]

def smooth(a, b, x):
    k = np.clip((x - a) / (b - a), 0, 1); return k * k * (3 - 2 * k)
def grow(mask, n):
    return np.asarray(Image.fromarray(np.uint8(mask) * 255).filter(ImageFilter.MaxFilter(n * 2 + 1))) > 127
def shrink(mask, n):
    return np.asarray(Image.fromarray(np.uint8(mask) * 255).filter(ImageFilter.MinFilter(n * 2 + 1))) > 127
def label(mask):
    """Connected shapes (8 neighbours). Returns a list of (ys, xs)."""
    seen, out = np.zeros(mask.shape, bool), []
    for y0, x0 in zip(*np.nonzero(mask)):
        if seen[y0, x0]: continue
        seen[y0, x0] = True; stack, ys, xs = [(y0, x0)], [], []
        while stack:
            y, x = stack.pop(); ys.append(y); xs.append(x)
            for b in range(max(y-1,0), min(y+2,H)):
                for a in range(max(x-1,0), min(x+2,W)):
                    if mask[b, a] and not seen[b, a]: seen[b, a] = True; stack.append((b, a))
        out.append((np.array(ys), np.array(xs)))
    return out

# The land, with its ridges: everything below this line is not sky.
land = P((0,.525),(.05,.51),(.075,.53),(.095,.60),(.15,.555),(.185,.54),(.205,.655),(.25,.645),(.30,.74),(.36,.71),(.40,.76),(.455,.77),(.50,.735),(.56,.80),(.62,.84),
         (.70,.82),(.76,.76),(.81,.82),(.86,.77),(.895,.70),(.94,.73),(.965,.60),(1,.59),(1,1),(0,1))
# The two towers and the rubble fused to them. These stay still.
tower1 = P((.228,.115),(.255,.08),(.30,.045),(.312,.025),(.345,.04),(.358,.11),(.385,.20),(.415,.25),(.44,.295),(.425,.325),(.39,.325),(.375,.35),(.345,.37),(.335,.42),(.31,.45),(.28,.42),
           (.257,.385),(.28,.34),(.285,.30),(.262,.20),(.25,.14))
tower2 = P((.655,.325),(.665,.30),(.72,.295),(.745,.33),(.765,.385),(.745,.43),(.735,.47),(.715,.55),(.705,.60),(.695,.66),(.65,.705),(.632,.68),(.628,.64),(.605,.625),(.59,.60),(.573,.56),(.585,.52),(.60,.49),(.615,.46),(.63,.42))

# Rock paint in the sky: the grey shade and the lit gold. Sky, streaks and clouds are paler.
rockish = (v < .66) | ((h > .06) & (h < .15) & (s > .42) & (v < .9))
rockish = shrink(grow(rockish, 1), 1) & P((.12,.04),(.85,.04),(.85,.72),(.76,.79),(.55,.79),(.40,.655),(.215,.60),(.12,.40))
tall = grow(tower1 | tower2, 1)
shapes = [z for z in label(rockish & ~tall) if len(z[0]) >= 5]
# Fill each shape: holes from lit faces belong to the rock.
PLATEAU, FADE, REACH = 2., 3.5, 9
tower_near = tower1 | tower2
free = []
for ys, xs in shapes:
    y0, y1, x0, x1 = max(ys.min()-6,0), min(ys.max()+7,H), max(xs.min()-6,0), min(xs.max()+7,W)
    d = np.sqrt(((yy[y0:y1,x0:x1,None] - ys) ** 2 + (xx[y0:y1,x0:x1,None] - xs) ** 2).min(-1))
    if not ((d <= PLATEAU + 1) & tower_near[y0:y1,x0:x1]).any(): free.append((ys, xs))
print('shapes', len(shapes), 'free rocks', len(free), 'sizes', sorted(len(z[0]) for z in free)[-12:])

# Rocks too close to fade apart share one offset.
gap = lambda a, b: np.sqrt(((a[0][None] - b[0][:, None]) ** 2 + (a[1][None] - b[1][:, None]) ** 2).min())
parent = list(range(len(free)))
def root(i):
    while parent[i] != i: i = parent[i]
    return i
for i in range(len(free)):
    for j in range(i + 1, len(free)):
        if abs(free[i][0].mean() - free[j][0].mean()) < 40 and abs(free[i][1].mean() - free[j][1].mean()) < 60 and gap(free[i], free[j]) < 2 * (PLATEAU + FADE) * .75:
            parent[root(i)] = root(j)
groups = {}
for i in range(len(free)): groups.setdefault(root(i), []).append(i)

best, second, owner = np.full(v.shape, 99.), np.full(v.shape, 99.), np.zeros(v.shape, int)
for n, parts in enumerate(groups.values()):
    ys, xs = np.concatenate([free[i][0] for i in parts]), np.concatenate([free[i][1] for i in parts])
    y0, y1, x0, x1 = max(ys.min()-REACH,0), min(ys.max()+REACH+1,H), max(xs.min()-REACH,0), min(xs.max()+REACH+1,W)
    d = np.sqrt(((yy[y0:y1,x0:x1,None] - ys) ** 2 + (xx[y0:y1,x0:x1,None] - xs) ** 2).min(-1))
    b, c, o = best[y0:y1,x0:x1], second[y0:y1,x0:x1], owner[y0:y1,x0:x1]
    closer = d < b
    c[closer] = b[closer]; c[~closer] = np.minimum(c[~closer], d[~closer]); o[closer] = n + 1; b[closer] = d[closer]
rock = np.float32((1 - smooth(PLATEAU, PLATEAU + FADE, best)) * smooth(0, 2., second - best))
# The rock's ring fades out before the towers, the land and the map's edge.
rock *= 1 - soften(tower_near, 1, 1)

# Phase per group. Big rocks below .5 run once a loop, small rocks above .5 run twice.
phase = np.zeros(v.shape, np.float32)
rng = np.random.default_rng(11)
for n, parts in enumerate(groups.values()):
    u, big = rng.random(), max(len(free[i][0]) for i in parts) >= 40
    phase[owner == n + 1] = (.04 + .44 * u) if big else (.52 + .46 * u)
phase[rock <= 0] = 0

# The air. Wind: pale strokes inside the whirl. Clouds: pale paint in the three masses and the valley mist.
whirl = P((.20,0),(.80,0),(.80,.07),(.89,.09),(.84,.17),(.76,.22),(.72,.30),(.76,.42),(.87,.50),(.87,.60),(.80,.67),(.73,.72),(.64,.80),(.57,.80),(.50,.72),(.40,.66),(.30,.58),(.22,.48),(.20,.38),(.18,.25))
pale = (v > .78) & ((s < .42) | ((h > .07) & (h < .16) & (s < .55)))
streak = whirl & pale & ~tower_near
masses = P((0,0),(.20,0),(.17,.25),(.19,.40),(.24,.50),(.33,.60),(.42,.66),(.51,.74),(.46,.76),(0,.60)) | \
         P((.81,0),(1,0),(1,.60),(.86,.74),(.74,.74),(.82,.66),(.89,.60),(.89,.48),(.76,.40),(.74,.30),(.78,.23),(.86,.17),(.91,.09),(.82,.07))
mist = P((0,.84),(.09,.86),(.10,1),(0,1)) | P((.70,.86),(.80,.83),(.82,.93),(.72,.95)) | P((.885,.80),(1,.78),(1,.93),(.90,.93))
cloud = (masses | mist) & pale
# Dark paint must not be dragged into the flow: no air within reach of it.
dark = (v < .62) | tall
guard = soften(grow(dark, 2), 0, 1.2)
wind_m = soften(streak, 2, 2.) * (1 - guard) * (1 - smooth(.0, .35, rock))
cloud_m = soften(cloud, 2, 2.5) * (1 - guard) * (1 - smooth(.0, .35, rock))
air = np.maximum(wind_m, cloud_m)

save('skylift', rock, air, phase)
run = os.path.expanduser('~/kd-runs/card-motion/skylift')
print('air share', round(float((air > .1).mean()), 3), 'rock share', round(float((rock > .1).mean()), 3))
Image.fromarray(np.uint8(np.dstack([rock, air, np.zeros_like(rock)]) * 255)).resize((1152, 648)).save(f'{run}/rg.png')

# The air's direction, as a table for the recipe: the way the painted strokes run, in small blocks, all turned to circle anticlockwise on screen.
CX, CY = 13, 8
g = rgb.mean(-1); gy, gx = np.gradient(g)
vec = np.zeros((CY, CX, 2)); weight = np.zeros((CY, CX))
for cy in range(CY):
    for cx in range(CX):
        X, Y = cx / (CX - 1), cy / (CY - 1)
        y0, y1 = max(int(Y * H) - 10, 0), min(int(Y * H) + 11, H); x0, x1 = max(int(X * W) - 18, 0), min(int(X * W) + 19, W)
        keep = wind_m[y0:y1, x0:x1]
        a, b, c = (gx[y0:y1,x0:x1] ** 2 * keep).sum(), (gy[y0:y1,x0:x1] ** 2 * keep).sum(), (gx[y0:y1,x0:x1] * gy[y0:y1,x0:x1] * keep).sum()
        # The right lobe circles the second tower; the rest circles the funnel's eye.
        lobe = X > .6 and Y > .36
        ox, oy = (.70, .53) if lobe else (.56, .30)
        rx, ry = (X - ox) * 16 / 9, Y - oy
        ax, ay = ry / (16 / 9), -rx
        if keep.mean() > .08 and a + b > 1e-6:
            angle = .5 * np.arctan2(2 * c, a - b) + np.pi / 2
            dx, dy = np.cos(angle), np.sin(angle)
            if dx * ax + dy * ay < 0: dx, dy = -dx, -dy
            vec[cy, cx] = (dx, dy); weight[cy, cx] = 1
        else:
            n = max(np.hypot(ax, ay), 1e-3)
            vec[cy, cx] = (ax / n * .5, ay / n * .5)   # The clouds and open sky drift round at half speed.
for _ in range(2):
    out = vec.copy()
    for cy in range(CY):
        for cx in range(CX):
            ys, xs = range(max(cy-1,0), min(cy+2,CY)), range(max(cx-1,0), min(cx+2,CX))
            out[cy, cx] = .5 * vec[cy, cx] + .5 * np.mean([vec[b, a] for b in ys for a in xs], 0)
    vec = out
print('const float AIR[%d] = float[](%s);' % (CX * CY * 2, ','.join(('%.2f' % u).replace('0.', '.') for u in vec.reshape(-1))))
