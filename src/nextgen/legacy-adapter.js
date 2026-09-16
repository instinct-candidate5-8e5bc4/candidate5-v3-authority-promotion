(function(root,factory){const api=factory(root.KoRishonNextGen||(typeof require==='function'?require('./core.js'):null));if(typeof module==='object'&&module.exports)module.exports=api;root.KoRishonLegacyAdapter=api;})(typeof globalThis!=='undefined'?globalThis:this,function(ng){
'use strict';
if(!ng)throw new Error('NEXTGEN_CORE_REQUIRED');
const clamp=n=>Math.max(0,Math.min(100,n));
function createLegacyAdapter({scenarioId,seed,initialState,roles=['first-responder','medic','paramedic']}){
 const permissions=Object.fromEntries(roles.map(role=>[role,['legacyConditionDelta','npcTransition']]));
 const rules={legacyConditionDelta:({request})=>Number.isFinite(request.effect?.value)||{code:'DELTA_INVALID'},npcTransition:({request})=>request.npcEvent&&request.npcEvent.id?true:{code:'NPC_EVENT_INVALID'}};
 const scenarioDoc={id:scenarioId,version:'3.0-active-p0.2',rulesVersion:ng.RULE_VERSION,initialState};
 let sim=ng.createSimulation({scenario:scenarioDoc,seed,firewall:{permissions,rules}});
 let commits=0;
 function recordNpcTransition({event,role='first-responder'}){if(!event||!event.id)return{recorded:false,code:'NPC_EVENT_INVALID'};const result=sim.dispatch({intent:'npcTransition',ruleId:'npc-transition',npcEvent:event,explanation:event.cause},{role});return{recorded:result.executed,code:result.gate.code,eventId:result.event?.id}}
 function commitConditionDelta({current,delta,role,reason}){
  if(!Number.isFinite(current)||!Number.isFinite(delta))return{committed:false,code:'DELTA_INVALID',condition:current};
  const expected=clamp(current+delta),before=sim.medical.snapshot().condition;
  if(before!==current)return{committed:false,code:'LEGACY_CORE_DRIFT',condition:current,coreCondition:before};
  const result=sim.dispatch({intent:'legacyConditionDelta',ruleId:'legacy-condition-delta',effect:{kind:'conditionDelta',value:delta},explanation:reason||'legacy condition delta'},{role});
  if(!result.executed||result.state.condition!==expected)return{committed:false,code:result.gate?.code||'PARITY_FAILED',condition:current,coreCondition:result.state?.condition};
  commits++;return{committed:true,code:'OK',condition:result.state.condition,eventId:result.event.id};
 }
 // Next-Gen IDs 24/25: rebind this adapter to a verified restored simulation.
 // Fail-closed: any integrity, version, seed or medical divergence rejects the import
 // before rebinding, so the live simulation is never half-replaced.
 function importSnapshot(snapshot){
  if(!snapshot||!snapshot.eventLog||!snapshot.time||!snapshot.scenario)return{restored:false,code:'IMPORT_PAYLOAD_MISSING'};
  let restored;
  try{restored=ng.importSimulation({scenario:snapshot.scenario,seed,eventLog:snapshot.eventLog,time:snapshot.time,causalLinks:snapshot.causalLinks,savedAtMs:snapshot.savedAtMs,firewall:{permissions,rules}})}
  catch(e){return{restored:false,code:String(e.message||e)}}
  const stable=v=>{if(v===null||typeof v!=='object')return JSON.stringify(v);if(Array.isArray(v))return'['+v.map(stable).join(',')+']';return'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+stable(v[k])).join(',')+'}'};
  if(snapshot.expectedMedical&&stable(restored.medical.snapshot())!==stable(snapshot.expectedMedical))return{restored:false,code:'ADAPTER_IMPORT_DIVERGENCE'};
  sim=restored;commits=Number.isInteger(snapshot.commits)?snapshot.commits:0;
  return{restored:true,code:'OK',condition:sim.medical.snapshot().condition,events:sim.log.events.length};
 }
 return{versions:sim.versions,scenarioDoc,commitConditionDelta,recordNpcTransition,importSnapshot,snapshot:()=>sim.snapshot(),exportAudit(){const s=sim.snapshot();return{versions:sim.versions,commits,eventLog:s.eventLog,causalLinks:s.causalLinks,medical:s.medical}}};
}
return{createLegacyAdapter};
});
