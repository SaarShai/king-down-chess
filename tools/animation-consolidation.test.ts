import { spawnSync } from 'node:child_process';
import { createServer, type Server } from 'node:http';
import { mkdtemp, readFile, rm, copyFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Browser } from 'playwright';
import { beforeAll, afterAll, expect, it } from 'vitest';
import { launch } from './lib/checks.mjs';

const script = fileURLToPath(new URL('./consolidate_animation_banks.py', import.meta.url));
const viewer = fileURLToPath(new URL('../docs/specs/character-animation-samples/preview/consolidated-animations/', import.meta.url));
let folder: string, server: Server, browser: Browser, origin: string, evidence: string;

beforeAll(async () => {
  folder = await mkdtemp(join(tmpdir(), 'kingdown-consolidation-'));
  const result = spawnSync('python3', ['-B', '-c', `
import copy,importlib.util,json,sys
from pathlib import Path
from PIL import Image,ImageDraw
root=Path(sys.argv[2]);sys.path.insert(0,str(Path(sys.argv[1]).parent))
spec=importlib.util.spec_from_file_location('consolidate',sys.argv[1]);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
worker=root/'worker';worker.mkdir();out=root/'published'
def png(name,kind='valid',x=8):
 p=worker/(name+'.png');im=Image.new('RGBA',(64,64))
 if kind=='opaque': im.putalpha(255)
 elif kind=='clipped': ImageDraw.Draw(im).rectangle((0,12,20,40),fill=(220,80,20,255))
 elif kind=='valid': ImageDraw.Draw(im).rectangle((x,12,x+12,40),fill=(220,80,20,255))
 im.save(p);return p
first=png('first');second=png('second',x=40);blank=png('blank','blank');opaque=png('opaque','opaque');clipped=png('clipped','clipped')
def frame(p,time): return {'imagePath':str(p),'imageUrl':str(p),'url':str(p),'path':str(p),'sha256':m.digest(p.read_bytes()),'timeMs':time,'cue':'keep this'}
def entry(name,status='ready',p=first):
 bank={'id':name,'character':'guard','army':'white','kind':'turn','status':'ready','durationMs':1000,'canvasSize':[64,64],'footPivot':[32,60],'beatTimes':{'hit':500},'frames':[frame(p,0),frame(second,500)],'reverseFrames':[frame(second,0),frame(p,500)],'effects':[frame(blank,0)]}
 if name=='waiting':
  bank['reverseFrames']=[str(second),str(p)];bank['effects']={'smoke':'independent cue; no runtime image'}
  bank['frames'][0]['visibleIntervalMs']=[0,500];bank['frames'][1]['timeMs']=1000;bank['frames'][1]['visibleIntervalMs']=[500,1000]
 if name=='draft': bank['entryFrames']=[frame(p,0)];bank['settleFrames']=[frame(second,0)]
 if name=='missing': bank['frames']=[];bank['reverseFrames']=[];bank['effects']=[]
 if name=='repair': bank['army']='black'
 if name=='nearest': bank['frames'][1]['timeMs']=1000;bank['selectedSchedule']={'sampling':'index = Math.round(progress * (frameCount - 1)); linear progress per adjacent edge','previewCycle':{'startHoldMs':300,'forwardMs':1000,'endHoldMs':350,'reverseMs':1000,'finalHoldMs':300}}
 if name=='source-draft': bank['status']='draft'
 if name=='legacy-ready': bank['status']='accepted-transparent-recovery'
 path=worker/(name+'.json');path.write_bytes(m.encoded(bank))
 return {'character':'guard','army':bank['army'],'kind':'turn','status':status,'manifestPath':str(path),'manifestSha256':m.digest(path.read_bytes()),'defects':['known seam'] if status=='needs-repair' else []}
rows=[entry('ready'),entry('waiting','awaiting-human-playback-review'),entry('repair','needs-repair'),entry('blank-ready',p=blank),entry('opaque-ready',p=opaque),entry('clipped-repair','needs-repair',clipped),entry('draft','draft'),entry('missing','missing'),entry('nearest')]
report=root/'report.json';report.write_bytes(m.encoded({'entries':rows}))
summary=m.consolidate([report],out);catalog=json.loads((out/'manifest.json').read_bytes());assert summary['entries']==9
assert [e['status'] for e in catalog['entries']]==['ready','awaiting-human-playback-review','needs-repair','needs-repair','needs-repair','needs-repair','draft','missing','ready']
assert any('blank frames' in d for d in catalog['entries'][3]['defects'])
assert any('fully opaque' in d for d in catalog['entries'][4]['defects'])
assert any('canvas border' in d for d in catalog['entries'][5]['defects'])
assert catalog['entries'][2]['defects']==['known seam']
waiting=json.loads((out/catalog['entries'][1]['manifest']).read_bytes())
assert all(url.startswith('../assets/') for url in waiting['reverseFrames'])
assert waiting['effects']=={'smoke':'independent cue; no runtime image'}
draft=json.loads((out/catalog['entries'][6]['manifest']).read_bytes())
assert all(f['url'].startswith('../assets/') for group in ['entryFrames','settleFrames'] for f in draft[group])
assert not json.loads((out/catalog['entries'][7]['manifest']).read_bytes())['frames']
strict=root/'strict.json';strict.write_bytes(m.encoded({'entries':[entry('source-draft')]}));m.consolidate([strict],root/'strict-output')
assert json.loads((root/'strict-output'/'manifest.json').read_bytes())['entries'][0]['status']=='draft'
legacy=root/'legacy.json';legacy.write_bytes(m.encoded({'entries':[entry('legacy-ready')]}));m.consolidate([legacy],root/'legacy-output')
assert json.loads((root/'legacy-output'/'manifest.json').read_bytes())['entries'][0]['status']=='ready'
bankfile=out/catalog['entries'][0]['manifest'];frozen=json.loads(bankfile.read_bytes())
assert frozen['footPivot']==[32,60] and frozen['beatTimes']=={'hit':500}
assert [f['timeMs'] for f in frozen['frames']]==[0,500]
for group in ['frames','reverseFrames','effects']:
 for f in frozen[group]:
  assert all(f[k]==f['url'] for k in ['imagePath','imageUrl','path']) and f['url'].startswith('../assets/')
  assert m.digest((bankfile.parent/f['url']).read_bytes())==f['sha256'] and f['cue']=='keep this'
source=out/catalog['entries'][0]['sourceManifest'];assert source.read_bytes()==Path(rows[0]['manifestPath']).read_bytes()
original=(out/'manifest.json').read_bytes();assert m.consolidate([report],out)['catalog']==summary['catalog']
assert (out/'manifest.json').read_bytes()==original
from publish_animation_reviews import publish
review=root/'review.json';review.write_bytes(m.encoded({'reviewType':'agent-visual','reviewer':'Fixture review','entries':[{'bankSha256':catalog['entries'][1]['sha256'],'status':'ready','observations':['Reviewed fixture contour'],'evidencePaths':[str(report)]}]}))
publish(out/'manifest.json',review);reviewed=(out/'manifest.json').read_bytes();m.consolidate([report],out)
assert (out/'manifest.json').read_bytes()==reviewed,'reimport erased reviewed status'
(out/'manifest.json').write_bytes(original)
def rejected(needle):
 try: m.consolidate([report],out);raise AssertionError('bad selection accepted')
 except ValueError as error: assert needle in str(error),str(error)
 assert (out/'manifest.json').read_bytes()==original
saved=Path(rows[0]['manifestPath']).read_bytes();Path(rows[0]['manifestPath']).write_bytes(saved+b' ');rejected('manifest hash differs');Path(rows[0]['manifestPath']).write_bytes(saved)
frozen_png=bankfile.parent/frozen['frames'][0]['url'];png_bytes=frozen_png.read_bytes();first.write_bytes(opaque.read_bytes());rejected('frame hash differs')
assert frozen_png.read_bytes()==png_bytes and bankfile.read_bytes()==m.encoded(frozen)
frozen_png.write_bytes(b'corrupt');first.write_bytes(png_bytes);rejected('frozen bytes differ');frozen_png.write_bytes(png_bytes)
print('OK: exact immutable copies, hash mismatch rejection, retained status/timing/provenance, blank/opaque/clipped diagnostics, local URLs')
`, script, folder], { encoding: 'utf8', timeout: 30_000 });
  expect(result.error, result.stderr).toBeUndefined();
  expect(result.status, result.stdout + result.stderr).toBe(0);
  evidence = result.stdout;
  for (const name of ['index.html', 'viewer.js']) await copyFile(join(viewer, name), join(folder, 'published', name));
  server = createServer((request, response) => {
    const path = resolve(folder, 'published', '.' + decodeURIComponent(new URL(request.url!, 'http://localhost').pathname));
    if (!path.startsWith(join(folder, 'published') + sep)) { response.writeHead(403).end(); return; }
    void readFile(path).then(body => response.writeHead(200, { 'Content-Type': path.endsWith('.js') ? 'text/javascript' : path.endsWith('.json') ? 'application/json' : path.endsWith('.png') ? 'image/png' : 'text/html' }).end(body), () => response.writeHead(404).end());
  });
  await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
  origin = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  browser = await launch({ headless: true, channel: process.env.PLAYABLE_BROWSER || 'chromium' });
}, 40_000);

afterAll(async () => {
  await browser?.close();
  if (server) await new Promise<void>(done => server.close(() => done()));
  if (folder) await rm(folder, { recursive: true, force: true });
});

it('freezes exact selected bytes and keeps review gates', () => { expect(evidence).toContain('OK: exact immutable copies'); });

it('loads frozen URLs, clears previous pixels, and filters review status', async () => {
  const page = await browser.newPage(), requests: string[] = [];
  page.on('request', request => { if (request.url().endsWith('.png')) requests.push(request.url()); });
  try {
    await page.goto(origin + '/index.html');
    await expect.poll(() => page.locator('#play').isEnabled()).toBe(true);
    const pixels = () => page.locator('canvas').evaluate(element => {
      const ctx = (element as HTMLCanvasElement).getContext('2d')!;
      return [ctx.getImageData(12, 20, 1, 1).data[3], ctx.getImageData(44, 20, 1, 1).data[3], ctx.getImageData(0, 0, 1, 1).data[3]];
    });
    expect(await pixels()).toEqual([255, 0, 0]);
    await page.locator('#seek').evaluate(element => { (element as HTMLInputElement).value = '500'; element.dispatchEvent(new Event('input')); });
    expect(await pixels()).toEqual([0, 255, 0]);
    expect(requests.every(url => /\/assets\/[a-f0-9]{64}\.png$/.test(url))).toBe(true);
    expect(requests.length).toBeGreaterThan(1);
    await page.locator('#status').selectOption('awaiting-human-playback-review');
    await expect.poll(() => page.locator('#play').isEnabled()).toBe(true);
    await page.locator('#seek').evaluate(element => { (element as HTMLInputElement).value = '750'; element.dispatchEvent(new Event('input')); });
    expect(await pixels()).toEqual([0, 255, 0]);
    await page.locator('#status').selectOption('ready');
    await page.locator('#action').selectOption('8');
    await expect.poll(() => page.locator('#play').isEnabled()).toBe(true);
    await page.locator('#seek').evaluate(element => { (element as HTMLInputElement).value = '750'; element.dispatchEvent(new Event('input')); });
    expect(await pixels()).toEqual([0, 255, 0]);
    await page.locator('#status').selectOption('needs-repair');
    expect(await page.locator('#action option').count()).toBe(4);
    expect(await page.locator('#bank-status').textContent()).toBe('Needs repair');
    await page.locator('#army').selectOption('black');
    await page.locator('#status').selectOption('ready');
    expect(await page.locator('#action option').count()).toBe(0);
    expect(await page.locator('#play').isEnabled()).toBe(false);
    expect(await page.locator('#details').isHidden()).toBe(true);
    expect(await pixels()).toEqual([0, 0, 0]);
    await page.locator('#background').selectOption('dark');
    expect(await page.locator('#stage').getAttribute('data-background')).toBe('dark');
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  } finally { await page.close(); }
}, 30_000);


it('restores reviewed deep links and preserves the recorded turn cycle after scrubbing', async () => {
  const page = await browser.newPage();
  try {
    await page.addInitScript(() => {
      let now = 0, callback: FrameRequestCallback;
      performance.now = () => now;
      window.requestAnimationFrame = cb => { callback = cb; return 1; };
      Object.assign(window, { advanceAnimation: (time: number) => { now = time; callback(time); } });
    });
    await page.goto(origin + '/index.html?character=guard&army=white&id=nearest&status=awaiting-human-playback-review');
    await expect.poll(() => page.locator('#play').isEnabled()).toBe(true);
    expect(await page.locator('canvas').getAttribute('aria-label')).toBe('guard, white, nearest');
    expect(await page.locator('#status').inputValue()).toBe('ready');
    expect(new URL(page.url()).searchParams.get('character')).toBe('guard');
    expect(new URL(page.url()).searchParams.get('army')).toBe('white');
    const advance = async (time: number) => {
      await page.evaluate(value => (window as unknown as { advanceAnimation(time: number): void }).advanceAnimation(value), time);
      return Number(await page.locator('#seek').inputValue());
    };
    await page.locator('#play').click();
    expect(await advance(200)).toBe(0);
    expect(await advance(900)).toBe(600);
    expect(await advance(1600)).toBe(1000);
    expect(await advance(2400)).toBe(250);
    await page.locator('#seek').evaluate(element => { (element as HTMLInputElement).value = '500'; element.dispatchEvent(new Event('input')); });
    await page.locator('#play').click();
    expect(await advance(2500)).toBe(400);
    expect(await advance(3000)).toBe(0);
    await page.locator('#seek').evaluate(element => { (element as HTMLInputElement).value = '500'; element.dispatchEvent(new Event('input')); });
    await page.locator('#play').click();
    expect(await advance(3000)).toBe(500);
    expect(await advance(3100)).toBe(600);
  } finally { await page.close(); }
}, 30_000);
