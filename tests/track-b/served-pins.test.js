'use strict';
// TRACK B / B-W4 evidence: served-bytes pin manifest.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execSync}=require('node:child_process'),
 ROOT=path.join(__dirname,'../..'),PINS=path.join(ROOT,'evidence/track-b/served-pins.json');
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
