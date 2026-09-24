'use strict';
// TRACK B / C6 interactive demo gates (host-independent). Every action goes
// through the sole placement path; the ENGINE decides legality; rejections
// leave the world digest unchanged; commits are deterministic.
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const ROOT=path.join(__dirname,'../..');
const {createDemoSession,bagRelationOnSurface}=require(path.join(ROOT,'src/clean-runtime/school/scene-v2/demo-session.js'));
const {PACKAGE}=require(path.join(ROOT,'src/clean-runtime/school/scene-v2/package.js'));
const {buildVisualSceneDescriptor}=require(path.join(ROOT,'src/clean-runtime/school/scene-v2/visual-descriptor.js'));
const SRC=PACKAGE.supportRelations.find(r=>r.relationId==='school:bag:floor');
const BASE='fa1bbaa985a63a8bfa30c2bbd7fbaf14b2c4972d985815a093bdd68f7fe954ea';
const PKG='187cf1a4c0af01ef12087879f44eeb88a355499a860665e29cdb2f5ab0d06aec';
function seatRelation(){return {...structuredClone(SRC),supportSourceKind:'ENTITY_OWNED',surfaceModelRef:undefined,surfaceId:undefined,expectedSurfaceType:undefined,
 ownerEntityRef:{id:'school-treatment-chair',revision:1},
 ownerBodyRef:{id:'school/treatment-chair',revision:1,digest:'1e78439ad5977c6c050475b4ac692cee9fce7da034725ea88a7ed4f0b0803247'},
 supportSurfaceRef:{id:'school/treatment-chair-seat',revision:1,digest:'08028ddd3faa51edaba2c202b44f91c18e3f60ac5c74b353a14d4ab89ba5501d'},
 capabilityId:'full-footprint-chair-seat',contactNormal:{x:0,y:1,z:0},evidenceRefs:['gate-c-chair-authoring-001','phase2-v1-full-body-contact']}}
test('C6 session seeds the exact certified committed world',()=>{
 const s=createDemoSession();
 assert.equal(s.status,'READY');
 assert.equal(s.baseStateDigest,BASE)});
test('C6 chair-seat: the ENGINE rejects (CONTACT_GAP_FLOATING), world digest UNCHANGED',()=>{
 const s=createDemoSession();
 const r=s.proposeBagPlacement({transactionId:'demo:bag-to-chair-seat:1',positionMicrounits:[-2000000,665000,1000000],relation:seatRelation()});
 assert.equal(r.status,'REJECTED');
 assert.equal(r.code,'LEGALITY_FAIL');
 const reason=r.evidence&&r.evidence.detail&&r.evidence.detail.evidence&&r.evidence.detail.evidence.phase2ReasonCode;
 assert.equal(reason,'CONTACT_GAP_FLOATING','the gate truth: seat is not an admitted surface on this path; the bag would float 0.49m over the floor');
 assert.equal(r.worldDigestUnchanged,true);
 assert.equal(r.stateDigest,BASE)});
test('C6 legal floor target: COMMITTED, descriptor rebuilt from new world, anchors hold',()=>{
 const s=createDemoSession();
 const r=s.proposeBagPlacement({transactionId:'demo:bag-to-floor-beside-chair:1',positionMicrounits:[-1200000,175000,1000000],relation:structuredClone(SRC)});
 assert.equal(r.status,'COMMITTED',JSON.stringify(r.evidence).slice(0,200));
 assert.notEqual(r.stateDigest,BASE);
 const nd=buildVisualSceneDescriptor({status:'COMMITTED',after:s.getWorldState(),replay:s.replayResult()});
 assert.equal(nd.status,'COMMITTED');
 assert.equal(nd.sourcePackage.scenePackageDigest,PKG);
 assert.equal(nd.worldRef.stateDigest,r.stateDigest);
 assert.equal(nd.worldRef.replayMatchesCommittedState,true)});
test('C6 illegal wall placement: REJECTED (OBSTACLE_PENETRATION), digest unchanged, deterministic repeat',()=>{
 const run=()=>{const s=createDemoSession();return s.proposeBagPlacement({transactionId:'demo:bag-into-wall:1',positionMicrounits:[0,175000,-3900000],relation:structuredClone(SRC)})};
 const a=run(),b=run();
 assert.equal(a.status,'REJECTED');
 assert.equal(a.code,'LEGALITY_FAIL');
 assert.equal(a.evidence.detail.evidence.phase2ReasonCode,'OBSTACLE_PENETRATION');
 assert.equal(a.worldDigestUnchanged,true);
 assert.equal(a.stateDigest,BASE);
 assert.deepEqual({c:b.code,d:b.stateDigest,p:b.priorStateDigest},{c:a.code,d:a.stateDigest,p:a.priorStateDigest},'repeat run is byte-deterministic')});
test('C6 legal commit is deterministic across fresh sessions',()=>{
 const run=()=>{const s=createDemoSession();return s.proposeBagPlacement({transactionId:'demo:bag-to-floor-beside-chair:1',positionMicrounits:[-1200000,175000,1000000],relation:structuredClone(SRC)})};
 assert.equal(run().stateDigest,run().stateDigest)});
