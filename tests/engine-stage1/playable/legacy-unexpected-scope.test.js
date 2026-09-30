'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
test('legacy classic timer reads the same explicitly exported module engine',()=>{
 const s=fs.readFileSync(path.resolve(__dirname,'../../../index.html'),'utf8');
 assert.equal((s.match(/window\.unexpectedEngine=unexpectedEngine;/g)||[]).length,1);
 assert.equal((s.match(/window\.unexpectedEngine\?\.advance\(state\.time\*1000\)/g)||[]).length,1);
 assert(s.includes('window.exportUnexpectedAudit=()=>unexpectedEngine.snapshot();'));
 assert(!s.includes('for(const e of unexpectedEngine.advance('));
});

test('classic timer skips unavailable module engine and resumes when assigned',()=>{
 const vm=require('node:vm');const s=fs.readFileSync(path.resolve(__dirname,'../../../index.html'),'utf8');
 const expr=s.match(/for\(const e of (.*?)\)window.dispatchEvent/)[1];
 let calls=[];const c={window:{},state:{time:5}};vm.createContext(c);
 assert.equal(vm.runInContext(expr,c).length,0);
 c.window.unexpectedEngine={advance:ms=>{calls.push(ms);return [{type:'noise-started'}]}};
 assert.equal(vm.runInContext(expr,c).length,1);assert.deepEqual(calls,[5000]);
});
