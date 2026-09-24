'use strict';
// TRACK B / C2 geometric gates (G1-G5, G13) - host-independent, computed from
// integer-microunit world-state AABBs, never from pixels.
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const ROOT=path.join(__dirname,'../..');
const {buildVisualSceneDescriptor}=require(path.join(ROOT,'src/clean-runtime/school/scene-v2/visual-descriptor.js'));
const {buildVisualCasualty}=require(path.join(ROOT,'src/clean-runtime/school/scene-v2/visual-casualty.js'));
const {buildVisualEquipment}=require(path.join(ROOT,'src/clean-runtime/school/scene-v2/visual-equipment.js'));
const bundle=require(path.join(ROOT,'visual-slice/scene-bundle.json'));
const d=buildVisualSceneDescriptor(),casualty=buildVisualCasualty(d),equipment=buildVisualEquipment(d);
let layout,partAabb,aabbContains,aabbOverlaps;
test.before(async()=>{const m=await import(path.join(ROOT,'visual-slice/articulated-layout.mjs'));layout=m.buildArticulatedLayout(casualty,equipment);partAabb=m.partAabb;aabbContains=m.aabbContains;aabbOverlaps=m.aabbOverlaps});
const room=Object.fromEntries(bundle.room.map(s=>[s.visualSurfaceId,s.geometryMicrounits]));
const FLOOR_TOP=room['visual:floor'].maxY;
test('G1 supine contact: every floor-contact casualty component rests on the floor plane, zero gap/penetration',()=>{
 assert.ok(casualty.components.length>=5);
 for(const c of casualty.components)if(c.floorContact)assert.equal(c.worldAabbMicrounits.minY,FLOOR_TOP,c.componentId)});
test('G2 seated support: chair legs on floor, seat carried by frame, backrest anchored',()=>{
 const ch=Object.fromEntries(equipment.chair.components.map(c=>[c.componentId,c.worldAabbMicrounits]));
 assert.equal(ch['lower-frame'].minY,FLOOR_TOP,'legs/frame on floor');
 assert.equal(ch['seat-slab'].minY,ch['lower-frame'].maxY,'seat slab carried by frame top');
 assert.ok(ch['backrest'].minY<=ch['seat-slab'].maxY,'backrest anchored at/below seat top')});
test('G3 legal bag surface: bag rests on the floor (legal surface); authoritative transform wins recorded',()=>{
 for(const c of equipment.bag.components)assert.equal(c.worldAabbMicrounits.minY,FLOOR_TOP,c.componentId);
 assert.match(equipment.bag.authoredVsAuthoritative.resolution,/^AUTHORITATIVE_TRANSFORM_WINS/)});
test('G4 stretcher wheel contact: no stretcher exists; the manifest says so honestly (Gate A lifecycle required)',()=>{
 assert.ok(Array.isArray(equipment.equipmentBeyondBagAndChair.included));
 assert.equal(equipment.equipmentBeyondBagAndChair.included.length,0,'no stretcher authored - must not be invented');
 assert.equal(equipment.equipmentBeyondBagAndChair.policy,'REQUIRES_GATE_A_LIFECYCLE')});
test('G5 no illegal placement: zero overlap of placed objects with door/wall/locker exclusion volumes',()=>{
 const exclusions=['visual:back-wall','visual:left-wall','visual:right-wall','visual:door','visual:locker-0','visual:locker-1','visual:locker-2','visual:locker-3','visual:locker-4'].map(k=>room[k]);
 const placed=[...casualty.components,...equipment.chair.components,...equipment.bag.components].map(c=>({id:c.componentId,aabb:c.worldAabbMicrounits}));
 for(const p of placed)for(const [i,x] of exclusions.entries())assert.ok(!aabbOverlaps(p.aabb,x),p.id+' overlaps exclusion #'+i)});
test('G13 envelope containment: every articulated part sits fully inside its certified component AABB',()=>{
 const comp=Object.fromEntries([...casualty.components.map(x=>['casualty:'+x.componentId,x.worldAabbMicrounits]),...equipment.chair.components.map(x=>['chair:'+x.componentId,x.worldAabbMicrounits]),...equipment.bag.components.map(x=>['bag:'+x.componentId,x.worldAabbMicrounits])]);
 let n=0;
 for(const [grp,prefix] of [[layout.casualty,'casualty:'],[layout.chair,'chair:'],[layout.bag,'bag:']])
  for(const g of grp)for(const part of g.parts){n++;assert.ok(aabbContains(comp[prefix+g.componentId],partAabb(part)),prefix+g.componentId+' part outside envelope')}
 assert.ok(n>=20,'articulated layout is substantive ('+n+' parts)')});
test('C2 contact shadows are geometry-derived from floor-contact footprints',()=>{
 assert.ok(layout.contactShadows.length>=7,'casualty(5)+chair(1)+bag(1)');
 for(const cs of layout.contactShadows){assert.ok(cs.footprint.maxX>cs.footprint.minX&&cs.footprint.maxZ>cs.footprint.minZ)}});
