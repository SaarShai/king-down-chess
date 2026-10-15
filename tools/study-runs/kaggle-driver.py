#!/usr/bin/env python3
"""Bounded Kaggle adapter. Keep this filename distinct from the SDK package."""
import contextlib, hashlib, json, os, sys, socket, resource, time, re
from pathlib import Path

ACTIVE = {'QUEUED','RUNNING','CANCEL_REQUESTED','NEW_SCRIPT'}
TERMINAL = {'COMPLETE','ERROR','CANCEL_ACKNOWLEDGED'}

def notebook_metadata(api, kernel):
    from kagglesdk.kernels.types.kernels_api_service import ApiGetKernelRequest
    owner, slug, version = api.parse_kernel_string(kernel)
    if version: raise RuntimeError('notebook identity unavailable')
    request = ApiGetKernelRequest()
    request.user_name = owner
    request.kernel_slug = slug
    with api.build_kaggle_client() as client:
        return client.kernels.kernels_api_client.get_kernel(request).metadata

def audit(api):
    active = 0
    deadline = time.monotonic() + 900
    def read(call, **kwargs):
        # Retry only read requests. A submission is never retried.
        for attempt in range(3):
            if time.monotonic() >= deadline: raise RuntimeError('account audit time limit')
            try:
                return call(**kwargs)
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
            if not kernel.ref:
                # The API includes empty placeholder records in full pages.
                if kernel.id == 0 and not kernel.author and not kernel.slug and kernel.current_version_number == 0: continue
                raise RuntimeError('notebook identity unavailable')
            try:
                state = read(api.kernels_status, kernel=kernel.ref).status.name
            except Exception as error:
                if getattr(getattr(error, 'response', None), 'status_code', None) != 404: raise
                # Draft-only notebooks have no batch session to query. The list
                # omits version fields, so verify the full notebook on a 404.
                metadata = read(notebook_metadata, api=api, kernel=kernel.ref)
                if metadata is None or metadata.id <= 0 or metadata.ref != kernel.ref or metadata.current_version_number != 0:
                    raise RuntimeError('notebook status unavailable') from None
                continue
            if state not in ACTIVE | TERMINAL: raise RuntimeError('unknown account state')
            active += state in ACTIVE
        if len(kernels)<100: return active
    raise RuntimeError('account audit exceeds limit')

def execute(api, request):
    action = request['action']
    user = api.config_values['username']
    ref = user+'/'+request['name']
    if action == 'launch':
        dataset_name = request['datasetName']
        if not isinstance(dataset_name,str) or not re.fullmatch(r'[a-z0-9][a-z0-9-]{5,49}',dataset_name): raise RuntimeError('invalid dataset identity')
        dataset_ref = user+'/'+dataset_name
        folder = Path(request['folder'])
        if (folder/'run.py').stat().st_size >= 1_000_000: raise RuntimeError('notebook source size limit')
        payload = folder/'payload'
        names = {'source.bin','bundle.bin','supervisor.bin','config.bin'}
        sidecars = {'._'+name for name in names | {'dataset-metadata.json'}}
        files = list(payload.iterdir())
        present = {p.name for p in files}
        if not names <= present or not present <= names | sidecars or any(p.is_symlink() or not p.is_file() or p.stat().st_size > 64*1024*1024 for p in files):
            raise RuntimeError('invalid dataset payload')
    if action in ('preflight','launch'):
        if audit(api)>=5: raise RuntimeError('no account capacity')
    if action == 'preflight': return {'remoteId':ref}
    if action == 'launch':
        (payload/'dataset-metadata.json').write_text(json.dumps(dict(id=dataset_ref,title=dataset_name,licenses=[{'name':'other'}],description='All rights reserved by the original authors. Private frozen run input; no permission to redistribute is granted.')))
        receipt = folder/'dataset-create.json'
        with receipt.open('x') as output:
            json.dump({'ref':dataset_ref,'state':'attempted'}, output)
        # The SDK retries dataset creation by default. Do not repeat a mutation.
        retry = api.with_retry
        upload = api._upload_file_or_folder
        def upload_payload(parent, name, *args, **kwargs):
            path = Path(parent)/name
            if Path(parent) != payload or path.is_symlink() or not path.is_file() or path.stat().st_size > 64*1024*1024:
                raise RuntimeError('invalid dataset payload')
            if name in sidecars: return None
            if name not in names: raise RuntimeError('invalid dataset payload')
            return upload(parent, name, *args, **kwargs)
        # The SDK enumerates hidden files too; upload only the frozen payload.
        api._upload_file_or_folder = upload_payload
        api.with_retry = lambda call, *args, **kwargs: call
        try:
            created = api.dataset_create_new(str(payload), public=False, quiet=True, convert_to_csv=False)
        finally:
            api.with_retry = retry
            api._upload_file_or_folder = upload
        # The SDK CLI uses status/url. A valid reply can omit ref.
        status = getattr(created, 'status', '').lower()
        reply_ref, url, error = created.ref, created.url, created.error
        identity = reply_ref in ('',dataset_ref) and url in ('','https://www.kaggle.com/datasets/'+dataset_ref) and bool(reply_ref or url)
        accepted = status == 'ok' and not error and identity
        rejected = status == 'error' and bool(error)
        receipt.write_text(json.dumps({'ref':dataset_ref,'state':'created' if accepted else 'rejected' if rejected else 'unknown',
            'status':status if status in ('ok','error') else 'unknown','refMatches':reply_ref==dataset_ref,
            'urlMatches':url=='https://www.kaggle.com/datasets/'+dataset_ref,'hasError':bool(error),
            'errorSha256':hashlib.sha256(error.encode()).hexdigest() if error else None,
            'errorCode':'invalid-license' if error == 'Please select a valid license' else None}))
        if not accepted: raise RuntimeError('dataset creation rejected' if rejected else 'dataset creation not confirmed')
        (folder/'dataset-receipt.json').write_text(json.dumps({'ref':dataset_ref,'state':'created'}))
        for attempt in range(6):
            status = api.dataset_status(dataset_ref)
            if status == 'ready':
                detail = json.loads(api.dataset_status(dataset_ref, format='json(current_version_number)'))
                if detail['current_version_number'] != 1: raise RuntimeError('dataset not ready')
                break
            if status not in ('not_yet_persisted','blobs_received','blobs_decompressed','blobs_copied_to_sds','individual_blobs_compressed','reprocessing') or attempt == 5:
                raise RuntimeError('dataset not ready')
            time.sleep(30)
        (folder/'dataset-receipt.json').write_text(json.dumps({'ref':dataset_ref,'state':'ready','version':1}))
        metadata = dict(id=ref,title=request['name'],code_file='run.py',language='python',kernel_type='script',is_private=True,enable_gpu=False,enable_tpu=False,enable_internet=True,dataset_sources=[dataset_ref],kernel_sources=[],competition_sources=[],model_sources=[])
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
    except BaseException as error:
        # Return only known local failures or an HTTP code, never a service body.
        http = getattr(getattr(error, 'response', None), 'status_code', None)
        known = {'account audit time limit', 'account audit rate limit', 'account audit unavailable', 'unknown account state', 'account audit exceeds limit', 'notebook identity unavailable', 'notebook status unavailable', 'no account capacity', 'submission not confirmed', 'notebook source size limit', 'invalid dataset payload', 'invalid dataset identity', 'dataset creation not confirmed', 'dataset creation rejected', 'dataset not ready'}
        message = f'HTTP {http}' if isinstance(http, int) and 400 <= http <= 599 else str(error) if type(error) is RuntimeError and str(error) in known else 'operation failed; outcome may be unknown'
        print(json.dumps({'error': message}))
