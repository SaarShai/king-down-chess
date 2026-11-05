import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MIN_ANGLE, MAX_ANGLE, THRUST, armies, shoulderMesh, tipAt, targetPoint, aimAt, thrustAt, weightShift } from './aiming.mjs';
const area = ([a,b,c]) => (b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);

test('lance keeps its grip and shape, reaches the target and returns to planted feet', () => {
  let minimumArea = Infinity, poses = 0;
  for (const side of [0,1]) for (let sample=0; sample<=220; sample++) {
    const angle = MIN_ANGLE + (MAX_ANGLE-MIN_ANGLE)*sample/220, mesh = shoulderMesh(angle,side);
    for (const ids of mesh.triangles) {
      const before=ids.map(i=>mesh.source[i]), after=ids.map(i=>mesh.destination[i]);
      const ratio=area(after)/area(before); minimumArea=Math.min(minimumArea,ratio);
      assert.ok(ratio>.2,'shoulder triangles never fold or collapse');
      if (before.every(p=>p.x>=460+armies[side].dx && p.y>=468+armies[side].dy && p.y<=530+armies[side].dy)) {
        for(let i=0;i<3;i++) assert.ok(Math.abs(distance(before[i],before[(i+1)%3])-distance(after[i],after[(i+1)%3]))<1e-8,'grip and shaft stay rigid');
      }
    }
    const target=targetPoint(angle,side);
    assert.ok(Math.abs(aimAt(target.x,target.y,side)-angle)<1e-8,'pointer and lance direction agree');
    assert.ok(distance(tipAt(angle,side,THRUST),target)<1e-8,'full thrust makes contact');
    assert.ok(target.x>0 && target.x<950 && target.y>30 && target.y<950,'tip and target fit the stage');
    for (let step=0;step<=100;step++) {
      const extension=THRUST*thrustAt(step/100);
      assert.ok(extension>=-THRUST*.16-1e-8 && extension<=THRUST,'bounded anticipation and jab');
      const start=tipAt(angle,side), moved=tipAt(angle,side,extension);
      assert.ok(Math.abs((moved.x-start.x)*Math.sin(angle)-(moved.y-start.y)*Math.cos(angle))<1e-8,'jab follows the straight shaft axis');
      for(const foot of [{x:140,y:820},{x:425,y:837}]) assert.deepEqual(weightShift(foot,angle,extension),foot,'soles remain planted');
      const a=weightShift({x:100,y:615},angle,extension),b=weightShift({x:100,y:805},angle,extension);
      assert.ok(b.y>a.y,'stance does not invert');
    }
    poses++;
  }
  assert.equal(thrustAt(0),0); assert.equal(thrustAt(1),0); assert.equal(thrustAt(.48),1);
  console.log(`${poses} aim poses and ${poses*101} thrust samples; minimum shoulder area ratio ${minimumArea.toFixed(3)}`);
});
