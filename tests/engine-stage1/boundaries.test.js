'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const ROOT = path.join(__dirname, '../..');
const SRC = path.join(ROOT, 'src/engine-stage1');

function walk(d) {
  return fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
}
const files = walk(SRC).filter((f) => f.endsWith('.js'));
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

test('every certified file at 127f284 is byte-identical (SHA-256 manifest)', () => {
  const m = JSON.parse(fs.readFileSync(path.join(__dirname, 'certified-manifest-127f284.json'), 'utf8'));
  assert.equal(m.baseCommit, '127f284d78b83f358f076b3ee8f8b56044bcc691');
  assert.equal(Object.keys(m.files).length, 650);
  const changed = Object.entries(m.files).filter(([p, h]) => !fs.existsSync(path.join(ROOT, p)) || crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, p))).digest('hex') !== h);
  assert.deepEqual(changed, []);
});

test('engine never reads host clock or host randomness, and makes no network calls', () => {
  for (const f of files) {
    const s = strip(fs.readFileSync(f, 'utf8'));
    for (const bad of ['Date.now', 'new Date', 'performance.now', 'Math.random', 'fetch(', 'XMLHttpRequest', 'WebSocket', 'process.hrtime', 'setTimeout', 'setInterval']) assert(!s.includes(bad), path.relative(ROOT, f) + ' uses ' + bad);
  }
});

test('engine has no dependency on llm-worker, the legacy index.html or legacy nextgen modules', () => {
  for (const f of files) {
    const s = strip(fs.readFileSync(f, 'utf8'));
    for (const bad of ['llm', 'index.html', 'nextgen', 'KoRishon']) assert(!s.includes(bad), path.relative(ROOT, f) + ' references ' + bad);
  }
});

test('engine imports certified modules read-only and never touches the world store writer', () => {
  const allowed = new Set([
    '../../clean-runtime/contracts/canonical',
    '../../clean-runtime/school/scene-v2/instantiate',
    '../../clean-runtime/school/scene-v2/package',
    '../../clean-runtime/school/scene-v2/validate',
    '../../clean-runtime/school/school-geometry-adapter',
    '../../clean-runtime/multi-support/runtime',
    '../../clean-runtime/events/replay',
    '../../clean-runtime/contracts/world-state',
  ]);
  for (const f of files) {
    const s = strip(fs.readFileSync(f, 'utf8'));
    for (const m of s.matchAll(/require\('([^']+)'\)/g)) {
      const spec = m[1];
      if (spec.includes('clean-runtime')) assert(allowed.has(spec), path.relative(ROOT, f) + ' imports ' + spec);
      else if (spec.startsWith('.')) assert(path.resolve(path.dirname(f), spec).startsWith(SRC), path.relative(ROOT, f) + ' imports outside engine: ' + spec);
      else assert(spec.startsWith('node:'), 'external package ' + spec);
    }
    for (const bad of ['writer', 'createInternalWorldStore', '.commit(', 'world-store']) assert(!s.includes(bad), path.relative(ROOT, f) + ' uses ' + bad);
  }
});

test('male-only: no female names, roles or legacy female arrays in engine code or content', () => {
  const legacy = ['שרה', 'רחל', 'מרים', 'לקוחה', 'עמיתה', 'קופאית', 'female', 'FEMALE_'];
  for (const f of files) {
    const s = fs.readFileSync(f, 'utf8');
    for (const w of legacy) assert(!s.includes(w) || f.endsWith('scenario-version.js'), path.relative(ROOT, f) + ' contains ' + w);
  }
});

test('no childbirth content and no paid or external service references', () => {
  for (const f of files) {
    const s = fs.readFileSync(f, 'utf8');
    for (const w of ['api_key', 'apiKey', 'https://', 'http://']) assert(!s.includes(w), path.relative(ROOT, f) + ' contains ' + w);
    if (!f.endsWith('scenario-version.js')) assert(!/childbirth|לידה/.test(s), path.relative(ROOT, f));
  }
});

test('Stage 1 adds files only under the approved paths', () => {
  const m = JSON.parse(fs.readFileSync(path.join(__dirname, 'certified-manifest-127f284.json'), 'utf8'));
  const tracked = new Set(Object.keys(m.files));
  const extra = [...walk(path.join(ROOT, 'src')), ...walk(path.join(ROOT, 'tests'))].map((f) => path.relative(ROOT, f)).filter((p) => !tracked.has(p));
  for (const p of extra) assert(p.startsWith('src/engine-stage1/') || p.startsWith('tests/engine-stage1/'), 'unexpected new file ' + p);
});
