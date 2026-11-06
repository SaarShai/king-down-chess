"""Back. R: the gold scrolls, frame and small stars, for the glint. G: the crown, for the glint and the breath. B: not used."""
import sys, os; sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from mask_lib import *

rgb = painting('back'); h, s, v = hsv(rgb)
# Bright saturated gold only: the dull diamonds of the blue field fail this key.
gold = (h > .06) & (h < .17) & (s > .5) & (v > .5)
# The crown, traced with a small margin. It runs between the stars at its sides and above it.
crown = polygon(rgb, [(.5,.255),(.53,.315),(.552,.385),(.58,.355),(.603,.405),(.625,.415),(.672,.355),(.65,.46),(.632,.54),(.636,.60),(.62,.665),(.57,.69),(.43,.69),(.38,.665),(.364,.60),(.368,.54),(.35,.46),(.328,.355),(.375,.415),(.397,.405),(.42,.355),(.448,.385),(.47,.315)])
save('back', soften(gold * (1 - crown), 0, 1), soften(crown, 0, 1))
