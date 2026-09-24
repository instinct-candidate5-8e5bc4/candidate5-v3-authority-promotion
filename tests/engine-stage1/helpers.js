'use strict';
const E = require('../../src/engine-stage1');
const { SCENARIO, PROTOCOL } = E.content;
function session(opts = {}) {
  return E.createSession({ scenario: SCENARIO, protocol: PROTOCOL, trainingLevel: opts.level || 'medic', seed: opts.seed || 'seed-A', faultInjector: opts.faultInjector || null });
}
const T = (text) => ({ channel: 'text', text });
const V = (text) => ({ channel: 'voice', text });
const M = (intentId, params) => ({ channel: 'menu', intentId, params });
const NEAR = M('MOVE_BAG', { target: 'NEAR_CASUALTY_FLOOR' });
// Full happy path used by several tests.
function fullRun(s) {
  s.submit(T('מה קרה?'));
  s.submit(T('תבדוק את היד השמאלית'));
  s.submit(T('שים את התיק על הקיר'));
  s.submit(NEAR);
  s.submit(T('תחבוש את היד השמאלית'));
  s.pause();
  s.advance(5000);
  s.resume();
  s.advance(20000);
  s.submit(T('בדוק יד שמאל'));
  return s;
}
module.exports = { E, SCENARIO, PROTOCOL, session, T, V, M, NEAR, fullRun };
