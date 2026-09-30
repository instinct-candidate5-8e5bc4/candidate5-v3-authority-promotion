'use strict';
const {evaluate:gatewayEvaluate}=require('../mutation/phase2-gateway');const evaluate=(request,model)=>gatewayEvaluate('1.0.0',request,model);
const {canonical,digest}=require('../../verified-architecture-phase2/canonical');
const {MICROUNITS_PER_UNIT}=require('../../verified-architecture-phase2/fixed-point');
const {SCHOOL_SCENE,SCHOOL_BAG_BODY,SCHOOL_SURFACE_MODEL_REF}=require('./school-physical-contract');const {PROFILE,POSTURE,BODY}=require('./definitions/adult-v1-male-supine-floor');const CHAIR=require('./definitions/treatment-chair');const A=require('../authoring');const SYN=require('./definitions/synthetic-training-unit-v1');
function schoolGeometryAdapter({surfaceModel}){return Object.freeze({kind:'SCHOOL_PHASE2_GEOMETRY_ADAPTER',evaluate(input){const entityId=input.command.entityId||input.command.entity?.entityId,entity=input.proposedState.entities[entityId];if(input.proposedState.sceneDefinitionRef?.sceneId!==SCHOOL_SCENE.sceneId||!entity)return Object.freeze({outcome:'UNKNOWN',evidence:{adapterReason:'UNSUPPORTED_SCENE_OR_ENTITY',sceneId:input.proposedState.sceneDefinitionRef?.sceneId||null,entityId:entityId||null}});// Reviewed invariant: STATIC_WORLD support must bind the same selected
// surface that the authoritative Geometry Gate evaluates. A relation must not
// claim a wall while the entity is evaluated on floor.
const staticRelations=(input.proposedState.supportRelations||[]).filter(r=>r.supportedEntityId===entityId&&r.supportSourceKind==='STATIC_WORLD');
for(const relation of staticRelations){
 const selected=entity.physicalState?.surfaceId||entity.supportRelation?.surfaceId;
 const actual=surfaceModel.surfaces.find(s=>s.surfaceId===relation.surfaceId);
 if(!selected||relation.surfaceId!==selected)return Object.freeze({outcome:'UNKNOWN',evidence:{adapterReason:'SUPPORT_SELECTED_SURFACE_MISMATCH',entityId,selectedSurfaceId:selected||null,relationSurfaceId:relation.surfaceId}});
 if(!actual||actual.type!==relation.expectedSurfaceType||!['FLOOR','SUPPORT_SURFACE'].includes(actual.type))return Object.freeze({outcome:'UNKNOWN',evidence:{adapterReason:'SUPPORT_SURFACE_SEMANTIC_MISMATCH',entityId,surfaceId:relation.surfaceId}});
}
const body=entity.physicalBodyRef,position=entity.transform?.positionMicrounits,isBag=body?.recordId===SCHOOL_BAG_BODY.bodyId,isCasualty=body?.recordId===BODY.bodyDefinitionId,isChair=body?.recordId===CHAIR.BODY.bodyDefinitionId,isSynthetic=body?.recordId==='synthetic/gate-c-supported-box-body',isTrainingUnit=body?.recordId===SYN.UNIT_BODY.definition.bodyDefinitionId;let containmentProof=null;let dynamicModel=surfaceModel,surface=entity.supportRelation?.surfaceModelRef||(((isCasualty||isChair)&&entity.physicalState?.surfaceId)||(isBag&&input.proposedState.supportRelations?.some(r=>r.supportedEntityId===entityId))?SCHOOL_SURFACE_MODEL_REF:null);if(isSynthetic){const owner=input.proposedState.entities[entity.supportRelation?.ownerEntityId];if(owner){const defOwner={entityDefinitionId:CHAIR.ENTITY.entityDefinitionId,entityRevision:CHAIR.ENTITY.entityRevision,entityDigest:CHAIR.ENTITY.entityDigest,transform:{translationMicrounits:owner.transform.positionMicrounits,orientation:A.V1.canonicalOrientation}};const m=A.materializeSupportSurface({staticModelRef:SCHOOL_SURFACE_MODEL_REF,owner:defOwner,surface:CHAIR.SURFACE});surface={id:'gate-c-dynamic-surfaces',revision:1,digest:null};dynamicModel={...surfaceModel,surfaceModelId:surface.id,revision:1,surfaces:[...surfaceModel.surfaces,{surfaceId:m.surfaceId,type:m.type,region:m.region,planeOrDepth:m.planeOrDepth,contactRules:m.contactRules,confidence:m.confidence,provenance:m.provenance}]};delete dynamicModel.surfaceModelDigest;dynamicModel.surfaceModelDigest=digest(dynamicModel);surface.digest=dynamicModel.surfaceModelDigest}}if(isTrainingUnit){const unitRel=input.proposedState.supportRelations?.find(r=>r.supportedEntityId===entityId);const owner=input.proposedState.entities[unitRel?.ownerEntityRef?.id];if(owner){
 // R1 v5: the two-layer containment proof runs in the AUTHORITATIVE legality
 // path, not only in tests. (1) The relation must pin the validated support
 // volume; (2) the owner entity state must carry the same volume; (3) the
 // pair supersession is scoped to exactly relation
 // synthetic:unit:bag-interior-floor + the validated owner-body binding;
 // (4) full-3D containment is recomputed against the materialized volume.
 const VOL=SYN.CONTAINMENT_VOLUME.definition,volRef=unitRel?.supportVolumeRef;
 if(!volRef||volRef.id!==VOL.supportVolumeId||volRef.revision!==VOL.volumeRevision||volRef.digest!==VOL.canonicalDigest)return Object.freeze({outcome:'UNKNOWN',evidence:{adapterReason:'STALE_VOLUME',actual:volRef||null}});
 const ownerVol=owner.physicalState?.supportVolume;
 if(!ownerVol||ownerVol.supportVolumeId!==VOL.supportVolumeId||ownerVol.volumeRevision!==VOL.volumeRevision||ownerVol.canonicalDigest!==VOL.canonicalDigest)return Object.freeze({outcome:'UNKNOWN',evidence:{adapterReason:'STALE_VOLUME_OWNER_STATE',actual:ownerVol||null}});
 if(unitRel.relationId!=='synthetic:unit:bag-interior-floor'||unitRel.supportSourceKind!=='ENTITY_OWNED'||unitRel.ownerEntityRef?.id!=='school-medical-bag')return Object.freeze({outcome:'UNKNOWN',evidence:{adapterReason:'PAIR_SUPERSESSION_SCOPE',relationId:unitRel.relationId||null}});
 const OE=SYN.OWNER_ENTITY.definition,defOwner={entityDefinitionId:OE.entityDefinitionId,entityRevision:OE.entityRevision,entityDigest:OE.entityDigest,transform:{translationMicrounits:owner.transform.positionMicrounits,orientation:A.V1.canonicalOrientation}};
 let volMat=null;try{volMat=A.materializeSupportVolume({owner:defOwner,volume:VOL})}catch(e){return Object.freeze({outcome:'UNKNOWN',evidence:{adapterReason:e.code||'VOLUME_MATERIALIZATION_FAILED'}})}
 const ub=SYN.UNIT_BODY.definition.aggregateBounds,unitWorld={minX:ub.minX+position[0],maxX:ub.maxX+position[0],minY:ub.minY+position[1],maxY:ub.maxY+position[1],minZ:ub.minZ+position[2],maxZ:ub.maxZ+position[2]},vrgn=volMat.worldRegionMicrounits;
 const contained=unitWorld.minX>vrgn.minX&&unitWorld.maxX<vrgn.maxX&&unitWorld.minY>=vrgn.minY&&unitWorld.maxY<vrgn.maxY&&unitWorld.minZ>vrgn.minZ&&unitWorld.maxZ<vrgn.maxZ;
 if(!contained)return Object.freeze({outcome:'UNKNOWN',evidence:{adapterReason:'CONTAINMENT_VIOLATION',unitWorldAabbMicrounits:unitWorld,volumeWorldRegionMicrounits:vrgn}});
 containmentProof={volumeId:VOL.supportVolumeId,materializationDigest:volMat.materializationDigest,unitWorldAabbMicrounits:unitWorld,volumeWorldRegionMicrounits:vrgn,contained:true,pairSupersession:{pair:['synthetic-training-unit-v1','school-medical-bag'],relationId:unitRel.relationId,bindingDigest:SYN.OWNER_BODY_BINDING.binding.canonicalDigest,scope:'Containment supersedes unit-vs-bag body overlap for exactly this relation + validated binding pair; every other body overlap remains a collision.'}};
 const m=A.materializeSupportSurface({staticModelRef:SCHOOL_SURFACE_MODEL_REF,owner:defOwner,surface:SYN.INTERIOR_FLOOR.definition});surface={id:'synthetic-unit-dynamic-surfaces',revision:1,digest:null};dynamicModel={...surfaceModel,surfaceModelId:surface.id,revision:1,surfaces:[...surfaceModel.surfaces,{surfaceId:m.surfaceId,type:m.type,region:m.region,planeOrDepth:m.planeOrDepth,contactRules:m.contactRules,confidence:m.confidence,provenance:m.provenance}]};delete dynamicModel.surfaceModelDigest;dynamicModel.surfaceModelDigest=digest(dynamicModel);surface.digest=dynamicModel.surfaceModelDigest}}let contract;if(isBag)contract={geometry:SCHOOL_BAG_BODY.geometry,digest:SCHOOL_BAG_BODY.geometryDigest,revision:SCHOOL_BAG_BODY.revision,proof:SCHOOL_BAG_BODY.proofGeometryDigest,evidenceRefs:SCHOOL_BAG_BODY.evidenceRefs,provenance:SCHOOL_BAG_BODY};else if(isCasualty){const p=entity.physicalState?.profileRef,q=entity.physicalState?.postureRef;if(p?.id!==PROFILE.profileDefinitionId||p?.revision!==PROFILE.profileRevision||p?.digest!==PROFILE.profileDigest||p?.subjectSex!=='MALE')return Object.freeze({outcome:'UNKNOWN',evidence:{adapterReason:'PROFILE_PROOF_MISMATCH',actual:p||null}});if(q?.id!==POSTURE.postureDefinitionId||q?.semanticType!=='SUPINE_FLOOR'||q?.revision!==POSTURE.postureRevision||q?.digest!==POSTURE.canonicalDigest)return Object.freeze({outcome:'UNKNOWN',evidence:{adapterReason:'POSTURE_PROOF_MISMATCH',actual:q||null}});contract={geometry:Object.fromEntries(Object.entries(BODY.aggregateBounds).map(([k,v])=>[k,v/1000000])),digest:BODY.canonicalDigest,revision:BODY.bodyRevision,proof:BODY.canonicalDigest,evidenceRefs:['authoring-decision:'+BODY.authoringProvenance.decisionId,'body-digest:'+BODY.canonicalDigest],provenance:{classification:'AUTHORED_NEW',lineageStatus:'AUTHORED_NEW',sourceId:BODY.geometrySource.sourceId}}}else if(isChair)contract={geometry:Object.fromEntries(Object.entries(CHAIR.BODY.aggregateBounds).map(([k,v])=>[k,v/1e6])),digest:CHAIR.BODY.canonicalDigest,revision:1,proof:CHAIR.BODY.canonicalDigest,evidenceRefs:['authoring-decision:'+CHAIR.decisionId],provenance:{classification:'AUTHORED_NEW',lineageStatus:'AUTHORED_NEW',sourceId:CHAIR.decisionId}};else if(isSynthetic)contract={geometry:{minX:-.1,maxX:.1,minY:-.1,maxY:.1,minZ:-.1,maxZ:.1},digest:'c'.repeat(64),revision:1,proof:'c'.repeat(64),evidenceRefs:['gate-c-contract-fixture'],provenance:{classification:'AUTHORED_NEW',lineageStatus:'AUTHORED_NEW',sourceId:'gate-c-contract-fixture'}};else if(isTrainingUnit)contract={geometry:Object.fromEntries(Object.entries(SYN.UNIT_BODY.definition.aggregateBounds).map(([k,v])=>[k,v/1e6])),digest:SYN.UNIT_BODY.definition.canonicalDigest,revision:1,proof:SYN.UNIT_BODY.definition.canonicalDigest,evidenceRefs:['authoring-decision:gate-a-unit-authoring-001','unit-body-digest:'+SYN.UNIT_BODY.definition.canonicalDigest],provenance:{classification:'AUTHORED_NEW',lineageStatus:'AUTHORED_NEW',sourceId:'gate-a-unit-authoring-001'}};else return Object.freeze({outcome:'UNKNOWN',evidence:{adapterReason:'BODY_PROOF_STALE_OR_MISMATCHED',actual:body||null}});if(body.revision!==contract.revision||body.digest!==contract.digest)return Object.freeze({outcome:'UNKNOWN',evidence:{adapterReason:'BODY_PROOF_STALE_OR_MISMATCHED',expected:{revision:contract.revision,digest:contract.digest},actual:body}});if(!surface)return Object.freeze({outcome:'UNKNOWN',evidence:{adapterReason:'SURFACE_PROOF_MISSING'}});if(!Array.isArray(position)||position.length!==3)return Object.freeze({outcome:'UNKNOWN',evidence:{adapterReason:'TRANSFORM_CONTRACT_MISSING'}});const request={requestId:input.command.commandId,surfaceId:entity.physicalState?.surfaceId||entity.supportRelation?.surfaceId||null,surfaceModelRef:{id:surface.id,revision:surface.revision,digest:surface.digest},geometry:contract.geometry,geometryDigest:(isCasualty||isChair||isSynthetic||isTrainingUnit)?require('../../verified-architecture-phase2/canonical').digest(contract.geometry):body.digest,proofGeometryDigest:(isCasualty||isChair||isSynthetic||isTrainingUnit)?(body.proofGeometryDigest===contract.proof?require('../../verified-architecture-phase2/canonical').digest(contract.geometry):body.proofGeometryDigest):(body.proofGeometryDigest||contract.proof),transform:{x:position[0]/MICROUNITS_PER_UNIT,y:position[1]/MICROUNITS_PER_UNIT,z:position[2]/MICROUNITS_PER_UNIT},orientationUpDot:entity.physicalState?.orientationUpDot,supportNormalUpDot:entity.physicalState?.supportNormalUpDot,evidenceRefs:contract.evidenceRefs};const requestBytes=canonical(request),result=evaluate(request,dynamicModel);
 // R1 v6 (executor finding): Phase 2 evaluates only static WALL/DOOR/OBSTACLE
 // volumes - it never intersects dynamic bodies. This gate computes ACTUAL
 // world-AABB intersections between the command entity and every other
 // dynamic body in the proposed world. The only exemption is a pair directly
 // bound by a support relation present in the proposed state; relations there
 // have already passed validateRelations in this same transaction (fresh
 // pins, owner revision, volume pins), and for the unit/bag pair containment
 // is independently recomputed by the isTrainingUnit branch when the unit
 // itself is evaluated (it is always in the affected set). Every other
 // overlapping dynamic pair is a collision.
 const dynBounds=rid=>rid===SCHOOL_BAG_BODY.bodyId?{minX:Math.round(SCHOOL_BAG_BODY.geometry.minX*1e6),maxX:Math.round(SCHOOL_BAG_BODY.geometry.maxX*1e6),minY:Math.round(SCHOOL_BAG_BODY.geometry.minY*1e6),maxY:Math.round(SCHOOL_BAG_BODY.geometry.maxY*1e6),minZ:Math.round(SCHOOL_BAG_BODY.geometry.minZ*1e6),maxZ:Math.round(SCHOOL_BAG_BODY.geometry.maxZ*1e6)}:rid===BODY.bodyDefinitionId?BODY.aggregateBounds:rid===CHAIR.BODY.bodyDefinitionId?CHAIR.BODY.aggregateBounds:rid==='synthetic/gate-c-supported-box-body'?{minX:-100000,maxX:100000,minY:-100000,maxY:100000,minZ:-100000,maxZ:100000}:rid===SYN.UNIT_BODY.definition.bodyDefinitionId?SYN.UNIT_BODY.definition.aggregateBounds:null;
 const cmdB=dynBounds(body.recordId);
 if(cmdB){const cw={minX:cmdB.minX+position[0],maxX:cmdB.maxX+position[0],minY:cmdB.minY+position[1],maxY:cmdB.maxY+position[1],minZ:cmdB.minZ+position[2],maxZ:cmdB.maxZ+position[2]};const bad=[];
  for(const oid of Object.keys(input.proposedState.entities).sort()){if(oid===entityId)continue;const o=input.proposedState.entities[oid];if(!o||o.lifecycleState==='REMOVED'||!o.physicalBodyRef)continue;const ob=dynBounds(o.physicalBodyRef.recordId);if(!ob)return Object.freeze({outcome:'UNKNOWN',evidence:{adapterReason:'DYNAMIC_BODY_UNMODELED',entityId:oid,recordId:o.physicalBodyRef.recordId}});const op=o.transform?.positionMicrounits;if(!Array.isArray(op)||op.length!==3)return Object.freeze({outcome:'UNKNOWN',evidence:{adapterReason:'DYNAMIC_BODY_TRANSFORM_MISSING',entityId:oid}});const ow={minX:ob.minX+op[0],maxX:ob.maxX+op[0],minY:ob.minY+op[1],maxY:ob.maxY+op[1],minZ:ob.minZ+op[2],maxZ:ob.maxZ+op[2]};const overlaps=cw.minX<ow.maxX&&cw.maxX>ow.minX&&cw.minY<ow.maxY&&cw.maxY>ow.minY&&cw.minZ<ow.maxZ&&cw.maxZ>ow.minZ;if(!overlaps)continue;// R1 v7 (executor finding): relation PRESENCE is not an exemption - an
   // invented ENTITY_OWNED relation passes generic validateRelations without
   // any contact-geometry proof for the pair. Exemption is scoped to exactly
   // the admitted, proof-carrying pairs:
   //  (a) v2: the certified unit/bag containment pair - relation id, volume
   //      pins and owner volume state checked, and FULL containment
   //      recomputed at the proposed transforms, right here;
   //  (b) v1: the certified Gate-C fixture pair (synthetic-supported-fixture
   //      on school-treatment-chair), whose contact is validated against the
   //      materialized owner seat surface in the isSynthetic branch.
   // Every other overlapping dynamic pair is a collision, relation or not.
   let exempt=false;
   const pairIds=[entityId,oid];
   if(pairIds.includes('synthetic-training-unit-v1')&&pairIds.includes('school-medical-bag')){
    // The certified pair's legality is OWNED by the containment proof on the
    // unit's own evaluation (the unit is always in the affected set as a
    // supported entity): contained -> legal, protruding -> CONTAINMENT_
    // VIOLATION. This gate therefore exempts the pair whenever the certified
    // relation and its volume pins hold - never for any other pair.
    const unitId=pairIds[0]==='synthetic-training-unit-v1'?entityId:oid;
    const ownerE=input.proposedState.entities[pairIds[0]==='synthetic-training-unit-v1'?oid:entityId];
    const rel=(input.proposedState.supportRelations||[]).find(r=>r.relationId==='synthetic:unit:bag-interior-floor'&&r.supportedEntityId===unitId&&r.ownerEntityRef?.id==='school-medical-bag'&&r.supportSourceKind==='ENTITY_OWNED');
    if(rel&&ownerE){
     const VOL=SYN.CONTAINMENT_VOLUME.definition;
     const ownerVol=ownerE.physicalState?.supportVolume;
     exempt=!!(rel.supportVolumeRef&&rel.supportVolumeRef.id===VOL.supportVolumeId&&rel.supportVolumeRef.revision===VOL.volumeRevision&&rel.supportVolumeRef.digest===VOL.canonicalDigest&&ownerVol&&ownerVol.supportVolumeId===VOL.supportVolumeId&&ownerVol.volumeRevision===VOL.volumeRevision&&ownerVol.canonicalDigest===VOL.canonicalDigest);
    }
   }
   // v1 certified Gate-C fixture pair only (contact validated via the
   // materialized owner seat surface in the isSynthetic evaluation branch).
   if(!exempt&&pairIds.includes('synthetic-supported-fixture')&&pairIds.includes('school-treatment-chair'))
    exempt=entity.supportRelation?.ownerEntityId===oid||o.supportRelation?.ownerEntityId===entityId
     ||(input.proposedState.physicalRelations||[]).some(r=>(r.entityId===entityId&&r.ownerEntityId===oid)||(r.entityId===oid&&r.ownerEntityId===entityId));
   // (c) surface-contact exemption: a pair linked by an ENTITY_OWNED relation
   // where the supported entity RESTS on the owner's materialized certified
   // support surface - contact plane equality (supported AABB bottom ==
   // materialized surface plane). Resting contact is not penetration; whether
   // that placement is ADMITTED stays with the supported entity's own Phase 2
   // evaluation (e.g. the certified C6 gate truth: seat not admitted on the
   // v2.0.0 path -> CONTACT_GAP_FLOATING). A plane mismatch means the bodies
   // interpenetrate -> collision (the executor's bag-on-chair bypass: bag
   // bottom at floor level 0 != seat plane 490000 -> DYNAMIC_BODY_COLLISION).
   if(!exempt){
    const relC=(input.proposedState.supportRelations||[]).find(r=>r.supportSourceKind==='ENTITY_OWNED'&&((r.supportedEntityId===entityId&&r.ownerEntityRef?.id===oid)||(r.supportedEntityId===oid&&r.ownerEntityRef?.id===entityId)));
    if(relC){
     const supE=input.proposedState.entities[relC.supportedEntityId],ownE=input.proposedState.entities[relC.ownerEntityRef.id];
     const isChairOwner=ownE?.physicalBodyRef?.recordId===CHAIR.BODY.bodyDefinitionId;
     const isBagOwner=ownE?.physicalBodyRef?.recordId===SCHOOL_BAG_BODY.bodyId;
     const surfDef=isChairOwner?CHAIR.SURFACE:isBagOwner?SYN.INTERIOR_FLOOR.definition:null;
     const od=isChairOwner?CHAIR.ENTITY:isBagOwner?SYN.OWNER_ENTITY.definition:null;
     const pin=ownE?.physicalState?.supportSurface;
     if(supE&&ownE&&surfDef&&od&&pin&&pin.supportSurfaceId===surfDef.supportSurfaceId&&pin.surfaceRevision===surfDef.surfaceRevision&&pin.canonicalDigest===surfDef.canonicalDigest&&relC.supportSurfaceRef?.id===pin.supportSurfaceId&&relC.supportSurfaceRef?.revision===pin.surfaceRevision&&relC.supportSurfaceRef?.digest===pin.canonicalDigest){
      const supB=dynBounds(supE.physicalBodyRef.recordId);
      if(supB){try{
       const defOwner={entityDefinitionId:od.entityDefinitionId,entityRevision:od.entityRevision,entityDigest:od.entityDigest,transform:{translationMicrounits:ownE.transform.positionMicrounits,orientation:A.V1.canonicalOrientation}};
       const mat=A.materializeSupportSurface({staticModelRef:SCHOOL_SURFACE_MODEL_REF,owner:defOwner,surface:surfDef});
       exempt=(supB.minY+supE.transform.positionMicrounits[1])===Math.round(mat.planeOrDepth.planeY*1e6);
      }catch(e){exempt=false}}
     }
    }
   }if(!exempt)bad.push({pair:[entityId,oid],commandEntityWorldAabbMicrounits:cw,otherEntityWorldAabbMicrounits:ow})}
  if(bad.length)return Object.freeze({outcome:'ILLEGAL',evidence:{adapterKind:'SCHOOL_PHASE2_GEOMETRY_ADAPTER',adapterReason:'DYNAMIC_BODY_COLLISION',collidingPairs:bad,gate:'Dynamic-body AABB intersections evaluated between the command entity and every other dynamic body in the proposed world; only pairs bound by a validated support relation in the proposed state are exempt.'}})}
 return Object.freeze({outcome:result.result,evidence:{adapterKind:'SCHOOL_PHASE2_GEOMETRY_ADAPTER',request,requestDigest:digest(request),requestBytes,sceneProvenance:SCHOOL_SCENE,bodyProvenance:{classification:contract.provenance.classification,lineageStatus:contract.provenance.lineageStatus,sourceId:contract.provenance.sourceId,revision:contract.revision,digest:contract.digest},surfaceProvenance:{classification:SCHOOL_SURFACE_MODEL_REF.classification,lineageStatus:SCHOOL_SURFACE_MODEL_REF.lineageStatus,sourceId:SCHOOL_SURFACE_MODEL_REF.sourceId,revision:surfaceModel.revision,digest:surfaceModel.surfaceModelDigest,sourceEvidence:surfaceModel.sourceEvidence,resolvedSurface:(surfaceModel.surfaces.find(x=>x.surfaceId===request.surfaceId)||null)?.provenance||null},phase2ReasonCode:result.reasonCode,phase2Evidence:result.evidence,phase2ProofDigest:result.proofDigest||null,...(containmentProof?{containmentProof}:{})}})}})}
module.exports={schoolGeometryAdapter};
