// The floor round the painted board (scene.mjs paintFloor): the default floor for the trial, the trailer and the
// plugin page, and a clear canvas for the game, which stands the board on the page's parchment floor.
import test from 'node:test';
import assert from 'node:assert/strict';
import {FLOOR,SIZE,paintFloor} from './scene.mjs';

/** A stand-in for a 2D context: it records each call, with the fill colour at the time of a fill. */
function recorder(){
 const calls=[];
 return {calls,fillStyle:'#000000',clearRect(...a){calls.push(['clear',...a]);},fillRect(...a){calls.push(['fill',this.fillStyle,...a]);}};
}

test('the default floor stays the stone white of the trial and the plugin page',()=>{
 assert.equal(FLOOR,'#e6e1cf');
});

test('a floor colour clears the whole canvas, the headroom included, then fills it',()=>{
 const ctx=recorder();
 paintFloor(ctx,FLOOR,64);
 assert.deepEqual(ctx.calls,[['clear',0,-64,SIZE,SIZE+64],['fill','#e6e1cf',0,-64,SIZE,SIZE+64]]);
});

test('a null floor only clears the canvas, so the page shows round the board',()=>{
 const ctx=recorder();
 paintFloor(ctx,null,64);
 assert.deepEqual(ctx.calls,[['clear',0,-64,SIZE,SIZE+64]]);
});
