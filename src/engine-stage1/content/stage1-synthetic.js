'use strict';
// Stage 1 SYNTHETIC content. This is NOT medical guidance and NOT an MDA
// protocol. Values here exist only to exercise the engine mechanics
// (question, exam, one equipment item, one treatment). Real clinical rules
// enter only after the owner approves a source, version, validity and
// training level (owner Stage 1 constraint 5).
const { PACKAGE } = require('../../clean-runtime/school/scene-v2/package');
const { createProtocolVersion } = require('../contracts/protocol-version');
const { createScenarioVersion } = require('../contracts/scenario-version');

const PROTOCOL = createProtocolVersion({
  protocolId: 'stage1-synthetic-mechanics',
  version: '1.0.0',
  status: 'SYNTHETIC_NOT_CLINICAL',
  clinicalUseAllowed: false,
  source: null,
  note: 'Placeholder permission/duration matrix for engine mechanics only. Not a medical rule.',
  actions: {
    ASK_WHAT_HAPPENED: { permittedLevels: ['first-responder', 'medic', 'paramedic'], durationMs: 0 },
    EXAM_INSPECT_FOREARM: { permittedLevels: ['first-responder', 'medic', 'paramedic'], durationMs: 0 },
    MOVE_BAG: { permittedLevels: ['first-responder', 'medic', 'paramedic'], durationMs: 0 },
    // Synthetic gate so the NOT_PERMITTED_FOR_LEVEL path is exercised.
    APPLY_SYNTHETIC_DRESSING: { permittedLevels: ['medic', 'paramedic'], durationMs: 20000, requiresItemType: 'personal-dressing' },
  },
});

const casualty = PACKAGE.refs.bodies.casualty;

const SCENARIO = createScenarioVersion({
  scenarioId: 'stage1-school-treatment-room-synthetic-forearm',
  version: '1.0.0',
  contentStatus: 'SYNTHETIC_NOT_CLINICAL',
  sceneRef: {
    scenePackageDigest: PACKAGE.scenePackageDigest,
    scenePackageVersion: PACKAGE.scenePackageVersion,
    casualtyEntityId: 'school-casualty-adult-v1',
    bagEntityId: 'school-medical-bag',
    casualtyBodyDigest: casualty.digest,
    casualtySubjectSex: casualty.profile.subjectSex,
  },
  protocolRef: { protocolId: PROTOCOL.protocolId, version: PROTOCOL.version, protocolDigest: PROTOCOL.protocolDigest },
  // Male only (owner rule). Name chosen once per run from the seed.
  patient: { patientId: 'patient-1', sex: 'MALE', namePool: ['דניאל', 'יוסף', 'אברהם', 'משה'] },
  npcs: [],
  patientKnowledge: {
    ASK_WHAT_HAPPENED: 'נחתכתי ביד משבר זכוכית', // synthetic line the patient knows
  },
  initialClinicalFacts: {
    syntheticWound: { region: 'left-forearm', covered: false },
  },
  initialInventory: [
    { unitId: 'personal-dressing-1', itemTypeId: 'personal-dressing', displayName: 'תחבושת אישית', consumable: true },
    { unitId: 'personal-dressing-2', itemTypeId: 'personal-dressing', displayName: 'תחבושת אישית', consumable: true },
  ],
  // Game reach rule (not medical): the bag must be within 1.5 m (XZ plane) of
  // the casualty for its contents to be used.
  reachRule: { maxDistanceMicrounits: 1500000 },
});

module.exports = { PROTOCOL, SCENARIO };
