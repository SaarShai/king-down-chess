"""Offline restore/immutability checks; the fake cloud never contacts Drive."""
import gzip, hashlib, importlib.util, json, shutil, sys, tarfile, tempfile
from pathlib import Path
sys.dont_write_bytecode=True
spec=importlib.util.spec_from_file_location('store','tools/results-store.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
with tempfile.TemporaryDirectory() as temp:
    home=Path(temp);root=home/'card/results';root.mkdir(parents=True);remote=home/'cloud';remote.mkdir();m.LARGE_BYTES=8
    legacy=remote/'king-down-sim-out';legacy.mkdir();m.LEGACY_LOCAL=legacy
    old=b'old completed results\n'*4
    (root/'big.jsonl').write_bytes(old);(root/'small.txt').write_bytes(b'note')
    with gzip.open(legacy/'big.jsonl.gz','wb') as f:f.write(old)
    provenance=home/'sources.json';provenance.write_text(json.dumps([{'source':'Google Drive:king-down-sim-out','path':'big.jsonl.gz','sha256':m.digest(root/'big.jsonl')[0],'bytes':len(old)}]))
    def path(value):
        text=str(value);return remote/text[6:] if text.startswith('drive:') else Path(text)
    def fake(args):
        command=args[0]
        if command=='mkdir':path(args[1]).mkdir(parents=True,exist_ok=True);return ''
        if command=='cat':return path(args[1]).read_text()
        if command=='lsjson':
            base=path(args[1]);return json.dumps([{'Path':str(p.relative_to(base)),'Size':p.stat().st_size,'Hashes':{'md5':hashlib.md5(p.read_bytes()).hexdigest()}} for p in base.rglob('*') if p.is_file()])
        if command=='copyto':
            dest=path(args[2]);dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(path(args[1]),dest);return ''
        if command in ('copy','check'):
            source=path(args[1]);dest=path(args[2]);chosen=None
            if '--files-from' in args:chosen=set(Path(args[args.index('--files-from')+1]).read_text().splitlines())
            for p in source.rglob('*'):
                if not p.is_file():continue
                rel=p.relative_to(source)
                if chosen is not None and str(rel) not in chosen:continue
                q=dest/rel
                if command=='check':assert q.exists() and m.md5(q)==m.md5(p);continue
                if '--immutable' in args and q.exists() and m.md5(q)!=m.md5(p):raise RuntimeError('Immutable object changed')
                q.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(p,q)
            return ''
        raise AssertionError(args)
    m.cloud=fake
    real_md5=m.md5
    def changing_md5(p):
        value=real_md5(p)
        if p==legacy/'big.jsonl.gz':p.write_bytes(p.read_bytes()+b'changed')
        return value
    saved=(legacy/'big.jsonl.gz').read_bytes();m.md5=changing_md5
    try:m.seed_legacy(provenance,{});raise AssertionError('Legacy hashing race accepted')
    except RuntimeError as error:assert 'Legacy seed changed during hashing' in str(error)
    finally:m.md5=real_md5;(legacy/'big.jsonl.gz').write_bytes(saved)
    def restore(receipt):
        manifest=json.loads(fake(['cat',receipt['remote']+'/manifest.json']));result={}
        m.verify_objects(manifest['objects'],m.remote_files(m.OBJECTS))
        for row in manifest['files']:
            obj=path(m.OBJECTS+'/'+row['object'])
            if row['codec']=='tar-gzip':
                with tarfile.open(obj) as tar:data=tar.extractfile(row['member']).read()
            elif row['codec']=='gzip':data=gzip.decompress(obj.read_bytes())
            else:data=obj.read_bytes()
            assert hashlib.sha256(data).hexdigest()==row['sha256'] and len(data)==row['bytes'];result[row['path']]=data
        return result
    m.backup(root,provenance,True);last=root.parent/'state/last-verified-backup.json';first=json.loads(last.read_text())
    assert restore(first)=={'big.jsonl':old,'small.txt':b'note'}
    new=b'new completed results\n'*4;(root/'big.jsonl').write_bytes(new)
    m.backup(root,provenance);second=json.loads(last.read_text());assert first['remote']!=second['remote']
    assert restore(first)['big.jsonl']==old and restore(second)['big.jsonl']==new
    assert json.loads(fake(['cat',first['remote']+'/manifest.json']))['files'][1]['object']==json.loads(fake(['cat',second['remote']+'/manifest.json']))['files'][1]['object']
    before={str(p):p.read_bytes() for p in remote.rglob('*') if p.is_file()}
    m.backup(root,provenance);assert before=={str(p):p.read_bytes() for p in remote.rglob('*') if p.is_file()}
    for broken in (path(second['remote']+'/sources.json.gz'),path('drive:King Down/results-backups/latest.json')):
        saved=broken.read_bytes();broken.write_text('{}')
        try:m.backup(root,provenance);raise AssertionError('Snapshot metadata corruption accepted')
        except RuntimeError:pass
        finally:broken.write_bytes(saved)
    manifest=json.loads(fake(['cat',second['remote']+'/manifest.json']));broken=path(m.OBJECTS+'/'+manifest['files'][0]['object']);saved=broken.read_bytes();broken.write_bytes(b'corrupt')
    try:m.backup(root,provenance);raise AssertionError('Cloud corruption accepted')
    except RuntimeError as error:assert 'Cloud object missing or changed' in str(error)
    assert json.loads(last.read_text())==second
    broken.write_bytes(saved)
    # A live producer must not invalidate bytes already captured for this backup.
    (root/'small.txt').write_bytes(b'next')
    def producing_cloud(args):
        if args[0]=='mkdir':
            (root/'arrived.txt').write_bytes(b'later')
            (root/'big.jsonl').write_bytes(b'new live write')
        return fake(args)
    m.cloud=producing_cloud
    m.backup(root,provenance)
    captured=json.loads(last.read_text())
    assert restore(captured)=={'big.jsonl':new,'small.txt':b'next'}
    m.cloud=fake
print('Restore, immutable history, unchanged-run reuse and cloud-corruption detection: PASS')

# Failed connections retry in the same stage; failed spools do not hide later ones.
from unittest.mock import patch
import subprocess
with tempfile.TemporaryDirectory() as temp:
    calls={}
    def transport(args, **kw):
        if args[0]=='ssh':
            if 'find ' in args[-1]:return '/Users/new/projects/a/sim/out\n/Users/new/projects/b/sim/out\n'
            return '\n'.join(m.M1_ID)
        source=args[-2];calls[source]=calls.get(source,0)+1
        if calls[source]==1:raise subprocess.CalledProcessError(12,args)
        return ''
    with patch.object(m,'run',transport),patch.object(m.time,'sleep'):
        assert len(list(m.m1_sources(Path(temp))))==2
        assert list(calls.values())==[2,2]
with tempfile.TemporaryDirectory() as temp:
    def unavailable(args, **kw):
        if args[0]=='rsync' and '/a/' in args[-2]:raise subprocess.CalledProcessError(255,args)
        return transport(args,**kw)
    with patch.object(m,'run',unavailable),patch.object(m.time,'sleep'):
        received=[]
        try:
            for row in m.m1_sources(Path(temp)):received.append(row)
            raise AssertionError('Incomplete collection accepted')
        except RuntimeError as error:assert 'after 3 attempts' in str(error)
        assert len(received)==1 and '/b/' in received[0][1]
print('Live writes, M1 reconnect and partial collection reporting: PASS')

with tempfile.TemporaryDirectory() as temp:
    base=Path(temp);src=base/'source';dst=base/'snapshot';src.mkdir();dst.mkdir()
    active=src/'active.jsonl';active.write_bytes(b'first\n')
    original_open=Path.open;reads=[0]
    def append_during_capture(path,*args,**kw):
        if path==active and args and args[0]=='rb':
            reads[0]+=1
            if reads[0]==2:
                with original_open(active,'ab') as f:f.write(b'later\n')
        return original_open(path,*args,**kw)
    with patch.object(Path,'open',append_during_capture):m.capture(src,dst)
    assert (dst/'active.jsonl').read_bytes()==b'first\n'
    assert active.read_bytes()==b'first\nlater\n'
print('Append during capture retains verified original prefix: PASS')

with tempfile.TemporaryDirectory() as temp:
    base=Path(temp);src=base/'source';dst=base/'snapshot';src.mkdir();dst.mkdir()
    active=src/'active.json';active.write_bytes(b'old data')
    original_open=Path.open;reads=[0]
    def rewrite_during_capture(path,*args,**kw):
        if path==active and args and args[0]=='rb':
            reads[0]+=1
            if reads[0]==2:
                with original_open(active,'wb') as f:f.write(b'new data')
        return original_open(path,*args,**kw)
    with patch.object(Path,'open',rewrite_during_capture):m.capture(src,dst)
    assert reads[0]==4 and (dst/'active.json').read_bytes()==b'new data'
print('Rewrite during capture retries before publication: PASS')
