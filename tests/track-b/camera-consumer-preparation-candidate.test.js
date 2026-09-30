'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{digest}=require('../../src/clean-runtime/contracts/canonical'),C=require('../../src/clean-runtime/school/camera-consumer-preparation/candidate'),G=require('../../src/clean-runtime/school/scene-camera-geometry'),W=require('../../src/clean-runtime/school/scene-extension-replay/candidate'),P=require('../../src/clean-runtime/school/scene-extension-admission/pins'),packet=require('../../evidence/track-b/scene-camera-candidate/packet-v1_5.json'),snapshot=require('../../evidence/track-b/scene-extension-admission/owner-camera-evidence/execute-snapshot.json'),pinset=require('../../evidence/track-b/scene-extension-admission/preparation-source-pins.json');
function args(){return {packet,history:snapshot.history,proposedState:G.validatePacket(packet),cameraTransform:packet.sweepSpec.waypoints[0].transform,requestedEffectScope:'EVIDENCE_ONLY_CAMERA_COVERAGE'}}
test('exact approved overlay record binds read-only camera evidence, never upgrades UNKNOWN or activates anything',()=>{
 const a=args(),before=digest(a),r=C.inspectCameraConsumerPreparation(a);
 assert.equal(r.status,'READ_ONLY_CAMERA_EVIDENCE_BINDING_PREPARED_NOT_OPERATIONALLY_ADMITTED');assert.equal(r.underlyingCameraOutcome,'UNKNOWN');assert.equal(r.underlyingCameraReason,'SCENE_ADMISSION_PENDING');assert.equal(r.operationalStatus,'UNKNOWN');assert.equal(digest(a),before);assert.deepEqual(P.sourcePins(),pinset.sourcePins);assert.equal(packet.extension.status,'AUTHORED_CANDIDATE_NOT_ADMITTED');
});
test('new genesis world, altered/missing/inert history, changed state, operational scope and injected verifier all fail closed',()=>{
 for(const kind of ['extendedWorld','history','missingHistory','revoked','state','scope','verifier','camera']){
  const a=structuredClone(args());
  if(kind==='extendedWorld')a.proposedState=W.buildExtendedWorldReplayCandidate({packet}).after;
  if(kind==='history')a.history[0].definitionDigest='changed';
  if(kind==='missingHistory')delete a.history;
  if(kind==='revoked')a.history.push({decision:'REVOKED'});
  if(kind==='state')a.proposedState.revision++;
  if(kind==='scope')a.requestedEffectScope='OPERATIONAL';
  if(kind==='verifier')a.verifyReviewRecord=()=>true;
  if(kind==='camera')a.cameraTransform.positionMicrounits[0]++;
  const before=kind==='verifier'?null:digest(a),r=C.inspectCameraConsumerPreparation(a);assert.equal(r.status,'UNKNOWN',kind);assert.equal(r.operationalStatus,'UNKNOWN',kind);if(before)assert.equal(digest(a),before);
 }
});
