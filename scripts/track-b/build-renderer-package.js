'use strict';
// TRACK B / B-W10 build step: emits the renderer package's generated
// artifacts - gate-statuses.json (detailed correction record + superseded
// labels), asset-manifest.json (exact served asset list, byte SHA-256),
// package-build.json (source commit + module/manifest digests).
// Additive only: no served demo byte is touched.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execSync}=require('node:child_process');
const ROOT=path.join(__dirname,'../..'),VS=path.join(ROOT,'visual-slice'),PKG=path.join(VS,'package');
// Hash the bytes Pages will serve: the committed blob for files tracked at
// HEAD (immune to builder-regenerated working-tree dirt), the working tree
// for files not yet committed (first build).
const blobOrFile=rel=>{try{return execSync('git show HEAD:visual-slice/'+rel,{cwd:ROOT,stdio:['pipe','pipe','ignore']})}catch{return fs.readFileSync(path.join(VS,rel))}};
const shaRel=rel=>crypto.createHash('sha256').update(blobOrFile(rel)).digest('hex');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
function git(cmd){try{return execSync('git '+cmd,{cwd:ROOT,encoding:'utf8'}).trim()}catch{return 'UNKNOWN'}}
// 1. Gate statuses: the DETAILED lifecycle correction record, with the stale
//    per-entity provisional label explicitly marked superseded. Never infer
//    status from banner or registry-note text.
const corr=JSON.parse(fs.readFileSync(path.join(ROOT,'docs/track-b/lifecycle-status-correction.json'),'utf8'));
const gateStatuses={kind:'TRACK_B_PACKAGE_GATE_STATUSES',correctionVersion:corr.correctionVersion,issued:corr.issued,
 sourceRecord:'docs/track-b/lifecycle-status-correction.json',
 statuses:{casualty:corr.casualty,chair:corr.chair},
 superseded:[{entityId:'school-casualty-adult-v1',
  supersededLabel:'NOT VERIFIED_FOR_SLICE / provisional (per-entity statusCaveat still carried by scene-bundle.json and the engine builders)',
  supersededBy:'docs/track-b/lifecycle-status-correction.json',
  note:'Historical label. Status-only presentation overlay per the owner separable-overlay ruling; engine builder bytes intentionally unchanged. The correction record above is the authoritative status source for this package.'}],
 policy:'Statuses come ONLY from the detailed correction record. Banner text and registry notes are never a status source.'};
fs.writeFileSync(path.join(PKG,'gate-statuses.json'),JSON.stringify(gateStatuses,null,1));
// 2. Asset manifest: every asset the package loads/serves, byte-exact.
const LOCAL=['package/renderer-package.mjs','package/projection-guard.mjs','package/committed-world-guard.mjs','package/presentation-guard.mjs','package/procedural-room.mjs','package/gate-statuses.json','presentation-manifest.json',
 'entity-map.mjs','entity-body-map.json','articulated-layout.mjs','camera-lighting.mjs',
 'engine-bundle.js','scene-bundle.json','engine/pins.json',
 'engine/vendor/js-sha256.mjs','engine/vendor/js-sha256.LICENSE.txt'];
const assets=LOCAL.map(rel=>{const buf=blobOrFile(rel);return{path:rel,bytes:buf.length,sha256:shaRel(rel)}});
const manifest={manifestVersion:'1.0.0',kind:'TRACK_B_PACKAGE_ASSET_MANIFEST',
 policy:'Every asset the embeddable package loads, pinned byte-exact. Host verifies before consuming; unverifiable pin = host refuses.',
 assets,
 externalImports:[{url:'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js',note:'host importmap, version-pinned'},
  {url:'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js',note:'host importmap, version-pinned'}]};
fs.writeFileSync(path.join(PKG,'asset-manifest.json'),JSON.stringify(manifest,null,1));
// 3. Build stamp.
const build={kind:'TRACK_B_PACKAGE_BUILD',apiVersion:'1.0.0',commit:git('rev-parse HEAD'),branch:git('rev-parse --abbrev-ref HEAD'),
 builtAt:new Date().toISOString(),moduleSha256:shaRel('package/renderer-package.mjs'),manifestSha256:shaRel('package/asset-manifest.json')};
fs.writeFileSync(path.join(PKG,'package-build.json'),JSON.stringify(build,null,1));
console.log('READY package artifacts:',build.commit.slice(0,8),'assets:',assets.length);
