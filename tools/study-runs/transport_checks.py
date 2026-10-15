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
    empty=NS(id=0,ref='',author='',slug='',current_version_number=0)
    calls=[]
    pages=NS(kernels_list=lambda **kw: [NS(ref='one'),*([empty]*99)] if kw['page']==1 else [empty,NS(ref='two')],kernels_status=lambda kernel:(calls.append(kernel) or NS(status=NS(name='COMPLETE'))))
    assert kaggle.audit(pages)==0 and calls==['one','two']
    pages.kernels_list=lambda **kw:[NS(id=42,ref='',author='',slug='',current_version_number=0)]
    fails(lambda:kaggle.audit(pages))

    # Status 404 is safe only for a verified notebook with no saved version.
    class MissingStatus(Exception):
        response=NS(status_code=404,headers={})
    missing=API(1)
    missing.kernels_status=lambda kernel:(_ for _ in ()).throw(MissingStatus())
    with patch.object(kaggle,'notebook_metadata',create=True) as metadata:
        metadata.return_value=NS(id=42,ref='0',current_version_number=0)
        assert kaggle.audit(missing)==0
        for bad in [None,NS(id=0,ref='0',current_version_number=0),NS(id=42,ref='wrong',current_version_number=0),NS(id=42,ref='0',current_version_number=1)]:
            metadata.return_value=bad
            fails(lambda:kaggle.audit(missing))
        metadata.side_effect=MissingStatus()
        fails(lambda:kaggle.audit(missing))
    class ServerFailure(Exception):
        response=NS(status_code=500,headers={})
    missing.kernels_status=lambda kernel:(_ for _ in ()).throw(ServerFailure())
    fails(lambda:kaggle.audit(missing))

    fails(lambda:kaggle.execute(NS(config_values={'username':'test'},kernels_list=API(5).kernels_list,kernels_status=API(5).kernels_status),{'action':'preflight','name':'fake'}))
    with patch.object(API,'kernels_status',side_effect=RateLimit()) as blocked:
        fails(lambda:kaggle.audit(API(1)))
        assert blocked.call_count==3
# A large account must fit the audit bound without fixed per-request delays.
clock=[0.0]
class LargeAccount(API):
    def kernels_list(self,**kw):
        clock[0]+=1
        start=(kw['page']-1)*100
        return [NS(ref=str(i)) for i in range(start,min(start+100,357))]
    def kernels_status(self,kernel):
        clock[0]+=1
        return NS(status=NS(name='COMPLETE'))
with patch('time.monotonic',side_effect=lambda:clock[0]), patch('time.sleep',side_effect=lambda n:clock.__setitem__(0,clock[0]+n)):
    assert kaggle.audit(LargeAccount(357))==0
    assert clock[0]<900

# The dataset loader verifies every mounted byte before executable payload is staged.
loader=load('kaggle-loader')
with tempfile.TemporaryDirectory() as temp:
    root=Path(temp); mount=root/'input'/'frozen-run';mount.mkdir(parents=True)
    blobs={'source.bin':b'archive','bundle.bin':b'{}','supervisor.bin':b'raise RuntimeError("must not execute")','config.bin':b'{"runId":"test"}'}
    for name,data in blobs.items():(mount/name).write_bytes(data)
    bound={'dataset':'frozen-run','files':{name:{'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()} for name,data in blobs.items()}}
    assert loader.stage(bound,root/'input',root/'stage')['runId']=='test'
    for name,data in blobs.items():
        (mount/name).write_bytes(b'!'*len(data))
        fails(lambda:loader.stage(bound,root/'input',root/'bad'))
        assert not (root/'bad').exists()
        (mount/name).write_bytes(data)
    (mount/'source.bin').unlink();(root/'outside').write_bytes(b'archive');(mount/'source.bin').symlink_to(root/'outside')
    fails(lambda:loader.stage(bound,root/'input',root/'bad'))

with tempfile.TemporaryDirectory() as temp, patch('time.sleep'), patch.object(kaggle, 'notebook_metadata', return_value=NS(id=42,ref='test/frozen-run',current_version_number=0,is_private=True)):
    root=Path(temp);(root/'run.py').write_text('small loader');data=root/'payload';data.mkdir()
    for name in ('source.bin','bundle.bin','supervisor.bin','config.bin'):(data/name).write_bytes(b'payload')
    calls=[]
    class DatasetAPI(API):
        config_values={'username':'test'}
        def with_retry(self,call,*args,**kwargs):raise AssertionError('mutation retry wrapper used')
        def _upload_file_or_folder(self,parent,name,*args,**kw):return name
        def dataset_create_new(self,folder,**kw):
            files={self._upload_file_or_folder(folder,p.name) for p in Path(folder).iterdir() if p.name!='dataset-metadata.json'}
            assert files - {None} == {'source.bin','bundle.bin','supervisor.bin','config.bin'}
            calls.append('create');assert kw==dict(public=False,quiet=True,convert_to_csv=False)
            metadata=json.loads((Path(folder)/'dataset-metadata.json').read_text())
            if metadata['licenses'] != [{'name':'other'}]:
                return NS(status='Error',error='Please select a valid license',ref='',url='https://www.kaggle.com/')
            assert 'All rights reserved' in metadata['description']
            return self.with_retry(lambda:NS(error=None,ref='test/frozen-data',status='ok',url='https://www.kaggle.com/datasets/test/frozen-data'))()
        def dataset_status(self,ref,format=None):
            assert ref=='test/frozen-data'
            return '{"current_version_number":1}' if format else 'ready'
        def kernels_push(self,folder,**kw):
            calls.append('push');meta=json.loads((Path(folder)/'kernel-metadata.json').read_text())
            assert meta['is_private'] and meta['dataset_sources']==['test/frozen-data']
            return NS(error=None,ref='test/frozen-run',url='',kernel_id=42,version_number=1)
    for name in ('source.bin','bundle.bin','supervisor.bin','config.bin','dataset-metadata.json'):
        (data/('._'+name)).write_bytes(b'mac metadata')
    api=DatasetAPI(0);request=dict(action='launch',folder=str(root),name='frozen-run',datasetName='frozen-data')
    for name in ('unexpected.bin','._unexpected.bin'):
        (data/name).write_bytes(b'unknown')
        with patch.object(kaggle,'audit') as audit:
            fails(lambda:kaggle.execute(api,request));audit.assert_not_called()
        (data/name).unlink()
    (data/'._source.bin').unlink();(data/'._source.bin').symlink_to(data/'source.bin')
    fails(lambda:kaggle.execute(api,request));(data/'._source.bin').unlink()
    (data/'._source.bin').write_bytes(b'mac metadata')
    assert kaggle.execute(api,request)['remoteId']=='test/frozen-run' and calls==['create','push']
    (data/'dataset-metadata.json').unlink();(root/'dataset-create.json').unlink();(root/'notebook-attempt.json').unlink(missing_ok=True);(root/'notebook-response.json').unlink(missing_ok=True);calls.clear()
    # The SDK CLI accepts status/url; a successful response may omit ref.
    create=api.dataset_create_new
    def url_only(*args,**kw):
        reply=create(*args,**kw);reply.ref='';return reply
    api.dataset_create_new=url_only
    assert kaggle.execute(api,request)['remoteId']=='test/frozen-run' and calls==['create','push']
    (data/'dataset-metadata.json').unlink();(root/'dataset-create.json').unlink();(root/'notebook-attempt.json').unlink(missing_ok=True);(root/'notebook-response.json').unlink(missing_ok=True);calls.clear()
    def uncertain_create(*args,**kw):
        calls.append('create');raise TimeoutError()
    api.dataset_create_new=uncertain_create
    fails(lambda:kaggle.execute(api,request));assert calls==['create']
    (data/'dataset-metadata.json').unlink();(root/'dataset-create.json').unlink();(root/'notebook-attempt.json').unlink(missing_ok=True);(root/'notebook-response.json').unlink(missing_ok=True);calls.clear();api=DatasetAPI(0)
    def uncertain_push(*args,**kw):
        calls.append('push');raise TimeoutError()
    api.kernels_push=uncertain_push
    fails(lambda:kaggle.execute(api,request));assert calls==['create','push']
    (data/'dataset-metadata.json').unlink();(root/'dataset-create.json').unlink();(root/'notebook-attempt.json').unlink(missing_ok=True);(root/'notebook-response.json').unlink(missing_ok=True);calls.clear();api=DatasetAPI(0)
    api.dataset_status=lambda ref,format=None:'{"current_version_number":2}' if format else 'ready'
    fails(lambda:kaggle.execute(api,request));assert calls==['create']
    (data/'dataset-metadata.json').unlink();(root/'dataset-create.json').unlink();(root/'notebook-attempt.json').unlink(missing_ok=True);(root/'notebook-response.json').unlink(missing_ok=True);calls.clear()
    for reply,state in [
        (NS(status='Error',error='Please select a valid license',ref='',url='https://www.kaggle.com/'),'rejected'),
        (NS(status='error',error='sensitive service body',ref='',url=''),'rejected'),
        (NS(status='',error='',ref='test/frozen-data',url=''),'unknown'),
        (NS(status='ok',error='',ref='test/other',url='https://www.kaggle.com/datasets/test/frozen-data'),'unknown'),
        (NS(status='ok',error='',ref='',url='https://example.com/test/frozen-run'),'unknown'),
    ]:
        api=DatasetAPI(0)
        api.dataset_create_new=lambda *args,**kw: (calls.append('create') or reply)
        fails(lambda:kaggle.execute(api,request))
        saved=(root/'dataset-create.json').read_text()
        assert json.loads(saved)['state']==state and 'sensitive' not in saved
        assert json.loads(saved)['errorCode']==('invalid-license' if reply.error=='Please select a valid license' else None)
        assert calls==['create']
        (data/'dataset-metadata.json').unlink()
        # A repeat cannot reach dataset creation, even after a response was lost.
        fails(lambda:kaggle.execute(api,request));assert calls==['create']
        (data/'dataset-metadata.json').unlink();(root/'dataset-create.json').unlink();(root/'notebook-attempt.json').unlink(missing_ok=True);(root/'notebook-response.json').unlink(missing_ok=True);calls.clear()
    (root/'run.py').write_bytes(b'x'*1_000_000)
    with patch.object(kaggle,'audit') as audit:
        fails(lambda:kaggle.execute(api,request));audit.assert_not_called()

# An uncertain push can only recover through read-only, exact source/version proof.
with tempfile.TemporaryDirectory() as temp:
    folder=Path(temp);(folder/'run.py').write_text('frozen loader')
    ref='test/frozen-run'; calls=[]
    api=NS(with_retry=lambda call:call)
    def push(*args,**kwargs):
        calls.append('push')
        return NS(error=None,ref='',url='https://www.kaggle.com/code/'+ref,kernel_id=42,version_number=1)
    api.kernels_push=push
    draft=NS(ref=ref,id=42,current_version_number=0,is_private=True)
    with patch.object(kaggle,'notebook_metadata',return_value=draft):
        assert kaggle.submit_notebook(api,folder,ref)=={'remoteId':ref}
        assert json.loads((folder/'notebook-response.json').read_text())['state']=='accepted'
        fails(lambda:kaggle.submit_notebook(api,folder,ref));assert calls==['push']
        for field,value in [('ref','test/other'),('url','https://example.com/'+ref),('version_number',2),('kernel_id',43),('error','private service message')]:
            (folder/'notebook-attempt.json').unlink()
            def bad_push(*args,**kwargs):
                reply=push();setattr(reply,field,value);return reply
            api.kernels_push=bad_push
            fails(lambda:kaggle.submit_notebook(api,folder,ref))
            saved=(folder/'notebook-response.json').read_text()
            assert json.loads(saved)['state']!='accepted' and 'private service' not in saved
        (folder/'notebook-attempt.json').unlink();(folder/'notebook-response.json').unlink()
        def lost(*args,**kwargs):calls.append('push');raise TimeoutError('lost response')
        api.kernels_push=lost
        fails(lambda:kaggle.submit_notebook(api,folder,ref))
        count=len(calls);fails(lambda:kaggle.submit_notebook(api,folder,ref));assert len(calls)==count
    detail=NS(metadata=NS(ref=ref,id=42,current_version_number=1,is_private=True),blob=NS(source='frozen loader'))
    api.config_values={'username':'test'};api.kernels_status=lambda ref:NS(status=NS(name='COMPLETE'))
    with patch.object(kaggle,'notebook_detail',return_value=detail):
        assert kaggle.execute(api,dict(action='status',name='frozen-run',folder=str(folder)))['state']=='complete'
        assert len(calls)==count
        assert json.loads((folder/'notebook-attempt.json').read_text())['state']=='attempted'
        for field,value in [('id',43),('ref','test/other'),('current_version_number',0),('current_version_number',2),('is_private',False)]:
            old=getattr(detail.metadata,field);setattr(detail.metadata,field,value)
            fails(lambda:kaggle.observed_notebook(api,folder,ref));setattr(detail.metadata,field,old)
        detail.blob.source='changed loader';fails(lambda:kaggle.observed_notebook(api,folder,ref))
        detail.blob.source='frozen loader'
        (folder/'run.py').write_text('local tamper');fails(lambda:kaggle.observed_notebook(api,folder,ref))
        assert len(calls)==count

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
    (sdk/'api/kaggle_api_extended.py').write_text("class Failure(Exception):\n response=type('Reply',(),{'status_code':403})()\nclass KaggleApi:\n config_values={'username':'test'}\n def authenticate(self): raise Failure('sensitive service body')\n")
    reply=subprocess.run([sys.executable,str(Path(kaggle.__file__))],input=json.dumps({'action':'preflight','name':'fixture'}),text=True,capture_output=True,check=True,timeout=10,env={**os.environ,'PYTHONPATH':str(root/'sdk'),'PYTHONDONTWRITEBYTECODE':'1'})
    assert json.loads(reply.stdout)=={'error':'HTTP 403'} and 'sensitive' not in reply.stdout+reply.stderr

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
