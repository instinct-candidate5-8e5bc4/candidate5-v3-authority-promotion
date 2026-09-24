'use strict';
// Stage 1 reuses the certified canonical serialization and SHA-256 digest
// read-only. No certified file is modified; this is a plain require.
const { normalize, canonicalBytes, digest } = require('../../clean-runtime/contracts/canonical');

function deepFreeze(v) {
  if (v && typeof v === 'object' && !Object.isFrozen(v)) {
    Object.freeze(v);
    for (const x of Object.values(v)) deepFreeze(x);
  }
  return v;
}

// Seal a plain record: clone, attach a digest over every other field, freeze.
function seal(record, digestField) {
  const body = structuredClone(record);
  delete body[digestField];
  return deepFreeze({ ...body, [digestField]: digest(body) });
}

function verifySeal(record, digestField) {
  if (!record || typeof record !== 'object') return false;
  const body = { ...record };
  const claimed = body[digestField];
  delete body[digestField];
  return typeof claimed === 'string' && digest(body) === claimed;
}

module.exports = { normalize, canonicalBytes, digest, deepFreeze, seal, verifySeal };
