'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { E, SCENARIO, PROTOCOL, session, T, M, NEAR, fullRun } = require('./helpers');
const R = E.RESULT_CODES;

test('session binds scenario, protocol, level, seed and the certified world at start', () => {
  const s = session();
  const ev = s.getLedger()[0];
  assert.equal(ev.type, 'SESSION_STARTED');
  assert.equal(ev.payload.scenarioDigest, SCENARIO.scenarioDigest);
  assert.equal(ev.payload.protocolDigest, PROTOCOL.protocolDigest);
  assert.equal(ev.payload.protocolStatus, 'SYNTHETIC_NOT_CLINICAL');
  assert.equal(ev.payload.worldRevision, 1);
  assert(SCENARIO.patient.namePool.includes(ev.payload.patientName));
});

test('session refuses mismatched protocol, bad level or missing seed', () => {
  const other = require('../../src/engine-stage1/contracts/protocol-version').createProtocolVersion({ protocolId: 'o', version: '1', status: 'SYNTHETIC_NOT_CLINICAL', clinicalUseAllowed: false, source: null, actions: {} });
  assert.throws(() => E.createSession({ scenario: SCENARIO, protocol: other, trainingLevel: 'medic', seed: 's' }), /SCENARIO_PROTOCOL_MISMATCH/);
  assert.throws(() => E.createSession({ scenario: SCENARIO, protocol: PROTOCOL, trainingLevel: 'nurse', seed: 's' }), /TRAINING_LEVEL_INVALID/);
  assert.throws(() => E.createSession({ scenario: SCENARIO, protocol: PROTOCOL, trainingLevel: 'medic', seed: '' }), /SEED_REQUIRED/);
});

test('question: patient answers only from his knowledge map; answer reveals no exam finding', () => {
  const s = session();
  const r = s.submit(T('מה קרה?'));
  assert.equal(r.code, R.ACCEPTED_SUCCESS);
  assert.equal(r.answer, SCENARIO.patientKnowledge.ASK_WHAT_HAPPENED);
  assert.equal(s.publicView().observations.length, 0);
  assert(!JSON.stringify(s.publicView()).includes('SYNTHETIC_WOUND'));
});

test('no finding is exposed before the examination is performed', () => {
  const s = session();
  const v = JSON.stringify(s.publicView());
  assert(!v.includes('SYNTHETIC_WOUND') && !v.includes('syntheticWound') && !v.includes('covered'));
  const r = s.submit(T('תבדוק את היד השמאלית'));
  assert.equal(r.observation.finding, 'SYNTHETIC_WOUND_PRESENT_UNCOVERED');
  assert.equal(s.publicView().observations.length, 1);
});

test('examining the other region finds nothing; observation binds the clinical revision', () => {
  const s = session();
  const r = s.submit(T('בדוק יד ימין'));
  assert.equal(r.observation.finding, 'SYNTHETIC_NO_WOUND_FOUND');
  const obs = s.getLedger().find((e) => e.type === 'OBSERVATION_RECORDED').payload.observation;
  assert.equal(obs.sourceClinicalRevision, 1);
  assert.equal(obs.sourceClinicalDigest, s.inspect().clinicalState.clinicalStateDigest);
});

test('REJECTED_NOT_PERMITTED_FOR_LEVEL: synthetic gate blocks first-responder dressing', () => {
  const s = session({ level: 'first-responder' });
  s.submit(NEAR);
  const before = s.domainDigest();
  const r = s.submit(T('תחבוש את היד השמאלית'));
  assert.equal(r.code, R.REJECTED_NOT_PERMITTED_FOR_LEVEL);
  assert.equal(s.domainDigest(), before);
});

test('REJECTED_ILLEGAL_LOCATION: bag out of reach, state unchanged', () => {
  const s = session();
  const before = s.domainDigest();
  const r = s.submit(T('תחבוש את היד השמאלית'));
  assert.equal(r.code, R.REJECTED_ILLEGAL_LOCATION);
  assert.equal(r.evidence.reason, 'BAG_OUT_OF_REACH');
  assert.equal(s.domainDigest(), before);
});

test('REJECTED_ILLEGAL_LOCATION: certified physical gate rejects bag into the wall, world digest unchanged', () => {
  const s = session();
  const w = s.inspect().world.stateDigest;
  const before = s.domainDigest();
  const r = s.submit(T('שים את התיק על הקיר'));
  assert.equal(r.code, R.REJECTED_ILLEGAL_LOCATION);
  assert.equal(r.evidence.authority, 'CERTIFIED_PHYSICAL_RUNTIME');
  assert.equal(r.evidence.gateReason, 'OBSTACLE_PENETRATION');
  assert.equal(s.inspect().world.stateDigest, w);
  assert.equal(s.domainDigest(), before);
});

test('legal bag move commits through the certified runtime and physical replay matches', () => {
  const s = session();
  const r = s.submit(NEAR);
  assert.equal(r.code, R.ACCEPTED_SUCCESS);
  assert.equal(s.inspect().world.revision, 2);
  const ev = s.getLedger().find((e) => e.type === 'PHYSICAL_MUTATION_COMMITTED');
  assert.equal(ev.payload.authority, 'CERTIFIED_PHYSICAL_RUNTIME');
  assert.equal(ev.payload.stateDigest, s.inspect().world.stateDigest);
  assert.equal(s.verifyPhysicalReplay(), true);
});

test('REJECTED_INTENT_AMBIGUOUS returns a clarifying question and changes nothing', () => {
  const s = session();
  const before = s.domainDigest();
  const r = s.submit(T('תחבוש'));
  assert.equal(r.code, R.REJECTED_INTENT_AMBIGUOUS);
  assert.match(r.clarification, /ימין או שמאל/);
  assert.equal(s.domainDigest(), before);
});

test('REJECTED_CAPABILITY_UNSUPPORTED for recognized-but-unbuilt actions, state unchanged', () => {
  const s = session();
  const before = s.domainDigest();
  assert.equal(s.submit(T('תתחיל עיסויים')).code, R.REJECTED_CAPABILITY_UNSUPPORTED);
  assert.equal(s.submit(M('TELEPORT', {})).code, R.REJECTED_CAPABILITY_UNSUPPORTED);
  assert.equal(s.domainDigest(), before);
});

test('treatment is a long action: accepted in progress, cannot finish early, completes exactly at duration', () => {
  const s = session();
  s.submit(NEAR);
  const r = s.submit(T('תחבוש את היד השמאלית'));
  assert.equal(r.code, R.ACCEPTED_IN_PROGRESS);
  assert.equal(r.endsAtSimTimeMs, 20000);
  s.advance(19999);
  assert.equal(s.inspect().pending.length, 1);
  assert.equal(s.inspect().clinicalState.facts.syntheticWound.covered, false);
  const done = s.advance(1);
  assert.deepEqual(done.completed, [{ attemptId: r.attemptId, outcomeCode: R.ACCEPTED_SUCCESS }]);
  assert.equal(s.inspect().clinicalState.facts.syntheticWound.covered, true);
  assert.equal(s.inspect().clinicalState.revision, 2);
  assert.equal(s.publicView().inProgress.length, 0);
});

test('ACCEPTED_NEGATIVE_CLINICAL_OUTCOME: dressing the wrong arm consumes a unit, clinical state unchanged', () => {
  const s = session();
  s.submit(NEAR);
  const c0 = s.inspect().clinicalState.clinicalStateDigest;
  s.submit(T('תחבוש את היד הימנית'));
  const done = s.advance(20000);
  assert.equal(done.completed[0].outcomeCode, R.ACCEPTED_NEGATIVE_CLINICAL_OUTCOME);
  assert.equal(s.inspect().clinicalState.clinicalStateDigest, c0);
  assert.equal(s.publicView().bag[0].quantity, 1);
  assert(!s.getLedger().some((e) => e.type === 'CLINICAL_STATE_CHANGED'));
});

test('REJECTED_ACTION_IN_PROGRESS: a parallel treatment cannot bypass the resource limit', () => {
  const s = session();
  s.submit(NEAR);
  s.submit(T('תחבוש את היד השמאלית'));
  const before = s.domainDigest();
  const r = s.submit(T('תחבוש את היד הימנית'));
  assert.equal(r.code, R.REJECTED_ACTION_IN_PROGRESS);
  assert.equal(s.domainDigest(), before);
  assert.equal(s.publicView().bag[0].quantity, 1);
});

test('REJECTED_EQUIPMENT_MISSING once both dressings are used; no unit is ever duplicated', () => {
  const s = session();
  s.submit(NEAR);
  s.submit(T('תחבוש את היד השמאלית'));
  s.advance(20000);
  s.submit(T('תחבוש את היד הימנית'));
  s.advance(20000);
  const before = s.domainDigest();
  const r = s.submit(T('תחבוש את היד השמאלית'));
  assert.equal(r.code, R.REJECTED_EQUIPMENT_MISSING);
  assert.equal(s.domainDigest(), before);
  const units = Object.values(s.inspect().units);
  assert.equal(units.length, 2);
  assert(units.every((u) => u.location.kind === 'APPLIED_TO_PATIENT'));
  assert.equal(new Set(units.map((u) => u.unitId)).size, 2);
  assert.deepEqual(s.publicView().bag, []);
});

test('inventory authority refuses to move a unit that is not at the stated source (no duplication path)', () => {
  const inv = require('../../src/engine-stage1/domains/inventory-authority');
  let slice = inv.init(SCENARIO);
  const a = inv.prepareTransfer(slice, { transferId: 't1', unitId: 'personal-dressing-1', fromKind: 'BAG', toKind: 'RESPONDER_HANDS', reason: 'x', simTimeMs: 0 });
  assert(a.slice);
  assert.equal(inv.prepareTransfer(a.slice, { transferId: 't2', unitId: 'personal-dressing-1', fromKind: 'BAG', toKind: 'RESPONDER_HANDS', reason: 'x', simTimeMs: 0 }).rejected, 'UNIT_NOT_AT_SOURCE');
  assert.equal(inv.prepareTransfer(a.slice, { transferId: 't3', unitId: 'ghost', fromKind: 'BAG', toKind: 'RESPONDER_HANDS', reason: 'x', simTimeMs: 0 }).rejected, 'UNIT_UNKNOWN');
  assert.deepEqual(inv.countByLocation(a.slice), { BAG: 1, RESPONDER_HANDS: 1 });
  assert.deepEqual(inv.countByLocation(slice), { BAG: 2 }, 'original slice is untouched');
  assert.throws(() => inv.init({ ...SCENARIO, initialInventory: [SCENARIO.initialInventory[0], SCENARIO.initialInventory[0]] }), /DUPLICATE_UNIT_ID/);
});

test('bag listing shows item name and quantity only', () => {
  const s = session();
  assert.deepEqual(s.publicView().bag, [{ name: 'תחבושת אישית', quantity: 2 }]);
});

test('pause freezes simulated time and long actions; actions are refused while paused', () => {
  const s = session();
  s.submit(NEAR);
  s.submit(T('תחבוש את היד השמאלית'));
  s.advance(5000);
  assert.equal(s.pause().code, R.ACCEPTED_SUCCESS);
  const before = s.domainDigest();
  assert.equal(s.advance(60000).code, R.REJECTED_CLOCK_PAUSED);
  assert.equal(s.submit(T('מה קרה?')).code, R.REJECTED_CLOCK_PAUSED);
  assert.equal(s.domainDigest(), before);
  assert.equal(s.publicView().simTimeMs, 5000);
  assert.equal(s.publicView().inProgress[0].remainingMs, 15000);
  assert.equal(s.pause().code, R.REJECTED_INVALID_INPUT);
  s.resume();
  assert.equal(s.advance(14999).completed.length, 0);
  assert.equal(s.advance(1).completed.length, 1);
});

test('clock rejects non-positive or non-integer advances; host clock is never consulted', () => {
  const s = session();
  assert.equal(s.advance(0).code, R.REJECTED_INVALID_INPUT);
  assert.equal(s.advance(1.5).code, R.REJECTED_INVALID_INPUT);
  assert.equal(s.resume().code, R.REJECTED_INVALID_INPUT);
  const realNow = Date.now;
  Date.now = () => { throw new Error('host clock read'); };
  try { fullRun(session()); } finally { Date.now = realNow; }
});

test('every rejection type leaves all domain state (clinical, inventory, clock, world) unchanged', () => {
  const cases = [
    [session(), (s) => s.submit(T('תחבוש את היד השמאלית'))],
    [session(), (s) => s.submit(T('שים את התיק על הקיר'))],
    [session(), (s) => s.submit(T('תבדוק'))],
    [session(), (s) => s.submit(T('דפיברילטור'))],
    [session({ level: 'first-responder' }), (s) => s.submit(T('תחבוש את היד השמאלית'))],
    [session(), (s) => s.submit({ channel: 'fax' })],
  ];
  for (const [s, fn] of cases) {
    const before = s.domainDigest();
    const r = fn(s);
    assert(!E.isAccepted(r.code), r.code);
    assert.equal(s.domainDigest(), before, r.code);
  }
});
