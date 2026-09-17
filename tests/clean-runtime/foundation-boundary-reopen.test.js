'use strict';
// Foundation Boundary Policy Reopen - mandatory hostile boundary suite.
// Proves the reopened boundary policy (manifest allowlist + audit 1.3.0 +
// static boundary test 4) authorizes EXACTLY the three certified Authority
// Routing Gate edges and fails closed on everything else.
const test=require('node:test'),assert=require('node:assert'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const ROOT=path.resolve(__dirname,'../..');
const IMPORTER='src/clean-runtime/v3-routing/promoted-legality-port.js';
const T_PLANNER='src/clean-runtime/mutation/physical-proof-planner.js';
const T_FOUNDATION='src/clean-runtime/mutation/v3-promotion-foundation.js';
const T_ENVELOPE='src/clean-runtime/v3-authority/authority-envelope-builder.js';
const T_ROUTER='src/clean-runtime/mutation/physical-capability-router.js';
const T_ADAPTER='src/clean-runtime/mutation/v3-authority-adapter.js';
const T_ENVELOPE_TYPES='src/clean-runtime/v3-authority/authority-envelope.js';
const REL={ // require specifier for a foundation target as seen from the port file
  [T_PLANNER]:'../mutation/physical-proof-planner.js',
  [T_FOUNDATION]:'../mutation/v3-promotion-foundation.js',
  [T_ENVELOPE]:'../v3-authority/authority-envelope-builder.js',
  [T_ROUTER]:'../mutation/physical-capability-router.js',
  [T_ADAPTER]:'../mutation/v3-authority-adapter.js',
  [T_ENVELOPE_TYPES]:'../v3-authority/authority-envelope.js'};
function portSource(targets,extra){return "'use strict';\n"+targets.map(t=>"const x"+targets.indexOf(t)+"=require('"+REL[t]+"');").join('\n')+(extra||'')+"\nmodule.exports={};\n"}
function fixture(mutate){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'boundary-reopen-'));
  fs.cpSync(path.join(ROOT,'src'),path.join(dir,'src'),{recursive:true});
  fs.mkdirSync(path.join(dir,'tests/clean-runtime'),{recursive:true});
  fs.copyFileSync(path.join(ROOT,'tests/clean-runtime/v3-promotion-authority-audit.js'),path.join(dir,'tests/clean-runtime/v3-promotion-authority-audit.js'));
  const manifest=JSON.parse(fs.readFileSync(path.join(ROOT,'tests/clean-runtime/foundation-allowed-paths.json'),'utf8'));
  if(mutate)mutate(dir,manifest);
  fs.writeFileSync(path.join(dir,'tests/clean-runtime/foundation-allowed-paths.json'),JSON.stringify(manifest,null,2));
  cp.execFileSync('git',['init','-q'],{cwd:dir});
  return dir}
function audit(dir){try{const out=cp.execFileSync('node',['tests/clean-runtime/v3-promotion-authority-audit.js'],{cwd:dir,encoding:'utf8',maxBuffer:64*1024*1024});return{code:0,body:JSON.parse(out)}}catch(e){return{code:e.status,body:JSON.parse(e.stdout)}}}
function writePort(dir,source){const p=path.join(dir,IMPORTER);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,source)}
function findingsOf(r,id){return r.body.findings.filter(f=>f.id===id)}

test('hostile 1: each approved edge independently passes',()=>{
  for(const t of [T_PLANNER,T_FOUNDATION,T_ENVELOPE]){
    const r=audit(fixture(dir=>writePort(dir,portSource([t]))));
    assert.equal(r.code,0,'edge '+t+' alone must pass: '+JSON.stringify(r.body.findings))}});
test('hostile 2: all three approved edges together pass',()=>{
  const r=audit(fixture(dir=>writePort(dir,portSource([T_PLANNER,T_FOUNDATION,T_ENVELOPE]))));
  assert.equal(r.code,0,JSON.stringify(r.body.findings));
  assert.equal(r.body.findings.length,0)});
test('hostile 3: same source to wrong target fails',()=>{
  const r=audit(fixture(dir=>writePort(dir,portSource([T_ENVELOPE_TYPES]))));
  assert.notEqual(r.code,0);
  assert.equal(findingsOf(r,'FORBIDDEN_INBOUND_FOUNDATION_IMPORT')[0].file,IMPORTER);
  assert.deepEqual(findingsOf(r,'FORBIDDEN_INBOUND_FOUNDATION_IMPORT')[0].foundationImports,[T_ENVELOPE_TYPES])});
test('hostile 4: wrong source to approved target fails',()=>{
  const r=audit(fixture(dir=>{const p=path.join(dir,'src/clean-runtime/v3-routing/wrong-source.js');fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,"'use strict';\nconst x=require('../mutation/v3-promotion-foundation.js');\nmodule.exports={};\n")}));
  assert.notEqual(r.code,0);
  assert.equal(findingsOf(r,'FORBIDDEN_INBOUND_FOUNDATION_IMPORT')[0].file,'src/clean-runtime/v3-routing/wrong-source.js')});
test('hostile 5: fourth foundation edge fails',()=>{
  const r=audit(fixture(dir=>writePort(dir,portSource([T_PLANNER,T_FOUNDATION,T_ENVELOPE,T_ADAPTER]))));
  assert.notEqual(r.code,0);
  assert.deepEqual(findingsOf(r,'FORBIDDEN_INBOUND_FOUNDATION_IMPORT')[0].foundationImports,[T_ADAPTER])});
test('hostile 6: sibling module edge fails',()=>{
  const r=audit(fixture(dir=>writePort(dir,portSource([T_PLANNER,T_FOUNDATION,T_ENVELOPE,T_ROUTER]))));
  assert.notEqual(r.code,0);
  assert.deepEqual(findingsOf(r,'FORBIDDEN_INBOUND_FOUNDATION_IMPORT')[0].foundationImports,[T_ROUTER])});
test('hostile 7: path alias attempt fails',()=>{
  const r=audit(fixture((dir,m)=>{m.allowedInboundFoundationImports[0].targets[1]='src/clean-runtime/mutation/../mutation/v3-promotion-foundation.js'}));
  assert.notEqual(r.code,0);
  assert.ok(findingsOf(r,'ALLOWLIST_POLICY_MISMATCH').length===1)});
test('hostile 8: relative-path normalization bypass fails',()=>{
  const r=audit(fixture(dir=>writePort(dir,"'use strict';\nconst x0=require('../mutation/physical-proof-planner.js');\nconst x1=require('../mutation/v3-promotion-foundation.js');\nconst x2=require('../v3-authority/../mutation/physical-capability-router.js');\nmodule.exports={};\n")));
  assert.notEqual(r.code,0);
  assert.deepEqual(findingsOf(r,'FORBIDDEN_INBOUND_FOUNDATION_IMPORT')[0].foundationImports,[T_ROUTER])});
test('hostile 9: dynamic require/import attempt fails',()=>{
  const r=audit(fixture(dir=>writePort(dir,"'use strict';\nconst x0=require('../mutation/physical-proof-planner.js');\nconst name='../mutation/v3-promotion-foundation.js';\nconst dyn=require(name);\nconst p=import('../v3-authority/authority-envelope-builder.js');\nmodule.exports={};\n")));
  assert.notEqual(r.code,0);
  assert.equal(findingsOf(r,'NON_STATICALLY_RESOLVABLE_LOAD').length,2)});
test('hostile 10: re-export/factory/injector indirection creates no additional authority',()=>{
  const dir=fixture(d=>{writePort(d,portSource([T_PLANNER,T_FOUNDATION,T_ENVELOPE],"module.exports.plan=x0;"));fs.writeFileSync(path.join(d,'src/clean-runtime/v3-routing/consumer.js'),"'use strict';\nconst port=require('./promoted-legality-port.js');\nmodule.exports={plan:port.plan};\n")});
  const ok=audit(dir);assert.equal(ok.code,0,'consumer via port holds no foundation authority of its own: '+JSON.stringify(ok.body.findings));
  fs.appendFileSync(path.join(dir,'src/clean-runtime/v3-routing/consumer.js'),"const bypass=require('../mutation/physical-capability-router.js');\n");
  const bad=audit(dir);assert.notEqual(bad.code,0);
  assert.equal(findingsOf(bad,'FORBIDDEN_INBOUND_FOUNDATION_IMPORT')[0].file,'src/clean-runtime/v3-routing/consumer.js')});
test('hostile 11: duplicate or malformed allowlist entry fails',()=>{
  for(const m of [
    mm=>{mm.allowedInboundFoundationImports[0].targets.push(T_PLANNER)},
    mm=>{mm.allowedInboundFoundationImports[0].targets=T_PLANNER},
    mm=>{mm.allowedInboundFoundationImports.push({importer:IMPORTER,targets:[T_ROUTER]})},
    mm=>{mm.allowedInboundFoundationImports=['*']} ]){
    const r=audit(fixture((dir,mmf)=>m(mmf)));
    assert.notEqual(r.code,0);
    assert.ok(findingsOf(r,'ALLOWLIST_POLICY_MISMATCH').length===1,'variant must fail policy validation')}});
test('hostile 12: missing approved edge fails certification',()=>{
  const r=audit(fixture((dir,m)=>{m.allowedInboundFoundationImports[0].targets=m.allowedInboundFoundationImports[0].targets.filter(t=>t!==T_ENVELOPE)}));
  assert.notEqual(r.code,0);
  assert.ok(findingsOf(r,'ALLOWLIST_POLICY_MISMATCH').length===1)});
test('hostile 13: additional allowlist edge fails certification',()=>{
  const r=audit(fixture((dir,m)=>{m.allowedInboundFoundationImports[0].targets.push(T_ROUTER)}));
  assert.notEqual(r.code,0);
  assert.ok(findingsOf(r,'ALLOWLIST_POLICY_MISMATCH').length===1)});
test('hostile 14: modification of any certified foundation blob fails certification',()=>{
  for(const f of [T_ROUTER,T_PLANNER,T_ADAPTER,T_FOUNDATION,T_ENVELOPE,T_ENVELOPE_TYPES]){
    const r=audit(fixture(dir=>fs.appendFileSync(path.join(dir,f),'\n// tampered\n')));
    assert.notEqual(r.code,0,f);
    assert.ok(findingsOf(r,'MANIFEST_SHA_MISMATCH').some(x=>x.file===f),f)}});
test('hostile 15: any foundation semantic/result change fails certification',()=>{
  const r=audit(fixture(dir=>{const p=path.join(dir,T_ROUTER);fs.writeFileSync(p,fs.readFileSync(p,'utf8').replace('V3_SUPPORT','V3_WORLD_SOLID'))}));
  assert.notEqual(r.code,0);
  assert.ok(findingsOf(r,'MANIFEST_SHA_MISMATCH').some(x=>x.file===T_ROUTER))});
test('hostile 16: existing fail-closed behavior remains unchanged',()=>{
  const r=audit(fixture(dir=>{
    const sp=path.join(dir,'src/clean-runtime/school');fs.mkdirSync(sp,{recursive:true});
    fs.writeFileSync(path.join(sp,'evil.js'),"'use strict';\nconst x=require('../mutation/v3-promotion-foundation.js');\nmodule.exports={};\n");
    const wma=path.join(dir,'src/clean-runtime/mutation/world-mutation-api.js');
    fs.appendFileSync(wma,"const runtimeBypass=require('./v3-authority-adapter.js');\n")}));
  assert.notEqual(r.code,0);
  assert.ok(findingsOf(r,'FORBIDDEN_INBOUND_FOUNDATION_IMPORT').some(f=>f.file==='src/clean-runtime/school/evil.js'));
  assert.ok(findingsOf(r,'SCHOOL_CONNECTED').length===1);
  assert.ok(findingsOf(r,'RUNTIME_CONNECTED').length===1)});
test('hostile 17: existing foundation hostile/replay/determinism suites remain green',()=>{
  cp.execFileSync('node',['--test','tests/clean-runtime/v3-promotion-hostile.test.js','tests/clean-runtime/v3-foundation-adversarial-closure.test.js','tests/clean-runtime/event-replay.test.js','tests/clean-runtime/determinism.test.js'],{cwd:ROOT,encoding:'utf8',maxBuffer:64*1024*1024})});
test('hostile 18: routing gate remains non-promoted during this reopen',()=>{
  assert.ok(!fs.existsSync(path.join(ROOT,'src/clean-runtime/v3-routing')),'no routing module may exist on the reopen branch');
  const r=audit(ROOT);
  assert.equal(r.code,0,JSON.stringify(r.body.findings));
  assert.equal(r.body.legalityPromoted,false);
  assert.equal(r.body.gatewayRouted,false);
  assert.equal(r.body.schoolConnected,false);
  assert.equal(r.body.runtimeConnected,false);
  assert.equal(r.body.inboundFoundationImports.length,0);
  assert.equal(r.body.boundaryPolicyValid,true)});
test('regression 19: aliased require fails (Yoni repro a)',()=>{
  const r=audit(fixture(dir=>writePort(dir,"'use strict';\nconst R=require;\nconst x=R('../mutation/v3-promotion-foundation.js');\nmodule.exports={};\n")));
  assert.notEqual(r.code,0);
  assert.ok(findingsOf(r,'NON_STATICALLY_RESOLVABLE_LOAD').some(f=>f.detail==='require used as a value'))});
test('regression 20: comment-separated require fails (Yoni repro b)',()=>{
  for(const src of [
    "'use strict';\nconst name='../mutation/v3-promotion-foundation.js';\nconst x=require /* hidden */ (name);\nmodule.exports={};\n",
    "'use strict';\nconst x=require /* hidden */ ('../mutation/v3-promotion-foundation.js');\nmodule.exports={};\n",
    "'use strict';\nconst x=require(/* hidden */ '../mutation/v3-promotion-foundation.js');\nmodule.exports={};\n"]){
    const r=audit(fixture(dir=>writePort(dir,src)));
    assert.notEqual(r.code,0,'comment-obfuscated require must fail');
    assert.ok(findingsOf(r,'NON_STATICALLY_RESOLVABLE_LOAD').length>=1)}});
test('regression 21: bracket/member loader access fails (Yoni repro c)',()=>{
  const r=audit(fixture(dir=>writePort(dir,"'use strict';\nconst a=module['require']('../mutation/v3-promotion-foundation.js');\nconst b=module.require('../mutation/physical-proof-planner.js');\nmodule.exports={};\n")));
  assert.notEqual(r.code,0);
  assert.equal(findingsOf(r,'NON_STATICALLY_RESOLVABLE_LOAD').length,2)});
test('regression 22: dynamic loading from non-allowlisted production source fails (Yoni repro d)',()=>{
  const r=audit(fixture(dir=>{const p=path.join(dir,'src/clean-runtime/v3-routing/wrong-source.js');fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,"'use strict';\nconst name='../mutation/v3-promotion-foundation.js';\nmodule.exports=require(name);\n")}));
  assert.notEqual(r.code,0);
  assert.ok(findingsOf(r,'NON_STATICALLY_RESOLVABLE_LOAD').some(f=>f.file==='src/clean-runtime/v3-routing/wrong-source.js'))});
