'use strict';
// TRACK B / C3 gates G8/G9/G10: lighting rigs + camera fit (host-independent math).
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const ROOT=path.join(__dirname,'../..');
const {buildVisualSceneDescriptor}=require(path.join(ROOT,'src/clean-runtime/school/scene-v2/visual-descriptor.js'));
const {buildVisualCasualty}=require(path.join(ROOT,'src/clean-runtime/school/scene-v2/visual-casualty.js'));
let CL;
test('C3 module loads',async()=>{CL=await import(path.join(ROOT,'visual-slice/camera-lighting.mjs'));assert(CL.fitCameraToAabb&&CL.LIGHTING_RIGS)});
test('G8 day/night/winter are lighting RIGS only: light params, zero geometry/material/digest data',async()=>{
 CL=CL||await import(path.join(ROOT,'visual-slice/camera-lighting.mjs'));
 const names=Object.keys(CL.LIGHTING_RIGS).sort();
 assert.deepEqual(names,['day','night','winter']);
 for(const [name,rig] of Object.entries(CL.LIGHTING_RIGS)){
  assert.deepEqual(Object.keys(rig).sort(),['ambient','fill','key','label','shadow'],name+' touches lights only');
  assert.equal(typeof rig.ambient.intensity,'number');
  assert.equal(typeof rig.key.intensity,'number');
  assert.ok(Array.isArray(rig.key.positionMicrounits),name+' key position is a light position');
  assert(!/aabb|minX|maxX|geometry|material|digest/i.test(JSON.stringify(rig)),name+' carries no geometry/material/digest fields')}
 // digests byte-identical regardless of lighting: the module is never an input to any builder
 const d=buildVisualSceneDescriptor();
 assert.equal(d.descriptorDigest,'5f6829b7b10bbbc91ff0bd7e66bd5de3c69473091d56af92f8decbc8cbecaa18');
 assert.equal(buildVisualCasualty(d).visualDigest,'efe6bd00ebbc4aeb13cf219d3aa1a81258b6b2f6ae2f109eb5f4c44850a535d9')});
test('G8 page applies rigs to light objects only (no material/scene tint in the rig path)',()=>{
 const html=fs.readFileSync(path.join(ROOT,'visual-slice/index.html'),'utf8');
 const m=html.match(/function applyRig[\s\S]*?rig===name\)\}/);
 assert(m,'applyRig present');
 assert(!/material|background|fog|traverse|scene\.add\(new THREE\.(?!Ambient|Directional)/i.test(m[0]),'rig handler must not touch materials/background/fog/geometry');
 assert(/key\.color\.set|ambient\.intensity/.test(m[0]),'rig handler sets light params')});
test('G10 desktop first frame: casualty envelope fully inside viewport at 1280x800',async()=>{
 CL=CL||await import(path.join(ROOT,'visual-slice/camera-lighting.mjs'));
 const d=buildVisualSceneDescriptor();
 const env=buildVisualCasualty(d).worldEnvelopeMicrounits;
 const bundle=JSON.parse(fs.readFileSync(path.join(ROOT,'visual-slice/scene-bundle.json'),'utf8'));
 const pos=bundle.camera.positionMicrounits,look=bundle.camera.lookAtMicrounits,fov=bundle.camera.fovDegrees;
 const fit=CL.fitCameraToAabb(env,pos,look,fov,1280/800,0.08);
 for(const c of CL.aabbCorners(env)){
  const[x,y]=CL.projectNdc(c,fit.position,look,fov,1280/800);
  assert.ok(Math.abs(x)<=0.92&&Math.abs(y)<=0.92,'corner outside viewport: '+x+','+y)}});
test('G9 mobile first frame: casualty envelope fully inside viewport at 390x844',async()=>{
 CL=CL||await import(path.join(ROOT,'visual-slice/camera-lighting.mjs'));
 const d=buildVisualSceneDescriptor();
 const env=buildVisualCasualty(d).worldEnvelopeMicrounits;
 const bundle=JSON.parse(fs.readFileSync(path.join(ROOT,'visual-slice/scene-bundle.json'),'utf8'));
 const pos=bundle.camera.positionMicrounits,look=bundle.camera.lookAtMicrounits,fov=bundle.camera.fovDegrees;
 const fit=CL.fitCameraToAabb(env,pos,look,fov,390/844,0.08);
 for(const c of CL.aabbCorners(env)){
  const[x,y]=CL.projectNdc(c,fit.position,look,fov,390/844);
  assert.ok(Math.abs(x)<=0.92&&Math.abs(y)<=0.92,'corner outside viewport: '+x+','+y)}});
