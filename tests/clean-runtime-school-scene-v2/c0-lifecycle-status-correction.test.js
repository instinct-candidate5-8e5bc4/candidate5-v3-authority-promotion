'use strict';
// TRACK B / lifecycle STATUS correction (acceptance spec A): the correction is
// a SEPARABLE byte diff - docs/track-b record + bundle status fields + page
// status text. Engine sources, evidence, pins and ALL anchors stay unchanged.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const ROOT=path.join(__dirname,'../..');
const correction=JSON.parse(fs.readFileSync(path.join(ROOT,'docs/track-b/lifecycle-status-correction.json'),'utf8'));
const bundle=JSON.parse(fs.readFileSync(path.join(ROOT,'visual-slice/scene-bundle.json'),'utf8'));
test('correction reviewIds match the grounded lifecycle records exactly',()=>{
 const cas=JSON.parse(fs.readFileSync(path.join(ROOT,'evidence/clean-runtime/gate-a2-admission/exact-review.json'),'utf8'));
 assert.equal(correction.casualty.reviewId,cas.reviewId);
 assert.equal(cas.decision,'APPROVED_FOR_SLICE');
 assert.match(cas.scope,/adult-v1\|MALE\|SUPINE_FLOOR/);
 const chr=JSON.parse(fs.readFileSync(path.join(ROOT,'evidence/clean-runtime/gate-c-admission/gate-result.json'),'utf8'));
 assert.equal(correction.chair.reviewId,chr.reviewId);
 assert.equal(chr.result,'PASS');
 assert.equal(chr.body.lifecycle,'VERIFIED_FOR_SLICE')});
test('anchors UNCHANGED by the status correction',()=>{
 assert.equal(bundle.inputs.sourcePackageDigest,'187cf1a4c0af01ef12087879f44eeb88a355499a860665e29cdb2f5ab0d06aec');
 assert.equal(bundle.inputs.worldStateDigest,'fa1bbaa985a63a8bfa30c2bbd7fbaf14b2c4972d985815a093bdd68f7fe954ea');
 assert.equal(bundle.inputs.descriptorDigest,'5f6829b7b10bbbc91ff0bd7e66bd5de3c69473091d56af92f8decbc8cbecaa18');
 assert.equal(bundle.inputs.casualtyDigest,'efe6bd00ebbc4aeb13cf219d3aa1a81258b6b2f6ae2f109eb5f4c44850a535d9');
 assert.equal(bundle.inputs.equipmentDigest,'e97a9d885f0c431fe36fac51461d330ef20503b72ecbb2f8ca7fc27b8dcb1770')});
test('bundle status fields carry VERIFIED_FOR_SLICE + reviewIds (overlay, not engine bytes)',()=>{
 for(const k of ['casualty','chair']){
  assert.equal(bundle.statusCaveats[k].gateResult,'VERIFIED_FOR_SLICE');
  assert.equal(bundle.statusCaveats[k].verifiedForSlice,true);
  assert.equal(bundle.statusCaveats[k].reviewId,correction[k].reviewId);
  assert.match(bundle.statusCaveats[k].caveat,/within its recorded review scope/,'scope-accurate wording')}
 assert.equal(bundle.statusCorrection.kind,'TRACK_B_LIFECYCLE_STATUS_CORRECTION');
 assert.match(bundle.statusCorrection.hardStop,/HISTORICAL RECORD/)});
test('engine builders still carry the original provisional labels (byte separation)',()=>{
 const {buildVisualSceneDescriptor}=require(path.join(ROOT,'src/clean-runtime/school/scene-v2/visual-descriptor.js'));
 const d=buildVisualSceneDescriptor();
 assert.equal(d.statusCaveats.casualty.gateResult,'PASS_PENDING_LIFECYCLE_REVIEW','engine bytes unchanged - correction lives only at the presentation layer');
 assert.equal(d.descriptorDigest,'5f6829b7b10bbbc91ff0bd7e66bd5de3c69473091d56af92f8decbc8cbecaa18')});
