'use strict';
// Clinical domain authority (pure). Owns ClinicalState and the observation
// record. All functions return a NEW slice or a rejection; nothing mutates.
// The player-facing view exposes observations only - never raw state.
const { createClinicalState } = require('../contracts/clinical-state');
const { createClinicalObservation } = require('../contracts/clinical-observation');

function init(scenario, protocol) {
  return Object.freeze({
    state: createClinicalState({
      patientId: scenario.patient.patientId,
      revision: 1,
      simTimeMs: 0,
      facts: scenario.initialClinicalFacts,
      protocolRef: { protocolId: protocol.protocolId, version: protocol.version, protocolDigest: protocol.protocolDigest },
    }),
    observations: Object.freeze([]),
  });
}

// Question answering: the patient can only say what is in his knowledge map.
function answerQuestion(scenario, questionId) {
  const line = scenario.patientKnowledge[questionId];
  return line === undefined ? null : line;
}

// Examination: derives a finding from authoritative state for the examined
// region only. Synthetic finding tokens (not medical terms).
function prepareExam(slice, { examId, region, simTimeMs, observationId }) {
  const w = slice.state.facts.syntheticWound;
  let finding;
  if (w && w.region === region) finding = w.covered ? 'SYNTHETIC_WOUND_COVERED' : 'SYNTHETIC_WOUND_PRESENT_UNCOVERED';
  else finding = 'SYNTHETIC_NO_WOUND_FOUND';
  const obs = createClinicalObservation({
    observationId,
    patientId: slice.state.patientId,
    examId,
    region,
    finding,
    simTimeMs,
    sourceClinicalRevision: slice.state.revision,
    sourceClinicalDigest: slice.state.clinicalStateDigest,
  });
  return { slice: Object.freeze({ state: slice.state, observations: Object.freeze([...slice.observations, obs]) }), observation: obs };
}

// Treatment effect: synthetic dressing covers the wound only if applied to
// the wound region. Otherwise accepted but with a negative clinical outcome
// and no state change.
function prepareDressingEffect(slice, { region, simTimeMs }) {
  const w = slice.state.facts.syntheticWound;
  if (!w || w.region !== region || w.covered) {
    return { slice, changed: false, positive: false };
  }
  const facts = { ...structuredClone(slice.state.facts), syntheticWound: { ...w, covered: true } };
  const state = createClinicalState({ patientId: slice.state.patientId, revision: slice.state.revision + 1, simTimeMs, facts, protocolRef: slice.state.protocolRef });
  return {
    slice: Object.freeze({ state, observations: slice.observations }),
    changed: true,
    positive: true,
    before: { revision: slice.state.revision, digest: slice.state.clinicalStateDigest },
    after: { revision: state.revision, digest: state.clinicalStateDigest },
  };
}

function publicView(slice) {
  return slice.observations.map((o) => ({ examId: o.examId, region: o.region, finding: o.finding, simTimeMs: o.simTimeMs }));
}

module.exports = { init, answerQuestion, prepareExam, prepareDressingEffect, publicView };
