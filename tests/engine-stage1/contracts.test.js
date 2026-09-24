'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createProtocolVersion, verifyProtocolVersion } = require('../../src/engine-stage1/contracts/protocol-version');
const { createScenarioVersion, verifyScenarioVersion } = require('../../src/engine-stage1/contracts/scenario-version');
const { createEquipmentUnit } = require('../../src/engine-stage1/contracts/equipment-unit');
const { createInventoryTransfer } = require('../../src/engine-stage1/contracts/inventory-transfer');
const { createClockState } = require('../../src/engine-stage1/contracts/simulation-clock');
const { createClinicalState, verifyClinicalState } = require('../../src/engine-stage1/contracts/clinical-state');
const { createIntent } = require('../../src/engine-stage1/contracts/intent');
const { createActionAttempt } = require('../../src/engine-stage1/contracts/action-attempt');
const { RESULT_CODES } = require('../../src/engine-stage1/contracts/result-codes');
const { SCENARIO, PROTOCOL } = require('./helpers');

const baseProtocol = () => ({ protocolId: 'p', version: '1', status: 'SYNTHETIC_NOT_CLINICAL', clinicalUseAllowed: false, source: null, actions: { A: { permittedLevels: ['medic'], durationMs: 0 } } });
const baseScenario = () => {
  const s = structuredClone(SCENARIO);
  delete s.scenarioDigest;
  return s;
};

test('Stage 1 protocol is sealed, synthetic, cites no source and denies clinical use', () => {
  assert.equal(verifyProtocolVersion(PROTOCOL), true);
  assert.equal(PROTOCOL.status, 'SYNTHETIC_NOT_CLINICAL');
  assert.equal(PROTOCOL.source, null);
  assert.equal(PROTOCOL.clinicalUseAllowed, false);
  assert(!JSON.stringify(PROTOCOL).includes('MDA ALS 2024'));
});

test('blanket "MDA ALS 2024" label is refused as a protocol source', () => {
  assert.throws(() => createProtocolVersion({ ...baseProtocol(), status: 'CLINICAL_APPROVED', source: { title: 'MDA ALS 2024', issuer: 'x', documentVersion: '1' }, validity: { from: 'a', until: 'b' }, approval: { approvedBy: 'o', approvedAt: 't' } }), /BLANKET_SOURCE_REFUSED/);
});

test('clinical protocol requires source, version, validity and approval', () => {
  assert.throws(() => createProtocolVersion({ ...baseProtocol(), status: 'CLINICAL_APPROVED', source: null }), /SOURCE_REQUIRED/);
  assert.throws(() => createProtocolVersion({ ...baseProtocol(), status: 'CLINICAL_APPROVED', source: { title: 't', issuer: 'i', documentVersion: 'v' } }), /VALIDITY_REQUIRED/);
  assert.throws(() => createProtocolVersion({ ...baseProtocol(), status: 'CLINICAL_APPROVED', source: { title: 't', issuer: 'i', documentVersion: 'v' }, validity: { from: 'a', until: 'b' } }), /APPROVAL_REQUIRED/);
});

test('synthetic protocol may not cite a source or allow clinical use', () => {
  assert.throws(() => createProtocolVersion({ ...baseProtocol(), source: { title: 't' } }), /MUST_NOT_CITE_SOURCE/);
  assert.throws(() => createProtocolVersion({ ...baseProtocol(), clinicalUseAllowed: true }), /MUST_DENY_CLINICAL_USE/);
});

test('protocol action levels and durations are validated', () => {
  assert.throws(() => createProtocolVersion({ ...baseProtocol(), actions: { A: { permittedLevels: ['nurse'], durationMs: 0 } } }), /LEVELS_INVALID/);
  assert.throws(() => createProtocolVersion({ ...baseProtocol(), actions: { A: { permittedLevels: ['medic'], durationMs: 1.5 } } }), /DURATION_INVALID/);
});

test('tampered protocol and scenario seals are detected', () => {
  assert.equal(verifyProtocolVersion({ ...PROTOCOL, version: '9' }), false);
  assert.equal(verifyScenarioVersion(SCENARIO), true);
  assert.equal(verifyScenarioVersion({ ...SCENARIO, version: '9' }), false);
});

test('scenario is male-only: female patient, NPC or casualty body is refused', () => {
  assert.throws(() => createScenarioVersion({ ...baseScenario(), patient: { ...SCENARIO.patient, sex: 'FEMALE' } }), /MALE_ONLY_VIOLATION:patient/);
  assert.throws(() => createScenarioVersion({ ...baseScenario(), npcs: [{ sex: 'FEMALE' }] }), /MALE_ONLY_VIOLATION:npc0/);
  assert.throws(() => createScenarioVersion({ ...baseScenario(), sceneRef: { ...SCENARIO.sceneRef, casualtySubjectSex: 'FEMALE' } }), /MALE_ONLY_VIOLATION:sceneCasualty/);
});

test('scenario refuses childbirth content and non-synthetic Stage 1 content', () => {
  assert.throws(() => createScenarioVersion({ ...baseScenario(), patientKnowledge: { ASK_WHAT_HAPPENED: 'לידה' } }), /FORBIDDEN_SCENARIO_CONTENT/);
  assert.throws(() => createScenarioVersion({ ...baseScenario(), contentStatus: 'CLINICAL' }), /MUST_BE_SYNTHETIC/);
});

test('scenario binds the exact certified scene package, male casualty body and protocol digest', () => {
  const { PACKAGE } = require('../../src/clean-runtime/school/scene-v2/package');
  assert.equal(SCENARIO.sceneRef.scenePackageDigest, PACKAGE.scenePackageDigest);
  assert.equal(SCENARIO.sceneRef.casualtyBodyDigest, PACKAGE.refs.bodies.casualty.digest);
  assert.equal(SCENARIO.sceneRef.casualtySubjectSex, 'MALE');
  assert.equal(SCENARIO.protocolRef.protocolDigest, PROTOCOL.protocolDigest);
  assert(SCENARIO.patient.namePool.length > 0);
});

test('equipment, transfer, clock, clinical, intent and attempt contracts validate their inputs', () => {
  assert.throws(() => createEquipmentUnit({ unitId: 'u', itemTypeId: 'i', displayName: 'd', location: { kind: 'POCKET' }, revision: 1 }), /LOCATION_INVALID/);
  assert.throws(() => createInventoryTransfer({ transferId: 't', unitId: 'u', fromKind: 'BAG', toKind: 'BAG', reason: 'r', simTimeMs: 0, unitRevisionBefore: 1 }), /LOCATIONS_INVALID/);
  assert.throws(() => createClockState({ simTimeMs: -1, status: 'RUNNING', revision: 1 }), /TIME_INVALID/);
  assert.throws(() => createClockState({ simTimeMs: 0, status: 'STOPPED', revision: 1 }), /STATUS_INVALID/);
  assert.throws(() => createClinicalState({ patientId: 'p', revision: 0, simTimeMs: 0, facts: {}, protocolRef: { protocolDigest: 'x' } }), /CLINICAL_STATE_INVALID/);
  assert.throws(() => createIntent({ intentId: 'X', channel: 'telepathy' }), /CHANNEL_INVALID/);
  assert.throws(() => createActionAttempt({ attemptId: 'a', sequence: 1, simTimeMs: 0, resultCode: 'MAYBE' }), /UNKNOWN_RESULT_CODE/);
  const cs = createClinicalState({ patientId: 'p', revision: 1, simTimeMs: 0, facts: { a: 1 }, protocolRef: { protocolDigest: 'x' } });
  assert.equal(verifyClinicalState(cs), true);
  assert(Object.isFrozen(cs.facts));
});

test('result codes include every distinction the owner named', () => {
  for (const c of ['ACCEPTED_SUCCESS', 'ACCEPTED_NEGATIVE_CLINICAL_OUTCOME', 'REJECTED_NOT_PERMITTED_FOR_LEVEL', 'REJECTED_EQUIPMENT_MISSING', 'REJECTED_ILLEGAL_LOCATION', 'REJECTED_INTENT_AMBIGUOUS', 'REJECTED_CAPABILITY_UNSUPPORTED']) assert.equal(RESULT_CODES[c], c);
});
