"""Offline transport tests. No SSH, Kaggle, cloud download or game calls."""
import gzip, hashlib, importlib.util, io, json, shutil, tarfile, tempfile
from pathlib import Path
from types import SimpleNamespace as NS
from unittest.mock import patch

def load(name):
    spec=importlib.util.spec_from_file_location(name,Path(__file__).parent/(name+'.py'));module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);return module
backup=load('backup-proof');supervisor=load('supervisor');kaggle=load('kaggle')
def fails(fn):
    try:fn()
    except Exception:return
    raise AssertionError('negative control passed')

class API:
    def __init__(self,n):self.n=n
    def kernels_list(self,**kw):return [NS(ref=str(i)) for i in range(self.n)]
    def kernels_status(self,ref):return NS(status=NS(name='RUNNING'))
assert kaggle.audit(API(4))==4
fails(lambda:kaggle.execute(NS(config_values={'username':'test'},kernels_list=API(5).kernels_list,kernels_status=API(5).kernels_status),{'action':'preflight','name':'fake'}))
fails(lambda:backup.fresh_receipt([],10))
fails(lambda:backup.fresh_receipt([{'verified_epoch':9}],10))
assert backup.fresh_receipt([{'verified_epoch':10}],10)['verified_epoch']==10

with tempfile.TemporaryDirectory() as tmp:
    root=Path(tmp);(root/'results').mkdir();(root/'work').mkdir();state=root/'state';state.mkdir();cloud=root/'cloud';cloud.mkdir()
    backup.ROOT=root;backup.STATE=state
    lock=root/'.maintenance.lock';lock.mkdir()
    with patch.object(backup.subprocess,'run',return_value=NS(stdout=str(root/'results').encode())):
        fails(lambda:backup.main(dict(mainRoot=str(root),directory=str(root/'results'),runId='test-lock')))
    assert lock.is_dir() and not (state/'study-backups').exists();lock.rmdir()
    payload=b'finished games\n';path='study-runs/run-one/games.jsonl';local=root/'results'/path;local.parent.mkdir(parents=True);local.write_bytes(payload)
    sha=hashlib.sha256(payload).hexdigest()
    def fixture(codec):
        obj=cloud/'object';member='payload'
        if codec=='plain':obj.write_bytes(payload)
        elif codec=='gzip':obj.write_bytes(gzip.compress(payload))
        else:
            with tarfile.open(obj,'w:gz') as tar:
                info=tarfile.TarInfo(member);info.size=len(payload);tar.addfile(info,io.BytesIO(payload))
        row=dict(path=path,sha256=sha,bytes=len(payload),mtime_ns=1,object='object',codec=codec,member=member)
        tree=[row];meta=dict(md5=hashlib.md5(obj.read_bytes()).hexdigest(),bytes=obj.stat().st_size)
        manifest=dict(schema='king-down-results-v1',objects_root='drive:King Down/results-objects',files=tree,objects={'object':meta})
        raw=json.dumps(manifest).encode();(cloud/'manifest.json').write_bytes(raw)
        fields=('path','sha256','bytes','mtime_ns')
        tree_hash=hashlib.sha256(json.dumps({'files':[{k:row[k] for k in fields}],'provenance_sha256':None},sort_keys=True).encode()).hexdigest()
        receipt=dict(remote='drive:King Down/results-backups/snapshot',snapshot_files={'manifest.json':dict(md5=hashlib.md5(raw).hexdigest(),bytes=len(raw))},manifest_md5=hashlib.md5(raw).hexdigest(),provenance_sha256=None,tree_hash=tree_hash,files=1,bytes=len(payload))
        (state/'receipt-at-completion.json').write_text(json.dumps(receipt));(state/'required-backup-files.json').write_text(json.dumps([dict(path=path,sha256=sha,bytes=len(payload))]))
    def fake_cloud(remote,dest):shutil.copyfile(cloud/remote.split('/')[-1],dest)
    with patch.object(backup,'cloud_file',fake_cloud):
        for codec in ('plain','gzip','tar-gzip'):
            fixture(codec);backup.verify();assert json.loads((state/'verified-final.json').read_text())['pass']
        fixture('gzip');(cloud/'object').write_bytes(b'corrupt');fails(backup.verify)
        original=payload;payload=b'forged games!\n';fixture('gzip');fails(backup.verify);payload=original
        fixture('plain');(cloud/'object').unlink();fails(backup.verify)
        fixture('plain');local.write_bytes(b'changed');fails(backup.verify);local.write_bytes(payload)
        fixture('plain');(cloud/'manifest.json').write_text('{}');fails(backup.verify)
    evil=root/'evil.tar.gz'
    with tarfile.open(evil,'w:gz') as tar:
        info=tarfile.TarInfo('../escape');info.size=1;tar.addfile(info,io.BytesIO(b'x'))
    fails(lambda:supervisor.unpack(evil,root))
    # A setup failure still writes an independent terminal receipt.
    def bad_checksum(url,target,*args):target.write_bytes(b'bad checksum')
    with patch.object(supervisor,'download',bad_checksum):fails(lambda:supervisor.ensure_runtime(root/'bad-node','26.0.0',supervisor.time.monotonic()+1))
    runroot=root/'run';runroot.mkdir()
    with patch.object(supervisor,'download',side_effect=TimeoutError()):
        assert supervisor.run(dict(directory=str(runroot),limitSeconds=1,nodeVersion='26.0.0',partId='part-one'))==1
    receipt=json.loads((runroot/'out/supervisor.json').read_text());assert receipt['state']=='failed' and receipt['timeout']
    # Timeout kills only the supervisor's owned group and retains prior output.
    second=root/'run-two';second.mkdir();(second/'out').mkdir();(second/'out'/'games.jsonl').write_bytes(payload)
    killed=[]
    class Child:
        pid=123456
        stdout=io.BytesIO()
        def poll(self):return None
        def wait(self,**kw):return 0
    def download_fake(url,target,*args):
        if target.name=='SHASUMS256.txt':target.write_text(hashlib.sha256(b'archive').hexdigest()+'  node-v26.0.0-darwin-arm64.tar.gz\n')
        else:target.write_bytes(b'archive')
    ticks=iter([0,.1,.2,2,3])
    with patch.object(supervisor,'download',download_fake), patch.object(supervisor,'unpack'), patch.object(supervisor.platform,'system',return_value='Darwin'), patch.object(supervisor.platform,'machine',return_value='arm64'), patch.object(supervisor.time,'monotonic',side_effect=lambda:next(ticks)), patch.object(supervisor.subprocess,'Popen',return_value=Child()), patch.object(supervisor.os,'killpg',side_effect=lambda pid,sig:killed.append(pid)), patch('selectors.DefaultSelector',return_value=NS(register=lambda *args:None,get_map=lambda:True)):
        assert supervisor.run(dict(directory=str(second),limitSeconds=1,nodeVersion='26.0.0',partId='part-two'))==1
    assert killed and set(killed)=={123456}
    assert (second/'out'/'games.jsonl').read_bytes()==payload
    assert json.loads((second/'out'/'supervisor.json').read_text())['timeout']
print('PASS: capacity, archive boundary, supervisor receipt, stale receipts, three codecs, corrupt/missing/mismatched bytes')
