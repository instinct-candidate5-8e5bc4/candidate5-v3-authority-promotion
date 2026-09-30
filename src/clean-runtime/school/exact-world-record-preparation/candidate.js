'use strict';
// Proposed exact-world record mechanics only. No admission or owner decision inference.
const {digest,deepFreeze}=require('../../contracts/canonical');
const W=require('../scene-extension-replay/candidate');
const Q=require('../world-evidence-equivalence/candidate');
const P=require('../scene-extension-admission/pins');
const originalReview=require('../../../../evidence/track-b/scene-extension-admission/owner-camera-evidence/review-record.json');
function prepareExactWorldRecord({packet,...extra}={}){
 if(Object.keys(extra).length)throw Error('EXTRA_INPUT_FORBIDDEN');
 const w=W.buildExtendedWorldReplayCandidate({packet});
 const comparison=Q.inspectWorldEvidenceEquivalence({packet,genesis:w.genesis,committedWorld:w.after,events:w.events});
 if(comparison.status!=='SEMANTIC_CONTENT_EQUAL_EVIDENCE_REUSE_DECISION_PENDING_NOT_ADMITTED')throw Error('EQUIVALENCE_NOT_VERIFIED');
 return recordFromComparison(packet,w,comparison);
}
function recordFromComparison(packet,w,comparison){
 return deepFreeze({kind:'PROPOSED_EXACT_WORLD_CAMERA_EVIDENCE_RECORD_NOT_ADMISSION',effectScope:'EVIDENCE_ONLY_CAMERA_COVERAGE',packetDigest:digest(packet),genesisDigest:w.genesis.stateDigest,worldDigest:w.after.stateDigest,eventLogDigest:digest(w.events),comparisonDigest:digest(comparison),sourcePins:P.sourcePins(),semanticEqualityCitation:{originalCapturedWorldDigest:comparison.originalCapturedWorldDigest,newComparedWorldDigest:w.after.stateDigest,originalReviewRecordDigest:originalReview.reviewRecordDigest,captureRemainsBoundToOriginalWorld:true,citationRole:'SUPPORTING_EVIDENCE_ONLY_NOT_INHERITED_ADMISSION'},ownerDecisionStatus:'PENDING_SEPARATE_OWNER_DECISION',limitations:['NO_EXECUTE_OR_ADMIT_OR_REGISTRY_WRITE','ORIGINAL_OWNER_APPROVAL_DOES_NOT_AUTHORIZE_NEW_WORLD','SEPARATE_AUTHENTICATED_OWNER_DECISION_AND_EXACT_REVIEW_REQUIRED','NO_CONSUMPTION_OF_88B6E019','NO_R3_GAMEPLAY_DOOR_CLINICAL_PRODUCTION_OR_AUTHORITY_EXPANSION','A8_REALISTIC_MESH_AND_B7_GAMEPLAY_MODES_OWNER_RESERVED']});
}
function inspectExactWorldRecordPreparation({packet,genesis,committedWorld,events,proposedRecord,...extra}={}){
 const fail=reason=>deepFreeze({status:'UNKNOWN',reason,operationalStatus:'UNKNOWN'});
 try{
  if(Object.keys(extra).length)return fail('CALLER_DECISION_VERIFIER_OR_EXTRA_INPUT_FORBIDDEN');
  const comparison=Q.inspectWorldEvidenceEquivalence({packet,genesis,committedWorld,events});
  if(comparison.status!=='SEMANTIC_CONTENT_EQUAL_EVIDENCE_REUSE_DECISION_PENDING_NOT_ADMITTED')return fail(comparison.reason);
  const exact=recordFromComparison(packet,{genesis,after:committedWorld,events},comparison);
  if(digest(proposedRecord)!==digest(exact))return fail('PROPOSED_RECORD_NOT_EXACT_PENDING_BINDING');
  return deepFreeze({status:'EXACT_WORLD_RECORD_MECHANICS_PREPARED_OWNER_AND_REVIEW_PENDING_NOT_ADMITTED',proposedRecordDigest:digest(exact),packetDigest:exact.packetDigest,genesisDigest:exact.genesisDigest,worldDigest:exact.worldDigest,comparisonDigest:exact.comparisonDigest,ownerDecisionStatus:exact.ownerDecisionStatus,operationalStatus:'UNKNOWN',captureRemainsBoundToOriginalWorld:true,limitations:exact.limitations});
 }catch{return fail('RECORD_PREPARATION_INVALID_OR_INCOMPLETE')}
}
module.exports={prepareExactWorldRecord,inspectExactWorldRecordPreparation};
