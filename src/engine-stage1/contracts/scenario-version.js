'use strict';
const { seal, verifySeal } = require('./canonical');

// ScenarioVersion contract. Binds one scenario to: the exact certified scene
// package, the protocol version, the patient (male only), NPC roster (male
// only), patient knowledge, initial clinical facts, initial inventory, and the
// synthetic reach rule. A run is always bound to one ScenarioVersion digest.
const FORBIDDEN_CONTENT = Object.freeze(['childbirth', 'labor', 'לידה']);

function assertMale(person, where) {
  if (!person || person.sex !== 'MALE') throw new TypeError('MALE_ONLY_VIOLATION:' + where);
}

function createScenarioVersion(input) {
  const s = structuredClone(input || {});
  if (!s.scenarioId || !s.version) throw new TypeError('SCENARIO_ID_AND_VERSION_REQUIRED');
  if (!s.sceneRef || !s.sceneRef.scenePackageDigest || !s.sceneRef.casualtyBodyDigest) throw new TypeError('SCENARIO_SCENE_REF_REQUIRED');
  if (!s.protocolRef || !s.protocolRef.protocolDigest) throw new TypeError('SCENARIO_PROTOCOL_REF_REQUIRED');
  assertMale(s.patient, 'patient');
  if (s.sceneRef.casualtySubjectSex !== 'MALE') throw new TypeError('MALE_ONLY_VIOLATION:sceneCasualty');
  for (const [i, n] of (s.npcs || []).entries()) assertMale(n, 'npc' + i);
  if (!Array.isArray(s.patient.namePool) || !s.patient.namePool.length) throw new TypeError('SCENARIO_NAME_POOL_REQUIRED');
  const text = JSON.stringify(s).toLowerCase();
  if (FORBIDDEN_CONTENT.some((w) => text.includes(w))) throw new TypeError('FORBIDDEN_SCENARIO_CONTENT');
  if (!s.initialClinicalFacts || !s.patientKnowledge || !Array.isArray(s.initialInventory)) throw new TypeError('SCENARIO_CONTENT_INCOMPLETE');
  if (!Number.isInteger(s.reachRule?.maxDistanceMicrounits)) throw new TypeError('SCENARIO_REACH_RULE_REQUIRED');
  if (s.contentStatus !== 'SYNTHETIC_NOT_CLINICAL') throw new TypeError('STAGE1_SCENARIO_MUST_BE_SYNTHETIC');
  return seal(s, 'scenarioDigest');
}

module.exports = { createScenarioVersion, verifyScenarioVersion: (s) => verifySeal(s, 'scenarioDigest') };
