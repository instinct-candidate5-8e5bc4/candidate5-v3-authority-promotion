'use strict';
/*
 * tests/track-b/b-w7-battery.test.js
 *
 * B-W7 battery self-test. Runs the battery binary with a mocked/fast suite
 * list (--suites) and a temp report path (--report), proving:
 *   1. per-suite counts are aggregated correctly into totals,
 *   2. a failing suite propagates: overall verdict FAIL + nonzero exit,
 *   3. a skip-with-reason is recorded honestly (status "skipped", reason kept,
 *      verdict stays PASS when nothing failed),
 *   4. the report validates against the documented schema
 *      (b-w7-regression-report/1): every suite carries id, command, counts
 *      {pass,fail,skip}, durationMs; the report carries verdict PASS|FAIL.
 *
 * Fast by design: the mocked suites are tiny node:test files. This test never
 * touches the real report path (evidence/track-b/b-w7-regression-report.json)
 * and never runs the real suite list.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..', '..');
const BATTERY = path.join(ROOT, 'scripts', 'track-b', 'b-w7-regression-battery.js');

const MOCK_PASS_SRC = `'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
test('mock pass one', () => assert.equal(1, 1));
test('mock pass two', () => assert.ok(true));
`;

const MOCK_FAIL_SRC = `'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
test('mock pass', () => assert.equal(1, 1));
test('mock fail', () => assert.equal(1, 2));
`;

function makeTmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'b-w7-battery-test-'));
}

function writeMockSuites(tmp, { includeFail }) {
  const passFile = path.join(tmp, 'mock-pass.test.js');
  const failFile = path.join(tmp, 'mock-fail.test.js');
  fs.writeFileSync(passFile, MOCK_PASS_SRC);
  fs.writeFileSync(failFile, MOCK_FAIL_SRC);
  const suites = [
    { id: 'mock/pass.test.js', kind: 'node-test', command: ['node', '--test', '--test-reporter=tap', passFile] },
  ];
  if (includeFail) {
    suites.push({ id: 'mock/fail.test.js', kind: 'node-test', command: ['node', '--test', '--test-reporter=tap', failFile] });
  }
  suites.push({
    id: 'mock/smoke.js',
    kind: 'smoke',
    command: ['node', '-e', 'process.exit(0)'],
    skipReason: 'mocked: chrome unavailable in self-test',
  });
  const suiteFile = path.join(tmp, 'suites.json');
  fs.writeFileSync(suiteFile, JSON.stringify(suites));
  return suiteFile;
}

function runBattery(tmp, suiteFile) {
  const report = path.join(tmp, 'report.json');
  const r = spawnSync('node', [BATTERY, '--root', ROOT, '--suites', suiteFile, '--report', report], {
    encoding: 'utf8',
    timeout: 120000,
  });
  assert.ok(fs.existsSync(report), 'battery must write the report; stderr: ' + (r.stderr || '').slice(0, 500));
  return { proc: r, report: JSON.parse(fs.readFileSync(report, 'utf8')) };
}

function assertSchemaValid(rep) {
  assert.equal(rep.generated, true);
  assert.equal(rep.schema, 'b-w7-regression-report/1');
  assert.ok(['PASS', 'FAIL'].includes(rep.verdict), 'verdict must be PASS or FAIL');
  assert.ok(Array.isArray(rep.suites) && rep.suites.length > 0);
  for (const s of rep.suites) {
    assert.ok(typeof s.id === 'string' && s.id.length > 0, 'suite id required');
    assert.ok(Array.isArray(s.command), 'suite command required');
    assert.ok(s.counts && typeof s.counts === 'object', 'suite counts required');
    for (const k of ['pass', 'fail', 'skip']) {
      assert.ok(Number.isInteger(s.counts[k]) && s.counts[k] >= 0, 'counts.' + k + ' must be a non-negative integer');
    }
    assert.ok(typeof s.durationMs === 'number' && s.durationMs >= 0, 'suite durationMs required');
    assert.ok(['pass', 'fail', 'skipped'].includes(s.status), 'suite status must be pass|fail|skipped');
  }
  for (const k of ['suites', 'suitesPassed', 'suitesFailed', 'suitesSkipped', 'pass', 'fail', 'skip']) {
    assert.ok(Number.isInteger(rep.totals[k]), 'totals.' + k + ' must be an integer');
  }
}

function assertTotalsMatch(rep) {
  const sum = { pass: 0, fail: 0, skip: 0, suitesPassed: 0, suitesFailed: 0, suitesSkipped: 0 };
  for (const s of rep.suites) {
    sum.pass += s.counts.pass;
    sum.fail += s.counts.fail;
    sum.skip += s.counts.skip;
    if (s.status === 'pass') sum.suitesPassed++;
    else if (s.status === 'fail') sum.suitesFailed++;
    else sum.suitesSkipped++;
  }
  assert.equal(rep.totals.pass, sum.pass, 'totals.pass must equal sum of suite counts');
  assert.equal(rep.totals.fail, sum.fail, 'totals.fail must equal sum of suite counts');
  assert.equal(rep.totals.skip, sum.skip, 'totals.skip must equal sum of suite counts');
  assert.equal(rep.totals.suitesPassed, sum.suitesPassed);
  assert.equal(rep.totals.suitesFailed, sum.suitesFailed);
  assert.equal(rep.totals.suitesSkipped, sum.suitesSkipped);
  assert.equal(rep.totals.suites, rep.suites.length);
}

test('B-W7 battery self-test: failing suite => verdict FAIL + nonzero exit; schema valid; totals aggregate', () => {
  const tmp = makeTmp();
  try {
    const suiteFile = writeMockSuites(tmp, { includeFail: true });
    const { proc, report } = runBattery(tmp, suiteFile);

    assert.notEqual(proc.status, 0, 'battery must exit nonzero when a suite fails');

    assertSchemaValid(report);
    assertTotalsMatch(report);
    assert.equal(report.verdict, 'FAIL', 'any failing suite => overall FAIL');

    const failed = report.suites.find((s) => s.id === 'mock/fail.test.js');
    assert.ok(failed, 'failing mock suite must appear in the report');
    assert.equal(failed.status, 'fail');
    assert.ok(failed.counts.fail >= 1, 'failing suite must record fail count >= 1');

    const skipped = report.suites.find((s) => s.id === 'mock/smoke.js');
    assert.ok(skipped, 'skipped mock suite must appear in the report');
    assert.equal(skipped.status, 'skipped', 'skip-with-reason must be recorded honestly, not as pass');
    assert.ok(
      typeof skipped.skipReason === 'string' && skipped.skipReason.includes('chrome'),
      'skip reason must be preserved'
    );
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('B-W7 battery self-test: all green => verdict PASS + zero exit; skip does not fail the verdict', () => {
  const tmp = makeTmp();
  try {
    const suiteFile = writeMockSuites(tmp, { includeFail: false });
    const { proc, report } = runBattery(tmp, suiteFile);

    assert.equal(proc.status, 0, 'battery must exit zero when no suite fails; stderr: ' + (proc.stderr || '').slice(0, 500));

    assertSchemaValid(report);
    assertTotalsMatch(report);
    assert.equal(report.verdict, 'PASS');
    assert.equal(report.totals.suitesFailed, 0);
    assert.equal(report.totals.suitesSkipped, 1, 'the mocked smoke skip must be counted');

    const passed = report.suites.find((s) => s.id === 'mock/pass.test.js');
    assert.equal(passed.status, 'pass');
    assert.equal(passed.counts.pass, 2, 'mock pass file has exactly 2 passing tests');
    assert.equal(passed.counts.fail, 0);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
