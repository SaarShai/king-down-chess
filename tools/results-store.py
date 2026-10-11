#!/usr/bin/env python3
"""Collect results without overwrites and verify versioned cloud snapshots."""
import argparse, gzip, hashlib, json, os, plistlib, shutil, subprocess, tarfile, tempfile, time
from pathlib import Path
CONFIG = Path.home()/'.config/king-down/results.json'
M1_ID = ['new','MacBook-Pro-2','MacBookPro18,2','SHA256:e2GtnqVZpq4rDNvFsAayCsdu1iSqkFoX8CJCkxazwcM']

def run(args, **kw):
    return subprocess.check_output(args, text=True, **kw)

def digest(path, compressed=False):
    h=hashlib.sha256();n=0
    with (gzip.open(path,'rb') if compressed else path.open('rb')) as f:
        for b in iter(lambda:f.read(8*1024*1024),b''):h.update(b);n+=len(b)
    return h.hexdigest(),n

def configured():
    cfg=json.loads(CONFIG.read_text());root=Path(cfg['root'])
    info=plistlib.loads(subprocess.check_output(['diskutil','info','-plist',cfg['volume']]))
    if info.get('VolumeUUID')!=cfg['uuid'] or not root.is_dir():raise RuntimeError('Connect the configured card disk; no local fallback')
    return root

def merge(root, source, label, old_drive=False):
    """Preserve a conflicting version by content hash; return its source record."""
    records=[]
    for p in sorted(source.rglob('*')):
        if p.is_symlink():
            if p.name=='node_modules':
                records.append({'source':label,'path':str(p.relative_to(source)),'dependency_link':os.readlink(p)})
                continue
            raise RuntimeError('Source symlink needs review: '+str(p))
        if not p.is_file() or p.name=='.DS_Store' or p.name.startswith('._'):continue
        # Never download online-only files as an incidental directory scan.
        if getattr(p.stat(),'st_flags',0)&0x40000000:raise RuntimeError('Materialize source before collection: '+str(p))
        rel=p.relative_to(source);compressed=old_drive and p.name.endswith(('.jsonl.gz','.log.gz'))
        if compressed:rel=rel.with_suffix('')
        pin=p.stat();sha,size=digest(p,compressed);now=p.stat()
        if (pin.st_size,pin.st_mtime_ns)!=(now.st_size,now.st_mtime_ns):raise RuntimeError('Source changed; retry: '+str(p))
        dst=root/rel;promote=False
        if dst.exists() and digest(dst)[0]!=sha:
            # Only a byte-for-byte append is safe to promote automatically.
            promote=False
            if rel.suffix in ('.jsonl','.log') and size>dst.stat().st_size:
                with (gzip.open(p,'rb') if compressed else p.open('rb')) as new,dst.open('rb') as old:
                    promote=True
                    for chunk in iter(lambda:old.read(8*1024*1024),b''):
                        if new.read(len(chunk))!=chunk:promote=False;break
            if promote:
                previous=root/'.variants'/digest(dst)[0]/rel
                previous.parent.mkdir(parents=True,exist_ok=True)
                if not previous.exists():shutil.copy2(dst,previous)
                if digest(previous)!=digest(dst):raise RuntimeError('Previous version preservation failed')
            else:dst=root/'.variants'/sha/rel
        if not dst.exists() or promote:
            dst.parent.mkdir(parents=True,exist_ok=True)
            temp=dst.with_name(dst.name+'.collecting')
            try:
                with (gzip.open(p,'rb') if compressed else p.open('rb')) as src,temp.open('xb') as out:shutil.copyfileobj(src,out,8*1024*1024)
                if digest(temp)!=(sha,size):raise RuntimeError('Copy verification failed: '+str(p))
                now=p.stat()
                if (pin.st_size,pin.st_mtime_ns)!=(now.st_size,now.st_mtime_ns):raise RuntimeError('Source changed during copy: '+str(p))
                os.utime(temp,ns=(pin.st_atime_ns,pin.st_mtime_ns));temp.rename(dst)
            finally:
                if temp.exists():temp.unlink()
        records.append({'source':label,'path':str(p.relative_to(source)),'stored':str(dst.relative_to(root)),'sha256':sha,'bytes':size})
    return records

def m1_sources(stage):
    ssh=['ssh','-o','BatchMode=yes','-o','ConnectTimeout=8','M1']
    identity=run(ssh+['printf "%s\\n" "$USER"; scutil --get LocalHostName; sysctl -n hw.model; ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub']).splitlines()
    if identity[:3]!=M1_ID[:3] or M1_ID[3] not in identity[3]:raise RuntimeError('M1 identity mismatch')
    paths=run(ssh+['find ~/projects -name node_modules -prune -o -path "*/sim/out" -type d -print -prune']).splitlines()
    for i,path in enumerate(paths):
        if not path.startswith('/Users/new/projects/') or not path.endswith('/sim/out'):raise RuntimeError('Unexpected M1 source')
        local=stage/str(i);local.mkdir()
        subprocess.run(['rsync','-a','--checksum','-e','ssh -o BatchMode=yes -o ConnectTimeout=8','M1:'+path+'/',str(local)+'/'],check=True)
        yield local,'M1:'+path

def collect(root, main, include_drive, include_m1):
    records=[]
    listing=run(['git','-C',str(main),'worktree','list','--porcelain'])
    roots=[Path(x[9:])/'sim/out' for x in listing.splitlines() if x.startswith('worktree ')]
    roots.sort(key=lambda p:p!=main/'sim/out')
    for source in roots:
        if source.is_dir() and source.resolve()!=root.resolve():
            print('Collect local '+str(source),flush=True);records+=merge(root,source,str(source))
    if include_drive:
        source=Path.home()/'Library/CloudStorage/GoogleDrive-saar.shai@gmail.com/My Drive/king-down-sim-out'
        records+=merge(root,source,'Google Drive:king-down-sim-out',True)
    if include_m1:
        try:
            with tempfile.TemporaryDirectory(prefix='kingdown-m1-') as temp:
                for source,label in m1_sources(Path(temp)):
                    print('Collect '+label,flush=True);records+=merge(root,source,label)
        except (OSError,RuntimeError,subprocess.SubprocessError) as error:
            records.append({'source':'M1','collection_error':str(error)})
            print('M1 incomplete; still backing up collected results: '+str(error),flush=True)
    # Earlier rows may refer to a version superseded by a safe append.
    verified={}
    for row in records:
        if 'sha256' not in row:continue
        if row['stored'] not in verified:verified[row['stored']]=digest(root/row['stored'])[0]
        if verified[row['stored']]!=row['sha256']:
            variant=Path('.variants')/row['sha256']/row['stored']
            if str(variant) not in verified:verified[str(variant)]=digest(root/variant)[0]
            if verified[str(variant)]!=row['sha256']:raise RuntimeError('Lost source version')
            row['stored']=str(variant)
    state=root.parent/'state';state.mkdir(exist_ok=True)
    stamp=time.strftime('%Y%m%d-%H%M%S');manifest=state/('sources-'+stamp+'.json')
    manifest.write_text(json.dumps(records));print(json.dumps({'records':len(records),'source_manifest':str(manifest)}),flush=True)
    return manifest

RCLONE='/opt/homebrew/bin/rclone'
OBJECTS='drive:King Down/results-objects'
LEGACY_LOCAL=Path.home()/'Library/CloudStorage/GoogleDrive-saar.shai@gmail.com/My Drive/king-down-sim-out'
LARGE_BYTES=1024*1024

def cloud(args):
    return run([RCLONE,*map(str,args)])

def md5(path):
    h=hashlib.md5()
    with path.open('rb') as f:
        for b in iter(lambda:f.read(8*1024*1024),b''):h.update(b)
    return h.hexdigest()

def remote_files(remote):
    rows=json.loads(cloud(['lsjson',remote,'--recursive','--files-only','--hash']))
    result={}
    for row in rows:
        if row['Path'] in result:raise RuntimeError('Duplicate cloud path: '+row['Path'])
        result[row['Path']]={'md5':row['Hashes'].get('md5'),'bytes':row['Size']}
    return result

def verify_objects(expected, actual):
    for name,metadata in expected.items():
        if not metadata['md5'] or actual.get(name)!=metadata:raise RuntimeError('Cloud object missing or changed: '+name)

def seed_legacy(provenance,index):
    originals=remote_files('drive:king-down-sim-out');selected={}
    for row in json.loads(provenance.read_text()):
        if row['source']!='Google Drive:king-down-sim-out' or row.get('bytes',0)<LARGE_BYTES:continue
        if row['sha256'] in selected:continue
        path=LEGACY_LOCAL/row['path'];codec='gzip' if row['path'].endswith(('.jsonl.gz','.log.gz')) else 'plain'
        pin=path.stat()
        if getattr(pin,'st_flags',0)&0x40000000:raise RuntimeError('Legacy seed is online-only; materialize explicitly first')
        if digest(path,codec=='gzip')!=(row['sha256'],row['bytes']):raise RuntimeError('Legacy seed content changed')
        metadata={'md5':md5(path),'bytes':pin.st_size}
        now=path.stat()
        if (pin.st_ino,pin.st_size,pin.st_mtime_ns,pin.st_ctime_ns)!=(now.st_ino,now.st_size,now.st_mtime_ns,now.st_ctime_ns):raise RuntimeError('Legacy seed changed during hashing')
        if originals.get(row['path'])!=metadata:raise RuntimeError('Legacy source cloud checksum differs')
        selected[row['sha256']]={'object':'legacy/'+row['path'],'codec':codec,**metadata}
    with tempfile.TemporaryDirectory(prefix='kingdown-seed-') as temp:
        listing=Path(temp)/'files.txt';listing.write_text('\n'.join(v['object'][7:] for v in selected.values())+'\n')
        cloud(['copy','drive:king-down-sim-out',OBJECTS+'/legacy','--files-from',listing,'--checksum','--immutable','--transfers','8','--checkers','8','--stats','30s','--stats-one-line','--stats-log-level','NOTICE'])
    actual=remote_files(OBJECTS)
    verify_objects({v['object']:{'md5':v['md5'],'bytes':v['bytes']} for v in selected.values()},actual)
    index.update(selected)
    print('Verified reusable legacy objects: '+str(len(selected)),flush=True)

def pack_small(root,rows,path):
    with path.open('wb') as output,gzip.GzipFile(filename='',fileobj=output,mode='wb',mtime=0,compresslevel=1) as zipped:
        with tarfile.open(fileobj=zipped,mode='w') as tar:
            for row in rows:tar.add(root/row['path'],arcname=row['path'],recursive=False)
    expected={r['path']:r for r in rows};seen=set()
    with tarfile.open(path,'r|gz') as tar:
        for member in tar:
            h=hashlib.sha256();f=tar.extractfile(member)
            for b in iter(lambda:f.read(8*1024*1024),b''):h.update(b)
            if h.hexdigest()!=expected[member.name]['sha256']:raise RuntimeError('Packed content changed: '+member.name)
            seen.add(member.name)
    if seen!=set(expected):raise RuntimeError('Incomplete small-file pack')

def backup(root,provenance=None,seed_old=False):
    state=root.parent/'state';state.mkdir(exist_ok=True)
    if provenance is None:
        manifests=sorted(state.glob('sources-*.json'))
        if manifests:provenance=manifests[-1]
    files=[p for p in sorted(root.rglob('*')) if p.is_file()];tree=[]
    for p in files:
        if p.is_symlink() or p.name.endswith('.collecting'):raise RuntimeError('Incomplete result: '+str(p))
        st=p.stat();sha,size=digest(p);tree.append({'path':str(p.relative_to(root)),'sha256':sha,'bytes':size,'mtime_ns':st.st_mtime_ns})
    provenance_sha=digest(provenance)[0] if provenance else None
    tree_hash=hashlib.sha256(json.dumps({'files':tree,'provenance_sha256':provenance_sha},sort_keys=True).encode()).hexdigest()
    last=state/'last-verified-backup.json';index_file=state/'verified-objects.json'
    index=json.loads(index_file.read_text()) if index_file.exists() else {}
    cloud(['mkdir',OBJECTS])
    if seed_old:
        if not provenance:raise RuntimeError('Legacy seeding requires the verified initial source manifest')
        seed_legacy(provenance,index)
    actual=remote_files(OBJECTS)
    if last.exists() and json.loads(last.read_text()).get('format')=='objects-v1' and json.loads(last.read_text()).get('tree_hash')==tree_hash:
        receipt=json.loads(last.read_text());text=cloud(['cat',receipt['remote']+'/manifest.json'])
        if hashlib.md5(text.encode()).hexdigest()!=receipt['manifest_md5']:raise RuntimeError('Cloud manifest changed')
        verify_objects(json.loads(text)['objects'],actual)
        verify_objects(receipt['snapshot_files'],remote_files(receipt['remote']))
        if json.loads(cloud(['cat','drive:King Down/results-backups/latest.json']))!=receipt:raise RuntimeError('Cloud latest pointer changed')
        print('Unchanged results and existing cloud snapshot verified; no result data uploaded',flush=True);return
    stamp=time.strftime('%Y%m%d-%H%M%S')+'-'+str(time.time_ns()%1000000000);remote='drive:King Down/results-backups/'+stamp
    with tempfile.TemporaryDirectory(prefix='kingdown-backup-') as temp:
        stage=Path(temp);objects=stage/'objects';objects.mkdir();metadata=stage/'metadata';metadata.mkdir();referenced={}
        small=[r for r in tree if r['bytes']<LARGE_BYTES]
        pack=objects/'small.tar.gz';pack_small(root,small,pack)
        pack_name='packs/'+digest(pack)[0]+'.tar.gz';pack_meta={'md5':md5(pack),'bytes':pack.stat().st_size}
        referenced[pack_name]=pack_meta
        if actual.get(pack_name)==pack_meta:pack.unlink()
        else:
            destination=objects/pack_name;destination.parent.mkdir(parents=True);pack.rename(destination)
        for row in tree:
            if row['bytes']<LARGE_BYTES:row.update({'object':pack_name,'codec':'tar-gzip','member':row['path']});continue
            obj=index.get(row['sha256'])
            if obj is None or actual.get(obj['object'])!={'md5':obj['md5'],'bytes':obj['bytes']}:
                name='large/'+row['sha256']+'.gz';destination=objects/name;destination.parent.mkdir(parents=True,exist_ok=True)
                if not destination.exists():
                    with (root/row['path']).open('rb') as src,destination.open('wb') as out,gzip.GzipFile(filename='',fileobj=out,mode='wb',mtime=0,compresslevel=1) as zipped:shutil.copyfileobj(src,zipped,8*1024*1024)
                    if digest(destination,True)!=(row['sha256'],row['bytes']):raise RuntimeError('Large object verification failed')
                obj={'object':name,'codec':'gzip','md5':md5(destination),'bytes':destination.stat().st_size};index[row['sha256']]=obj
            referenced[obj['object']]={'md5':obj['md5'],'bytes':obj['bytes']};row.update({'object':obj['object'],'codec':obj['codec']})
        pending=[p for p in objects.rglob('*') if p.is_file()]
        uploaded_bytes=sum(p.stat().st_size for p in pending if actual.get(str(p.relative_to(objects)))!={'md5':md5(p),'bytes':p.stat().st_size})
        print(json.dumps({'new_object_candidates':len(pending),'new_result_bytes':uploaded_bytes}),flush=True)
        if pending:
            cloud(['copy',objects,OBJECTS,'--checksum','--immutable','--transfers','4','--checkers','8','--stats','30s','--stats-one-line','--stats-log-level','NOTICE'])
            cloud(['check',objects,OBJECTS,'--one-way','--checksum'])
        verify_objects(referenced,remote_files(OBJECTS))
        if {str(p.relative_to(root)) for p in root.rglob('*') if p.is_file()}!={r['path'] for r in tree}:raise RuntimeError('Results added during snapshot; retry')
        for row in tree:
            st=(root/row['path']).stat()
            if st.st_size!=row['bytes'] or st.st_mtime_ns!=row['mtime_ns']:raise RuntimeError('Results changed during snapshot; retry')
        manifest=metadata/'manifest.json';manifest.write_text(json.dumps({'schema':'king-down-results-v1','objects_root':OBJECTS,'files':tree,'objects':referenced}))
        if provenance:
            with provenance.open('rb') as src,gzip.open(metadata/'sources.json.gz','wb',compresslevel=1) as dst:shutil.copyfileobj(src,dst)
            if digest(metadata/'sources.json.gz',True)[0]!=provenance_sha:raise RuntimeError('Source provenance changed during snapshot')
        cloud(['copy',metadata,remote,'--checksum','--immutable'])
        cloud(['check',metadata,remote,'--one-way','--checksum'])
        snapshot_files={p.name:{'md5':md5(p),'bytes':p.stat().st_size} for p in metadata.iterdir()}
        verify_objects(snapshot_files,remote_files(remote))
        receipt={'format':'objects-v1','tree_hash':tree_hash,'remote':remote,'manifest_md5':md5(manifest),'provenance_sha256':provenance_sha,'snapshot_files':snapshot_files,'files':len(tree),'bytes':sum(x['bytes'] for x in tree),'objects':len(referenced),'new_result_bytes':uploaded_bytes,'verified_epoch':time.time()}
        receipt_file=stage/'receipt.json';receipt_file.write_text(json.dumps(receipt,indent=2))
        cloud(['copyto',receipt_file,'drive:King Down/results-backups/latest.json'])
        if json.loads(cloud(['cat','drive:King Down/results-backups/latest.json']))!=receipt:raise RuntimeError('Cloud latest pointer verification failed')
        index_file.write_text(json.dumps(index));last.write_text(receipt_file.read_text())
        print(json.dumps(receipt),flush=True)

def main():
    p=argparse.ArgumentParser();p.add_argument('command',choices=['collect','backup','maintain']);p.add_argument('--main',type=Path,default=Path('/Users/za/Documents/king down chess'));p.add_argument('--include-old-drive',action='store_true');p.add_argument('--m1',action='store_true');p.add_argument('--seed-old-drive',action='store_true');args=p.parse_args()
    root=configured();lock=root.parent/'.maintenance.lock'
    try:lock.mkdir()
    except FileExistsError:raise RuntimeError('Maintenance already running; inspect lock before retry')
    try:
        provenance=collect(root,args.main,args.include_old_drive,args.m1) if args.command!='backup' else None
        if args.command!='collect':backup(root,provenance,args.seed_old_drive)
        if provenance and any('collection_error' in row for row in json.loads(provenance.read_text())):raise RuntimeError('M1 collection incomplete; card backup verified, retry when M1 is reachable')
    finally:lock.rmdir()
if __name__=='__main__':main()
