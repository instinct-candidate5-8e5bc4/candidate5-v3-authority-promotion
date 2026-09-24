'use strict';
// TRACK B / C6 interactive demo session (additive). Opens a LIVE multi-support
// runtime seeded by the exact certified instantiate transaction, then accepts
// further proposals through the SAME sole placement path: WorldMutationAPI ->
// PhysicalLegalityPort -> SchoolGeometryAdapter -> Phase 2 Geometry Gate.
// There is no direct world-state write anywhere in this module or its callers.
// Sessions are cheap and deterministic: fixed inputs produce fixed digests, so
// each demo action uses a fresh session and repeat runs are byte-identical.
const {empty}=require('./instantiate'),{PACKAGE,model}=require('./package'),{validateScenePackage}=require('./validate'),{schoolGeometryAdapter}=require('../school-geometry-adapter'),{createMultiSupportRuntime}=require('../../multi-support/runtime'),{replay}=require('../../events/replay'),{world}=require('../../contracts/world-state');
function createDemoSession(){
 const v=validateScenePackage(PACKAGE);
 const api=createMultiSupportRuntime({initialWorld:empty(),legalityPort:schoolGeometryAdapter({surfaceModel:model})});
 if(v.status!=='VALIDATED')return Object.freeze({status:'REJECTED',code:v.code});
 const commands=PACKAGE.entities.map(e=>({commandId:'spawn:'+e.entityId,type:'SpawnEntity',expectedWorldRevision:0,entity:e})).concat(PACKAGE.supportRelations.map(r=>({commandId:'support:'+r.relationId,type:'AttachSupportRelation',expectedWorldRevision:0,relation:r})));
 const init=api.proposeTransaction({transactionId:'instantiate:'+PACKAGE.scenePackageDigest,expectedWorldRevision:0,commands});
 if(init.status!=='COMMITTED')return Object.freeze({status:'REJECTED',code:'INSTANTIATION_NOT_COMMITTED'});
 const base=api.getWorldState();
 return Object.freeze({
  status:'READY',
  baseRevision:base.revision,
  baseStateDigest:base.stateDigest,
  getWorldState:()=>api.getWorldState(),
  replayResult:()=>replay(world(empty()),api.getEventLog()),
  // One proposal = one transaction through the gate. Never throws for
  // gate-level rejections; returns the frozen REJECTED record with the code.
  proposeBagPlacement({transactionId,positionMicrounits,relation}){
   const before=api.getWorldState();
   const targetRevision=before.revision+1;
   // World-revision-bound contract: every relation in the draft must bind the
   // TARGET revision, so the other entities' relations are rebound unchanged
   // (content-identical, boundWorldRevision bumped) in the same transaction.
   const rebinds=before.supportRelations.filter(r=>r.relationId!=='school:bag:floor').map(r=>({
    commandId:transactionId+':rebind:'+r.relationId,type:'ReplaceSupportRelation',expectedWorldRevision:before.revision,relationId:r.relationId,relation:{...structuredClone(r),boundWorldRevision:targetRevision}}));
   const result=api.proposeTransaction({transactionId,expectedWorldRevision:before.revision,commands:[
    {commandId:transactionId+':set-transform',type:'SetTransform',expectedWorldRevision:before.revision,entityId:'school-medical-bag',transform:{positionMicrounits:[...positionMicrounits],orientation:[0,0,0,1],scaleMicrounits:[1000000,1000000,1000000]}},
    {commandId:transactionId+':replace-support',type:'ReplaceSupportRelation',expectedWorldRevision:before.revision,relationId:'school:bag:floor',relation:{...structuredClone(relation),boundWorldRevision:targetRevision}},
    ...rebinds]});
   const after=api.getWorldState();
   return Object.freeze({status:result.status,code:result.code||null,evidence:result.evidence||null,priorStateDigest:before.stateDigest,stateDigest:after.stateDigest,worldDigestUnchanged:before.stateDigest===after.stateDigest,state:result.status==='COMMITTED'?after:null})}})}
// A relation record for the bag on a named surface. contactRegionGeometry is
// carried VERBATIM in authored meters from the locked SCHOOL_BAG_BODY geometry
// (never converted here); the gate applies each field's declared units.
function bagRelationOnSurface({relationId,surfaceId,expectedSurfaceType,capabilityId,boundWorldRevision}){
 const src=PACKAGE.supportRelations.find(r=>r.relationId==='school:bag:floor');
 return {...structuredClone(src),relationId,surfaceId,expectedSurfaceType:expectedSurfaceType||src.expectedSurfaceType,capabilityId:capabilityId||src.capabilityId,boundWorldRevision}}
module.exports={createDemoSession,bagRelationOnSurface};
