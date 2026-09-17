'use strict';
const {evaluateV3}=require('../../verified-architecture-phase2-v3/evaluate');
const {digest}=require('../contracts/canonical');const {deepFreeze}=require('../contracts/world-state');
function malformed(o,stage,extra={}){const body={schemaVersion:'v3-authority-adapter-result/1.0.0',obligationId:o?.obligationId||null,obligationDigest:o?.obligationDigest||null,capability:o?.capability||null,routeDigest:null,authorityEnvelopeDigest:null,outcome:'UNKNOWN',classification:'MALFORMED_V3_RESULT',v3:{status:'MALFORMED',reason:'MALFORMED_V3_RESULT',evidenceDigest:null,result:null},adapterEvidence:{evaluatorId:'CLOSED_V3',evaluatorCalls:0,validationStage:stage,selectedCapabilityRoute:null},...extra};return deepFreeze({...body,resultDigest:digest(body)})}
function evaluate({obligation,route,context,envelopeRef}={}){
 if(!obligation||digest({...obligation,obligationDigest:undefined})!==obligation.obligationDigest)return malformed(obligation,'obligation');
 if(!route||route.routeState!=='PROMOTED'||route.evaluatorId!=='CLOSED_V3'||route.capability!==obligation.capability||route.queryType!==obligation.queryType||route.apiVersion!==obligation.apiVersion||digest({...route,routeDigest:undefined})!==route.routeDigest)return malformed(obligation,'route');
 if(!envelopeRef||envelopeRef.envelopeDigest!==obligation.authorityEnvelopeDigest&&obligation.authorityEnvelopeDigest)return malformed(obligation,'envelope');
 if(!context||context.status!=='READY')return malformed(obligation,'context');
 const req=obligation.request;if(req?.apiVersion!==obligation.apiVersion||req?.queryType!==obligation.queryType||req?.requestId!==obligation.obligationId)return malformed(obligation,'request');
 let r;try{r=evaluateV3(req,context.context)}catch(e){return malformed(obligation,'evaluator-throw',{exception:String(e?.message||e).slice(0,256)})}
 const validStatus=['PASS','FAIL','UNKNOWN','INVALID'].includes(r?.status),identity=r?.apiVersion===req.apiVersion&&r?.requestId===req.requestId&&r?.queryType===req.queryType,ed=typeof r?.evidenceDigest==='string'&&r.evidenceDigest.length===64;if(!validStatus||!identity||!r.reason||!ed||!Object.isFrozen(r))return malformed(obligation,'evaluator-result');
 let outcome='UNKNOWN',classification='V3_UNCERTAIN_OR_UNSUPPORTED';if(r.status==='PASS'&&r.reason==='VALID'){outcome='PASS';classification='V3_VALID'}else if(r.status==='FAIL'){outcome='FAIL';classification='V3_DEFINITE_ILLEGALITY'}else if(r.status==='INVALID')classification='V3_INVALID_AUTHORITY';else if(r.status==='PASS')classification='MALFORMED_V3_RESULT';
 const body={schemaVersion:'v3-authority-adapter-result/1.0.0',obligationId:obligation.obligationId,obligationDigest:obligation.obligationDigest,capability:obligation.capability,routeDigest:route.routeDigest,authorityEnvelopeDigest:envelopeRef.envelopeDigest,outcome,classification,v3:{status:r.status,reason:r.reason,evidenceDigest:r.evidenceDigest,result:r},adapterEvidence:{evaluatorId:'CLOSED_V3',evaluatorCalls:1,validationStage:'complete',selectedCapabilityRoute:route}};return deepFreeze({...body,resultDigest:digest(body)})
}
module.exports={evaluate};
