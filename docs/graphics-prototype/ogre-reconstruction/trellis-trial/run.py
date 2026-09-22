"""Approved three-view test through the Space's documented Gradio API.

Run with a scratch environment containing gradio_client. Uploads these three
Ogre references to trellis-community/TRELLIS; no credentials or paid endpoint.
"""
from pathlib import Path
from datetime import datetime, timezone
import hashlib
import json
import shutil
import sys
from gradio_client import Client, handle_file

HERE = Path(__file__).resolve().parent
INPUTS = [HERE.parent / f'{view}.png' for view in ('front', 'left', 'back')]
settings = dict(seed=0, ss_guidance_strength=7.5, ss_sampling_steps=12,
                slat_guidance_strength=3, slat_sampling_steps=12,
                multiimage_algo='stochastic', mesh_simplify=0.9,
                texture_size=1024)
record = dict(service='https://huggingface.co/spaces/trellis-community/TRELLIS',
              started=datetime.now(timezone.utc).isoformat(), settings=settings,
              inputs=[dict(name=p.name, sha256=hashlib.sha256(p.read_bytes()).hexdigest()) for p in INPUTS])
stage = 'connect'
try:
    client = Client('https://trellis-community-trellis.hf.space/',
                    verbose=False, httpx_kwargs={'timeout': 30},
                    download_files=str(HERE / 'response'))
    stage = 'start_session'
    client.predict(api_name='/start_session')
    stage = 'select_multiple_images'
    client.predict(api_name='/lambda_1')
    stage = 'preprocess_images'
    print('Uploading and preprocessing the three approved images.', flush=True)
    views = client.predict(images=[dict(image=handle_file(str(p)), caption=None) for p in INPUTS],
                           api_name='/preprocess_images')
    (HERE / 'preprocessed-response.json').write_text(json.dumps(views, indent=2))
    for view in views:
        if isinstance(view.get('image'), str):
            view['image'] = handle_file(view['image'])
        elif isinstance(view.get('image'), dict):
            view['image'] = handle_file(view['image']['path'])
    stage = 'generate_and_extract_glb'
    print('Requesting the multi-view mesh and GLB export.', flush=True)
    result = client.predict(image=None, multiimages=views, **settings,
                            api_name='/generate_and_extract_glb')
    record['result'] = result
    # The documented third output is the downloadable GLB.
    model = Path(result[2])
    if not model.is_file() or model.read_bytes()[:4] != b'glTF':
        raise RuntimeError('Service did not return a valid local GLB file.')
    shutil.copy2(model, HERE / 'ogre-original.glb')
    record['status'] = 'exported'
    record['glb_bytes'] = model.stat().st_size
    print('Exported GLB:', record['glb_bytes'], 'bytes.', flush=True)
except Exception as exc:
    record.update(status='failed', stage=stage, error_type=type(exc).__name__, error=str(exc))
    print(f'{stage}: {type(exc).__name__}: {exc}', flush=True)
finally:
    record['finished'] = datetime.now(timezone.utc).isoformat()
    (HERE / 'result.json').write_text(json.dumps(record, indent=2) + '\n')
sys.exit(0 if record['status'] == 'exported' else 1)
