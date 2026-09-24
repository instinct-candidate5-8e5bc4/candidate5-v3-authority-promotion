'use strict';
const { seal } = require('./canonical');

// EquipmentUnit contract. Every physical unit has one identity and exactly
// one location at a time. Consumables are individual units, never a counter,
// so duplication is structurally impossible to express.
const LOCATION_KINDS = Object.freeze(['BAG', 'RESPONDER_HANDS', 'APPLIED_TO_PATIENT', 'CONSUMED']);

function createEquipmentUnit({ unitId, itemTypeId, displayName, consumable, location, revision }) {
  if (!unitId || !itemTypeId || !displayName) throw new TypeError('EQUIPMENT_UNIT_INVALID');
  if (!location || !LOCATION_KINDS.includes(location.kind)) throw new TypeError('EQUIPMENT_LOCATION_INVALID');
  if (!Number.isInteger(revision) || revision < 1) throw new TypeError('EQUIPMENT_REVISION_INVALID');
  return seal({ unitId, itemTypeId, displayName, consumable: !!consumable, location: { kind: location.kind, ref: location.ref || null }, revision }, 'unitDigest');
}

module.exports = { LOCATION_KINDS, createEquipmentUnit };
