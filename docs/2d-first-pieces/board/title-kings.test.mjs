// The title kings keep their images' CSS filter on the canvas (title-kings.mjs filterOf): the brightness, and every
// drop shadow in its CSS order, so the rim round a pale king stays when his canvas takes the place of his image.
import test from 'node:test';
import assert from 'node:assert/strict';
import {filterOf} from './title-kings.mjs';

test('a back king: the brightness, then the rim and the cast shadow, in their CSS order',()=>{
 // The computed value, as the browser gives it for .title-kings .tk-outer (style.css).
 const css='brightness(0.86) drop-shadow(rgba(43, 38, 33, 0.7) 0px 0px 0.75px) drop-shadow(rgba(43, 38, 33, 0.32) 0px 12px 10px)';
 assert.deepEqual(filterOf(css),{brightness:0.86,shadows:[
  {color:'rgba(43, 38, 33, 0.7)',x:0,y:0,blur:0.75},
  {color:'rgba(43, 38, 33, 0.32)',x:0,y:12,blur:10},
 ]});
});

test('a front king has no brightness: the canvas keeps 1',()=>{
 const css='drop-shadow(rgba(43, 38, 33, 0.7) 0px 0px 0.75px) drop-shadow(rgba(43, 38, 33, 0.42) 0px 14px 12px)';
 assert.equal(filterOf(css).brightness,1);
 assert.equal(filterOf(css).shadows.length,2);
});

test('no filter: brightness 1 and no shadow',()=>{
 assert.deepEqual(filterOf('none'),{brightness:1,shadows:[]});
});

test('an offset to the left and up stays negative',()=>{
 assert.deepEqual(filterOf('drop-shadow(rgb(0, 0, 0) -2px -3px 4px)').shadows,[{color:'rgb(0, 0, 0)',x:-2,y:-3,blur:4}]);
});
