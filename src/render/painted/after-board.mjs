// Art that the first board does not draw (effect atlases, king ground layers, fallen figures) waits until
// the board is ready. On a slow link the stone and the still figures then get all of the bandwidth, so the
// board shows sooner. The scene opens the gate when its first load ends, also when a picture fails.
let open=false;
const waiting=[];
/** Runs fn now when the board is ready already, else when it becomes ready. */
export function afterBoard(fn){if(open)fn();else waiting.push(fn);}
/** Opens the gate and runs the waiting loads. A second call does nothing. */
export function boardReady(){if(open)return;open=true;for(const fn of waiting.splice(0))fn();}
