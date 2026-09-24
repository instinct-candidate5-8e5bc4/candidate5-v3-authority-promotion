'use strict';
const { seal } = require('./canonical');
const { assertCode } = require('./result-codes');

// ActionAttempt contract: one record per submitted input, accepted or not.
function createActionAttempt({ attemptId, sequence, trainingLevel, intent, simTimeMs, resultCode, evidence }) {
  if (!attemptId || !Number.isInteger(sequence) || !Number.isInteger(simTimeMs)) throw new TypeError('ACTION_ATTEMPT_INVALID');
  assertCode(resultCode);
  return seal({ attemptId, sequence, trainingLevel, intent: intent || null, simTimeMs, resultCode, evidence: evidence || {} }, 'attemptDigest');
}

module.exports = { createActionAttempt };
