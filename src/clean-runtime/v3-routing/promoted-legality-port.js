'use strict';
// V3 Authority Routing Gate: the promoted PhysicalLegalityPort.
//
// This module is the single runtime port that connects WorldMutationAPI to
// the certified V3 authority path: deterministic Promotion Proof Planner ->
// explicit Physical Capability Router -> closed V3 evaluator (through the
// certified Foundation adapter seam) -> fail-closed aggregate decision.
//
// Authority data (the authority registrySnapshot) is injected at composition
// time through registryProvider and is never read from the mutation request:
// request-carried authority is not a source of truth. The evaluator is fixed
// inside the certified Foundation modules; this port exposes no evaluator,
// router, or planner selection surface. Every structural or authority failure
// returns outcome UNKNOWN (fail-closed); nothing here can produce PASS except
// a complete certified Foundation COMMIT_ALLOWED decision.
//
// WorldMutationAPI consults this port once per command, and exactly once for
// transactions whose commands all target removed entities. The certified
// decision is transaction-scoped, so the port computes it once per
// transaction and reuses it only when the transaction/before/candidate
// binding digests match exactly; any conflict is UNKNOWN.
const {world,deepFreeze}=require('../contracts/world-state');
const {evaluateTransaction,physicalProofPayload}=require('../mutation/v3-promotion-foundation');
const {computeImpact,plan}=require('../mutation/physical-proof-planner');
const {buildAuthorityEnvelope}=require('../v3-authority/authority-envelope-builder');
function unknown(reason,extra={}){return deepFreeze({outcome:'UNKNOWN',physicalProof:null,routingFailure:deepFreeze({reason,...extra})})}
function createPromotedLegalityPort({registryProvider}={}){
 if(typeof registryProvider!=='function')throw TypeError('INVALID_REGISTRY_PROVIDER');
 let cached=null;
 function evaluate(input={}){
  const before=input.worldState,draft=input.proposedState,tx=input.transaction,cmd=input.command??null;
  try{
   if(!before||!draft||!tx||typeof tx.transactionDigest!=='string'||!Array.isArray(tx.commands))return unknown('INVALID_PORT_INPUT');
   if(cmd){
    const sealed=tx.commands.find(c=>c.commandId===cmd.commandId);
    if(!sealed||sealed.commandDigest!==cmd.commandDigest)return unknown('COMMAND_NOT_IN_TRANSACTION');
   }
   const candidate=world({...draft,revision:before.revision+1,priorStateDigest:before.stateDigest,committedEventSequence:(before.committedEventSequence||0)+1});
   const binding={transactionDigest:tx.transactionDigest,beforeStateDigest:before.stateDigest,proposedStateDigest:candidate.stateDigest};
   if(cached&&cached.binding.transactionDigest===binding.transactionDigest){
    if(cached.binding.beforeStateDigest!==binding.beforeStateDigest||cached.binding.proposedStateDigest!==binding.proposedStateDigest)return unknown('TRANSACTION_BINDING_CONFLICT');
    return cached.result;
   }
   const registrySnapshot=registryProvider();
   const x={beforeState:before,proposedState:candidate,transaction:tx,registrySnapshot};
   const decision=evaluateTransaction(x);
   let authoritySnapshotRef=null,planId=null;
   const impact=computeImpact(x);
   if(impact){
    const eb=buildAuthorityEnvelope({...x,impactSet:impact});
    if(eb.status==='READY'){
     authoritySnapshotRef=eb.envelope.authoritySnapshotRef;
     const pp=plan({...x,envelope:eb.envelope});
     if(pp.status==='READY'){
      planId=pp.plan.planId;
      if(pp.planDigest!==decision.planDigest||eb.envelopeDigest!==decision.authorityEnvelopeDigest){
       const mismatch=unknown('FOUNDATION_RECOMPUTATION_MISMATCH');
       cached={binding,result:mismatch};
       return mismatch;
      }
     }
    }
   }
   const physicalProof=physicalProofPayload({decision,authoritySnapshotRef,plan:{planId}});
   let outcome='UNKNOWN';
   if(decision.decision==='COMMIT_ALLOWED'&&decision.outcome==='PASS')outcome='PASS';
   else if(decision.decision==='REJECT_REQUIRED'&&decision.outcome==='FAIL')outcome='FAIL';
   const routingSummary=deepFreeze({...structuredClone(decision.summary),classifications:decision.obligationResults.map(r=>deepFreeze({obligationId:r.obligationId,capability:r.capability,outcome:r.outcome,classification:r.classification||null}))});
   const result=deepFreeze({outcome,physicalProof,routingSummary,routingFailure:decision.envelopeFailure||decision.planFailure||null});
   cached={binding,result};
   return result;
  }catch(e){
   return unknown('PORT_EVALUATION_EXCEPTION',{message:String(e&&e.message||e).replace(/(?:[A-Za-z]:)?[\\/][^\s]+/g,'<path>').slice(0,256)});
  }
 }
 return deepFreeze({kind:'V3_PROMOTED_PHYSICAL_LEGALITY_PORT',evaluate});
}
module.exports={createPromotedLegalityPort};
