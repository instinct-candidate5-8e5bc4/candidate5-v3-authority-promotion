'use strict';
// TRACK B / B-W11 evidence: interim synthetic-unit presentation bridge (contract v0.3).
// Presentation-only, explicitly UNCERTIFIED until Gate A admission. Proves:
// guard admits v0.3 use-state codes ONLY for SYNTHETIC_TRAINING-bound entities,
// unknown contract versions fail closed, and the map entry carries zero clinical authority.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),
 ROOT=path.join(__dirname,'../..'),VS=path.join(ROOT,'visual-slice');
async function load(){const g=await import(path.join(VS,'package','projection-guard.mjs'));
 const map=JSON.parse(fs.readFileSync(path.join(VS,'entity-body-map.json'),'utf8'));
 const{buildVisualSceneDescriptor}=require('../../src/clean-runtime/school/scene-v2/visual-descriptor');
 const{buildVisualCasualty}=require('../../src/clean-runtime/school/scene-v2/visual-casualty');
 const{buildVisualEquipment}=require('../../src/clean-runtime/school/scene-v2/visual-equipment');
 const{buildArticulatedLayout}=await import(path.join(VS,'articulated-layout.mjs'));
 const d=buildVisualSceneDescriptor();
 const layout=buildArticulatedLayout(buildVisualCasualty(d),buildVisualEquipment(d));
 return{g,map,layout}}
const BT={'pub-casualty-1':'school-casualty-adult-v1','pub-bag-1':'school-medical-bag','pub-synthetic-unit-1':'synthetic-training-unit-v1'};
test('v0.3: use-state codes apply only to the synthetic unit; cue/location/highlight unchanged',async()=>{
 const{g,map,layout}=await load();
 const ok=g.validateProjection({kind:'TRACK_B_PUBLIC_PROJECTION',contractVersion:'0.3',cue:'SYNTHETIC_ACTION_COMPLETED',
  entities:[{publicRef:'pub-synthetic-unit-1',publicUseState:'RESERVED'},{publicRef:'pub-bag-1',visibleLocationCode:'IN_BAG'?undefined:'FLOOR_BESIDE_CHAIR'}]},{bindingTable:BT,map,layout});
 assert.equal(ok.ok,true,ok.reason);
 assert(ok.actions.some(a=>a.type==='useState'&&a.entityId==='synthetic-training-unit-v1'&&a.code==='RESERVED'));
 for(const st of['AVAILABLE','RESERVED','CONSUMED'])
  assert.equal(g.validateProjection({kind:'TRACK_B_PUBLIC_PROJECTION',contractVersion:'0.3',entities:[{publicRef:'pub-synthetic-unit-1',publicUseState:st}]},{bindingTable:BT,map,layout}).ok,true,st);});
test('v0.3 hostile rejections: unknown version, use-state on clinical/equipment entities, unknown use-state',async()=>{
 const{g,map,layout}=await load();
 const r=g.validateProjection({kind:'TRACK_B_PUBLIC_PROJECTION',contractVersion:'9.9',entities:[]},{bindingTable:BT,map,layout});
 assert.equal(r.ok,false);assert.match(r.reason,/unknown contractVersion/);
 for(const ref of['pub-casualty-1','pub-bag-1']){
  const x=g.validateProjection({kind:'TRACK_B_PUBLIC_PROJECTION',contractVersion:'0.3',entities:[{publicRef:ref,publicUseState:'RESERVED'}]},{bindingTable:BT,map,layout});
  assert.equal(x.ok,false,ref);assert.match(x.reason,/non-synthetic/);}
 const u=g.validateProjection({kind:'TRACK_B_PUBLIC_PROJECTION',contractVersion:'0.3',entities:[{publicRef:'pub-synthetic-unit-1',publicUseState:'EXPLODED'}]},{bindingTable:BT,map,layout});
 assert.equal(u.ok,false);assert.match(u.reason,/unknown use state/);});
test('synthetic unit map entry: presentation-only, zero clinical fields, bounds = Gate A R1 draft',()=>{
 const map=JSON.parse(fs.readFileSync(path.join(VS,'entity-body-map.json'),'utf8'));
 const e=map.entities['synthetic-training-unit-v1'];
 assert.equal(e.entryType,'SYNTHETIC_TRAINING');
 assert.equal(e.gateAStatus,'PROPOSED_NOT_ADMITTED');
 assert.equal(e.presentationOnly,true);
 assert.equal(e.physicalBodyRef,null);
 for(const f of['clinicalBodyRegion','bodyRegions','clinicalSubject'])assert(!(f in e),'forbidden clinical field '+f);
 assert.deepEqual(e.boundsMicrounits,{minX:-100000,maxX:100000,minY:0,maxY:120000,minZ:-40000,maxZ:40000});
 assert.equal(e.sourceAnchor.proposalDoc,'docs/track-b/gate-a-synthetic-unit-visual-asset-proposal.md');});
test('v0.2 contract remains accepted (back-compat) and missing version still fails',async()=>{
 const{g,map,layout}=await load();
 assert.equal(g.validateProjection({kind:'TRACK_B_PUBLIC_PROJECTION',contractVersion:'0.2',cue:'NONE',entities:[]},{bindingTable:BT,map,layout}).ok,true);
 assert.equal(g.validateProjection({kind:'TRACK_B_PUBLIC_PROJECTION',entities:[]},{bindingTable:BT,map,layout}).ok,false);});
