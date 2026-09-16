(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.KoRishonNextGen=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const ENGINE_VERSION='4.0.0-p0.2',RULE_VERSION='clinical-p0.2',SCENARIO_SCHEMA_VERSION='scenario-p0.2';
const clone=v=>JSON.parse(JSON.stringify(v));
const stable=v=>{if(v===null||typeof v!=='object')return JSON.stringify(v);if(Array.isArray(v))return'['+v.map(stable).join(',')+']';return'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+stable(v[k])).join(',')+'}'};
const hash=v=>{let h=2166136261,x=stable(v);for(let i=0;i<x.length;i++){h^=x.charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0).toString(16).padStart(8,'0')};
function invariant(ok,msg){if(!ok)throw new Error(msg)}
class TimeEngine{constructor(startMs=0){invariant(Number.isFinite(startMs),'TIME_INVALID');this.nowMs=startMs;this.queue=[]}schedule(event){invariant(event&&Number.isFinite(event.atMs)&&event.atMs>=this.nowMs,'SCHEDULE_INVALID');this.queue.push(clone(event));this.queue.sort((a,b)=>a.atMs-b.atMs||String(a.id).localeCompare(String(b.id)));return event.id}advanceTo(targetMs,dispatch){invariant(Number.isFinite(targetMs)&&targetMs>=this.nowMs,'TIME_REWIND');while(this.queue[0]&&this.queue[0].atMs<=targetMs){const e=this.queue.shift();this.nowMs=e.atMs;dispatch(clone(e))}this.nowMs=targetMs;return this.nowMs}snapshot(){return{nowMs:this.nowMs,queue:clone(this.queue)}}}
class EventLog{constructor(meta){this.meta=Object.freeze({...clone(meta)});this.events=[]}append(input){const previous=this.events[this.events.length-1],base={...clone(input),sequence:this.events.length,previousId:previous?previous.id:null,previousHash:previous?previous.hash:null};invariant(base.id&&Number.isFinite(base.timeMs)&&base.type,'EVENT_INVALID');invariant(!this.events.some(x=>x.id===base.id),'EVENT_DUPLICATE');invariant(!previous||base.timeMs>=previous.timeMs,'EVENT_TIME_REWIND');const e=Object.freeze({...base,hash:hash(base)});this.events.push(e);return e}verify(){let previous=null;for(let i=0;i<this.events.length;i++){const e=this.events[i],copy={...clone(e)};delete copy.hash;if(e.sequence!==i||e.previousId!==(previous?previous.id:null)||e.previousHash!==(previous?previous.hash:null)||e.hash!==hash(copy))return{valid:false,index:i,code:'EVENT_CHAIN_INVALID'};previous=e}return{valid:true,count:this.events.length,headHash:previous?previous.hash:null}}export(){return{meta:clone(this.meta),events:clone(this.events),integrity:this.verify()}}}
class CausalEngine{constructor(){this.links=[]}record({causeEventId,effectEventId,ruleId,explanation}){invariant(causeEventId&&effectEventId&&ruleId,'CAUSE_INVALID');const link=Object.freeze({causeEventId,effectEventId,ruleId,explanation:String(explanation||'')});this.links.push(link);return link}explain(effectEventId){return this.links.filter(x=>x.effectEventId===effectEventId).map(clone)}}
class MedicalStateMachine{constructor(initialState,definition){this.state=clone(initialState);this.definition=definition;this.validate(this.state)}validate(s){invariant(s&&Number.isFinite(s.condition)&&s.condition>=0&&s.condition<=100,'STATE_CONDITION_INVALID');invariant(s.consciousness&&s.breathing&&s.perfusion,'STATE_REQUIRED_FIELD');return true}apply(effect,context){invariant(effect&&effect.kind,'EFFECT_INVALID');const before=clone(this.state),rule=this.definition.effects[effect.kind];invariant(typeof rule==='function','EFFECT_NOT_ALLOWED');const next=rule(clone(this.state),clone(effect),clone(context||{}));this.validate(next);this.state=next;return{before,after:clone(next)}}snapshot(){return clone(this.state)}}
class SafetyFirewall{constructor({permissions={},rules={}}={}){this.permissions=permissions;this.rules=rules}evaluate(request,context,state){if(!request||!request.intent)return{allowed:false,code:'INTENT_MISSING'};const allowed=this.permissions[context.role]||[];if(!allowed.includes(request.intent))return{allowed:false,code:'PERMISSION_DENIED'};const rule=this.rules[request.intent];if(!rule)return{allowed:false,code:'RULE_MISSING'};const result=rule({request:clone(request),context:clone(context),state:clone(state)});return result===true?{allowed:true,code:'OK'}:{allowed:false,code:(result&&result.code)||'PREREQUISITE_FAILED'}}}
class ScenarioValidator{validate(s){const errors=[];for(const k of['id','version','initialState','rulesVersion'])if(s[k]===undefined||s[k]===null||s[k]==='')errors.push('MISSING_'+k.toUpperCase());if(s.initialState){try{new MedicalStateMachine(s.initialState,defaultDefinition())}catch(e){errors.push(e.message)}}if(s.rulesVersion!==RULE_VERSION)errors.push('RULE_VERSION_UNSUPPORTED');return{valid:errors.length===0,errors}}}
function defaultDefinition(){return{effects:{conditionDelta:(s,e)=>({...s,condition:Math.max(0,Math.min(100,s.condition+e.value))}),setBreathing:(s,e)=>({...s,breathing:e.value}),setConsciousness:(s,e)=>({...s,consciousness:e.value}),setPerfusion:(s,e)=>({...s,perfusion:e.value})}}}
function buildFacade({scenario,seed,time,log,causes,medical,firewall,startCounter,initialEvents}){
 let counter=startCounter;
 function append(type,payload={}){return log.append({id:`${scenario.id}:${String(counter++).padStart(6,'0')}`,timeMs:time.nowMs,type,payload:clone(payload),state:medical.snapshot()})}
 for(const [type,payload] of initialEvents)append(type,payload);
 return{versions:{engine:ENGINE_VERSION,rules:RULE_VERSION,scenarioSchema:SCENARIO_SCHEMA_VERSION},time,log,causes,medical,firewall,dispatch(request,context={}){const gate=firewall.evaluate(request,context,medical.snapshot());const intentEvent=append('intent.received',{request,gate});if(!gate.allowed){append('action.blocked',{intentEventId:intentEvent.id,code:gate.code});return{executed:false,gate}}const effect=request.effect;if(!effect)return{executed:true,gate,event:intentEvent};const tx=medical.apply(effect,context);const effectEvent=append('medical.state.changed',{effect,before:tx.before,after:tx.after});causes.record({causeEventId:intentEvent.id,effectEventId:effectEvent.id,ruleId:request.ruleId||request.intent,explanation:request.explanation||request.intent});return{executed:true,gate,event:effectEvent,state:medical.snapshot()}},advanceTo(ms){time.advanceTo(ms,e=>{const source=append('time.triggered',e);if(e.effect){const tx=medical.apply(e.effect,{source:'time'}),out=append('medical.state.changed',{effect:e.effect,before:tx.before,after:tx.after});causes.record({causeEventId:source.id,effectEventId:out.id,ruleId:e.ruleId||'scheduled',explanation:e.explanation||'scheduled effect'})}});return medical.snapshot()},snapshot(){return{time:time.snapshot(),medical:medical.snapshot(),eventLog:log.export(),causalLinks:clone(causes.links)}}};
}
function createSimulation(config){
 const scenario=clone(config.scenario),validation=new ScenarioValidator().validate(scenario);
 invariant(validation.valid,'SCENARIO_INVALID:'+validation.errors.join(','));
 return buildFacade({scenario,seed:config.seed,time:new TimeEngine(config.startMs||0),log:new EventLog({engineVersion:ENGINE_VERSION,rulesVersion:RULE_VERSION,scenarioVersion:scenario.version,scenarioId:scenario.id,seed:config.seed}),causes:new CausalEngine(),medical:new MedicalStateMachine(scenario.initialState,config.definition||defaultDefinition()),firewall:new SafetyFirewall(config.firewall),startCounter:0,initialEvents:[['simulation.started',{seed:config.seed}]]});
}
function importSimulation(config){
 // Next-Gen IDs 24/25: restore a persisted simulation without breaking P0 invariants.
 // The EventLog stays append-only (verified as a whole, then extended only through the
 // facade), and the medical state is re-derived by replaying every recorded effect
 // through a fresh MedicalStateMachine, so the state machine remains the only writer.
 invariant(config&&config.scenario&&config.eventLog,'IMPORT_CONFIG_INVALID');
 const scenario=clone(config.scenario),validation=new ScenarioValidator().validate(scenario);
 invariant(validation.valid,'SCENARIO_INVALID:'+validation.errors.join(','));
 const eventLog=config.eventLog;
 invariant(eventLog.meta,'IMPORT_LOG_MISSING');
 invariant(eventLog.meta.seed===config.seed,'IMPORT_SEED_MISMATCH');
 invariant(eventLog.meta.engineVersion===ENGINE_VERSION&&eventLog.meta.rulesVersion===RULE_VERSION&&eventLog.meta.scenarioVersion===scenario.version&&eventLog.meta.scenarioId===scenario.id,'IMPORT_VERSION_MISMATCH');
 invariant(verifyEventLog(eventLog).valid,'IMPORT_INTEGRITY_FAILED');
 invariant(config.time&&Number.isFinite(config.time.nowMs)&&config.time.nowMs>=0,'IMPORT_TIME_INVALID');
 const time=new TimeEngine(config.time.nowMs);
 const queue=(Array.isArray(config.time.queue)?config.time.queue:[]).map(clone);
 for(const e of queue)invariant(e&&e.id&&Number.isFinite(e.atMs)&&e.atMs>=time.nowMs,'IMPORT_QUEUE_INVALID');
 time.queue=queue;time.queue.sort((a,b)=>a.atMs-b.atMs||String(a.id).localeCompare(String(b.id)));
 const log=new EventLog(clone(eventLog.meta));log.events=clone(eventLog.events);
 invariant(log.verify().valid,'IMPORT_INTEGRITY_FAILED');
 const medical=new MedicalStateMachine(scenario.initialState,config.definition||defaultDefinition());
 for(const e of log.events){if(e.type==='medical.state.changed')medical.apply(e.payload.effect,{import:true});invariant(stable(medical.snapshot())===stable(e.state),'IMPORT_STATE_DIVERGENCE:'+e.id)}
 const causes=new CausalEngine();
 for(const link of(config.causalLinks||[])){invariant(link&&link.causeEventId&&link.effectEventId&&link.ruleId,'IMPORT_CAUSE_INVALID');invariant(log.events.some(x=>x.id===link.causeEventId)&&log.events.some(x=>x.id===link.effectEventId),'IMPORT_CAUSE_ORPHAN:'+link.effectEventId);causes.record(link)}
 const head=log.events[log.events.length-1];
 return buildFacade({scenario,seed:config.seed,time,log,causes,medical,firewall:new SafetyFirewall(config.firewall),startCounter:log.events.length,initialEvents:[['simulation.restored',{savedAtMs:Number.isFinite(config.savedAtMs)?config.savedAtMs:null,restoredEvents:log.events.length,headHash:head?head.hash:null}]]});
}
function verifyEventLog(eventLog){const log=new EventLog(eventLog.meta||{});log.events=clone(eventLog.events||[]);return log.verify()}
function replay({scenario,seed,eventLog,definition}){invariant(eventLog&&eventLog.meta,'REPLAY_LOG_MISSING');invariant(eventLog.meta.seed===seed,'REPLAY_SEED_MISMATCH');invariant(eventLog.meta.engineVersion===ENGINE_VERSION&&eventLog.meta.rulesVersion===RULE_VERSION&&eventLog.meta.scenarioVersion===scenario.version&&eventLog.meta.scenarioId===scenario.id,'REPLAY_VERSION_MISMATCH');invariant(verifyEventLog(eventLog).valid,'REPLAY_INTEGRITY_FAILED');const medical=new MedicalStateMachine(scenario.initialState,definition||defaultDefinition());for(const e of eventLog.events)if(e.type==='medical.state.changed')medical.apply(e.payload.effect,{replay:true});return medical.snapshot()}
return{ENGINE_VERSION,RULE_VERSION,SCENARIO_SCHEMA_VERSION,TimeEngine,EventLog,CausalEngine,MedicalStateMachine,SafetyFirewall,ScenarioValidator,createSimulation,importSimulation,replay,verifyEventLog,defaultDefinition};
});
