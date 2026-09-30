'use strict';
// Read-only preparation seam, not a registered consumer, camera controller or unlock.
const {digest,deepFreeze}=require('../../contracts/canonical');
const E=require('../scene-extension-admission/executor');
const G=require('../scene-camera-geometry');
const approved=require('../../../../evidence/track-b/scene-extension-admission/owner-camera-evidence/execute-snapshot.json');
const definition=require('../../../../evidence/track-b/scene-extension-admission/owner-camera-evidence/definition.json');
const envelope=require('../../../../evidence/track-b/scene-extension-admission/owner-camera-evidence/verified-envelope.json');
const reviewRecord=require('../../../../evidence/track-b/scene-extension-admission/owner-camera-evidence/review-record.json');
function inspectCameraConsumerPreparation({packet,history,proposedState,cameraTransform,previousCameraTransform,requestedEffectScope,...extra}={}){
 const fail=reason=>deepFreeze({status:'UNKNOWN',reason,operationalStatus:'UNKNOWN'});
 try{
  if(Object.keys(extra).length)return fail('CALLER_VERIFIER_OR_EXTRA_INPUT_FORBIDDEN');
  if(requestedEffectScope!=='EVIDENCE_ONLY_CAMERA_COVERAGE')return fail('OPERATIONAL_OR_OTHER_SCOPE_NOT_AUTHORIZED');
  if(!proposedState||proposedState.stateDigest!==definition.worldDigest||digest(proposedState)!==digest(G.validatePacket(packet)))return fail('WORLD_REQUIRES_OWN_EXACT_REVIEW_AND_RECORD');
  if(digest(history)!==digest(approved.history))return fail('HISTORY_NOT_EXACT_APPROVED_SNAPSHOT_OR_INERT');
  const checked=E.inspectCandidate({packet,definition,envelope,reviewRecord});
  if(checked.status!=='PREPARED_NOT_ADMITTED')return fail(checked.reason);
  const result=G.evaluateCandidateVolumes({packet,proposedState,cameraTransform,previousCameraTransform});
  if(result.evidence?.componentVerdict!=='CANDIDATE_VOLUMES_CLEAR')return fail('CAMERA_EVIDENCE_NOT_CLEAR:'+result.reason);
  return deepFreeze({status:'READ_ONLY_CAMERA_EVIDENCE_BINDING_PREPARED_NOT_OPERATIONALLY_ADMITTED',packetDigest:digest(packet),worldDigest:proposedState.stateDigest,definitionDigest:definition.canonicalDigest,reviewRecordDigest:reviewRecord.reviewRecordDigest,historyDigest:digest(history),cameraEvidenceDigest:result.evidenceDigest,underlyingCameraOutcome:result.outcome,underlyingCameraReason:result.reason,operationalStatus:'UNKNOWN',limitations:['UNREGISTERED_UNCONSUMED_PREPARATION_ONLY','NO_EXECUTE_OR_REGISTRY_WRITE_OR_CAMERA_MOVEMENT','OVERLAY_C719E834_ONLY_NEW_WORLD_88B6E019_REQUIRES_OWN_RECORD','CAPTURE_OPTICS_NOT_LIVE_RENDERER_VERIFICATION','NO_RENDER_DOOR_GAMEPLAY_CLINICAL_PRODUCTION_UNLOCK','A8_REALISTIC_MESH_AND_B7_GAMEPLAY_MODES_OWNER_RESERVED']});
 }catch{return fail('CAMERA_EVIDENCE_BINDING_INVALID_OR_INCOMPLETE')}
}
module.exports={inspectCameraConsumerPreparation};
