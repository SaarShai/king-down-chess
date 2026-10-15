import type { DiscoveryRequest } from './discovery-worker';
/** One bounded operation at a time. Termination cancels work, not just its reply. */
export function discoveryClient() {
  let active: {worker:Worker;reject:(error:Error)=>void}|undefined;
  const cancel=()=> { if(active) {active.worker.terminate();active.reject(new Error('Discovery cancelled.'));active=undefined;} };
  return { cancel, request<T>(request:DiscoveryRequest):Promise<T> {
    cancel();
    return new Promise((resolve,reject)=> {
      const worker=new Worker(new URL('./discovery-worker.ts',import.meta.url),{type:'module'});
      active={worker,reject};
      const finish=()=> {worker.terminate();if(active?.worker===worker) active=undefined;};
      worker.onmessage=({data})=> {finish();data.error?reject(new Error(data.error)):resolve(data.result);};
      worker.onerror=()=> {finish();reject(new Error('Discovery worker failed.'));};
      worker.onmessageerror=()=> {finish();reject(new Error('Discovery reply failed.'));};
      worker.postMessage(request);
    });
  } };
}
