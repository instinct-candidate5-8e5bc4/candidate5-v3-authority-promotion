'use strict';
// R1 v4 / BODY IDENTITY SEAM: an admitted, exact binding between a RECOVERED
// runtime physical body (e.g. the certified recovered bag body) and an
// AUTHORED_NEW owner body record used for support-surface/volume ownership.
// Numerical AABB equivalence is not identity equivalence - this record makes
// the equivalence an explicit, validated, digest-pinned, world-revision-bound
// admission instead of a silent replacement. validateRelations accepts an
// ownerBodyRef that differs from the runtime physicalBodyRef ONLY through a
// VALIDATED binding that links exactly those two refs.
const {digest}=require('../contracts/canonical');
let MACHINE_ID_RE;try{MACHINE_ID_RE=require('../authoring/contracts/semantics').MACHINE_ID}catch{MACHINE_ID_RE=/^[a-z0-9][a-z0-9/-]*$/}
const fail=(code,path)=>Object.freeze({status:'REJECTED',failure:Object.freeze({code,path:path||null})});
// recoveredBody: {bodyId,revision,digest,boundsMicrounits} (the runtime record, e.g. SCHOOL_BAG_BODY geometry bounds)
// ownerBody: the VALIDATED AUTHORED_NEW owner body record (validateBody output .definition: bodyDefinitionId/bodyRevision/canonicalDigest/aggregateBoundsMicrounits)
function validateOwnerBodyBinding(raw,{recoveredBody,ownerBody}={}){try{
 if(!raw||raw.schemaVersion!=='1.0.0'||!MACHINE_ID_RE.test(raw.bindingId||'')||!Number.isInteger(raw.bindingRevision)||raw.bindingRevision<1)return fail('MALFORMED_BINDING');
 if(!recoveredBody||!ownerBody)return fail('MISSING_BODY_RECORDS');
 const rr=raw.recoveredBodyRef,or=raw.ownerBodyRef;
 if(!rr||!or||rr.id!==recoveredBody.bodyId||rr.revision!==recoveredBody.revision||rr.digest!==recoveredBody.digest)return fail('STALE_RECOVERED_BODY');
 if(or.id!==ownerBody.bodyDefinitionId||or.revision!==ownerBody.bodyRevision||or.digest!==ownerBody.canonicalDigest)return fail('STALE_OWNER_BODY_RECORD');
 // The equivalence must be PROVEN, not asserted: byte-exact aggregate AABB equality, recomputed from the two records.
 if(JSON.stringify(recoveredBody.boundsMicrounits)!==JSON.stringify(ownerBody.aggregateBounds))return fail('BOUNDS_MISMATCH');
 if(!Number.isInteger(raw.boundWorldRevision)||raw.boundWorldRevision<1)return fail('MALFORMED_BINDING','boundWorldRevision');
 if(!Array.isArray(raw.provenanceRefs)||!raw.provenanceRefs.length)return fail('MISSING_PROVENANCE');
 const binding={schemaVersion:'1.0.0',bindingId:raw.bindingId,bindingRevision:raw.bindingRevision,recoveredBodyRef:Object.freeze({...rr}),ownerBodyRef:Object.freeze({...or}),boundsMicrounits:Object.freeze({...ownerBody.aggregateBounds}),boundWorldRevision:raw.boundWorldRevision,provenanceRefs:Object.freeze([...raw.provenanceRefs])};
 const canonicalDigest=digest(binding,'canonicalDigest');
 return Object.freeze({status:'VALIDATED',binding:Object.freeze({...binding,canonicalDigest})});
}catch(e){return fail(e.code||'MALFORMED_BINDING')}}
module.exports={validateOwnerBodyBinding};
