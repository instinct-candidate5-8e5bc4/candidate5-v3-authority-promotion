'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'../../..'),modulePath=path.join(ROOT,'src/clean-runtime/school/scene-v2/visual-surfaces.js'),original=fs.readFileSync(path.join(ROOT,'index.html')),record=require('../../../evidence/root-shell/unexpected-scope-source-revision.json'),ranges=require('../../../evidence/verified-architecture-phase2/source-range-evidence.json');
// Extract source verification without importing/replacing certified geometry.
const code=fs.readFileSync(modulePath,'utf8').split('function verifySource(){')[1].split('function crossCheck(')[0];
function verify(bytes,revision=record){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ko-lineage-neg-')),file=path.join(dir,'index.html');fs.writeFileSync(file,bytes);try{const ctx={fs,crypto,Buffer,SOURCE_PATH:file,SOURCE_SHA256:record.originalSha256,rangeEvidence:ranges,require:()=>revision};vm.createContext(ctx);return vm.runInContext('function verifySource(){'+code+';verifySource()',ctx)}finally{fs.rmSync(dir,{recursive:true,force:true})}}
function sha(b){return crypto.createHash('sha256').update(b).digest('hex')}
test('approved exact root revision reconstructs original source and all geometry ranges',()=>{const r=verify(original);assert.equal(r.ok,true);assert.equal(r.sourceBytesDigest,record.originalSha256);for(const v of Object.values(r.ranges)){assert(v.locatedInSourceBytes);assert(v.rangeDigestMatches)}});
test('staleness must-fail: one-byte root edit and geometry edit reject',()=>{for(const bytes of [Buffer.concat([original,Buffer.from(' ')]),Buffer.from(original.toString().replace("box('floor',[0,-.06,0]","box('floor',[0,-.07,0]"))])assert.equal(verify(bytes).ok,false)});
test('missing/extra substitution reject even when current byte SHA is supplied',()=>{
 const sub=record.substitutions[0];for(const text of [original.toString().replace(sub.current,sub.original),original.toString()+'\n'+sub.current]){const bytes=Buffer.from(text),r={...record,currentSha256:sha(bytes)};assert.equal(verify(bytes,r).ok,false)}
});
test('wrong current SHA, pending approval, changed substitution and changed reconstruction reject',()=>{
 for(const r of [{...record,currentSha256:'0'.repeat(64)},{...record,status:'PENDING_INDEPENDENT_REVIEW'},{...record,substitutions:record.substitutions.map((s,i)=>i? s:{...s,count:2})},{...record,substitutions:record.substitutions.map((s,i)=>i? s:{...s,original:s.original+' '})}])assert.equal(verify(original,r).ok,false);
});
