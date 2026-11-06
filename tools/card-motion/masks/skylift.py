import sys, os; sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from mask_lib import *
# R: a flat plateau over each free rock, so a rock moves as one piece. G: the wind streaks. B: one constant per rock (the recipe's phase), so each rock keeps one offset.
rgb = painting('skylift'); h, s, v = hsv(rgb); H, W = v.shape
P = lambda *pts: polygon(rgb, [(x / 512, y / 512) for x, y in pts]) > .5   # points in source pixels (512)
# The towers and the rubble fused to them stay still.
towers = P((84,65),(150,25),(180,60),(186,120),(220,150),(218,165),(190,167),(164,178),(146,196),(143,228),(128,228),(101,205),(103,188),(120,180),(113,130),(105,95)) | \
         P((346,175),(353,157),(406,154),(431,204),(416,215),(393,267),(388,292),(381,315),(378,335),(338,345),(336,325),(322,305),(305,302),(292,285),(291,277),(313,250),(323,230))
# The free rocks, placed by eye: x, y, radius in source pixels.
SEEDS = [(37.5,104,9),(93,118,6),(95,136,6),(64,151,18),(46,180,6),(85.5,180,7),(109,167.5,7),(41,212,18),(79.5,251,19),(136,264,10),
         (95,216,5),(160,212,7),(157.5,284,5),(167,303,5),(214,213,17),(194,187,6),(226,174,4),(241,173,5),(239,140.5,6),(219.5,110,6),
         (200,90.5,6),(201,129.5,7),(212,173,10),(248,248,5),(254,307.5,5),(285.5,215.5,13),(274.5,267.5,11),(262,202,5),(322.5,224,5),
         (285.5,330,6),(291,305,10),(321,325.5,13),(356,381,9),(365,401,9),(382,360,11),(312,244.5,6),(298,255,5),(209,298,4),(377,339,5),
         (401,320,9),(442,321,8),(437,297.5,6),(417,279,7),(438,267,5),(420,242,6),(412,256,4),(428,364,20),(393,392.5,6),(316.5,169,4)]
yy, xx = np.mgrid[:H, :W]
rock_paint = (v < .72) | ((h > .05) & (h < .15) & (s > .3) & (v < .95))
PLATEAU, FADE, REACH = 3., 3., 12
tower_edge = 1 - soften(towers, 1, .7)
shapes = []
for x, y, r in SEEDS:
    x, y, r = x / 2, y / 2, r / 2
    d2 = (yy - y) ** 2 + (xx - x) ** 2
    ys, xs = np.nonzero((d2 <= (r + 1) ** 2) & (rock_paint | (d2 <= (.6 * r) ** 2)))
    shapes.append((ys, xs))
gap = lambda a, b: np.sqrt(((a[0][None] - b[0][:, None]) ** 2 + (a[1][None] - b[1][:, None]) ** 2).min())
# A rock whose plateau meets a tower cannot move rigidly, so it stays still.
free = []
for i, (ys, xs) in enumerate(shapes):
    y0, y1, x0, x1 = max(ys.min()-5,0), min(ys.max()+6,H), max(xs.min()-5,0), min(xs.max()+6,W)
    d = np.sqrt(((yy[y0:y1,x0:x1,None] - ys) ** 2 + (xx[y0:y1,x0:x1,None] - xs) ** 2).min(-1))
    if not ((d <= PLATEAU) & towers[y0:y1,x0:x1]).any(): free.append(i)
# Rocks too close to fade apart share one offset: they form one group.
group = {i: i for i in free}
def root(i):
    while group[i] != i: i = group[i]
    return i
for n, i in enumerate(free):
    for j in free[n+1:]:
        if gap(shapes[i], shapes[j]) < 6: group[root(i)] = root(j)
members = {}
for i in free: members.setdefault(root(i), []).append(i)
best, second, owner = np.full(v.shape, 99.), np.full(v.shape, 99.), np.zeros(v.shape, int)
for g, parts in members.items():
    ys, xs = np.concatenate([shapes[i][0] for i in parts]), np.concatenate([shapes[i][1] for i in parts])
    y0, y1, x0, x1 = max(ys.min()-REACH,0), min(ys.max()+REACH+1,H), max(xs.min()-REACH,0), min(xs.max()+REACH+1,W)
    d = np.sqrt(((yy[y0:y1,x0:x1,None] - ys) ** 2 + (xx[y0:y1,x0:x1,None] - xs) ** 2).min(-1))
    b, c, o = best[y0:y1,x0:x1], second[y0:y1,x0:x1], owner[y0:y1,x0:x1]
    closer = d < b
    c[closer] = b[closer]; c[~closer] = np.minimum(c[~closer], d[~closer]); o[closer] = g + 1; b[closer] = d[closer]
print('rocks free', len(free), 'of', len(SEEDS), 'groups', len(members), 'still', [SEEDS[i][:2] for i in range(len(SEEDS)) if i not in free])
def smooth(a, b, x):
    k = np.clip((x - a) / (b - a), 0, 1); return k * k * (3 - 2 * k)
rock = np.float32((1 - smooth(PLATEAU, PLATEAU + FADE, best)) * smooth(0, 2.5, (second - best) / 2) * tower_edge)
for g, parts in members.items():
    ys, xs = np.concatenate([shapes[i][0] for i in parts]), np.concatenate([shapes[i][1] for i in parts])
    if rock[ys, xs].min() < .99: print('rock not flat', [SEEDS[i][:2] for i in parts], round(float(rock[ys, xs].min()), 2))
# Small rocks run twice per loop and live above .5; big rocks run once, below .5. See the recipe.
phase = np.zeros(v.shape, np.float32)
rng = np.random.default_rng(7)
for g, parts in members.items():
    u = rng.random()
    phase[owner == g + 1] = (.52 + .46 * u) if max(SEEDS[i][2] for i in parts) < 9 else (.04 + .44 * u)
phase[best > REACH - 1] = 0
# Wind streaks: white and pale paint inside the whirl, not the clouds.
whirl = P((74,63),(142,6),(318,0),(455,0),(464,97),(512,68),(512,97),(432,142),(398,171),(444,228),(489,267),(438,324),(364,364),(318,410),(284,420),(239,364),(188,284),(142,250),(68,228),(51,182),(97,137))
streak = whirl & ~towers & (v > .8) & ((s < .38) | ((h > .08) & (h < .16) & (s < .5)))
wind = soften(streak, 1, 2.5) * (1 - soften(towers, 2, 1))
save('skylift', rock, wind, phase)
Image.fromarray(np.uint8(np.dstack([rock, wind * .5, np.zeros_like(rock)]) * 255)).resize((768, 768)).save(os.path.expanduser('~/kd-runs/card-motion/skylift/rg.png'))
# The whirl direction in the recipe: a degree 4 fit to the way the painted streaks run (structure tensor in small blocks). Paste these into whirl().
g = rgb.mean(-1); gy, gx = np.gradient(g); rows = []
for y in range(0, H - 6, 3):
    for x in range(0, W - 6, 3):
        a, b, c = (gx[y:y+6,x:x+6] ** 2).sum(), (gy[y:y+6,x:x+6] ** 2).sum(), (gx[y:y+6,x:x+6] * gy[y:y+6,x:x+6]).sum()
        keep = wind[y:y+6,x:x+6].mean()
        if keep < .3 or a + b < 1e-4: continue
        angle = .5 * np.arctan2(2 * c, a - b) + np.pi / 2; px, py = (x + 3) / W - .5, (y + 3) / H - .5
        # Orient every block the same way round the whirl: anticlockwise on screen, round the funnel's centre.
        ax, ay = py + .03, -(px + .05) * .4
        dx, dy = np.cos(angle), np.sin(angle)
        if dx * ax + dy * ay < 0: dx, dy = -dx, -dy
        rows.append((px, py, np.hypot(a - b, 2 * c) / (a + b) * keep * min((a + b) * 200, 1), dx, dy))
X, Y, w8, DX, DY = np.array(rows).T
terms = [(i, j) for i in range(5) for j in range(5 - i)]
A = np.stack([X ** i * Y ** j for i, j in terms], 1) * np.sqrt(w8)[:, None]
fx, fy = [np.linalg.lstsq(A, D * np.sqrt(w8), rcond=None)[0] for D in (DX, DY)]
print('whirl fit (x power, y power): x, y', [(t, round(float(u), 3), round(float(k), 3)) for t, u, k in zip(terms, fx, fy)])
