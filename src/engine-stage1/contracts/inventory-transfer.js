'use strict';
const { seal } = require('./canonical');
const { LOCATION_KINDS } = require('./equipment-unit');

// InventoryTransfer contract: the only way a unit changes location.
function createInventoryTransfer({ transferId, unitId, fromKind, toKind, toRef, reason, simTimeMs, unitRevisionBefore }) {
  if (!transferId || !unitId || !reason) throw new TypeError('TRANSFER_INVALID');
  if (!LOCATION_KINDS.includes(fromKind) || !LOCATION_KINDS.includes(toKind) || fromKind === toKind) throw new TypeError('TRANSFER_LOCATIONS_INVALID');
  if (!Number.isInteger(simTimeMs) || !Number.isInteger(unitRevisionBefore)) throw new TypeError('TRANSFER_BINDING_INVALID');
  return seal({ transferId, unitId, fromKind, toKind, toRef: toRef || null, reason, simTimeMs, unitRevisionBefore }, 'transferDigest');
}

module.exports = { createInventoryTransfer };
