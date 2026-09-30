// TRACK B / R3 committed-world projection guard (PURE - no three.js, no DOM).
// The root-shell PHYSICAL session route feeds the renderer ONLY committed
// world data through this contract. Inventory, cues, finding text, highlight
// requests and any visual-cue shaping are OUTSIDE this contract by design:
// the whitelist below is exhaustive and any unknown key rejects the WHOLE
// projection with NO visual action (fail-closed). Presentation never invents
// positions/supports/collisions; the renderer applies only what the committed
// world carries, for entities on the explicit apply allowlist.
import {resolveEntity} from '../entity-map.mjs';
import {USE_STATES} from './projection-guard.mjs';
export const COMMITTED_WORLD_KIND='TRACK_B_COMMITTED_WORLD_PROJECTION';
export const COMMITTED_WORLD_CONTRACT_VERSION='1.0';
// Entities the renderer currently applies committed transforms for. Extends
// only by reviewed increments - a committed entity outside this list REJECTS
// the whole projection (loud, never a silent skip).
export const APPLY_ALLOWLIST=Object.freeze(['synthetic-training-unit-v1']);
const TOP_KEYS=Object.freeze(['kind','contractVersion','worldDigest','committedTransactionId','entities']);
const ENTITY_KEYS=Object.freeze(['publicRef','authoritativeTransformMicrounits','publicUseState']);
const TRANSFORM_KEYS=Object.freeze(['positionMicrounits']);
const MAX_ENTITIES=50,MAX_TX=200,MAX_ABS=1e9;
function unknownKeys(obj,allow){return Object.keys(obj).filter(k=>!allow.includes(k))}
// -> {ok:true, worldDigest, transactionId, actions:[...]} | {ok:false, reason}
export function validateCommittedWorldProjection(projection,{bindingTable,map,boundEntities}){
 if(!projection||typeof projection!=='object'||Array.isArray(projection))return{ok:false,reason:'projection is not an object'};
 const uk=unknownKeys(projection,TOP_KEYS);
 if(uk.length)return{ok:false,reason:'unknown projection keys '+JSON.stringify(uk)+' - committed-world contract is whitelist-only (no cues, no inventory, no visual shaping)'};
 if(projection.kind!==COMMITTED_WORLD_KIND)return{ok:false,reason:'kind mismatch - expected '+COMMITTED_WORLD_KIND};
 if(projection.contractVersion!==COMMITTED_WORLD_CONTRACT_VERSION)return{ok:false,reason:'contractVersion mismatch - expected '+COMMITTED_WORLD_CONTRACT_VERSION};
 if(typeof projection.worldDigest!=='string'||!/^[0-9a-f]{64}$/.test(projection.worldDigest))return{ok:false,reason:'worldDigest missing or malformed - committed-world projection must carry the commit digest'};
 if(typeof projection.committedTransactionId!=='string'||!projection.committedTransactionId||projection.committedTransactionId.length>MAX_TX)return{ok:false,reason:'committedTransactionId missing or oversized'};
 if(!bindingTable||typeof bindingTable!=='object')return{ok:false,reason:'no binding table - missing binding = no visual action'};
 if(!Array.isArray(projection.entities)||!projection.entities.length)return{ok:false,reason:'entities missing'};
 if(projection.entities.length>MAX_ENTITIES)return{ok:false,reason:'entities exceeds '+MAX_ENTITIES};
 const actions=[];
 for(const pe of projection.entities){
  if(!pe||typeof pe!=='object'||Array.isArray(pe))return{ok:false,reason:'entity entry is not an object'};
  const ek=unknownKeys(pe,ENTITY_KEYS);
  if(ek.length)return{ok:false,reason:'unknown entity keys '+JSON.stringify(ek)+' on '+(typeof pe.publicRef==='string'?pe.publicRef:'<no publicRef>')+' - no cues/inventory/visual fields in committed-world contract'};
  if(typeof pe.publicRef!=='string'||!pe.publicRef)return{ok:false,reason:'entity without publicRef'};
  const entityId=bindingTable[pe.publicRef];
  if(typeof entityId!=='string'||!entityId)return{ok:false,reason:'unbound publicRef - no visual action'};
  const entry=resolveEntity(map,entityId);
  if(!entry)return{ok:false,reason:'publicRef binds to unmapped entity '+entityId+' - no visual action'};
  if(!APPLY_ALLOWLIST.includes(entityId))return{ok:false,reason:'entity '+entityId+' not on the committed-world apply allowlist ('+APPLY_ALLOWLIST.join(',')+') - allowlist extends only by reviewed increments'};
  if(Array.isArray(boundEntities)&&!boundEntities.includes(entityId))return{ok:false,reason:'entity '+entityId+' not covered by the pinned presentation-manifest binding - unpin = no visual action'};
  if(pe.authoritativeTransformMicrounits!=null){
   if(typeof pe.authoritativeTransformMicrounits!=='object'||Array.isArray(pe.authoritativeTransformMicrounits))return{ok:false,reason:'authoritativeTransformMicrounits is not an object'};
   const tk=unknownKeys(pe.authoritativeTransformMicrounits,TRANSFORM_KEYS);
   if(tk.length)return{ok:false,reason:'unknown transform keys '+JSON.stringify(tk)};
   const p=pe.authoritativeTransformMicrounits.positionMicrounits;
   if(!Array.isArray(p)||p.length!==3||p.some(v=>typeof v!=='number'||!Number.isFinite(v)||Math.abs(v)>MAX_ABS))return{ok:false,reason:'positionMicrounits must be 3 finite numbers within +/-'+MAX_ABS};
   actions.push({type:'committedTransform',entityId,positionMicrounits:p.slice()});
  }
  if(pe.publicUseState!=null){
   if(entry.entryType!=='SYNTHETIC_TRAINING')return{ok:false,reason:'publicUseState on non-synthetic entity '+entityId+' - use-state codes carry no physical authority'};
   if(!USE_STATES.includes(pe.publicUseState))return{ok:false,reason:'unknown use state '+JSON.stringify(pe.publicUseState)};
   actions.push({type:'useState',entityId,code:pe.publicUseState});
  }
 }
 return{ok:true,worldDigest:projection.worldDigest,transactionId:projection.committedTransactionId,actions}}
