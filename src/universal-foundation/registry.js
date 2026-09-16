'use strict';
const {digest}=require('./canonical');
const STATUSES=new Set(['IMPLEMENTED_VERIFIED_FOR_SCOPE','CONTRACT_ONLY','UNSUPPORTED','UNKNOWN']);
function capability(x){if(!/^capability\.[a-z0-9._-]+$/.test(x.capabilityId)||!Number.isInteger(x.revision)||!STATUSES.has(x.status)||!Array.isArray(x.scope)||!Array.isArray(x.evidenceRefs)||!Array.isArray(x.limitations))throw TypeError('INVALID_CAPABILITY');const y=structuredClone(x);y.digest=digest(y,'digest');return Object.freeze(y)}
function semanticDefinition(x){if(!/^(scene|entity|event|role|posture|gesture)\.[a-z0-9._-]+$/.test(x.semanticId)||!Array.isArray(x.components)||!Array.isArray(x.capabilityRefs))throw TypeError('INVALID_SEMANTIC_DEFINITION');const y=structuredClone(x);y.digest=digest(y,'digest');return Object.freeze(y)}
function component(x){if(!/^component\.[a-z0-9._-]+$/.test(x.componentTypeId)||!x.componentId)throw TypeError('INVALID_COMPONENT');return Object.freeze({...structuredClone(x),digest:digest(x,'digest')})}
module.exports={STATUSES,capability,semanticDefinition,component};
