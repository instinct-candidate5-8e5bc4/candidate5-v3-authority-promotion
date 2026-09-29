#!/usr/bin/env node
'use strict';
/*
 * scripts/track-b/b-w7-regression-battery.js
 *
 * B-W7 regression battery — Track B visual slice.
 *
 * WHAT IT DOES
 *   Runs the fixed Track B-relevant suite list in a fixed order, records
 *   per-suite pass/fail/skip counts and durations, and writes a
 *   machine-readable report to evidence/track-b/b-w7-regression-report.json.
 *
 *   The report is GENERATED OUTPUT — do not commit it. It is produced fresh
 *   on every run (the JSON carries "generated": true).
 *
 * SUITE LIST (fixed, minimum)
 *   - tests/clean-runtime-school-scene-v2/*.test.js (each file = one suite,
 *     incl. b7-engine)
 *   - tests/track-b/*.test.js (each file = one suite, only if the dir
 *     exists at run time)
 *   - scripts/track-b/c6-demo-smoke.js (browser smoke; SKIP-with-reason when
 *     Chrome/puppeteer are unavailable — never fake-passed)
 *
 * VERDICT & EXIT CODE
 *   Verdict is FAIL if any suite fails. The process exits nonzero on FAIL,
 *   zero on PASS. A skipped suite keeps the verdict PASS but is recorded
 *   honestly as "skipped" with a reason, and a loud notice is printed.
 *
 * THE BATTERY REPORTS — IT DOES NOT FIX. One honest run per suite: no test
 * edits, no threshold loosening, no retry-until-pass.
 *
 * DEV-TIME DEPENDENCIES (never committed)
 *   - b7-engine.test.js needs esbuild. Resolve order for NODE_PATH:
 *     1. $B_W7_ESBUILD_DIR, 2. require.resolve('esbuild'),
 *     3. <repo>/node_modules. If none is found the suite fails honestly.
 *   - The C6 smoke needs Chrome at /usr/bin/google-chrome and puppeteer at
 *     /home/sandbox/verify/node_modules/puppeteer (as committed in the
 *     smoke script). If either is missing the smoke is SKIPPED with a
 *     reason — the smoke script itself is never edited.
 *
 * CLAIM VOCABULARY: a green battery means "tests green on this tree" —
 * never "certified".
 *
 * USAGE
 *   node scripts/track-b/b-w7-regression-battery.js [--root <dir>]
 *       [--suites <json-file>] [--report <path>] [--list]
 *
 *   --suites: JSON array overriding the suite list, e.g.
 *     [{"id":"mock/a","kind":"node-test","command":["node","--test","--test-reporter=tap","/tmp/a.test.js"]},
 *      {"id":"mock/b","kind":"smoke","command":["node","/tmp/b.js"],"skipReason":"mocked: no chrome"}]
 *     A suite carrying "skipReason" is recorded as skipped without running.
 *
 * REPORT SCHEMA (b-w7-regression-report/1) — required fields:
 *   suites[].id, suites[].command, suites[].counts {pass,fail,skip},
 *   suites[].durationMs, verdict ("PASS"|"FAIL").
 *
 * Node 22+ compatible. No network access except the C6 smoke's own local
 * server and the CDN three.js fetch inside the browser page.
 *
 * NESTED INVOCATION NOTE: when this battery is itself launched from inside a
 * `node --test` process (e.g. via tests/track-b/b-w7-battery.test.js during a
 * full-repo `node --test` run), Node would refuse to run the per-suite
 * `node --test` children ("run() is being called recursively ... skipping").
 * That guard targets accidental self-recursion; here each child is a
 * deliberate, bounded, one-level run of a different file. The battery
 * therefore strips NODE_TEST_CONTEXT from suite children so they execute
 * normally. Standalone runs are unaffected (the variable is absent there).
 */
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync, execSync } = require('node:child_process');

const argv = process.argv.slice(2);
function opt(name) {
  const i = argv.indexOf(name);
  return i >= 0 && i + 1 < argv.length ? argv[i + 1] : null;
}
const LIST_ONLY = argv.includes('--list');

const ROOT = path.resolve(opt('--root') || path.join(__dirname, '..', '..'));
const REPORT_PATH = path.resolve(
  opt('--report') || path.join(ROOT, 'evidence', 'track-b', 'b-w7-regression-report.json')
);
const SUITES_FILE = opt('--suites');

const SUITE_TIMEOUT_MS = 600000; // 10 minutes per suite, fail-closed on timeout
const C6_CHROME_PATH = '/usr/bin/google-chrome';
const C6_PUPPETEER_PATH = '/home/sandbox/verify/node_modules/puppeteer';

// ---------------------------------------------------------------------------
// dev-time esbuild resolution (never committed to the repo)
// ---------------------------------------------------------------------------
function esbuildNodePath() {
  const fromEnv = process.env.B_W7_ESBUILD_DIR;
  if (fromEnv && fs.existsSync(path.join(fromEnv, 'esbuild'))) return fromEnv;
  try {
    const resolved = require.resolve('esbuild');
    const parts = resolved.split(path.sep);
    const i = parts.lastIndexOf('node_modules');
    if (i >= 0) {
      const dir = parts.slice(0, i + 1).join(path.sep);
      if (fs.existsSync(path.join(dir, 'esbuild'))) return dir;
    }
  } catch { /* not resolvable */ }
  const local = path.join(ROOT, 'node_modules');
  if (fs.existsSync(path.join(local, 'esbuild'))) return local;
  return null;
}

// ---------------------------------------------------------------------------
// suite list
// ---------------------------------------------------------------------------
function discoverSuites() {
  const suites = [];
  const addTestDir = (dir) => {
    const abs = path.join(ROOT, dir);
    if (!fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) return;
    const files = fs.readdirSync(abs).filter((f) => f.endsWith('.test.js')).sort();
    for (const f of files) {
      const id = path.join(dir, f).split(path.sep).join('/');
      suites.push({ id, kind: 'node-test', command: ['node', '--test', '--test-reporter=tap', id] });
    }
  };
  addTestDir('tests/clean-runtime-school-scene-v2');
  addTestDir('tests/track-b');

  // C6 demo browser smoke — skip honestly when the environment lacks it.
  const smokeId = 'scripts/track-b/c6-demo-smoke.js';
  const missing = [];
  if (!fs.existsSync(path.join(ROOT, smokeId))) missing.push('smoke script missing: ' + smokeId);
  if (!fs.existsSync(C6_CHROME_PATH)) missing.push('chrome not found at ' + C6_CHROME_PATH);
  try {
    require.resolve(C6_PUPPETEER_PATH);
  } catch {
    missing.push('puppeteer not resolvable at ' + C6_PUPPETEER_PATH);
  }
  const smoke = { id: smokeId, kind: 'smoke', command: ['node', smokeId] };
  if (missing.length) {
    smoke.skipReason =
      'SKIP: ' + missing.join('; ') + ' — environment limitation; visual smoke did not run (this is not a pass).';
  }
  suites.push(smoke);
  return suites;
}

function loadSuites() {
  if (SUITES_FILE) {
    const raw = fs.readFileSync(path.resolve(SUITES_FILE), 'utf8');
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) throw new Error('--suites file must contain a JSON array');
    return arr.map((s) => ({
      id: String(s.id),
      kind: s.kind === 'smoke' ? 'smoke' : 'node-test',
      command: Array.isArray(s.command) ? s.command.map(String) : [],
      skipReason: s.skipReason != null ? String(s.skipReason) : null,
    }));
  }
  return discoverSuites();
}

// ---------------------------------------------------------------------------
// suite execution
// ---------------------------------------------------------------------------
function parseTapCounts(text) {
  const counts = { pass: 0, fail: 0, skip: 0 };
  for (const line of text.split('\n')) {
    const t = line.trim();
    if (/^not ok \d+/.test(t)) counts.fail++;
    else if (/^ok \d+/.test(t)) {
      if (/#\s*SKIP\b/.test(t)) counts.skip++;
      else counts.pass++;
    }
  }
  return counts;
}

function parseSmokeCounts(text) {
  const counts = { pass: 0, fail: 0, skip: 0 };
  for (const line of text.split('\n')) {
    const t = line.trim();
    if (/^PASS[ :]/i.test(t)) counts.pass++;
    else if (/^FAIL[ :]/i.test(t)) counts.fail++;
  }
  return counts;
}

function runSuite(suite, env) {
  const started = Date.now();
  const base = {
    id: suite.id,
    command: suite.command || [],
    status: 'pass',
    skipReason: null,
    counts: { pass: 0, fail: 0, skip: 0 },
    durationMs: 0,
    exitCode: null,
  };
  if (suite.skipReason) {
    base.status = 'skipped';
    base.skipReason = suite.skipReason;
    base.durationMs = Date.now() - started;
    return base;
  }
  let result;
  try {
    // Strip NODE_TEST_CONTEXT so a nested `node --test` child runs normally
    // instead of being skipped as "recursive" (see header note).
    const childEnv = { ...env };
    delete childEnv.NODE_TEST_CONTEXT;
    result = spawnSync(suite.command[0], suite.command.slice(1), {
      cwd: ROOT,
      encoding: 'utf8',
      timeout: SUITE_TIMEOUT_MS,
      env: childEnv,
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch (err) {
    base.status = 'fail';
    base.skipReason = null;
    base.note = 'spawn error: ' + String((err && err.message) || err);
    base.durationMs = Date.now() - started;
    return base;
  }
  const out = (result.stdout || '') + (result.stderr || '');
  base.exitCode = result.status;
  if (result.error) {
    base.status = 'fail';
    base.note = 'run error: ' + String(result.error.message || result.error);
  } else if (suite.kind === 'smoke') {
    base.counts = parseSmokeCounts(out);
    const m = /^RESULT:\s*(PASS|FAIL)/m.exec(out);
    const resultOk = m && m[1] === 'PASS';
    base.status = result.status === 0 && resultOk && base.counts.fail === 0 ? 'pass' : 'fail';
  } else {
    base.counts = parseTapCounts(out);
    base.status = result.status === 0 && base.counts.fail === 0 ? 'pass' : 'fail';
  }
  base.durationMs = Date.now() - started;
  return base;
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
function baseCommit() {
  try {
    return execSync('git rev-parse HEAD', { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

function main() {
  const suites = loadSuites();
  if (LIST_ONLY) {
    for (const s of suites) console.log((s.skipReason ? 'SKIP ' : 'RUN  ') + s.id);
    return 0;
  }

  const esbuildDir = esbuildNodePath();
  const env = { ...process.env };
  if (esbuildDir) {
    env.NODE_PATH = esbuildDir + (env.NODE_PATH ? path.delimiter + env.NODE_PATH : '');
  }

  const startedAt = new Date().toISOString();
  const results = suites.map((s) => runSuite(s, env));
  const finishedAt = new Date().toISOString();

  const totals = {
    suites: results.length,
    suitesPassed: 0,
    suitesFailed: 0,
    suitesSkipped: 0,
    pass: 0,
    fail: 0,
    skip: 0,
  };
  for (const r of results) {
    if (r.status === 'pass') totals.suitesPassed++;
    else if (r.status === 'fail') totals.suitesFailed++;
    else totals.suitesSkipped++;
    totals.pass += r.counts.pass;
    totals.fail += r.counts.fail;
    totals.skip += r.counts.skip;
  }
  const verdict = totals.suitesFailed > 0 ? 'FAIL' : 'PASS';

  const report = {
    generated: true,
    generator: 'scripts/track-b/b-w7-regression-battery.js',
    schema: 'b-w7-regression-report/1',
    repoRoot: ROOT,
    baseCommit: baseCommit(),
    startedAt,
    finishedAt,
    nodeVersion: process.version,
    esbuildNodePath: esbuildDir,
    suites: results,
    totals,
    verdict,
  };

  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2) + '\n');

  // human-readable summary
  console.log('B-W7 regression battery — Track B visual slice');
  console.log('base: ' + report.baseCommit + '   node: ' + process.version);
  for (const r of results) {
    const c = r.counts;
    const extra = r.status === 'skipped' ? ' — ' + r.skipReason : '';
    console.log(
      `[${r.status.toUpperCase()}] ${r.id} (pass=${c.pass} fail=${c.fail} skip=${c.skip} ${r.durationMs}ms)${extra}`
    );
  }
  console.log(
    `suites: ${totals.suites} (passed=${totals.suitesPassed} failed=${totals.suitesFailed} skipped=${totals.suitesSkipped}) ` +
      `tests: pass=${totals.pass} fail=${totals.fail} skip=${totals.skip}`
  );
  if (totals.suitesSkipped > 0) {
    const bar = '='.repeat(70);
    console.log(bar);
    console.log(
      `NOTICE: ${totals.suitesSkipped} suite(s) SKIPPED — the visual smoke did not run. ` +
        'A skipped suite is not a pass; see skipReason in the report.'
    );
    console.log(bar);
  }
  console.log('report: ' + REPORT_PATH);
  console.log('VERDICT: ' + verdict + ' (tests green on this tree — not "certified")');

  return verdict === 'PASS' ? 0 : 1;
}

process.exit(main());
