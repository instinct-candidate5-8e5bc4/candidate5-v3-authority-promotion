'use strict';
const { seal, digest } = require('./canonical');

// Intent contract. All input channels (free text, voice transcript, menu,
// direct scene interaction) resolve to this one canonical shape. The channel
// is recorded for audit but is NOT part of the semantic key, so the same
// intent from any channel drives the same engine path.
const CHANNELS = Object.freeze(['text', 'voice', 'menu', 'direct']);

function createIntent({ intentId, params, channel, rawInput }) {
  if (!intentId) throw new TypeError('INTENT_ID_REQUIRED');
  if (!CHANNELS.includes(channel)) throw new TypeError('INTENT_CHANNEL_INVALID');
  const p = structuredClone(params || {});
  const semanticKey = digest({ intentId, params: p });
  return seal({ intentId, params: p, channel, rawInputDigest: digest(rawInput === undefined ? null : rawInput), semanticKey }, 'intentDigest');
}

module.exports = { CHANNELS, createIntent };
