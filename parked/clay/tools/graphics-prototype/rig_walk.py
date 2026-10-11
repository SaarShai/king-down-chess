"""A compact, authored walk rig for the two source sculpts; no topology replacement.

Work in character space (X across, Y forward, Z up). Bake foot targets and two-link
leg solves into ordinary glTF animation so playback needs only AnimationMixer.
The Archer's boots have a staggered bind pose; its long skirt gets separate bones.
"""
import bpy, math
from mathutils import Vector, Matrix, Quaternion


def smooth(a, b, x):
    t = max(0., min(1., (x-a)/(b-a)))
    return t*t*(3-2*t)


def add_walk_rig(obj, root, name):
    guard = name == 'guard'
    # Character-space to Blender-space, including the Archer's diagonal heading.
    c = math.sqrt(.5)
    basis = Matrix(((1,0,0),(0,-1,0),(0,0,1))) if guard else Matrix(((c,-c,0),(-c,-c,0),(0,0,1)))
    local = basis.inverted()
    pelvis = Vector((0,0,.32)) if guard else Vector((-.035,-.005,.68))
    ankles = [Vector((s*.115,-.018,.055)) for s in [-1,1]] if guard else [Vector((0,.042,.065)),Vector((.095,-.155,.065))]
    knees = [Vector((s*.115,.018,.145)) for s in [-1,1]] if guard else [Vector((-.03,.085,.34)),Vector((.070,-.08,.34))]
    hips = [Vector((s*.105,0,.32)) for s in [-1,1]] if guard else [Vector((-.090,0,.68)),Vector((.030,-.02,.68))]
    shoulders = [Vector((s*.405,0,.82)) for s in [-1,1]] if guard else [Vector((-.18,0,1.10)),Vector((.09,.12,1.08))]
    hands = [Vector((s*.455,0,.32)) for s in [-1,1]] if guard else [Vector((-.38,-.07,1.24)),Vector((.21,.28,.69))]
    points = {'body': (pelvis, pelvis+Vector((0,0,.35)))}
    for i, side in enumerate(['L','R']):
        points['thigh.'+side] = (hips[i],knees[i])
        points['shin.'+side] = (knees[i],ankles[i])
        points['foot.'+side] = (ankles[i],ankles[i]+Vector((0,.10,0)))
        points['arm.'+side] = (shoulders[i],hands[i])
        if not guard:
            points['skirt.'+side] = (hips[i],Vector((hips[i].x,-.08,.20)))
    data = bpy.data.armatures.new(name+' walk skeleton')
    rig = bpy.data.objects.new(name+' walk rig', data)
    bpy.context.collection.objects.link(rig); rig.parent = root
    bpy.ops.object.select_all(action='DESELECT'); rig.select_set(True); bpy.context.view_layer.objects.active = rig
    bpy.ops.object.mode_set(mode='EDIT')
    # Independent deform bones avoid inheriting pelvis bob in planted feet.
    for label,(a,b) in points.items():
        bone=data.edit_bones.new(label); bone.head=basis@a; bone.tail=basis@b
    bpy.ops.object.mode_set(mode='OBJECT')
    groups={label:obj.vertex_groups.new(name=label) for label in points}

    def leg_weights(v, i):
        side = ['L','R'][i]
        foot = 1-smooth(.065 if guard else .10,.105 if guard else .17,v.z)
        thigh = smooth(.11 if guard else .27,.19 if guard else .40,v.z)
        return {'foot.'+side:foot,'shin.'+side:(1-foot)*(1-thigh),'thigh.'+side:(1-foot)*thigh}

    # Weight the existing surfaces without bending identifying armour/face features.
    for vertex in obj.data.vertices:
        v=local@vertex.co; x,y,z=v
        w={'body':1.}
        if guard:
            limb = smooth(.28,.35,abs(x))*(1-smooth(.66,.81,z))
            if limb:
                w={'body':1-limb,'arm.'+('L' if x<0 else 'R'):limb}
            elif z<.35:
                body=smooth(.22,.35,z)
                w={k:a*(1-body) for k,a in leg_weights(v,0 if x<0 else 1).items()};w['body']=body
        else:
            # Raised left arm, lowered right arm and their rigid wrist crossbows.
            left=smooth(.15,.245,-x)*smooth(.86,.99,z)*(1-smooth(1.30,1.36,z))
            right=max(smooth(.10,.19,x)*smooth(.60,.69,z)*(1-smooth(1.02,1.13,z)),
                      smooth(.23,.29,y)*smooth(.60,.68,z)*(1-smooth(.92,1.02,z)))
            if max(left,right)>.001:
                amount=max(left,right);w={'body':1-amount,'arm.'+('L' if left>right else 'R'):amount}
            elif z<.70:
                body=smooth(.54,.70,z)
                # Actual boot/shin tubes are inside the skirt. Keep feet rigid and
                # let the outer cloth follow gently instead of stretching it between knees.
                i=0 if (x-ankles[0].x)**2+(y-ankles[0].y)**2 < (x-ankles[1].x)**2+(y-ankles[1].y)**2 else 1
                a,b=ankles[i],knees[i];t=max(0,min(1,(z-a.z)/(b.z-a.z)))
                center=a.lerp(b,t);radius=math.hypot(x-center.x,y-center.y)
                leg=(1-smooth(.049,.073,radius))*(1-smooth(.28,.40,z))
                if z<.125:leg=1.
                w={k:a*(1-body)*leg for k,a in leg_weights(v,i).items()}
                side=smooth(-.065,.045,x)
                w['skirt.L']=(1-body)*(1-leg)*(1-side)
                w['skirt.R']=(1-body)*(1-leg)*side
                w['body']=body
        # glTF's four influences; renormalize after keeping the four meaningful ones.
        weights=sorted(((k,a) for k,a in w.items() if a>1e-6),key=lambda p:-p[1])[:4]
        total=sum(a for _,a in weights)
        for label,weight in weights:groups[label].add([vertex.index],weight/total,'REPLACE')
    modifier=obj.modifiers.new('Walk deformation','ARMATURE');modifier.object=rig
    obj.parent=rig

    rest={label:data.bones[label].matrix_local.copy() for label in points}
    def transform(label, rotation, pivot, shift):
        # Rigid motion in character space, then conjugate into Blender space.
        r=basis@rotation.to_matrix()@local
        p=basis@pivot
        matrix=r.to_4x4();matrix.translation=p-r@p+basis@shift
        rig.pose.bones[label].matrix=matrix@rest[label]
    def segment(label, start, end):
        a,b=points[label]
        q=(b-a).rotation_difference(end-start)
        transform(label,q,a,start-a)
    frames=48 if guard else 36
    stride=.065 if guard else .105
    lift=.044 if guard else .065
    duty=.60
    scene=bpy.context.scene;scene.render.fps=30;scene.frame_start=1;scene.frame_end=frames+1
    contacts=[]
    for frame in range(frames+1):
        phase=frame/frames;angle=phase*2*math.pi
        sway=math.sin(angle)*(.012 if guard else .009)
        shift=Vector((sway,0,-(.018 if guard else .025)+(.006 if guard else .012)*(1-math.cos(2*angle))*.5))
        body_q=Quaternion((0,1,0),-math.sin(angle)*(.025 if guard else .018))
        transform('body',body_q,pelvis,shift)
        foot_heights=[]
        for i,side in enumerate(['L','R']):
            t=(phase+i*.5)%1
            if t<duty:
                forward=stride*(1-2*t/duty);height=0.
            else:
                swing=(t-duty)/(1-duty)
                forward=stride*(-1+2*smooth(0,1,swing));height=lift*math.sin(math.pi*swing)**2
            target=ankles[i]+Vector((0,forward,height))
            hip=hips[i]+shift
            # Analytic two-bone solve with the knee facing forward.
            l1=(knees[i]-hips[i]).length;l2=(ankles[i]-knees[i]).length
            delta=target-hip;distance=min(delta.length,l1+l2-.0001);direction=delta.normalized()
            along=(l1*l1-l2*l2+distance*distance)/(2*distance)
            bend=Vector((0,1,0));bend=(bend-direction*bend.dot(direction)).normalized()
            knee=hip+direction*along+bend*math.sqrt(max(0,l1*l1-along*along))
            segment('thigh.'+side,hip,knee);segment('shin.'+side,knee,target)
            transform('foot.'+side,Quaternion(),ankles[i],target-ankles[i])
            foot_heights.append(height)
            # Small opposite arm swing preserves the source's ready/crossbow pose.
            arm_q=Quaternion((1,0,0),math.cos(angle+i*math.pi)*(.075 if guard else .10))
            transform('arm.'+side,arm_q,shoulders[i],shift)
            if not guard:
                cloth=Quaternion((1,0,0),math.cos(angle+i*math.pi-.35)*.055)
                transform('skirt.'+side,cloth,hips[i],shift)
        assert min(foot_heights)<1e-8, 'Every frame needs a planted foot'
        contacts.append(foot_heights)
        for bone in rig.pose.bones:
            bone.rotation_mode='QUATERNION'
            bone.keyframe_insert(data_path='location',frame=frame+1,group=bone.name)
            bone.keyframe_insert(data_path='rotation_quaternion',frame=frame+1,group=bone.name)
            bone.keyframe_insert(data_path='scale',frame=frame+1,group=bone.name)
    rig.animation_data.action.name='Walk'
    # Export the rest mesh and animation independently; save the blend in its rest view.
    scene.frame_set(1)
    return rig, {'bones':len(points),'clip':'Walk','duration':frames/30,'frames':frames+1,
                 'strideSpan':stride*2,'footLift':lift,'stanceFraction':duty,
                 'groundContactEveryFrame':all(min(h)<1e-8 for h in contacts),
                 'scope':'In-place walk; authored weights on the existing print sculpt, not a production retopology'}
