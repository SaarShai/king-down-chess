"""Mimic. R: the cape's torn wing and hem (zero on hood and body). G: the moon's glow and the plain it lights. B: the clouds."""
import sys, os; sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from mask_lib import *

rgb = painting('mimic'); h, s, v = hsv(rgb)
H, W = v.shape
y, x = np.mgrid[0:H, 0:W].astype(np.float32); x = (x + .5) / W; y = (y + .5) / H

def ramp(a, b, t):
    u = np.clip((t - a) / (b - a), 0, 1); return u * u * (3 - 2 * u)
def px(points):
    """Points read off the 1024 x 576 painting, in painting units."""
    return [(a / 1024, b / 576) for a, b in points]

# The whole figure, traced on the painted silhouette, hood to hem.
figure = polygon(rgb, px([(392,126),(408,128),(420,160),(423,178),(430,205),(445,270),(455,325),(447,335),(442,385),(415,392),(360,394),(320,386),(282,382),(284,370),
                          (262,368),(268,345),(240,342),(205,352),(218,322),(165,340),(180,312),(155,294),(205,272),(165,240),(205,225),(270,222),(320,232),(345,185),(362,168),(372,145)]))
# Cape cloth is red to wine; the plain and the mountains behind it are blue to violet.
wine = (h > .84) | (h < .08)
cloth_paint = figure * wine * (s > .25)
cloth_paint = soften(cloth_paint, 1, .6)
cloth_paint = (cloth_paint > .5) * figure

# The free cloth: left of a line from the shoulder to the feet the wing is free; near the ground the hem is free; the hood and the body stay still.
anchor = .325 + (y - .40) * .22
wing = ramp(.0, .13, anchor - x) * ramp(.36, .40, y)
hem = ramp(.565, .635, y) * .8
tip = ramp(.415, .442, x) * ramp(.50, .57, y) * .7
cape = soften(cloth_paint, 3, 2) * np.maximum.reduce([wing, hem, tip])

# The rocks left of the wing stay still.
rocks = polygon(rgb, px([(0,285),(70,280),(110,300),(150,318),(195,338),(190,352),(120,358),(0,360)]))
cape = cape * (1 - soften(rocks, 0, 1.5))

# The moon. x runs 16/9 as far on screen as y, so the disc and its halo are round in these units.
sx = (x - .7305) * 16 / 9; sy = y - .160
dist = np.hypot(sx, sy)
R = .147
disc = dist < R

# Everything that stands in front of the sky: the mountain ridge, traced, and the hood.
ground = polygon(rgb, px([(0,155),(42,132),(70,147),(90,125),(132,85),(162,120),(175,120),(205,92),(220,95),(265,65),(295,110),(310,107),(330,145),(352,146),(368,165),(380,190),
                          (430,195),(450,197),(482,212),(532,182),(554,200),(577,225),(602,235),(637,222),(672,230),(712,250),(747,255),(787,230),(822,235),(869,202),(902,220),(942,172),(977,146),(1012,175),(1024,178),
                          (1024,576),(0,576)]))
hood = soften(figure, 5, 3)
stand = np.maximum(soften(ground, 5, 2.5), hood)

# Moon's glow: full at the rim, gone by a third of the sky's height. Clouds take the light; mountains and the figure do not.
halo = np.exp(-np.maximum(dist - R, 0) / .07) * ramp(.34, .17, dist - R)
halo = halo * (1 - soften(ground, 1, 1.5)) * (1 - hood)
# The plain's bright band below the moon: its lit paint only, so the horse shadow stays dark.
lit = (y > .5) * (v > .55) * (h > .68) * (h < .84) * (1 - figure)
lit = soften(lit, 0, 1) * np.exp(-((x - .66) / .22) ** 2 - ((y - .56) / .07) ** 2) * .45
light = np.maximum(halo, lit)

# Clouds: their paint against the dark sky. The sky is dark blue with stars, so first take the stars away with a median, then key the brighter, redder cloud paint.
def median(a, n):
    return np.asarray(Image.fromarray(np.uint8(np.clip(a, 0, 1) * 255)).filter(ImageFilter.MedianFilter(n)), dtype=np.float32) / 255
vm = median(v, 7); rm = median(rgb[..., 0], 7)
body = np.maximum(ramp(.47, .54, vm), ramp(.24, .30, rm))
# Keep the lit haze low on the ridges out: only the sky above the ridge counts.
sky = 1 - ground
cloud = soften(sky * body, 2, 2)
rim = soften(dist < R + .012, 3, 2)
# Stars in the dark sky stay fixed: the flat sky around them can hold a hole in the mask without any visible stretch.
stars = (v - vm > .08) * (vm < .5)
clouds = cloud * (1 - stand) * (1 - rim) * (1 - soften(stars, 2, 1))

save('mimic', cape, light, clouds)
