'use strict';
// Inventory domain authority (pure). Units move only via InventoryTransfer.
// No counters, no creation after init, no duplication: a transfer requires
// the unit to be exactly where the transfer says it is, at the exact revision.
const { createEquipmentUnit } = require('../contracts/equipment-unit');
const { createInventoryTransfer } = require('../contracts/inventory-transfer');

function init(scenario) {
  const units = {};
  for (const u of scenario.initialInventory) {
    if (units[u.unitId]) throw new TypeError('DUPLICATE_UNIT_ID:' + u.unitId);
    units[u.unitId] = createEquipmentUnit({ ...u, location: { kind: 'BAG', ref: scenario.sceneRef.bagEntityId }, revision: 1 });
  }
  return Object.freeze({ units: Object.freeze(units), transfers: Object.freeze([]) });
}

// Deterministic pick: lowest unitId of the given type in the bag.
function firstInBag(slice, itemTypeId) {
  return Object.keys(slice.units).sort().map((k) => slice.units[k]).find((u) => u.itemTypeId === itemTypeId && u.location.kind === 'BAG') || null;
}

function prepareTransfer(slice, { unitId, fromKind, toKind, toRef, reason, simTimeMs, transferId }) {
  const u = slice.units[unitId];
  if (!u) return { rejected: 'UNIT_UNKNOWN' };
  if (u.location.kind !== fromKind) return { rejected: 'UNIT_NOT_AT_SOURCE' };
  if (u.location.kind === 'CONSUMED') return { rejected: 'UNIT_CONSUMED' };
  const t = createInventoryTransfer({ transferId, unitId, fromKind, toKind, toRef, reason, simTimeMs, unitRevisionBefore: u.revision });
  const moved = createEquipmentUnit({ ...u, location: { kind: toKind, ref: toRef || null }, revision: u.revision + 1 });
  return {
    slice: Object.freeze({ units: Object.freeze({ ...slice.units, [unitId]: moved }), transfers: Object.freeze([...slice.transfers, t]) }),
    transfer: t,
  };
}

function countByLocation(slice) {
  const out = {};
  for (const u of Object.values(slice.units)) out[u.location.kind] = (out[u.location.kind] || 0) + 1;
  return out;
}

function publicView(slice) {
  // Bag listing per product rule: item name and quantity only.
  const inBag = {};
  for (const u of Object.values(slice.units)) if (u.location.kind === 'BAG') inBag[u.displayName] = (inBag[u.displayName] || 0) + 1;
  return Object.keys(inBag).sort().map((name) => ({ name, quantity: inBag[name] }));
}

module.exports = { init, firstInBag, prepareTransfer, countByLocation, publicView };
