(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.KoRishonEventBus=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const EVENT_TYPES=Object.freeze(['ACTION_SUBMITTED','STATE_CHANGED','PATIENT_DETERIORATED','HINT_USED','CRITICAL_ERROR','SCENARIO_COMPLETED']);
const clone=v=>v===undefined?undefined:JSON.parse(JSON.stringify(v));
class EventBus{
  constructor({clock=()=>0,allowedTypes=EVENT_TYPES}={}){this.clock=clock;this.allowed=new Set(allowedTypes);this.listeners=new Map();this.history=[];this.sequence=0;this.dispatching=false;this.queue=[]}
  subscribe(type,handler){if(type!=='*'&&!this.allowed.has(type))throw new Error('EVENT_TYPE_UNKNOWN');if(typeof handler!=='function')throw new Error('EVENT_HANDLER_INVALID');const set=this.listeners.get(type)||new Set();set.add(handler);this.listeners.set(type,set);return()=>set.delete(handler)}
  once(type,handler){let off;off=this.subscribe(type,event=>{off();return handler(event)});return off}
  publish(type,payload={},meta={}){if(!this.allowed.has(type))throw new Error('EVENT_TYPE_UNKNOWN');const envelope=Object.freeze({id:`bus:${String(this.sequence).padStart(6,'0')}`,sequence:this.sequence++,timeMs:Number(this.clock()),type,payload:clone(payload),meta:clone(meta)});this.history.push(envelope);this.queue.push(envelope);if(!this.dispatching)this.flush();return clone(envelope)}
  flush(){this.dispatching=true;try{while(this.queue.length){const event=this.queue.shift();const handlers=[...(this.listeners.get(event.type)||[]),...(this.listeners.get('*')||[])];for(const handler of handlers){try{handler(clone(event))}catch(error){if(event.type!=='CRITICAL_ERROR')this.publish('CRITICAL_ERROR',{source:'event-handler',eventId:event.id,code:'EVENT_HANDLER_FAILED',message:String(error&&error.message||error)})}}}}finally{this.dispatching=false}}
  snapshot(){return clone(this.history)}
}
return{EVENT_TYPES,EventBus};
});
