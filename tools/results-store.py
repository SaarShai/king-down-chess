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

def backup(root, provenance=None):
    state=root.parent/'state';state.mkdir(exist_ok=True)
    files=[p for p in sorted(root.rglob('*')) if p.is_file()];tree=[]
    for p in files:
        if p.is_symlink() or p.name.endswith('.collecting'):raise RuntimeError('Incomplete result: '+str(p))
        st=p.stat();sha,size=digest(p);tree.append({'path':str(p.relative_to(root)),'sha256':sha,'bytes':size,'mtime_ns':st.st_mtime_ns})
    tree_hash=hashlib.sha256(json.dumps(tree,sort_keys=True).encode()).hexdigest();last=state/'last-verified-backup.json'
    if last.exists() and json.loads(last.read_text()).get('tree_hash')==tree_hash:
        print('Results unchanged since verified cloud snapshot',flush=True);return
    stamp=time.strftime('%Y%m%d-%H%M%S');remote='drive:King Down/results-backups/'+stamp
    with tempfile.TemporaryDirectory(prefix='kingdown-backup-') as temp:
        stage=Path(temp);manifest=stage/'manifest.json';manifest.write_text(json.dumps(tree));archive=stage/'results.tar.gz'
        with tarfile.open(archive,'w:gz',compresslevel=1) as tar:
            for p in files:tar.add(p,arcname='results/'+str(p.relative_to(root)),recursive=False)
            tar.add(manifest,arcname='manifest.json')
            if provenance:tar.add(provenance,arcname='sources.json')
        # Verify the archive content and stable live source before publishing it.
        expected={x['path']:x for x in tree};seen=set()
        with tarfile.open(archive,'r|gz') as tar:
            for member in tar:
                if not member.name.startswith('results/'):continue
                rel=member.name[8:];h=hashlib.sha256();f=tar.extractfile(member)
                for b in iter(lambda:f.read(8*1024*1024),b''):h.update(b)
                if h.hexdigest()!=expected[rel]['sha256']:raise RuntimeError('Archive content changed: '+rel)
                seen.add(rel)
        if seen!=set(expected):raise RuntimeError('Incomplete archive')
        if {str(p.relative_to(root)) for p in root.rglob('*') if p.is_file()}!=set(expected):raise RuntimeError('Results added during snapshot; retry')
        for row in tree:
            p=root/row['path'];st=p.stat()
            if st.st_size!=row['bytes'] or st.st_mtime_ns!=row['mtime_ns']:raise RuntimeError('Results changed during snapshot; retry')
        md5=hashlib.md5()
        with archive.open('rb') as f:
            for b in iter(lambda:f.read(8*1024*1024),b''):md5.update(b)
        subprocess.run(['/opt/homebrew/bin/rclone','copy',str(stage),remote,'--transfers','2','--checkers','4'],check=True)
        subprocess.run(['/opt/homebrew/bin/rclone','check',str(stage),remote,'--one-way','--checksum'],check=True)
        receipt={'tree_hash':tree_hash,'remote':remote,'archive_md5':md5.hexdigest(),'files':len(tree),'bytes':sum(x['bytes'] for x in tree),'verified_epoch':time.time()}
        receipt_file=stage/'receipt.json';receipt_file.write_text(json.dumps(receipt,indent=2))
        subprocess.run(['/opt/homebrew/bin/rclone','copyto',str(receipt_file),'drive:King Down/results-backups/latest.json'],check=True)
        if json.loads(run(['/opt/homebrew/bin/rclone','cat','drive:King Down/results-backups/latest.json']))!=receipt:raise RuntimeError('Cloud latest pointer verification failed')
        last.write_text(receipt_file.read_text())
        print(json.dumps(receipt),flush=True)

def main():
    p=argparse.ArgumentParser();p.add_argument('command',choices=['collect','backup','maintain']);p.add_argument('--main',type=Path,default=Path('/Users/za/Documents/king down chess'));p.add_argument('--include-old-drive',action='store_true');p.add_argument('--m1',action='store_true');args=p.parse_args()
    root=configured();lock=root.parent/'.maintenance.lock'
    try:lock.mkdir()
    except FileExistsError:raise RuntimeError('Maintenance already running; inspect lock before retry')
    try:
        provenance=collect(root,args.main,args.include_old_drive,args.m1) if args.command!='backup' else None
        if args.command!='collect':backup(root,provenance)
        if provenance and any('collection_error' in row for row in json.loads(provenance.read_text())):raise RuntimeError('M1 collection incomplete; card backup verified, retry when M1 is reachable')
    finally:lock.rmdir()
if __name__=='__main__':main()
