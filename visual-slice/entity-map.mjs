// TRACK B / B-W5 resolver: the ONLY way the visual layer binds an entity id
// to a physical body record, layout group and bounds. Fail-closed: unknown or
// invalid input yields null / {ok:false}, never a default or a guess.
// Two-engines boundary: this module reads versioned DATA. It never writes
// authoritative state, never derives region semantics, and never lets a
// SYNTHETIC_TRAINING entry resolve as a clinical subject.
export const ENTRY_TYPES=Object.freeze(['CLINICAL_SUBJECT','EQUIPMENT','ENVIRONMENT','SYNTHETIC_TRAINING']);
const HEX64=/^[0-9a-f]{64}$/;
function isAabb(b){return b&&['minX','maxX','minY','maxY','minZ','maxZ'].every(k=>Number.isInteger(b[k]))&&b.minX<=b.maxX&&b.minY<=b.maxY&&b.minZ<=b.maxZ}
// Fields that would give an entry clinical meaning. SYNTHETIC_TRAINING entries
// must never carry any of them (owner Option A constraint).
const CLINICAL_FIELDS=['clinicalBodyRegion','bodyRegions','clinicalSubject','medicalAction'];
export function validateMap(map){
 const errors=[];
 if(!map||typeof map!=='object')return {ok:false,errors:['map is not an object']};
 if(map.kind!=='TRACK_B_ENTITY_BODY_MAP')errors.push('kind mismatch');
 if(typeof map.mapVersion!=='string')errors.push('mapVersion missing');
 const a=map.anchors||{};
 for(const k of ['sourcePackageDigest','worldStateDigest','descriptorDigest'])if(!HEX64.test(a[k]||''))errors.push('anchor '+k+' missing/invalid');
 if(!a.surfaceModelPin||!HEX64.test(a.surfaceModelPin.sha256||''))errors.push('anchor surfaceModelPin missing/invalid');
 const ents=map.entities;
 if(!ents||typeof ents!=='object'||Object.keys(ents).length===0)errors.push('entities missing');
 for(const [id,e]of Object.entries(ents||{})){
  if(e.entityId!==id)errors.push(id+': entityId field mismatch');
  if(!ENTRY_TYPES.includes(e.entryType))errors.push(id+': unknown entryType '+e.entryType);
  if(typeof e.layoutGroup!=='string'||!e.layoutGroup)errors.push(id+': layoutGroup missing');
  if(e.entryType==='SYNTHETIC_TRAINING'){
   for(const f of CLINICAL_FIELDS)if(f in e)errors.push(id+': SYNTHETIC_TRAINING entry carries forbidden clinical field '+f);
  }
  if(e.entryType==='CLINICAL_SUBJECT'||e.entryType==='EQUIPMENT'){
   const r=e.physicalBodyRef||{};
   if(typeof r.recordId!=='string'||!r.recordId)errors.push(id+': physicalBodyRef.recordId missing');
   if(!Number.isInteger(r.revision))errors.push(id+': physicalBodyRef.revision missing');
   if(!HEX64.test(r.digest||''))errors.push(id+': physicalBodyRef.digest missing/invalid');
  }
  if(e.boundsMicrounits!=null&&!isAabb(e.boundsMicrounits))errors.push(id+': boundsMicrounits invalid');
  const sa=e.sourceAnchor||{};
  if(Object.values(sa).every(v=>v==null))errors.push(id+': sourceAnchor empty - every entry must carry its source anchor');
 }
 return {ok:errors.length===0,errors}}
// Lookup only. Unknown id -> null. Never a default, never a fuzzy match.
export function resolveEntity(map,entityId){
 if(!map||!map.entities||typeof entityId!=='string')return null;
 const e=map.entities[entityId];
 return e&&e.entityId===entityId?e:null}
// The ONLY clinical linkage the visual layer may resolve. Structurally
// impossible for SYNTHETIC_TRAINING/EQUIPMENT/ENVIRONMENT entries.
export function clinicalSubjectOf(map,entityId){
 const e=resolveEntity(map,entityId);
 return e&&e.entryType==='CLINICAL_SUBJECT'?e:null}
