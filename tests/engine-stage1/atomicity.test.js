'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { session, T, NEAR } = require('./helpers');

function faulty(point) {
  let armed = false;
  const s = session({ faultInjector: (p) => { if (armed && p === point) throw new Error('INJECTED:' + p); } });
  return { s, arm: () => { armed = true; } };
}

for (const [point, setup, act] of [
  ['exam:after-prepare', () => {}, (s) => s.submit(T('תבדוק את היד השמאלית'))],
  ['treatment-start:after-inventory', (s) => s.submit(NEAR), (s) => s.submit(T('תחבוש את היד השמאלית'))],
  ['treatment-complete:after-inventory', (s) => { s.submit(NEAR); s.submit(T('תחבוש את היד השמאלית')); }, (s) => s.advance(20000)],
  ['move-bag:before-physical', () => {}, (s) => s.submit(NEAR)],
]) {
  test('injected failure at ' + point + ' leaves no partial state in any domain or the ledger', () => {
    const { s, arm } = faulty(point);
    setup(s);
    const before = { d: s.domainDigest(), n: s.getLedger().length, w: s.inspect().world.stateDigest, head: s.getLedger().at(-1).eventDigest };
    arm();
    assert.throws(() => act(s), /INJECTED/);
    assert.deepEqual({ d: s.domainDigest(), n: s.getLedger().length, w: s.inspect().world.stateDigest, head: s.getLedger().at(-1).eventDigest }, before);
    assert.equal(s.verifyLedger().ok, true);
  });
}

test('after an injected failure the session continues normally from the untouched state', () => {
  let armed = true;
  const s = session({ faultInjector: (p) => { if (armed && p === 'treatment-start:after-inventory') throw new Error('INJECTED'); } });
  s.submit(NEAR);
  assert.throws(() => s.submit(T('תחבוש את היד השמאלית')));
  armed = false;
  assert.equal(s.submit(T('תחבוש את היד השמאלית')).code, 'ACCEPTED_IN_PROGRESS');
  assert.equal(s.publicView().bag[0].quantity, 1);
});

test('cross-domain treatment completion commits inventory and clinical change in one step', () => {
  const s = session();
  s.submit(NEAR);
  s.submit(T('תחבוש את היד השמאלית'));
  const n = s.getLedger().length;
  s.advance(20000);
  const added = s.getLedger().slice(n).map((e) => e.type);
  assert.deepEqual(added, ['INPUT_RECEIVED', 'INVENTORY_TRANSFERRED', 'CLINICAL_STATE_CHANGED', 'TREATMENT_COMPLETED', 'CLOCK_ADVANCED']);
});
