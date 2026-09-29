'use strict';
// TRACK B / B-W5 evidence: entity<->physical body mapping table.
// Table-driven resolution ONLY; fail-closed on the unmapped; synthetic
// training entities can NEVER resolve to a clinical body region; medical
// meaning of examine(head/airway/chest/wrist/abdomen/leg) stays frozen and
// engine-owned (owner Option A constraints).
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{execSync}=require('node:child_process'),
 ROOT=path.join(__dirname,'../..'),
 {buildVisualSceneDescriptor}=require('../../src/clean-runtime/school/scene-v2/visual-descriptor'),
 {buildVisualCasualty}=require('../../src/clean-runtime/school/scene-v2/visual-casualty'),
 {buildVisualEquipment}=require('../../src/clean-runtime/school/scene-v2/visual-equipment'),
 {buildVisualSurfaceSet}=require('../../src/clean-runtime/school/scene-v2/visual-surfaces');
const MAP_PATH=path.join(ROOT,'visual-slice/scene-bundle.json').replace('scene-bundle.json','entity-body-map.json');
const readMap=()=>JSON.parse(fs.readFileSync(MAP_PATH,'utf8'));
const resolver=()=>import(path.join(ROOT,'visual-slice/entity-map.mjs'));
const ANCHORS={sourcePackageDigest:'187cf1a4c0af01ef12087879f44eeb88a355499a860665e29cdb2f5ab0d06aec',
 worldStateDigest:'fa1bbaa985a63a8bfa30c2bbd7fbaf14b2c4972d985815a093bdd68f7fe954ea',
 descriptorDigest:'5f6829b7b10bbbc91ff0bd7e66bd5de3c69473091d56af92f8decbc8cbecaa18',
 pin:'6e9878bd1640b2747e8db52237843a8fd75f878e5dc6e162646c4971e85d99c5'};
test('committed map is reproducible from the live certified builders and carries the certified anchors',async()=>{
 execSync('node scripts/track-b/build-entity-map.js',{cwd:ROOT});
 const m=readMap(),d=buildVisualSceneDescriptor(),c=buildVisualCasualty(d),e=buildVisualEquipment(d),s=buildVisualSurfaceSet();
 assert.equal(m.anchors.sourcePackageDigest,ANCHORS.sourcePackageDigest);
 assert.equal(m.anchors.worldStateDigest,ANCHORS.worldStateDigest);
 assert.equal(m.anchors.descriptorDigest,ANCHORS.descriptorDigest);
 assert.equal(m.anchors.surfaceModelPin.sha256,ANCHORS.pin);
 assert.equal(m.entities['school-casualty-adult-v1'].sourceAnchor.visualDigest,c.visualDigest);
 assert.equal(m.entities['school-treatment-chair'].sourceAnchor.visualDigest,e.visualDigest);
 assert.equal(m.entities['school-medical-bag'].sourceAnchor.visualDigest,e.visualDigest);
 assert.equal(m.entities['school-treatment-room-v1'].sourceAnchor.surfaceSetDigest,s.setDigest);
 const v=await resolver();
 assert.deepEqual(v.validateMap(m),{ok:true,errors:[]})});
test('every renderable entity resolves table-driven with body record, layout group and bounds',async()=>{
 const m=readMap(),v=await resolver();
 for(const id of ['school-casualty-adult-v1','school-treatment-chair','school-medical-bag']){
  const e=v.resolveEntity(m,id);
  assert(e,id+' must resolve');
  assert.equal(e.physicalBodyRef.digest,m.entities[id].sourceAnchor.bodyDigest);
  assert(['casualty','chair','bag'].includes(e.layoutGroup));
  for(const k of ['minX','maxX','minY','maxY','minZ','maxZ'])assert(Number.isInteger(e.boundsMicrounits[k]),id+' bounds.'+k);}
 const room=v.resolveEntity(m,'school-treatment-room-v1');
 assert(room&&room.entryType==='ENVIRONMENT'&&room.layoutGroup==='room')});
test('fail-closed: unknown or unmapped entity = NO visual action, never a default',async()=>{
 const m=readMap(),v=await resolver();
 assert.equal(v.resolveEntity(m,'school-casualty-adult-v2'),null);
 assert.equal(v.resolveEntity(m,''),null);
 assert.equal(v.resolveEntity(m,undefined),null);
 assert.equal(v.resolveEntity({},'school-casualty-adult-v1'),null);
 assert.equal(v.resolveEntity(null,'school-casualty-adult-v1'),null)});
test('synthetic-training entries can NEVER resolve to a clinical body region or subject',async()=>{
 const m=readMap(),v=await resolver();
 // Committed map currently defines NO synthetic entry; if one is ever added it must stay clean.
 for(const [id,e]of Object.entries(m.entities))if(e.entryType==='SYNTHETIC_TRAINING'){
  for(const f of ['clinicalBodyRegion','bodyRegions','clinicalSubject','medicalAction'])assert(!(f in e),id+' carries '+f);
  assert.equal(v.clinicalSubjectOf(m,id),null)}
 // Fixture: a labeled synthetic entry validates, and clinical resolution is structurally null.
 const fx=JSON.parse(JSON.stringify(m));
 fx.entities['synthetic-training-prop-v1']={entityId:'synthetic-training-prop-v1',entryType:'SYNTHETIC_TRAINING',layoutGroup:'synthetic',
  physicalBodyRef:{recordId:'synthetic/training-prop',revision:1,digest:'0'.repeat(64)},
  boundsMicrounits:{minX:0,maxX:100000,minY:0,maxY:100000,minZ:0,maxZ:100000},
  sourceAnchor:{note:'engine-introduced synthetic bridge entity (Option A); no clinical lineage'}};
 assert.equal(v.validateMap(fx).ok,true);
 assert.equal(v.clinicalSubjectOf(fx,'synthetic-training-prop-v1'),null);
 // Tampered fixture: synthetic entry carrying clinical meaning is REJECTED by validation.
 const bad=JSON.parse(JSON.stringify(fx));
 bad.entities['synthetic-training-prop-v1'].clinicalBodyRegion='chest';
 const r=v.validateMap(bad);
 assert.equal(r.ok,false);
 assert(r.errors.some(x=>x.includes('SYNTHETIC_TRAINING')&&x.includes('clinicalBodyRegion')))});
test('clinical meaning stays frozen and engine-owned: no visual region semantics anywhere',async()=>{
 const m=readMap(),v=await resolver();
 const cas=v.clinicalSubjectOf(m,'school-casualty-adult-v1');
 assert(cas,'casualty must be the sole clinical subject');
 assert.equal(cas.clinicalSemantics.owner,'AUTHORITATIVE_ENGINE');
 assert(!('bodyRegions' in cas),'visual layer must not define region semantics');
 // Equipment and environment never resolve as clinical subjects.
 for(const id of ['school-treatment-chair','school-medical-bag','school-treatment-room-v1'])
  assert.equal(v.clinicalSubjectOf(m,id),null)});
