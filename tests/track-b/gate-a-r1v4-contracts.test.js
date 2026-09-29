'use strict';
// TRACK B / Gate A R1 v4: the three engine integration boundaries, resolved as
// narrowly scoped contract additions with negative proofs. PRE-ADMISSION: the
// records are admissible (validators + envelope + registry path exist); nothing
// here self-admits. Formal R1 review signs exact bytes.
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),ROOT=path.join(__dirname,'../..');
const A=require(path.join(ROOT,'src/clean-runtime/authoring'));
const SYN=require(path.join(ROOT,'src/clean-runtime/school/definitions/synthetic-training-unit-v1'));
const {validateOwnerBodyBinding}=require(path.join(ROOT,'src/clean-runtime/multi-support/owner-body-binding'));
const {validateScenePackage}=require(path.join(ROOT,'src/clean-runtime/school/scene-v2/validate'));
const {instantiate}=require(path.join(ROOT,'src/clean-runtime/school/scene-v2/instantiate'));
const {PACKAGE}=require(path.join(ROOT,'src/clean-runtime/school/scene-v2/package'));
const {buildV21}=require(path.join(ROOT,'scripts/track-b/gate-a-r1v4-package-builder'));
const {SCHOOL_BAG_BODY}=require(path.join(ROOT,'src/clean-runtime/school/school-physical-contract'));

test('boundary 1: ENTITY + SUPPORT_VOLUME are admissible definition types (envelope + registry path)',()=>{
 for(const[type,def]of[['ENTITY',SYN.OWNER_ENTITY.definition],['SUPPORT_VOLUME',SYN.CONTAINMENT_VOLUME.definition]]){
  const ref=A.refFor(type,def);assert(A.TYPES.includes(type));
  const env=A.createDraft({envelopeId:'r1v4-test-'+type,definitionRef:ref,limitations:['R1 v4 proposal - pre-admission']});
  assert.equal(env.lifecycleState,'AUTHORED_NEW_DRAFT');
  const v=A.validateEnvelope(env);assert.equal(v.status,'VALIDATED');
  const adm=A.admit({definitionType:type,definition:def,envelope:env});
  assert.equal(adm.status,'REJECTED');assert.equal(adm.failure.code,'NOT_VERIFIED_FOR_SLICE','draft must not self-admit');}
 assert.throws(()=>A.refFor('ENTITY',SYN.UNIT_BODY.definition),/INVALID_DEFINITION_REF/);});
test('boundary 2: owner-body binding validates ONLY exact, proven equivalence',()=>{
 const bd=SYN.OWNER_BODY_BINDING;assert.equal(bd.status,'VALIDATED');
 const rec={bodyId:SCHOOL_BAG_BODY.bodyId,revision:SCHOOL_BAG_BODY.revision,digest:SCHOOL_BAG_BODY.geometryDigest,boundsMicrounits:SYN.BAG_BOUNDS_MU};
 const staleRec=validateOwnerBodyBinding({...structuredClone(SYN.OWNER_BODY_BINDING.binding),canonicalDigest:undefined},{recoveredBody:{...rec,digest:'0'.repeat(64)},ownerBody:SYN.OWNER_BODY.definition});
 assert.equal(staleRec.status,'REJECTED');assert.equal(staleRec.failure.code,'STALE_RECOVERED_BODY');
 const staleOwn=validateOwnerBodyBinding(structuredClone(SYN.OWNER_BODY_BINDING.binding),{recoveredBody:rec,ownerBody:{...SYN.OWNER_BODY.definition,canonicalDigest:'0'.repeat(64)}});
 assert.equal(staleOwn.status,'REJECTED');assert.equal(staleOwn.failure.code,'STALE_OWNER_BODY_RECORD');
 const mismatch=validateOwnerBodyBinding(structuredClone(SYN.OWNER_BODY_BINDING.binding),{recoveredBody:{...rec,boundsMicrounits:{...rec.boundsMicrounits,maxX:rec.boundsMicrounits.maxX+2}},ownerBody:SYN.OWNER_BODY.definition});
 assert.equal(mismatch.status,'REJECTED');assert.equal(mismatch.failure.code,'BOUNDS_MISMATCH');});
test('boundary 2: relations still fail closed WITHOUT the binding (back-compat)',()=>{
 const p=buildV21();
 const state={entities:Object.fromEntries(p.entities.map(x=>[x.entityId,x])),supportRelations:p.supportRelations};
 const {validateRelations}=require(path.join(ROOT,'src/clean-runtime/multi-support/relations'));
 const noBinding=validateRelations(p.supportRelations,state,{targetWorldRevision:1});
 assert.equal(noBinding.status,'REJECTED');assert.equal(noBinding.code,'STALE_OWNER_BODY');assert.equal(noBinding.relationId,'synthetic:unit:bag-interior-floor');
 const wrongPair=validateRelations(p.supportRelations,state,{targetWorldRevision:1,ownerBodyBindings:[{status:'VALIDATED',binding:{...SYN.OWNER_BODY_BINDING.binding,ownerBodyRef:{...SYN.OWNER_BODY_BINDING.binding.ownerBodyRef,digest:'0'.repeat(64)}}}]});
 assert.equal(wrongPair.status,'REJECTED');assert.equal(wrongPair.code,'STALE_OWNER_BODY');
 const staleWorld=validateRelations(p.supportRelations,state,{targetWorldRevision:2,ownerBodyBindings:[SYN.OWNER_BODY_BINDING]});
 assert.equal(staleWorld.status,'REJECTED');assert.match(staleWorld.code,/STALE/);});
test('boundary 3: certified v2.0.0 package path unchanged; v2.1.0 validates with all four additive pieces',()=>{
 assert.equal(validateScenePackage(PACKAGE).status,'VALIDATED');
 const p=buildV21();assert.equal(validateScenePackage(p).status,'VALIDATED');
 const noUnit=structuredClone(p);noUnit.entities=noUnit.entities.filter(e=>e.entityId!=='synthetic-training-unit-v1');noUnit.requiredEntityIds=noUnit.requiredEntityIds.filter(x=>x!=='synthetic-training-unit-v1');noUnit.supportRelations=noUnit.supportRelations.filter(r=>r.supportedEntityId!=='synthetic-training-unit-v1');delete noUnit.scenePackageDigest;const{canonicalBytes,digest}=require(path.join(ROOT,'src/clean-runtime/contracts/canonical'));noUnit.scenePackageDigest=digest({...noUnit,scenePackageDigest:undefined},'scenePackageDigest');
 assert.equal(validateScenePackage(noUnit).code,'ENTITY_MISSING_OR_DUPLICATE');
 const badDigest=structuredClone(p);badDigest.entities.find(e=>e.entityId==='synthetic-training-unit-v1').physicalBodyRef.digest='0'.repeat(64);delete badDigest.scenePackageDigest;badDigest.scenePackageDigest=digest({...badDigest,scenePackageDigest:undefined},'scenePackageDigest');
 assert.equal(validateScenePackage(badDigest).code,'SYNTHETIC_UNIT_REF_MISMATCH');
 const noBinding=structuredClone(p);delete noBinding.ownerBodyBindings;delete noBinding.scenePackageDigest;noBinding.scenePackageDigest=digest({...noBinding,scenePackageDigest:undefined},'scenePackageDigest');
 assert.equal(validateScenePackage(noBinding).code,'OWNER_BODY_BINDING_MISMATCH');
 const noFloor=structuredClone(p);delete noFloor.entities.find(e=>e.entityId==='school-medical-bag').physicalState.supportSurface;delete noFloor.scenePackageDigest;noFloor.scenePackageDigest=digest({...noFloor,scenePackageDigest:undefined},'scenePackageDigest');
 assert.equal(validateScenePackage(noFloor).code,'BAG_INTERIOR_FLOOR_MISMATCH');});
test('boundary 3 integration: v2.1.0 package instantiates atomically in a throwaway session (proposal testing, not admission)',()=>{
 const x=instantiate(buildV21());
 assert.equal(x.status,'COMMITTED',x.code||'');
 assert.equal(Object.keys(x.state.entities).length,4);
 assert.equal(x.state.supportRelations.length,4);
 assert.equal(x.replay.stateDigest,x.state.stateDigest);});
test('volume materializer: world region matches the R1 arithmetic; rotated owner throws',()=>{
 const OE=SYN.OWNER_ENTITY.definition;
 const m=A.materializeSupportVolume({owner:{entityDefinitionId:OE.entityDefinitionId,entityRevision:OE.entityRevision,entityDigest:OE.entityDigest,transform:OE.transform},volume:SYN.CONTAINMENT_VOLUME.definition});
 assert.deepEqual(m.worldRegionMicrounits,{minX:-3250000,maxX:-2750000,minY:25000,maxY:350000,minZ:850000,maxZ:1150000});
 assert.throws(()=>A.materializeSupportVolume({owner:{entityDefinitionId:OE.entityDefinitionId,entityRevision:OE.entityRevision,entityDigest:OE.entityDigest,transform:{translationMicrounits:OE.transform.translationMicrounits,orientation:[0,0,1000000,0]}},volume:SYN.CONTAINMENT_VOLUME.definition}),/UNSUPPORTED_V1_CAPABILITY/);
 assert.throws(()=>A.materializeSupportVolume({owner:{entityDefinitionId:OE.entityDefinitionId,entityRevision:OE.entityRevision,entityDigest:'0'.repeat(64),transform:OE.transform},volume:SYN.CONTAINMENT_VOLUME.definition}),/STALE_VOLUME_OWNER/);});
