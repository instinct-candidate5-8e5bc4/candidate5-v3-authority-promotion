'use strict';
// Candidate 5: detached reproducible determinism harness.
// Runs the real Foundation commit/replay flow three times inside this process
// and emits canonical evidence with a SHA-256 over it. The closure proof runs
// this script in two detached processes and requires identical SHA-256.
const crypto=require('node:crypto');
const {digest,canonicalBytes}=require('../../src/clean-runtime/contracts/canonical');
const {execute,replay}=require('./v3-foundation-commit-replay-simulator');
const {realFixture,realProof}=require('./v3-candidate5-fixture');
function run(){const f=realFixture(),r=realProof(f);if(r.error)throw Error('foundation run failed: '+JSON.stringify(r.detail));const ex=execute({state:f.before,decision:r.decision,transaction:f.transaction,physicalProof:r.proof,expectedProofRoot:r.root});if(ex.status!=='COMMITTED')throw Error('execute not committed: '+ex.status);const rp=replay({initialState:f.before,eventLog:ex.eventLog,proofRootsByTransaction:{[f.transaction.transactionId]:r.root}});if(rp.status!=='REPLAY_OK')throw Error('replay failed: '+rp.status);return {registrySnapshotDigest:f.registry.registrySnapshotDigest,beforeStateDigest:f.before.stateDigest,afterStateDigest:f.after.stateDigest,authorityEnvelopeDigest:r.envelope.envelopeDigest,planDigest:r.plan.planDigest,decisionDigest:r.decision.decisionDigest,proofPayloadDigest:r.proof.payloadDigest,externalProofRoot:r.root,eventDigest:ex.event.eventDigest,eventChainDigest:rp.eventChainDigest,replayFinalStateDigest:rp.finalStateDigest}}
const runs=[run(),run(),run()];
const identical=runs[0]&&runs.every(x=>JSON.stringify(x)===JSON.stringify(runs[0]));
const evidence={schemaVersion:'v3-candidate5-determinism/1.0.0',inProcessRuns:3,inProcessIdentical:identical,run:runs[0]};
evidence.evidenceDigest=crypto.createHash('sha256').update(canonicalBytes({schemaVersion:evidence.schemaVersion,inProcessRuns:evidence.inProcessRuns,inProcessIdentical:evidence.inProcessIdentical,run:evidence.run})).digest('hex');
console.log(JSON.stringify(evidence,null,2));
if(!identical)process.exit(1);
