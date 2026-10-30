import { spawnSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';

it('publishes an exact visual decision without changing source frames or accepting stale review', async () => {
  const folder = await mkdtemp(join(tmpdir(), 'kingdown-animation-review-'));
  const script = fileURLToPath(new URL('./publish_animation_reviews.py', import.meta.url));
  try {
    const result = spawnSync('python3', ['-B', '-c', `
import copy,importlib.util,json,subprocess,sys
from pathlib import Path
sys.path.insert(0,str(Path(sys.argv[1]).parent))
spec=importlib.util.spec_from_file_location('review',sys.argv[1]);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
root=Path(sys.argv[2]);proof=root/'contact.txt';proof.write_text('Visual observation fixture')
url,sha=m.freeze(root,'assets',b'unchanged frozen frame','.png')
source_url,source_sha=m.freeze(root,'sources/manifests',b'original source','.json')
audit_url,audit_sha=m.freeze(root,'sources/reports',b'original audit','.json')
bank={'status':'awaiting-human-playback-review','durationMs':120,'footPivot':[20,40],'frames':[{'url':'../'+url,'sha256':sha,'timeMs':0}],'reverseFrames':['../'+url],'_consolidation':{'sourceManifest':{'url':'../'+source_url,'sha256':source_sha},'auditReport':{'url':'../'+audit_url,'sha256':audit_sha},'alphaFailures':[]}}
bank_url,bank_sha=m.freeze(root,'banks',m.encoded(bank),'.json')
catalog=root/'manifest.json';catalog.write_bytes(m.encoded({'entries':[{'manifest':bank_url,'sha256':bank_sha,'status':bank['status'],'sourceManifest':source_url,'sourceManifestSha256':source_sha,'auditReport':audit_url,'defects':[]}]}))
report={'reviewer':'Visual reviewer','reviewType':'agent-visual','entries':[{'bankSha256':bank_sha,'status':'ready','observations':['Stable contour and pivot'],'evidencePaths':[str(proof)]}]}
review=root/'review.json';review.write_bytes(m.encoded(report));before=catalog.read_bytes()
out=m.publish(catalog,review);assert out['changed']==1
selected=json.loads(catalog.read_bytes())['entries'][0];new=json.loads((root/selected['manifest']).read_bytes())
assert new['frames']==bank['frames'] and new['reverseFrames']==bank['reverseFrames'] and new['footPivot']==bank['footPivot'] and new['durationMs']==120
assert (root/bank_url).read_bytes()==m.encoded(bank) and (root/url).read_bytes()==b'unchanged frozen frame'
assert selected['status']=='ready' and selected['sourceManifest']==source_url
assert new['currentVisualReview']['reviewType']=='agent-visual'
assert m.publish(catalog,review)['changed']==0
def reject(needle):
 old=catalog.read_bytes()
 try:m.publish(catalog,review);raise AssertionError('invalid review accepted')
 except ValueError as error:assert needle in str(error),str(error)
 assert catalog.read_bytes()==old
(root/url).write_bytes(b'corrupted');reject('frame hash');(root/url).write_bytes(b'unchanged frozen frame')
(root/source_url).write_bytes(b'corrupted');reject('provenance');(root/source_url).write_bytes(b'original source')
good_report=copy.deepcopy(report)
report['entries'][0]['observations']=['Changed decision'];review.write_bytes(m.encoded(report));reject('selected pending bank')
catalog.write_bytes(before);report['entries'][0]['evidencePaths']=[];review.write_bytes(m.encoded(report));reject('visual evidence')
report['entries'][0]['evidencePaths']=[str(proof)];review.write_bytes(m.encoded(report));(root/url).write_bytes(b'corrupted');reject('frame hash')
(root/url).write_bytes(b'unchanged frozen frame');obj=json.loads(before);obj['entries'][0]['status']='draft';catalog.write_bytes(m.encoded(obj));reject('selected pending bank')
obj['entries'][0]['status']='awaiting-human-playback-review';obj['entries'][0]['defects']=['known clipped arm'];catalog.write_bytes(m.encoded(obj));reject('known defect')
report['entries'][0]['status']='needs-repair';review.write_bytes(m.encoded(report));m.publish(catalog,review)
assert json.loads(catalog.read_bytes())['entries'][0]['status']=='needs-repair'
draft=copy.deepcopy(bank);draft['status']='draft';draft_url,draft_sha=m.freeze(root,'banks',m.encoded(draft),'.json')
obj=json.loads(before);obj['entries'][0].update(manifest=draft_url,sha256=draft_sha);catalog.write_bytes(m.encoded(obj));report=copy.deepcopy(good_report);report['entries'][0]['bankSha256']=draft_sha;review.write_bytes(m.encoded(report));reject('selected pending bank')
# Two simultaneous publications retain both decisions, never a last-writer status loss.
other=copy.deepcopy(bank);other['id']='other';other_url,other_sha=m.freeze(root,'banks',m.encoded(other),'.json')
obj=json.loads(before);twin=copy.deepcopy(obj['entries'][0]);twin.update(manifest=other_url,sha256=other_sha);obj['entries'].append(twin);catalog.write_bytes(m.encoded(obj))
review.write_bytes(m.encoded(good_report));other_review=root/'other-review.json';other_report=copy.deepcopy(good_report);other_report['entries'][0]['bankSha256']=other_sha;other_review.write_bytes(m.encoded(other_report))
jobs=[subprocess.Popen([sys.executable,'-B',sys.argv[1],'--catalog',str(catalog),'--review',str(r)],stdout=subprocess.PIPE,stderr=subprocess.PIPE) for r in [review,other_review]]
for job in jobs:
 output,error=job.communicate(timeout=15);assert job.returncode==0,error
assert [e['status'] for e in json.loads(catalog.read_bytes())['entries']]==['ready','ready']
print('OK: immutable review publication; concurrent and repeat-safe; stale, missing-evidence, corrupt-frame/provenance, draft and known-defect gates')
`, script, folder], { encoding: 'utf8', timeout: 30_000 });
    expect(result.error, result.stderr).toBeUndefined();
    expect(result.status, result.stdout + result.stderr).toBe(0);
    expect(result.stdout).toContain('OK: immutable review publication');
  } finally { await rm(folder, { recursive: true, force: true }); }
});
