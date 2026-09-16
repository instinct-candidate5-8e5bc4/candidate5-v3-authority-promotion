'use strict';
const {digest}=require('./canonical');
const DOMAINS=new Set(['SEMANTIC','PHYSICAL','ENVIRONMENT','HAZARD','CONSTRAINT','CLINICAL','PRESENTATION','ACCESSIBILITY','EVALUATION','VISUAL','SCENARIO','PROGRESSION','EVENT']);
function ref({domain,kind,id,schemaVersion,revision,digest:d}){const x={refVersion:'1.0.0',domain,kind,id,schemaVersion,revision,digest:d};if(!DOMAINS.has(domain)||!kind||!/^[a-z0-9][a-z0-9._:/-]*$/.test(id)||!/^\d+\.\d+\.\d+$/.test(schemaVersion)||!Number.isInteger(revision)||revision<1||!/^[a-f0-9]{64}$/.test(d))throw TypeError('INVALID_CANONICAL_REF');return Object.freeze(x)}
function matches(r,target){return !!r&&!!target&&r.domain===target.domain&&r.kind===target.kind&&r.id===target.id&&r.schemaVersion===target.schemaVersion&&r.revision===target.revision&&r.digest===target.digest}
function requireMatch(r,target){if(!matches(r,target))throw Error('STALE_MISSING_OR_MISMATCHED_REF');return true}
function stateRoot({domain,stateId,schemaVersion,revision,priorDigest=null,provenance,authorityId,data,eventSequence=0}){if(!DOMAINS.has(domain)||!stateId||!authorityId||!provenance)throw TypeError('INVALID_STATE_ROOT');const x={domain,stateId,schemaVersion,revision,priorDigest,provenance,authorityId,eventSequence,data};x.digest=digest(x);return Object.freeze(x)}
module.exports={DOMAINS,ref,matches,requireMatch,stateRoot};
