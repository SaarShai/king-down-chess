#!/usr/bin/env python3
"""Bounded Kaggle adapter. Keep this filename distinct from the SDK package."""
import contextlib, json, os, sys, socket, resource, time
from pathlib import Path

ACTIVE = {'QUEUED','RUNNING','CANCEL_REQUESTED','NEW_SCRIPT'}
TERMINAL = {'COMPLETE','ERROR','CANCEL_ACKNOWLEDGED'}

def audit(api):
    active = 0
    deadline = time.monotonic() + 900
    def read(call, **kwargs):
        # Retry only read requests. A submission is never retried.
        for attempt in range(3):
            if time.monotonic() >= deadline: raise RuntimeError('account audit time limit')
            try:
                result = call(**kwargs)
                time.sleep(2)
                return result
            except Exception as error:
                response = getattr(error, 'response', None)
                if getattr(response, 'status_code', None) != 429 or attempt == 2: raise
                retry = response.headers.get('Retry-After', '60')
                delay = max(60, int(retry)) if retry.isdigit() else 60
                if delay > 120 or time.monotonic() + delay >= deadline: raise RuntimeError('account audit rate limit') from None
                time.sleep(delay)
    for page in range(1, 101):
        kernels = read(api.kernels_list, mine=True, page=page, page_size=100)
        if kernels is None: raise RuntimeError('account audit unavailable')
        for kernel in kernels:
            state = read(api.kernels_status, kernel=kernel.ref).status.name
            if state not in ACTIVE | TERMINAL: raise RuntimeError('unknown account state')
            active += state in ACTIVE
        if len(kernels)<100: return active
    raise RuntimeError('account audit exceeds limit')

def execute(api, request):
    action = request['action']
    user = api.config_values['username']
    ref = user+'/'+request['name']
    if action in ('preflight','launch'):
        if audit(api)>=5: raise RuntimeError('no account capacity')
    if action == 'preflight': return {'remoteId':ref}
    if action == 'launch':
        folder = Path(request['folder'])
        metadata = dict(id=ref,title=request['name'],code_file='run.py',language='python',kernel_type='script',is_private=True,enable_gpu=False,enable_tpu=False,enable_internet=True,dataset_sources=[],kernel_sources=[],competition_sources=[],model_sources=[])
        (folder/'kernel-metadata.json').write_text(json.dumps(metadata))
        reply = api.kernels_push(str(folder), timeout='28800')
        if reply.error or reply.ref != ref: raise RuntimeError('submission not confirmed')
        return {'remoteId':ref}
    if action == 'status':
        state = api.kernels_status(ref).status.name
        return {'remoteId':ref,'state': 'complete' if state=='COMPLETE' else 'failed' if state in ('ERROR','CANCEL_ACKNOWLEDGED') else 'running' if state in ACTIVE else 'unknown'}
    if action == 'collect':
        # Audit names and sizes before the client opens any local destination.
        response = api.kernels_list_files(ref, page_size=100)
        files = response.files
        if getattr(response,'next_page_token',None): raise RuntimeError('too many output files')
        allowed = {'out/games.jsonl','out/status.json','out/attestation.json','out/supervisor.json','out/supervisor.log'}
        size = 0
        for file in files:
            if file.name not in allowed: continue
            size += file.size
        if size > 512*1024*1024: raise RuntimeError('output byte limit')
        api.kernels_output(ref, request['destination'], file_pattern=r'^out/(games\.jsonl|status\.json|attestation\.json|supervisor\.json|supervisor\.log)$', quiet=True)
        if sum(p.stat().st_size for p in Path(request['destination']).rglob('*') if p.is_file())>512*1024*1024:raise RuntimeError('Downloaded output byte limit')
        return {'remoteId':ref}
    raise RuntimeError('unknown action')

if __name__ == '__main__':
    try:
        request=json.load(sys.stdin)
        # The API may print raw service replies; only our schema reaches stdout.
        socket.setdefaulttimeout(30)
        resource.setrlimit(resource.RLIMIT_FSIZE,(512*1024*1024,512*1024*1024))
        with open(os.devnull,'w') as sink, contextlib.redirect_stdout(sink), contextlib.redirect_stderr(sink):
            from kaggle.api.kaggle_api_extended import KaggleApi
            api=KaggleApi();api.authenticate()
            result=execute(api,request)
        print(json.dumps(result))
    except BaseException:
        print(json.dumps({'error':'Kaggle operation failed; outcome may be unknown'}));sys.exit(1)
