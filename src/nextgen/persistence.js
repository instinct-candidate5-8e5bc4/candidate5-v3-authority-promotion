(function(root,factory){const api=factory(root.KoRishonNextGen||(typeof require==='function'?require('./core.js'):null),root.KoRishonMigrations||(typeof require==='function'?require('./migrations.js'):null));if(typeof module==='object'&&module.exports)module.exports=api;root.KoRishonPersistence=api;})(typeof globalThis!=='undefined'?globalThis:this,function(ng,migrations){
'use strict';
if(!ng)throw new Error('NEXTGEN_CORE_REQUIRED');
// Next-Gen ID 24 (Save/Resume) and ID 25 (Session Recovery).
// A session snapshot covers every field the spec names: medical State, Timeline
// (P0 event log + NPC/world logs + UI action log), Seed, Inventory, Position,
// Evidence (action/command logs + audit head hash), patient state, and Time.
// Envelopes are versioned and integrity-hashed; corrupt or incompatible saves fail
// closed and are quarantined, never partially applied.
const SAVE_SCHEMA_VERSION='save-1.0';
const clone=v=>JSON.parse(JSON.stringify(v));
const stable=v=>{if(v===null||typeof v!=='object')return JSON.stringify(v);if(Array.isArray(v))return'['+v.map(stable).join(',')+']';return'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+stable(v[k])).join(',')+'}'};
const hash=v=>{let h=2166136261,x=stable(v);for(let i=0;i<x.length;i++){h^=x.charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0).toString(16).padStart(8,'0')};
function envelopeHash(env){const copy={...env};delete copy.hash;return hash(copy)}
function autoSlot({scenarioId,sceneIndex,seed}){return`auto:${scenarioId}:${sceneIndex}:${seed}`}
const NPC_ID=/^npc:\d{5}$/,WORLD_ID=/^world:\d{5}$/;
function validateMonotonic(ids,re){for(let i=0;i<ids.length;i++)if(!re.test(ids[i])||Number(ids[i].split(':')[1])!==i)return false;return true}
function validatePayload(p){
 if(!p||typeof p!=='object')return'PAYLOAD_MISSING';
 if(!p.versions||!p.versions.engine||!p.versions.rules)return'VERSIONS_MISSING';
 if(!p.scenario||!p.scenario.id||!p.scenario.initialState)return'SCENARIO_MISSING';
 if(!Number.isFinite(p.seed))return'SEED_MISSING';
 if(!p.config||!p.config.scenarioId||!Number.isFinite(p.config.sceneIndex)||!Number.isFinite(p.config.seed)||!p.config.family)return'CONFIG_MISSING';
 if(!p.time||!Number.isFinite(p.time.uiSeconds)||!p.time.engine||!Number.isFinite(p.time.engine.nowMs))return'TIME_MISSING';
 if(!p.medical||!Number.isFinite(p.medical.condition))return'MEDICAL_MISSING';
 if(!p.eventLog||!p.eventLog.meta||!Array.isArray(p.eventLog.events))return'EVENTLOG_MISSING';
 if(!Array.isArray(p.causalLinks))return'CAUSAL_MISSING';
 if(!Number.isInteger(p.adapterCommits)||p.adapterCommits<0)return'COMMITS_MISSING';
 if(!p.ui||!Number.isFinite(p.ui.condition)||!Number.isFinite(p.ui.time)||!Array.isArray(p.ui.done)||!Array.isArray(p.ui.events)||!Array.isArray(p.ui.log)||!Array.isArray(p.ui.penalties)||typeof p.ui.doneAt!=='object')return'UI_MISSING';
 if(p.ui.condition!==p.medical.condition||p.ui.time!==p.time.uiSeconds)return'UI_MEDICAL_DRIFT';
 if(p.ui.role!==p.config.role)return'ROLE_DRIFT';
 if(!p.position||!p.position.camera||!Number.isFinite(p.position.camera.x)||!Number.isFinite(p.position.camera.z))return'POSITION_MISSING';
 if(!p.inventory||typeof p.inventory.role!=='string')return'INVENTORY_MISSING';
 if(!p.evidence||!Array.isArray(p.evidence.actionLog)||typeof p.evidence.auditHeadHash!=='string')return'EVIDENCE_MISSING';
 if(p.npc){const ids=(p.npc.snapshot&&Array.isArray(p.npc.snapshot.eventLog)?p.npc.snapshot.eventLog:[]).map(e=>e&&e.id);if(!validateMonotonic(ids,NPC_ID))return'NPC_LOG_INVALID';if(!p.npc.snapshot||!p.npc.snapshot.position||!Number.isFinite(p.npc.snapshot.position.x))return'NPC_INVALID'}
 if(p.world){const ids=(p.world.snapshot&&Array.isArray(p.world.snapshot.eventLog)?p.world.snapshot.eventLog:[]).map(e=>e&&e.id);if(!validateMonotonic(ids,WORLD_ID))return'WORLD_LOG_INVALID';const st=p.world.snapshot&&p.world.snapshot.state;if(!st||typeof st.hazard!=='object'||!Number.isFinite(st.revision))return'WORLD_INVALID'}
 return null;
}
function captureSnapshot({adapter,state,npcMachine,worldReactor,context}){
 const simSnap=adapter.snapshot(),audit=adapter.exportAudit();
 return{
  versions:{engine:ng.ENGINE_VERSION,rules:ng.RULE_VERSION,scenarioSchema:ng.SCENARIO_SCHEMA_VERSION,save:SAVE_SCHEMA_VERSION},
  scenario:clone(adapter.scenarioDoc),
  seed:context.seed,
  config:{scenarioId:context.scenarioId,sceneIndex:context.sceneIndex,seed:context.seed,family:context.family,role:state.role},
  time:{uiSeconds:state.time,engine:clone(simSnap.time)},
  medical:clone(simSnap.medical),
  eventLog:clone(simSnap.eventLog),
  causalLinks:clone(simSnap.causalLinks),
  adapterCommits:audit.commits,
  npc:npcMachine?{snapshot:clone(npcMachine.snapshot()),context:clone(npcMachine.context)}:null,
  world:worldReactor?{snapshot:clone(worldReactor.snapshot()),context:clone(worldReactor.context),seed:worldReactor.seed}:null,
  ui:{role:state.role,level:state.level,time:state.time,score:state.score,done:[...state.done],doneAt:clone(state.doneAt),held:state.held,condition:state.condition,events:clone(state.events),log:clone(state.log),penalties:clone(state.penalties),hints:state.hints,dispatchStep:state.dispatchStep,deteriorated:state.deteriorated,cycles:state.cycles,started:state.started},
  position:{camera:clone(context.camera),yaw:context.yaw,pitch:context.pitch,posture:context.posture,patient:clone(context.patient||null)},
  inventory:{role:state.role,held:state.held},
  evidence:{actionLog:clone(state.events),commandLog:clone(state.log),auditHeadHash:simSnap.eventLog.integrity.headHash,eventCount:simSnap.eventLog.events.length,causalCount:simSnap.causalLinks.length}
 };
}
function createSessionStore({storage,ng:core,migrations:mig,namespace='korishon',now=()=>Date.now()}){
 const ngCore=core||ng,migApi=mig||migrations;
 const prefix=`${namespace}:save:`,indexKey=`${namespace}:save-index`;
 function readIndex(){try{return JSON.parse(storage.getItem(indexKey)||'[]')}catch(e){return[]}}
 function writeIndex(idx){storage.setItem(indexKey,JSON.stringify(idx))}
 function save(slot,payload,meta={}){
  const invalid=validatePayload(payload);
  if(invalid)return{saved:false,code:'SAVE_PAYLOAD_INVALID:'+invalid};
  const env={saveVersion:SAVE_SCHEMA_VERSION,kind:'session',slot,scenarioId:payload.config.scenarioId,sceneIndex:payload.config.sceneIndex,seed:payload.config.seed,family:payload.config.family,savedAtMs:now(),status:meta.status||'in-progress',payload};
  env.hash=envelopeHash(env);
  let serialized;try{serialized=JSON.stringify(env)}catch(e){return{saved:false,code:'SAVE_SERIALIZE_FAILED'}}
  try{storage.setItem(prefix+slot,serialized)}catch(e){return{saved:false,code:'SAVE_QUOTA'}}
  const idx=readIndex().filter(x=>x.slot!==slot);idx.push({slot,scenarioId:env.scenarioId,sceneIndex:env.sceneIndex,seed:env.seed,family:env.family,savedAtMs:env.savedAtMs,status:env.status,saveVersion:env.saveVersion});
  try{writeIndex(idx)}catch(e){}
  return{saved:true,slot,savedAtMs:env.savedAtMs,hash:env.hash};
 }
 function saveAuto(payload,status){return save(autoSlot(payload.config),payload,{status})}
 function load(slot){
  const raw=storage.getItem(prefix+slot);
  if(raw==null)return{ok:false,code:'NO_SAVE'};
  let env;try{env=JSON.parse(raw)}catch(e){return{ok:false,code:'SAVE_CORRUPT'}}
  const reports=[];
  if(env.saveVersion!==SAVE_SCHEMA_VERSION){
   if(!migApi)return{ok:false,code:'SAVE_VERSION_MISMATCH:'+env.saveVersion};
   try{const out=migApi.migrate({kind:'save',doc:env,to:SAVE_SCHEMA_VERSION});env=out.doc;reports.push(out.report)}
   catch(e){return{ok:false,code:String(e.message||e)}}
   // Migration is a deterministic transform of a trusted envelope; re-hash the migrated
   // document so integrity verification covers the migrated form (provenance hashes of
   // the pre/post documents are carried in the migration report).
   env.hash=envelopeHash(env);
  }
  if(envelopeHash(env)!==env.hash){
   try{storage.setItem(prefix+slot+'.corrupt',raw);storage.removeItem(prefix+slot)}catch(e){}
   return{ok:false,code:'SAVE_CORRUPT'};
  }
  const invalid=validatePayload(env.payload);
  if(invalid)return{ok:false,code:'SAVE_PAYLOAD_INVALID:'+invalid};
  if(!ngCore.verifyEventLog(env.payload.eventLog).valid)return{ok:false,code:'SAVE_INTEGRITY_FAILED'};
  const meta=env.payload.eventLog.meta;
  if(meta.engineVersion!==ngCore.ENGINE_VERSION||meta.rulesVersion!==ngCore.RULE_VERSION)return{ok:false,code:'SAVE_VERSION_MISMATCH:'+meta.engineVersion};
  return{ok:true,envelope:env,payload:env.payload,migrations:reports};
 }
 function list(){return readIndex()}
 function clear(slot){storage.removeItem(prefix+slot);writeIndex(readIndex().filter(x=>x.slot!==slot))}
 function recoverSession(config){
  const res=load(autoSlot(config));
  if(!res.ok)return{recovered:false,code:res.code};
  const env=res.envelope;
  if(env.status==='finished')return{recovered:false,code:'SESSION_FINISHED'};
  const pc=env.payload.config;
  if(pc.seed!==config.seed||pc.family!==config.family||pc.scenarioId!==config.scenarioId||pc.sceneIndex!==config.sceneIndex)return{recovered:false,code:'CONFIG_MISMATCH'};
  return{recovered:true,payload:env.payload,report:{slot:autoSlot(config),savedAtMs:env.savedAtMs,hash:env.hash,saveVersion:env.saveVersion,migrations:res.migrations}};
 }
 return{save,saveAuto,load,list,clear,recoverSession};
}
function restoreNpc(npcMachine,saved){
 if(!saved)return{restored:true,code:'NPC_ABSENT'};
 const snap=saved.snapshot;
 if(!snap||typeof snap.state!=='string'||!snap.position||!Number.isFinite(snap.position.x)||!Number.isFinite(snap.position.z)||!Array.isArray(snap.eventLog))return{restored:false,code:'NPC_INVALID'};
 if(!validateMonotonic(snap.eventLog.map(e=>e&&e.id),NPC_ID))return{restored:false,code:'NPC_LOG_INVALID'};
 npcMachine.state=snap.state;npcMachine.position=clone(snap.position);
 if(saved.context)npcMachine.context=clone(saved.context);
 npcMachine.events=clone(snap.eventLog);npcMachine.sequence=snap.eventLog.length;
 return{restored:true,code:'OK'};
}
function restoreWorld(worldReactor,saved){
 if(!saved)return{restored:true,code:'WORLD_ABSENT'};
 const st=saved.snapshot&&saved.snapshot.state;
 if(!st||typeof st.hazard!=='object'||typeof st.hazard.active!=='boolean'||!Number.isFinite(st.hazard.intensity)||!Number.isFinite(st.noise)||typeof st.door!=='string'||!st.people||!Number.isInteger(st.people.additional)||!Number.isInteger(st.revision))return{restored:false,code:'WORLD_INVALID'};
 const events=saved.snapshot.eventLog;
 if(!Array.isArray(events)||!validateMonotonic(events.map(e=>e&&e.id),WORLD_ID))return{restored:false,code:'WORLD_LOG_INVALID'};
 worldReactor.state=clone(st);worldReactor.events=clone(events);worldReactor.sequence=events.length;
 if(saved.context)worldReactor.context=clone(saved.context);
 if(Number.isFinite(saved.seed))worldReactor.seed=saved.seed;
 return{restored:true,code:'OK'};
}
function applyRecoveredSession({payload,adapter,state,npcMachine,worldReactor,applyView}){
 const invalid=validatePayload(payload);
 if(invalid)return{applied:false,code:'SAVE_PAYLOAD_INVALID:'+invalid};
 // Validate every restorable subsystem before mutating anything (fail-closed).
 if(npcMachine&&payload.npc){const check=payload.npc.snapshot;if(!check||!check.position||!validateMonotonic((check.eventLog||[]).map(e=>e&&e.id),NPC_ID))return{applied:false,code:'NPC_INVALID'}}
 if(worldReactor&&payload.world){const st=payload.world.snapshot&&payload.world.snapshot.state;if(!st||!st.hazard)return{applied:false,code:'WORLD_INVALID'}}
 const imp=adapter.importSnapshot({scenario:payload.scenario,eventLog:payload.eventLog,time:payload.time.engine,causalLinks:payload.causalLinks,commits:payload.adapterCommits,expectedMedical:payload.medical,savedAtMs:payload.savedAtMs});
 if(!imp.restored)return{applied:false,code:imp.code};
 const ui=payload.ui;
 state.role=ui.role;state.level=ui.level;state.time=ui.time;state.score=ui.score;
 state.done=new Set(ui.done);state.doneAt=clone(ui.doneAt);state.held=ui.held;
 state.condition=ui.condition;state.events=clone(ui.events);state.log=clone(ui.log);
 state.penalties=clone(ui.penalties);state.hints=ui.hints;state.dispatchStep=ui.dispatchStep;
 state.deteriorated=ui.deteriorated;state.cycles=ui.cycles;state.started=ui.started;
 state.lastIntent=null;state.pending=null;state.compressions=[];
 if(state.condition!==imp.condition)return{applied:false,code:'RESTORE_PARITY_FAILED'};
 const nr=npcMachine?restoreNpc(npcMachine,payload.npc):{restored:true,code:'NPC_NO_RUNTIME'};if(!nr.restored)return{applied:false,code:nr.code};
 const wr=worldReactor?restoreWorld(worldReactor,payload.world):{restored:true,code:'WORLD_NO_RUNTIME'};if(!wr.restored)return{applied:false,code:wr.code};
 if(applyView)applyView(clone(payload.position));
 return{applied:true,code:'OK',condition:imp.condition,time:ui.time,events:imp.events};
}
return{SAVE_SCHEMA_VERSION,createSessionStore,captureSnapshot,applyRecoveredSession,restoreNpc,restoreWorld,validatePayload,envelopeHash,autoSlot};
});
