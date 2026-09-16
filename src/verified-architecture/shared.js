'use strict';
const {CONTRACT_VERSION,LIFECYCLE_STATES}=require('./contract-version');
const {ValidationError}=require('./validation-result');
const HEX=/^[0-9a-f]{64}$/;
function req(o,keys,gate='P1-G01'){for(const k of keys)if(o?.[k]===undefined)throw new ValidationError(gate,`missing ${k}`);}
function arr(v,k,nonempty=false){if(!Array.isArray(v)||(nonempty&&!v.length))throw new ValidationError('P1-G01',`${k} must be array`);}
function sha(v,k='digest'){if(typeof v!=='string'||!HEX.test(v))throw new ValidationError('P1-G02',`${k} must be lowercase sha256`);}
function ref(v,k='ref'){req(v,['recordId','revision','contentDigest'],'P1-G02');if(!Number.isInteger(v.revision)||v.revision<1)throw new ValidationError('P1-G02',`${k}.revision`);sha(v.contentDigest,`${k}.contentDigest`);return true;}
function envelope(r,type){req(r,['recordId','recordType','schemaVersion','revision','lifecycleState','placementReady','failureReasons']);if(r.recordType!==type||r.schemaVersion!==CONTRACT_VERSION||!Number.isInteger(r.revision)||r.revision<1||!LIFECYCLE_STATES.includes(r.lifecycleState))throw new ValidationError('P1-G01','invalid envelope');if(r.placementReady!==false)throw new ValidationError('P1-G14','placementReady must be literal false');arr(r.failureReasons,'failureReasons');return true;}
function deepFreeze(v){if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))deepFreeze(x);}return v;}
function clone(v){return structuredClone(v);}
module.exports={req,arr,sha,ref,envelope,deepFreeze,clone};
