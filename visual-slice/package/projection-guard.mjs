// TRACK B / B-W10 projection guard (PURE - no three.js, no DOM): validates a
// bounded public projection before the renderer touches it. Fail-closed: any
// violation rejects the WHOLE projection with NO visual action. Region and
// clinical semantics stay engine-owned - this guard only checks that every
// requested visual target exists in the allowlists derived from the certified
// scene data and the B-W5 entity-body map.
import {resolveEntity} from '../entity-map.mjs';
export const PROJECTION_KIND='TRACK_B_PUBLIC_PROJECTION';
export const CUES=Object.freeze(['NONE','SYNTHETIC_ACTION_STARTED','SYNTHETIC_ACTION_COMPLETED','SYNTHETIC_ACTION_NO_EFFECT','SYNTHETIC_ACTION_CANCELLED']);
// B-W11 / contract v0.3: use-state presentation codes, valid ONLY for entities
// the binding table binds to a SYNTHETIC_TRAINING map entry. They carry no
// physical authority - they present committed state, never decide it.
export const KNOWN_CONTRACT_VERSIONS=Object.freeze(['0.2','0.3']);
export const USE_STATES=Object.freeze(['AVAILABLE','RESERVED','CONSUMED']);
// Slice-scoped visual allowlists. A code NOT listed here = reject, never a
// best-effort render. Only poses/locations the certified slice actually has.
export const POSE_CODES=Object.freeze({casualty:['SUPINE_FLOOR']});
export const LOCATION_CODES=Object.freeze({bag:['INITIAL','FLOOR_BESIDE_CHAIR'],syntheticUnit:['IN_BAG']});
export const FINDING_TEXT_MAX=500;
function componentAllowlist(layout,group){return (layout[group]||[]).map(g=>g.componentId)}
// -> {ok:true, cue, actions:[...]} | {ok:false, reason}
export function validateProjection(projection,{bindingTable,map,layout}){
 if(!projection||typeof projection!=='object')return{ok:false,reason:'projection is not an object'};
 if(projection.kind!==PROJECTION_KIND)return{ok:false,reason:'kind mismatch'};
 if(typeof projection.contractVersion!=='string'||!projection.contractVersion)return{ok:false,reason:'contractVersion missing'};
 if(!KNOWN_CONTRACT_VERSIONS.includes(projection.contractVersion))return{ok:false,reason:'unknown contractVersion '+JSON.stringify(projection.contractVersion)};
 const cue=projection.cue==null?'NONE':projection.cue;
 if(!CUES.includes(cue))return{ok:false,reason:'unknown cue '+JSON.stringify(cue)};
 if(!bindingTable||typeof bindingTable!=='object')return{ok:false,reason:'no binding table - missing binding = no visual action'};
 if(!Array.isArray(projection.entities))return{ok:false,reason:'entities missing'};
 const actions=[];
 for(const pe of projection.entities){
  if(!pe||typeof pe.publicRef!=='string'||!pe.publicRef)return{ok:false,reason:'entity without publicRef'};
  const entityId=bindingTable[pe.publicRef];
  if(typeof entityId!=='string'||!entityId)return{ok:false,reason:'unbound publicRef - no visual action'};
  const entry=resolveEntity(map,entityId);
  if(!entry)return{ok:false,reason:'publicRef binds to unmapped entity '+entityId+' - no visual action'};
  const group=entry.layoutGroup;
  if(pe.highlightComponentIds!=null){
   if(!Array.isArray(pe.highlightComponentIds))return{ok:false,reason:'highlightComponentIds not an array'};
   const allow=componentAllowlist(layout,group);
   for(const c of pe.highlightComponentIds)if(!allow.includes(c))return{ok:false,reason:'highlight target '+JSON.stringify(c)+' not in certified component allowlist for '+entityId};
   if(pe.highlightComponentIds.length)actions.push({type:'highlight',entityId,componentIds:pe.highlightComponentIds.slice()});
  }
  if(pe.findingText!=null){
   if(typeof pe.findingText!=='string')return{ok:false,reason:'findingText not a string'};
   if(pe.findingText.length>FINDING_TEXT_MAX)return{ok:false,reason:'findingText exceeds '+FINDING_TEXT_MAX+' chars (bounded panel)'};
   if(pe.findingText.length)actions.push({type:'finding',entityId,text:pe.findingText});
  }
  if(pe.visiblePoseCode!=null){
   const allow=POSE_CODES[group]||[];
   if(!allow.includes(pe.visiblePoseCode))return{ok:false,reason:'pose code '+JSON.stringify(pe.visiblePoseCode)+' not in slice allowlist for '+group};
   actions.push({type:'pose',entityId,code:pe.visiblePoseCode});
  }
  if(pe.visibleLocationCode!=null){
   const allow=LOCATION_CODES[group]||[];
   if(!allow.includes(pe.visibleLocationCode))return{ok:false,reason:'location code '+JSON.stringify(pe.visibleLocationCode)+' not in slice allowlist for '+group};
   actions.push({type:'location',entityId,code:pe.visibleLocationCode});
  }
  if(pe.publicUseState!=null){
   if(entry.entryType!=='SYNTHETIC_TRAINING')return{ok:false,reason:'publicUseState on non-synthetic entity '+entityId+' - use-state codes carry no physical authority and never apply to clinical/equipment entities'};
   if(!USE_STATES.includes(pe.publicUseState))return{ok:false,reason:'unknown use state '+JSON.stringify(pe.publicUseState)};
   actions.push({type:'useState',entityId,code:pe.publicUseState});
  }
 }
 return{ok:true,cue,actions}}
