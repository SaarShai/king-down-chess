"""Authored landmarks in world units after scaling the source to its target height.

Joint tuples are (x, height, forward); only paint boxes use height fractions.

These profiles retain the posed sculpts. Weapons held in both hands stay braced;
robe/cape regions get their own gentle motion instead of being stretched across legs.
"""
from mathutils import Vector


def box(lo, hi):
    # paint_surface uses (x, height fraction, forward)
    return [(Vector((1,0,0)),lo[0]),(Vector((-1,0,0)),-hi[0]),
            (Vector((0,1,0)),lo[1]),(Vector((0,-1,0)),-hi[1]),
            (Vector((0,0,1)),lo[2]),(Vector((0,0,-1)),-hi[2])]


PROFILES = [
 dict(key='pawn',label='Pawn',source='pawn_22mm.obj',height=1.30,target=15000,
      feature='Army colour throughout',accent=None,
      hips=[(-.035,.37,-.025),(.035,.37,-.025)],knees=[(-.035,.19,-.040),(.035,.19,-.040)],ankles=[(-.039,.055,-.055),(.037,.055,-.055)],
      shoulders=[(-.075,.59,-.02),(.075,.59,-.02)],hands=[(-.155,.51,.045),(.166,.46,.035)],leg_radius=.055,
      period=1.15,stride=.085,lift=.045,arm_swing=.055,
      prop_boxes=[('arm.R',(.13,1.03,-.08),(.27,1.4,.22))],prop_segments=[('arm.R',(.142,0,.005),(.185,1.08,.075),.036)],carry=['arm.R']),
 dict(key='knight',label='Knight',source='knight_22mm.obj',height=1.48,target=20000,
      feature='Helmet crest',accent=0xb84939,regions=[('accent1',box((-.10,.86,-.30),(.09,1.01,.33)))],
      hips=[(-.045,.69,.025),(.14,.69,.025)],knees=[(-.070,.38,.080),(.17,.38,.050)],ankles=[(-.09,.070,.03),(.19,.070,.005)],
      shoulders=[(-.18,1.04,.015),(.23,1.04,.015)],hands=[(-.355,1.00,.16),(.365,.65,.025)],leg_radius=.085,
      period=1.40,stride=.115,lift=.066,arm_swing=.060,cape_back=.015,
      prop_boxes=[('arm.L',(-.48,-.02,.13),(-.235,1.5,.34))],carry=['arm.L']),
 dict(key='bishop',label='Bishop',source='Bishop.obj',height=1.55,target=18000,
      feature='Mitre',accent=0x92567e,regions=[('accent1',box((-.25,.745,-.4),(.25,1.01,.4)))],
      hips=[(-.045,.67,.035),(.115,.67,.06)],knees=[(-.050,.34,.055),(.125,.34,.10)],ankles=[(-.067,.04,.015),(.137,.04,.105)],
      shoulders=[(-.15,.995,.04),(.19,.995,.03)],hands=[(-.085,.75,.16),(.03,.77,.13)],leg_radius=.053,
      period=1.75,stride=.075,lift=.040,arm_swing=0,robe=True,foot_top=.065),
 dict(key='rook',label='Rook',source='Rook_22mm.obj',height=1.40,target=23000,
      feature='Tower crown',accent=0xb27851,regions=[('accent1',box((-.55,.79,-.6),(.25,1.01,.4)))],
      hips=[(-.255,.41,-.25),(.10,.42,-.08)],knees=[(-.285,.24,-.31),(.17,.24,-.07)],ankles=[(-.335,.065,-.35),(.19,.065,-.15)],
      shoulders=[(-.35,.81,.09),(.36,.81,-.04)],hands=[(-.40,.18,.12),(.41,.38,.02)],leg_radius=.115,
      period=1.9,stride=.095,lift=.060,arm_swing=.065,
      prop_boxes=[('arm.L',(-.7,-.01,-.07),(-.22,.73,.38))],ground_arm='arm.L'),
 dict(key='queen',label='Queen',source='Queen_22m.obj',height=1.52,target=20000,
      feature='Crown',accent=0xb76487,regions=[('accent1',box((-.22,.925,-.3),(.23,1.01,.3)))],
      hips=[(-.085,.76,0),(.085,.76,0)],knees=[(-.085,.36,.035),(.085,.36,.035)],ankles=[(-.085,.04,0),(.085,.04,0)],
      shoulders=[(-.12,1.22,.01),(.13,1.22,.01)],hands=[(-.175,.86,.01),(.18,.86,.01)],leg_radius=.065,
      period=1.85,stride=.070,lift=.025,arm_swing=.045,robe=True,concealed=True),
 # Collapse reduction of this scan destroys its extremities, even after welding.
 # Preserve its supplied surface rather than trading away the head/boots/hammer.
 dict(key='paladin',label='Paladin',source='Paladin-0.obj',height=1.40,target=70000,
      feature='Raised chest cross',accent=0xc69744,
      regions=[('accent1',box((-.219,.650,.025),(-.144,.79,.13))),('accent1',box((-.295,.696,.025),(-.070,.735,.13)))],
      hips=[(-.29,.51,-.05),(-.065,.51,-.05)],knees=[(-.29,.27,-.012),(-.065,.27,-.012)],ankles=[(-.29,.065,-.085),(-.065,.065,-.085)],
      shoulders=[(-.435,1.04,-.02),(.05,1.04,-.02)],hands=[(-.465,.61,.22),(.15,.75,.23)],leg_radius=.080,
      period=1.6,stride=.085,lift=.052,arm_swing=0,robe=True,foot_top=.115),
 dict(key='maester',label='Maester',source='Maetser_22mm.obj',height=1.12,target=18000,
      feature='Goggle frame',accent=0x56a5a6,
      regions=[('accent1',box((-.11,.715,.205),(.10,.80,.36)))],
      hips=[(-.12,.32,-.02),(.035,.32,-.15)],knees=[(-.15,.18,.015),(.055,.18,-.13)],ankles=[(-.15,.045,.04),(.065,.045,-.14)],
      shoulders=[(-.20,.68,-.015),(.20,.68,-.10)],hands=[(-.23,.87,.22),(.17,.51,.08)],leg_radius=.085,
      period=1.05,stride=.062,lift=.047,arm_swing=0,
      prop_boxes=[('body',(-.5,.21,-.5),(.5,1.2,-.20))]),
 dict(key='beast',label='Beast',source='Beast.obj',height=1.34,target=21000,
      feature='Muzzle harness',accent=0xa96140,
      regions=[('accent1',box((-.35,.645,.24),(.34,.725,.65)))],
      hips=[(-.13,.32,-.065),(.17,.32,.075)],knees=[(-.13,.16,-.08),(.18,.16,.10)],ankles=[(-.14,.050,-.105),(.18,.050,.080)],
      shoulders=[(-.29,.89,0),(.29,.89,0)],hands=[(-.20,.44,.36),(.23,.44,.36)],leg_radius=.095,
      period=1.45,stride=.085,lift=.050,arm_swing=0,tail_back=-.27),
]

PROFILES += [
 dict(key='king-ember',label='Ember King',source='King_Ember_22mm.obj',height=1.55,target=23000,
      feature='Cracked chest armour',accent=0xc16b44,regions=[('accent1',box((-.419,.55,.078),(.047,.77,.28)))],
      hips=[(-.264,.744,.062),(-.093,.744,.062)],knees=[(-.295,.496,.031),(-.093,.496,.031)],ankles=[(-.295,.264,.062),(-.093,.264,.062)],
      shoulders=[(-.434,1.07,.078),(.031,1.07,.078)],hands=[(-.481,.713,.109),(.109,.729,.109)],leg_radius=.085,
      period=1.85,stride=.07,lift=.045,arm_swing=.035,cape_back=-.005,ground_boots=True),
 dict(key='king-frost',label='Frost King',source='King_Frost_22mm.obj',height=1.60,target=22000,
      feature='Raised ice gauntlet',accent=0x67a6bf,regions=[('accent1',box((.16,.52,.064),(.4,.78,.29)))],
      hips=[(-.128,.768,0),(.128,.768,0)],knees=[(-.144,.512,-.016),(.144,.512,-.016)],ankles=[(-.16,.256,.032),(.16,.256,.032)],
      shoulders=[(-.272,1.136,.032),(.288,1.136,.032)],hands=[(-.304,.704,.08),(.32,1.088,.16)],leg_radius=.085,
      period=1.9,stride=.06,lift=.045,arm_swing=.035,robe=True,foot_top=.23),
 dict(key='king-gaya',label='Gaya King',source='King_Gaya_22mm.obj',height=1.65,target=23000,
      feature='Rhino pauldron',accent=0x7b9b53,regions=[('accent1',box((.083,.62,.099),(.562,.94,.462)))],
      hips=[(-.099,.825,.132),(.083,.825,.132)],knees=[(-.165,.495,.033),(-.017,.495,.132)],ankles=[(-.165,.231,.05),(.017,.198,.198)],
      shoulders=[(-.28,1.221,.182),(.215,1.238,.314)],hands=[(-.297,.726,.132),(.182,.710,.281)],leg_radius=.08,
      period=2.0,stride=.062,lift=.045,arm_swing=0,robe=True,foot_top=.16),
 dict(key='king-celestial',label='Celestial King',source='King_Celestial_22mm-1.obj',height=1.60,target=22000,
      feature='Crown',accent=0xd0ad55,
      regions=[('accent1',box((-.13,.85,-.20),(.13,1.01,.20)))],
      hips=[(-.128,.8,0),(.128,.8,0)],knees=[(-.144,.56,-.032),(.144,.56,-.032)],ankles=[(-.16,.32,.016),(.16,.32,.016)],
      shoulders=[(-.272,1.152,.032),(.272,1.152,.032)],hands=[(-.336,.752,.096),(.336,.752,.096)],leg_radius=.080,
      period=1.8,stride=.065,lift=.048,arm_swing=.035,robe=True,foot_top=.35,ground_boots=True),
 dict(key='king-shadow',label='Shadow King',source='King_Shadow_22mm.obj',height=1.60,target=22000,
      feature='Sword',accent=0x8067a4,regions=[('accent1',box((.048,.12,-.048),(.368,.60,.256)))],
      hips=[(-.016,.816,.064),(.080,.816,.064)],knees=[(-.06,.528,-.048),(.06,.528,-.048)],ankles=[(-.06,.14,-.048),(.06,.14,-.048)],
      shoulders=[(-.24,1.184,.048),(.16,1.216,.096)],hands=[(-.224,.88,.08),(.032,.896,.128)],leg_radius=.06,
      period=2.2,stride=.055,lift=.02,arm_swing=0,robe=True,concealed=True,sway=.006),
 dict(key='king-spirit',label='Spirit King',source='King_Spirit_22mm.obj',height=1.55,target=18000,
      feature='Clasped hands',accent=0x68aaa3,regions=[('accent1',box((-.155,.40,-.264),(.155,.57,-.124)))],
      hips=[(-.093,.76,-.124),(.093,.76,-.124)],knees=[(-.108,.465,-.108),(.108,.465,-.108)],ankles=[(-.14,.217,-.108),(.14,.217,-.108)],
      shoulders=[(-.217,1.132,-.078),(.217,1.132,-.078)],hands=[(-.078,.76,-.217),(.078,.76,-.217)],leg_radius=.07,
      period=2.05,stride=.058,lift=.03,arm_swing=0,robe=True,concealed=True,yaw=180,forward=-1),
]
