// TRACK B / B-W10: embeddable READ-ONLY renderer package.
// The root game shell mounts this module and feeds it bounded public
// projections (contract v0.2 lineage). It renders committed results and
// validates placements propose-only. It exports NO mutation/commit surface:
// the demo page's createDemoSession commit path is NOT part of this package.
// Two-engines boundary (ED-P2-02 downstream-only): visuals never feed
// authoritative state; animation/presentation is never a medical result.
// Claim gate: "connected" only when the running shell consumes this package.
import * as THREE from 'three';
import {buildProceduralRoom} from './procedural-room.mjs';
import {validatePresentationManifest} from './presentation-guard.mjs';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import * as ENGINE from '../engine-bundle.js';
import {buildArticulatedLayout} from '../articulated-layout.mjs';
import {fitCameraToAabb} from '../camera-lighting.mjs';
import {validateMap,resolveEntity} from '../entity-map.mjs';
import {validateProjection} from './projection-guard.mjs';
import {validateCommittedWorldProjection} from './committed-world-guard.mjs';
import {sha256} from '../engine/vendor/js-sha256.mjs';
export const PACKAGE_API_VERSION='1.1.0';
const U=1e6,m=v=>v/U;
const LOCATION_TARGETS=Object.freeze({INITIAL:null,FLOOR_BESIDE_CHAIR:[-1200000,175000,1000000]});
let inst=null;
let syn=null; // module-scoped: status()/unmount() read it outside mount // single active mount
async function fetchJson(url){const r=await fetch(url);if(!r.ok)throw new Error('fetch '+url+': '+r.status);return r.json()}
function partMesh(part,colorHex,mat={}){
 let g;
 if(part.shape==='sphere')g=new THREE.SphereGeometry(m(part.radius),28,20);
 else if(part.shape==='capsuleZ'||part.shape==='capsuleY')g=new THREE.CapsuleGeometry(m(part.radius),m(part.cylinderLength),8,20);
 else g=new THREE.BoxGeometry(m(part.aabb.maxX-part.aabb.minX),m(part.aabb.maxY-part.aabb.minY),m(part.aabb.maxZ-part.aabb.minZ));
 const mesh=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:parseInt(part.colorHex||colorHex),roughness:mat.roughness??.65,metalness:mat.metalness??.05}));
 if(part.shape==='capsuleZ')mesh.rotation.x=Math.PI/2;
 if(part.shape==='box')mesh.position.set(m((part.aabb.minX+part.aabb.maxX)/2),m((part.aabb.minY+part.aabb.maxY)/2),m((part.aabb.minZ+part.aabb.maxZ)/2));
 else mesh.position.set(...part.center.map(m));
 mesh.castShadow=true;mesh.receiveShadow=true;
 mesh.userData.baseEmissive=mesh.material.emissive.getHex();
 return mesh}
// mount(container, opts): opts.bindingTable {publicRef->entityId} (host-owned,
// session-scoped per contract), opts.width/height optional.
// Returns {ok:true}|{ok:false,reason}; never throws across the boundary.
export async function mount(container,opts={}){
 if(inst)return{ok:false,reason:'already mounted - unmount() first'};
 try{
  if(!container||!container.appendChild)return{ok:false,reason:'container missing'};
  const base=new URL('..',import.meta.url);
  const [bundle,map,presentationManifest,statuses,manifest,build]=await Promise.all([
   fetchJson(new URL('scene-bundle.json',base)),fetchJson(new URL('entity-body-map.json',base)),fetchJson(new URL('presentation-manifest.json',base)).catch(()=>null),
   fetchJson(new URL('package/gate-statuses.json',base)),fetchJson(new URL('package/asset-manifest.json',base)),
   fetchJson(new URL('package/package-build.json',base))]);
  const mapCheck=validateMap(map);
  if(!mapCheck.ok)return{ok:false,reason:'entity-body-map invalid: '+mapCheck.errors[0]};
  const syntheticUnitGateA=(map.entities['synthetic-training-unit-v1']||{}).gateAStatus||'UNKNOWN';
  const syntheticUnitRegistryAdmission=(map.entities['synthetic-training-unit-v1']||{}).registryAdmission||'UNKNOWN';
  if(build.apiVersion!==PACKAGE_API_VERSION)return{ok:false,reason:'package build/api version mismatch'};
  // Same fail-closed engine gates as the standalone demo: the package renders
  // ONLY from the certified committed state.
  const live=ENGINE.buildVisualSceneDescriptor();
  const fail=r=>({ok:false,reason:'ENGINE FAIL-CLOSED: '+r});
  if(!live||live.status!=='COMMITTED')return fail('descriptor status '+(live&&live.status));
  if(live.sourcePackage.scenePackageDigest!==ENGINE.EXPECTED.packageDigest)return fail('package digest mismatch');
  if(live.worldRef.stateDigest!==ENGINE.EXPECTED.worldDigest)return fail('world digest mismatch');
  if(live.worldRef.replayMatchesCommittedState!==true)return fail('replay mismatch');
  if(live.descriptorDigest!==ENGINE.EXPECTED.nodeDescriptorDigest)return fail('browser descriptor != Node descriptor');
  const liveCasualty=ENGINE.buildVisualCasualty(live);
  if(!liveCasualty||liveCasualty.status!=='DIMENSIONED_TO_CERTIFIED_ENVELOPE'||liveCasualty.visualDigest!==bundle.inputs.casualtyDigest)return fail('casualty build mismatch');
  const liveEquipment=ENGINE.buildVisualEquipment(live);
  if(!liveEquipment||liveEquipment.status!=='DIMENSIONED_TO_CERTIFIED_BODIES')return fail('equipment build mismatch');
  if(liveEquipment.visualDigest!==bundle.inputs.equipmentDigest)return fail('equipment digest mismatch');
  // In-browser manifest verification: every local asset hashed live.
  let manifestOk=true,manifestDetail=[];
  for(const a of manifest.assets){
   if(a.external){manifestDetail.push({path:a.url,external:true});continue}
   try{const buf=await (await fetch(new URL(a.path,base))).arrayBuffer();
    const hex=sha256.hex(new Uint8Array(buf));
    const ok=hex===a.sha256&&buf.byteLength===a.bytes;
    if(!ok)manifestOk=false;
    manifestDetail.push({path:a.path,ok});}catch(e){manifestOk=false;manifestDetail.push({path:a.path,ok:false,error:String(e)})}
  }
  // Scene
  const w=opts.width||container.clientWidth||960,h=opts.height||container.clientHeight||600;
  const renderer=new THREE.WebGLRenderer({antialias:true});
  // PW-3: filmic tone mapping + rig exposure - interior clinical light character.
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=bundle.lighting.exposure??1.0;
  renderer.setSize(w,h);renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);
  const scene=new THREE.Scene();scene.background=new THREE.Color(0x101a20);scene.fog=new THREE.Fog(0x101a20,18,42);
  const camera=new THREE.PerspectiveCamera(bundle.camera.fovDegrees,w/h,.05,120);
  const envU=bundle.casualty.worldEnvelopeMicrounits;
  const casualtyEnv=Object.fromEntries(Object.entries(envU).map(([k,v])=>[k,m(v)]));
  const authoredPos=bundle.camera.positionMicrounits.map(m),lookAt=bundle.camera.lookAtMicrounits.map(m);
  const fit=fitCameraToAabb(casualtyEnv,authoredPos,lookAt,bundle.camera.fovDegrees,w/h,0.08);
  camera.position.set(...fit.position);camera.updateProjectionMatrix();
  const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(...lookAt);controls.update();
  const box=(aabb,colorHex,o={})=>{const sx=m(aabb.maxX-aabb.minX),sy=m(aabb.maxY-aabb.minY),sz=m(aabb.maxZ-aabb.minZ);
   const mesh=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),new THREE.MeshStandardMaterial({color:parseInt(colorHex),roughness:o.roughness??.85,metalness:.05}));
   mesh.position.set(m(aabb.minX)+sx/2,m(aabb.minY)+sy/2,m(aabb.minZ)+sz/2);mesh.receiveShadow=true;return mesh};
  // PW-2: production room skin when the presentation manifest validates against
  // the committed world digest; otherwise the certified debug boxes render with a
  // LOUD placeholder line (never a silent fallback).
  const pmCheck=presentationManifest?validatePresentationManifest(presentationManifest,{map,worldDigest:bundle.inputs.worldStateDigest}):{ok:false,reason:'presentation-manifest.json unavailable'};
  if(pmCheck.ok){scene.add(buildProceduralRoom(THREE,bundle.room))}
  else{for(const s of bundle.room)scene.add(box(s.geometryMicrounits,s.visualOnlyClaims.colorHex))}
  const layout=buildArticulatedLayout(liveCasualty,liveEquipment);
  // DOM/mesh binding registry: entityId -> componentId -> meshes[].
  // Certified bodies come from the B-W5 map; unknown entity = no meshes.
  const bindings={};
  const bindGroup=(entityId,group,roughness)=>{
   const entry=resolveEntity(map,entityId);if(!entry)return;
   const gm={};
   for(const g of layout[group]){gm[g.componentId]=[];
    for(const part of g.parts){const mesh=partMesh(part,g.colorHex,{roughness});gm[g.componentId].push(mesh);scene.add(mesh)}}
   bindings[entityId]={entry,componentMeshes:gm,group}};
  bindGroup('school-casualty-adult-v1','casualty',.6);
  bindGroup('school-treatment-chair','chair',.55);
  bindGroup('school-medical-bag','bag',.5);

  // B-W11 bridge (contract v0.3): parametric synthetic training unit.
  // Presentation-only: the six physical records are ADMITTED_BY_OWNER_R1
  // (evidence r1-owner-signoff); visual asset admission stays R2/R3 (entry
  // presentationOnly). Renders at the proposed R1 v3 anchor
  // (bag top, bag-local [0,235000,0] from committed bag position). The unit
  // FOLLOWS the bag on location actions. Its materials are authored per
  // render call and never cache committed truth.
  function mountSyntheticUnit(){
   const entry=map.entities['synthetic-training-unit-v1'];
   if(!entry||!entry.boundsMicrounits)return;
   const b=entry.boundsMicrounits,sx=m(b.maxX-b.minX),sy=m(b.maxY-b.minY),sz=m(b.maxZ-b.minZ);
   const grp=new THREE.Group();
   const unitMesh=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),new THREE.MeshStandardMaterial({color:0x22cc55,emissive:0x000000,metalness:.05,roughness:.7}));
   unitMesh.name='synthetic-training-unit-v1';
   grp.add(unitMesh);
   const marker=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(sx,sy,sz)),new THREE.LineBasicMaterial({color:0x888888}));
   marker.name='uncertified-marker';marker.visible=false;grp.add(marker);
   const c=document.createElement('canvas');c.width=640;c.height=80;
   const ctx=c.getContext('2d');ctx.fillStyle='#0a3018';ctx.fillRect(0,0,640,80);
   ctx.fillStyle='#7dffb0';ctx.font='bold 30px system-ui';ctx.textAlign='center';
   ctx.fillText('SYNTHETIC TRAINING UNIT',320,34);
   ctx.font='24px system-ui';ctx.fillText('UNCERTIFIED - B-W11 interim',320,66);
   const label=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),depthTest:true}));
   label.name='uncertified-label';label.scale.set(.6,.075,1);label.position.set(0,sy/2+.08,0);grp.add(label);
   // Anchor: committed bag position + proposed R1 v3 bag-local offset [0,235000,0].
   const bagPos=bundle.equipment.bag.authoritativeTransformMicrounits.positionMicrounits;
   const anchor=[bagPos[0],bagPos[1]+235000,bagPos[2]];
   grp.position.set(m(anchor[0]),m(anchor[1])+(b.minY+b.maxY)/2/1e6,m(anchor[2]));
   scene.add(grp);
   const synOverlay=document.createElement('div');
   synOverlay.style.cssText='position:absolute;left:10px;top:96px;background:rgba(10,48,24,.92);color:#7dffb0;padding:5px 10px;font:12px/1.5 system-ui;border:1px solid #2d7a4d;max-width:340px;white-space:pre-line';
   synOverlay.textContent='SYNTHETIC TRAINING UNIT\nUNCERTIFIED - B-W11 interim presentation bridge (Gate A in flight)';
   container.appendChild(synOverlay);
   syn={group:grp,mesh:unitMesh,marker,label,overlay:synOverlay,useState:'AVAILABLE'};
  }
  mountSyntheticUnit();
  scene.add(new THREE.AmbientLight(parseInt(bundle.lighting.ambient.colorHex),bundle.lighting.ambient.intensity));
  const key=new THREE.DirectionalLight(parseInt(bundle.lighting.key.colorHex),bundle.lighting.key.intensity);
  key.position.set(...bundle.lighting.key.positionMicrounits.map(m));key.castShadow=true;scene.add(key);
  const fill=new THREE.DirectionalLight(parseInt(bundle.lighting.fill.colorHex),bundle.lighting.fill.intensity);
  fill.position.set(...bundle.lighting.fill.positionMicrounits.map(m));scene.add(fill);
  // PW-3: clinical ceiling fixture (visual-only claim from the served rig).
  if(bundle.lighting.ceiling){const ceil=new THREE.PointLight(parseInt(bundle.lighting.ceiling.colorHex),bundle.lighting.ceiling.intensity,0,1.6);
   ceil.position.set(...bundle.lighting.ceiling.positionMicrounits.map(m));scene.add(ceil)}
  // Overlay: honesty banner + detailed gate statuses + bounded finding panel.
  const overlay=document.createElement('div');
  overlay.style.cssText='position:absolute;top:0;left:0;right:0;padding:8px 12px;background:rgba(10,16,20,.92);border-bottom:2px solid #b8892d;font:12px/1.5 system-ui;color:#cfe3ee;pointer-events:none;z-index:5';
  overlay.innerHTML='<b>'+bundle.banner.title+'</b> — '+bundle.banner.warning+'<br>'+
   (bundle.banner.worldClassification?'<span style="color:#ffb84d">'+bundle.banner.worldClassification+'</span><br>':'')+
   (pmCheck.ok?'<span style="color:#7dc4ff">PRESENTATION LAYER (PW-2 room architecture) - bound to authoritative geometry; physics authority unchanged</span><br>':'<span style="color:#ff6a5e">PRESENTATION MANIFEST PLACEHOLDER: '+(presentationManifest?'invalid - '+pmCheck.reason:'unavailable')+' - rendering certified debug geometry</span><br>')+
   'Casualty: '+statuses.statuses.casualty.gate+' '+statuses.statuses.casualty.gateResult+' ('+statuses.statuses.casualty.reviewId+') · Chair: '+statuses.statuses.chair.gate+' '+statuses.statuses.chair.gateResult+' ('+statuses.statuses.chair.reviewId+')';
  const finding=document.createElement('div');
  finding.style.cssText='position:absolute;left:0;right:0;bottom:0;padding:8px 12px;background:rgba(8,14,18,.9);font:13px/1.5 system-ui;color:#ffe9b8;display:none;z-index:5;white-space:pre-wrap';
  finding.setAttribute('dir','auto');
  if(getComputedStyle(container).position==='static')container.style.position='relative';
  container.appendChild(overlay);container.appendChild(finding);
  const bagInitialPos=bundle.equipment.bag.authoritativeTransformMicrounits.positionMicrounits;
  const state={container,opts,renderer,scene,camera,controls,layout,map,statuses,manifest,build,manifestOk,manifestDetail,syntheticUnitGateA,syntheticUnitRegistryAdmission,pm:{ok:pmCheck.ok,bound:pmCheck.bound||null,reason:pmCheck.reason||null},
   bindings,finding,overlay,bagLocation:'INITIAL',bagInitialPos,lastCue:'NONE',disposed:false,
   loop:()=>{if(state.disposed)return;renderer.render(scene,camera)}};
  renderer.setAnimationLoop(state.loop);
  inst=state;
  return{ok:true};
 }catch(e){inst=null;return{ok:false,reason:String(e&&e.message||e)}}}
export function unmount(){
 if(!inst)return{ok:false,reason:'not mounted'};
 const s=inst;inst=null;s.disposed=true;
 s.renderer.setAnimationLoop(null);
 s.controls.dispose();s.renderer.dispose();
 s.renderer.domElement.remove();s.overlay.remove();s.finding.remove();
 if(syn&&syn.overlay)syn.overlay.remove();syn=null;
 return{ok:true}}
// renderFromProjection(boundedProjection): applies a validated projection.
// Reject = NO visual action at all. Cue is presentation metadata only; only
// entities[] drive the scene.
export function renderFromProjection(projection){
 if(!inst)return{applied:false,reason:'not mounted'};
 const v=validateProjection(projection,{bindingTable:inst.opts.bindingTable,map:inst.map,layout:inst.layout});
 if(!v.ok)return{applied:false,reason:v.reason};
 // Reset previous highlights (presentation state only).
 for(const b of Object.values(inst.bindings))for(const meshes of Object.values(b.componentMeshes))
  for(const mesh of meshes)mesh.material.emissive.setHex(mesh.userData.baseEmissive);
 inst.finding.style.display='none';inst.finding.textContent='';
 for(const a of v.actions){
  if(a.type==='useState'){
   // Synthetic unit only (guard enforces). Tint presents committed state; it never decides it.
   if(syn&&a.entityId==='synthetic-training-unit-v1'){
    syn.useState=a.code;
    syn.mesh.material.color.setHex(a.code==='AVAILABLE'?0x22cc55:a.code==='RESERVED'?0xcc7722:0x333333);
    syn.marker.visible=a.code!=='AVAILABLE'}
   continue}
  const b=inst.bindings[a.entityId];if(!b)return{applied:false,reason:'internal: bound entity missing meshes'};
  if(a.type==='highlight'){for(const c of a.componentIds)for(const mesh of b.componentMeshes[c]||[])mesh.material.emissive.setHex(0x6a5a12)}
  else if(a.type==='finding'){inst.finding.textContent=a.text;inst.finding.style.display='block'}
  else if(a.type==='pose'){/* SUPINE_FLOOR is the slice's only certified pose: the static scene already IS that pose. Recorded, no mesh change. */}
  else if(a.type==='location'&&a.entityId==='school-medical-bag'){
   const target=LOCATION_TARGETS[a.code];
   const from=LOCATION_TARGETS[inst.bagLocation]||inst.bagInitialPos;
   const to=target||inst.bagInitialPos;
   const delta=to.map((v2,i)=>v2-from[i]);
   for(const meshes of Object.values(b.componentMeshes))for(const mesh of meshes){mesh.position.x+=m(delta[0]);mesh.position.y+=m(delta[1]);mesh.position.z+=m(delta[2])}
   if(syn){syn.group.position.x+=m(delta[0]);syn.group.position.y+=m(delta[1]);syn.group.position.z+=m(delta[2])}
   inst.bagLocation=a.code}
 }
 inst.lastCue=v.cue;
 return{applied:true,cue:v.cue,actions:v.actions.map(a=>a.type+':'+a.entityId)}}

// renderPhysicalProjection(projection): R3 root-shell PHYSICAL session route.
// Accepts ONLY a committed-world projection (committed-world-guard.mjs,
// contract 1.0): whitelist-only, no cues, no inventory, no visual shaping.
// Applies committed transforms/use-states for entities on the guard's apply
// allowlist, cross-checked against the PINNED presentation-manifest binding.
// Fail-closed: any violation -> no visual action at all.
export function renderPhysicalProjection(projection){
 if(!inst)return{applied:false,reason:'not mounted'};
 const v=validateCommittedWorldProjection(projection,{bindingTable:inst.opts.bindingTable,map:inst.map,boundEntities:inst.pm&&inst.pm.ok?inst.pm.bound:null});
 if(!v.ok)return{applied:false,reason:v.reason};
 const applied=[];
 for(const a of v.actions){
  if(a.type==='committedTransform'&&a.entityId==='synthetic-training-unit-v1'&&syn){
   const entry=inst.map.entities['synthetic-training-unit-v1'];
   const b=entry.boundsMicrounits;
   syn.group.position.set(m(a.positionMicrounits[0]),m(a.positionMicrounits[1])+(b.minY+b.maxY)/2/1e6,m(a.positionMicrounits[2]));
   applied.push('committedTransform:'+a.entityId)}
  else if(a.type==='useState'&&a.entityId==='synthetic-training-unit-v1'&&syn){
   syn.useState=a.code;
   syn.mesh.material.color.setHex(a.code==='AVAILABLE'?0x22cc55:a.code==='RESERVED'?0xcc7722:0x333333);
   syn.marker.visible=a.code!=='AVAILABLE';
   applied.push('useState:'+a.entityId)}}
 inst.committedWorld={worldDigest:v.worldDigest,transactionId:v.transactionId,appliedEntities:applied.slice()};
 return{applied:true,worldDigest:v.worldDigest,transactionId:v.transactionId,actions:applied}}
// validatePlacement(placement): PROPOSE-ONLY geometry check through the
// certified gate. Runs in a throwaway in-memory session that is discarded
// immediately; nothing is retained, persisted or exported. A "valid" result
// reports what a commit WOULD produce - it never commits anywhere.
export function validatePlacement(placement){
 if(!inst)return{valid:false,reason:'not mounted'};
 try{
  if(!placement||!Array.isArray(placement.positionMicrounits)||!placement.relation)return{valid:false,reason:'placement needs positionMicrounits + relation'};
  const s=ENGINE.createDemoSession();
  const r=s.proposeBagPlacement({transactionId:'pkg:validate:1',positionMicrounits:placement.positionMicrounits,relation:placement.relation});
  const code=r.code||(r.status==='COMMITTED'?'OK':'UNKNOWN');
  const detail=r.evidence&&r.evidence.detail&&r.evidence.detail.evidence;
  return{valid:r.status==='COMMITTED',code,reasonCode:(detail&&detail.phase2ReasonCode)||'',
   priorStateDigest:r.priorStateDigest,wouldBeStateDigest:r.stateDigest,
   note:'propose-only simulation in a discarded in-memory session; no world was changed'};
 }catch(e){return{valid:false,reason:String(e&&e.message||e)}}}
// status(): build/pin identity, manifest verification, detailed gate statuses
// (stale per-entity labels explicitly superseded), binding inventory.
export function status(){
 if(!inst)return{mounted:false};
 return{mounted:true,apiVersion:PACKAGE_API_VERSION,
  build:{commit:inst.build.commit,builtAt:inst.build.builtAt,moduleSha256:inst.build.moduleSha256,manifestSha256:inst.build.manifestSha256},
  manifestOk:inst.manifestOk,manifestDetail:inst.manifestDetail,
  statuses:inst.statuses,
  boundEntities:Object.keys(inst.bindings),
  bagLocation:inst.bagLocation,lastCue:inst.lastCue,
  committedWorld:inst.committedWorld||null,
  syntheticUnit:syn?{bound:true,useState:syn.useState,gateAStatus:inst.syntheticUnitGateA||'UNKNOWN',registryAdmission:inst.syntheticUnitRegistryAdmission||'UNKNOWN',note:'presentation bridge (B-W11); physical records ADMITTED_BY_OWNER_R1 (r1-owner-signoff, owner-decision status) + registry-ADMITTED (gate-a-r1-admission.js); visual admission R2/R3'}:{bound:false},
  presentation:inst.pm?{active:inst.pm.ok,bound:inst.pm.ok?inst.pm.bound:null,reason:inst.pm.ok?null:inst.pm.reason}:null,
  claimGate:'SLICE-PACKAGE ONLY: not "connected" until the running shell consumes this package'}}
