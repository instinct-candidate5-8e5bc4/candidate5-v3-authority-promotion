'use strict';
// FIXTURE_NOT_LIVE: trusted checkpoint is test-owned process memory, NOT durable storage.
const {digest,deepFreeze}=require('../../contracts/canonical');
const record=require('../../../../evidence/track-b/exact-world-admission/owner-camera-evidence/review-record.json');
const worldDigest=record.worldDigest,recordDigest=record.reviewRecordDigest;
const unknown=reason=>deepFreeze({status:'UNKNOWN',reason,classification:'FIXTURE_NOT_LIVE',operationalStatus:'UNKNOWN'});
function createDecisionReplayFixture(){
 let checkpoint={sequence:0,headDigest:null,epoch:0},log=[],activeDecision=null;
 const author='TEST_OWNED_CHECKPOINT_AUTHORITY_NOT_OWNER_AUTHENTICATION';
 function validate(entries){
  if(!Array.isArray(entries)||entries.length!==checkpoint.sequence)return unknown('CHECKPOINT_HIGHER_THAN_LOG_OR_LOG_NOT_EXACT');
  let prior=null,decision=null;
  for(let i=0;i<entries.length;i++){const e=entries[i];if(!e||typeof e!=='object'||Array.isArray(e))return unknown('ENTRY_MALFORMED');if(e.sequence!==i+1||e.epoch!==i+1||e.priorDecisionDigest!==prior)return unknown('SEQUENCE_GAP_DUPLICATE_REORDER_OR_EPOCH_ROLLBACK');if(e.author!==author)return unknown('UNKNOWN_ENTRY_AUTHOR');if(e.worldDigest!==worldDigest||e.recordDigest!==recordDigest||e.identityRevision!==1)return unknown('IDENTITY_OR_REVISION_CONFLICT');if(!['ADMITTED','REVOKED','DEFERRED','REJECTED','SUPERSEDED'].includes(e.decision)||e.entryDigest!==digest({...e,entryDigest:undefined}))return unknown('ENTRY_INVALID');if(decision&&decision!=='ADMITTED')return unknown('TERMINAL_IDENTITY_CANNOT_READMIT');prior=e.entryDigest;decision=e.decision}
  if(prior!==checkpoint.headDigest)return unknown('CHECKPOINT_HEAD_MISMATCH');
  return deepFreeze({status:'FIXTURE_NOT_LIVE_REPLAY_VALIDATED',decision:decision||'UNKNOWN',worldDigest,recordDigest,sequence:checkpoint.sequence,epoch:checkpoint.epoch,operationalStatus:'UNKNOWN'});
 }
 // Test-owned driver/checkpoint are outside the read-only session graph.
 const driver=Object.freeze({append({decision,expectedEpoch,identityRevision=1}={}){if(!Number.isSafeInteger(expectedEpoch)||expectedEpoch!==checkpoint.epoch)return unknown('EXPECTED_EPOCH_REQUIRED_OR_CONFLICT');if(identityRevision!==1||activeDecision&&activeDecision!=='ADMITTED')return unknown('TERMINAL_IDENTITY_OR_REVISION_CONFLICT');if(!['ADMITTED','REVOKED','DEFERRED','REJECTED','SUPERSEDED'].includes(decision))return unknown('DECISION_INVALID');const body={sequence:checkpoint.sequence+1,epoch:checkpoint.epoch+1,priorDecisionDigest:checkpoint.headDigest,worldDigest,recordDigest,identityRevision,decision,author},entry=deepFreeze({...body,entryDigest:digest(body)});log=deepFreeze([...log,entry]);checkpoint=deepFreeze({sequence:entry.sequence,headDigest:entry.entryDigest,epoch:entry.epoch});activeDecision=decision;return deepFreeze({classification:'FIXTURE_NOT_LIVE',epoch:checkpoint.epoch})},exportLog(){return deepFreeze(structuredClone(log))},checkpointView(){return deepFreeze({...checkpoint})}});
 const recovery=Object.freeze({classification:'FIXTURE_NOT_LIVE',inspect(entries){return validate(entries)}});
 return Object.freeze({classification:'FIXTURE_NOT_LIVE',driver,recovery});
}
module.exports={createDecisionReplayFixture};
