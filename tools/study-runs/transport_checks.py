"""Offline transport tests. No SSH, Kaggle, cloud download or game calls."""
import sys
sys.dont_write_bytecode=True
import gzip, hashlib, importlib.util, io, json, os, shutil, subprocess, tarfile, tempfile
from pathlib import Path
from types import SimpleNamespace as NS
from unittest.mock import patch

def load(name):
    spec=importlib.util.spec_from_file_location(name,Path(__file__).parent/(name+'.py'));module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);return module
backup=load('backup-proof');supervisor=load('supervisor');kaggle=load('kaggle-driver')
def fails(fn):
    try:fn()
    except Exception:return
    raise AssertionError('negative control passed')

def run_config(directory,part='part-one'):
    directory.mkdir(exist_ok=True)
    archive=b'archive';(directory/'source.tar.gz').write_bytes(archive)
    source_sha=hashlib.sha256(archive).hexdigest()
    bundle=dict(id='run-one',nodeVersion='26.0.0',parts=[dict(id=part,machine='m1',workers=8)],sourceArchiveSha256=source_sha)
    bundle['hash']=hashlib.sha256(json.dumps(bundle,sort_keys=True,separators=(',',':')).encode()).hexdigest()
    raw=json.dumps(bundle).encode();(directory/'bundle.json').write_bytes(raw)
    return dict(directory=str(directory),limitSeconds=1,nodeVersion='26.0.0',partId=part,machine='m1',workers=8,runId='run-one',bundleHash=bundle['hash'],bundleBytesSha256=hashlib.sha256(raw).hexdigest(),sourceArchiveSha256=source_sha)

class API:
    def __init__(self,n):self.n=n
    def kernels_list(self,**kw):return [NS(ref=str(i)) for i in range(self.n)]
    def kernels_status(self,kernel):return NS(status=NS(name='RUNNING'))
class RateLimit(Exception):
    response=NS(status_code=429,headers={'Retry-After':'60'})
class Limited(API):
    def __init__(self):super().__init__(2);self.calls=0
    def kernels_status(self,kernel):
        self.calls+=1
        if self.calls==1:raise RateLimit()
        return super().kernels_status(kernel)
with patch('time.sleep') as sleep:
    limited=Limited()
    assert kaggle.audit(limited)==2 and limited.calls==3
    assert any(call.args==(60,) for call in sleep.call_args_list)
    assert kaggle.audit(API(4))==4
    fails(lambda:kaggle.execute(NS(config_values={'username':'test'},kernels_list=API(5).kernels_list,kernels_status=API(5).kernels_status),{'action':'preflight','name':'fake'}))
    with patch.object(API,'kernels_status',side_effect=RateLimit()) as blocked:
        fails(lambda:kaggle.audit(API(1)))
        assert blocked.call_count==3
fails(lambda:backup.fresh_receipt([],10))
fails(lambda:backup.fresh_receipt([{'verified_epoch':9}],10))
assert backup.fresh_receipt([{'verified_epoch':10}],10)['verified_epoch']==10

with tempfile.TemporaryDirectory() as tmp:
    root=Path(tmp);(root/'results').mkdir();(root/'work').mkdir();state=root/'state';state.mkdir();cloud=root/'cloud';cloud.mkdir()
    # Run the actual script entry point: its filename must not hide the SDK.
    sdk=root/'sdk'/'kaggle';(sdk/'api').mkdir(parents=True)
    (sdk/'__init__.py').write_text('');(sdk/'api/__init__.py').write_text('')
    (sdk/'api/kaggle_api_extended.py').write_text("class KaggleApi:\n config_values={'username':'test'}\n def authenticate(self): pass\n def kernels_list(self,**kw): return []\n")
    reply=subprocess.run([sys.executable,str(Path(kaggle.__file__))],input=json.dumps({'action':'preflight','name':'fixture'}),text=True,capture_output=True,check=True,timeout=10,env={**os.environ,'PYTHONPATH':str(root/'sdk'),'PYTHONDONTWRITEBYTECODE':'1'})
    assert json.loads(reply.stdout)=={'remoteId':'test/fixture'}
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
        # ExFAT sidecars are snapshot metadata and need the same byte proof.
        fixture('plain')
        receipt=json.loads((state/'receipt-at-completion.json').read_text())
        for name in ('._manifest.json','._sources.json.gz'):
            data=('sidecar '+name).encode();(cloud/name).write_bytes(data)
            receipt['snapshot_files'][name]=dict(md5=hashlib.md5(data).hexdigest(),bytes=len(data))
        (state/'receipt-at-completion.json').write_text(json.dumps(receipt))
        backup.verify()
        for name in ('._manifest.json','._sources.json.gz'):
            saved=(cloud/name).read_bytes();(cloud/name).write_bytes(b'corrupt sidecar')
            fails(backup.verify);(cloud/name).write_bytes(saved)
        for name in ('unknown.json','../manifest.json','nested/._manifest.json','._unknown.json'):
            changed=dict(receipt,snapshot_files=dict(receipt['snapshot_files']))
            changed['snapshot_files'][name]=dict(md5='0'*32,bytes=0)
            (state/'receipt-at-completion.json').write_text(json.dumps(changed));fails(backup.verify)
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
        assert supervisor.run(run_config(runroot))==1
    receipt=json.loads((runroot/'out/supervisor.json').read_text());assert receipt['state']=='failed' and receipt['timeout']
    # A different valid bundle or assignment never reaches setup or workers.
    for n,(key,value) in enumerate([('bundleHash','f'*64),('runId','another-run'),('partId','other-part'),('machine','kaggle'),('workers',4),('nodeVersion','24.0.0'),('bundleBytesSha256','f'*64)]):
        cfg=run_config(root/('wrong-'+str(n)));cfg[key]=value
        with patch.object(supervisor,'ensure_runtime') as setup:
            assert supervisor.run(cfg)==1;setup.assert_not_called()
    cfg=run_config(root/'wrong-archive');(root/'wrong-archive'/'source.tar.gz').write_bytes(b'wrong')
    with patch.object(supervisor,'ensure_runtime') as setup:
        assert supervisor.run(cfg)==1;setup.assert_not_called()
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
        assert supervisor.run(run_config(second,'part-two'))==1
    assert killed and set(killed)=={123456}
    assert (second/'out'/'games.jsonl').read_bytes()==payload
    assert json.loads((second/'out'/'supervisor.json').read_text())['timeout']
print('PASS: capacity, archive boundary, supervisor receipt, stale receipts, three codecs, corrupt/missing/mismatched bytes')
