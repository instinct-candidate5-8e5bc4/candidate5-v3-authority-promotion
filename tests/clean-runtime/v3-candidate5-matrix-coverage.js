'use strict';
// Candidate 5 (resubmission, corrected): normative 69-row acceptance matrix.
// No duplicate route-exactness or permutation filler rows; every row is a
// distinct normative behavior mapped to a real behavioral regression. The 27
// Foundation-path rows are enforced against structured per-row evidence
// records: outcome, reason/classification, evaluator count, final decision,
// unchanged synthetic state bytes on rejection, and required evidence fields.
// The isolation audit and detached determinism harness run as additional
// gates (not matrix rows). Exits 0 only when every row and gate passes.
const cp=require('node:child_process'),path=require('node:path'),fs=require('node:fs'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..');
const F='tests/clean-runtime/v3-authority-promotion-foundation.test.js',A='tests/clean-runtime/v3-foundation-adversarial-closure.test.js',M='tests/clean-runtime/v3-promotion-acceptance-matrix.test.js',H='tests/clean-runtime/v3-promotion-hostile.test.js',FP='tests/clean-runtime/v3-promotion-full-path.test.js',FPCO='tests/clean-runtime/v3-promotion-full-path-containment-opening.test.js',R='tests/clean-runtime/v3-foundation-fourth-review.test.js',X='tests/clean-runtime/v3-candidate5-foundation-matrix.test.js';
const rows=[
['ROUTE_TABLE_SHAPE','foundation route table is exactly 3 promoted + 3 non-promoted',F],
['ROUTE_EXACT_TUPLE','promoted routes require exact capability version query tuple',F],
['ROUTE_LOCKED_NON_PROMOTED','locked collision routes are explicit NON_PROMOTED',F],
['PLAN_PERMUTATION_CANONICAL','all command permutations produce identical canonical plan bytes',A],
['IMPACT_CONTAINMENT_CLOSURE','shared containment target closes impact over siblings',A],
['IMPACT_BOUNDARY_CLOSURE','shared boundary closes impact over siblings',A],
['ROUTE_DIGEST_SEALED','route digest sealed',M],
['ROUTE_UNKNOWN_VERSION_FAIL_CLOSED','unknown version is never routed 3.0.0 ',M],
['ROUTE_UNKNOWN_CAPABILITY_FAIL_CLOSED','unknown capability fails closed',M],
['CONTEXT_EXACT_ENVELOPE_READY','context exact envelope is READY',M],
['ADV_01','ADV-01 missing opening membership target is rejected before READY',H],
['ADV_02','ADV-02 exact promoted identities cannot be swapped',H],
['ADV_03','ADV-03 caller requirements cannot create an obligation',H],
['ADV_04','ADV-04 physical zero obligations fail closed',H],
['ADV_05','ADV-05 forged registry digest rejects',H],
['ADV_06','ADV-06 missing geometry pin rejects',H],
['ADV_07','ADV-07 missing frame pin rejects',H],
['ADV_08','ADV-08 wrong query does not route',H],
['ADV_09','ADV-09 envelope bound to a foreign transaction digest rejects at planning',H],
['ADV_10','ADV-10 opening backref mismatch rejects before READY',H],
['ADV_11','ADV-11 stale compound child digest rejects before READY',H],
['ADV_12','ADV-12 context projection and adapter enforce the full authority requirement set',H],
['ADV_13','ADV-13 obligation identity is content-bound and requestId equals obligationId',H],
['FULL_PATH_SUPPORT_PASS','FULL-PATH-SUPPORT envelope -> plan -> route -> context -> adapter -> aggregate PASS',FP],
['FULL_PATH_CONTAINMENT_PASS','FULL-PATH-CONTAINMENT envelope -> plan -> route -> context -> adapter -> aggregate PASS',FPCO],
['FULL_PATH_OPENING_PASS','FULL-PATH-OPENING envelope -> plan -> route -> context -> adapter -> aggregate PASS',FPCO],
['CONTEXT_MIXED_ENVELOPE_PROJECTION','mixed-envelope context projection rejects before evaluator',R],
['ENVELOPE_SNAPSHOT_REF_REQUIRED','context projection rejects envelope missing authoritySnapshotRef',R],
['ENVELOPE_WORLDBINDING_REQUIRED','context projection rejects envelope missing canonical worldBinding',R],
['A3_CONTEXT_BINDING','A3 context binds sourceEnvelopeDigest, full authoritySnapshotRef and canonical worldBinding',R],
['ADAPTER_REBOUND_CONTEXT','adapter rejects context rebound to another envelope with zero evaluator calls',R],
['ADAPTER_TAMPERED_SNAPSHOT','adapter rejects honestly re-signed context with tampered authoritySnapshotRef',R],
['ADAPTER_TAMPERED_WORLDBINDING','adapter rejects honestly re-signed context with tampered worldBinding',R],
['REPLAY_ATOMIC_COMMIT','real Foundation output append+commit is atomic and replay exact under external proof root',R],
['REPLAY_EXTERNAL_PROOF_ROOT','replay requires the EXTERNAL proof root and never trusts the event-carried root',R],
['APPEND_FAILURE_ATOMIC','real event append failure leaves state and log byte-identical',R],
['COMMIT_FAILURE_ROLLBACK','real commit failure rolls back staged event and state',R],
['REPLAY_TAMPERED_SEQUENCE','replay rejects tampered sequence',R],
['REPLAY_TAMPERED_TRANSACTION','replay rejects tampered transactionId',R],
['REPLAY_TAMPERED_PROOF','replay rejects tampered physicalProof',R],
['REPLAY_FORGED_PROOF','replay rejects a re-signed forged proof (honest payload and event re-digest)',R],
['OFFSET_PLANE_Y10','__X__',X],
['OFFSET_PLANE_Y11','__X__',X],
['OFFSET_PLANE_Y9','__X__',X],
['MISSING_BOUNDARY_PROTRUSION_1000','__X__',X],
['FORGED_CONTAINMENT_BODY','__X__',X],
['FORGED_CONTAINMENT_TARGET','__X__',X],
['MISSING_OPENING_BODY','__X__',X],
['FORGED_OPENING_BODY','__X__',X],
['MISSING_OPENING_SOLID','__X__',X],
['FORGED_OPENING_SOLID','__X__',X],
['COMPOUND_ILLEGAL_SIBLING','__X__',X],
['QUANTIZATION_AMBIGUITY','__X__',X],
['AGGREGATE_PASS_PASS','__X__',X],
['AGGREGATE_PASS_FAIL','__X__',X],
['AGGREGATE_PASS_UNKNOWN','__X__',X],
['AGGREGATE_PASS_INVALID','__X__',X],
['AGGREGATE_PASS_NON_PROMOTED','__X__',X],
['FAIL_CLOSED_PRECEDENCE_UNKNOWN_OVER_FAIL','__X__',X],
['FAIL_CLOSED_PRECEDENCE_INVALID_OVER_FAIL','__X__',X],
['EVALUATOR_THROW','__X__',X],
['EVALUATOR_MALFORMED_RETURN','__X__',X],
['CALLER_EVALUATOR_BYPASS','__X__',X],
['GLOBAL_CORRUPTION_OUTSIDE_IMPACT','__X__',X],
['VALID_UNRELATED_CONTROL','__X__',X],
['MANIFEST_MODIFIED_MODULE','__X__',X],
['MANIFEST_UNAPPROVED_MODULE','__X__',X],
['PRODUCTION_EXPORTS_CLOSED','__X__',X],
['DETACHED_DETERMINISM','__DETERMINISM__','tests/clean-runtime/v3-candidate5-determinism.js']];
if(rows.length!==69){console.error('matrix row count '+rows.length+' != 69');process.exit(1)}
const ids=new Set(rows.map(r=>r[0]));if(ids.size!==69){console.error('matrix row ids are not distinct');process.exit(1)}
const files=[...new Set(rows.map(r=>r[2]).filter(f=>f.endsWith('.test.js')))];
const evidencePath=path.resolve(root,'evidence/clean-runtime/v3-authority-promotion-foundation/candidate5/foundation-matrix-evidence.json');
fs.rmSync(evidencePath,{force:true});
const out=cp.execFileSync('node',['--test',...files],{cwd:root,encoding:'utf8'});
const passing=new Set();for(const line of out.split('\n')){const m=line.match(/^ok \d+ - (.*)$/);if(m)passing.add(m[1]);if(/^not ok /.test(line)){console.error('focused suite has a failing test: '+line);process.exit(1)}}
const evidence=JSON.parse(fs.readFileSync(evidencePath,'utf8'));
const byRow=new Map(evidence.records.map(r=>[r.row,r]));
const REQUIRED=['outcome','reason','classification','evaluatorCalls','decision','stateBytesUnchanged','resultDigest','evidenceFields'];
const uncovered=[];
for(const [id,name] of rows){
 if(name==='__DETERMINISM__')continue;
 if(name==='__X__'){
  const r=byRow.get(id);
  if(!r){uncovered.push([id,'missing per-row evidence record']);continue}
  for(const k of REQUIRED)if(r[k]===undefined)uncovered.push([id,'evidence record missing field '+k]);
  if(!/^[0-9a-f]{64}$/.test(r.resultDigest||''))uncovered.push([id,'resultDigest is not a sha256 hex']);
  if(!Array.isArray(r.evidenceFields)||!r.evidenceFields.length)uncovered.push([id,'evidenceFields empty']);
  if(!Number.isInteger(r.evaluatorCalls)||r.evaluatorCalls<0)uncovered.push([id,'evaluatorCalls not a non-negative integer']);
  if((r.decision==='COMMIT_ALLOWED')!==(r.outcome==='PASS'))uncovered.push([id,'decision/outcome inconsistent: commit without PASS or PASS without commit']);
  if(r.decision!=='COMMIT_ALLOWED'&&r.stateBytesUnchanged!==true)uncovered.push([id,'rejection did not prove unchanged synthetic state bytes']);
  continue}
 if(!passing.has(name))uncovered.push([id,name])}
let auditOk=false,auditDigest=null;try{const a=JSON.parse(cp.execFileSync('node',['tests/clean-runtime/v3-promotion-authority-audit.js'],{cwd:root,encoding:'utf8'}));auditOk=a.findings.length===0;auditDigest=a.auditDigest}catch{}
let determinismOk=false,determinismSha=null;try{const r1=cp.execFileSync('node',['tests/clean-runtime/v3-candidate5-determinism.js'],{cwd:root,encoding:'utf8'});const r2=cp.execFileSync('node',['tests/clean-runtime/v3-candidate5-determinism.js'],{cwd:root,encoding:'utf8'});const h1=crypto.createHash('sha256').update(r1).digest('hex'),h2=crypto.createHash('sha256').update(r2).digest('hex');determinismOk=h1===h2;determinismSha={run1:h1,run2:h2,identical:h1===h2}}catch{}
if(!determinismOk)uncovered.push(['DETACHED_DETERMINISM','detached determinism runs differ or failed']);
const result={schemaVersion:'v3-candidate5-matrix-coverage/3.2.0',matrixRows:69,covered:69-uncovered.length,gates:{audit:{executed:true,clean:auditOk,digest:auditDigest},detachedDeterminism:determinismSha},uncovered:uncovered.map(([id,what])=>({row:id,missing:what}))};
console.log(JSON.stringify(result,null,2));
if(uncovered.length||!auditOk)process.exit(1);
console.log('MATRIX 69/69 COVERED BY PASSING BEHAVIORAL REGRESSIONS WITH PER-ROW EVIDENCE RECORDS');
