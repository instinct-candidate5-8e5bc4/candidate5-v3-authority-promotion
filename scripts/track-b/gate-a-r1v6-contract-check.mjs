#!/usr/bin/env node
// GATE A R1 v6 evidence harness: v5 fixed the engine's three R1 v4 verdict
// findings; the executor's v5 review confirmed two of three repros FIXED and
// added two more findings, both fixed and proven here:
//  (v6-1) the collision exception is no longer an evidence string: the adapter
//      now computes ACTUAL dynamic-body AABB intersections in the legality
//      path (the executor's chair overlap hostile repro REJECTS
//      DYNAMIC_BODY_COLLISION; only validated support-relation pairs exempt);
//  (v6-2) the containment volume ceiling is restored to the strict interior
//      margin (+150mm, shell top +175mm) and the validator REJECTS outward
//      expansion on any axis plus any boundary-touching ceiling.
// The original three v5 fixes remain proven below:
//  (1) owner-body-binding staleness bound to owner/body/volume revisions, not
//      a globally frozen world revision (the engine's revision-2 repro COMMITS);
//  (2) SUPPORT_VOLUME pinned + materialized in the AUTHORITATIVE legality path
//      with full-3D containment and pair-scoped supersession, with
//      protrusion/foreign-item/stale-volume negatives;
//  (3) scene package validator re-digests and re-validates the binding record
//      bytes (the engine's forged-provenance hostile repro REJECTS).
// PRE-ADMISSION: proves admissibility and executable paths only; admission
// remains the formal R1 review's call. Nothing here self-admits.
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const path=require('node:path'),ROOT=path.join(path.dirname(fileURLToPath(import.meta.url)),'../..');
const A=require(path.join(ROOT,'src/clean-runtime/authoring'));
const SYN=require(path.join(ROOT,'src/clean-runtime/school/definitions/synthetic-training-unit-v1'));
const {validateOwnerBodyBinding}=require(path.join(ROOT,'src/clean-runtime/multi-support/owner-body-binding'));
const {validateRelations}=require(path.join(ROOT,'src/clean-runtime/multi-support/relations'));
const {createMultiSupportRuntime}=require(path.join(ROOT,'src/clean-runtime/multi-support/runtime'));
const {validateScenePackage}=require(path.join(ROOT,'src/clean-runtime/school/scene-v2/validate'));
const {instantiate,empty}=require(path.join(ROOT,'src/clean-runtime/school/scene-v2/instantiate'));
const {schoolGeometryAdapter}=require(path.join(ROOT,'src/clean-runtime/school/school-geometry-adapter'));
const {PACKAGE,model}=require(path.join(ROOT,'src/clean-runtime/school/scene-v2/package'));
const {buildV21}=require(path.join(ROOT,'scripts/track-b/gate-a-r1v4-package-builder'));
const {SCHOOL_BAG_BODY}=require(path.join(ROOT,'src/clean-runtime/school/school-physical-contract'));
const {digest}=require(path.join(ROOT,'src/clean-runtime/contracts/canonical'));
const out=[];const c=(label,ok,detail)=>out.push((ok?'PASS ':'FAIL ')+label+(ok?'':' :: '+(detail||'')));
// Part C1: boundary 1 - ENTITY + SUPPORT_VOLUME admissible via envelope+registry, no self-admission.
for(const[type,def]of[['ENTITY',SYN.OWNER_ENTITY.definition],['SUPPORT_VOLUME',SYN.CONTAINMENT_VOLUME.definition]]){
 const ref=A.refFor(type,def);
 const env=A.createDraft({envelopeId:'r1v6-harness-'+type,definitionRef:ref,limitations:['R1 v6 proposal - pre-admission']});
 const adm=A.admit({definitionType:type,definition:def,envelope:env});
 c('C1 '+type+' envelope VALIDATED + registry rejects draft NOT_VERIFIED_FOR_SLICE (admissible, not self-admitted)',
  A.validateEnvelope(env).status==='VALIDATED'&&adm.status==='REJECTED'&&adm.failure.code==='NOT_VERIFIED_FOR_SLICE');}
// Part C2: boundary 2 - binding + negatives through the real validator.
const rec={bodyId:SCHOOL_BAG_BODY.bodyId,revision:SCHOOL_BAG_BODY.revision,digest:SCHOOL_BAG_BODY.geometryDigest,boundsMicrounits:SYN.BAG_BOUNDS_MU};
c('C2a owner-body binding VALIDATED (recovered bag body <-> AUTHORED_NEW owner body, AABB proven byte-equal)',SYN.OWNER_BODY_BINDING.status==='VALIDATED');
c('C2b negative: stale recovered digest REJECTED',validateOwnerBodyBinding(structuredClone(SYN.OWNER_BODY_BINDING.binding),{recoveredBody:{...rec,digest:'0'.repeat(64)},ownerBody:SYN.OWNER_BODY.definition}).failure?.code==='STALE_RECOVERED_BODY');
c('C2c negative: stale owner digest REJECTED',validateOwnerBodyBinding(structuredClone(SYN.OWNER_BODY_BINDING.binding),{recoveredBody:rec,ownerBody:{...SYN.OWNER_BODY.definition,canonicalDigest:'0'.repeat(64)}}).failure?.code==='STALE_OWNER_BODY_RECORD');
c('C2d negative: AABB mismatch REJECTED (equivalence must be proven, not asserted)',validateOwnerBodyBinding(structuredClone(SYN.OWNER_BODY_BINDING.binding),{recoveredBody:{...rec,boundsMicrounits:{...rec.boundsMicrounits,maxX:rec.boundsMicrounits.maxX+2}},ownerBody:SYN.OWNER_BODY.definition}).failure?.code==='BOUNDS_MISMATCH');
c('C2e v5: binding record carries NO world-revision pin (staleness lives in the body refs)','boundWorldRevision' in SYN.OWNER_BODY_BINDING.binding===false);
// Part C3: relations fail closed without the binding, pass with it - at ANY world revision while bodies are unchanged.
const p=buildV21(),state={entities:Object.fromEntries(p.entities.map(x=>[x.entityId,x])),supportRelations:p.supportRelations};
const noB=validateRelations(p.supportRelations,state,{targetWorldRevision:1});
c('C3a relations fail closed WITHOUT binding: STALE_OWNER_BODY on the unit relation',noB.status==='REJECTED'&&noB.code==='STALE_OWNER_BODY'&&noB.relationId==='synthetic:unit:bag-interior-floor');
const withB=validateRelations(p.supportRelations,state,{targetWorldRevision:1,ownerBodyBindings:[SYN.OWNER_BODY_BINDING]});
c('C3b relations VALIDATED with the admitted binding (scoped to exactly this pair)',withB.status==='VALIDATED');
const withB2=validateRelations(p.supportRelations.map(r=>({...structuredClone(r),boundWorldRevision:2})),{entities:state.entities,revision:2,supportRelations:p.supportRelations},{targetWorldRevision:2,ownerBodyBindings:[SYN.OWNER_BODY_BINDING]});
c('C3c v5: same binding VALIDATES at world revision 2 (no world-frozen pin; owner/body/volume unchanged)',withB2.status==='VALIDATED',withB2.code);
// Part C4: boundary 3 - scene v2.0.0 unchanged, v2.1.0 + negatives incl. the engine's hostile repro.
c('C4a certified v2.0.0 package VALIDATED (path byte-unchanged)',validateScenePackage(PACKAGE).status==='VALIDATED');
c('C4b v2.1.0 proposal package VALIDATED (4 entities, binding, interior floor, volume pins)',validateScenePackage(p).status==='VALIDATED');
const redigest=x=>{delete x.scenePackageDigest;x.scenePackageDigest=digest({...x,scenePackageDigest:undefined},'scenePackageDigest');return x};
const n1=structuredClone(p);n1.entities=n1.entities.filter(e=>e.entityId!=='synthetic-training-unit-v1');n1.requiredEntityIds=n1.requiredEntityIds.filter(x=>x!=='synthetic-training-unit-v1');n1.supportRelations=n1.supportRelations.filter(r=>r.supportedEntityId!=='synthetic-training-unit-v1');
c('C4c negative: v2.1.0 without the unit REJECTED',validateScenePackage(redigest(n1)).code==='ENTITY_MISSING_OR_DUPLICATE');
const n2=structuredClone(p);n2.entities.find(e=>e.entityId==='synthetic-training-unit-v1').physicalBodyRef.digest='0'.repeat(64);
c('C4d negative: stale unit body digest REJECTED',validateScenePackage(redigest(n2)).code==='SYNTHETIC_UNIT_REF_MISMATCH');
const n3=structuredClone(p);delete n3.ownerBodyBindings;
c('C4e negative: missing owner-body binding REJECTED',validateScenePackage(redigest(n3)).code==='OWNER_BODY_BINDING_MISMATCH');
const n4=structuredClone(p);delete n4.entities.find(e=>e.entityId==='school-medical-bag').physicalState.supportSurface;
c('C4f negative: missing bag interior floor REJECTED',validateScenePackage(redigest(n4)).code==='BAG_INTERIOR_FLOOR_MISMATCH');
const n5=structuredClone(p);delete n5.entities.find(e=>e.entityId==='school-medical-bag').physicalState.supportVolume;
c('C4g v5 negative: missing bag containment volume REJECTED',validateScenePackage(redigest(n5)).code==='BAG_CONTAINMENT_VOLUME_MISMATCH');
const n6=structuredClone(p);delete n6.supportRelations.find(r=>r.supportedEntityId==='synthetic-training-unit-v1').supportVolumeRef;
c('C4h v5 negative: missing unit relation volume pin REJECTED',validateScenePackage(redigest(n6)).code==='UNIT_VOLUME_REF_MISMATCH');
// The engine's v5-must-reject hostile repro: forged provenance, stale digest kept, package redigested.
const h1=structuredClone(p);h1.ownerBodyBindings[0].provenanceRefs=['FORGED'];
c('C4i v5 HOSTILE REPRO: forged provenanceRefs with stale digest kept REJECTED',validateScenePackage(redigest(h1)).code==='OWNER_BODY_BINDING_BYTES_MISMATCH');
const h2=structuredClone(p);delete h2.ownerBodyBindings[0].provenanceRefs;
c('C4j v5 negative: missing provenanceRefs REJECTED',validateScenePackage(redigest(h2)).code==='OWNER_BODY_BINDING_BYTES_MISMATCH');
// A sophisticated forge that REDIGESTS the tampered record must still fail re-validation.
const h3=structuredClone(p);h3.ownerBodyBindings[0].recoveredBodyRef={...h3.ownerBodyBindings[0].recoveredBodyRef,digest:'0'.repeat(64)};
delete h3.ownerBodyBindings[0].canonicalDigest;h3.ownerBodyBindings[0].canonicalDigest=digest({...h3.ownerBodyBindings[0],canonicalDigest:undefined},'canonicalDigest');
c('C4k v5 negative: redigested forged recovered ref REJECTED by re-validation',validateScenePackage(redigest(h3)).code==='OWNER_BODY_BINDING_INVALID:STALE_RECOVERED_BODY');
// Part C5: integration - throwaway instantiate (proposal testing, not admission).
const x=instantiate(p);
c('C5 v2.1.0 instantiates atomically in throwaway session: 4 entities, 4 relations, replay digest match',x.status==='COMMITTED'&&Object.keys(x.state.entities).length===4&&x.state.supportRelations.length===4&&x.replay.stateDigest===x.state.stateDigest,x.code);
// Part C6: volume materialization + capability walls.
const OE=SYN.OWNER_ENTITY.definition;
const m=A.materializeSupportVolume({owner:{entityDefinitionId:OE.entityDefinitionId,entityRevision:OE.entityRevision,entityDigest:OE.entityDigest,transform:OE.transform},volume:SYN.CONTAINMENT_VOLUME.definition});
c('C6a containment volume materializes to world region X[-3.25,-2.75] Y[0.025,0.325] Z[0.85,1.15] (v6: strict interior ceiling)',JSON.stringify(m.worldRegionMicrounits)===JSON.stringify({minX:-3250000,maxX:-2750000,minY:25000,maxY:325000,minZ:850000,maxZ:1150000}));
let threw='';try{A.materializeSupportVolume({owner:{entityDefinitionId:OE.entityDefinitionId,entityRevision:OE.entityRevision,entityDigest:OE.entityDigest,transform:{translationMicrounits:OE.transform.translationMicrounits,orientation:[0,0,1000000,0]}},volume:SYN.CONTAINMENT_VOLUME.definition})}catch(e){threw=e.code}
c('C6b rotated owner throws UNSUPPORTED_V1_CAPABILITY',threw==='UNSUPPORTED_V1_CAPABILITY');
// Part C7: Gate C fixture explicitly NOT reused.
const src=require('node:fs').readFileSync(path.join(ROOT,'src/clean-runtime/school/school-geometry-adapter.js'),'utf8');
c('C7 Gate C fixture branch untouched; unit branch is separate and keyed on the certified unit body id',
 src.includes("isSynthetic=body?.recordId==='synthetic/gate-c-supported-box-body'")&&src.includes('isTrainingUnit=body?.recordId===SYN.UNIT_BODY.definition.bodyDefinitionId')&&SYN.UNIT_BODY.definition.bodyDefinitionId!=='synthetic/gate-c-supported-box-body');
// Part C8: v5 runtime proofs - the engine's exact revision-2 repro COMMITS; all stale/containment negatives REJECT.
const v=validateScenePackage(p);
const api=createMultiSupportRuntime({initialWorld:empty(),legalityPort:schoolGeometryAdapter({surfaceModel:model}),ownerBodyBindings:v.ownerBodyBindings});
const boot=api.proposeTransaction({transactionId:'r1v6:boot',expectedWorldRevision:0,commands:p.entities.map(e=>({commandId:'spawn:'+e.entityId,type:'SpawnEntity',expectedWorldRevision:0,entity:e})).concat(p.supportRelations.map(r=>({commandId:'support:'+r.relationId,type:'AttachSupportRelation',expectedWorldRevision:0,relation:r})))});
const b1=api.getWorldState();
const rebindTo=(st,rev,fn)=>st.supportRelations.map(r=>{const cl=structuredClone(r);cl.boundWorldRevision=rev;if(fn)fn(cl,r);return {commandId:'tx:rebind:'+rev+':'+r.relationId,type:'ReplaceSupportRelation',expectedWorldRevision:st.revision,relationId:r.relationId,relation:cl}});
const repro=api.proposeTransaction({transactionId:'r1v6:engine-repro',expectedWorldRevision:1,commands:[
 {commandId:'r1v6:set-transform',type:'SetTransform',expectedWorldRevision:1,entityId:'synthetic-training-unit-v1',transform:structuredClone(b1.entities['synthetic-training-unit-v1'].transform)},
 ...rebindTo(b1,2)]});
c('C8a v5 ENGINE REPRO: SetTransform unit unchanged + all 4 relations rebound to revision 2 COMMITS (v4 broke here: STALE_OWNER_BODY)',boot.status==='COMMITTED'&&repro.status==='COMMITTED',(boot.code||'')+' '+(repro.code||''));
const b2=api.getWorldState();
const newBagBody={recordId:SCHOOL_BAG_BODY.bodyId,revision:2,digest:'0'.repeat(64)};
const negBody=api.proposeTransaction({transactionId:'r1v6:neg-body',expectedWorldRevision:2,commands:[
 {commandId:'r1v6:nb:body',type:'ReplacePhysicalBody',expectedWorldRevision:2,entityId:'school-medical-bag',physicalBodyRef:newBagBody},
 ...rebindTo(b2,3,(cl,r)=>{if(r.relationId==='school:bag:floor'){cl.supportedBodyRef={id:newBagBody.recordId,revision:2,digest:newBagBody.digest};cl.contactRegionRef={...cl.contactRegionRef,bodyRevision:2,bodyDigest:newBagBody.digest}}if(r.supportedEntityId==='synthetic-training-unit-v1')cl.ownerEntityRef={...cl.ownerEntityRef,revision:2}})]});
c('C8b v5 negative: replaced bag body -> unit relation STALE_OWNER_BODY',negBody.status==='REJECTED'&&negBody.code==='STALE_OWNER_BODY',negBody.code);
const negRev=api.proposeTransaction({transactionId:'r1v6:neg-rev',expectedWorldRevision:2,commands:[
 {commandId:'r1v6:nr:xf',type:'SetTransform',expectedWorldRevision:2,entityId:'school-medical-bag',transform:structuredClone(b2.entities['school-medical-bag'].transform)},
 ...rebindTo(b2,3)]});
c('C8c v5 negative: owner revision bump without relation update -> STALE_OWNER_REVISION',negRev.status==='REJECTED'&&negRev.code==='STALE_OWNER_REVISION',negRev.code);
const negVol=api.proposeTransaction({transactionId:'r1v6:neg-vol',expectedWorldRevision:2,commands:rebindTo(b2,3,(cl,r)=>{if(r.supportedEntityId==='synthetic-training-unit-v1')cl.supportVolumeRef={...cl.supportVolumeRef,digest:'0'.repeat(64)}})});
c('C8d v5 negative: forged volume digest on the unit relation -> STALE_SUPPORT_VOLUME',negVol.status==='REJECTED'&&negVol.code==='STALE_SUPPORT_VOLUME',negVol.code);
const negPro=api.proposeTransaction({transactionId:'r1v6:neg-protrusion',expectedWorldRevision:2,commands:[
 {commandId:'r1v6:np:xf',type:'SetTransform',expectedWorldRevision:2,entityId:'synthetic-training-unit-v1',transform:{positionMicrounits:[-2800000,25000,1000000],orientation:[0,0,0,1],scaleMicrounits:[1000000,1000000,1000000]}},
 ...rebindTo(b2,3)]});
c('C8e v5 negative: unit protruding 0.2m out of the containment volume -> legality CONTAINMENT_VIOLATION',negPro.status==='REJECTED'&&negPro.evidence?.detail?.evidence?.adapterReason==='CONTAINMENT_VIOLATION',negPro.code);
const unit2=structuredClone(b2.entities['synthetic-training-unit-v1']);unit2.entityId='synthetic-training-unit-v2-foreign';unit2.transform={positionMicrounits:[-3000000,25000,1100000],orientation:[0,0,0,1],scaleMicrounits:[1000000,1000000,1000000]};
const rel2=structuredClone(b2.supportRelations.find(r=>r.supportedEntityId==='synthetic-training-unit-v1'));rel2.relationId='synthetic:unit2:bag-interior-floor';rel2.supportedEntityId=unit2.entityId;rel2.boundWorldRevision=3;
const negFor=api.proposeTransaction({transactionId:'r1v6:neg-foreign',expectedWorldRevision:2,commands:[
 {commandId:'r1v6:nf:spawn',type:'SpawnEntity',expectedWorldRevision:2,entity:unit2},
 {commandId:'r1v6:nf:attach',type:'AttachSupportRelation',expectedWorldRevision:2,relation:rel2},
 ...rebindTo(b2,3)]});
c('C8f v5 negative: foreign item claiming the same containment -> legality PAIR_SUPERSESSION_SCOPE',negFor.status==='REJECTED'&&negFor.evidence?.detail?.evidence?.adapterReason==='PAIR_SUPERSESSION_SCOPE',negFor.code);
// Part C8g/C8h (v6): dynamic-pair intersection gate in the authoritative legality path.
const chairRepro=api.proposeTransaction({transactionId:'r1v6:chair-hostile',expectedWorldRevision:2,commands:[
 {commandId:'r1v6:ch:xf',type:'SetTransform',expectedWorldRevision:2,entityId:'school-treatment-chair',transform:{positionMicrounits:[-3000000,0,1000000],orientation:[0,0,0,1],scaleMicrounits:[1000000,1000000,1000000]}},
 ...rebindTo(b2,3)]});
c('C8g v6 negative: EXECUTOR CHAIR HOSTILE REPRO (chair moved onto unit X/Z + bag occupied space) -> legality DYNAMIC_BODY_COLLISION, atomic',chairRepro.status==='REJECTED'&&chairRepro.evidence?.detail?.evidence?.adapterReason==='DYNAMIC_BODY_COLLISION'&&(chairRepro.evidence?.detail?.evidence?.collidingPairs||[]).some(x=>x.pair.includes('school-treatment-chair'))&&api.getWorldState().stateDigest===b2.stateDigest,chairRepro.code);
const bagMove=api.proposeTransaction({transactionId:'r1v6:bag-10cm',expectedWorldRevision:2,commands:[
 {commandId:'r1v6:bag:xf',type:'SetTransform',expectedWorldRevision:2,entityId:'school-medical-bag',transform:{positionMicrounits:[-2900000,175000,1000000],orientation:[0,0,0,1],scaleMicrounits:[1000000,1000000,1000000]}},
 ...rebindTo(b2,3,(cl,r)=>{if(cl.ownerEntityRef?.id==='school-medical-bag')cl.ownerEntityRef={...cl.ownerEntityRef,revision:2}})]});
c('C8h v6 legal: bag +10cm translation, unit still inside moved interior -> COMMITS (containment semantics confirmed legal case)',bagMove.status==='COMMITTED',bagMove.code);
// Part C4l/C4m (v6): volume strictly inside the owner shell, outward expansion rejected.
const volBase=structuredClone(SYN.CONTAINMENT_VOLUME.definition);delete volBase.canonicalDigest;
const volOwner={entityDefinitionId:SYN.OWNER_ENTITY.definition.entityDefinitionId,entityRevision:SYN.OWNER_ENTITY.definition.entityRevision,entityDigest:SYN.OWNER_ENTITY.definition.entityDigest,transform:SYN.OWNER_ENTITY.definition.transform};
c('C4l v6 negative: volume outward expansion REJECTED on every axis (maxY 200mm / maxX 300mm / minX -300mm / maxZ 200mm / minY -175.001mm)',[['maxY',200000],['maxX',300000],['minX',-300000],['maxZ',200000],['minY',-175001]].every(([k,v])=>{const m=structuredClone(volBase);m.localBoundsMicrounits[k]=v;const r=A.validateSupportVolume(m,volOwner,SYN.BAG_BOUNDS_MU);return r.status==='REJECTED'&&r.failure.code==='SUPPORT_VOLUME_EXCEEDS_OWNER_BODY'}));
const volTouch=structuredClone(volBase);volTouch.localBoundsMicrounits.maxY=175000;
c('C4m v6 negative: boundary-touching ceiling (+175mm = shell top) REJECTED; interior ceiling is strictly inside (+150mm VALIDATED)',(()=>{const r=A.validateSupportVolume(volTouch,volOwner,SYN.BAG_BOUNDS_MU);const ok=A.validateSupportVolume(structuredClone(volBase),volOwner,SYN.BAG_BOUNDS_MU);return r.status==='REJECTED'&&r.failure.code==='SUPPORT_VOLUME_EXCEEDS_OWNER_BODY'&&ok.status==='VALIDATED'})());
out.forEach(x=>console.log(x));
const fails=out.filter(x=>x.startsWith('FAIL'));
console.log('RESULT: '+(fails.length?'FAIL ('+fails.length+')':'PASS - '+out.length+' checks'));
process.exit(fails.length?1:0);
