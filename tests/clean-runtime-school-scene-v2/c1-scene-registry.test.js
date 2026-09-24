'use strict';
// TRACK B / C1: scene-family registry contract (host-independent part) +
// browser smoke wrapper (skips without Chromium/puppeteer).
const test=require('node:test'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process'),fs=require('node:fs'),path=require('node:path');
const ROOT=path.join(__dirname,'../..');
const reg=JSON.parse(fs.readFileSync(path.join(ROOT,'visual-slice/scene-registry.json'),'utf8'));
test('C1 registry is well-formed and self-consistent',()=>{
 assert.ok(reg.registryVersion&&reg.kind==='TRACK_B_SCENE_FAMILY_REGISTRY');
 assert.match(reg.policy,/no default-scene fallback|no .*fallback/i);
 const names=Object.keys(reg.families);assert.ok(names.length>=3,'at least treatment room + the two gated families');
 for(const [name,f] of Object.entries(reg.families)){
  assert.ok(f.status==='AVAILABLE'||f.status==='UNAVAILABLE',name+' has a valid status');
  if(f.status==='AVAILABLE'){
   assert.ok(f.sceneId&&f.bundle,name+' AVAILABLE entries carry sceneId+bundle');
   assert.ok(fs.existsSync(path.join(ROOT,'visual-slice',f.bundle)),name+' bundle file exists')}
  else{assert.ok(typeof f.reason==='string'&&f.reason.length>10,name+' UNAVAILABLE entries carry a reason');
   assert.ok(typeof f.reasonHe==='string'&&/[\u0590-\u05FF]/.test(f.reasonHe),name+' UNAVAILABLE entries carry a Hebrew RTL user-facing reason')}}
 assert.ok(typeof reg.unknownReasonHe==='string'&&/[\u0590-\u05FF]/.test(reg.unknownReasonHe),'unknown-family Hebrew fallback present')});
test('C1 treatment room is the only AVAILABLE family (no scene expansion)',()=>{
 const avail=Object.entries(reg.families).filter(([,f])=>f.status==='AVAILABLE').map(([n])=>n);
 assert.deepEqual(avail,['school-treatment-room'])});
test('C1 drowning and synagogue are UNAVAILABLE with honest reasons (G6/G7 registry-honesty)',()=>{
 assert.equal(reg.families.drowning.status,'UNAVAILABLE');
 assert.match(reg.families.drowning.reason,/semantically fitting drowning scene|substitut/i);
 assert.equal(reg.families.synagogue.status,'UNAVAILABLE');
 assert.match(reg.families.synagogue.reason,/recognizability|not been built/i)});
const hasChrome=!!(process.env.CHROME_PATH||['/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].find(p=>fs.existsSync(p)));
let hasDeps=!!process.env.SCRATCH_NODE_MODULES;if(!hasDeps){try{require.resolve('puppeteer');hasDeps=true}catch{}}
test('C1 registry smoke: UNAVAILABLE/unknown families render no scene, no fallback',{skip:!(hasChrome&&hasDeps)&&'no Chromium binary or dev deps on this host'},()=>{
 const out=execFileSync('node',['scripts/track-b/c1-registry-smoke.js'],{cwd:ROOT,encoding:'utf8',timeout:180000,env:{...process.env}});
 assert.match(out,/RESULT: PASS/)});
