'use strict';
const { digest, deepFreeze } = require('./canonical');

// Stage 1 engine event ledger (owner Stage 1 constraint 8). Hash-chained,
// append-only, covers intents, questioning, exams, inventory, treatment, clock
// and clinical change, plus references to certified physical commits.
const EVENT_TYPES = Object.freeze([
  'SESSION_STARTED',
  'INPUT_RECEIVED',
  'INTENT_RESOLVED',
  'ACTION_REJECTED',
  'QUESTION_ANSWERED',
  'EXAM_PERFORMED',
  'OBSERVATION_RECORDED',
  'INVENTORY_TRANSFERRED',
  'TREATMENT_STARTED',
  'TREATMENT_COMPLETED',
  'CLINICAL_STATE_CHANGED',
  'PHYSICAL_MUTATION_COMMITTED',
  'CLOCK_PAUSED',
  'CLOCK_RESUMED',
  'CLOCK_ADVANCED',
]);
const GENESIS = '0'.repeat(64);

function createEvent(prior, { type, simTimeMs, payload }) {
  if (!EVENT_TYPES.includes(type)) throw new TypeError('EVENT_TYPE_INVALID:' + type);
  if (!Number.isInteger(simTimeMs)) throw new TypeError('EVENT_TIME_INVALID');
  const body = {
    sequence: prior ? prior.sequence + 1 : 1,
    type,
    simTimeMs,
    payload: structuredClone(payload || {}),
    priorEventDigest: prior ? prior.eventDigest : GENESIS,
  };
  return deepFreeze({ ...body, eventDigest: digest(body) });
}

// Integrity check over a whole ledger: sequence, chain and per-event digest.
function verifyLedger(events) {
  let prior = null;
  for (const e of events) {
    const body = { ...e };
    delete body.eventDigest;
    if (e.sequence !== (prior ? prior.sequence + 1 : 1)) return { ok: false, at: e.sequence, reason: 'SEQUENCE_BREAK' };
    if (e.priorEventDigest !== (prior ? prior.eventDigest : GENESIS)) return { ok: false, at: e.sequence, reason: 'CHAIN_BREAK' };
    if (digest(body) !== e.eventDigest) return { ok: false, at: e.sequence, reason: 'DIGEST_MISMATCH' };
    prior = e;
  }
  return { ok: true, length: events.length, head: prior ? prior.eventDigest : GENESIS };
}

module.exports = { EVENT_TYPES, GENESIS, createEvent, verifyLedger };
