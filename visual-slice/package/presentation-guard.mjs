// TRACK B / PW-1: Presentation Manifest guard (production-world track).
// Fail-closed validation of the binding layer between the authoritative
// physical scene and visual assets. Presentation NEVER invents positions,
// supports or collisions; decorative meshes are never authoritative unless
// separately certified; a missing asset renders a loud labeled placeholder,
// never a silent fallback. Debug view remains available alongside.
export const TRANSFORM_SOURCES=Object.freeze(['authoritative']);
export function validatePresentationManifest(manifest,{map,worldDigest}){
 if(!manifest||manifest.kind!=='TRACK_B_PRESENTATION_MANIFEST'||manifest.manifestVersion!=='0.1.0')return{ok:false,reason:'manifest kind/version missing'};
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
 }
 return{ok:true,bound:manifest.entities.map(e=>e.physicalEntityId)}}
