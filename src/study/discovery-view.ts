import { esc } from '../workshop/text';
import { PaintedView } from '../render/PaintedView';
import { positionOf, withRules, type Study } from './model';
import { studyOf, testOf, type StudyDocument } from './browser-service';
import { checkStudy, type Fact, type StudyTest } from './check';
import { discoveryCatalog, digest, newDiscovery, type Candidate, type DiscoveryDocument, type Obligation, type ProposalSet, type CoverageState, type Provenance } from './discovery';
import { discoveryClient } from './discovery-client';
import { loadDiscoveries, saveDiscoveryDocument } from './store';
import { createRunClient } from './run-client';
import type { StudyClient } from './client';
import type { ReplayBatch } from './discovery-scan';
import type { StudyRunSummary } from './run-types';

type Rows={obligation:Obligation;state:CoverageState;reason:string}[];
const defaults=['piece:R','rule:blockers','card:Haste','power:Frost:Freeze'];
const btn=(id:string,label:string)=>`<button type="button" data-discovery="${id}">${label}</button>`;
export function mountDiscovery(body:HTMLElement, input:StudyDocument, studyClient:StudyClient, open:(document:StudyDocument)=>Promise<void>):()=>void {
  const parent=structuredClone(studyOf(input)), client=discoveryClient();
  let runs=createRunClient();
  let alive=true,busy=false,documents:DiscoveryDocument[]=[],doc:DiscoveryDocument,set:ProposalSet,rows:Rows=[];
  let scope=defaults,budget=24,tab='proposals',filter='all',candidates:Candidate[]=[],page=0,available:StudyRunSummary[]=[];
  let review:{study:Study;checks:Fact[];provenance:Provenance;obligation:string|null;signals:string[]}|undefined;
  let board:PaintedView|undefined;
  const message=(text:string)=>{if(alive)body.querySelector<HTMLElement>('[role="status"]')!.textContent=text;};
  async function work(fn:()=>Promise<void>):Promise<void> {
    if(busy)return;busy=true;body.setAttribute('aria-busy','true');
    try {await fn();} catch(error) {message(error instanceof Error?error.message:String(error));}
    finally {busy=false;body.removeAttribute('aria-busy');}
  }
  async function plan():Promise<void> {
    documents=await loadDiscoveries();
    const result=await client.request<{set:ProposalSet;rows:Rows}>({type:'plan',study:parent,scope,budget,documents});
    if(!alive)return;
    set=result.set;rows=result.rows;doc=documents.find(d=>d.context===set.context)??await newDiscovery(parent,set);render();
  }
  async function recordScan(threshold:number, batch?:ReplayBatch):Promise<void> {
    const games=batch?.games??[{study:parent,provenance:{inputHash:await digest(parent)}}];
    const manifest={inputHash:await digest(batch??parent),source:batch?.source??parent.engine,games:games.length,actions:games.reduce((n,g)=>n+g.study.prefix.length+g.study.actions.length,0),threshold,candidates:candidates.length,inputs:games.map(g=>({id:g.study.id,hash:g.provenance.inputHash}))};
    if(!alive)return;
    if(!(doc.scans??[]).some(s=>s.inputHash===manifest.inputHash&&s.threshold===threshold))doc=await saveDiscoveryDocument({...doc,scans:[...(doc.scans??[]),manifest]});
  }
  function download():void {
    const url=URL.createObjectURL(new Blob([JSON.stringify(doc,null,2)],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download=`discovery-${doc.context.slice(0,12)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function summary():string {
    const counts=new Map<string,number>();for(const row of rows)counts.set(row.state,(counts.get(row.state)??0)+1);
    return `<p data-discovery-counts>${rows.length} obligations · ${[...counts].map(([key,n])=>`${n} ${key}`).join(' · ')}. ${set.exclusions.length} excluded.</p><p>These counts cover the full scope. They do not measure all positions, balance or fun.</p>`;
  }
  function render():void {
    if(!alive)return;
    board=undefined;
    body.classList.add('discovery-panel');
    body.innerHTML=`<p><strong>${esc(parent.title)} · saved version ${parent.version}</strong></p><nav aria-label="Discovery views">${btn('proposals','Proposals')}${btn('coverage','Coverage')}${btn('sequences','Review sequences')}${btn('saved','Saved regressions')}</nav><p role="status" aria-live="polite"></p><div class="discovery-content"></div><footer>${btn('cancel','Cancel work')}${btn('export','Export discovery')}<label>Import discovery <input type="file" data-discovery-import accept=".json"></label></footer>`;
    const content=body.querySelector<HTMLElement>('.discovery-content')!;
    if(tab==='proposals') {
      content.innerHTML=`<form data-scope><details><summary>Choose items in scope</summary><fieldset><legend>Items in scope (2–12)</legend>${discoveryCatalog.map(d=>`<label><input type="checkbox" name="item" value="${esc(d.id)}" ${scope.includes(d.id)?'checked':''}>${esc(d.label)}</label>`).join('')}</fieldset></details><label>Scenario budget <input name="budget" type="number" min="1" max="200" value="${budget}" required></label><button>Propose pairs</button></form>${set?summary()+`<p>${set.selected.length} selected · ${set.omitted.length} omitted by budget. Increasing the budget retains the earlier selection.</p>`:''}<div data-cells></div>`;
      content.querySelector('form')!.onsubmit=e=>{e.preventDefault();void work(async()=>{const data=new FormData(e.currentTarget as HTMLFormElement);scope=data.getAll('item').map(String);budget=Number(data.get('budget'));await plan();});};
      if(set)cells(content.querySelector('[data-cells]')!,rows.filter(r=>set.selected.includes(r.obligation.id)));
    } else if(tab==='coverage') {
      content.innerHTML=summary()+`<label>Show <select data-filter>${['all','missing','draft','passed','failed','blocked','unsupported','stale'].map(s=>`<option ${filter===s?'selected':''}>${s}</option>`).join('')}</select></label><div data-cells></div><details><summary>Exclusions and omitted IDs</summary><ul>${set.exclusions.map(e=>`<li>${esc(e.items.join(' + '))}: ${esc(e.reason)}</li>`).join('')}</ul><p>${esc(set.omitted.join(', ')||'No omitted obligations.')}</p></details>`;
      cells(content.querySelector('[data-cells]')!,rows.filter(r=>filter==='all'||r.state===filter));
      content.querySelector('select')!.onchange=e=>{filter=(e.target as HTMLSelectElement).value;render();};
    } else if(tab==='review' && review) renderReview(content);
    else if(tab==='sequences') {
      content.innerHTML=`<p>Scan explicitly selected local replays. At most 200 games and 20,000 actions. The worker can be cancelled. Signals describe observations, not causes.</p><label>Legal-action change threshold <input data-threshold type="number" min="1" max="10000" value="12"></label>${btn('scan-study','Scan this study')}${btn('nominate','Nominate this study boundary')}${btn('local-runs','Find validated local runs')}<div data-runs>${available.map((r,i)=>`<p>${esc(r.id)} · ${r.validation.games} games · ${esc(r.validation.state)} <button data-run="${i}">Preview scan</button></p>`).join('')}</div><p>${candidates.length} candidates · ${doc.scans?.length??0} saved scan manifests. Full histories stay attached. Page ${page+1}.</p>${candidates.slice(page*24,(page+1)*24).map((c,i)=>`<p><button data-candidate="${page*24+i}">${esc(c.study.title)} · action ${c.provenance.action}</button> ${esc(c.signals.join('; '))}</p>`).join('')}${page?btn('previous','Previous page'):''}${(page+1)*24<candidates.length?btn('next','Next page'):''}`;
      content.querySelectorAll<HTMLButtonElement>('[data-run]').forEach(b=>b.onclick=()=>void work(async()=>{
        const batch=await runs.replays(available[Number(b.dataset.run)].id),threshold=Number(content.querySelector<HTMLInputElement>('[data-threshold]')!.value);
        const actions=batch.games.reduce((n,g)=>n+g.study.actions.length+g.study.prefix.length,0);
        content.innerHTML=`<p>${batch.games.length} games · ${actions} actions · threshold ${threshold}. Source ${esc(batch.source)}. All selected games replay legally before candidates appear.</p>${btn('start-scan','Start scan')}`;
        content.querySelector('button')!.onclick=()=>void work(async()=>{candidates=await client.request<Candidate[]>({type:'scan',batch,threshold});await recordScan(threshold,batch);page=0;render();});
      }));
      content.querySelectorAll<HTMLButtonElement>('[data-candidate]').forEach(b=>b.onclick=()=>void work(async()=>{const c=candidates[Number(b.dataset.candidate)];review={study:c.study,checks:[],provenance:c.provenance,obligation:null,signals:c.signals};tab='review';render();}));
    } else if(tab==='saved') {
      content.innerHTML=`<p>${doc.entries.length} reviewed regressions. Original studies are unchanged.</p>${doc.entries.map((e,i)=>`<article><h3>${esc(e.test.study.title)}</h3><p>${esc(checkStudy(e.test,parent.engine).status)} · ${esc(e.basis)}</p><p>${esc(e.provenance.kind)} · action ${e.provenance.action} · ${e.provenance.actor?'Black':'White'} acts before the action.</p><p>Raw input hash: ${esc(e.provenance.inputHash)}. Original raw files are not in this export.</p><button data-open-regression="${i}">Open saved regression</button></article>`).join('')}`;
      content.querySelectorAll<HTMLButtonElement>('[data-open-regression]').forEach(b=>b.onclick=()=>void work(()=>open(doc.entries[Number(b.dataset.openRegression)].test)));
    }
    body.querySelector<HTMLInputElement>('[data-discovery-import]')!.onchange=e=>void work(async()=>{
      const file=(e.target as HTMLInputElement).files?.[0];if(!file)return;if(file.size>8*1024*1024)throw new Error('Discovery file exceeds 8 MiB.');
      await saveDiscoveryDocument(JSON.parse(await file.text()));await plan();message('Discovery imported. Raw source files are not reverified by import.');
    });
  }
  function cells(host:Element, list:Rows):void {
    const cards=list.map((r,i)=>`<article><h3>${esc(r.obligation.items.join(' + '))}</h3><p>${esc(r.obligation.order.join(' → '))} · ${r.obligation.ownership} sides · <strong>${r.state}</strong></p><p>${esc(r.reason)}</p>${r.state==='unsupported'?'':`<button data-review="${i}">Review proposal</button>`}</article>`);
    const supported=cards.filter((_,i)=>list[i].state!=='unsupported').join(''), unsupported=cards.filter((_,i)=>list[i].state==='unsupported').join('');
    host.innerHTML=supported+(unsupported?`<details><summary>${list.filter(r=>r.state==='unsupported').length} unsupported cells</summary>${unsupported}</details>`:'')||'<p>No cells match this filter.</p>';
    host.querySelectorAll<HTMLButtonElement>('[data-review]').forEach(b=>b.onclick=()=>void work(async()=>{
      const cell=list[Number(b.dataset.review)].obligation,fixture=await client.request<StudyTest>({type:'scenario',study:parent,obligation:cell});
      const snapshot=await studyClient.request({type:'inspect',document:{...fixture.study,actions:fixture.study.actions.slice(0,-1)}});
      if(!alive)return;
      review={study:fixture.study,checks:fixture.checks,provenance:{kind:'scenario',inputHash:await digest(fixture),source:fixture.study.engine,run:null,part:null,game:null,pair:null,spec:null,settings:{template:cell.template},action:fixture.study.actions.length,actor:snapshot.snapshot.position.turn},obligation:cell.id,signals:[cell.reason]};
      if(!doc.drafts.some(d=>d.obligation===cell.id))doc=await saveDiscoveryDocument({...doc,drafts:[...doc.drafts,{obligation:cell.id,test:fixture,testHash:await digest(fixture)}]});
      tab='review';render();
    }));
  }
  function renderReview(host:HTMLElement):void {
    const current=review!;
    host.innerHTML=`<h3>Review sequence</h3><p>${esc(current.signals.join('; '))}</p><p>All ${current.study.prefix.length} prefix actions and ${current.study.actions.length} local actions remain attached.</p><div class="discovery-board" style="width:min(100%,320px);aspect-ratio:1"></div><p data-board-state></p><label>Preview action boundary <input data-boundary type="number" min="0" max="${current.study.actions.length}" value="${current.study.actions.length}"></label><p>${esc(current.study.actions.join(' → '))}</p><details><summary>Rules, source and provenance</summary><pre>${esc(JSON.stringify({rules:current.study.rules,provenance:current.provenance},null,2))}</pre></details><h4>Required behavior</h4><p>Observed behavior is not an expected result. Choose checks and state why they are required.</p><div data-facts></div><form data-add-fact><label>Kind <select name="kind"><option>state</option><option>legal</option><option>piece</option><option>status</option></select></label><label>Field, LAN action or square number <input name="target" value="turn" required></label><label>Expected value (JSON) <input name="expected" placeholder="0, false, or &quot;playing&quot;" required></label><label>After action <input name="after" type="number" min="0" max="${current.study.actions.length}" value="${current.study.actions.length}" required></label><button>Add expected fact</button></form><label>Expectation basis <textarea data-basis maxlength="2000" placeholder="Rule reference or designer decision and reason" required></textarea></label><label><input type="checkbox" data-confirm> I confirm these expected checks independently of the observation.</label>${btn('save-regression','Save regression')}`;
    const preview=async(n:number)=> {
      if(!Number.isInteger(n)||n<0||n>current.study.actions.length)throw new Error('Choose an action boundary in this replay.');
      const response=await studyClient.request({type:'inspect',document:{...current.study,actions:current.study.actions.slice(0,n)}});
      if(!alive||review!==current||tab!=='review')return;
      const el=host.querySelector<HTMLElement>('.discovery-board')!;
      if(!board){board=new PaintedView(el,{floor:null,webInk:true});board.setPace('off');}
      withRules(current.study.rules,()=>board!.sync(positionOf(response.snapshot.position)));
      host.querySelector('[data-board-state]')!.textContent=`After action ${n}: ${response.snapshot.position.turn?'Black':'White'} to act · ${response.snapshot.status}`;
    };
    void preview(current.study.actions.length).catch(e=>message(String(e)));
    host.querySelector<HTMLInputElement>('[data-boundary]')!.onchange=e=>void work(()=>preview(Number((e.target as HTMLInputElement).value)));
    const factHTML=(f:Fact,i:number)=>`<label><input type="checkbox" data-fact="${i}" checked>${esc(f.label)} · after ${f.after} · expected <input data-expected="${i}" value="${esc(JSON.stringify(f.expected))}"></label>`;
    host.querySelector('[data-facts]')!.innerHTML=current.checks.map(factHTML).join('')||'<p data-empty-facts>No expected facts selected yet.</p>';

    host.querySelector<HTMLFormElement>('[data-add-fact]')!.onsubmit=e=> {e.preventDefault();void work(async()=>{
      const data=new FormData(e.currentTarget as HTMLFormElement),kind=String(data.get('kind')),target=String(data.get('target')),after=Number(data.get('after')),expected=JSON.parse(String(data.get('expected')));
      const base={id:`review-${current.checks.length}`,label:`${kind} ${target}`,after,expected};
      const fact={...base,kind,...(kind==='state'?{field:target}:kind==='piece'?{square:Number(target)}:kind==='legal'?{lan:target}:{})} as Fact;
      const test={schema:'kingdown-test/1',study:current.study,checks:[fact],coverage:[{id:'review',items:['review'],state:'tested',reason:'Review',checks:[fact.id]}]};
      const result=await studyClient.request({type:'check',document:test});
      if(result.report?.status==='invalid')throw new Error(result.report.error);
      current.checks.push(fact);host.querySelector('[data-empty-facts]')?.remove();
      host.querySelector('[data-facts]')!.insertAdjacentHTML('beforeend',factHTML(fact,current.checks.length-1));
    });};
    const save=host.querySelector<HTMLButtonElement>('[data-discovery="save-regression"]')!;save.disabled=true;
    const enable=()=>{save.disabled=!host.querySelector<HTMLInputElement>('[data-confirm]')!.checked||!host.querySelector<HTMLTextAreaElement>('[data-basis]')!.value.trim();};
    host.querySelector('[data-confirm]')!.addEventListener('change',enable);host.querySelector('[data-basis]')!.addEventListener('input',enable);
    save.onclick=()=>void work(async()=>{
      const checks=Array.from(host.querySelectorAll<HTMLInputElement>('[data-fact]:checked')).map(el=>{const i=Number(el.dataset.fact);return {...current.checks[i],expected:JSON.parse(host.querySelector<HTMLInputElement>(`[data-expected="${i}"]`)!.value)} as Fact;});
      const next=await client.request<DiscoveryDocument>({type:'promote',document:doc,study:current.study,checks,provenance:current.provenance,basis:host.querySelector<HTMLTextAreaElement>('[data-basis]')!.value,confirmed:host.querySelector<HTMLInputElement>('[data-confirm]')!.checked,obligation:current.obligation});
      if(!alive)return;doc=await saveDiscoveryDocument(next);tab='saved';await plan();message('Regression and provenance saved together. The result may pass or fail.');
    });
  }
  const click=(event:Event)=> {
    const action=(event.target as Element).closest<HTMLElement>('[data-discovery]')?.dataset.discovery;if(!action)return;
    if(action==='cancel'){client.cancel();runs.close();runs=createRunClient();message('Discovery cancelled.');return;}
    if(busy||action==='save-regression'||action==='start-scan')return;
    if(['proposals','coverage','sequences','saved'].includes(action)){tab=action;void work(plan);}
    else if(action==='export')download();
    else if(action==='next'||action==='previous'){page+=action==='next'?1:-1;render();}
    else if(action==='scan-study')void work(async()=>{const threshold=Number(body.querySelector<HTMLInputElement>('[data-threshold]')!.value);candidates=await client.request<Candidate[]>({type:'study-scan',study:parent,checks:testOf(input)?.checks??[],threshold});await recordScan(threshold);page=0;render();});
    else if(action==='nominate')void work(async()=>{const snapshot=await studyClient.request({type:'inspect',document:{...parent,actions:parent.actions.slice(0,-1)}});review={study:parent,checks:[],provenance:{kind:'study-replay',inputHash:await digest(parent),source:parent.engine,run:null,part:null,game:null,pair:null,spec:null,settings:{nomination:'designer'},action:parent.actions.length,actor:snapshot.snapshot.position.turn},obligation:null,signals:['Designer nomination; no detector claim']};tab='review';render();});
    else if(action==='local-runs')void work(async()=>{await runs.connect();available=(await runs.list(parent.id)).filter(r=>['passed','incomplete'].includes(r.validation.state));render();message(available.length?'Select a run to preview its scan cost.':'No validated local runs for this study.');});
  };
  body.addEventListener('click',click);render();void work(plan);
  return ()=>{alive=false;client.cancel();runs.close();body.removeEventListener('click',click);};
}
