'use strict';
// End-to-end Stage 1 demo: one scene, one male patient, one question, one
// exam, one equipment item, one synthetic treatment - all through the
// authoritative chain. Prints each step and writes the exported run (with the
// full ledger) plus an independent replay verdict. Deterministic output.
// Usage: node tests/engine-stage1/demo-run.js [outDir]
const fs = require('node:fs');
const path = require('node:path');
const E = require('../../src/engine-stage1');
const { SCENARIO, PROTOCOL } = E.content;

const steps = [
  ['submit', { channel: 'text', text: 'מה קרה?' }],
  ['submit', { channel: 'voice', text: 'תבדוק את היד השמאלית' }],
  ['submit', { channel: 'text', text: 'תחבוש את היד השמאלית' }],
  ['submit', { channel: 'text', text: 'שים את התיק על הקיר' }],
  ['submit', { channel: 'menu', intentId: 'MOVE_BAG', params: { target: 'NEAR_CASUALTY_FLOOR' } }],
  ['submit', { channel: 'text', text: 'תחבוש' }],
  ['submit', { channel: 'text', text: 'תחבוש את היד השמאלית' }],
  ['submit', { channel: 'text', text: 'תחבוש את היד הימנית' }],
  ['pause'],
  ['advance', 30000],
  ['resume'],
  ['advance', 19999],
  ['advance', 1],
  ['submit', { channel: 'direct', intentId: 'EXAM_INSPECT_FOREARM', params: { region: 'left-forearm' } }],
  ['submit', { channel: 'text', text: 'תעשה החייאה' }],
];

const s = E.createSession({ scenario: SCENARIO, protocol: PROTOCOL, trainingLevel: 'medic', seed: 'stage1-demo' });
const transcript = steps.map(([op, arg]) => {
  const r = op === 'submit' ? s.submit(arg) : op === 'advance' ? s.advance(arg) : s[op]();
  return { op, arg: arg === undefined ? null : arg, result: r };
});
const run = s.exportRun();
const replay = E.replayRun(run, { scenario: SCENARIO, protocol: PROTOCOL });
const out = { transcript, publicView: s.publicView(), ledgerIntegrity: s.verifyLedger(), replay, run };
for (const t of transcript) console.log(t.op.padEnd(7), JSON.stringify(t.arg), '->', t.result.code);
console.log('ledger events:', run.ledger.length, 'head:', run.ledgerHead);
console.log('replay:', JSON.stringify(replay));
const dir = process.argv[2];
if (dir) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'demo-run.json'), JSON.stringify(out, null, 1) + '\n');
}
if (!replay.ok || !out.ledgerIntegrity.ok) process.exit(1);
