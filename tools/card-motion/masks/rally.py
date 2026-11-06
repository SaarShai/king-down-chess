"""Rally. R: the big banner, still at its top hem and near the pole, free at the fringe. G: the two dust wakes at the pieces' feet. B: the two streamers, still at the crossbar, free at the tails."""
import sys, os; sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from mask_lib import *

rgb = painting('rally'); h, s, v = hsv(rgb)
H, W = v.shape
xs, ys = np.meshgrid((np.arange(W) + .5) / W, (np.arange(H) + .5) / H)

def px(points):
    """Polygon points in pixels of the 1024 x 576 painting, to painting units."""
    return [(x / 1024, y / 576) for x, y in points]
def ramp(a, lo, hi):
    a = np.clip((a - lo) / (hi - lo), 0, 1)
    return a * a * (3 - 2 * a)

# Things that must not move.
pole = polygon(rgb, px([(558,0),(571,0),(571,350),(600,350),(600,345),(530,345),(530,350),(557,350)]))
pole = np.maximum(pole, polygon(rgb, px([(558,0),(571,0),(572,350),(557,350)])))
bishop = polygon(rgb, px([(793,246),(806,246),(811,262),(825,280),(835,300),(834,322),(822,338),(816,345),(838,362),(840,380),(822,388),(830,420),(858,440),(860,470),(745,470),(746,440),(775,418),(782,388),(764,380),(766,362),(786,345),(776,332),(768,312),(770,290),(782,272),(790,262)]))
rook = polygon(rgb, px([(280,216),(392,216),(392,270),(378,300),(372,380),(382,405),(408,432),(414,480),(238,480),(244,435),(270,405),(286,380),(290,300),(280,270)]))
hold = np.maximum.reduce([soften(pole, 1, 1), soften(bishop, 1, 1), soften(rook, 1, 1)])

# The banner, its fringe and the corner tassel.
banner = polygon(rgb, px([(573,40),(686,76),(681,160),(688,200),(712,226),(730,258),(746,286),(756,316),(773,346),(748,326),(722,306),(686,296),(682,322),(684,358),(660,330),(642,296),(622,276),(600,258),(597,300),(578,296),(582,250),(584,205)]))
# Distance below the hem and right of the left edge, in painting units.
below = ((ys - (42 + (xs * 1024 - 572) * .32) / 576) * 9 / 16)
right = (xs - (572 + (ys * 576 - 42) * .09) / 1024)
free = ramp(below, .012, .26) * (.3 + .7 * ramp(right, .004, .075))
r = soften(banner, 4, 2) * (1 - hold) * free

# The streamers, keyed on their red inside a corridor, each with its own weight along its run.
red = ((h > .93) | (h < .05)) & (s > .42)
upper = polygon(rgb, px([(655,50),(690,52),(712,72),(760,60),(805,68),(805,88),(760,82),(712,92),(690,80),(668,70)]))
lower = polygon(rgb, px([(682,74),(705,82),(745,108),(775,122),(815,110),(850,118),(885,130),(885,146),(850,146),(815,130),(775,142),(745,132),(705,106),(682,92)]))
ru = soften(upper * red, 4, 2) * ramp(xs, 668 / 1024, 730 / 1024)
rl = soften(lower * red, 4, 2) * ramp(xs, 690 / 1024, 790 / 1024)
b = np.maximum(ru, rl) * (1 - np.maximum(soften(banner, 0, 1), hold))

# The dust: the pale grain of the two wakes.
wake_left = polygon(rgb, px([(0,500),(60,470),(120,440),(190,395),(250,385),(262,400),(245,440),(240,478),(300,484),(330,490),(230,510),(150,530),(90,566),(0,566)]))
wake_right = polygon(rgb, px([(728,425),(748,425),(748,462),(858,466),(858,430),(880,425),(930,450),(1000,480),(1024,500),(1024,520),(960,515),(900,490),(860,478),(760,478),(730,470)]))
grain = soften(np.float32((v > .62) & (s < .55)), 1, 2)
g = soften(np.maximum(wake_left, wake_right), 0, 4) * np.clip(grain * 1.4, 0, 1) * (1 - hold)

save('rally', r, g, b)
