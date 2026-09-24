'use strict';
const { seal, verifySeal } = require('./canonical');

// ClinicalObservation contract. The ONLY way a clinical finding reaches the
// player: produced by a performed examination, bound to the clinical state
// revision it was derived from.
function createClinicalObservation({ observationId, patientId, examId, region, finding, simTimeMs, sourceClinicalRevision, sourceClinicalDigest }) {
  if (!observationId || !patientId || !examId || !finding) throw new TypeError('OBSERVATION_INVALID');
  if (!Number.isInteger(simTimeMs) || !Number.isInteger(sourceClinicalRevision) || !sourceClinicalDigest) throw new TypeError('OBSERVATION_BINDING_INVALID');
  return seal({ observationId, patientId, examId, region: region || null, finding, simTimeMs, sourceClinicalRevision, sourceClinicalDigest }, 'observationDigest');
}

module.exports = { createClinicalObservation, verifyObservation: (o) => verifySeal(o, 'observationDigest') };
