import test from 'node:test';
import assert from 'node:assert/strict';
import {kingBodyBounds,throwAbove} from './king-captures.mjs';

test('the thrown victim clears the bounds of the actual king frame',()=>{
 const body={image:{naturalWidth:400,naturalHeight:200},pivot:[120,180],scale:.5};
 const shape={l:20,r:79,top:10,n:100},foot={x:300,y:400};
 const king=kingBodyBounds(shape,body,foot,2);
 assert.deepEqual(king,{x:300,foot:400,top:240,l:260,r:500});
 const victim={t:200,foot:{x:200,y:390},top:290,hit:{x:200,y:340},shape:[{l:190,r:210}],away:1,headroom:64,board:{left:32,right:928},king};
 assert.equal(throwAbove(victim),true);
 assert.equal(throwAbove({...victim,king:{...king,l:150,r:500}}),false);
});
