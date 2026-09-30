'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
test('legacy classic timer reads the same explicitly exported module engine',()=>{
 const s=fs.readFileSync(path.resolve(__dirname,'../../../index.html'),'utf8');
 assert.equal((s.match(/window\.unexpectedEngine=unexpectedEngine;/g)||[]).length,1);
 assert.equal((s.match(/window\.unexpectedEngine\.advance\(state\.time\*1000\)/g)||[]).length,1);
 assert(s.includes('window.exportUnexpectedAudit=()=>unexpectedEngine.snapshot();'));
 assert(!s.includes('for(const e of unexpectedEngine.advance('));
});
