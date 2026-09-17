'use strict';
const ORDER=Object.freeze(['CONTACT_REGION_VS_SUPPORT_SURFACE','BODY_CONTAINMENT_IN_ALLOWED_REGION','BODY_VS_OPENING_BOUNDARY','BODY_VS_BODY','BODY_VS_WORLD_SOLID','BODY_VS_OBSTACLE']);
function canonicalImpact(tx){return [...new Set((tx?.commands||[]).map(c=>c.entityId||c.entity?.entityId).filter(Boolean))].sort()}
function plan({transaction,requirementsByEntity={}}){
  const impactedEntityIds=canonicalImpact(transaction),proofs=[];
  for(const entityId of impactedEntityIds){
    const requirements=requirementsByEntity[entityId]||[];
    for(const queryType of ORDER)for(const r of requirements.filter(x=>x&&x.queryType===queryType))proofs.push(Object.freeze({entityId,queryType,request:structuredClone(r.request)}));
    const unknown=requirements.filter(x=>x&&!ORDER.includes(x.queryType));
    for(const r of unknown.sort((a,b)=>String(a.queryType).localeCompare(String(b.queryType))))proofs.push(Object.freeze({entityId,queryType:r.queryType||null,request:structuredClone(r.request)}));
  }
  return Object.freeze({kind:'V3_PHYSICAL_PROOF_PLAN',impactedEntityIds:Object.freeze(impactedEntityIds),proofs:Object.freeze(proofs)});
}
module.exports={ORDER,plan};
