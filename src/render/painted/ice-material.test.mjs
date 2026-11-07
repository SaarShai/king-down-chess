import test from 'node:test';
import assert from 'node:assert/strict';
import {iceScale} from './ice-material.mjs';

test('the ice keeps its size with no figure and stretches over a tall, wide figure',()=>{
 assert.deepEqual(iceScale({front:true}),[1,1]);
 assert.deepEqual(iceScale({front:false,height:82,half:54}),[1,1],'the figure it was drawn for');
 const rook={height:132,half:68},[bx,by]=iceScale({front:false,...rook}),[fx,fy]=iceScale({front:true,...rook});
 assert.ok(111*by>rook.height,'the back face stands above the head');
 assert.ok(61*fy>=.74*rook.height,'the front face covers the same share as on the Pawn');
 assert.ok(58*bx>rook.half&&bx===fx,'both faces reach past the widest side');
});
