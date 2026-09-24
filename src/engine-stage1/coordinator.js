'use strict';
// Stage 1 authoritative coordination layer (owner Stage 1 constraint 4).
// Sits ABOVE the domain authorities and the certified physical runtime; does
// not modify WorldMutationAPI. Every input is:
//   input -> ledger INPUT_RECEIVED -> intent resolution -> permission gate ->
//   domain preparation (pure, no state change) -> [certified physical commit,
//   last and only irreversible step] -> single atomic swap of all domain
//   slices + ledger append.
// Any failure before the swap leaves every domain slice unchanged.
const { digest } = require('./contracts/canonical');
const { RESULT_CODES: R, isAccepted } = require('./contracts/result-codes');
const { verifyProtocolVersion, isPermitted, TRAINING_LEVELS } = require('./contracts/protocol-version');
const { verifyScenarioVersion } = require('./contracts/scenario-version');
const { createIntent } = require('./contracts/intent');
const { createActionAttempt } = require('./contracts/action-attempt');
const { createEvent, verifyLedger } = require('./contracts/event');
const intentEngine = require('./intent-engine');
const clinical = require('./domains/clinical-authority');
const inventory = require('./domains/inventory-authority');
const clockAuth = require('./domains/clock-authority');
const { createPhysicalPort } = require('./domains/physical-port');

function pickName(scenario, seed) {
  const h = digest({ seed, scenarioDigest: scenario.scenarioDigest });
  return scenario.patient.namePool[parseInt(h.slice(0, 8), 16) % scenario.patient.namePool.length];
}

function createSession({ scenario, protocol, trainingLevel, seed, faultInjector = null }) {
  if (!verifyScenarioVersion(scenario)) throw new TypeError('SCENARIO_SEAL_INVALID');
  if (!verifyProtocolVersion(protocol)) throw new TypeError('PROTOCOL_SEAL_INVALID');
  if (scenario.protocolRef.protocolDigest !== protocol.protocolDigest) throw new TypeError('SCENARIO_PROTOCOL_MISMATCH');
  if (!TRAINING_LEVELS.includes(trainingLevel)) throw new TypeError('TRAINING_LEVEL_INVALID');
  if (typeof seed !== 'string' || !seed) throw new TypeError('SEED_REQUIRED');
  const physical = createPhysicalPort();
  const body = physical.casualtyBodyRef;
  if (body.digest !== scenario.sceneRef.casualtyBodyDigest || body.profile.subjectSex !== 'MALE') throw new TypeError('SCENE_BINDING_MISMATCH');
  const fault = (point) => { if (faultInjector) faultInjector(point); };

  const patientName = pickName(scenario, seed);
  let S = Object.freeze({
    clock: clockAuth.init(),
    clinical: clinical.init(scenario, protocol),
    inventory: inventory.init(scenario),
    pending: Object.freeze([]),
    dialogue: Object.freeze([]),
    attemptCount: 0,
    ledger: Object.freeze([]),
  });
  const w0 = physical.getWorldState();
  S = append(S, [{ type: 'SESSION_STARTED', payload: {
    scenarioId: scenario.scenarioId, scenarioVersion: scenario.version, scenarioDigest: scenario.scenarioDigest,
    protocolId: protocol.protocolId, protocolVersion: protocol.version, protocolDigest: protocol.protocolDigest, protocolStatus: protocol.status,
    trainingLevel, seed, patientName, worldRevision: w0.revision, worldStateDigest: w0.stateDigest,
    clinicalStateDigest: S.clinical.state.clinicalStateDigest,
  } }]);

  function append(state, drafts) {
    let ledger = [...state.ledger];
    for (const d of drafts) ledger.push(createEvent(ledger.at(-1) || null, { type: d.type, simTimeMs: d.simTimeMs ?? state.clock.simTimeMs, payload: d.payload }));
    return Object.freeze({ ...state, ledger: Object.freeze(ledger) });
  }

  function domainDigest(state = S) {
    return digest({
      clock: state.clock.clockDigest,
      clinical: state.clinical.state.clinicalStateDigest,
      observations: state.clinical.observations.map((o) => o.observationDigest),
      units: Object.keys(state.inventory.units).sort().map((k) => state.inventory.units[k].unitDigest),
      transfers: state.inventory.transfers.map((t) => t.transferDigest),
      pending: state.pending,
      dialogue: state.dialogue,
      world: physical.getWorldState().stateDigest,
    });
  }

  // Record the raw input, then either commit a fully prepared next state or a
  // rejection. Rejections append ledger evidence only; no domain slice moves.
  function finish(base, inputEvent, attemptFields, drafts, nextSlices) {
    const attempt = createActionAttempt({ attemptId: 'attempt-' + (base.attemptCount + 1), sequence: base.attemptCount + 1, trainingLevel, simTimeMs: base.clock.simTimeMs, ...attemptFields });
    const accepted = isAccepted(attempt.resultCode);
    const tail = accepted ? drafts : [{ type: 'ACTION_REJECTED', payload: { attempt } }];
    if (accepted && tail.length) tail[tail.length - 1] = { ...tail.at(-1), payload: { ...tail.at(-1).payload, attempt } };
    const committedSlices = accepted ? nextSlices : {};
    S = append(Object.freeze({ ...base, ...committedSlices, attemptCount: base.attemptCount + 1 }), [inputEvent, ...tail]);
    return Object.freeze({ code: attempt.resultCode, attemptId: attempt.attemptId, ...attemptFields.response });
  }

  function reject(base, inputEvent, code, evidence, intent, response = {}) {
    return finish(base, inputEvent, { resultCode: code, evidence, intent: intent || null, response: { evidence, ...response } }, [], {});
  }

  function submit(input) {
    const base = S;
    const inputEvent = { type: 'INPUT_RECEIVED', payload: { op: 'submit', input: structuredClone(input) } };
    if (base.clock.status === 'PAUSED') return reject(base, inputEvent, R.REJECTED_CLOCK_PAUSED, { reason: 'CLOCK_PAUSED' });
    const res = intentEngine.resolve(input);
    if (res.kind === 'INVALID') return reject(base, inputEvent, R.REJECTED_INVALID_INPUT, { reason: 'INVALID_INPUT' });
    if (res.kind === 'AMBIGUOUS') return reject(base, inputEvent, R.REJECTED_INTENT_AMBIGUOUS, { reason: res.reason, candidates: res.candidates || null }, null, { clarification: res.clarification });
    if (res.kind === 'UNSUPPORTED') return reject(base, inputEvent, R.REJECTED_CAPABILITY_UNSUPPORTED, { capability: res.capability });
    const intent = createIntent({ intentId: res.intentId, params: res.params, channel: input.channel, rawInput: input.text ?? { intentId: input.intentId, params: input.params } });
    const intentDraft = { type: 'INTENT_RESOLVED', payload: { intentId: intent.intentId, params: intent.params, channel: intent.channel, semanticKey: intent.semanticKey, intentDigest: intent.intentDigest } };
    const iRef = { intentId: intent.intentId, params: intent.params, channel: intent.channel, semanticKey: intent.semanticKey };
    if (!isPermitted(protocol, intent.intentId, trainingLevel)) return reject(base, inputEvent, R.REJECTED_NOT_PERMITTED_FOR_LEVEL, { actionId: intent.intentId, trainingLevel, protocolDigest: protocol.protocolDigest }, iRef);
    const now = base.clock.simTimeMs;
    const n = base.attemptCount + 1;

    if (intent.intentId === 'ASK_WHAT_HAPPENED') {
      const answer = clinical.answerQuestion(scenario, 'ASK_WHAT_HAPPENED');
      if (answer === null) return reject(base, inputEvent, R.REJECTED_CAPABILITY_UNSUPPORTED, { reason: 'NO_KNOWLEDGE' }, iRef);
      const line = { speaker: patientName, questionId: 'ASK_WHAT_HAPPENED', answer, simTimeMs: now };
      return finish(base, inputEvent, { resultCode: R.ACCEPTED_SUCCESS, intent: iRef, evidence: { questionId: 'ASK_WHAT_HAPPENED' }, response: { answer, speaker: patientName } },
        [intentDraft, { type: 'QUESTION_ANSWERED', payload: line }], { dialogue: Object.freeze([...base.dialogue, Object.freeze(line)]) });
    }

    if (intent.intentId === 'EXAM_INSPECT_FOREARM') {
      const ex = clinical.prepareExam(base.clinical, { examId: 'EXAM_INSPECT_FOREARM', region: intent.params.region, simTimeMs: now, observationId: 'obs-' + n });
      fault('exam:after-prepare');
      const o = ex.observation;
      return finish(base, inputEvent, { resultCode: R.ACCEPTED_SUCCESS, intent: iRef, evidence: { observationId: o.observationId }, response: { observation: { region: o.region, finding: o.finding } } },
        [intentDraft, { type: 'EXAM_PERFORMED', payload: { examId: o.examId, region: o.region } }, { type: 'OBSERVATION_RECORDED', payload: { observation: o } }], { clinical: ex.slice });
    }

    if (intent.intentId === 'MOVE_BAG') {
      fault('move-bag:before-physical');
      const p = physical.proposeBagPlacement({ transactionId: 'stage1:' + scenario.scenarioDigest.slice(0, 12) + ':' + n, target: intent.params.target });
      if (p.status !== 'COMMITTED') return reject(base, inputEvent, R.REJECTED_ILLEGAL_LOCATION, { authority: 'CERTIFIED_PHYSICAL_RUNTIME', code: p.code, gateReason: p.gateReason, worldDigestUnchanged: p.worldDigestUnchanged }, iRef);
      return finish(base, inputEvent, { resultCode: R.ACCEPTED_SUCCESS, intent: iRef, evidence: { worldRevision: p.worldRevision }, response: {} },
        [intentDraft, { type: 'PHYSICAL_MUTATION_COMMITTED', payload: { authority: 'CERTIFIED_PHYSICAL_RUNTIME', target: intent.params.target, priorStateDigest: p.priorStateDigest, stateDigest: p.stateDigest, worldRevision: p.worldRevision, physicalEventDigest: p.physicalEventDigest } }], {});
    }

    if (intent.intentId === 'APPLY_SYNTHETIC_DRESSING') {
      const def = protocol.actions.APPLY_SYNTHETIC_DRESSING;
      if (base.pending.length) return reject(base, inputEvent, R.REJECTED_ACTION_IN_PROGRESS, { pending: base.pending.map((x) => x.attemptId) }, iRef);
      const reach = physical.bagWithinReach(scenario.reachRule.maxDistanceMicrounits);
      if (!reach.within) return reject(base, inputEvent, R.REJECTED_ILLEGAL_LOCATION, { reason: 'BAG_OUT_OF_REACH', ...reach }, iRef);
      const unit = inventory.firstInBag(base.inventory, def.requiresItemType);
      if (!unit) return reject(base, inputEvent, R.REJECTED_EQUIPMENT_MISSING, { itemTypeId: def.requiresItemType }, iRef);
      const tr = inventory.prepareTransfer(base.inventory, { transferId: 'transfer-' + n + '-a', unitId: unit.unitId, fromKind: 'BAG', toKind: 'RESPONDER_HANDS', toRef: 'responder', reason: 'TREATMENT_START', simTimeMs: now });
      if (tr.rejected) return reject(base, inputEvent, R.REJECTED_EQUIPMENT_MISSING, { reason: tr.rejected }, iRef);
      fault('treatment-start:after-inventory');
      const job = Object.freeze({ attemptId: 'attempt-' + n, actionId: 'APPLY_SYNTHETIC_DRESSING', unitId: unit.unitId, region: intent.params.region, startMs: now, endMs: now + def.durationMs });
      return finish(base, inputEvent, { resultCode: R.ACCEPTED_IN_PROGRESS, intent: iRef, evidence: { unitId: unit.unitId, endMs: job.endMs }, response: { endsAtSimTimeMs: job.endMs } },
        [intentDraft, { type: 'INVENTORY_TRANSFERRED', payload: { transfer: tr.transfer } }, { type: 'TREATMENT_STARTED', payload: { job } }], { inventory: tr.slice, pending: Object.freeze([...base.pending, job]) });
    }
    return reject(base, inputEvent, R.REJECTED_CAPABILITY_UNSUPPORTED, { intentId: intent.intentId }, iRef);
  }

  function pause() {
    const base = S;
    const inputEvent = { type: 'INPUT_RECEIVED', payload: { op: 'pause' } };
    const r = clockAuth.pause(base.clock);
    if (r.rejected) return reject(base, inputEvent, R.REJECTED_INVALID_INPUT, { reason: r.rejected });
    return finish(base, inputEvent, { resultCode: R.ACCEPTED_SUCCESS, evidence: {}, response: {} }, [{ type: 'CLOCK_PAUSED', payload: { clock: r.clock } }], { clock: r.clock });
  }

  function resume() {
    const base = S;
    const inputEvent = { type: 'INPUT_RECEIVED', payload: { op: 'resume' } };
    const r = clockAuth.resume(base.clock);
    if (r.rejected) return reject(base, inputEvent, R.REJECTED_INVALID_INPUT, { reason: r.rejected });
    return finish(base, inputEvent, { resultCode: R.ACCEPTED_SUCCESS, evidence: {}, response: {} }, [{ type: 'CLOCK_RESUMED', payload: { clock: r.clock } }], { clock: r.clock });
  }

  // Advance simulated time. Long actions whose end time is reached complete
  // inside the same atomic step, in (endMs, attemptId) order.
  function advance(ms) {
    const base = S;
    const inputEvent = { type: 'INPUT_RECEIVED', payload: { op: 'advance', ms } };
    if (!Number.isInteger(ms) || ms <= 0) return reject(base, inputEvent, R.REJECTED_INVALID_INPUT, { reason: 'ADVANCE_MS_INVALID' });
    if (base.clock.status === 'PAUSED') return reject(base, inputEvent, R.REJECTED_CLOCK_PAUSED, { reason: 'CLOCK_PAUSED' });
    const target = base.clock.simTimeMs + ms;
    const due = [...base.pending].filter((j) => j.endMs <= target).sort((a, b) => a.endMs - b.endMs || a.attemptId.localeCompare(b.attemptId));
    let inv = base.inventory, cli = base.clinical;
    const drafts = [];
    const outcomes = [];
    for (const j of due) {
      const tr = inventory.prepareTransfer(inv, { transferId: 'transfer-' + j.attemptId + '-b', unitId: j.unitId, fromKind: 'RESPONDER_HANDS', toKind: 'APPLIED_TO_PATIENT', toRef: scenario.patient.patientId, reason: 'TREATMENT_COMPLETE', simTimeMs: j.endMs });
      if (tr.rejected) throw new Error('INVARIANT_BROKEN:' + tr.rejected);
      inv = tr.slice;
      fault('treatment-complete:after-inventory');
      const eff = clinical.prepareDressingEffect(cli, { region: j.region, simTimeMs: j.endMs });
      cli = eff.slice;
      const outcomeCode = eff.positive ? R.ACCEPTED_SUCCESS : R.ACCEPTED_NEGATIVE_CLINICAL_OUTCOME;
      outcomes.push({ attemptId: j.attemptId, outcomeCode });
      drafts.push({ type: 'INVENTORY_TRANSFERRED', simTimeMs: j.endMs, payload: { transfer: tr.transfer } });
      if (eff.changed) drafts.push({ type: 'CLINICAL_STATE_CHANGED', simTimeMs: j.endMs, payload: { patientId: scenario.patient.patientId, before: eff.before, after: eff.after, cause: j.attemptId } });
      drafts.push({ type: 'TREATMENT_COMPLETED', simTimeMs: j.endMs, payload: { job: j, outcomeCode } });
    }
    const c = clockAuth.advanceTo(base.clock, target);
    if (c.rejected) return reject(base, inputEvent, R.REJECTED_INVALID_INPUT, { reason: c.rejected });
    drafts.push({ type: 'CLOCK_ADVANCED', simTimeMs: target, payload: { fromMs: base.clock.simTimeMs, toMs: target, completed: outcomes } });
    const dueIds = new Set(due.map((j) => j.attemptId));
    return finish(base, inputEvent, { resultCode: R.ACCEPTED_SUCCESS, evidence: { completed: outcomes }, response: { completed: outcomes } }, drafts,
      { clock: c.clock, inventory: inv, clinical: cli, pending: Object.freeze(base.pending.filter((j) => !dueIds.has(j.attemptId))) });
  }

  // Guard every public operation: an exception anywhere before the swap
  // (including injected faults) leaves S exactly as it was.
  function atomic(fn) {
    return (...args) => {
      const before = S;
      try {
        return fn(...args);
      } catch (e) {
        S = before;
        throw e;
      }
    };
  }

  function publicView() {
    return Object.freeze({
      simTimeMs: S.clock.simTimeMs,
      clockStatus: S.clock.status,
      patientName,
      dialogue: S.dialogue.map((d) => ({ speaker: d.speaker, answer: d.answer })),
      observations: clinical.publicView(S.clinical),
      bag: inventory.publicView(S.inventory),
      inProgress: S.pending.map((j) => ({ actionId: j.actionId, remainingMs: j.endMs - S.clock.simTimeMs })),
    });
  }

  function exportRun() {
    return Object.freeze({
      scenarioDigest: scenario.scenarioDigest,
      protocolDigest: protocol.protocolDigest,
      trainingLevel,
      seed,
      inputs: S.ledger.filter((e) => e.type === 'INPUT_RECEIVED').map((e) => e.payload),
      ledger: S.ledger,
      ledgerHead: S.ledger.at(-1).eventDigest,
      finalDomainDigest: domainDigest(),
    });
  }

  return Object.freeze({
    submit: atomic(submit),
    pause: atomic(pause),
    resume: atomic(resume),
    advance: atomic(advance),
    publicView,
    exportRun,
    domainDigest: () => domainDigest(),
    getLedger: () => S.ledger,
    verifyLedger: () => verifyLedger(S.ledger),
    verifyPhysicalReplay: () => physical.verifyPhysicalReplay(),
    // Test/audit read-only accessors (frozen records, no write handles).
    inspect: () => Object.freeze({ clinicalState: S.clinical.state, units: S.inventory.units, transfers: S.inventory.transfers, clock: S.clock, pending: S.pending, world: physical.getWorldState() }),
  });
}

// Deterministic replay: rebuild a fresh session from the recorded bindings and
// the recorded input stream, then require byte-identical ledger and state.
function replayRun(run, { scenario, protocol }) {
  const integrity = verifyLedger(run.ledger);
  if (!integrity.ok) return { ok: false, reason: 'LEDGER_INTEGRITY', integrity };
  if (scenario.scenarioDigest !== run.scenarioDigest || protocol.protocolDigest !== run.protocolDigest) return { ok: false, reason: 'VERSION_BINDING_MISMATCH' };
  const s = createSession({ scenario, protocol, trainingLevel: run.trainingLevel, seed: run.seed });
  for (const i of run.inputs) {
    if (i.op === 'submit') s.submit(i.input);
    else if (i.op === 'pause') s.pause();
    else if (i.op === 'resume') s.resume();
    else if (i.op === 'advance') s.advance(i.ms);
    else return { ok: false, reason: 'UNKNOWN_INPUT_OP' };
  }
  const x = s.exportRun();
  if (x.ledger.length !== run.ledger.length) return { ok: false, reason: 'LEDGER_LENGTH_MISMATCH' };
  for (let k = 0; k < x.ledger.length; k++) if (x.ledger[k].eventDigest !== run.ledger[k].eventDigest) return { ok: false, reason: 'EVENT_MISMATCH', at: k + 1 };
  if (x.finalDomainDigest !== run.finalDomainDigest) return { ok: false, reason: 'STATE_MISMATCH' };
  return { ok: true, ledgerHead: x.ledgerHead, finalDomainDigest: x.finalDomainDigest, events: x.ledger.length, physicalReplay: s.verifyPhysicalReplay() };
}

module.exports = { createSession, replayRun };
