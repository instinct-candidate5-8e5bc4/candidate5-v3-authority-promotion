'use strict';
// TRACK B / PW-1 build step: emits visual-slice/presentation-manifest.json -
// the Phase A binding manifest. Every current debug mesh is registered as a
// procedural asset bound to its authoritative physical entity. The world
// digest pin comes from the COMMITTED scene bundle (what Pages serves).
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ROOT=path.join(__dirname,'../..'),VS=path.join(ROOT,'visual-slice');
const bundle=JSON.parse(fs.readFileSync(path.join(VS,'scene-bundle.json'),'utf8'));
const map=JSON.parse(fs.readFileSync(path.join(VS,'entity-body-map.json'),'utf8'));
const bind=(physicalEntityId,visualEntityId,builder)=>({physicalEntityId,visualEntityId,assetRef:{kind:'procedural',source:'renderer-package.mjs#'+builder},transformSource:'authoritative',physicsAuthoritative:false});
const unitDefBytes=fs.readFileSync(path.join(ROOT,'src','clean-runtime','school','definitions','synthetic-training-unit-v1.js'));
const unitDefinitionSha256=crypto.createHash('sha256').update(unitDefBytes).digest('hex');
const manifest={kind:'TRACK_B_PRESENTATION_MANIFEST',manifestVersion:'0.2.0',
 sceneRef:{definitionId:'SCHOOL_TREATMENT_ROOM',authoritativeWorldDigest:bundle.inputs.worldStateDigest},
 policy:'Presentation never invents positions/supports/collisions; decorative meshes are never authoritative unless separately certified; missing asset = loud labeled placeholder, never silent fallback; ZERO-COST is a permanent project constraint (owner directive 2026-09-30): procedural, in-project custom, CC0, or verified-free assets only, every external asset with explicit provenance/license evidence before entering the approved pipeline; $0 never lowers the production-quality target - each scene must be unmistakably recognizable (owner clarification + zero-cost directive 2026-09-30).',
 entities:[
  bind('school-casualty-adult-v1','vw-school-casualty-adult','bindGroup:casualty'),
  bind('school-treatment-chair','vw-school-treatment-chair','bindGroup:chair'),
  bind('school-medical-bag','vw-school-medical-bag','bindGroup:bag'),
  bind('school-treatment-room-v1','vw-school-treatment-room','roomSurfaces'),
  (()=>{const e=bind('synthetic-training-unit-v1','vw-synthetic-training-unit','mountSyntheticUnit');
   e.assetRef.pinned={assetBindingVersion:'1.0.0',unitDefinitionSha256,bindingDigest:null};
   e.assetRef.pinned.bindingDigest=crypto.createHash('sha256').update(JSON.stringify({...e.assetRef.pinned,bindingDigest:undefined})).digest('hex');
   return e})()],
 lighting:{rigRef:'procedural:renderer-package.mjs#lighting',shadowPolicy:'PCFSoftShadowMap'}};
manifest.manifestDigest=crypto.createHash('sha256').update(JSON.stringify({...manifest,manifestDigest:undefined})).digest('hex');
fs.writeFileSync(path.join(VS,'presentation-manifest.json'),JSON.stringify(manifest,null,1));
console.log('READY presentation-manifest.json',manifest.manifestDigest.slice(0,12));
