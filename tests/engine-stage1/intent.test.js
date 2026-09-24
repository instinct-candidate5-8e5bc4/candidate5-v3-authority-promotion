'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { E, session, T, V, M, NEAR } = require('./helpers');
const ie = E.intentEngine;

test('same command through text, voice and menu yields the same canonical intent', () => {
  const t = ie.resolve(T('תבדוק את היד השמאלית'));
  const v = ie.resolve(V('תבדוק את היד השמאלית'));
  const m = ie.resolve(M('EXAM_INSPECT_FOREARM', { region: 'left-forearm' }));
  for (const r of [t, v, m]) assert.deepEqual({ k: r.kind, i: r.intentId, p: r.params }, { k: 'INTENT', i: 'EXAM_INSPECT_FOREARM', p: { region: 'left-forearm' } });
});

test('three channels drive identical engine results and identical domain state', () => {
  const out = [T('תבדוק את היד השמאלית'), V('תבדוק את היד השמאלית'), M('EXAM_INSPECT_FOREARM', { region: 'left-forearm' }), { channel: 'direct', intentId: 'EXAM_INSPECT_FOREARM', params: { region: 'left-forearm' } }].map((inp) => {
    const s = session();
    const r = s.submit(inp);
    const ev = s.getLedger().find((e) => e.type === 'INTENT_RESOLVED');
    return { code: r.code, obs: r.observation, key: ev.payload.semanticKey, state: s.domainDigest() };
  });
  for (const o of out) assert.deepEqual(o, out[0]);
});

test('normalizer handles niqqud, final letters, punctuation and prefixes', () => {
  assert.equal(ie.resolve(T('מָה קָרָה?!')).intentId, 'ASK_WHAT_HAPPENED');
  assert.equal(ie.resolve(T('בדוק ביד השמאלית')).params.region, 'left-forearm');
  assert.equal(ie.normalize('שלום, עולם!'), 'שלומ עולמ');
});

test('one-letter typos in longer words are tolerated deterministically', () => {
  assert.equal(ie.resolve(T('תבדק את הזרוע השמאלית')).intentId, 'EXAM_INSPECT_FOREARM');
  assert.equal(ie.resolve(T('תחבוש את היד השמאלת')).params.region, 'left-forearm');
});

test('missing or conflicting parameter asks a short clarifying question instead of guessing', () => {
  const r = ie.resolve(T('תבדוק את היד'));
  assert.equal(r.kind, 'AMBIGUOUS');
  assert.match(r.clarification, /ימין או שמאל/);
  assert.equal(ie.resolve(T('תבדוק את היד הימנית והשמאלית')).kind, 'AMBIGUOUS');
});

test('multiple intents in one command are ambiguous, not executed', () => {
  const r = ie.resolve(T('תבדוק את היד השמאלית ותחבוש אותה'));
  assert.equal(r.kind, 'AMBIGUOUS');
  assert.equal(r.reason, 'MULTIPLE_INTENTS');
});

test('recognized but unimplemented capability is UNSUPPORTED, gibberish is AMBIGUOUS', () => {
  assert.deepEqual(ie.resolve(T('תתחיל החייאה')).kind, 'UNSUPPORTED');
  assert.equal(ie.resolve(T('תביא דפיברילטור')).capability, 'AED');
  assert.equal(ie.resolve(T('בננה סגולה')).reason, 'UNRECOGNIZED');
  assert.equal(ie.resolve(T('')).reason, 'EMPTY');
});

test('menu input with an unknown intent or bad parameter is refused', () => {
  assert.equal(ie.resolve(M('TELEPORT', {})).kind, 'UNSUPPORTED');
  assert.equal(ie.resolve(M('EXAM_INSPECT_FOREARM', { region: 'nose' })).kind, 'AMBIGUOUS');
  assert.equal(ie.resolve(M('EXAM_INSPECT_FOREARM', { region: 'left-forearm', extra: 1 })).kind, 'AMBIGUOUS');
  assert.equal(ie.resolve({ channel: 'fax', text: 'x' }).kind, 'INVALID');
});

test('intent resolution is a pure function (repeatable output)', () => {
  const a = JSON.stringify(ie.resolve(T('תזיז את התיק ליד המטופל')));
  for (let i = 0; i < 20; i++) assert.equal(JSON.stringify(ie.resolve(T('תזיז את התיק ליד המטופל'))), a);
  assert.equal(ie.resolve(NEAR).params.target, 'NEAR_CASUALTY_FLOOR');
});
