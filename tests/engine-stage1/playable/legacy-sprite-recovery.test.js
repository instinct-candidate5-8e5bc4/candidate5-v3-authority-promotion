'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'../../..'),m=require('../../../evidence/root-shell/legacy-sprite-recovery.json');
test('all seven legacy required sprite bytes are recoverable and pinned',()=>{
 assert.equal(m.files.length,7);const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
 for(const f of m.files){const rel='assets/realistic/final-composites/'+f.filename,b=fs.readFileSync(path.join(ROOT,rel));
 assert(html.includes(rel),rel+' referenced by shell');assert.equal(b.length,f.bytes);assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.equal(crypto.createHash('sha256').update(b).digest('hex'),f.sha256);assert.equal(f.recoveryStatus,'HTTP_200_PNG_DECODE_VERIFIED');
 }
});

test('additional active root/config assets have exact recovered image bytes',()=>{
 assert.equal(m.additionalRecovery.files.length,17);
 for(const f of m.additionalRecovery.files){const b=fs.readFileSync(path.join(ROOT,f.path));assert.equal(b.length,f.bytes);assert.equal(crypto.createHash('sha256').update(b).digest('hex'),f.sha256);assert(['PNG','JPEG'].includes(f.format));}
 assert(m.additionalRecovery.unavailableDormant.every(f=>f.available===false));
});
