'use strict';
function freeze(x){if(!x||typeof x!=='object'||Object.isFrozen(x))return x;for(const v of Object.values(x))freeze(v);return Object.freeze(x)}
function createAuthorityEnvelope(input){
  if(!input||typeof input!=='object')throw TypeError('INVALID_V3_AUTHORITY_ENVELOPE');
  const required=['definitions','frames','bodies','supportRelations','boundaryFeatures'];
  for(const k of required)if(!input[k]||typeof input[k]!=='object')throw TypeError('MISSING_V3_AUTHORITY_'+k.toUpperCase());
  if(!input.authoritativeGeometryFrameRefs||typeof input.authoritativeGeometryFrameRefs!=='object')throw TypeError('MISSING_V3_AUTHORITY_GEOMETRY_FRAME_REFS');
  const envelope=structuredClone(input);
  envelope.kind='V3_AUTHORITY_ENVELOPE';
  envelope.selfDerivedPinsAllowed=false;
  return freeze(envelope);
}
module.exports={createAuthorityEnvelope};
