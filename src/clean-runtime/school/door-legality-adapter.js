'use strict';
// Candidate discrete door authority adapter. Reuses closed V3 geometry.
// Missing scene extension/swing/camera authority stays UNKNOWN, never waived.
const {digest}=require('../contracts/canonical'),{deepFreeze}=require('../contracts/world-state');
const {evaluateV3}=require('../../verified-architecture-phase2-v3/evaluate'),D=require('../../verified-architecture-phase2-v3/definitions'),G=require('../../numeric-frame-rotation/graph');
const {BODY}=require('./definitions/adult-v1-male-supine-floor'),C=require('./definitions/treatment-chair'),S=require('./definitions/synthetic-training-unit-v1'),{SCHOOL_BAG_BODY}=require('./school-physical-contract');
const {model:admittedModel}=require('./scene-v2/package');
const {schoolGeometryAdapter}=require('./school-geometry-adapter');
function bounds(e){const b=e.physicalBodyRef;for(const d of [BODY,C.BODY,S.UNIT_BODY.definition])if(b?.recordId===d.bodyDefinitionId&&b.revision===d.bodyRevision&&b.digest===d.canonicalDigest)return d.aggregateBounds;if(b?.recordId===SCHOOL_BAG_BODY.bodyId&&b.revision===SCHOOL_BAG_BODY.revision&&b.digest===SCHOOL_BAG_BODY.geometryDigest)return Object.fromEntries(Object.entries(SCHOOL_BAG_BODY.geometry).map(([k,v])=>[k,v*1000000]));return null}
function box(id,b,frames){const keys=['X','Y','Z'],center=keys.map(k=>BigInt(b['min'+k])+BigInt(b['max'+k])),half=keys.map(k=>BigInt(b['max'+k])-BigInt(b['min'+k]));if(center.some(x=>x%2n)||half.some(x=>x<=0n||x%2n))throw Error('NON_INTEGRAL_AABB');const w=frames[0],f=G.sealFrame({frameId:id+':frame',frameKind:'ENTITY_LOCAL',parentFrameRef:{frameId:w.frameId,revision:w.revision,digest:w.digest},translationMicrounits:center.map(x=>String(x/2n)),rotationQuaternionRatio:['1','0','0','0'],revision:1,provenance:'EXACT_AUTHORITY_AABB_PROJECTION'});frames.push(f);return D.define({geometryId:id,schemaVersion:'3.0.0',revision:1,provenance:{classification:'AUTHORITY_DERIVED'},localFrameId:f.frameId,representationKind:'ORIENTED_BOX',shape:{halfExtentsMicrounits:half.map(x=>String(x/2n))},capabilities:[],limitations:['DISCRETE_STATE_ONLY','CONSERVATIVE_AGGREGATE_BODY']})}
function discreteClosedLeaf({surfaceModel,proposedState,command}){
 const evidence={surfaceModelDigest:surfaceModel?.surfaceModelDigest,checks:[],limitations:['DISCRETE_STATE_ONLY','CONSERVATIVE_AGGREGATE_BODY','NO_SWING_ENVELOPE_OR_CAMERA_SWEEP_PROOF']};const out=(outcome,reason)=>deepFreeze({outcome,reason,evidence,evidenceDigest:digest(evidence)});
 try{
  if(!surfaceModel||surfaceModel.surfaceModelDigest!==admittedModel.surfaceModelDigest||digest({...surfaceModel,surfaceModelDigest:undefined})!==surfaceModel.surfaceModelDigest)return out('UNKNOWN','SURFACE_MODEL_STALE');
  const surfaces=surfaceModel.surfaces.filter(s=>s.surfaceId===command.surfaceId&&s.type==='DOOR_OR_OPENING'),records=proposedState.environmentPhysicalState?.doorStates?.filter(d=>d.surfaceId===command.surfaceId);
  if(surfaces.length!==1||records?.length!==1)return out('UNKNOWN','DOOR_IDENTITY_MISSING');
  const surface=surfaces[0],record=records[0];
  if(!surface.region.volumes.length||record.geometryDigest!==digest(surface.region.volumes)||command.geometryDigest!==record.geometryDigest)return out('UNKNOWN','DOOR_GEOMETRY_STALE');
  if(record.state!=='CLOSED')return out('UNKNOWN','OPEN_DOOR_PATH_NOT_PROVED');
  for(const e of Object.values(proposedState.entities).sort((a,b)=>a.entityId.localeCompare(b.entityId))){
   if(['REMOVED','CONSUMED'].includes(e.lifecycleState))continue;
   const b=bounds(e),p=e.transform?.positionMicrounits;
   if(!b||!Array.isArray(p)||p.length!==3||p.some(x=>!Number.isSafeInteger(x))||JSON.stringify(e.transform.orientation)!=='[0,0,0,1]'||JSON.stringify(e.transform.scaleMicrounits)!=='[1000000,1000000,1000000]')return out('UNKNOWN','BODY_GEOMETRY_OR_TRANSFORM_UNSUPPORTED');
   const translated=Object.fromEntries(Object.entries(b).map(([k,v])=>[k,v+p['XYZ'.indexOf(k.slice(-1))]]));
   for(const volume of surface.region.volumes){const v={};for(const k of ['minX','maxX','minY','maxY','minZ','maxZ']){v[k]=volume[k]*1000000;if(!Number.isSafeInteger(v[k]))return out('UNKNOWN','DOOR_VOLUME_NOT_EXACT')}
    const frames=[G.sealFrame({frameId:'world',frameKind:'WORLD',parentFrameRef:null,translationMicrounits:['0','0','0'],rotationQuaternionRatio:['1','0','0','0'],revision:1,provenance:'AUTHORITY_WORLD'})],a=box('body',translated,frames),d=box('door',v,frames);
    const r=evaluateV3({apiVersion:'3.0.0',requestId:command.commandId+':'+e.entityId+':'+volume.volumeId,queryType:'BODY_VS_WORLD_SOLID',bodyGeometryId:a.geometryId,targetGeometryId:d.geometryId},{frames,definitions:{body:a,door:d}});
    const axisGapsMicrounits={};for(const axis of ['X','Y','Z'])axisGapsMicrounits[axis]=Math.max(v['min'+axis]-translated['max'+axis],translated['min'+axis]-v['max'+axis],0);
    evidence.checks.push({axisGapsMicrounits,clearanceClassification:'EXACT_AXIS_SEPARATION_NOT_EUCLIDEAN_DISTANCE',entityId:e.entityId,bodyRef:e.physicalBodyRef,volumeId:volume.volumeId,result:JSON.parse(JSON.stringify(r,(_,x)=>typeof x==='bigint'?String(x):x))});
    if(r.status==='FAIL')return out('FAIL','CLOSED_LEAF_BODY_COLLISION');if(r.status!=='PASS')return out('UNKNOWN','DISCRETE_GEOMETRY_UNCERTAIN');
   }
  }
  return out('PASS','DISCRETE_CLOSED_LEAF_CLEAR');
 }catch(e){evidence.error=e.message;return out('UNKNOWN','DOOR_GEOMETRY_ERROR')}
}
function createDoorLegalityAdapter({surfaceModel,verifySceneExtension}){
 return Object.freeze({evaluate(input){
  const leaf=discreteClosedLeaf({...input,surfaceModel});if(leaf.outcome!=='PASS')return leaf;
  let verified=false;try{verified=typeof verifySceneExtension==='function'&&verifySceneExtension(input)===true}catch{}
  if(!verified)return deepFreeze({outcome:'UNKNOWN',reason:'SCENE_EXTENSION_NOT_ADMITTED',discreteClosedLeaf:leaf});
  for(const e of Object.values(input.proposedState.entities)){if(['REMOVED','CONSUMED'].includes(e.lifecycleState))continue;const r=schoolGeometryAdapter({surfaceModel}).evaluate({...input,command:{commandId:input.command.commandId+':support:'+e.entityId,entityId:e.entityId}});if(r.outcome!=='PASS')return deepFreeze({outcome:r.outcome,reason:'SUPPORT_LEGALITY_REJECTED',discreteClosedLeaf:leaf,supportEvidence:r})}
  // Exact authored swing volume, camera body, scene bounds and motion route
  // are not present in R1. A discrete PASS is never full door admission.
  return deepFreeze({outcome:'UNKNOWN',reason:'SWING_CAMERA_BOUNDS_AUTHORITY_NOT_IMPLEMENTED',discreteClosedLeaf:leaf});
 }});
}
module.exports={discreteClosedLeaf,createDoorLegalityAdapter,projectKnownBodyBounds:bounds};
