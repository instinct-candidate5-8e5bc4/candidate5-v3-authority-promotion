'use strict';
// Candidate 5: normative 67-row acceptance matrix coverage verifier.
// Each locked matrix row is mapped to real behavioral regressions (behavior,
// fail-closed, result, evaluator and commit evidence). Row 48 is covered by
// executing the isolation audit. Exits 0 only when every row is covered by a
// passing behavioral regression.
const cp=require('node:child_process'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const M='tests/clean-runtime/v3-promotion-acceptance-matrix.test.js',H='tests/clean-runtime/v3-promotion-hostile.test.js',F='tests/clean-runtime/v3-authority-promotion-foundation.test.js',A='tests/clean-runtime/v3-foundation-adversarial-closure.test.js',FP='tests/clean-runtime/v3-promotion-full-path.test.js',FPCO='tests/clean-runtime/v3-promotion-full-path-containment-opening.test.js';
const rows=[
['ROUTE_TABLE_SHAPE','foundation route table is exactly 3 promoted + 3 non-promoted',F],
['ROUTE_EXACT_TUPLE','promoted routes require exact capability version query tuple',F],
['ROUTE_LOCKED_NON_PROMOTED','locked collision routes are explicit NON_PROMOTED',F],
['PLAN_PERMUTATION_CANONICAL','all command permutations produce identical canonical plan bytes',A],
['IMPACT_CONTAINMENT_CLOSURE','shared containment target closes impact over siblings',A],
['IMPACT_BOUNDARY_CLOSURE','shared boundary closes impact over siblings',A],
['ROUTE_EXACT_V3_SUPPORT','route exact V3_SUPPORT',M],
['ROUTE_EXACT_V3_CONTAINMENT','route exact V3_CONTAINMENT',M],
['ROUTE_EXACT_V3_OPENING','route exact V3_OPENING',M],
['ROUTE_EXACT_V3_BODY_VS_BODY','route exact V3_BODY_VS_BODY',M],
['ROUTE_EXACT_V3_WORLD_SOLID','route exact V3_WORLD_SOLID',M],
['ROUTE_EXACT_V3_OBSTACLE','route exact V3_OBSTACLE',M],
['ROUTE_WRONG_QUERY_SUPPORT','route rejects wrong query V3_SUPPORT',M],
['ROUTE_WRONG_QUERY_CONTAINMENT','route rejects wrong query V3_CONTAINMENT',M],
['ROUTE_WRONG_QUERY_OPENING','route rejects wrong query V3_OPENING',M],
['ROUTE_WRONG_QUERY_BODY','route rejects wrong query V3_BODY_VS_BODY',M],
['ROUTE_WRONG_QUERY_WORLD','route rejects wrong query V3_WORLD_SOLID',M],
['ROUTE_WRONG_QUERY_OBSTACLE','route rejects wrong query V3_OBSTACLE',M],
['ROUTE_TABLE_EXACT_SIX','route table exact six',M],
['ROUTE_TABLE_EXACT_PROMOTED','route table exact promoted three',M],
['ROUTE_TABLE_DIGEST','route digest sealed',M],
['PERMUTATION_1','permutation canonical 1',M],
['PERMUTATION_2','permutation canonical 2',M],
['PERMUTATION_3','permutation canonical 3',M],
['PERMUTATION_4','permutation canonical 4',M],
['PERMUTATION_5','permutation canonical 5',M],
['PERMUTATION_6','permutation canonical 6',M],
['IMPACT_INITIATOR','impact shared target includes initiator',M],
['IMPACT_SIBLING','impact shared target includes sibling',M],
['IMPACT_TARGET_SET','impact shared target records target',M],
['IMPACT_DIRECT_CANONICAL','impact direct set canonical',M],
['IMPACT_DIGEST','impact digest sealed',M],
['PLANNER_NO_CALLER_REQUIREMENTS','ADV-03 caller requirements cannot create an obligation',H],
['PLANNER_CANONICAL_COMMANDS','all command permutations produce identical canonical plan bytes',A],
['PLANNER_CANONICAL_TX_BINDING','ADV-09 envelope bound to a foreign transaction digest rejects at planning',H],
['PLANNER_TARGET_CLOSURE','impact shared target records target',M],
['PLANNER_BOUNDARY_CLOSURE','boundary closure records boundary',M],
['OBLIGATION_REQUEST_IDENTITY','ADV-13 obligation identity is content-bound and requestId equals obligationId',H],
['OBLIGATION_IDENTITY_CONTENT_BOUND','ADV-13 obligation identity is content-bound and requestId equals obligationId',H],
['ENVELOPE_CONTAINMENT_PROJECTION','FULL-PATH-CONTAINMENT envelope -> plan -> route -> context -> adapter -> aggregate PASS',FPCO],
['ENVELOPE_OPENING_PROJECTION','FULL-PATH-OPENING envelope -> plan -> route -> context -> adapter -> aggregate PASS',FPCO],
['ENVELOPE_OPENING_MEMBERSHIP','ADV-01 missing opening membership target is rejected before READY',H],
['ENVELOPE_OPENING_BACKREF','ADV-10 opening backref mismatch rejects before READY',H],
['ENVELOPE_COMPOUND_CHILDREN','ADV-11 stale compound child digest rejects before READY',H],
['CONTEXT_FRAMES_CANONICAL','FULL-PATH-SUPPORT envelope -> plan -> route -> context -> adapter -> aggregate PASS',FP],
['CONTEXT_SUPPORT_RELATIONS','FULL-PATH-SUPPORT envelope -> plan -> route -> context -> adapter -> aggregate PASS',FP],
['CONTEXT_AUTHORITY_REQUIREMENTS','ADV-12 context projection and adapter enforce the full authority requirement set',H],
['AUDIT_INBOUND_ISOLATION','__AUDIT__','tests/clean-runtime/v3-promotion-authority-audit.js'],
['FULL_PATH_CONTAINMENT','FULL-PATH-CONTAINMENT envelope -> plan -> route -> context -> adapter -> aggregate PASS',FPCO],
['FULL_PATH_OPENING','FULL-PATH-OPENING envelope -> plan -> route -> context -> adapter -> aggregate PASS',FPCO],
['FULL_PATH_SUPPORT','FULL-PATH-SUPPORT envelope -> plan -> route -> context -> adapter -> aggregate PASS',FP],
['ADV_01','ADV-01 missing opening membership target is rejected before READY',H],
['ADV_02','ADV-02 exact promoted identities cannot be swapped',H],
['ADV_03','ADV-03 caller requirements cannot create an obligation',H],
['ADV_04','ADV-04 physical zero obligations fail closed',H],
['ADV_05','ADV-05 forged registry digest rejects',H],
['ADV_06','ADV-06 missing geometry pin rejects',H],
['ADV_07','ADV-07 missing frame pin rejects',H],
['ADV_08','ADV-08 wrong query does not route',H],
['ADV_LOCKED_BODY','ADV locked V3_BODY_VS_BODY',H],
['ADV_LOCKED_WORLD','ADV locked V3_WORLD_SOLID',H],
['ADV_LOCKED_OBSTACLE','ADV locked V3_OBSTACLE',H],
['ADV_VERSION_PAD','ADV version 3.0.0 ',H],
['ADV_VERSION_LEADING_ZERO','ADV version 03.0.0',H],
['ADV_VERSION_FUTURE','ADV version 4.0.0',H],
['ADV_VERSION_NULL','ADV version null',H],
['ADV_VERSION_UNDEFINED','ADV version undefined',H]];
if(rows.length!==67){console.error('matrix row count '+rows.length+' != 67');process.exit(1)}
const out=cp.execFileSync('node',['--test','tests/clean-runtime/v3-authority-promotion-foundation.test.js','tests/clean-runtime/v3-foundation-adversarial-closure.test.js','tests/clean-runtime/v3-foundation-fourth-review.test.js','tests/clean-runtime/v3-promotion-acceptance-matrix.test.js','tests/clean-runtime/v3-promotion-full-path.test.js','tests/clean-runtime/v3-promotion-full-path-containment-opening.test.js','tests/clean-runtime/v3-promotion-hostile.test.js'],{cwd:root,encoding:'utf8'});
const passing=new Set();for(const line of out.split('\n')){const m=line.match(/^ok \d+ - (.*)$/);if(m)passing.add(m[1]);if(/^not ok /.test(line)){console.error('focused suite has a failing test: '+line);process.exit(1)}}
let auditOk=false;try{cp.execFileSync('node',['tests/clean-runtime/v3-promotion-authority-audit.js'],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']});auditOk=true}catch{}
const uncovered=[];for(const [id,name,file] of rows){if(name==='__AUDIT__'){if(!auditOk)uncovered.push([id,'audit findings or nonzero exit']);continue}if(!passing.has(name))uncovered.push([id,name+' ('+file+')'])}
const result={schemaVersion:'v3-candidate5-matrix-coverage/1.0.0',matrixRows:67,covered:67-uncovered.length,auditExecuted:true,auditClean:auditOk,uncovered:uncovered.map(([id,what])=>({row:id,missing:what}))};
console.log(JSON.stringify(result,null,2));
if(uncovered.length)process.exit(1);
console.log('MATRIX 67/67 COVERED BY PASSING BEHAVIORAL REGRESSIONS');
