'use strict';
// Authority Routing Gate shared fixture.
//
// Builds a sealed authority registrySnapshot (independent pins, exactly the
// shape the certified Foundation envelope builder validates) plus a real
// Clean Runtime initial world whose authoritative supportRelations mirror
// that registry, so a mutation flows through the real production path:
// WorldMutationAPI -> promoted PhysicalLegalityPort -> Promotion Proof
// Planner -> Physical Capability Router -> certified V3 evaluator ->
// fail-closed aggregate -> atomic commit/reject -> event/replay chain.
//
// The geometry/contact records are the proven Foundation full-path pattern:
// a 20x20 FRONT_ONLY support surface and a 2x2 contact region in exact
// rational frames, expected contact normal opposed, all digests sealed.
const {digest}=require('../../src/clean-runtime/contracts/canonical');
const {computeImpact,plan}=require('../../src/clean-runtime/mutation/physical-proof-planner');
const {buildAuthorityEnvelope}=require('../../src/clean-runtime/v3-authority/authority-envelope-builder');
const Foundation=require('../../src/clean-runtime/mutation/v3-promotion-foundation');
const {transaction:sealTransaction}=require('../../src/clean-runtime/contracts/commands');
const G=require('../../src/numeric-frame-rotation/graph'),D=require('../../src/verified-architecture-phase2-v3/definitions'),C=require('../../src/verified-architecture-phase2-v3/closure-records');
const rf=f=>({frameId:f.frameId,revision:f.revision,digest:f.digest}),rb=b=>({bodyId:b.bodyId,revision:b.revision,digest:b.digest}),rc=c=>({contactRegionId:c.contactRegionId,revision:c.revision,digest:c.digest}),rg=(g,f)=>({geometryId:g.geometryId,revision:g.revision,digest:g.digest,localFrameRef:rf(f)});
const H=h=>h.repeat(64);
function runtimeEntity(id,extra={}){return {entityId:id,entityTypeId:'routing-gate/body',revision:1,lifecycleState:'ACTIVE',transform:{positionMicrounits:[0,0,0],orientation:[0,0,0,1],scaleMicrounits:[1000000,1000000,1000000]},parentEntityId:null,supportRelation:null,physicalBodyRef:{recordId:'routing-gate/body-record',revision:1,digest:H('3')},geometrySourceRef:{recordId:'routing-gate/geometry',revision:1,digest:H('4')},participatesIn:['collision'],postureStateId:'routing-gate',physicalParticipation:'ACTIVE',physicalState:{physicalParticipation:'ACTIVE'},...extra}}
function buildAuthority({lift='0',unpinnedBoundary=false,dropRelationRecords=false,secondSupport=false}={}){
 const w=G.sealFrame({frameId:'w-rg',frameKind:'WORLD',parentFrameRef:null,translationMicrounits:['0','0','0'],rotationQuaternionRatio:['1','0','0','0'],revision:1,provenance:'ROUTING_GATE'}),cf=G.sealFrame({frameId:'c-rg',frameKind:'ENTITY_LOCAL',parentFrameRef:rf(w),translationMicrounits:['0',lift,'0'],rotationQuaternionRatio:['1','0','0','0'],revision:1,provenance:'ROUTING_GATE'}),sf=G.sealFrame({frameId:'s-rg',frameKind:'ENTITY_LOCAL',parentFrameRef:rf(w),translationMicrounits:['0','0','0'],rotationQuaternionRatio:['1','0','0','0'],revision:1,provenance:'ROUTING_GATE'});
 const poly=(id,f,support)=>{const n=support?'20':'2';return D.define({geometryId:id,schemaVersion:'3.0.0',revision:1,provenance:{source:'ROUTING_GATE'},localFrameId:f.frameId,representationKind:'FINITE_PLANAR_REGION',shape:{vertices:[['-'+n,'0','-'+n],[n,'0','-'+n],[n,'0',n],['-'+n,'0',n]],normal:['0','1','0'],sidedness:'FRONT_ONLY'},capabilities:support?['SUPPORT']:[],limitations:[]})};
 const cg=poly('cg-rg',cf,false),sg=poly('sg-rg',sf,true);
 const b=(()=>{const x={bodyId:'b-rg',revision:1,provenance:'ROUTING_GATE',limitations:[]};x.digest=D.digest(x,'digest');return Object.freeze(x)})();
 const cr=C.contactRegion({contactRegionId:'cr-rg',revision:1,supportedBodyRef:rb(b),geometryRef:rg(cg,cf),expectedContactNormal:{valueClass:'EXACT_RATIONAL',frameRef:rf(w),components:['0','-1','0']},provenance:'ROUTING_GATE',limitations:[]});
 let sr={relationId:'sr-rg',requirement:'REQUIRED',bodyRef:rb(b),contactRegionRef:rc(cr),supportSurfaceRef:rg(sg,sf),contactPolicy:'EXACT_OPPOSED_PHYSICAL_NORMAL',frameRefs:[rf(w),rf(cf),rf(sf)],supportedEntityId:'e1'};
 sr={...sr,digest:D.digest(sr,'digest')};
 const pin=(id,k,r)=>({[k]:id,revision:r.revision,digest:r.digest});
 const authority={geometryRefs:{[cg.geometryId]:rg(cg,cf),[sg.geometryId]:rg(sg,sf)},geometryFrameRefs:{[cg.geometryId]:rf(cf),[sg.geometryId]:rf(sf)},bodyRefs:{[b.bodyId]:pin(b.bodyId,'bodyId',b)},contactRegionRefs:dropRelationRecords?{}:{[cr.contactRegionId]:pin(cr.contactRegionId,'contactRegionId',cr)},supportRelationRefs:dropRelationRecords?{}:{[sr.relationId]:pin(sr.relationId,'relationId',sr)},boundaryFeatureRefs:{}};
 let sr2=null,b2nd=null,cg2=null,sg2=null,cr2=null,cf2=null,sf2=null;
 if(secondSupport){
  cf2=G.sealFrame({frameId:'c2-rg',frameKind:'ENTITY_LOCAL',parentFrameRef:rf(w),translationMicrounits:['0','0','0'],rotationQuaternionRatio:['1','0','0','0'],revision:1,provenance:'ROUTING_GATE'});
  sf2=G.sealFrame({frameId:'s2-rg',frameKind:'ENTITY_LOCAL',parentFrameRef:rf(w),translationMicrounits:['0','0','0'],rotationQuaternionRatio:['1','0','0','0'],revision:1,provenance:'ROUTING_GATE'});
  cg2=poly('cg2-rg',cf2,false);sg2=poly('sg2-rg',sf2,true);
  b2nd=(()=>{const x={bodyId:'b2-rg',revision:1,provenance:'ROUTING_GATE',limitations:[]};x.digest=D.digest(x,'digest');return Object.freeze(x)})();
  cr2=C.contactRegion({contactRegionId:'cr2-rg',revision:1,supportedBodyRef:rb(b2nd),geometryRef:rg(cg2,cf2),expectedContactNormal:{valueClass:'EXACT_RATIONAL',frameRef:rf(w),components:['0','-1','0']},provenance:'ROUTING_GATE',limitations:[]});
  sr2={relationId:'sr2-rg',requirement:'REQUIRED',bodyRef:rb(b2nd),contactRegionRef:rc(cr2),supportSurfaceRef:rg(sg2,sf2),contactPolicy:'EXACT_OPPOSED_PHYSICAL_NORMAL',frameRefs:[rf(w),rf(cf2),rf(sf2)],supportedEntityId:'e2'};
  sr2={...sr2,digest:D.digest(sr2,'digest')};
 }
 const boundaryFeatures={};
 if(unpinnedBoundary){const rec={boundaryFeatureId:'bf-unpinned',revision:1};rec.digest=D.digest(rec,'digest');boundaryFeatures['bf-unpinned']=Object.freeze(rec)}
 if(secondSupport){
  authority.geometryRefs[cg2.geometryId]=rg(cg2,cf2);authority.geometryRefs[sg2.geometryId]=rg(sg2,sf2);
  authority.geometryFrameRefs[cg2.geometryId]=rf(cf2);authority.geometryFrameRefs[sg2.geometryId]=rf(sf2);
  authority.bodyRefs[b2nd.bodyId]=pin(b2nd.bodyId,'bodyId',b2nd);
  if(!dropRelationRecords){authority.contactRegionRefs[cr2.contactRegionId]=pin(cr2.contactRegionId,'contactRegionId',cr2);authority.supportRelationRefs[sr2.relationId]=pin(sr2.relationId,'relationId',sr2)}
 }
 let registry={authoritySnapshotId:'snapshot-rg',revision:1,definitions:{[cg.geometryId]:cg,[sg.geometryId]:sg,...(secondSupport?{[cg2.geometryId]:cg2,[sg2.geometryId]:sg2}:{})},frames:{[w.frameId]:w,[cf.frameId]:cf,[sf.frameId]:sf,...(secondSupport?{[cf2.frameId]:cf2,[sf2.frameId]:sf2}:{})},bodies:{[b.bodyId]:b,...(secondSupport?{[b2nd.bodyId]:b2nd}:{})},contactRegions:dropRelationRecords?{}:{[cr.contactRegionId]:cr,...(secondSupport?{[cr2.contactRegionId]:cr2}:{})},supportRelations:dropRelationRecords?{}:{[sr.relationId]:sr,...(secondSupport?{[sr2.relationId]:sr2}:{})},boundaryFeatures,authority};
 registry={...registry,registrySnapshotDigest:digest(registry)};
 return {registry,supportRelation:sr,secondSupportRelation:sr2};
}
function initialWorld(supportRelation,entities={},extraRelations=[]){return {worldId:'world-routing',sceneDefinitionRef:{recordId:'routing-gate/scene',revision:1,digest:H('5')},revision:0,lifecycleState:'ACTIVE',entities:{e1:runtimeEntity('e1'),...entities},physicalRelations:[],supportRelations:[supportRelation,...extraRelations],surfaces:null,environmentPhysicalState:null,committedEventSequence:0}}
const moveCommand=(entityId='e1',revision=0,id='cmd-move-1')=>({commandId:id,type:'SetTransform',expectedWorldRevision:revision,entityId,transform:{positionMicrounits:[1,0,0],orientation:[0,0,0,1],scaleMicrounits:[1000000,1000000,1000000]}});
const moveTransaction=(entityId='e1',revision=0,txId='tx-move-1',extra={})=>({transactionId:txId,expectedWorldRevision:revision,commands:[{...moveCommand(entityId,revision,'cmd-'+txId),...extra}]});
// Independent recomputation of the expected physical proof for a committed
// transaction, derived from the same certified Foundation modules the port
// uses. Tests assert the runtime event evidence equals this recomputation.
function independentProof({registry,before,after,rawTransaction}){
 const transaction=sealTransaction(rawTransaction);
 const x={beforeState:before,proposedState:after,transaction,registrySnapshot:registry};
 const impact=computeImpact(x),eb=buildAuthorityEnvelope({...x,impactSet:impact}),pp=eb.status==='READY'?plan({...x,envelope:eb.envelope}):null;
 const decision=Foundation.evaluateTransaction(x);
 const proof=Foundation.physicalProofPayload({decision,authoritySnapshotRef:eb.status==='READY'?eb.envelope.authoritySnapshotRef:null,plan:pp&&pp.status==='READY'?pp.plan:{planId:null}});
 return {impact,envelope:eb,plan:pp,decision,proof,transaction};
}
module.exports={buildAuthority,initialWorld,runtimeEntity,moveCommand,moveTransaction,independentProof,H};
