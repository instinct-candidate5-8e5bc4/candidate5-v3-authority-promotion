'use strict';
// Authority Routing Gate: fail-closed rejection proofs. Every non-PASS class
// rejects atomically with zero state mutation, preserves V3 evidence in the
// rejection event, and never falls back, clamps, snaps, or bypasses the port.
const test=require('node:test'),assert=require('node:assert/strict');
const {createV3PromotedAuthorityRuntime}=require('../../src/clean-runtime/v3-routing/promoted-authority-runtime');
const {EventLog}=require('../../src/clean-runtime/events/event-log');
const {replay}=require('../../src/clean-runtime/events/replay');
const F=require('./v3-routing-fixture');

function promotedSystem(authorityOpts={},entities={},eventLog){
 const a=F.buildAuthority(authorityOpts);
 const runtime=createV3PromotedAuthorityRuntime({initialWorld:F.initialWorld(a.supportRelation,entities),registrySnapshot:a.registry,eventLog});
 return {a,runtime,api:runtime.worldMutationAPI};
}
function rejectedLegality(r){
 assert.equal(r.status,'REJECTED');
 assert.equal(r.failure.code,'TRANSACTION_REJECTED');
 const l=r.failure.evidence.detail&&r.failure.evidence.detail.legality;
 assert(l,'rejection must carry the legality result');
 return l;
}

test('ROUTED-FAIL-FLOATING floating support is definite V3 illegality: port FAIL, atomic reject, evidence preserved',()=>{
 const {api}=promotedSystem({lift:'1'});
 const before=api.getWorldState();
 const r=api.proposeTransaction(F.moveTransaction('e1',0,'tx-float'));
 const l=rejectedLegality(r);
 assert.equal(r.failure.evidence.cause,'GEOMETRY_PROOF_FAILED');
 assert.equal(l.outcome,'FAIL');
 assert.equal(l.physicalProof.obligations[0].v3Status,'FAIL');
 assert.equal(l.physicalProof.decision,'REJECT_REQUIRED');
 assert.equal(api.getWorldState().stateDigest,before.stateDigest);
 assert.equal(api.getEventLog().filter(e=>e.eventType==='MutationCommitted').length,0);
});

test('ROUTED-FAIL-PENETRATING penetrating support is definite V3 illegality and rejects atomically',()=>{
 const {api}=promotedSystem({lift:'-1'});
 const before=api.getWorldState();
 const r=api.proposeTransaction(F.moveTransaction('e1',0,'tx-pen'));
 const l=rejectedLegality(r);
 assert.equal(l.outcome,'FAIL');
 assert.equal(l.physicalProof.obligations[0].v3Status,'FAIL');
 assert.equal(api.getWorldState().stateDigest,before.stateDigest);
});

test('ROUTED-UNKNOWN-NON-PROMOTED locked capability is explicit NON_PROMOTED: UNKNOWN, never fallback, atomic reject',()=>{
 const {api}=promotedSystem({},{e2:F.runtimeEntity('e2',{requiredPhysicalCapabilities:['V3_BODY_VS_BODY']})});
 const before=api.getWorldState();
 const r=api.proposeTransaction(F.moveTransaction('e2',0,'tx-np'));
 const l=rejectedLegality(r);
 assert.equal(r.failure.evidence.cause,'UNKNOWN');
 assert.equal(l.outcome,'UNKNOWN');
 const ob=l.physicalProof.obligations[0];
 assert.equal(ob.capability,'V3_BODY_VS_BODY');
 assert.equal(ob.outcome,'UNKNOWN');
 assert.equal(ob.routeDigest,null);
 assert.equal(l.routingSummary.classifications[0].classification,'NON_PROMOTED_CAPABILITY');
 assert.equal(l.routingSummary.evaluatorCalls,0);
 assert.equal(api.getWorldState().stateDigest,before.stateDigest);
});

test('ROUTED-ATOMIC-MIXED one provable and one unprovable command: the whole transaction rejects with zero mutation',()=>{
 const a=F.buildAuthority({secondSupport:true});
 const runtime=createV3PromotedAuthorityRuntime({initialWorld:F.initialWorld(a.supportRelation,{e2:F.runtimeEntity('e2',{requiredPhysicalCapabilities:['V3_WORLD_SOLID']})},[a.secondSupportRelation]),registrySnapshot:a.registry});
 const api=runtime.worldMutationAPI;
 const before=api.getWorldState();
 const r=api.proposeTransaction({transactionId:'tx-mixed',expectedWorldRevision:0,commands:[F.moveCommand('e1',0,'cmd-ok'),F.moveCommand('e2',0,'cmd-locked')]});
 const l=rejectedLegality(r);
 assert.equal(l.outcome,'UNKNOWN');
 const byCap=Object.fromEntries(l.physicalProof.obligations.map(o=>[o.capability,o.outcome]));
 assert.equal(byCap.V3_SUPPORT,'PASS');
 assert.equal(byCap.V3_WORLD_SOLID,'UNKNOWN');
 assert.equal(l.physicalProof.decision,'REJECT_REQUIRED');
 assert.equal(api.getWorldState().stateDigest,before.stateDigest);
 assert.equal(api.getWorldState().revision,0);
});

test('ROUTED-INCOMPLETE-AUTHORITY missing authority projection records reject before geometry with zero evaluator calls',()=>{
 const {api}=promotedSystem({dropRelationRecords:true});
 const before=api.getWorldState();
 const r=api.proposeTransaction(F.moveTransaction('e1',0,'tx-mp'));
 const l=rejectedLegality(r);
 assert.equal(l.outcome,'UNKNOWN');
 assert.equal(l.routingSummary.classifications[0].classification,'INCOMPLETE_AUTHORITY');
 assert.equal(l.routingSummary.evaluatorCalls,0);
 assert.equal(l.physicalProof.obligations[0].v3Status,null);
 assert.equal(api.getWorldState().stateDigest,before.stateDigest);
});

test('ROUTED-STALE-REGISTRY an invalid authority record anywhere in the registry rejects the whole transaction',()=>{
 const {api}=promotedSystem({unpinnedBoundary:true});
 const before=api.getWorldState();
 const r=api.proposeTransaction(F.moveTransaction('e1',0,'tx-ub'));
 const l=rejectedLegality(r);
 assert.equal(l.outcome,'UNKNOWN');
 assert(l.routingFailure,'envelope failure must be surfaced');
 assert.equal(l.routingFailure.reason,'INCOMPLETE_AUTHORITY');
 assert.equal(l.routingSummary.evaluatorCalls,0);
 assert.equal(l.physicalProof.decision,'REJECT_REQUIRED');
 assert.equal(api.getWorldState().stateDigest,before.stateDigest);
});

test('ROUTED-EVENT-LOG-FAILURE event-log failure still prevents state commit on the promoted path',()=>{
 const {api}=promotedSystem({},undefined,new EventLog({failAppend:true}));
 const before=api.getWorldState();
 const r=api.proposeTransaction(F.moveTransaction('e1',0,'tx-elf'));
 assert.equal(r.status,'REJECTED');
 assert.equal(r.failure.code,'EVENT_LOG_FAILURE');
 assert.equal(api.getWorldState().stateDigest,before.stateDigest);
 assert.equal(api.getEventLog().length,0);
});

test('ROUTED-REPLAY-TAMPER tampering with proof evidence in the event chain breaks replay',()=>{
 const {api}=promotedSystem();
 const initial=api.getWorldState();
 api.proposeTransaction(F.moveTransaction());
 const events=api.getEventLog().map(e=>structuredClone(e));
 const tampered=[{...events[0],physicalProof:{...events[0].physicalProof,decision:'REJECT_REQUIRED'}}];
 assert.throws(()=>replay(initial,tampered),x=>x.code==='REPLAY_MISMATCH');
 const tampered2=[{...events[0],physicalProof:{...events[0].physicalProof,obligations:[]}}];
 assert.throws(()=>replay(initial,tampered2),x=>x.code==='REPLAY_MISMATCH');
});

test('ROUTED-BINDING-CONFLICT a reused transaction identity with a different state binding cannot reuse a prior decision',()=>{
 const {api}=promotedSystem();
 const before=api.getWorldState();
 const r1=api.proposeTransaction(F.moveTransaction('e1',0,'tx-bind'));
 assert.equal(r1.status,'COMMITTED');
 // same transactionId and command identity, different expected revision binding
 const replayed={transactionId:'tx-bind',expectedWorldRevision:1,commands:[{commandId:'cmd-tx-bind',type:'SetTransform',expectedWorldRevision:1,entityId:'e1',transform:{positionMicrounits:[9,9,9],orientation:[0,0,0,1],scaleMicrounits:[1000000,1000000,1000000]}}]};
 const r2=api.proposeTransaction(replayed);
 assert.equal(r2.status,'REJECTED');
 assert.equal(api.getWorldState().revision,1);
});
