'use strict';
// Review-only direct model query. No positive port exported or installed.
const {digest,deepFreeze}=require('../../contracts/canonical');
const S=require('../door-world-structure/candidate'),C=require('../door-world-genesis/candidate');
const A=require('../definitions/adult-v1-male-supine-floor');
const {projectKnownBodyBounds}=require('../door-legality-adapter');
const axes=['X','Y','Z'],keys=axes.flatMap(k=>['min'+k,'max'+k]);
const eq=(a,b)=>digest(a)===digest(b),overlap=(a,b)=>axes.every(k=>a['min'+k]<b['max'+k]&&b['min'+k]<a['max'+k]);
function inspectDirectQuery({packet,model,proposedState,entityId,...extra}={}){const out=(outcome,reason)=>deepFreeze({outcome,reason,classification:'DIRECT_QUERY_PREPARATION_ONLY_NOT_ADMITTED'});try{
 if(Object.keys(extra).length)return out('UNKNOWN','EXTRA_INPUT');
 const structural=S.validateStructure(model);if(structural.status!=='DOORWAY_FLOOR_STATIC_TOPOLOGY_VALIDATED_NOT_ADMITTED'||!eq(model,C.definition(packet)))return out('UNKNOWN','MODEL_STRUCTURE_OR_IDENTITY');
 const g=C.prepareGenesis(packet).genesis;if(!eq(proposedState.sceneDefinitionRef,g.sceneDefinitionRef)||!eq(proposedState.surfaces,g.surfaces)||!eq(proposedState.environmentPhysicalState,g.environmentPhysicalState)||proposedState.worldId!==g.worldId)return out('UNKNOWN','NEW_MODEL_CLOSED_WORLD_BINDING');
 const e=proposedState.entities[entityId];if(e?.physicalBodyRef?.recordId!==A.BODY.bodyDefinitionId)return out('UNKNOWN','BODY_OR_SUPPORT_NOT_YET_IMPLEMENTED_BAG_UNIT_UNKNOWN');
 if(e.physicalState?.surfaceId!=='floor'||e.postureStateId!==A.POSTURE.postureDefinitionId||e.physicalBodyRef.revision!==A.BODY.bodyRevision||e.physicalBodyRef.digest!==A.BODY.canonicalDigest||e.physicalBodyRef.proofGeometryDigest!==A.BODY.canonicalDigest)return out('UNKNOWN','ADULT_BODY_POSTURE_PINS');
 const profile=e.physicalState.profileRef,posture=e.physicalState.postureRef;if(profile?.id!==A.PROFILE.profileDefinitionId||profile.revision!==A.PROFILE.profileRevision||profile.digest!==A.PROFILE.profileDigest||profile.subjectSex!=='MALE'||posture?.id!==A.POSTURE.postureDefinitionId||posture.revision!==A.POSTURE.postureRevision||posture.digest!==A.POSTURE.canonicalDigest||posture.semanticType!=='SUPINE_FLOOR')return out('UNKNOWN','PROFILE_POSTURE_PINS');
 const position=e.transform.positionMicrounits;if(!Array.isArray(position)||position.length!==3||!position.every(Number.isSafeInteger)||!eq(e.transform.orientation,[0,0,0,1])||!eq(e.transform.scaleMicrounits,[1000000,1000000,1000000]))return out('UNKNOWN','TRANSFORM_UNSUPPORTED');
 const b=projectKnownBodyBounds(e),bounds=Object.fromEntries(keys.map(k=>[k,b[k]+position[axes.indexOf(k.slice(-1))]])),floor=model.surfaces.find(s=>s.surfaceId==='floor'),room=floor.region.allowed[0],plane=Math.round(floor.planeOrDepth.planeY*1e6);
 // Initial reviewed transaction is adult only. Apron is never support proof.
 if(bounds.minY!==plane||bounds.minX<room.minX*1e6||bounds.maxX>room.maxX*1e6||bounds.minZ<room.minZ*1e6||bounds.maxZ>room.maxZ*1e6)return out('UNKNOWN','ROOM_FLOOR_CONTACT_OR_COVERAGE');
 const rs=proposedState.supportRelations.filter(r=>r.supportedEntityId===entityId);const prototype=require('../../../../scripts/track-b/gate-a-r1v4-package-builder').buildV21().supportRelations.find(r=>r.supportedEntityId===entityId),expected={...prototype,surfaceModelRef:{id:model.surfaceModelId,revision:model.revision,digest:model.surfaceModelDigest},boundWorldRevision:proposedState.revision+1};if(rs.length!==1||!eq(rs[0],expected))return out('UNKNOWN','EXPLICIT_NEW_MODEL_SUPPORT_PROOF_REQUIRED');
 const solids=model.surfaces.filter(s=>['WALL','OBSTACLE'].includes(s.type)).flatMap(s=>s.region.volumes.map(v=>Object.fromEntries(keys.map(k=>[k,Math.round(v[k]*1e6)])))).concat([model.doorDefinition.closedLeaf]);if(solids.some(v=>overlap(bounds,v)))return out('DIRECT_QUERY_CONTACT_NOT_ADMITTED','NEW_STATIC_OR_CLOSED_LEAF_COLLISION');
 for(const other of Object.values(proposedState.entities)){if(other.entityId===entityId||other.lifecycleState==='REMOVED')continue;const ob=projectKnownBodyBounds(other),op=other.transform?.positionMicrounits;if(!ob||!Array.isArray(op)||op.length!==3||!op.every(Number.isSafeInteger)||!eq(other.transform.orientation,[0,0,0,1])||!eq(other.transform.scaleMicrounits,[1000000,1000000,1000000]))return out('UNKNOWN','OTHER_BODY_UNSUPPORTED');const ow=Object.fromEntries(keys.map(k=>[k,ob[k]+op[axes.indexOf(k.slice(-1))]]));if(overlap(bounds,ow))return out('DIRECT_QUERY_CONTACT_NOT_ADMITTED','DYNAMIC_BODY_COLLISION')}
 return out('DIRECT_QUERY_CLEAR_NOT_ADMITTED','DIRECT_NEW_MODEL_ADULT_FLOOR_CLOSED_SOLIDS_PROVEN');
 }catch{return out('UNKNOWN','DIRECT_QUERY_INVALID')}}
module.exports={inspectDirectQuery};
