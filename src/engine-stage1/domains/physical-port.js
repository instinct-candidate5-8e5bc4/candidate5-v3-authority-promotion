'use strict';
// Physical port. The certified mutation runtime stays the ONLY physical
// authority (owner Stage 1 constraint 4). This module composes certified
// modules exactly as the certified Gate D instantiate path does, keeps the
// live runtime handle, and forwards bag placement proposals through the same
// sole path: proposeTransaction -> legality port -> school geometry adapter ->
// Phase 2 geometry gate. No certified file is modified and no world state is
// written here.
const { empty } = require('../../clean-runtime/school/scene-v2/instantiate');
const { PACKAGE, model } = require('../../clean-runtime/school/scene-v2/package');
const { validateScenePackage } = require('../../clean-runtime/school/scene-v2/validate');
const { schoolGeometryAdapter } = require('../../clean-runtime/school/school-geometry-adapter');
const { createMultiSupportRuntime } = require('../../clean-runtime/multi-support/runtime');
const { replay } = require('../../clean-runtime/events/replay');
const { world } = require('../../clean-runtime/contracts/world-state');

const BAG_ID = 'school-medical-bag';
const CASUALTY_ID = 'school-casualty-adult-v1';
const BAG_RELATION_ID = 'school:bag:floor';

// Named bag targets (microunits). Legality is NOT decided here - the certified
// gate decides. WALL is intentionally inside the wall exclusion volume.
const BAG_TARGETS = Object.freeze({
  NEAR_CASUALTY_FLOOR: Object.freeze([-1200000, 175000, 1000000]),
  WALL: Object.freeze([0, 175000, -3900000]),
});

function createPhysicalPort() {
  const v = validateScenePackage(PACKAGE);
  if (v.status !== 'VALIDATED') throw new Error('CERTIFIED_SCENE_PACKAGE_INVALID');
  const api = createMultiSupportRuntime({ initialWorld: empty(), legalityPort: schoolGeometryAdapter({ surfaceModel: model }) });
  const commands = PACKAGE.entities
    .map((e) => ({ commandId: 'spawn:' + e.entityId, type: 'SpawnEntity', expectedWorldRevision: 0, entity: e }))
    .concat(PACKAGE.supportRelations.map((r) => ({ commandId: 'support:' + r.relationId, type: 'AttachSupportRelation', expectedWorldRevision: 0, relation: r })));
  const init = api.proposeTransaction({ transactionId: 'instantiate:' + PACKAGE.scenePackageDigest, expectedWorldRevision: 0, commands });
  if (init.status !== 'COMMITTED') throw new Error('CERTIFIED_INSTANTIATION_NOT_COMMITTED');

  function getWorldState() {
    return api.getWorldState();
  }

  function positionOf(entityId) {
    return getWorldState().entities[entityId].transform.positionMicrounits;
  }

  // Integer XZ-plane distance check, no floating point.
  function bagWithinReach(maxDistanceMicrounits) {
    const b = positionOf(BAG_ID);
    const c = positionOf(CASUALTY_ID);
    const dx = BigInt(b[0] - c[0]);
    const dz = BigInt(b[2] - c[2]);
    const d2 = dx * dx + dz * dz;
    const m = BigInt(maxDistanceMicrounits);
    return { within: d2 <= m * m, distanceSquaredMicrounits: d2.toString(), bag: [...b], casualty: [...c] };
  }

  function proposeBagPlacement({ transactionId, target }) {
    const pos = BAG_TARGETS[target];
    if (!pos) return Object.freeze({ status: 'REJECTED', code: 'UNKNOWN_TARGET', worldDigestUnchanged: true });
    const before = api.getWorldState();
    const next = before.revision + 1;
    const bagRel = before.supportRelations.find((r) => r.relationId === BAG_RELATION_ID);
    const rebinds = before.supportRelations
      .filter((r) => r.relationId !== BAG_RELATION_ID)
      .map((r) => ({ commandId: transactionId + ':rebind:' + r.relationId, type: 'ReplaceSupportRelation', expectedWorldRevision: before.revision, relationId: r.relationId, relation: { ...structuredClone(r), boundWorldRevision: next } }));
    const result = api.proposeTransaction({
      transactionId,
      expectedWorldRevision: before.revision,
      commands: [
        { commandId: transactionId + ':set-transform', type: 'SetTransform', expectedWorldRevision: before.revision, entityId: BAG_ID, transform: { positionMicrounits: [...pos], orientation: [0, 0, 0, 1], scaleMicrounits: [1000000, 1000000, 1000000] } },
        { commandId: transactionId + ':replace-support', type: 'ReplaceSupportRelation', expectedWorldRevision: before.revision, relationId: BAG_RELATION_ID, relation: { ...structuredClone(bagRel), boundWorldRevision: next } },
        ...rebinds,
      ],
    });
    const after = api.getWorldState();
    const log = api.getEventLog();
    const reason = result.evidence?.detail?.evidence?.phase2ReasonCode || result.evidence?.reason || null;
    return Object.freeze({
      status: result.status,
      code: result.code || null,
      gateReason: reason,
      priorStateDigest: before.stateDigest,
      stateDigest: after.stateDigest,
      worldRevision: after.revision,
      worldDigestUnchanged: before.stateDigest === after.stateDigest,
      physicalEventDigest: result.status === 'COMMITTED' ? log.at(-1).eventDigest : null,
    });
  }

  function verifyPhysicalReplay() {
    const r = replay(world(empty()), api.getEventLog());
    return r.stateDigest === api.getWorldState().stateDigest;
  }

  return Object.freeze({ getWorldState, bagWithinReach, proposeBagPlacement, verifyPhysicalReplay, casualtyBodyRef: PACKAGE.refs.bodies.casualty });
}

module.exports = { createPhysicalPort, BAG_TARGETS, BAG_ID, CASUALTY_ID };
