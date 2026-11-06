import sys, os; sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from mask_lib import *
rgb = painting('back'); h, s, v = hsv(rgb)
gold = (h > .05) & (h < .18) & (s > .3) & (v > .35)
crown = polygon(rgb, [(.24,.36),(.42,.40),(.5,.30),(.58,.40),(.76,.36),(.69,.54),(.68,.67),(.32,.67),(.31,.54)])
save('back', soften(gold * (1 - crown), 0, 1), soften(gold * crown, 0, 1))
