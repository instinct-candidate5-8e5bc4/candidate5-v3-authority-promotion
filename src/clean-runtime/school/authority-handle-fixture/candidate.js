'use strict';
// FIXTURE_NOT_LIVE: process-local clock/store only; no durable restart or real coordinator connection.
const {digest,deepFreeze}=require('../../contracts/canonical');
const S=require('../exact-snapshot-session/candidate');
const W=require('../scene-extension-replay/candidate');
const packet=require('../../../../evidence/track-b/scene-camera-candidate/packet-v1_5.json');
const record=require('../../../../evidence/track-b/exact-world-admission/owner-camera-evidence/review-record.json');
const snapshot=require('../../../../evidence/track-b/exact-world-admission/owner-camera-evidence/execute-snapshot.json');
const handles=new WeakMap(),sessions=new WeakMap();let epoch=0,active=null;
const unknown=reason=>deepFreeze({status:'UNKNOWN',reason,classification:'FIXTURE_NOT_LIVE',operationalStatus:'UNKNOWN'});
function exactContext(){const w=W.buildExtendedWorldReplayCandidate({packet});return {packet,genesis:w.genesis,committedWorld:w.after,events:w.events,history:snapshot.history,cameraTransform:packet.sweepSpec.waypoints[0].transform,requestedEffectScope:'EVIDENCE_ONLY_CAMERA_COVERAGE'}}
function createAuthorityHandleFixture(){
 const context=deepFreeze(exactContext()),binding={worldDigest:context.committedWorld.stateDigest,recordDigest:record.reviewRecordDigest,cameraEvidenceDigest:'17395af7e4936f2d14f0837cadae35a8649253bad4a633f72513836b4407d42a'};
 if(active)active.stale=true;
 const state={epoch:++epoch,context,binding,decision:'ADMITTED',stale:false,replayed:true},handle=Object.freeze({classification:'FIXTURE_NOT_LIVE'});handles.set(handle,state);active=state;
 // Test driver owns mutators. Sessions receive ONLY opaque handle; no mutator is on it.
 const driver=Object.freeze({fixtureView(){return deepFreeze({context:structuredClone(state.context),binding:structuredClone(state.binding),epoch:state.epoch,decision:state.decision})},transition({nextContext=context,nextBinding=binding,decision='REVOKED',expectedEpoch=state.epoch}={}){if(state.stale||expectedEpoch!==state.epoch)return unknown('STALE_OR_EPOCH_ROLLBACK');state.epoch=++epoch;state.context=deepFreeze(structuredClone(nextContext));state.binding=deepFreeze(structuredClone(nextBinding));state.decision=state.decision!=='ADMITTED'?state.decision:decision;return deepFreeze({classification:'FIXTURE_NOT_LIVE',epoch:state.epoch})},restartWithoutReplay(){state.epoch=++epoch;state.replayed=false;return unknown('RESTART_WITHOUT_VERIFIED_REPLAY')}});
 return Object.freeze({classification:'FIXTURE_NOT_LIVE',handle,driver,initialEpoch:state.epoch});
}
function bindFixtureSession(handle){
 const state=handles.get(handle);if(!state||state.stale)return unknown('UNRECOGNIZED_OR_STALE_HANDLE');
 if(!state.replayed||state.decision!=='ADMITTED')return unknown('INERT_OR_UNREPLAYED');
 const context=state.context,startEpoch=state.epoch,expectedBinding=deepFreeze({...state.binding}),contextDigest=digest(context),offline=S.createExactSnapshotSession(context);
 if(offline.status!=='ISOLATED_EXACT_SNAPSHOT_SESSION_CREATED_NOT_OPERATIONAL')return unknown('OFFLINE_BINDING_FAILED');
 if(state.epoch!==startEpoch||state.stale)return unknown('EPOCH_CHANGED_DURING_BIND');
 if(expectedBinding.worldDigest!==offline.identity.worldDigest||expectedBinding.recordDigest!==offline.identity.reviewRecordDigest||expectedBinding.cameraEvidenceDigest!==offline.identity.cameraEvidenceDigest)return unknown('EXACT_BINDING_MISMATCH');
 const session=Object.freeze({classification:'FIXTURE_NOT_LIVE'});sessions.set(session,{state,offline,epoch:startEpoch,contextDigest,bindingDigest:digest(expectedBinding),invalid:false});return session;
}
function inspectFixtureSession(session,handle){
 const s=sessions.get(session),state=handles.get(handle);if(!s||!state||state!==s.state||state.stale)return unknown('UNRECOGNIZED_OR_STALE_HANDLE_OR_SESSION');
 if(s.invalid)return unknown('SESSION_INVALIDATED');
 // One synchronous immutable view: no callbacks/await between state/history reads.
 const view={epoch:state.epoch,context:state.context,binding:state.binding,decision:state.decision,replayed:state.replayed};
 if(!view.replayed||view.decision!=='ADMITTED'||view.epoch!==s.epoch||digest(view.context)!==s.contextDigest||digest(view.binding)!==s.bindingDigest){s.invalid=true;s.offline.invalidate();return unknown('AUTHORITY_EPOCH_CONTEXT_OR_DECISION_CHANGED')}
 const r=s.offline.inspect(view.context);
 if(state.epoch!==view.epoch||state.stale){s.invalid=true;return unknown('EPOCH_CHANGED_DURING_READ')}
 if(r.status!=='EXACT_SNAPSHOT_REUSED_EVIDENCE_ONLY_NOT_OPERATIONALLY_ADMITTED'){s.invalid=true;return unknown(r.reason)}
 return deepFreeze({status:'FIXTURE_NOT_LIVE_EXACT_SNAPSHOT_EVIDENCE_REUSED',epoch:view.epoch,worldDigest:view.binding.worldDigest,recordDigest:view.binding.recordDigest,cameraEvidenceDigest:view.binding.cameraEvidenceDigest,operationalStatus:'UNKNOWN',limitations:['PROCESS_LOCAL_ONLY_NO_DURABLE_CROSS_PROCESS_REVOCATION','NO_RUNTIME_CONNECTION_OR_MOVEMENT','RESTART_REPLAY_REQUIRED_NOT_IMPLEMENTED','NO_ADMISSION_OR_RENDER_DOOR_GAMEPLAY_CLINICAL_PRODUCTION_UNLOCK']});
}
module.exports={createAuthorityHandleFixture,bindFixtureSession,inspectFixtureSession};
