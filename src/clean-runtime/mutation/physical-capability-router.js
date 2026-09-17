'use strict';
const {digest}=require('../contracts/canonical');
const {deepFreeze}=require('../contracts/world-state');
const HEX=/^[0-9a-f]{64}$/;
const BASE={schemaVersion:'physical-capability-routes/1.0.0',routes:{
 V3_SUPPORT:{state:'PROMOTED',apiVersion:'3.0.0',queryType:'CONTACT_REGION_VS_SUPPORT_SURFACE',evaluatorId:'CLOSED_V3'},
 V3_CONTAINMENT:{state:'PROMOTED',apiVersion:'3.0.0',queryType:'BODY_CONTAINMENT_IN_ALLOWED_REGION',evaluatorId:'CLOSED_V3'},
 V3_OPENING:{state:'PROMOTED',apiVersion:'3.0.0',queryType:'BODY_VS_OPENING_BOUNDARY',evaluatorId:'CLOSED_V3'},
 V3_BODY_VS_BODY:{state:'NON_PROMOTED',apiVersion:'3.0.0',queryType:'BODY_VS_BODY',evaluatorId:null},
 V3_WORLD_SOLID:{state:'NON_PROMOTED',apiVersion:'3.0.0',queryType:'BODY_VS_WORLD_SOLID',evaluatorId:null},
 V3_OBSTACLE:{state:'NON_PROMOTED',apiVersion:'3.0.0',queryType:'BODY_VS_OBSTACLE',evaluatorId:null}
}};
const ROUTE_TABLE=deepFreeze({...BASE,routeTableDigest:digest(BASE)});
function evidence(x){const e={capability:x?.capability??null,apiVersion:x?.apiVersion??null,queryType:x?.queryType??null,routeTableDigest:ROUTE_TABLE.routeTableDigest};return deepFreeze({...e,routeEvidenceDigest:digest(e)})}
function route(x){
 const ev=evidence(x); if(!x||typeof x!=='object'||typeof x.capability!=='string'||typeof x.apiVersion!=='string'||typeof x.queryType!=='string')return deepFreeze({status:'NOT_ROUTED',outcome:'UNKNOWN',reason:'INVALID_ROUTE_REQUEST',routeEvidence:ev,routeEvidenceDigest:ev.routeEvidenceDigest});
 const r=ROUTE_TABLE.routes[x.capability]; if(!r)return deepFreeze({status:'NOT_ROUTED',outcome:'UNKNOWN',reason:'UNKNOWN_CAPABILITY',routeEvidence:ev,routeEvidenceDigest:ev.routeEvidenceDigest});
 if(x.apiVersion!==r.apiVersion)return deepFreeze({status:'NOT_ROUTED',outcome:'UNKNOWN',reason:'UNKNOWN_API_VERSION',routeEvidence:ev,routeEvidenceDigest:ev.routeEvidenceDigest});
 if(x.queryType!==r.queryType)return deepFreeze({status:'NOT_ROUTED',outcome:'UNKNOWN',reason:'QUERY_CAPABILITY_MISMATCH',routeEvidence:ev,routeEvidenceDigest:ev.routeEvidenceDigest});
 if(r.state!=='PROMOTED')return deepFreeze({status:'NOT_ROUTED',outcome:'UNKNOWN',reason:'NON_PROMOTED_CAPABILITY',routeEvidence:ev,routeEvidenceDigest:ev.routeEvidenceDigest});
 const body={capability:x.capability,routeState:r.state,apiVersion:r.apiVersion,queryType:r.queryType,evaluatorId:r.evaluatorId,routeTableDigest:ROUTE_TABLE.routeTableDigest};return deepFreeze({status:'ROUTED',route:{...body,routeDigest:digest(body)},routeDigest:digest(body)});
}
function validateRouteTable(t=ROUTE_TABLE){if(!t||Object.keys(t.routes||{}).length!==6||!HEX.test(t.routeTableDigest||'')||digest({schemaVersion:t.schemaVersion,routes:t.routes})!==t.routeTableDigest)throw TypeError('INVALID_ROUTE_TABLE');if(Object.values(t.routes).filter(x=>x.state==='PROMOTED').length!==3)throw TypeError('INVALID_PROMOTION_SET');if(Object.keys(t.routes).some(k=>k==='default'||k==='*'))throw TypeError('WILDCARD_ROUTE_FORBIDDEN');return true}
validateRouteTable();
module.exports={ROUTE_TABLE,route,validateRouteTable};
