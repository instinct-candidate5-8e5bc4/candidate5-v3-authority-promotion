'use strict';
// TRACK B / B-W1 (C4) evidence: harness LOGIC and fail-closed paths with a
// mock timing source. These tests exercise the harness only - they are NOT
// FPS claims about any device.
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),
 ROOT=path.join(__dirname,'../..');
const load=()=>import(path.join(ROOT,'visual-slice/perf-harness.mjs'));
const feed=(h,n,dt)=>{let t=0;for(let i=0;i<n;i++){t+=dt;h.recordFrame(t)}};
test('MEASURED result: schema, raw frame array, median + p95 from real timestamps only',async()=>{
 const {createPerfHarness,WINDOW_FRAMES,HARNESS_SCHEMA_VERSION}=await load();
 const h=createPerfHarness();
 h.start({deviceId:'Unit Test Phone',os:'Android 15',browser:'Chrome 140',physicalDeviceAttested:true,startedAt:'2026-09-30T00:00:00Z'});
 feed(h,WINDOW_FRAMES,20); // 50 fps constant
 const r=h.finalize();
 assert.equal(r.status,'MEASURED');
 assert.equal(r.schemaVersion,HARNESS_SCHEMA_VERSION);
 assert.equal(r.deviceId,'Unit Test Phone');
 assert.equal(r.frameTimesMs.length,WINDOW_FRAMES-1);
 assert(r.frameTimesMs.every(x=>x===20));
 assert(Math.abs(r.medianFps-50)<1e-9&&Math.abs(r.p95Fps-50)<1e-9)});
test('percentiles computed from the actual distribution',async()=>{
 const {createPerfHarness,WINDOW_FRAMES}=await load();
 const h=createPerfHarness();
 h.start({deviceId:'Unit Test Phone',physicalDeviceAttested:true});
 let t=0;for(let i=0;i<WINDOW_FRAMES;i++){t+=(i%10===0?50:10);h.recordFrame(t)} // mixed 100fps/20fps
 const r=h.finalize();
 assert.equal(r.status,'MEASURED');
 assert(r.medianFps>r.p95Fps||r.p95Fps>0);
 assert(r.medianFps>50); // most frames are 100fps
 assert(r.p95Fps>=r.medianFps)});
test('FAIL-CLOSED: missing/blank device id => INVALID, never a number',async()=>{
 const {createPerfHarness,WINDOW_FRAMES}=await load();
 for(const id of [undefined,'','   ']){
  const h=createPerfHarness();
  h.start({deviceId:id,physicalDeviceAttested:true});
  feed(h,WINDOW_FRAMES,16.6);
  const r=h.finalize();
  assert.equal(r.status,'INVALID');
  assert.equal(r.medianFps,null);assert.equal(r.p95Fps,null);
  assert.equal(r.frameTimesMs.length,0);
  assert(r.invalidReason.includes('device'))}});
test('FAIL-CLOSED: no physical-device attestation => INVALID',async()=>{
 const {createPerfHarness,WINDOW_FRAMES}=await load();
 const h=createPerfHarness();
 h.start({deviceId:'Unit Test Phone',physicalDeviceAttested:false});
 feed(h,WINDOW_FRAMES,16.6);
 const r=h.finalize();
 assert.equal(r.status,'INVALID');assert(r.invalidReason.includes('attestation'))});
test('FAIL-CLOSED: incomplete window, never-started, non-positive frame times => INVALID',async()=>{
 const {createPerfHarness,WINDOW_FRAMES}=await load();
 const h1=createPerfHarness();
 assert.equal(h1.finalize().status,'INVALID');
 const h2=createPerfHarness();
 h2.start({deviceId:'P',physicalDeviceAttested:true});
 feed(h2,100,16.6);
 assert.equal(h2.finalize().status,'INVALID');
 assert(h2.finalize().invalidReason.includes('incomplete'));
 const h3=createPerfHarness();
 h3.start({deviceId:'P',physicalDeviceAttested:true});
 let t=0;for(let i=0;i<WINDOW_FRAMES;i++){h3.recordFrame(i===55?t:t+=16.6)} // duplicate ts at 55
 const r3=h3.finalize();
 assert.equal(r3.status,'INVALID');assert(r3.invalidReason.includes('frame time'))});
test('harness module carries no emulated/projected FPS source',async()=>{
 const fs=require('node:fs');
 const src=fs.readFileSync(path.join(ROOT,'visual-slice/perf-harness.mjs'),'utf8');
 assert(!/Math\.random|Date\.now\(\).*fps|estimate|project/i.test(src.replace(/\/\/[^\n]*/g,'')),'no synthetic timing source');
 const html=fs.readFileSync(path.join(ROOT,'visual-slice/perf.html'),'utf8');
 assert(html.includes('perf-harness.mjs'));
 assert(html.includes('ENGINE FAIL-CLOSED'));
 assert(!html.includes('worldMutationAPI')&&!html.includes('proposeTransaction'),'read-only')});
