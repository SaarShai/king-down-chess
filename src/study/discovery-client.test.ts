import { afterEach, expect, it, vi } from 'vitest';
import { discoveryClient } from './discovery-client';
import { exampleStudies } from './examples';
afterEach(()=>vi.unstubAllGlobals());
it('terminates cancelled scans and permits a new independent operation',async()=>{
  const instances:FakeWorker[]=[];
  class FakeWorker { terminate=vi.fn(); postMessage=vi.fn(); onmessage:((event:{data:unknown})=>void)|undefined; constructor(){instances.push(this);} }
  vi.stubGlobal('Worker',FakeWorker);
  const client=discoveryClient(), request={type:'study-scan' as const,study:exampleStudies('engine')[1].study,checks:[],threshold:12};
  const pending=client.request(request), rejected=expect(pending).rejects.toThrow('cancelled');client.cancel();await rejected;
  expect(instances[0].terminate).toHaveBeenCalledOnce();
  const next=client.request(request);instances[1].onmessage!({data:{result:[]}});
  await expect(next).resolves.toEqual([]);expect(instances[1].terminate).toHaveBeenCalledOnce();
});
