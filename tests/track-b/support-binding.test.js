'use strict';
// TRACK B / B-W6 evidence: declarative support/placement binding case suite.
// The demo's three buttons are a special case of this table. Every case runs
// through the certified Geometry Gate in a throwaway in-memory session; each
// case runs TWICE and must be bit-identical (deterministic). The certified
// world on disk is never touched (verified at the end).
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),
 ROOT=path.join(__dirname,'../..'),
 TABLE=JSON.parse(fs.readFileSync(path.join(ROOT,'tests/track-b/support-binding-cases.json'),'utf8'));
const reasonOf=r=>{const e=r.evidence&&r.evidence.detail&&r.evidence.detail.evidence;return (e&&e.phase2ReasonCode)||''};
test('support/placement case table: exact gate outcomes, deterministic, world untouched',async()=>{
 const ENGINE=await import(path.join(ROOT,'visual-slice/engine-bundle.js'));
 const live=ENGINE.buildVisualSceneDescriptor();
 assert.equal(live.worldRef.stateDigest,TABLE.baseWorldDigest);
 const srcRel=live.supportRelations.find(r=>r.relationId==='school:bag:floor');
 const chair=live.entities.find(e=>e.entityId==='school-treatment-chair');
 const relations={
  'floor-src':()=>structuredClone(srcRel),
  'chair-seat-derived':()=>{const ss=chair.physicalState.supportSurface;
   return {...structuredClone(srcRel),supportSourceKind:'ENTITY_OWNED',surfaceModelRef:undefined,surfaceId:undefined,expectedSurfaceType:undefined,
    ownerEntityRef:{id:'school-treatment-chair',revision:chair.revision},
    ownerBodyRef:{id:chair.physicalBodyRef.recordId,revision:chair.physicalBodyRef.revision,digest:chair.physicalBodyRef.digest},
    supportSurfaceRef:{id:ss.supportSurfaceId,revision:ss.surfaceRevision,digest:ss.canonicalDigest},
    capabilityId:'full-footprint-chair-seat',contactNormal:{x:0,y:1,z:0},evidenceRefs:['gate-c-chair-authoring-001','phase2-v1-full-body-contact']}}};
 assert(TABLE.cases.length>=7,'positive + negative coverage');
 for(const c of TABLE.cases){
  const run=()=>{const s=ENGINE.createDemoSession();
   return s.proposeBagPlacement({transactionId:'b-w6:'+c.caseId+':1',positionMicrounits:c.positionMicrounits,relation:relations[c.relationKind]()})};
  const a=run(),b=run();
  assert.equal(a.status,c.expect.status,c.caseId+' status');
  if(c.expect.code)assert.equal(a.code,c.expect.code,c.caseId+' code');
  else assert(!a.code||a.code==='OK',c.caseId+' unexpected code '+a.code);
  if(c.expect.reasonCode)assert.equal(reasonOf(a),c.expect.reasonCode,c.caseId+' reason');
  assert(a.stateDigest.startsWith(c.expect.stateDigest),c.caseId+' state digest');
  assert.equal(a.priorStateDigest,TABLE.baseWorldDigest,c.caseId+' prior digest');
  // Deterministic repeat: bit-identical.
  assert.equal(a.status,b.status);assert.equal(a.code,b.code);
  assert.equal(a.stateDigest,b.stateDigest);assert.equal(a.priorStateDigest,b.priorStateDigest);
  assert.equal(reasonOf(a),reasonOf(b));}
 // Certified world on disk untouched by the in-memory sessions.
 assert.equal(ENGINE.buildVisualSceneDescriptor().worldRef.stateDigest,TABLE.baseWorldDigest)});
