'use strict';
// Isolated read-only session proposal. Pixel verification once, exact snapshot reuse only.
// No runtime revocation feed exists here; caller context checks do NOT authenticate freshness.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {digest,deepFreeze}=require('../../contracts/canonical');
const C=require('../exact-world-camera-consumer/candidate');
const P=require('../scene-extension-admission/pins');
const definition=require('../../../../evidence/track-b/exact-world-admission/input/definition.json');
const files=['src/clean-runtime/school/exact-world-camera-consumer/candidate.js','src/clean-runtime/school/exact-snapshot-session/candidate.js','evidence/track-b/exact-world-admission/input/definition.json','evidence/track-b/exact-world-admission/input/owner-decision.json','evidence/track-b/exact-world-admission/owner-camera-evidence/review-record.json','evidence/track-b/exact-world-admission/owner-camera-evidence/verified-envelope.json','evidence/track-b/exact-world-admission/owner-camera-evidence/execute-snapshot.json'];
function sourceIdentity(){return [...definition.sourcePins.map(p=>{if(P.sha(path.join(P.ROOT,p.path))!==p.sha256)throw Error('DEFINITION_SOURCE_CHANGED');return p}),...files.map(p=>({path:p,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(P.ROOT,p))).digest('hex')}))]}
function createExactSnapshotSession(input){
 const unknown=reason=>deepFreeze({status:'UNKNOWN',reason,operationalStatus:'UNKNOWN'});
 try{
  const before=digest(input),sourceBefore=sourceIdentity(),evidence=C.inspectExactWorldCameraConsumer(input);
  if(evidence.status!=='EXACT_WORLD_READ_ONLY_CAMERA_EVIDENCE_BOUND_NOT_OPERATIONALLY_ADMITTED')return unknown(evidence.reason);
  if(before!==digest(input)||digest(sourceBefore)!==digest(sourceIdentity()))return unknown('CREATION_INPUT_OR_SOURCE_CHANGED');
  // Private identity and evidence never accepted back from callers as a grant.
  const inputDigest=before,sourceDigest=digest(sourceBefore),identity=deepFreeze({inputDigest,sourceDigest,worldDigest:evidence.worldDigest,genesisDigest:evidence.genesisDigest,eventLogDigest:evidence.eventLogDigest,definitionDigest:evidence.definitionDigest,reviewRecordDigest:evidence.reviewRecordDigest,historyDigest:evidence.historyDigest,cameraEvidenceDigest:evidence.cameraEvidenceDigest});
  let invalidated=false;
  return Object.freeze({status:'ISOLATED_EXACT_SNAPSHOT_SESSION_CREATED_NOT_OPERATIONAL',identity,
   inspect(current){if(invalidated)return unknown('SESSION_INVALIDATED');try{
    if(digest(sourceIdentity())!==sourceDigest){invalidated=true;return unknown('SOURCE_OR_RECORD_BYTES_CHANGED')}
    if(digest(current)!==inputDigest){invalidated=true;return unknown('EXACT_CONTEXT_CHANGED_OR_INERT')}
    return deepFreeze({status:'EXACT_SNAPSHOT_REUSED_EVIDENCE_ONLY_NOT_OPERATIONALLY_ADMITTED',identity,underlyingCameraOutcome:evidence.underlyingCameraOutcome,underlyingCameraReason:evidence.underlyingCameraReason,operationalStatus:'UNKNOWN',captureRemainsBoundToOriginalWorld:true,limitations:['NO_LIVE_AUTHORITATIVE_REVOCATION_FEED_THIS_IS_ISOLATED_PREPARATION','CALLER_CONTEXT_EQUALITY_NOT_FRESHNESS_OR_AUTHORITY','EXACT_ORIGINAL_POSE_ONLY_NO_OTHER_WAYPOINT_OR_FIRST_PERSON','NO_TIME_BASED_EXPIRY_OR_GENERIC_EVIDENCE_DIGEST_GRANT','NO_RENDER_MOVEMENT_DOOR_GAMEPLAY_CLINICAL_PRODUCTION_ACTIVATION']});
   }catch{invalidated=true;return unknown('CONTEXT_OR_SOURCE_UNVERIFIABLE')}},
   invalidate(){invalidated=true;return unknown('SESSION_INVALIDATED')}
  });
 }catch{return unknown('SESSION_CREATION_INVALID_OR_INCOMPLETE')}
}
module.exports={createExactSnapshotSession};
