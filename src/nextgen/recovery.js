(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./event-bus.js'):root.KoRishonEventBus);if(typeof module==='object'&&module.exports)module.exports=api;root.KoRishonRecovery=api;})(typeof globalThis!=='undefined'?globalThis:this,function(busApi){
'use strict';
const FAILURE_KINDS=Object.freeze(['AI','ASSET','ACTION','NETWORK','STORAGE']);
const clone=v=>v===undefined?undefined:JSON.parse(JSON.stringify(v));
class RecoveryManager{
  constructor({eventBus,strategies={}}={}){this.eventBus=eventBus||new busApi.EventBus();this.strategies={...strategies};this.attempts=[]}
  register(kind,strategy){if(!FAILURE_KINDS.includes(kind))throw new Error('RECOVERY_KIND_UNKNOWN');if(typeof strategy!=='function')throw new Error('RECOVERY_STRATEGY_INVALID');this.strategies[kind]=strategy;return this}
  execute(kind,operation,{fallback,rollback,context={}}={}){if(!FAILURE_KINDS.includes(kind))throw new Error('RECOVERY_KIND_UNKNOWN');try{return{ok:true,recovered:false,value:operation()}}catch(error){if(typeof rollback==='function')rollback();const failure={kind,code:error&&error.code||`${kind}_FAILED`,message:String(error&&error.message||error),context:clone(context)};this.eventBus.publish('CRITICAL_ERROR',failure);const strategy=this.strategies[kind]||fallback;if(typeof strategy!=='function'){this.attempts.push({...failure,recovered:false});return{ok:false,recovered:false,error:failure}}try{const value=strategy({error,failure:clone(failure),context:clone(context)});this.attempts.push({...failure,recovered:true});return{ok:true,recovered:true,value,error:failure}}catch(recoveryError){const finalError={...failure,recoveryCode:'RECOVERY_FAILED',recoveryMessage:String(recoveryError&&recoveryError.message||recoveryError)};this.attempts.push({...finalError,recovered:false});return{ok:false,recovered:false,error:finalError}}}}
  snapshot(){return clone(this.attempts)}
}
return{FAILURE_KINDS,RecoveryManager};
});
