'use strict';
const { seal, verifySeal } = require('./canonical');

// ProtocolVersion contract (owner Stage 1 constraints 3 and 5).
// A protocol is either CLINICAL_APPROVED (requires source, version, validity
// window and training levels, all explicit) or SYNTHETIC_NOT_CLINICAL (a
// placeholder that exercises engine mechanics and must never be presented as
// medical guidance). The blanket legacy label "MDA ALS 2024" is refused as a
// source reference.
const STATUSES = Object.freeze(['SYNTHETIC_NOT_CLINICAL', 'CLINICAL_APPROVED']);
const TRAINING_LEVELS = Object.freeze(['first-responder', 'medic', 'paramedic']);
const FORBIDDEN_BLANKET_SOURCES = Object.freeze(['MDA ALS 2024']);

function createProtocolVersion(input) {
  const p = structuredClone(input || {});
  if (!p.protocolId || !p.version) throw new TypeError('PROTOCOL_ID_AND_VERSION_REQUIRED');
  if (!STATUSES.includes(p.status)) throw new TypeError('PROTOCOL_STATUS_INVALID');
  const src = p.source || null;
  if (src && FORBIDDEN_BLANKET_SOURCES.some((s) => JSON.stringify(src).includes(s))) {
    throw new TypeError('PROTOCOL_BLANKET_SOURCE_REFUSED');
  }
  if (p.status === 'CLINICAL_APPROVED') {
    if (!src || !src.title || !src.issuer || !src.documentVersion) throw new TypeError('CLINICAL_PROTOCOL_SOURCE_REQUIRED');
    if (!p.validity || !p.validity.from || !p.validity.until) throw new TypeError('CLINICAL_PROTOCOL_VALIDITY_REQUIRED');
    if (!p.approval || !p.approval.approvedBy || !p.approval.approvedAt) throw new TypeError('CLINICAL_PROTOCOL_APPROVAL_REQUIRED');
  } else {
    if (src !== null) throw new TypeError('SYNTHETIC_PROTOCOL_MUST_NOT_CITE_SOURCE');
    if (p.clinicalUseAllowed !== false) throw new TypeError('SYNTHETIC_PROTOCOL_MUST_DENY_CLINICAL_USE');
  }
  if (!p.actions || typeof p.actions !== 'object') throw new TypeError('PROTOCOL_ACTIONS_REQUIRED');
  for (const [id, a] of Object.entries(p.actions)) {
    if (!Array.isArray(a.permittedLevels) || !a.permittedLevels.length || a.permittedLevels.some((l) => !TRAINING_LEVELS.includes(l))) {
      throw new TypeError('PROTOCOL_ACTION_LEVELS_INVALID:' + id);
    }
    if (!Number.isInteger(a.durationMs) || a.durationMs < 0) throw new TypeError('PROTOCOL_ACTION_DURATION_INVALID:' + id);
  }
  p.source = src;
  return seal(p, 'protocolDigest');
}

function verifyProtocolVersion(p) {
  return verifySeal(p, 'protocolDigest');
}

function isPermitted(protocol, actionId, level) {
  const a = protocol.actions[actionId];
  return !!a && a.permittedLevels.includes(level);
}

module.exports = { STATUSES, TRAINING_LEVELS, FORBIDDEN_BLANKET_SOURCES, createProtocolVersion, verifyProtocolVersion, isPermitted };
