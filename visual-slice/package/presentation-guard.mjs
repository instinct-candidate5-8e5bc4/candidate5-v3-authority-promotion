// TRACK B / PW-1: Presentation Manifest guard (production-world track).
// Fail-closed validation of the binding layer between the authoritative
// physical scene and visual assets. Presentation NEVER invents positions,
// supports or collisions; decorative meshes are never authoritative unless
// separately certified; a missing asset renders a loud labeled placeholder,
// never a silent fallback. Debug view remains available alongside.
export const TRANSFORM_SOURCES=Object.freeze(['authoritative']);
export function validatePresentationManifest(manifest,{map,worldDigest,expectedUnitDefinitionSha256,sha256hex}={}){
 if(!manifest||manifest.kind!=='TRACK_B_PRESENTATION_MANIFEST'||!['0.1.0','0.2.0'].includes(manifest.manifestVersion))return{ok:false,reason:'manifest kind/version missing'};
 if(!manifest.sceneRef||!manifest.sceneRef.definitionId||!/^[a-f0-9]{64}$/.test(manifest.sceneRef.authoritativeWorldDigest||''))return{ok:false,reason:'sceneRef malformed'};
 if(worldDigest&&manifest.sceneRef.authoritativeWorldDigest!==worldDigest)return{ok:false,reason:'STALE_WORLD: manifest pinned world digest != consumed world digest'};
 if(!Array.isArray(manifest.entities)||!manifest.entities.length)return{ok:false,reason:'entities missing'};
 const seen=new Set();
 for(const e of manifest.entities){
  if(!e.physicalEntityId||!e.visualEntityId)return{ok:false,reason:'entity binding missing ids'};
  const physical=(map&&map.entities&&map.entities[e.physicalEntityId])||null;
  if(map&&!physical)return{ok:false,reason:'unknown physicalEntityId '+e.physicalEntityId+' - presentation binds only existing authority'};
  if(!e.visualEntityId.startsWith('vw-'))return{ok:false,reason:'visualEntityId '+e.visualEntityId+' must be vw- namespaced'};
  if(seen.has(e.visualEntityId))return{ok:false,reason:'duplicate visualEntityId '+e.visualEntityId};
  seen.add(e.visualEntityId);
  if(e.transformSource!=='authoritative')return{ok:false,reason:'transformSource must be authoritative for '+e.physicalEntityId+' - presentation never invents transforms'};
  if(e.physicsAuthoritative!==false)return{ok:false,reason:'physicsAuthoritative must be false for '+e.physicalEntityId+' - decorative meshes are never authoritative unless separately certified'};
  const a=e.assetRef;
  if(!a||(a.kind!=='procedural'&&a.kind!=='file'))return{ok:false,reason:'assetRef kind missing for '+e.physicalEntityId};
  if(a.kind==='procedural'&&(typeof a.source!=='string'||!a.source))return{ok:false,reason:'procedural asset needs a source builder ref for '+e.physicalEntityId};
  if(a.kind==='file'&&!/^[a-f0-9]{64}$/.test(a.sha256||''))return{ok:false,reason:'file asset without byte SHA-256 pin for '+e.physicalEntityId+' - unverifiable pin = refuse'};
  if(manifest.manifestVersion>='0.2.0'&&e.physicalEntityId==='synthetic-training-unit-v1'){
   const pin=a.pinned;
   if(!pin||typeof pin!=='object')return{ok:false,reason:'0.2.0 requires a pinned asset binding for synthetic-training-unit-v1'};
   if(typeof pin.assetBindingVersion!=='string'||!pin.assetBindingVersion)return{ok:false,reason:'pinned.assetBindingVersion missing'};
   if(!/^[a-f0-9]{64}$/.test(pin.unitDefinitionSha256||''))return{ok:false,reason:'pinned.unitDefinitionSha256 missing - definition byte pin required'};
   if(!/^[a-f0-9]{64}$/.test(pin.bindingDigest||''))return{ok:false,reason:'pinned.bindingDigest missing - binding record digest required'};
   if(typeof expectedUnitDefinitionSha256!=='string'||!/^[a-f0-9]{64}$/.test(expectedUnitDefinitionSha256))return{ok:false,reason:'runtime recompute of the unit definition bytes not supplied - format-only pin acceptance refused'};
   if(pin.unitDefinitionSha256!==expectedUnitDefinitionSha256)return{ok:false,reason:'pinned.unitDefinitionSha256 != runtime recompute of the definition bytes - tampered or stale manifest'};
   if(typeof sha256hex!=='function')return{ok:false,reason:'runtime sha256 not supplied - binding/manifest digests unverifiable'};
   const brec={};for(const k of Object.keys(pin))if(k!=='bindingDigest')brec[k]=pin[k];
   if(sha256hex(JSON.stringify(brec))!==pin.bindingDigest)return{ok:false,reason:'pinned.bindingDigest != recomputed binding record digest - tampered manifest'};}
 }
 if(manifest.manifestDigest!==undefined){
  if(typeof sha256hex!=='function')return{ok:false,reason:'manifestDigest present but runtime sha256 not supplied - integrity unverifiable'};
  const mrec={};for(const k of Object.keys(manifest))if(k!=='manifestDigest')mrec[k]=manifest[k];
  if(sha256hex(JSON.stringify(mrec))!==manifest.manifestDigest)return{ok:false,reason:'manifestDigest != recomputed manifest digest - tampered manifest'};}
 return{ok:true,bound:manifest.entities.map(e=>e.physicalEntityId)}}
