'use strict';
const { seal } = require('./canonical');

// SimulationClock contract. Integer simulated milliseconds. Never reads the
// browser/host clock; time only moves through explicit, logged advance inputs.
const CLOCK_STATUSES = Object.freeze(['RUNNING', 'PAUSED']);

function createClockState({ simTimeMs, status, revision }) {
  if (!Number.isInteger(simTimeMs) || simTimeMs < 0) throw new TypeError('CLOCK_TIME_INVALID');
  if (!CLOCK_STATUSES.includes(status)) throw new TypeError('CLOCK_STATUS_INVALID');
  if (!Number.isInteger(revision) || revision < 1) throw new TypeError('CLOCK_REVISION_INVALID');
  return seal({ simTimeMs, status, revision }, 'clockDigest');
}

module.exports = { CLOCK_STATUSES, createClockState };
