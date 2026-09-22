import {fromFen,toLan} from '../../src/rules/setup';
import {search, resetSearchState} from '../../src/ai/search';
const pos=fromFen('g7/6k1/2q3pp/3o4/1p1p1P2/pQ1O2PP/6K1/2G5 w - - 0 1');
resetSearchState();const t=performance.now();const r=search(pos,{maxDepth:4,timeMs:2000});
console.log(JSON.stringify({...r,move:r.move&&toLan(pos,r.move),ms:performance.now()-t}));
