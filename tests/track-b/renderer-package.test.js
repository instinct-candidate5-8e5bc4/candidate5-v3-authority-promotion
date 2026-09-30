'use strict';
// TRACK B / B-W10 evidence: embeddable read-only renderer package.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execSync}=require('node:child_process'),
 ROOT=path.join(__dirname,'../..'),VS=path.join(ROOT,'visual-slice'),PKG=path.join(VS,'package');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
test('API surface is exactly the ordered read-only set - no mutation/commit exports',()=>{
 const src=fs.readFileSync(path.join(PKG,'renderer-package.mjs'),'utf8');
 const names=[...src.matchAll(/^export (?:async function|function|const) (\w+)/gm)].map(x=>x[1]).sort();
 assert.deepEqual(names,['PACKAGE_API_VERSION','mount','renderFromProjection','renderPhysicalProjection','status','unmount','validatePlacement']);
 for(const n of names)assert(!/commit|mutate|propose|session|world/i.test(n),'forbidden export '+n);
 assert(!src.includes('export function createDemoSession')&&!src.includes('export const createDemoSession'),'demo commit path must not be re-exported')});
test('asset manifest is byte-exact against the COMMITTED tree (what Pages serves) and covers every package asset',()=>{
 const m=JSON.parse(fs.readFileSync(path.join(PKG,'asset-manifest.json'),'utf8'));
 assert(m.assets.length>=12);
 const committedBytes=rel=>{try{return execSync('git show HEAD:visual-slice/'+rel,{cwd:ROOT,stdio:['pipe','pipe','ignore']})}catch{return fs.readFileSync(path.join(VS,rel))}};
 for(const a of m.assets){const buf=committedBytes(a.path);
  assert.equal(buf.length,a.bytes,a.path+' size');
  assert.equal(crypto.createHash('sha256').update(buf).digest('hex'),a.sha256,a.path+' sha256');}
 for(const required of ['package/renderer-package.mjs','entity-body-map.json','scene-bundle.json','engine-bundle.js'])
  assert(m.assets.some(a=>a.path===required),'manifest missing '+required)});
test('build stamp carries source commit and module/manifest digests; build is reproducible',()=>{
 const b=JSON.parse(fs.readFileSync(path.join(PKG,'package-build.json'),'utf8'));
 assert.match(b.commit,/^[0-9a-f]{40}$/);
 assert.equal(b.moduleSha256,sha(path.join(PKG,'renderer-package.mjs')));
 assert.equal(b.manifestSha256,sha(path.join(PKG,'asset-manifest.json')));
 execSync('node scripts/track-b/build-renderer-package.js',{cwd:ROOT});
 const b2=JSON.parse(fs.readFileSync(path.join(PKG,'package-build.json'),'utf8'));
 assert.equal(b2.moduleSha256,b.moduleSha256);assert.equal(b2.manifestSha256,b.manifestSha256)});
test('gate statuses carry the detailed correction record; stale casualty label explicitly superseded',()=>{
 const g=JSON.parse(fs.readFileSync(path.join(PKG,'gate-statuses.json'),'utf8'));
 assert.equal(g.statuses.casualty.reviewId,'gate-b-user-review-ee04481');
 assert.equal(g.statuses.casualty.reviewDecision,'APPROVED_FOR_SLICE');
 assert.equal(g.statuses.chair.reviewId,'gate-c-user-review-0c27c92');
 assert.equal(g.superseded.length,1);
 assert.equal(g.superseded[0].entityId,'school-casualty-adult-v1');
 assert(g.superseded[0].supersededLabel.includes('NOT VERIFIED_FOR_SLICE'))});
test('projection guard: fail-closed on every hostile shape, allowlists enforced',async()=>{
 const {validateProjection,CUES}=await import(path.join(PKG,'projection-guard.mjs'));
 const map=JSON.parse(fs.readFileSync(path.join(VS,'entity-body-map.json'),'utf8'));
 const {buildVisualSceneDescriptor}=require('../../src/clean-runtime/school/scene-v2/visual-descriptor');
 const {buildVisualCasualty}=require('../../src/clean-runtime/school/scene-v2/visual-casualty');
 const {buildVisualEquipment}=require('../../src/clean-runtime/school/scene-v2/visual-equipment');
 const {buildArticulatedLayout}=await import(path.join(VS,'articulated-layout.mjs'));
 const d=buildVisualSceneDescriptor();
 const layout=buildArticulatedLayout(buildVisualCasualty(d),buildVisualEquipment(d));
 const bt={'pub-casualty-1':'school-casualty-adult-v1','pub-bag-1':'school-medical-bag'};
 const ok=validateProjection({kind:'TRACK_B_PUBLIC_PROJECTION',contractVersion:'0.2',cue:'SYNTHETIC_ACTION_COMPLETED',
  entities:[{publicRef:'pub-casualty-1',highlightComponentIds:['head'],visiblePoseCode:'SUPINE_FLOOR',findingText:'x'}]},{bindingTable:bt,map,layout});
 assert.equal(ok.ok,true);assert.equal(ok.actions.length,3);
 const bad=[
  {kind:'TRACK_B_PUBLIC_PROJECTION',contractVersion:'0.2',entities:[{publicRef:'nobody',highlightComponentIds:['head']}]},
  {kind:'TRACK_B_PUBLIC_PROJECTION',contractVersion:'0.2',entities:[{publicRef:'pub-casualty-1',highlightComponentIds:['jetpack']}]},
  {kind:'TRACK_B_PUBLIC_PROJECTION',contractVersion:'0.2',cue:'FLY_AWAY',entities:[]},
  {kind:'TRACK_B_PUBLIC_PROJECTION',contractVersion:'0.2',entities:[{publicRef:'pub-casualty-1',visiblePoseCode:'RUNNING'}]},
  {kind:'TRACK_B_PUBLIC_PROJECTION',contractVersion:'0.2',entities:[{publicRef:'pub-bag-1',visibleLocationCode:'ON_THE_MOON'}]},
  {kind:'TRACK_B_PUBLIC_PROJECTION',contractVersion:'0.2',entities:[{publicRef:'pub-casualty-1',findingText:'x'.repeat(501)}]},
  {kind:'WRONG_KIND',contractVersion:'0.2',entities:[]}];
 for(const b of bad){const r=validateProjection(b,{bindingTable:bt,map,layout});assert.equal(r.ok,false,r)}
 // No binding table at all = no visual action.
 assert.equal(validateProjection(ok&&{kind:'TRACK_B_PUBLIC_PROJECTION',contractVersion:'0.2',entities:[]},{bindingTable:null,map,layout}).ok,false);
 assert(CUES.includes('NONE')&&CUES.length===5)});
test('validatePlacement path: propose-only via discarded session, engine semantics intact',async()=>{
 const ENGINE=await import(path.join(VS,'engine-bundle.js'));
 const live=ENGINE.buildVisualSceneDescriptor();
 const srcRel=structuredClone(live.supportRelations.find(r=>r.relationId==='school:bag:floor'));
 const s=ENGINE.createDemoSession();
 const legal=s.proposeBagPlacement({transactionId:'t:legal:1',positionMicrounits:[-1200000,175000,1000000],relation:srcRel});
 assert.equal(legal.status,'COMMITTED');
 const s2=ENGINE.createDemoSession();
 const wall=s2.proposeBagPlacement({transactionId:'t:wall:1',positionMicrounits:[0,175000,-3900000],relation:structuredClone(srcRel)});
 assert.notEqual(wall.status,'COMMITTED');
 // Certified world on disk untouched by in-memory sessions.
 assert.equal(ENGINE.buildVisualSceneDescriptor().worldRef.stateDigest,'fa1bbaa985a63a8bfa30c2bbd7fbaf14b2c4972d985815a093bdd68f7fe954ea')});
