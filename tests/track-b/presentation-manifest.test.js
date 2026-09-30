'use strict';
// TRACK B / PW-1 evidence: presentation manifest guard - the fail-closed
// binding layer between authority and presentation (production-world track).
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),
 ROOT=path.join(__dirname,'../..'),VS=path.join(ROOT,'visual-slice');
async function load(){const g=await import(path.join(VS,'package','presentation-guard.mjs'));
 const manifest=JSON.parse(fs.readFileSync(path.join(VS,'presentation-manifest.json'),'utf8'));
 const map=JSON.parse(fs.readFileSync(path.join(VS,'entity-body-map.json'),'utf8'));
 const bundle=JSON.parse(fs.readFileSync(path.join(VS,'scene-bundle.json'),'utf8'));
 const defBytes=fs.readFileSync(path.join(ROOT,'src','clean-runtime','school','definitions','synthetic-training-unit-v1.js'));
 return{g,manifest,map,worldDigest:bundle.inputs.worldStateDigest,
  expectedUnitDefinitionSha256:crypto.createHash('sha256').update(defBytes).digest('hex'),
  sha256hex:s=>crypto.createHash('sha256').update(s).digest('hex')}}
test('Phase A manifest validates against the real entity map + pinned world digest',async()=>{
 const{g,manifest,map,worldDigest,expectedUnitDefinitionSha256,sha256hex}=await load();
 const r=g.validatePresentationManifest(manifest,{map,worldDigest,expectedUnitDefinitionSha256,sha256hex});
 assert.equal(r.ok,true,r.reason);
 assert.equal(r.bound.length,5);
 assert(r.bound.includes('synthetic-training-unit-v1'));});
test('negatives: stale world, unknown physical entity, invented transform, authoritative decoration, unpinned file asset, bad vw- namespace, duplicate visual id',async()=>{
 const{g,manifest,map,worldDigest,expectedUnitDefinitionSha256,sha256hex}=await load();
 const m=x=>structuredClone(x),V=(x,o={})=>g.validatePresentationManifest(x,{map,worldDigest,expectedUnitDefinitionSha256,sha256hex,...o});
 const stale=m(manifest);stale.sceneRef.authoritativeWorldDigest='0'.repeat(64);
 assert.match(V(stale).reason,/STALE_WORLD/);
 const unknown=m(manifest);unknown.entities[0].physicalEntityId='no-such-entity';
 assert.match(V(unknown).reason,/unknown physicalEntityId/);
 const invented=m(manifest);invented.entities[0].transformSource='presentation-computed';
 assert.match(V(invented).reason,/never invents transforms/);
 const deco=m(manifest);deco.entities[0].physicsAuthoritative=true;
 assert.match(V(deco).reason,/never authoritative/);
 const unpinned=m(manifest);unpinned.entities[0].assetRef={kind:'file',source:'assets/chair.glb'};
 assert.match(V(unpinned).reason,/SHA-256 pin/);
 const badNs=m(manifest);badNs.entities[0].visualEntityId='casualty';
 assert.match(V(badNs).reason,/vw- namespaced/);
 const dup=m(manifest);dup.entities[1].visualEntityId=dup.entities[0].visualEntityId;
 assert.match(V(dup).reason,/duplicate visualEntityId/);});
test('manifest pins the COMMITTED bundle world digest (what Pages serves)',async()=>{
 const{manifest,worldDigest}=await load();
 assert.equal(manifest.sceneRef.authoritativeWorldDigest,worldDigest);
 assert.match(manifest.sceneRef.authoritativeWorldDigest,/^[a-f0-9]{64}$/);});
