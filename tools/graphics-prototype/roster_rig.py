"""Small per-character rigs for the rest of the cast, baked to portable glTF clips."""
import bpy, math
from mathutils import Vector, Matrix, Quaternion
from rig_walk import smooth


def add_roster_walk(obj, root, profile):
    p=profile
    # Landmarks are source Y-up; solve in X-across / Y-forward / Z-up.
    def point(v):return Vector((v[0],v[2],v[1]))
    basis=Matrix(((1,0,0),(0,-1,0),(0,0,1)))
    hips=list(map(point,p['hips']));knees=list(map(point,p['knees']));ankles=list(map(point,p['ankles']))
    shoulders=list(map(point,p['shoulders']));hands=list(map(point,p['hands']))
    pelvis=(hips[0]+hips[1])*.5
    cloth=bool(p.get('robe') or 'cape_back' in p)
    points={'body':(pelvis,pelvis+Vector((0,0,.3)))}
    for i,s in enumerate(['L','R']):
        points['thigh.'+s]=(hips[i],knees[i]);points['shin.'+s]=(knees[i],ankles[i])
        points['foot.'+s]=(ankles[i],ankles[i]+Vector((0,.1,0)))
        points['arm.'+s]=(shoulders[i],hands[i])
        if cloth:points['cloth.'+s]=(hips[i],hips[i]-Vector((0,0,.3)))
    if 'tail_back' in p:points['tail']=(Vector((pelvis.x,p['tail_back']+.1,.3)),Vector((pelvis.x,p['tail_back']-.15,.1)))
    data=bpy.data.armatures.new(p['key']+' skeleton');rig=bpy.data.objects.new(p['key']+' walk rig',data)
    bpy.context.collection.objects.link(rig);rig.parent=root
    bpy.ops.object.select_all(action='DESELECT');rig.select_set(True);bpy.context.view_layer.objects.active=rig
    bpy.ops.object.mode_set(mode='EDIT')
    for name,(a,b) in points.items():
        bone=data.edit_bones.new(name);bone.head=basis@a;bone.tail=basis@b
    bpy.ops.object.mode_set(mode='OBJECT')
    groups={name:obj.vertex_groups.new(name=name) for name in points}
    def distance(v,a,b):
        t=max(0,min(1,(v-a).dot(b-a)/(b-a).length_squared));return (v-a.lerp(b,t)).length
    def leg(v,i):
        side=['L','R'][i];a=ankles[i].z;k=knees[i].z
        f=1-smooth(a+.014,min(k-.006,a+.060),v.z)
        thigh=smooth(k-.055,k+.055,v.z)
        if p['key']=='beast':
            # Broad clay ankles need a broad bend, not a narrow boot cuff.
            f=1-smooth(a-.025,k+.025,v.z)
            thigh=smooth(k-.08,k+.08,v.z)
        return {'foot.'+side:f,'shin.'+side:(1-f)*(1-thigh),'thigh.'+side:(1-f)*thigh}
    boot_floor=[math.inf,math.inf]
    for vertex in obj.data.vertices:
        v=basis@vertex.co;x,y,z=v
        w={'body':1.}
        fixed=None
        for label,lo,hi in p.get('prop_boxes',[]):
            if lo[0]<=x<=hi[0] and lo[1]<=z<=hi[1] and lo[2]<=y<=hi[2]:fixed=label
        for label,a,b,radius in p.get('prop_segments',[]):
            if distance(v,point(a),point(b))<radius:fixed=label
        if fixed:w={fixed:1.}
        elif p['key']=='beast':
            # Its hands and belly hang below the hips. Height alone assigned
            # them to opposing legs, tearing adjacent triangles as it stepped.
            # Confine each leg to its own volume, with continuous attachments.
            body=smooth(pelvis.z-.04,pelvis.z+.12,z)
            hands=smooth(.15,.25,y)*smooth(.18,.24,z)
            w={}
            for i in range(2):
                radius=p['leg_radius']
                amount=(1-body)*(1-hands)*(1-smooth(radius,radius*2,distance(v,ankles[i],hips[i])))
                for name,value in leg(v,i).items():w[name]=value*amount
            total=sum(w.values())
            if total>1:w={name:value/total for name,value in w.items()}
            w['body']=max(0,1-total)
            tail=(1-smooth(p['tail_back']-.08,p['tail_back'],y))*(1-smooth(.44,.61,z))
            w={name:value*(1-tail) for name,value in w.items()}
            w['tail']=tail
        elif cloth and 'cape_back' in p and y<p['cape_back'] and z<shoulders[0].z:
            body=smooth(shoulders[0].z-.20,shoulders[0].z,z)
            side=smooth(pelvis.x-.08,pelvis.x+.08,x)
            w={'body':body,'cloth.L':(1-body)*(1-side),'cloth.R':(1-body)*side}
        elif z<pelvis.z+.12:
            i=min(range(2),key=lambda j:distance(v,ankles[j],hips[j]))
            body=smooth(pelvis.z-.04,pelvis.z+.12,z)
            if p.get('robe'):
                leg_amount=0 if p.get('concealed') else 1-smooth(p['leg_radius']*.72,p['leg_radius']*1.1,distance(v,ankles[i],knees[i]))
                # Only the feet/low shins may drag the robe; higher folds belong to cloth.
                leg_amount*=1-smooth(p.get('foot_top',.13),p.get('foot_top',.13)+.11,z)
                side=smooth(pelvis.x-.10,pelvis.x+.10,x)
                w={k:a*(1-body)*leg_amount for k,a in leg(v,i).items()}
                w.update({'cloth.L':(1-body)*(1-leg_amount)*(1-side),'cloth.R':(1-body)*(1-leg_amount)*side,'body':body})
            else:
                w={k:a*(1-body) for k,a in leg(v,i).items()};w['body']=body
        elif p['arm_swing']>0:
            i=min(range(2),key=lambda j:distance(v,shoulders[j],hands[j]))
            radius=p.get('arm_radius',.11)
            amount=1-smooth(radius*.5,radius,distance(v,shoulders[i],hands[i]))
            amount*=1-smooth(0,.10,(v-shoulders[i]).length if z>shoulders[i].z else 0) if z>shoulders[i].z else 1
            # Keep the attachment inside the shoulder soft; weapons stay rigid via masks above.
            amount*=smooth(.02,.11,(v-shoulders[i]).length)
            w={'body':1-amount,'arm.'+['L','R'][i]:amount}
        weights=sorted(((k,a) for k,a in w.items() if a>1e-6),key=lambda t:-t[1])[:4]
        total=sum(a for _,a in weights)
        for name,value in weights:
            groups[name].add([vertex.index],value/total,'REPLACE')
            if name.startswith('foot.') and value/total>.95:
                i=0 if name.endswith('.L') else 1;boot_floor[i]=min(boot_floor[i],z)
    obj.parent=rig;modifier=obj.modifiers.new('Walk deformation','ARMATURE');modifier.object=rig
    rest={name:data.bones[name].matrix_local.copy() for name in points}
    def transform(name,q,pivot,shift):
        r=basis@q.to_matrix()@basis;p0=basis@pivot
        m=r.to_4x4();m.translation=p0-r@p0+basis@shift
        rig.pose.bones[name].matrix=m@rest[name]
    def segment(name,start,end):
        a,b=points[name];transform(name,(b-a).rotation_difference(end-start),a,start-a)
    frames=round(p['period']*30);period=frames/30;duty=.62
    scene=bpy.context.scene;scene.render.fps=30;scene.frame_start=1;scene.frame_end=frames+1
    contact_error=0
    drops=[max(0,v) if p.get('ground_boots') and math.isfinite(v) else 0 for v in boot_floor]
    for frame in range(frames+1):
        phase=frame/frames;angle=phase*2*math.pi
        shift=Vector((math.sin(angle)*p.get('sway',.009),0,-sum(drops)*.5-.015+.010*(1-math.cos(angle*2))*.5))
        transform('body',Quaternion((0,1,0),-math.sin(angle)*.016),pelvis,shift)
        heights=[]
        for i,side in enumerate(['L','R']):
            t=(phase+i*.5)%1
            if t<duty:forward=p['stride']*(1-2*t/duty);height=0.
            else:
                u=(t-duty)/(1-duty);forward=p['stride']*(-1+2*smooth(0,1,u));height=p['lift']*math.sin(math.pi*u)**2
            target=ankles[i]+Vector((0,forward*p.get('forward',1),height-drops[i]));hip=hips[i]+shift
            l1=(knees[i]-hips[i]).length;l2=(ankles[i]-knees[i]).length
            d=target-hip;length=min(d.length,l1+l2-.0001);direction=d.normalized()
            along=(l1*l1-l2*l2+length*length)/(2*length)
            bend=Vector((0,p.get('forward',1),0));bend=(bend-direction*bend.dot(direction)).normalized()
            knee=hip+direction*along+bend*math.sqrt(max(0,l1*l1-along*along))
            segment('thigh.'+side,hip,knee);segment('shin.'+side,knee,target)
            transform('foot.'+side,Quaternion(),ankles[i],target-ankles[i]);heights.append(height)
            arm='arm.'+side;arm_shift=shift.copy();swing=p['arm_swing']
            if arm in p.get('carry',[]):arm_shift.z+=.060;swing=.018
            q=Quaternion((1,0,0),math.cos(angle+i*math.pi)*swing)
            if arm==p.get('ground_arm'):
                q=Quaternion();arm_shift=Vector((0,math.sin(angle)*.03,.028*math.sin(angle*.5)**2))
            transform(arm,q,shoulders[i],arm_shift)
            if cloth:
                # Horizontal sweep and a positive hem lift keep long skirts out of the board.
                lag=angle+i*math.pi-.35;lift=.010*(1-math.cos(angle*2))*.5
                transform('cloth.'+side,Quaternion((0,0,1),math.sin(lag)*.024),hips[i],Vector((math.sin(lag)*.008,math.cos(lag)*.009,lift)))
        if 'tail' in points:transform('tail',Quaternion((0,0,1),math.sin(angle-.4)*.085),points['tail'][0],Vector((0,0,.008*(1-math.cos(angle)))))
        contact_error=max(contact_error,min(heights))
        for bone in rig.pose.bones:
            bone.rotation_mode='QUATERNION'
            for channel in ['location','rotation_quaternion','scale']:bone.keyframe_insert(data_path=channel,frame=frame+1,group=bone.name)
    rig.animation_data.action.name='Walk';scene.frame_set(1)
    return rig,{'bones':len(points),'clip':'Walk','duration':period,'frames':frames+1,'strideSpan':p['stride']*2,'footLift':p['lift'],
                'stanceFraction':duty,'footTargetsGroundedEveryFrame':contact_error<1e-8,'bootLowering':drops,'concealedFeet':p.get('concealed',False),
                'scope':'Concealed steps under the original closed skirt' if p.get('concealed') else 'In-place articulated walk; authored source-sculpt weights'}
