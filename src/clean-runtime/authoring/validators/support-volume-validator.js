'use strict';
// R1 v4 / SUPPORT_VOLUME: the containment interior volume of an owner entity
// (e.g. the certified hollow bag interior). Mirrors support-surface
// conventions: reject(code,path), VALIDATED definition with canonicalDigest,
// materialization restricted to OWNER_TRANSLATION_IDENTITY_ORIENTATION with
// the canonical orientation (anything else throws UNSUPPORTED_V1_CAPABILITY).
// Phase 2's gate admits only FLOOR/SUPPORT_SURFACE; this record is the R1
// two-layer proposal's volume layer - admission stays the review's call.
const {V1}=require('../contracts/constants'),{integer}=require('../contracts/geometry'),{digest}=require('../contracts/canonical');
function reject(code,path){return {status:'REJECTED',failure:{code,path}}}
function validateSupportVolume(x,owner){
 if(!x||x.schemaVersion!=='1.0.0'||!x.supportVolumeId||!(x.volumeRevision>=1))return reject('MALFORMED_SCHEMA','$');
 if(x.ownerEntityRef?.id!==owner.entityDefinitionId||x.ownerEntityRef?.revision!==owner.entityRevision||x.ownerEntityRef?.digest!==owner.entityDigest)return reject('STALE_VOLUME_OWNER','ownerEntityRef');
 if(x.transformBinding!=='OWNER_TRANSLATION_IDENTITY_ORIENTATION'||JSON.stringify(owner.transform.orientation)!==JSON.stringify(V1.canonicalOrientation))return reject('UNSUPPORTED_V1_CAPABILITY','transformBinding');
 if(x.containmentRole!=='CONTAINMENT_INTERIOR')return reject('INVALID_SUPPORT_VOLUME','containmentRole');
 try{for(const k of['minX','maxX','minY','maxY','minZ','maxZ'])integer(x.localBoundsMicrounits?.[k],'localBoundsMicrounits.'+k)}catch(e){return reject(e.code,e.path)}
 const b=x.localBoundsMicrounits;
 if(b.minX>=b.maxX||b.minY>=b.maxY||b.minZ>=b.maxZ)return reject('INVALID_SUPPORT_VOLUME','localBoundsMicrounits');
 if(x.classification!=='AUTHORED_NEW')return reject('INVALID_SUPPORT_VOLUME','classification');
 if(!Array.isArray(x.provenanceRefs)||!x.provenanceRefs.length)return reject('MISSING_PROVENANCE','provenanceRefs');
 const y=structuredClone(x);y.canonicalDigest=digest(y);
 return {status:'VALIDATED',definition:Object.freeze(y)}}
function materializeSupportVolume({owner,volume}){
 if(JSON.stringify(owner.transform.orientation)!==JSON.stringify(V1.canonicalOrientation)||volume.transformBinding!=='OWNER_TRANSLATION_IDENTITY_ORIENTATION')throw Object.assign(Error('UNSUPPORTED_V1_CAPABILITY'),{code:'UNSUPPORTED_V1_CAPABILITY'});
 if(volume.ownerEntityRef?.id!==owner.entityDefinitionId||volume.ownerEntityRef?.revision!==owner.entityRevision||volume.ownerEntityRef?.digest!==owner.entityDigest)throw Object.assign(Error('STALE_VOLUME_OWNER'),{code:'STALE_VOLUME_OWNER'});
 const [x,y,z]=owner.transform.translationMicrounits,b=volume.localBoundsMicrounits;
 const record={volumeId:volume.supportVolumeId,type:'SUPPORT_VOLUME',containmentRole:volume.containmentRole,
  worldRegionMicrounits:{minX:b.minX+x,maxX:b.maxX+x,minY:b.minY+y,maxY:b.maxY+y,minZ:b.minZ+z,maxZ:b.maxZ+z},
  confidence:'AUTHORED_NEW',
  provenance:{ownerEntityId:owner.entityDefinitionId,ownerRevision:owner.entityRevision,ownerDigest:owner.entityDigest,volumeRevision:volume.volumeRevision,volumeDigest:volume.canonicalDigest}};
 return Object.freeze({...record,materializationDigest:digest(record)})}
module.exports={validateSupportVolume,materializeSupportVolume};
