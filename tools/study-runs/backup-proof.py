#!/usr/bin/env python3
"""Back up card files, then prove this run from downloaded decoded bytes."""
import datetime, gzip, hashlib, json, os, signal, subprocess, tarfile, tempfile, time, sys
from pathlib import Path
RCLONE='/opt/homebrew/bin/rclone'
def stamp(): return datetime.datetime.now(datetime.timezone.utc).isoformat()
def save(name,value):
    p=STATE/name; tmp=p.with_suffix(p.suffix+'.tmp');tmp.write_text(json.dumps(value,indent=2)+'\n');tmp.replace(p)
def digest_stream(f,algorithm='sha256'):
    h=hashlib.new(algorithm); n=0
    for b in iter(lambda:f.read(8*1024*1024),b''):
        h.update(b);n+=len(b)
        if n>1024*1024*1024:raise RuntimeError('Decoded file byte limit')
    return h.hexdigest(),n
def digest(p,algorithm='sha256'):
    with p.open('rb') as f:return digest_stream(f,algorithm)
def cloud_file(remote,dest,timeout=900):
    proc=subprocess.Popen([RCLONE,'copyto',remote,str(dest),'--checksum','--immutable','--contimeout','30s','--timeout','2m','--retries','1','--low-level-retries','1'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,start_new_session=True)
    end=time.monotonic()+timeout
    try:
        while proc.poll() is None:
            if time.monotonic()>end or dest.exists() and dest.stat().st_size>1024*1024*1024:raise RuntimeError('Cloud transfer limit')
            time.sleep(.1)
        if proc.returncode:raise RuntimeError('Cloud transfer failed')
    finally:
        if proc.poll() is None:
            os.killpg(proc.pid,signal.SIGKILL);proc.wait(timeout=5)

def verify():
    receipt=json.loads((STATE/'receipt-at-completion.json').read_text())
    if not receipt['remote'].startswith('drive:King Down/results-backups/') or '..' in Path(receipt['remote']).parts:raise RuntimeError('Unknown snapshot path')
    required=json.loads((STATE/'required-backup-files.json').read_text())
    expected={r['path']:r for r in required}
    if len(expected)!=len(required):raise RuntimeError('Duplicate required path')

    with tempfile.TemporaryDirectory(prefix='study-run-verify-',dir=ROOT/'work') as temp:
        stage=Path(temp)
        for name,meta in receipt['snapshot_files'].items():
            if name not in ('manifest.json','sources.json.gz'):raise RuntimeError('Unknown snapshot metadata file')
            cloud_file(receipt['remote']+'/'+name,stage/name)
            if digest(stage/name,'md5')!=(meta['md5'],meta['bytes']):raise RuntimeError('Downloaded snapshot metadata differs: '+name)
        if digest(stage/'manifest.json','md5')[0]!=receipt['manifest_md5']:raise RuntimeError('Manifest receipt differs')
        if receipt['provenance_sha256']:
            with gzip.open(stage/'sources.json.gz','rb') as f:
                if digest_stream(f)[0]!=receipt['provenance_sha256']:raise RuntimeError('Source provenance differs')
        manifest=json.loads((stage/'manifest.json').read_text())
        if manifest['schema']!='king-down-results-v1' or manifest['objects_root']!='drive:King Down/results-objects':raise RuntimeError('Unknown object store')
        tree=manifest['files']; fields=('path','sha256','bytes','mtime_ns')
        tree_hash=hashlib.sha256(json.dumps({'files':[{k:r[k] for k in fields} for r in tree],'provenance_sha256':receipt['provenance_sha256']},sort_keys=True).encode()).hexdigest()
        if tree_hash!=receipt['tree_hash']:raise RuntimeError('Receipt tree hash differs')
        if len(tree)!=receipt['files'] or sum(r['bytes'] for r in tree)!=receipt['bytes']:raise RuntimeError('Receipt counts differ')
        indexed={r['path']:r for r in tree}
        if len(indexed)!=len(tree):raise RuntimeError('Duplicate manifest path')
        groups={}
        for path,r in expected.items():
            got=indexed.get(path)
            if not got or any(got[k]!=r[k] for k in ('sha256','bytes')):raise RuntimeError('Campaign missing or changed in cloud manifest: '+path)
            if digest(ROOT/'results'/path)!=(r['sha256'],r['bytes']):raise RuntimeError('Local campaign changed: '+path)
            groups.setdefault(got['object'],[]).append(got)
        verified=[];objects=[]
        for i,(name,rows) in enumerate(groups.items()):
            if Path(name).is_absolute() or '..' in Path(name).parts:raise RuntimeError('Invalid cloud object path')
            dest=stage/('object-'+str(i))
            cloud_file(manifest['objects_root']+'/'+name,dest)
            meta=manifest['objects'][name]
            if digest(dest,'md5')!=(meta['md5'],meta['bytes']):raise RuntimeError('Downloaded object differs: '+name)
            codecs={r['codec'] for r in rows}
            if codecs=={'tar-gzip'}:
                wanted={r['member']:r for r in rows};seen=set()
                if len(wanted)!=len(rows):raise RuntimeError('Duplicate required tar member')
                with tarfile.open(dest,'r|gz') as tar:
                    for member in tar:
                        if member.name not in wanted:continue
                        if member.name in seen or not member.isfile():raise RuntimeError('Invalid required tar member')
                        row=wanted[member.name]
                        with tar.extractfile(member) as f: actual=digest_stream(f)
                        if actual!=(row['sha256'],row['bytes']):raise RuntimeError('Downloaded campaign bytes differ: '+row['path'])
                        seen.add(member.name);verified.append({k:row[k] for k in ('path','sha256','bytes')})
                if seen!=set(wanted):raise RuntimeError('Missing required tar member')
            elif codecs in ({'gzip'},{'plain'}):
                with (gzip.open(dest,'rb') if codecs=={'gzip'} else dest.open('rb')) as f:actual=digest_stream(f)
                for row in rows:
                    if actual!=(row['sha256'],row['bytes']):raise RuntimeError('Downloaded campaign bytes differ: '+row['path'])
                    verified.append({k:row[k] for k in ('path','sha256','bytes')})
            else:raise RuntimeError('Unknown/mixed object codec')
            objects.append({'object':name,**meta,'decodedFiles':len(rows)});dest.unlink()
        if {r['path'] for r in verified}!=set(expected):raise RuntimeError('Incomplete decoded-file verification')
        save('verified-final.json',{'pass':True,'at':stamp(),'receipt':receipt,'requiredFiles':len(required),'requiredBytes':sum(r['bytes'] for r in required),'downloadedObjects':objects,'verifiedFiles':verified,'remoteSourcesPreserved':True})


def fresh_receipt(receipts,started):
    if len(receipts)!=1 or receipts[0]['verified_epoch']<started:raise RuntimeError('Missing or stale backup receipt')
    return receipts[0]

def main(request):
    global MAIN, ROOT, STATE
    MAIN=Path(request['mainRoot']).resolve()
    started=time.time()
    env=dict(os.environ);env.pop('KING_DOWN_RESULTS_DIR',None)
    found=subprocess.run(['node','tools/lib/results-root.mjs'],cwd=MAIN,env=env,capture_output=True,check=True,timeout=30).stdout.decode().strip()
    if not Path(found).is_absolute() or found=='sim/out':raise RuntimeError('Configured card is required')
    result=Path(found).resolve()
    directory=Path(request['directory']).resolve()
    directory.relative_to(result)
    ROOT=result.parent
    if (ROOT/'.maintenance.lock').exists():raise RuntimeError('Live backup lock; leave it intact')
    STATE=ROOT/'state'/'study-backups'/request['runId']
    STATE.mkdir(parents=True,exist_ok=True)
    required=[]
    for file in sorted(directory.rglob('*')):
        if file.is_symlink():raise RuntimeError('Symlink in run payload')
        if file.is_file():
            if 'node_modules' in file.parts:raise RuntimeError('Runtime installation in results')
            sha,size=digest(file)
            required.append(dict(path=str(file.relative_to(result)),sha256=sha,bytes=size))
    if not required:raise RuntimeError('Empty run payload')
    save('required-backup-files.json',required)
    log=STATE/'backup.log'
    with log.open('wb') as output:
        proc=subprocess.Popen(['python3','tools/results-store.py','backup','--main',str(MAIN)],cwd=MAIN,env=env,stdout=output,stderr=subprocess.STDOUT,start_new_session=True)
        try:
            end=time.monotonic()+5400
            while proc.poll() is None:
                if time.monotonic()>end or log.stat().st_size>16*1024*1024:raise subprocess.TimeoutExpired('backup',5400)
                time.sleep(.1)
            code=proc.returncode
        except subprocess.TimeoutExpired:
            os.killpg(proc.pid,signal.SIGTERM)
            try:proc.wait(timeout=5)
            except subprocess.TimeoutExpired:os.killpg(proc.pid,signal.SIGKILL);proc.wait(timeout=5)
            raise RuntimeError('Backup time limit; preserve lock for inspection')
    if code:raise RuntimeError('Project backup failed')
    if log.stat().st_size>16*1024*1024:raise RuntimeError('Backup log byte limit')
    receipts=[]
    for line in log.read_text().splitlines():
        try:value=json.loads(line)
        except json.JSONDecodeError:continue
        if isinstance(value,dict) and value.get('format')=='objects-v1':receipts.append(value)
    save('receipt-at-completion.json',fresh_receipt(receipts,started))
    signal.signal(signal.SIGALRM,lambda *_: (_ for _ in ()).throw(TimeoutError('Restore proof time limit')))
    signal.alarm(1800)
    try: verify()
    finally:signal.alarm(0)
    proof=dict(verified=True,receiptPath=str(STATE/'verified-final.json'),files=len(required),bytes=sum(row['bytes'] for row in required))
    print(json.dumps(proof))
if __name__=='__main__':
    try:main(json.load(sys.stdin))
    except Exception as error:
        print(json.dumps({'error':type(error).__name__+': backup proof failed'}));sys.exit(1)
