'use strict';
// Read-only cross-world comparison. Never rebinds capture artifacts or grants admission.
const {digest,deepFreeze}=require('../../contracts/canonical');
const G=require('../scene-camera-geometry');
const W=require('../scene-extension-replay/candidate');
const S=require('../scene-extension-admission/sweep-verifier');
const {replay}=require('../../events/replay');
const capture=require('../../../../evidence/track-b/scene-camera-candidate/v1_5-capture/r3-sweep-full.json');
const fields=Object.freeze(['stateSchemaVersion','worldId','sceneDefinitionRef','revision','lifecycleState','entities','physicalRelations','supportRelations','surfaces','environmentPhysicalState','committedEventSequence']);
function inspectWorldEvidenceEquivalence({packet,genesis,committedWorld,events,...extra}={}){
 const fail=reason=>deepFreeze({status:'UNKNOWN',reason});
 try{
  if(Object.keys(extra).length)return fail('CALLER_VERIFIER_OR_EXTRA_INPUT_FORBIDDEN');
  const expected=W.buildExtendedWorldReplayCandidate({packet}),overlay=G.validatePacket(packet);
  if(digest(genesis)!==digest(expected.genesis)||digest(committedWorld)!==digest(expected.after)||digest(events)!==digest(expected.events)||replay(genesis,events).stateDigest!==committedWorld.stateDigest)return fail('GENESIS_WORLD_OR_EVENTS_NOT_EXACT');
  const keys=Object.keys(overlay).sort();
  if(digest(keys)!==digest(Object.keys(committedWorld).sort())||digest(keys)!==digest([...fields,'priorStateDigest','stateDigest'].sort()))return fail('WORLD_SCHEMA_NOT_EXACT');
  if(!S.verifySweepEvidence({packet,initialWorld:overlay,sweepEvidence:S.wrapper(packet)}))return fail('ORIGINAL_CAPTURE_EVIDENCE_NOT_VERIFIED');
  if(capture.bindings.worldDigest!==overlay.stateDigest||capture.bindings.packetDigest!==digest(packet))return fail('ORIGINAL_CAPTURE_BINDING_NOT_EXACT');
  const comparisons=fields.map(field=>({field,overlayDigest:digest(overlay[field]),replayDigest:digest(committedWorld[field]),equal:digest(overlay[field])===digest(committedWorld[field])}));
  if(comparisons.some(c=>!c.equal))return fail('SEMANTIC_CONTENT_DIFFERENT');
  return deepFreeze({status:'SEMANTIC_CONTENT_EQUAL_EVIDENCE_REUSE_DECISION_PENDING_NOT_ADMITTED',packetDigest:digest(packet),originalCapturedWorldDigest:overlay.stateDigest,candidateGenesisDigest:genesis.stateDigest,candidateWorldDigest:committedWorld.stateDigest,comparisons,historyIdentity:{equal:overlay.stateDigest===committedWorld.stateDigest,overlayPriorStateDigest:overlay.priorStateDigest,candidatePriorStateDigest:committedWorld.priorStateDigest},captureRemainsBoundToOriginalWorld:true,limitations:['COMPARISON_NOT_REVIEW_OR_OWNER_DECISION','NO_CAPTURE_REBINDING_OR_GENERIC_HASH_EXEMPTION','REVIEWER_MUST_DECIDE_WHETHER_EXISTING_PIXELS_CAN_SUPPORT_NEW_EXACT_RECORD','NEW_WORLD_REQUIRES_OWN_REVIEW_AND_RECORD_BEFORE_CONSUMPTION','NO_OPERATIONAL_ACTIVATION_RENDER_DOOR_GAMEPLAY_CLINICAL_PRODUCTION_UNLOCK','A8_REALISTIC_MESH_AND_B7_GAMEPLAY_MODES_OWNER_RESERVED']});
 }catch{return fail('EQUIVALENCE_INPUT_INVALID_OR_INCOMPLETE')}
}
module.exports={inspectWorldEvidenceEquivalence};
