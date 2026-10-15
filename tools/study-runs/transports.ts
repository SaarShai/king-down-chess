import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile, stat, rename, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { DispatchInput, RemoteStatus, RunTransport } from './transport-types';

const HERE = dirname(fileURLToPath(import.meta.url));
const SSH = ['-o','BatchMode=yes','-o','ConnectTimeout=10','-o','ServerAliveInterval=10','-o','ServerAliveCountMax=2','M1'];
const IDENTITY = 'test "$(id -un)" = new && test "$(scutil --get LocalHostName)" = MacBook-Pro-2 && test "$(sysctl -n hw.model)" = MacBookPro18,2 && ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub | /usr/bin/awk \'{print $2}\' | /usr/bin/grep -qx SHA256:e2GtnqVZpq4rDNvFsAayCsdu1iSqkFoX8CJCkxazwcM';
const ACTIVE_LOCK='/Users/new/projects/king-down-study-runs/.active';
const AVAILABLE = 'test ! -e '+ACTIVE_LOCK+' && pmset -g batt | /usr/bin/grep -q "AC Power" && ! pgrep -f "[s]tudy-runner.ts|[s]rc/sim/tournament.ts|[I]llustrator|[A]dobe Photoshop|[o]llama runner" >/dev/null';
const FILES = ['games.jsonl','status.json','attestation.json','supervisor.json','supervisor.log'];
type Execute = (command:string,args:string[],options?:{cwd?:string;input?:string;env?:NodeJS.ProcessEnv;timeout?:number;maxBytes?:number})=>Promise<string>;
export const execute: Execute = (command,args,options={}) => new Promise((done,fail)=>{
  const child=spawn(command,args,{cwd:options.cwd,env:options.env,stdio:['pipe','pipe','pipe'],detached:true});
  const chunks:Buffer[]=[];let bytes=0;let settled=false;
  const stop=()=>{try {process.kill(-child.pid!,'SIGKILL');} catch { /* Already stopped. */ }};
  const finish=(error?:Error)=>{if(settled)return;settled=true;clearTimeout(timer);error?fail(error):done(Buffer.concat(chunks).toString('utf8'));};
  const timer=setTimeout(()=>{stop();finish(new Error('Transport command time limit; outcome unknown'));},options.timeout??30000);
  child.stdout.on('data',(b:Buffer)=>{bytes+=b.length;if(bytes>(options.maxBytes??1024*1024)){stop();finish(new Error('Transport output limit'));}else chunks.push(b);});
  child.stderr.on('data',()=>{}); // Remote errors can contain credential-bearing replies.
  child.on('error',()=>finish(new Error('Transport command unavailable')));
  child.on('close',code=>finish(code===0?undefined:new Error('Transport command failed; outcome may be unknown')));
  child.stdin.on('error',()=>{});child.stdin.end(options.input);
});
function check(input:DispatchInput) {
  for(const value of [input.runId,input.partId]) if(!/^[a-z0-9][a-z0-9-]{0,100}$/.test(value))throw new Error('Invalid internal run identity');
  if(!/^[a-f0-9]{64}$/.test(input.bundleHash)||!/^v?\d+\.\d+\.\d+$/.test(input.nodeVersion))throw new Error('Invalid frozen runtime');
  if(!Number.isInteger(input.limitSeconds)||input.limitSeconds<1||input.limitSeconds>28800)throw new Error('Invalid run limit');
  if(input.workers!==(input.machine==='m1'?8:4))throw new Error('Invalid worker count');
}
const quote=(s:string)=>"'"+s.replaceAll("'","'\\''")+"'";
const remoteDirectory=(i:DispatchInput)=>'/Users/new/projects/king-down-study-runs/'+i.runId+'-'+i.partId;
const notebookName=(i:DispatchInput)=>'kd-study-'+i.runId+'-'+i.partId;
export function createTransports(mainRoot:string, exec:Execute=execute):Record<'m1'|'kaggle',RunTransport> {
  const identity=()=>exec('ssh',[...SSH,IDENTITY+' && '+AVAILABLE]);
  async function payload(i:DispatchInput){
    check(i);
    for(const file of [i.sourceArchive,i.bundlePath]) {const s=await stat(file);if(!s.isFile()||s.size>64*1024*1024)throw new Error('Bundle file limit');}
  }
  async function binding(i:DispatchInput){
    const raw=await readFile(i.bundlePath),bundle=JSON.parse(raw.toString('utf8'));
    const parts=Array.isArray(bundle.parts)?bundle.parts.filter((p:{id:string})=>p.id===i.partId):[];
    if(bundle.hash!==i.bundleHash||bundle.id!==i.runId||bundle.nodeVersion!==i.nodeVersion||parts.length!==1||parts[0].machine!==i.machine||parts[0].workers!==i.workers)throw new Error('Dispatch bundle identity differs');
    const sourceArchiveSha256=createHash('sha256').update(await readFile(i.sourceArchive)).digest('hex');
    if(sourceArchiveSha256!==bundle.sourceArchiveSha256)throw new Error('Dispatch source archive differs');
    return {bundleBytesSha256:createHash('sha256').update(raw).digest('hex'),sourceArchiveSha256};
  }
  const m1:RunTransport={
    async preflight(i){await payload(i);await identity();},
    async launch(i){
      await payload(i);const root=remoteDirectory(i);
      const config={...i,...await binding(i),directory:root,activeLock:ACTIVE_LOCK};
      // Each mutation verifies all four identity facts on the same connection.
      await exec('ssh',[...SSH,IDENTITY+' && '+AVAILABLE+' && mkdir -p /Users/new/projects/king-down-study-runs && mkdir '+quote(root)+' && mkdir '+quote(ACTIVE_LOCK)+' && printf %s '+quote(root)+' > '+quote(ACTIVE_LOCK+'/owner')]);
      for(const [file,name] of [[i.sourceArchive,'source.tar.gz'],[i.bundlePath,'bundle.json'],[join(HERE,'supervisor.py'),'supervisor.py']]) {
        await exec('ssh',[...SSH,IDENTITY+' && cat > '+quote(root+'/'+name)],{input:(await readFile(file)).toString('base64')});
        await exec('ssh',[...SSH,IDENTITY+' && /usr/bin/base64 -D -i '+quote(root+'/'+name)+' -o '+quote(root+'/'+name+'.decoded')+' && mv '+quote(root+'/'+name+'.decoded')+' '+quote(root+'/'+name)]);
      }
      await exec('ssh',[...SSH,IDENTITY+' && cat > '+quote(root+'/config.json')],{input:JSON.stringify(config)});
      await exec('ssh',[...SSH,IDENTITY+' && test "$(cat '+quote(ACTIVE_LOCK+'/owner')+')" = '+quote(root)+' && pmset -g batt | /usr/bin/grep -q "AC Power" && cd '+quote(root)+' && (nohup python3 supervisor.py config.json > launch.log 2>&1 < /dev/null &)'],{timeout:15000});
      return {remoteId:root,acceptedAt:new Date().toISOString()};
    },
    async status(i,receipt){
      check(i);const remoteId=remoteDirectory(i);if(receipt&&receipt.remoteId!==remoteId)throw new Error('Wrong remote receipt');
      try {
        const text=await exec('ssh',[...SSH,IDENTITY+' && cat '+quote(remoteId+'/out/supervisor.json')]);
        const value=JSON.parse(text);const state=['running','complete','failed'].includes(value.state)?value.state:'unknown';
        let completedGames=null;try {const count=JSON.parse(await exec('ssh',[...SSH,IDENTITY+' && cat '+quote(remoteId+'/out/status.json')])).completedGames;if(Number.isSafeInteger(count)&&count>=0)completedGames=count;}catch { /* Setup may still run. */ }
        return {remoteId,state,completedGames,message:value.timeout?'Run time limit reached':''};
      }catch {return {remoteId,state:'unknown',completedGames:null,message:'Remote state is unavailable'};}
    },
    async collect(i,receipt,destination){
      check(i);const root=remoteDirectory(i);if(receipt&&receipt.remoteId!==root)throw new Error('Wrong remote receipt');await mkdir(destination,{recursive:true});
      await exec('ssh',[...SSH,IDENTITY+' && python3 -c '+quote('import pathlib,sys; p=pathlib.Path(sys.argv[1]); files=list(p.iterdir()) if p.exists() else []; assert not any(f.is_symlink() for f in files); assert sum(f.stat().st_size for f in files if f.is_file())<=536870912')+' '+quote(root+'/out')]);
      for(const name of FILES){
        const data=await exec('ssh',[...SSH,IDENTITY+' && python3 -c '+quote('import base64,pathlib,sys; p=pathlib.Path(sys.argv[1]); n=p.stat().st_size if p.exists() else 0; assert not p.is_symlink() and n<=536870912; print(base64.b64encode(p.read_bytes()).decode() if p.exists() else "")')+' '+quote(root+'/out/'+name)],{timeout:120000,maxBytes:715827884});
        if(data.trim()){const temp=join(destination,name+'.collecting');await writeFile(temp,Buffer.from(data.trim(),'base64'));await rename(temp,join(destination,name));}
      }
    }
  };
  async function kaggleCall(action:string,i:DispatchInput,extra:Record<string,string>={}) {
    check(i);const env={...process.env,KAGGLE_API_TOKEN:(await readFile(join(mainRoot,'.secrets/kaggle_api_token'),'utf8')).trim()};
    const reply=JSON.parse(await exec('/Users/za/.local/share/uv/tools/kaggle/bin/python',[join(HERE,'kaggle-driver.py')],{input:JSON.stringify({action,name:notebookName(i),...extra}),env,timeout:action==='collect'?180000:120000}));
    if(reply.error)throw new Error('Kaggle operation failed; outcome may be unknown');return reply;
  }
  const kaggle:RunTransport={
    async preflight(i){await payload(i);await kaggleCall('preflight',i);},
    async launch(i){
      await payload(i);const bound=await binding(i);const folder=join(i.directory,'kaggle-'+i.partId);await mkdir(folder,{recursive:false});
      const encoded=JSON.stringify({archive:(await readFile(i.sourceArchive)).toString('base64'),bundle:(await readFile(i.bundlePath)).toString('base64'),supervisor:(await readFile(join(HERE,'supervisor.py'))).toString('base64'),config:{...i,...bound,directory:'/tmp/king-down-study',outputDirectory:'/kaggle/working/out'}});
      await writeFile(join(folder,'run.py'),'import base64,json,pathlib,sys,time\nstarted=time.monotonic()\np=json.loads('+JSON.stringify(encoded)+')\nr=pathlib.Path("/tmp/king-down-study")\nr.mkdir(exist_ok=False)\np["config"]["_startedMonotonic"]=started\nfor k,n in [("archive","source.tar.gz"),("bundle","bundle.json"),("supervisor","supervisor.py")]: (r/n).write_bytes(base64.b64decode(p[k]))\n(r/"config.json").write_text(json.dumps(p["config"]))\nsys.path.insert(0,str(r))\nfrom supervisor import run\nraise SystemExit(run(p["config"]))\n');
      const reply=await kaggleCall('launch',i,{folder});return {remoteId:reply.remoteId,acceptedAt:new Date().toISOString()};
    },
    async status(i,receipt):Promise<RemoteStatus>{try {const value=await kaggleCall('status',i);if(receipt&&receipt.remoteId!==value.remoteId)throw new Error('Wrong remote receipt');return {...value,completedGames:null,message:''};}catch{return {remoteId:receipt?.remoteId??notebookName(i),state:'unknown',completedGames:null,message:'Remote state is unavailable'};}},
    async collect(i,receipt,destination){await mkdir(destination,{recursive:true});const reply=await kaggleCall('collect',i,{destination});if(receipt&&receipt.remoteId!==reply.remoteId)throw new Error('Wrong remote receipt');const out=join(destination,'out');try {for(const name of await readdir(out)){if(FILES.includes(name))await rename(join(out,name),join(destination,name));}}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}}
  };
  return {m1,kaggle};
}
