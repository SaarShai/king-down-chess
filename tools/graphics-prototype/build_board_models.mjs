/** Derive board-distance GLBs without changing source sculpts or animation samples.
 * Locked primitive borders preserve the authored paint cuts. Meshopt compression is
 * lossless after simplification: no position, joint-weight or animation quantization.
 */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, EXTMeshoptCompression } from '@gltf-transform/extensions';
import { simplify, reorder } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptDecoder, MeshoptSimplifier } from 'meshoptimizer';
import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const folder=new URL('../../public/prototype/models/',import.meta.url);
await Promise.all([MeshoptEncoder.ready,MeshoptDecoder.ready,MeshoptSimplifier.ready]);
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
const triangles=doc=>doc.getRoot().listMeshes().reduce((sum,m)=>sum+m.listPrimitives().reduce((n,p)=>n+p.getIndices().getCount()/3,0),0);
const reports=[];
for(const name of (await readdir(folder)).filter(n=>/^rebuilt-.*\.glb$/.test(n)).sort()){
  const path=new URL(name,folder),bytes=await readFile(path),doc=await io.read(fileURLToPath(path)),before=triangles(doc);
  await doc.transform(simplify({simplifier:MeshoptSimplifier,ratio:.28,error:.0015,lockBorder:true}),reorder({encoder:MeshoptEncoder,target:'size'}));
  doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({method:EXTMeshoptCompression.EncoderMethod.QUANTIZE});
  const dest=new URL(name.replace('rebuilt-','board-'),folder);await io.write(fileURLToPath(dest),doc);
  const after=triangles(doc),report={character:name.slice(8,-4),sourceSha256:createHash('sha256').update(bytes).digest('hex'),sourceTriangles:before,boardTriangles:after,sourceBytes:bytes.length,boardBytes:(await stat(dest)).size,clips:doc.getRoot().listAnimations().map(a=>a.getName())};
  reports.push(report);console.log(JSON.stringify(report));
}
await writeFile(new URL('board-manifest.json',folder),JSON.stringify({method:'Meshoptimizer, 28% triangle target, 0.15% error cap, locked paint borders; lossless Meshopt encoding',models:reports},null,2)+'\n');
