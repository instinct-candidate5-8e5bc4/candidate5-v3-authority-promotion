'use strict';
const { seal, verifySeal } = require('./canonical');

// ClinicalState contract. Authoritative per-patient clinical facts. Held only
// by the clinical domain authority; never exposed directly to the player.
// Stage 1 content is SYNTHETIC (see ProtocolVersion) - no real clinical rule.
function createClinicalState({ patientId, revision, simTimeMs, facts, protocolRef }) {
  if (!patientId || !Number.isInteger(revision) || revision < 1) throw new TypeError('CLINICAL_STATE_INVALID');
  if (!Number.isInteger(simTimeMs) || simTimeMs < 0) throw new TypeError('CLINICAL_STATE_TIME_INVALID');
  if (!facts || typeof facts !== 'object') throw new TypeError('CLINICAL_STATE_FACTS_REQUIRED');
  if (!protocolRef || !protocolRef.protocolDigest) throw new TypeError('CLINICAL_STATE_PROTOCOL_REF_REQUIRED');
  return seal({ patientId, revision, simTimeMs, facts, protocolRef }, 'clinicalStateDigest');
}

function verifyClinicalState(s) {
  return verifySeal(s, 'clinicalStateDigest');
}

module.exports = { createClinicalState, verifyClinicalState };
