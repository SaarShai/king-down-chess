"""Rescue. R: the dark water round the arm. G: the air and far scene the snow falls through (not the hand, arm or sleeve). B: the ice sleeve without the hand."""
import sys, os; sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from mask_lib import *

rgb = painting('rescue'); h, s, v = hsv(rgb)

def closed(mask, n):
    """Fill small holes: grow, then shrink back."""
    im = Image.fromarray(np.uint8(np.clip(mask, 0, 1) * 255)).filter(ImageFilter.MaxFilter(n * 2 + 1)).filter(ImageFilter.MinFilter(n * 2 + 1))
    return np.asarray(im, dtype=np.float32) / 255

# The sleeve, traced: the long strip from the top edge, then the bunched ice in the fist.
sleeve = polygon(rgb, [(.122,0),(.149,.074),(.161,.091),(.20,.169),(.239,.234),(.259,.286),(.308,.382),(.337,.451),(.371,.521),(.40,.582),(.454,.612),
                       (.50,.612),(.53,.585),(.528,.555),(.532,.495),(.522,.40),(.527,.385),(.503,.295),(.483,.262),(.43,.262),(.40,.20),(.361,.195),(.327,.078),(.30,0)])
# The skin: colour key, limited to where the hand and the arm lie.
hand_zone = polygon(rgb, [(.33,.185),(.40,.175),(.47,.205),(.515,.285),(.505,.345),(.505,.44),(.48,.44),(.42,.39),(.38,.37),(.33,.35)])
arm_zone = polygon(rgb, [(.44,.60),(.535,.515),(.58,.52),(.70,.82),(.60,.85),(.51,.80)])
warm = ((h < .13) | (h > .96)) & (s > .16)
skin = closed(np.maximum(hand_zone, arm_zone) * warm, 2)
ice = soften(sleeve, 0, .8) * (1 - soften(skin, 1, .8))

# The open water, traced round the floes. It does not cross the arm.
water = polygon(rgb, [(.395,.665),(.47,.655),(.60,.62),(.70,.625),(.705,.64),(.74,.67),(.80,.705),(.835,.71),(.845,.76),(.90,.80),(.925,.875),(.896,.885),(.80,.893),(.737,.92),(.735,1),
                      (.65,1),(.63,.985),(.54,.945),(.47,.90),(.42,.965),(.40,.95),(.345,.89),(.30,.885),(.245,.905),(.22,.86),(.175,.81),(.19,.79),(.27,.73),(.30,.722),(.342,.75),(.386,.73)])
floe = polygon(rgb, [(.237,.81),(.295,.77),(.32,.80),(.322,.835),(.255,.862)])
arm = soften(skin * arm_zone, 3, 1)
# Water fades to zero before the floes and the arm, so their outlines stay still.
r = soften(water * (1 - floe), 0, 0)
r = np.asarray(Image.fromarray(np.uint8(r * 255)).filter(ImageFilter.MinFilter(5)), dtype=np.float32) / 255
# The splash round the arm moves only half as much, so its painted drops do not melt.
foam = soften(polygon(rgb, [(.40,.68),(.60,.62),(.78,.72),(.78,.86),(.40,.86)]) * (v > .68) * (s < .42), 1, 1.5)
r = soften(r, 0, 2.5) * (1 - arm) * (1 - .55 * foam)

# Snow falls in front of all the scene but behind the figure.
figure = np.maximum(sleeve, skin)
g = 1 - soften(figure, 1, 1)

save('rescue', r, g, ice)
