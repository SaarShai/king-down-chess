import { Position } from '../rules/engine';
import { SearchOptions, search } from './search';

const ctx = self as unknown as Worker;
ctx.onmessage = (e: MessageEvent<{ id: number; pos: Position; opts: SearchOptions }>) => {
  const { id, pos, opts } = e.data;
  ctx.postMessage({ id, ...search(pos, opts) });
};
