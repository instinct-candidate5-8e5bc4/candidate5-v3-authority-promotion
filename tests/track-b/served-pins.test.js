'use strict';
// TRACK B / B-W4 evidence: served-bytes pin manifest.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execSync}=require('node:child_process'),
 ROOT=path.join(__dirname,'../..'),PINS=path.join(ROOT,'evidence/track-b/served-pins.json');
test('committed pin RECORDS match HEAD bytes - staleness is a HARD STOP, not a silent pass',()=>{
 // Executor-review R3-2 / push-caveat lesson: the recompute tests below
 // regenerate first and therefore verify the BUILDER, not the committed
 // record. A stale committed record used to pass silently (remote PW-2-era
 // push carried engine-bundle c718dcee against served 05591546). Compare the
 // ON-DISK committed records against HEAD bytes BEFORE any regeneration.
 const head=rel=>execSync('git show HEAD:'+rel,{cwd:ROOT,stdio:['pipe','pipe','ignore']});
 const p=JSON.parse(fs.readFileSync(PINS,'utf8'));
 for(const pin of p.pins){
  const buf=head(pin.path);
  assert.equal(buf.length,pin.bytes,pin.path+' committed served-pins record stale - run build-served-pins.js and commit the result');
  assert.equal(crypto.createHash('sha256').update(buf).digest('hex'),pin.sha256,pin.path+' committed served-pins record stale - run build-served-pins.js and commit the result');}
 const b7=JSON.parse(fs.readFileSync(path.join(ROOT,'evidence/clean-runtime/track-b/b7-engine-manifest.json'),'utf8'));
 const bundle=head('visual-slice/engine-bundle.js');
 assert.equal(bundle.length,b7.bundle.bytes,'committed b7-engine-manifest record stale - rebuild the engine bundle and commit the manifest');
 assert.equal(crypto.createHash('sha256').update(bundle).digest('hex'),b7.bundle.sha256,'committed b7-engine-manifest record stale - rebuild the engine bundle and commit the manifest');});
test('served pins recompute byte-exact from the committed tree',()=>{
 execSync('node scripts/track-b/build-served-pins.js',{cwd:ROOT});
 const p=JSON.parse(fs.readFileSync(PINS,'utf8'));
 assert.equal(p.kind,'TRACK_B_SERVED_PINS');
 assert(p.pins.length>=6,'every runtime-served file pinned');
 for(const pin of p.pins){
  const buf=execSync('git show HEAD:'+pin.path,{cwd:ROOT,stdio:['pipe','pipe','ignore']});
  assert.equal(buf.length,pin.bytes,pin.path+' bytes');
  assert.equal(crypto.createHash('sha256').update(buf).digest('hex'),pin.sha256,pin.path+' sha256');}
 for(const required of ['visual-slice/index.html','visual-slice/scene-registry.json','visual-slice/scene-bundle.json','visual-slice/engine-bundle.js'])
  assert(p.pins.some(x=>x.path===required),'missing pin for '+required)});
test('pins detect a single-byte drift (negative)',()=>{
 const p=JSON.parse(fs.readFileSync(PINS,'utf8'));
 const pin=p.pins.find(x=>x.path==='visual-slice/scene-registry.json');
 const buf=execSync('git show HEAD:'+pin.path,{cwd:ROOT,stdio:['pipe','pipe','ignore']});
 buf[0]=buf[0]===123?125:123;
 assert.notEqual(crypto.createHash('sha256').update(buf).digest('hex'),pin.sha256,'one altered byte must change the pin')});
