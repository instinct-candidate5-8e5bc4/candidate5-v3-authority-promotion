'use strict';
const ROUTES=Object.freeze({
  CONTACT_REGION_VS_SUPPORT_SURFACE:'V3_PROMOTION_CANDIDATE',
  BODY_CONTAINMENT_IN_ALLOWED_REGION:'V3_PROMOTION_CANDIDATE',
  BODY_VS_OPENING_BOUNDARY:'V3_PROMOTION_CANDIDATE',
  BODY_VS_BODY:'NON_PROMOTED',
  BODY_VS_WORLD_SOLID:'NON_PROMOTED',
  BODY_VS_OBSTACLE:'NON_PROMOTED'
});
function route(queryType){
  const authority=ROUTES[queryType]||'UNREGISTERED';
  if(authority!=='V3_PROMOTION_CANDIDATE')return Object.freeze({status:'UNKNOWN',reason:'CAPABILITY_NOT_PROMOTED',queryType:queryType||null,authority});
  return Object.freeze({status:'ROUTED',queryType,authority});
}
module.exports={ROUTES,route};
