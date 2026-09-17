'use strict';
// Authority Routing Gate: detached reproducible determinism harness.
// Runs the real promoted production path (WorldMutationAPI -> promoted port ->
// planner -> router -> certified V3 evaluator -> aggregate -> atomic commit ->
// event chain -> replay) three times inside this process and emits canonical
// evidence with a SHA-256 over it. The gate proof runs this script in two
// detached processes and requires identical SHA-256.
const crypto=require('node:crypto');
const {digest,canonicalBytes}=require('../../src/clean-runtime/contracts/canonical');
const {createV3PromotedAuthorityRuntime}=require('../../src/clean-runtime/v3-routing/promoted-authority-runtime');
const {replay}=require('../../src/clean-runtime/events/replay');
const F=require('./v3-routing-fixture');
function run(){
 const a=F.buildAuthority({secondSupport:true});
 const rt=createV3PromotedAuthorityRuntime({initialWorld:F.initialWorld(a.supportRelation,{e2:F.runtimeEntity('e2')},[a.secondSupportRelation]),registrySnapshot:a.registry});
 const api=rt.worldMutationAPI;
 const initial=api.getWorldState();
 const r1=api.proposeTransaction({transactionId:'tx-det-1',expectedWorldRevision:0,commands:[F.moveCommand('e1',0,'cmd-det-a'),F.moveCommand('e2',0,'cmd-det-b')]});
 if(r1.status!=='COMMITTED')throw Error('routing determinism run failed: '+JSON.stringify(r1.failure));
 const r2=api.proposeTransaction(F.moveTransaction('e1',1,'tx-det-2'));
 if(r2.status!=='COMMITTED')throw Error('routing determinism second commit failed: '+JSON.stringify(r2.failure));
 const rp=replay(initial,api.getEventLog());
 if(rp.stateDigest!==api.getWorldState().stateDigest)throw Error('replay digest mismatch');
 return {registrySnapshotDigest:a.registry.registrySnapshotDigest,initialStateDigest:initial.stateDigest,finalStateDigest:rp.stateDigest,proofPayloadDigests:api.getEventLog().map(e=>e.physicalProof.payloadDigest),planDigests:api.getEventLog().map(e=>e.physicalProof.planDigest),decisionDigests:api.getEventLog().map(e=>e.physicalProof.decisionDigest),eventDigests:api.getEventLog().map(e=>e.eventDigest),eventChainDigest:digest(api.getEventLog()),replayFinalStateDigest:rp.stateDigest};
}
const runs=[run(),run(),run()];
const identical=runs.every(x=>JSON.stringify(x)===JSON.stringify(runs[0]));
const evidence={schemaVersion:'v3-routing-determinism/1.0.0',inProcessRuns:3,inProcessIdentical:identical,run:runs[0]};
evidence.evidenceDigest=crypto.createHash('sha256').update(canonicalBytes({schemaVersion:evidence.schemaVersion,inProcessRuns:evidence.inProcessRuns,inProcessIdentical:evidence.inProcessIdentical,run:evidence.run})).digest('hex');
console.log(JSON.stringify(evidence,null,2));
if(!identical)process.exit(1);
