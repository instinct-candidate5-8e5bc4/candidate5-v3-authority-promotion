'use strict';
// Read-only admitted-record binding proposal. Not a registered consumer or controller.
const {digest,deepFreeze}=require('../../contracts/canonical');
const E=require('../exact-world-admission/executor');
const G=require('../scene-camera-geometry');
const definition=require('../../../../evidence/track-b/exact-world-admission/input/definition.json');
const ownerDecision=require('../../../../evidence/track-b/exact-world-admission/input/owner-decision.json');
const envelope=require('../../../../evidence/track-b/exact-world-admission/owner-camera-evidence/verified-envelope.json');
const reviewRecord=require('../../../../evidence/track-b/exact-world-admission/owner-camera-evidence/review-record.json');
const snapshot=require('../../../../evidence/track-b/exact-world-admission/owner-camera-evidence/execute-snapshot.json');
function inspectExactWorldCameraConsumer({packet,genesis,committedWorld,events,history,cameraTransform,previousCameraTransform,requestedEffectScope,...extra}={}){
 const fail=reason=>deepFreeze({status:'UNKNOWN',reason,operationalStatus:'UNKNOWN'});
 try{
  if(Object.keys(extra).length)return fail('CALLER_VERIFIER_OR_EXTRA_INPUT_FORBIDDEN');
  if(requestedEffectScope!=='EVIDENCE_ONLY_CAMERA_COVERAGE')return fail('OPERATIONAL_OR_OTHER_SCOPE_NOT_AUTHORIZED');
  if(digest(history)!==digest(snapshot.history))return fail('HISTORY_NOT_EXACT_APPROVED_SNAPSHOT_OR_INERT');
  const inspected=E.inspect({packet,genesis,committedWorld,events,definition,envelope,ownerDecision,reviewRecord});
  if(inspected.status!=='PREPARED_NOT_ADMITTED')return fail(inspected.reason);
  const result=G.evaluateCandidateVolumes({packet,proposedState:committedWorld,cameraTransform,previousCameraTransform});
  if(result.evidence?.componentVerdict!=='CANDIDATE_VOLUMES_CLEAR')return fail('CAMERA_EVIDENCE_NOT_CLEAR:'+result.reason);
  return deepFreeze({status:'EXACT_WORLD_READ_ONLY_CAMERA_EVIDENCE_BOUND_NOT_OPERATIONALLY_ADMITTED',packetDigest:digest(packet),genesisDigest:genesis.stateDigest,worldDigest:committedWorld.stateDigest,eventLogDigest:digest(events),definitionDigest:definition.canonicalDigest,reviewRecordDigest:reviewRecord.reviewRecordDigest,historyDigest:digest(history),cameraEvidenceDigest:result.evidenceDigest,underlyingCameraOutcome:result.outcome,underlyingCameraReason:result.reason,operationalStatus:'UNKNOWN',captureRemainsBoundToOriginalWorld:true,limitations:['UNREGISTERED_UNCONSUMED_PROPOSAL_ONLY','NO_EXECUTE_REGISTRY_WRITE_RENDER_OR_CAMERA_MOVEMENT','EXACT_AUTHORED_WAYPOINTS_ONLY_NO_FREE_CAMERA','SLOW_OFFLINE_VERIFICATION_NOT_PER_FRAME','SEMANTIC_EQUALITY_SUPPORT_ONLY_NO_AUTHORITY_TRANSFER','NO_R3_DOOR_GAMEPLAY_CLINICAL_PRODUCTION_OR_FUTURE_IDENTITY_UNLOCK','A8_REALISTIC_MESH_AND_B7_GAMEPLAY_MODES_OWNER_RESERVED']});
 }catch{return fail('EXACT_WORLD_CAMERA_BINDING_INVALID_OR_INCOMPLETE')}
}
module.exports={inspectExactWorldCameraConsumer};
