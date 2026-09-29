'use strict';
// TRACK B / Gate A R1 v6: the engine's R1 v4 verdict required three fixes:
// (1) binding staleness bound to owner/body/volume revisions, not a frozen
// world revision; (2) support-volume pinning + full-3D containment + pair
// supersession in the authoritative legality path; (3) scene-validator byte
// re-validation rejecting the forged-provenance hostile repro. PRE-ADMISSION:
// admissibility + executable paths only; the formal R1 review signs exact bytes.
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),ROOT=path.join(__dirname,'../..');
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
const redigest=x=>{delete x.scenePackageDigest;x.scenePackageDigest=digest({...x,scenePackageDigest:undefined},'scenePackageDigest');return x};

test('boundary 1: ENTITY + SUPPORT_VOLUME are admissible definition types (envelope + registry path)',()=>{
 for(const[type,def]of[['ENTITY',SYN.OWNER_ENTITY.definition],['SUPPORT_VOLUME',SYN.CONTAINMENT_VOLUME.definition]]){
  const ref=A.refFor(type,def);assert(A.TYPES.includes(type));
  const env=A.createDraft({envelopeId:'r1v6-test-'+type,definitionRef:ref,limitations:['R1 v6 proposal - pre-admission']});
  assert.equal(A.validateEnvelope(env).status,'VALIDATED');
  const adm=A.admit({definitionType:type,definition:def,envelope:env});
  assert.equal(adm.status,'REJECTED');assert.equal(adm.failure.code,'NOT_VERIFIED_FOR_SLICE','draft must not self-admit');}
 assert.throws(()=>A.refFor('ENTITY',SYN.UNIT_BODY.definition),/INVALID_DEFINITION_REF/);});
test('boundary 2: owner-body binding validates ONLY exact, proven equivalence; v5 record carries no world-revision pin',()=>{
 const bd=SYN.OWNER_BODY_BINDING;assert.equal(bd.status,'VALIDATED');
 assert.equal('boundWorldRevision' in bd.binding,false,'v5: staleness lives in the body refs, never a frozen world revision');
 const rec={bodyId:SCHOOL_BAG_BODY.bodyId,revision:SCHOOL_BAG_BODY.revision,digest:SCHOOL_BAG_BODY.geometryDigest,boundsMicrounits:SYN.BAG_BOUNDS_MU};
 assert.equal(validateOwnerBodyBinding(structuredClone(bd.binding),{recoveredBody:{...rec,digest:'0'.repeat(64)},ownerBody:SYN.OWNER_BODY.definition}).failure.code,'STALE_RECOVERED_BODY');
 assert.equal(validateOwnerBodyBinding(structuredClone(bd.binding),{recoveredBody:rec,ownerBody:{...SYN.OWNER_BODY.definition,canonicalDigest:'0'.repeat(64)}}).failure.code,'STALE_OWNER_BODY_RECORD');
 assert.equal(validateOwnerBodyBinding(structuredClone(bd.binding),{recoveredBody:{...rec,boundsMicrounits:{...rec.boundsMicrounits,maxX:rec.boundsMicrounits.maxX+2}},ownerBody:SYN.OWNER_BODY.definition}).failure.code,'BOUNDS_MISMATCH');});
test('boundary 2: relations fail closed WITHOUT the binding; VALIDATE with it at world revisions 1 AND 2 (v5 fix)',()=>{
 const p=buildV21();
 const state={entities:Object.fromEntries(p.entities.map(x=>[x.entityId,x])),supportRelations:p.supportRelations};
 const noBinding=validateRelations(p.supportRelations,state,{targetWorldRevision:1});
 assert.equal(noBinding.code,'STALE_OWNER_BODY');assert.equal(noBinding.relationId,'synthetic:unit:bag-interior-floor');
 const wrongPair=validateRelations(p.supportRelations,state,{targetWorldRevision:1,ownerBodyBindings:[{status:'VALIDATED',binding:{...SYN.OWNER_BODY_BINDING.binding,ownerBodyRef:{...SYN.OWNER_BODY_BINDING.binding.ownerBodyRef,digest:'0'.repeat(64)}}}]});
 assert.equal(wrongPair.code,'STALE_OWNER_BODY');
 assert.equal(validateRelations(p.supportRelations,state,{targetWorldRevision:1,ownerBodyBindings:[SYN.OWNER_BODY_BINDING]}).status,'VALIDATED');
 const rev2=validateRelations(p.supportRelations.map(r=>({...structuredClone(r),boundWorldRevision:2})),{...state,revision:2},{targetWorldRevision:2,ownerBodyBindings:[SYN.OWNER_BODY_BINDING]});
 assert.equal(rev2.status,'VALIDATED','v5: unchanged owner/body/volume records must not go stale on an unrelated world-revision bump');});
test('boundary 3: certified v2.0.0 unchanged; v2.1.0 validates with volume pins; package negatives incl. hostile repro',()=>{
 assert.equal(validateScenePackage(PACKAGE).status,'VALIDATED');
 const p=buildV21();const v=validateScenePackage(p);assert.equal(v.status,'VALIDATED');
 assert.equal(v.ownerBodyBindings.length,1);assert.equal(v.ownerBodyBindings[0].binding.canonicalDigest,SYN.OWNER_BODY_BINDING.binding.canonicalDigest,'instantiate seeds the PACKAGE validated record');
 const noUnit=structuredClone(p);noUnit.entities=noUnit.entities.filter(e=>e.entityId!=='synthetic-training-unit-v1');noUnit.requiredEntityIds=noUnit.requiredEntityIds.filter(x=>x!=='synthetic-training-unit-v1');noUnit.supportRelations=noUnit.supportRelations.filter(r=>r.supportedEntityId!=='synthetic-training-unit-v1');
 assert.equal(validateScenePackage(redigest(noUnit)).code,'ENTITY_MISSING_OR_DUPLICATE');
 const badDigest=structuredClone(p);badDigest.entities.find(e=>e.entityId==='synthetic-training-unit-v1').physicalBodyRef.digest='0'.repeat(64);
 assert.equal(validateScenePackage(redigest(badDigest)).code,'SYNTHETIC_UNIT_REF_MISMATCH');
 const noBinding=structuredClone(p);delete noBinding.ownerBodyBindings;
 assert.equal(validateScenePackage(redigest(noBinding)).code,'OWNER_BODY_BINDING_MISMATCH');
 const noFloor=structuredClone(p);delete noFloor.entities.find(e=>e.entityId==='school-medical-bag').physicalState.supportSurface;
 assert.equal(validateScenePackage(redigest(noFloor)).code,'BAG_INTERIOR_FLOOR_MISMATCH');
 const noVol=structuredClone(p);delete noVol.entities.find(e=>e.entityId==='school-medical-bag').physicalState.supportVolume;
 assert.equal(validateScenePackage(redigest(noVol)).code,'BAG_CONTAINMENT_VOLUME_MISMATCH');
 const noVolRef=structuredClone(p);delete noVolRef.supportRelations.find(r=>r.supportedEntityId==='synthetic-training-unit-v1').supportVolumeRef;
 assert.equal(validateScenePackage(redigest(noVolRef)).code,'UNIT_VOLUME_REF_MISMATCH');
 // The engine's v5-must-reject hostile repro: forged provenance, stale digest kept, package redigested.
 const hostile=structuredClone(p);hostile.ownerBodyBindings[0].provenanceRefs=['FORGED'];
 assert.equal(validateScenePackage(redigest(hostile)).code,'OWNER_BODY_BINDING_BYTES_MISMATCH');
 const missing=structuredClone(p);delete missing.ownerBodyBindings[0].provenanceRefs;
 assert.equal(validateScenePackage(redigest(missing)).code,'OWNER_BODY_BINDING_BYTES_MISMATCH');
 // A sophisticated forge that REDIGESTS the tampered record must fail re-validation.
 const soph=structuredClone(p);soph.ownerBodyBindings[0].recoveredBodyRef={...soph.ownerBodyBindings[0].recoveredBodyRef,digest:'0'.repeat(64)};
 delete soph.ownerBodyBindings[0].canonicalDigest;soph.ownerBodyBindings[0].canonicalDigest=digest({...soph.ownerBodyBindings[0],canonicalDigest:undefined},'canonicalDigest');
 assert.equal(validateScenePackage(redigest(soph)).code,'OWNER_BODY_BINDING_INVALID:STALE_RECOVERED_BODY');});
test('boundary 3 integration: v2.1.0 instantiates atomically in a throwaway session (proposal testing, not admission)',()=>{
 const x=instantiate(buildV21());
 assert.equal(x.status,'COMMITTED',x.code||'');
 assert.equal(Object.keys(x.state.entities).length,4);
 assert.equal(x.state.supportRelations.length,4);
 assert.equal(x.replay.stateDigest,x.state.stateDigest);});
test('volume materializer: world region matches the R1 arithmetic; rotated owner throws',()=>{
 const OE=SYN.OWNER_ENTITY.definition;
 const m=A.materializeSupportVolume({owner:{entityDefinitionId:OE.entityDefinitionId,entityRevision:OE.entityRevision,entityDigest:OE.entityDigest,transform:OE.transform},volume:SYN.CONTAINMENT_VOLUME.definition});
 assert.deepEqual(m.worldRegionMicrounits,{minX:-3250000,maxX:-2750000,minY:25000,maxY:325000,minZ:850000,maxZ:1150000});
 assert.throws(()=>A.materializeSupportVolume({owner:{entityDefinitionId:OE.entityDefinitionId,entityRevision:OE.entityRevision,entityDigest:OE.entityDigest,transform:{translationMicrounits:OE.transform.translationMicrounits,orientation:[0,0,1000000,0]}},volume:SYN.CONTAINMENT_VOLUME.definition}),/UNSUPPORTED_V1_CAPABILITY/);
 assert.throws(()=>A.materializeSupportVolume({owner:{entityDefinitionId:OE.entityDefinitionId,entityRevision:OE.entityRevision,entityDigest:'0'.repeat(64),transform:OE.transform},volume:SYN.CONTAINMENT_VOLUME.definition}),/STALE_VOLUME_OWNER/);});
test('v5 runtime: engine revision-2 repro COMMITS; stale body/revision/volume, protrusion and foreign item REJECT',()=>{
 const p=buildV21(),v=validateScenePackage(p);
 const api=createMultiSupportRuntime({initialWorld:empty(),legalityPort:schoolGeometryAdapter({surfaceModel:model}),ownerBodyBindings:v.ownerBodyBindings});
 const boot=api.proposeTransaction({transactionId:'t:boot',expectedWorldRevision:0,commands:p.entities.map(e=>({commandId:'spawn:'+e.entityId,type:'SpawnEntity',expectedWorldRevision:0,entity:e})).concat(p.supportRelations.map(r=>({commandId:'support:'+r.relationId,type:'AttachSupportRelation',expectedWorldRevision:0,relation:r})))});
 assert.equal(boot.status,'COMMITTED',boot.code||'');
 const b1=api.getWorldState();
 const rebindTo=(st,rev,fn)=>st.supportRelations.map(r=>{const cl=structuredClone(r);cl.boundWorldRevision=rev;if(fn)fn(cl,r);return {commandId:'tx:rebind:'+rev+':'+r.relationId,type:'ReplaceSupportRelation',expectedWorldRevision:st.revision,relationId:r.relationId,relation:cl}});
 // The engine's exact v4-breaking repro: SetTransform unit unchanged + all 4 relations rebound to revision 2.
 const repro=api.proposeTransaction({transactionId:'t:repro',expectedWorldRevision:1,commands:[
  {commandId:'t:repro:xf',type:'SetTransform',expectedWorldRevision:1,entityId:'synthetic-training-unit-v1',transform:structuredClone(b1.entities['synthetic-training-unit-v1'].transform)},...rebindTo(b1,2)]});
 assert.equal(repro.status,'COMMITTED','v4 broke here with STALE_OWNER_BODY at revision 2; v5 must commit');
 const b2=api.getWorldState();
 const newBagBody={recordId:SCHOOL_BAG_BODY.bodyId,revision:2,digest:'0'.repeat(64)};
 const negBody=api.proposeTransaction({transactionId:'t:neg-body',expectedWorldRevision:2,commands:[
  {commandId:'t:nb:body',type:'ReplacePhysicalBody',expectedWorldRevision:2,entityId:'school-medical-bag',physicalBodyRef:newBagBody},
  ...rebindTo(b2,3,(cl,r)=>{if(r.relationId==='school:bag:floor'){cl.supportedBodyRef={id:newBagBody.recordId,revision:2,digest:newBagBody.digest};cl.contactRegionRef={...cl.contactRegionRef,bodyRevision:2,bodyDigest:newBagBody.digest}}if(r.supportedEntityId==='synthetic-training-unit-v1')cl.ownerEntityRef={...cl.ownerEntityRef,revision:2}})]});
 assert.equal(negBody.status,'REJECTED');assert.equal(negBody.code,'STALE_OWNER_BODY');
 const negRev=api.proposeTransaction({transactionId:'t:neg-rev',expectedWorldRevision:2,commands:[
  {commandId:'t:nr:xf',type:'SetTransform',expectedWorldRevision:2,entityId:'school-medical-bag',transform:structuredClone(b2.entities['school-medical-bag'].transform)},...rebindTo(b2,3)]});
 assert.equal(negRev.status,'REJECTED');assert.equal(negRev.code,'STALE_OWNER_REVISION');
 const negVol=api.proposeTransaction({transactionId:'t:neg-vol',expectedWorldRevision:2,commands:rebindTo(b2,3,(cl,r)=>{if(r.supportedEntityId==='synthetic-training-unit-v1')cl.supportVolumeRef={...cl.supportVolumeRef,digest:'0'.repeat(64)}})});
 assert.equal(negVol.status,'REJECTED');assert.equal(negVol.code,'STALE_SUPPORT_VOLUME');
 const negPro=api.proposeTransaction({transactionId:'t:neg-pro',expectedWorldRevision:2,commands:[
  {commandId:'t:np:xf',type:'SetTransform',expectedWorldRevision:2,entityId:'synthetic-training-unit-v1',transform:{positionMicrounits:[-2800000,25000,1000000],orientation:[0,0,0,1],scaleMicrounits:[1000000,1000000,1000000]}},...rebindTo(b2,3)]});
 assert.equal(negPro.status,'REJECTED');assert.equal(negPro.evidence?.detail?.evidence?.adapterReason,'CONTAINMENT_VIOLATION');
 const unit2=structuredClone(b2.entities['synthetic-training-unit-v1']);unit2.entityId='synthetic-training-unit-v2-foreign';unit2.transform={positionMicrounits:[-3000000,25000,1100000],orientation:[0,0,0,1],scaleMicrounits:[1000000,1000000,1000000]};
 const rel2=structuredClone(b2.supportRelations.find(r=>r.supportedEntityId==='synthetic-training-unit-v1'));rel2.relationId='synthetic:unit2:bag-interior-floor';rel2.supportedEntityId=unit2.entityId;rel2.boundWorldRevision=3;
 const negFor=api.proposeTransaction({transactionId:'t:neg-for',expectedWorldRevision:2,commands:[
  {commandId:'t:nf:spawn',type:'SpawnEntity',expectedWorldRevision:2,entity:unit2},
  {commandId:'t:nf:attach',type:'AttachSupportRelation',expectedWorldRevision:2,relation:rel2},...rebindTo(b2,3)]});
 assert.equal(negFor.status,'REJECTED');assert.equal(negFor.evidence?.detail?.evidence?.adapterReason,'PAIR_SUPERSESSION_SCOPE');});

test('v6 validator: volume outward expansion and boundary-touching ceiling REJECT',()=>{
 const OE=SYN.OWNER_ENTITY.definition,owner={entityDefinitionId:OE.entityDefinitionId,entityRevision:OE.entityRevision,entityDigest:OE.entityDigest,transform:OE.transform};
 const base=structuredClone(SYN.CONTAINMENT_VOLUME.definition);delete base.canonicalDigest;
 const ok=A.validateSupportVolume(base,owner,SYN.BAG_BOUNDS_MU);
 assert.equal(ok.status,'VALIDATED');
 for(const[k,v]of[['maxY',200000],['maxY',175000],['maxX',300000],['minX',-300000],['maxZ',200000],['minY',-175001]]){
  const mut=structuredClone(base);mut.localBoundsMicrounits[k]=v;
  const r=A.validateSupportVolume(mut,owner,SYN.BAG_BOUNDS_MU);
  assert.equal(r.status,'REJECTED',k+'='+v+' must reject');
  assert.equal(r.failure.code,'SUPPORT_VOLUME_EXCEEDS_OWNER_BODY',k+'='+v);}
 // backward compatibility: without owner bounds the record still validates (v2.0.0 paths unaffected)
 assert.equal(A.validateSupportVolume(structuredClone(base),owner).status,'VALIDATED');});

test('v6 runtime: executor chair hostile overlap repro REJECTS with DYNAMIC_BODY_COLLISION',()=>{
 const p=buildV21(),v=validateScenePackage(p);
 const api=createMultiSupportRuntime({initialWorld:empty(),legalityPort:schoolGeometryAdapter({surfaceModel:model}),ownerBodyBindings:v.ownerBodyBindings});
 const boot=api.proposeTransaction({transactionId:'t:boot',expectedWorldRevision:0,commands:p.entities.map(e=>({commandId:'spawn:'+e.entityId,type:'SpawnEntity',expectedWorldRevision:0,entity:e})).concat(p.supportRelations.map(r=>({commandId:'support:'+r.relationId,type:'AttachSupportRelation',expectedWorldRevision:0,relation:r})))});
 assert.equal(boot.status,'COMMITTED',boot.code||'');
 const b1=api.getWorldState();
 assert.deepEqual(b1.entities['school-treatment-chair'].transform.positionMicrounits,[-2000000,0,1000000]);
 const rebind=b1.supportRelations.map(r=>{const cl=structuredClone(r);cl.boundWorldRevision=2;return {commandId:'tx:rebind:2:'+r.relationId,type:'ReplaceSupportRelation',expectedWorldRevision:1,relationId:r.relationId,relation:cl}});
 // The executor's exact v5-breaking repro: chair moved exactly onto the unit's X/Z area and the bag's occupied space.
 const repro=api.proposeTransaction({transactionId:'t:chair-hostile',expectedWorldRevision:1,commands:[
  {commandId:'t:ch:xf',type:'SetTransform',expectedWorldRevision:1,entityId:'school-treatment-chair',transform:{positionMicrounits:[-3000000,0,1000000],orientation:[0,0,0,1],scaleMicrounits:[1000000,1000000,1000000]}},...rebind]});
 assert.equal(repro.status,'REJECTED','v5 committed this; v6 must collision-reject');
 assert.equal(repro.code,'LEGALITY_ILLEGAL');
 assert.equal(repro.evidence?.detail?.evidence?.adapterReason,'DYNAMIC_BODY_COLLISION');
 const pairs=repro.evidence?.detail?.evidence?.collidingPairs||[];
 assert(pairs.some(x=>x.pair.includes('school-treatment-chair')&&(x.pair.includes('synthetic-training-unit-v1')||x.pair.includes('school-medical-bag'))),'a chair/unit or chair/bag colliding pair must be named');
 assert.equal(api.getWorldState().stateDigest,b1.stateDigest,'atomic: no partial commit');});

test('v6 runtime: bag +10cm translation with rebound relations COMMITS (legal containment at moved owner)',()=>{
 const p=buildV21(),v=validateScenePackage(p);
 const api=createMultiSupportRuntime({initialWorld:empty(),legalityPort:schoolGeometryAdapter({surfaceModel:model}),ownerBodyBindings:v.ownerBodyBindings});
 const boot=api.proposeTransaction({transactionId:'t:boot',expectedWorldRevision:0,commands:p.entities.map(e=>({commandId:'spawn:'+e.entityId,type:'SpawnEntity',expectedWorldRevision:0,entity:e})).concat(p.supportRelations.map(r=>({commandId:'support:'+r.relationId,type:'AttachSupportRelation',expectedWorldRevision:0,relation:r})))});
 assert.equal(boot.status,'COMMITTED',boot.code||'');
 const b1=api.getWorldState();
 const rebind=b1.supportRelations.map(r=>{const cl=structuredClone(r);cl.boundWorldRevision=2;if(cl.ownerEntityRef?.id==='school-medical-bag')cl.ownerEntityRef={...cl.ownerEntityRef,revision:2};return {commandId:'tx:rebind:2:'+r.relationId,type:'ReplaceSupportRelation',expectedWorldRevision:1,relationId:r.relationId,relation:cl}});
 const move=api.proposeTransaction({transactionId:'t:bag-10cm',expectedWorldRevision:1,commands:[
  {commandId:'t:bag:xf',type:'SetTransform',expectedWorldRevision:1,entityId:'school-medical-bag',transform:{positionMicrounits:[-2900000,175000,1000000],orientation:[0,0,0,1],scaleMicrounits:[1000000,1000000,1000000]}},...rebind]});
 assert.equal(move.status,'COMMITTED','unit AABB remains within the moved interior: legal containment, must commit; got '+(move.code||'')+' '+JSON.stringify(move.evidence?.detail?.evidence?.adapterReason||''));});
