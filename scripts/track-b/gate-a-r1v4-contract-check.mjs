#!/usr/bin/env node
// GATE A R1 v4 evidence harness: runs the three engine integration boundary
// resolutions through the REAL repo contracts (no hand-asserted outcomes).
// PRE-ADMISSION: proves the records are admissible and the integration paths
// execute; nothing here admits a definition or commits a certified world.
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const path=require('node:path'),ROOT=path.join(path.dirname(fileURLToPath(import.meta.url)),'../..');
const A=require(path.join(ROOT,'src/clean-runtime/authoring'));
const SYN=require(path.join(ROOT,'src/clean-runtime/school/definitions/synthetic-training-unit-v1'));
const {validateOwnerBodyBinding}=require(path.join(ROOT,'src/clean-runtime/multi-support/owner-body-binding'));
const {validateRelations}=require(path.join(ROOT,'src/clean-runtime/multi-support/relations'));
const {validateScenePackage}=require(path.join(ROOT,'src/clean-runtime/school/scene-v2/validate'));
const {instantiate}=require(path.join(ROOT,'src/clean-runtime/school/scene-v2/instantiate'));
const {PACKAGE}=require(path.join(ROOT,'src/clean-runtime/school/scene-v2/package'));
const {buildV21}=require(path.join(ROOT,'scripts/track-b/gate-a-r1v4-package-builder'));
const {SCHOOL_BAG_BODY}=require(path.join(ROOT,'src/clean-runtime/school/school-physical-contract'));
const {digest}=require(path.join(ROOT,'src/clean-runtime/contracts/canonical'));
const out=[];const c=(label,ok,detail)=>out.push((ok?'PASS ':'FAIL ')+label+(ok?'':' :: '+(detail||'')));
// Part C1: boundary 1 - ENTITY + SUPPORT_VOLUME admissible via envelope+registry, no self-admission.
for(const[type,def]of[['ENTITY',SYN.OWNER_ENTITY.definition],['SUPPORT_VOLUME',SYN.CONTAINMENT_VOLUME.definition]]){
 const ref=A.refFor(type,def);
 const env=A.createDraft({envelopeId:'r1v4-harness-'+type,definitionRef:ref,limitations:['R1 v4 proposal - pre-admission']});
 const adm=A.admit({definitionType:type,definition:def,envelope:env});
 c('C1 '+type+' envelope VALIDATED + registry rejects draft NOT_VERIFIED_FOR_SLICE (admissible, not self-admitted)',
  A.validateEnvelope(env).status==='VALIDATED'&&adm.status==='REJECTED'&&adm.failure.code==='NOT_VERIFIED_FOR_SLICE');}
// Part C2: boundary 2 - binding + negatives through the real validator.
const rec={bodyId:SCHOOL_BAG_BODY.bodyId,revision:SCHOOL_BAG_BODY.revision,digest:SCHOOL_BAG_BODY.geometryDigest,boundsMicrounits:SYN.BAG_BOUNDS_MU};
c('C2a owner-body binding VALIDATED (recovered bag body <-> AUTHORED_NEW owner body, AABB proven byte-equal)',SYN.OWNER_BODY_BINDING.status==='VALIDATED');
c('C2b negative: stale recovered digest REJECTED',validateOwnerBodyBinding(structuredClone(SYN.OWNER_BODY_BINDING.binding),{recoveredBody:{...rec,digest:'0'.repeat(64)},ownerBody:SYN.OWNER_BODY.definition}).failure?.code==='STALE_RECOVERED_BODY');
c('C2c negative: stale owner digest REJECTED',validateOwnerBodyBinding(structuredClone(SYN.OWNER_BODY_BINDING.binding),{recoveredBody:rec,ownerBody:{...SYN.OWNER_BODY.definition,canonicalDigest:'0'.repeat(64)}}).failure?.code==='STALE_OWNER_BODY_RECORD');
c('C2d negative: AABB mismatch REJECTED (equivalence must be proven, not asserted)',validateOwnerBodyBinding(structuredClone(SYN.OWNER_BODY_BINDING.binding),{recoveredBody:{...rec,boundsMicrounits:{...rec.boundsMicrounits,maxX:rec.boundsMicrounits.maxX+2}},ownerBody:SYN.OWNER_BODY.definition}).failure?.code==='BOUNDS_MISMATCH');
// Part C3: relations fail closed without the binding, pass with it.
const p=buildV21(),state={entities:Object.fromEntries(p.entities.map(x=>[x.entityId,x])),supportRelations:p.supportRelations};
const noB=validateRelations(p.supportRelations,state,{targetWorldRevision:1});
c('C3a relations fail closed WITHOUT binding: STALE_OWNER_BODY on the unit relation',noB.status==='REJECTED'&&noB.code==='STALE_OWNER_BODY'&&noB.relationId==='synthetic:unit:bag-interior-floor');
const withB=validateRelations(p.supportRelations,state,{targetWorldRevision:1,ownerBodyBindings:[SYN.OWNER_BODY_BINDING]});
c('C3b relations VALIDATED with the admitted binding (scoped to exactly this pair + world revision)',withB.status==='VALIDATED');
// Part C4: boundary 3 - scene v2.0.0 unchanged, v2.1.0 + negatives.
c('C4a certified v2.0.0 package VALIDATED (path byte-unchanged)',validateScenePackage(PACKAGE).status==='VALIDATED');
c('C4b v2.1.0 proposal package VALIDATED (4 entities, binding, interior floor)',validateScenePackage(p).status==='VALIDATED');
const redigest=x=>{delete x.scenePackageDigest;x.scenePackageDigest=digest({...x,scenePackageDigest:undefined},'scenePackageDigest');return x};
const n1=structuredClone(p);n1.entities=n1.entities.filter(e=>e.entityId!=='synthetic-training-unit-v1');n1.requiredEntityIds=n1.requiredEntityIds.filter(x=>x!=='synthetic-training-unit-v1');n1.supportRelations=n1.supportRelations.filter(r=>r.supportedEntityId!=='synthetic-training-unit-v1');
c('C4c negative: v2.1.0 without the unit REJECTED',validateScenePackage(redigest(n1)).code==='ENTITY_MISSING_OR_DUPLICATE');
const n2=structuredClone(p);n2.entities.find(e=>e.entityId==='synthetic-training-unit-v1').physicalBodyRef.digest='0'.repeat(64);
c('C4d negative: stale unit body digest REJECTED',validateScenePackage(redigest(n2)).code==='SYNTHETIC_UNIT_REF_MISMATCH');
const n3=structuredClone(p);delete n3.ownerBodyBindings;
c('C4e negative: missing owner-body binding REJECTED',validateScenePackage(redigest(n3)).code==='OWNER_BODY_BINDING_MISMATCH');
const n4=structuredClone(p);delete n4.entities.find(e=>e.entityId==='school-medical-bag').physicalState.supportSurface;
c('C4f negative: missing bag interior floor REJECTED',validateScenePackage(redigest(n4)).code==='BAG_INTERIOR_FLOOR_MISMATCH');
// Part C5: integration - throwaway instantiate (proposal testing, not admission).
const x=instantiate(p);
c('C5 v2.1.0 instantiates atomically in throwaway session: 4 entities, 4 relations, replay digest match',x.status==='COMMITTED'&&Object.keys(x.state.entities).length===4&&x.state.supportRelations.length===4&&x.replay.stateDigest===x.state.stateDigest,x.code);
// Part C6: volume materialization + capability walls.
const OE=SYN.OWNER_ENTITY.definition;
const m=A.materializeSupportVolume({owner:{entityDefinitionId:OE.entityDefinitionId,entityRevision:OE.entityRevision,entityDigest:OE.entityDigest,transform:OE.transform},volume:SYN.CONTAINMENT_VOLUME.definition});
c('C6a containment volume materializes to world region X[-3.25,-2.75] Y[0.025,0.35] Z[0.85,1.15]',JSON.stringify(m.worldRegionMicrounits)===JSON.stringify({minX:-3250000,maxX:-2750000,minY:25000,maxY:350000,minZ:850000,maxZ:1150000}));
let threw='';try{A.materializeSupportVolume({owner:{entityDefinitionId:OE.entityDefinitionId,entityRevision:OE.entityRevision,entityDigest:OE.entityDigest,transform:{translationMicrounits:OE.transform.translationMicrounits,orientation:[0,0,1000000,0]}},volume:SYN.CONTAINMENT_VOLUME.definition})}catch(e){threw=e.code}
c('C6b rotated owner throws UNSUPPORTED_V1_CAPABILITY',threw==='UNSUPPORTED_V1_CAPABILITY');
// Part C7: Gate C fixture explicitly NOT reused.
const src=require('node:fs').readFileSync(path.join(ROOT,'src/clean-runtime/school/school-geometry-adapter.js'),'utf8');
c('C7 Gate C fixture branch untouched; unit branch is separate and keyed on the certified unit body id',
 src.includes("isSynthetic=body?.recordId==='synthetic/gate-c-supported-box-body'")&&src.includes('isTrainingUnit=body?.recordId===SYN.UNIT_BODY.definition.bodyDefinitionId')&&SYN.UNIT_BODY.definition.bodyDefinitionId!=='synthetic/gate-c-supported-box-body');
out.forEach(x=>console.log(x));
const fails=out.filter(x=>x.startsWith('FAIL'));
console.log('RESULT: '+(fails.length?'FAIL ('+fails.length+')':'PASS - '+out.length+' checks'));
process.exit(fails.length?1:0);
