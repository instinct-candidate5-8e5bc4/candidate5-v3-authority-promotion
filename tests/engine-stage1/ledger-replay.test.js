'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { E, SCENARIO, PROTOCOL, session, fullRun } = require('./helpers');

test('ledger covers intents, questioning, exams, inventory, treatment, clock, clinical change and physical commits', () => {
  const types = new Set(fullRun(session()).getLedger().map((e) => e.type));
  for (const t of ['SESSION_STARTED', 'INPUT_RECEIVED', 'INTENT_RESOLVED', 'ACTION_REJECTED', 'QUESTION_ANSWERED', 'EXAM_PERFORMED', 'OBSERVATION_RECORDED', 'INVENTORY_TRANSFERRED', 'TREATMENT_STARTED', 'TREATMENT_COMPLETED', 'CLINICAL_STATE_CHANGED', 'PHYSICAL_MUTATION_COMMITTED', 'CLOCK_PAUSED', 'CLOCK_RESUMED', 'CLOCK_ADVANCED']) assert(types.has(t), t);
  for (const t of E.EVENT_TYPES) assert(types.has(t), 'full run exercises ' + t);
});

test('ledger is hash-chained and deeply frozen', () => {
  const s = fullRun(session());
  const v = s.verifyLedger();
  assert.equal(v.ok, true);
  assert.equal(v.head, s.getLedger().at(-1).eventDigest);
  const e = s.getLedger()[3];
  assert(Object.isFrozen(e) && Object.isFrozen(e.payload));
  assert.throws(() => { 'use strict'; e.payload.x = 1; });
});

test('tampered payload, reordered events and truncated head are detected', () => {
  const L = fullRun(session()).getLedger().map((e) => structuredClone(e));
  const t1 = structuredClone(L); t1[5].payload.hacked = true;
  assert.equal(E.verifyLedger(t1).reason, 'DIGEST_MISMATCH');
  const t2 = structuredClone(L); [t2[4], t2[5]] = [t2[5], t2[4]];
  assert.equal(E.verifyLedger(t2).ok, false);
  const t3 = structuredClone(L).slice(1);
  assert.equal(E.verifyLedger(t3).ok, false);
});

test('rejected actions are recorded as evidence with a sealed ActionAttempt', () => {
  const rej = fullRun(session()).getLedger().filter((e) => e.type === 'ACTION_REJECTED');
  assert.deepEqual(rej.map((e) => e.payload.attempt.resultCode), ["REJECTED_ILLEGAL_LOCATION", "REJECTED_CLOCK_PAUSED"]);
  for (const e of rej) assert(e.payload.attempt.attemptDigest && e.payload.attempt.resultCode.startsWith('REJECTED_'));
});

test('same seed and same input sequence reproduce the identical ledger and state', () => {
  const a = fullRun(session({ seed: 'x' })).exportRun();
  const b = fullRun(session({ seed: 'x' })).exportRun();
  assert.equal(a.ledgerHead, b.ledgerHead);
  assert.equal(a.finalDomainDigest, b.finalDomainDigest);
});

test('replay from the recorded run reproduces every event digest and the final state', () => {
  const run = fullRun(session()).exportRun();
  const r = E.replayRun(run, { scenario: SCENARIO, protocol: PROTOCOL });
  assert.equal(r.ok, true, JSON.stringify(r));
  assert.equal(r.ledgerHead, run.ledgerHead);
  assert.equal(r.physicalReplay, true);
});

test('replay refuses a tampered ledger, a different seed and wrong version bindings', () => {
  const run = fullRun(session()).exportRun();
  const t = { ...run, ledger: run.ledger.map((e, i) => (i === 7 ? { ...e, simTimeMs: e.simTimeMs + 1 } : e)) };
  assert.equal(E.replayRun(t, { scenario: SCENARIO, protocol: PROTOCOL }).reason, 'LEDGER_INTEGRITY');
  const seedSwap = { ...run, seed: 'different-seed-zz' };
  assert.equal(E.replayRun(seedSwap, { scenario: SCENARIO, protocol: PROTOCOL }).ok, false);
  assert.equal(E.replayRun({ ...run, protocolDigest: 'f'.repeat(64) }, { scenario: SCENARIO, protocol: PROTOCOL }).reason, 'VERSION_BINDING_MISMATCH');
});

test('seeded randomness is resolved once at start and recorded', () => {
  const names = new Set();
  for (let i = 0; i < 12; i++) {
    const ev = session({ seed: 'seed-' + i }).getLedger()[0];
    assert(SCENARIO.patient.namePool.includes(ev.payload.patientName));
    names.add(ev.payload.patientName);
    assert.equal(session({ seed: 'seed-' + i }).getLedger()[0].payload.patientName, ev.payload.patientName);
  }
  assert(names.size > 1);
});
