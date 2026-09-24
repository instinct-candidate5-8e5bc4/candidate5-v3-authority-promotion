'use strict';
// Simulation clock authority (pure). Integer simulated ms. The host clock is
// never read. Advancing is rejected while paused, so clinical time and
// long-running actions freeze.
const { createClockState } = require('../contracts/simulation-clock');

function init() {
  return createClockState({ simTimeMs: 0, status: 'RUNNING', revision: 1 });
}

function pause(c) {
  if (c.status === 'PAUSED') return { rejected: 'ALREADY_PAUSED' };
  return { clock: createClockState({ simTimeMs: c.simTimeMs, status: 'PAUSED', revision: c.revision + 1 }) };
}

function resume(c) {
  if (c.status === 'RUNNING') return { rejected: 'ALREADY_RUNNING' };
  return { clock: createClockState({ simTimeMs: c.simTimeMs, status: 'RUNNING', revision: c.revision + 1 }) };
}

function advanceTo(c, simTimeMs) {
  if (c.status !== 'RUNNING') return { rejected: 'CLOCK_PAUSED' };
  if (!Number.isInteger(simTimeMs) || simTimeMs < c.simTimeMs) return { rejected: 'TIME_NOT_MONOTONIC' };
  return { clock: createClockState({ simTimeMs, status: 'RUNNING', revision: c.revision + 1 }) };
}

module.exports = { init, pause, resume, advanceTo };
