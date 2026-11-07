import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import sharp from 'sharp';
import { expect, it } from 'vitest';

it('checks picked-base proof and the straight move speed rule', () => {
 const script = `
import json, pathlib, sys, tempfile
sys.path.insert(0, sys.argv[1])
import wrap_up_report as report
import wrap_up_strides as strides
selection = {'catalogSha256':'pin', 'entries':[{'kind':'move'}]}
proof = {'catalogSha256':'pin', 'faults':[], 'failed':{}, 'runtimePng':'pass',
         'framesWithNoPickColour':{'total':0}, 'selectionKinds':{'idle':0, 'turn':0, 'attack':0, 'move':1}}
with tempfile.TemporaryDirectory() as tmp:
 path = pathlib.Path(tmp)/'report.json'
 path.write_text(json.dumps(proof))
 assert report.picked_base_report(path, selection) == proof
 assert report.picked_base_report(None, selection) is None
 for field, bad in [('catalogSha256','other'), ('faults',['bad']), ('failed',{'walk':'bad'}),
                    ('runtimePng','fail'), ('framesWithNoPickColour',{'total':1}), ('selectionKinds',{})]:
  path.write_text(json.dumps({**proof, field:bad}))
  try: report.picked_base_report(path, selection)
  except ValueError: pass
  else: raise AssertionError(field)
 assert strides.decide({'character':'ogre','facing':'N'}, {}, {}, {'kings':1.76})[0] == 1.0
 assert strides.decide({'character':'ogre','facing':'SW'}, {}, {}, {'kings':1.76})[0] == .76
 strides.prepare = lambda walks, work: (None, [])
 strides.method_a = lambda work: {'ogre/white/E':{'stride':1.41,'confidence':'high'}}
 strides.method_b = lambda work, runtime: {'ogre/white/E':{'stride':1.41,'confidence':'high'}}
 study = pathlib.Path(tmp)/'study.json'; study.write_text(json.dumps({'king-mud/white/E':{'stride':1}}))
 walk = {'character':'ogre','facing':'E'}
 assert strides.measure([walk], study, pathlib.Path(tmp))['walks']['ogre/white/E']['strideSquaresPerCycle'] == 1.41
 strides.method_b = lambda work, runtime: {}
 try: strides.measure([walk], study, pathlib.Path(tmp))
 except ValueError as error: assert 'under 520 ms' in str(error)
 else: raise AssertionError('one method must not set a short straight move')
`;
 expect(() => execFileSync('python3', ['-S', '-c', script, resolve('tools/anim')], { stdio: 'pipe' })).not.toThrow();
});


it('keeps black ogre SW skin smooth across the old mask edges in all four poses', async () => {
 const root = resolve('public/character-runtime');
 const manifest = JSON.parse(readFileSync(resolve(root, 'manifest.json'), 'utf8')) as {
  banks: { character: string; army: string; id: string; frames: { url: string }[] }[];
 };
 const banks = ['white', 'black'].map(army => manifest.banks.find(bank =>
  bank.character === 'ogre' && bank.army === army && bank.id === `${army}-walk-SW`)!);
 // Each pair has near-equal white shading. The old body-mask holes split it into light and dark skin.
 // The points sit on the belly skin of the first four poses of the eight-pose walk.
 const samples = [[210, 200], [220, 195], [200, 190], [220, 195]];
 for (const [pose, [x, y]] of samples.entries()) {
  const means: number[][] = [];
  for (const bank of banks) {
   const { data, info } = await sharp(resolve(root, bank.frames[pose].url)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
   expect([info.width, info.height]).toEqual([384, 384]);
   means.push([x, x + 3].map(column => {
    const offset = (y * info.width + column) * 4;
    expect(data[offset + 3]).toBeGreaterThan(250);
    return (data[offset] + data[offset + 1] + data[offset + 2]) / 3;
   }));
  }
  expect(Math.abs(means[0][0] - means[0][1])).toBeLessThan(8);
  expect(Math.abs(means[1][0] - means[1][1])).toBeLessThan(8);
  for (const value of means[1]) {
   expect(value).toBeGreaterThan(25);
   expect(value).toBeLessThan(115);
  }
 }
});
