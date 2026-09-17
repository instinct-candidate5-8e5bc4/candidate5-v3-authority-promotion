'use strict';
// Authority Routing Gate: controlled production path proofs.
// WorldMutationAPI -> one PhysicalLegalityPort -> Promotion Proof Planner ->
// Physical Capability Router -> certified V3 authority/evaluator -> fail-closed
// aggregate -> atomic authoritative commit -> deterministic event/replay chain.
const test=require('node:test'),assert=require('node:assert/strict');
const {createV3PromotedAuthorityRuntime}=require('../../src/clean-runtime/v3-routing/promoted-authority-runtime');
const {canonicalBytes,digest}=require('../../src/clean-runtime/contracts/canonical');
const {replay}=require('../../src/clean-runtime/events/replay');
const Router=require('../../src/clean-runtime/mutation/physical-capability-router');
const F=require('./v3-routing-fixture');

function promotedSystem(authorityOpts={},entities={},extraRelations=[]){
 const a=F.buildAuthority(authorityOpts);
 const runtime=createV3PromotedAuthorityRuntime({initialWorld:F.initialWorld(a.supportRelation,entities,extraRelations),registrySnapshot:a.registry});
 return {a,runtime,api:runtime.worldMutationAPI,store:runtime.worldStore};
}

test('ROUTED-FULL-PATH support mutation commits through the controlled path with certified V3 proof in the commit event',()=>{
 const {a,api}=promotedSystem();
 const before=api.getWorldState(),raw=F.moveTransaction();
 const r=api.proposeTransaction(raw);
 assert.equal(r.status,'COMMITTED');
 const proof=r.event.physicalProof;
 assert(proof,'commit event must carry the physical proof payload');
 assert.equal(proof.decision,'COMMIT_ALLOWED');
 assert.equal(proof.routeTableDigest,Router.ROUTE_TABLE.routeTableDigest);
 assert.equal(proof.authoritySnapshotRef.digest,a.registry.registrySnapshotDigest);
 assert.equal(proof.obligations.length,1);
 const ob=proof.obligations[0];
 assert.equal(ob.capability,'V3_SUPPORT');
 assert.equal(ob.outcome,'PASS');
 assert.equal(ob.v3Status,'PASS');
 assert.equal(ob.v3Reason,'VALID');
 assert(/^[0-9a-f]{64}$/.test(ob.v3EvidenceDigest));
 assert(/^[0-9a-f]{64}$/.test(ob.routeDigest));
 // atomic binding: the proof is bound to exactly the committed state and event
 assert.equal(proof.proposedStateDigest,r.event.newStateDigest);
 assert.equal(r.event.newStateDigest,r.state.stateDigest);
 assert.equal(proof.beforeStateDigest,before.stateDigest);
 // the event evidence equals a fully independent recomputation from authoritative inputs
 const ind=F.independentProof({registry:a.registry,before,after:r.state,rawTransaction:raw});
 assert.equal(ind.decision.decision,'COMMIT_ALLOWED');
 assert.equal(proof.payloadDigest,ind.proof.payloadDigest);
 assert.equal(proof.decisionDigest,ind.decision.decisionDigest);
 assert.equal(proof.planDigest,ind.plan.planDigest);
 assert.equal(ob.routeDigest,ind.proof.obligations[0].routeDigest);
 assert.equal(ob.v3EvidenceDigest,ind.proof.obligations[0].v3EvidenceDigest);
});

test('ROUTED-REPLAY deterministic event chain replays to the exact committed state and proof digests',()=>{
 const {a,api}=promotedSystem();
 const initial=api.getWorldState();
 api.proposeTransaction(F.moveTransaction());
 const events=api.getEventLog();
 const final=api.getWorldState();
 const out=replay(initial,events);
 assert.equal(out.stateDigest,final.stateDigest);
 const ind=F.independentProof({registry:a.registry,before:initial,after:final,rawTransaction:F.moveTransaction()});
 assert.equal(events[0].physicalProof.payloadDigest,ind.proof.payloadDigest);
 assert.equal(digest(events),digest(api.getEventLog()));
});

test('ROUTED-DETERMINISM two fresh runtimes produce byte-identical state and event chains',()=>{
 const run=()=>{const {api}=promotedSystem();api.proposeTransaction(F.moveTransaction());api.proposeTransaction(F.moveTransaction('e1',1,'tx-move-2'));return {state:canonicalBytes(api.getWorldState()).toString('hex'),events:canonicalBytes(api.getEventLog()).toString('hex')}};
 const x=run(),y=run();
 assert.equal(x.state,y.state);
 assert.equal(x.events,y.events);
});

test('ROUTED-MULTI-COMMAND two provable commands commit as one transaction with one consistent transaction-scoped proof',()=>{
 const a=F.buildAuthority({secondSupport:true});
 const runtime=createV3PromotedAuthorityRuntime({initialWorld:F.initialWorld(a.supportRelation,{e2:F.runtimeEntity('e2')},[a.secondSupportRelation]),registrySnapshot:a.registry});
 const api2=runtime.worldMutationAPI;
 const r=api2.proposeTransaction({transactionId:'tx-two',expectedWorldRevision:0,commands:[F.moveCommand('e1',0,'cmd-a'),F.moveCommand('e2',0,'cmd-b')]});
 assert.equal(r.status,'COMMITTED');
 assert.equal(r.event.physicalProof.obligations.length,2);
 assert.deepEqual(r.event.physicalProof.obligations.map(o=>o.outcome),['PASS','PASS']);
 assert.equal(r.event.physicalProof.obligations[0].routeDigest,r.event.physicalProof.obligations[1].routeDigest);
 assert.notEqual(r.event.physicalProof.obligations[0].obligationDigest,r.event.physicalProof.obligations[1].obligationDigest);
 assert.notEqual(r.event.physicalProof.obligations[0].v3EvidenceDigest,r.event.physicalProof.obligations[1].v3EvidenceDigest);
});

test('ROUTED-REMOVE-ONLY a removal-only transaction still passes through the promoted port (no bypass around PhysicalLegalityPort)',()=>{
 const {api}=promotedSystem();
 const before=api.getWorldState();
 const r=api.proposeTransaction({transactionId:'tx-remove',expectedWorldRevision:0,commands:[{commandId:'cmd-remove-e1',type:'RemoveEntity',expectedWorldRevision:0,entityId:'e1'}]});
 assert.equal(r.status,'COMMITTED');
 assert.equal(r.state.entities.e1.lifecycleState,'REMOVED');
 assert(r.event.physicalProof,'removal commit must carry proof evidence: the port was consulted even though no live command remained');
 assert.equal(r.event.physicalProof.decision,'COMMIT_ALLOWED');
 assert.equal(r.state.revision,before.revision+1);
});

test('ROUTED-WRITER-PRIVACY no public writer or capability surface exists on the promoted runtime',()=>{
 const {runtime,store}=promotedSystem();
 assert.deepEqual(Object.keys(runtime).sort(),['worldMutationAPI','worldStore']);
 for(const k of ['commit','capability','writer','_writer','state'])assert.equal(k in store,false,k);
 assert.throws(()=>{store.commit={}},TypeError);
});

test('ROUTED-REGISTRY-INDEPENDENCE request-carried authority is never the source of truth',()=>{
 const {a,api}=promotedSystem();
 const forged={authoritySnapshotId:'forged',revision:99,digest:F.H('f'),definitions:{},frames:{},authority:{geometryRefs:{}}};
 const raw=F.moveTransaction('e1',0,'tx-forged',{registrySnapshot:forged,authority:forged.authority});
 const r=api.proposeTransaction(raw);
 assert.equal(r.status,'COMMITTED');
 // the committed proof cites the composition-time registry, not the forged request-carried one
 assert.equal(r.event.physicalProof.authoritySnapshotRef.digest,a.registry.registrySnapshotDigest);
 assert.notEqual(r.event.physicalProof.authoritySnapshotRef.digest,forged.digest);
});

test('ROUTED-COMPOSITION-INTEGRITY the caller cannot select or replace the evaluator or port',()=>{
 const a=F.buildAuthority();
 const hostile={evaluate:()=>({outcome:'PASS'})};
 const runtime=createV3PromotedAuthorityRuntime({initialWorld:F.initialWorld(a.supportRelation),registrySnapshot:a.registry,legalityPort:hostile,evaluator:()=>({status:'PASS'})});
 const api=runtime.worldMutationAPI;
 const before=api.getWorldState(),raw=F.moveTransaction();
 const r=api.proposeTransaction(raw);
 assert.equal(r.status,'COMMITTED');
 const ind=F.independentProof({registry:a.registry,before,after:r.state,rawTransaction:raw});
 assert.equal(r.event.physicalProof.payloadDigest,ind.proof.payloadDigest);
 assert.equal(r.event.physicalProof.obligations[0].v3Status,'PASS');
});
