'use strict';
const {route}=require('./physical-capability-router');
function mapResult(r){
  const evidence=Object.freeze({v3Status:r?.status||null,v3Reason:r?.reason||null,v3EvidenceDigest:r?.evidenceDigest||null,v3Evidence:r?.evidence||null});
  if(r?.status==='PASS'&&r?.reason==='VALID')return Object.freeze({outcome:'PASS',evidence});
  if(r?.status==='FAIL')return Object.freeze({outcome:'FAIL',evidence});
  return Object.freeze({outcome:'UNKNOWN',evidence});
}
function createV3AuthorityAdapter({evaluateV3,authorityEnvelope,proofPlanner}){
  if(typeof evaluateV3!=='function'||!authorityEnvelope||typeof proofPlanner!=='function')throw TypeError('INVALID_V3_PROMOTION_FOUNDATION');
  return Object.freeze({kind:'V3_AUTHORITY_PROMOTION_FOUNDATION_ONLY',evaluate(input){
    let p;try{p=proofPlanner(input)}catch(e){return Object.freeze({outcome:'UNKNOWN',evidence:{foundationReason:'PROOF_PLAN_INVALID',message:e.message}})}
    if(!p||!Array.isArray(p.proofs)||p.proofs.length===0)return Object.freeze({outcome:'UNKNOWN',evidence:{foundationReason:'PROOF_PLAN_EMPTY'}});
    const results=[];
    for(const proof of p.proofs){
      const selected=route(proof.queryType);
      if(selected.status!=='ROUTED')return Object.freeze({outcome:'UNKNOWN',evidence:{foundationReason:selected.reason,route:selected,proofPlan:p,results}});
      const r=evaluateV3(proof.request,authorityEnvelope),mapped=mapResult(r);
      results.push(Object.freeze({route:selected,result:r,mappedOutcome:mapped.outcome}));
      if(mapped.outcome!=='PASS')return Object.freeze({outcome:mapped.outcome,evidence:{foundationReason:'NON_PASS_PROOF',proofPlan:p,results,v3:mapped.evidence}});
    }
    return Object.freeze({outcome:'PASS',evidence:{foundationReason:'ALL_REQUIRED_PROOFS_PASS',proofPlan:p,results}});
  }});
}
module.exports={mapResult,createV3AuthorityAdapter};
