import { spawnSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';

it('adopts only exact verified replacements and retains unrelated decisions through replay and concurrent adoption', async () => {
  const folder = await mkdtemp(join(tmpdir(), 'kingdown-animation-replacement-'));
  const script = fileURLToPath(new URL('./replace_animation_selections.py', import.meta.url));
  try {
    const result = spawnSync('python3', ['-B', '-c', `
import copy,json,subprocess,sys
from pathlib import Path
from PIL import Image,ImageDraw
sys.path.insert(0,str(Path(sys.argv[1]).parent))
import replace_animation_selections as m
from consolidate_animation_banks import consolidate
from publish_animation_reviews import publish
root=Path(sys.argv[2]);worker=root/'worker';worker.mkdir();out=root/'store';catalog_path=out/'manifest.json'
def png(name,x=8,clipped=False):
 path=worker/(name+'.png');image=Image.new('RGBA',(64,64))
 ImageDraw.Draw(image).rectangle((0 if clipped else x,12,x+12,40),fill=(220,80,20,255));image.save(path);return path
first=png('first');second=png('second',32);clipped=png('clipped',clipped=True)
def frame(path,time): return {'url':str(path),'sha256':m.digest(path.read_bytes()),'timeMs':time}
def row(name,status='ready',replacement=False):
 identity={'character':'rook' if name=='a' else 'guard','army':'white','kind':'turn','action':None,'direction':'east','from':'NE','to':'E'}
 bank={**identity,'id':name+'-candidate' if replacement else 'shared-turn' if name in ('a','b') else name,'status':'ready','canvasSize':[64,64],'durationMs':400,'footPivot':[32,60],
       'frames':[frame(first,0),frame(second,400)],'reverseFrames':[str(second),str(first)],'tracks':[{'frames':[frame(second,100)]}]}
 if replacement:
  if name=='a': bank.pop('from');bank.pop('to')
  else: bank['action']='NE-E'
 path=worker/((name+'-candidate' if replacement else name)+'.json');path.write_bytes(m.encoded(bank))
 return {**identity,'status':status,'manifestPath':str(path),'manifestSha256':m.digest(path.read_bytes()),'defects':[]}
base_rows=[row('a'),row('b'),row('unrelated','awaiting-human-playback-review')]
base=root/'base.json';base.write_bytes(m.encoded({'entries':base_rows}));consolidate([base],out)
proof=worker/'proof.json';proof.write_bytes(m.encoded({'observation':'Fixture endpoints and playback checked'}))
before=json.loads(catalog_path.read_bytes());unrelated=before['entries'][2]
review=root/'review.json';review.write_bytes(m.encoded({'reviewType':'agent-visual','reviewer':'Fixture reviewer','entries':[{'bankSha256':unrelated['sha256'],'status':'ready','observations':['Fixture contour checked'],'evidencePaths':[str(proof)]}]}))
publish(catalog_path,review);before_raw=catalog_path.read_bytes();before=json.loads(before_raw)
frozen_before={p.relative_to(out):p.read_bytes() for p in out.rglob('*') if p.is_file() and p.name not in ('manifest.json','.catalog.lock')}
rows=[]
for index,name in enumerate(('a','b')):
 item=row(name,replacement=True);item.update(expectedOldId=before['entries'][index]['id'],expectedOldBankSha256=before['entries'][index]['sha256'],evidence=[{'path':'worker/proof.json','sha256':m.digest(proof.read_bytes())}]);rows.append(item)
report=root/'verified.json';valid={'entries':rows}
def write(value): report.write_bytes(m.encoded(value))
write(valid)
sources={p:p.read_bytes() for p in worker.iterdir() if p.is_file()}
def reject(needle):
 unchanged=catalog_path.read_bytes()
 try: m.replace(catalog_path,[report]);raise AssertionError('invalid replacement accepted')
 except ValueError as error: assert needle in str(error),str(error)
 assert catalog_path.read_bytes()==unchanged,'rejected replacement changed catalog'
def bad_row(field,value,needle):
 bad=copy.deepcopy(valid);bad['entries'][0][field]=value;write(bad);reject(needle);write(valid)
bad_row('expectedOldBankSha256','0'*64,'old bank hash is stale')
bad_row('expectedOldBankSha256',None,'requires expectedOldId')
bad_row('expectedOldId','missing','not uniquely selected')
for field in m.IDENTITY_FIELDS: bad_row(field,'wrong','identity differs')
bad_row('status','draft','ready source and audit status')
bad_row('evidence',[],'hashed verification evidence')
bad_row('evidence',[{'path':'worker/proof.json','sha256':'0'*64}],'evidence hash differs')
bad_row('defects',['known clipped arm'],'known defects')
bad=copy.deepcopy(valid);bad['entries'].append(copy.deepcopy(rows[0]));write(bad);reject('distinct old targets');write(valid)
duplicated=copy.deepcopy(before);duplicated['entries'].append(copy.deepcopy(before['entries'][0]));catalog_path.write_bytes(m.encoded(duplicated));reject('not uniquely selected');catalog_path.write_bytes(before_raw)
source=Path(rows[0]['manifestPath']);source_raw=source.read_bytes()
for key in m.IDENTITY_FIELDS:
 bank=json.loads(source_raw);bank[key]='wrong';source.write_bytes(m.encoded(bank));changed=copy.deepcopy(valid);changed['entries'][0]['manifestSha256']=m.digest(source.read_bytes());write(changed);reject('Source identity differs from audited selection: '+key)
source.write_bytes(source_raw);write(valid)
source.write_bytes(source_raw+b' ');reject('manifest hash differs');source.write_bytes(source_raw)
first_raw=first.read_bytes();first.write_bytes(second.read_bytes());reject('frame hash differs');first.write_bytes(first_raw)
for key,value,needle in [('status','draft','ready source and audit status'),('status','agent review package; no human approval','conflicting unrecognized'),('knownDefects',['unresolved seam'],'known defects'),('defects',['unresolved seam'],'known defects')]:
 bank=json.loads(source_raw);bank[key]=value;source.write_bytes(m.encoded(bank));changed=copy.deepcopy(valid);changed['entries'][0]['manifestSha256']=m.digest(source.read_bytes());write(changed);reject(needle)
source.write_bytes(source_raw);write(valid)
bank=json.loads(source_raw);bank['frames'][0]=frame(clipped,0);bank['reverseFrames']=[frame(second,0),frame(first,400)];source.write_bytes(m.encoded(bank));changed=copy.deepcopy(valid);changed['entries'][0]['manifestSha256']=m.digest(source.read_bytes());write(changed);reject('ready source and audit status');source.write_bytes(source_raw);write(valid)
result=m.replace(catalog_path,[report]);assert result['changed']==2 and result['entries']==3
after_raw=catalog_path.read_bytes();after=json.loads(after_raw)
assert [e['id'] for e in after['entries']]==['shared-turn','shared-turn','unrelated']
assert m.encoded(after['entries'][2])==m.encoded(before['entries'][2]),'unrelated review changed'
assert after['reports'][:len(before['reports'])]==before['reports']
assert (out/'catalogs'/(m.digest(before_raw)+'.json')).read_bytes()==before_raw
assert (out/result['catalog']).read_bytes()==after_raw
for index,entry in enumerate(after['entries'][:2]):
 bank=json.loads((out/entry['manifest']).read_bytes());original=json.loads(Path(rows[index]['manifestPath']).read_bytes())
 assert bank['id']==entry['replacement']['candidateId']==original['id'] and bank['id']!=entry['id']
 assert entry['sourceManifestSha256']==rows[index]['manifestSha256']
 assert (out/entry['sourceManifest']).read_bytes()==Path(rows[index]['manifestPath']).read_bytes()
 assert bank['durationMs']==original['durationMs'] and bank['footPivot']==original['footPivot']
 assert bank['status']=='ready' and entry['from']=='NE' and entry['to']=='E'
 if index==0: assert 'from' not in bank and 'to' not in bank
 else: assert bank['action']=='NE-E' and entry['action'] is None
 assert (out/entry['replacement']['evidence'][0]['url']).read_bytes()==proof.read_bytes()
for path,raw in frozen_before.items(): assert (out/path).read_bytes()==raw,'prior bank or review bytes changed'
for path,raw in sources.items(): assert path.read_bytes()==raw,'source pixels or manifest changed'
assert m.replace(catalog_path,[report])['changed']==0 and catalog_path.read_bytes()==after_raw
entry=after['entries'][0];bank=json.loads((out/entry['manifest']).read_bytes())
files=[entry['manifest'],entry['sourceManifest'],entry['auditReport'],entry['replacement']['evidence'][0]['url'],bank['frames'][0]['url'][3:]]
for relative in files:
 path=out/relative;raw=path.read_bytes();path.write_bytes(b'corrupt')
 reject('Selected bank hash differs' if relative==entry['manifest'] else 'selected replacement bytes differ')
 path.write_bytes(raw)
asset=out/files[-1];raw=asset.read_bytes();asset.unlink();reject('selected replacement bytes differ');assert not asset.exists();asset.write_bytes(raw)
first.write_bytes(second.read_bytes());reject('frame hash differs');first.write_bytes(first_raw)
assert m.replace(catalog_path,[report])['changed']==0
# Each process reads the current catalog under the shared lock; neither loses the other row.
catalog_path.write_bytes(before_raw);reports=[]
for index,item in enumerate(rows):
 path=root/('part-'+str(index)+'.json');path.write_bytes(m.encoded({'entries':[item]}));reports.append(path)
jobs=[subprocess.Popen([sys.executable,'-B',sys.argv[1],'--catalog',str(catalog_path),'--inputs',str(path)],stdout=subprocess.PIPE,stderr=subprocess.PIPE) for path in reports]
for job in jobs:
 output,error=job.communicate(timeout=15);assert job.returncode==0,error;assert json.loads(output)['changed']==1
final=json.loads(catalog_path.read_bytes());assert len(final['entries'])==3
assert [e['replacement']['candidateId'] for e in final['entries'][:2]]==['a-candidate','b-candidate']
assert final['entries'][2]==before['entries'][2]
assert len(final['reports'])==len(before['reports'])+2
for path,raw in sources.items(): assert path.read_bytes()==raw
print('OK: exact replacement gates; ready/evidence/alpha checks; retained rows, decisions and source bytes; replay corruption and concurrent adoption')
`, script, folder], { encoding: 'utf8', timeout: 45_000 });
    expect(result.error, result.stderr).toBeUndefined();
    expect(result.status, result.stdout + result.stderr).toBe(0);
    expect(result.stdout).toContain('OK: exact replacement gates');
  } finally { await rm(folder, { recursive: true, force: true }); }
}, 50_000);
