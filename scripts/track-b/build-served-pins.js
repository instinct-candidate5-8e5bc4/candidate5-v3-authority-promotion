'use strict';
// TRACK B / B-W4 build step: emits evidence/track-b/served-pins.json, raw
// SHA-256 + byte size for every file the standalone demo serves/loads at
// runtime. Pins are hashed against the COMMITTED tree when the file is
// tracked at HEAD (what Pages serves), working tree otherwise (first build).
// Pins live OUTSIDE index.html - served demo bytes stay stable.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execSync}=require('node:child_process');
const ROOT=path.join(__dirname,'../..'),VS=path.join(ROOT,'visual-slice');
const blobOrFile=rel=>{try{return execSync('git show HEAD:visual-slice/'+rel,{cwd:ROOT,stdio:['pipe','pipe','ignore']})}catch{return fs.readFileSync(path.join(VS,rel))}};
// Runtime-served set of visual-slice/index.html: its own bytes, every module
// it imports and every JSON it fetches. three.js is an external version-
// pinned CDN import (not hashed here; recorded for completeness).
const SERVED=['index.html','engine-bundle.js','articulated-layout.mjs','camera-lighting.mjs','scene-registry.json','scene-bundle.json'];
const pins=SERVED.map(rel=>{const buf=blobOrFile(rel);
 return{path:'visual-slice/'+rel,bytes:buf.length,sha256:crypto.createHash('sha256').update(buf).digest('hex')}});
const out={pinsVersion:'1.0.0',kind:'TRACK_B_SERVED_PINS',generatedAt:new Date().toISOString(),
 policy:'Byte-exact pins of every runtime-served demo file. Post-push verification recomputes pins from the deployed bytes and requires an exact match; any drift is a HARD STOP, never a silent pass.',
 pins,
 externalImports:[{url:'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js',note:'version-pinned CDN import (importmap)'},
  {url:'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js',note:'version-pinned CDN import (importmap)'}]};
const dest=path.join(ROOT,'evidence/track-b/served-pins.json');
fs.mkdirSync(path.dirname(dest),{recursive:true});
fs.writeFileSync(dest,JSON.stringify(out,null,1));
console.log('READY',dest,pins.length,'pins');
