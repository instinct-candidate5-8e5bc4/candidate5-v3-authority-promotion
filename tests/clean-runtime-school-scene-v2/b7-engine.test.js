'use strict';
// TRACK B / PHASE B7: engine-in-browser integration tests.
// Layer 1 (build time): every inlined evidence file is pinned BYTE-EXACT in
//   visual-slice/engine/pins.json; any byte difference (even value-preserving
//   whitespace/key-order changes) aborts the build fail-closed.
// Layer 2 (page runtime): semantic integrity is verified against the certified
//   digests (package/world/descriptor); value tampering REJECTS at validate.
// Known vectors cover the vendored js-sha256 used by the crypto shim.
// The browser smoke wrapper skips on hosts without Chromium/puppeteer.
const test=require('node:test'),assert=require('node:assert/strict'),{execFileSync,spawnSync}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const ROOT=path.join(__dirname,'../..');
const run=(args,env)=>spawnSync('node',args,{cwd:ROOT,encoding:'utf8',timeout:180000,env:{...process.env,...env}});
function makeTamperedTree(mutate){
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'b7neg-'));
 for(const d of ['src','evidence/verified-architecture-phase2','visual-slice/engine','scripts/track-b','evidence/clean-runtime/track-b']){
  const src=path.join(ROOT,d),dst=path.join(tmp,d);
  if(fs.existsSync(src)&&fs.statSync(src).isDirectory())fs.cpSync(src,dst,{recursive:true});else fs.mkdirSync(dst,{recursive:true})}
 fs.cpSync(path.join(ROOT,'evidence/verified-architecture-phase2'),path.join(tmp,'evidence/verified-architecture-phase2'),{recursive:true});
 const school=path.join(tmp,'evidence/verified-architecture-phase2/surface-models/school.json');
 mutate(school);
 return tmp}
test('B7 vendored js-sha256 matches SHA-256 known vectors',async()=>{
 const {sha256}=await import(path.join(ROOT,'visual-slice/engine/vendor/js-sha256.mjs'));
 assert.equal(sha256.hex(''),'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
 assert.equal(sha256.hex('abc'),'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
 assert.equal(sha256.hex('The quick brown fox jumps over the lazy dog'),'d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592')});
test('B7 build passes on the pristine tree and writes a green manifest',()=>{
 const r=run(['scripts/track-b/build-engine-bundle.js'],{});
 assert.equal(r.status,0,r.stderr);
 const m=JSON.parse(fs.readFileSync(path.join(ROOT,'evidence/clean-runtime/track-b/b7-engine-manifest.json'),'utf8'));
 assert.ok(m.checks.length>=4);
 for(const c of m.checks)assert.ok(c.pass,'manifest check failed: '+c.check+' '+c.target);
 assert.equal(m.nodeDescriptor.digest,'5f6829b7b10bbbc91ff0bd7e66bd5de3c69473091d56af92f8decbc8cbecaa18');
 assert.ok(m.esbuildVersion)});
test('B7 build-layer NEGATIVE: one altered byte in the pinned inline aborts fail-closed',()=>{
 const tmp=makeTamperedTree(p=>{const b=fs.readFileSync(p);b[0]=b[0]===123?125:123;fs.writeFileSync(p,b)});
 const r=run(['scripts/track-b/build-engine-bundle.js'],{TRACKB_ROOT:tmp});
 assert.notEqual(r.status,0,'build must fail');
 assert.match(r.stderr,/FAIL-CLOSED/);
 const m=JSON.parse(fs.readFileSync(path.join(tmp,'evidence/clean-runtime/track-b/b7-engine-manifest.json'),'utf8'));
 assert.equal(m.checks.find(c=>c.check==='byte-exact inline pin').pass,false);
 fs.rmSync(tmp,{recursive:true,force:true})});
test('B7 build-layer NEGATIVE: value-preserving reserialization still fails the byte pin',()=>{
 const tmp=makeTamperedTree(p=>{const v=JSON.parse(fs.readFileSync(p,'utf8'));fs.writeFileSync(p,JSON.stringify(v,null,4))});
 const r=run(['scripts/track-b/build-engine-bundle.js'],{TRACKB_ROOT:tmp});
 assert.notEqual(r.status,0,'whitespace/key-order change must abort the build (byte-exact layer)');
 assert.match(r.stderr,/FAIL-CLOSED/);
 fs.rmSync(tmp,{recursive:true,force:true})});
test('B7 runtime-layer NEGATIVE: value tampering REJECTS at validate (semantic digests diverge)',()=>{
 const tmp=makeTamperedTree(p=>{const s=fs.readFileSync(p,'utf8');
  const m=s.match(/"widthMm":\s*([0-9]+)/)||s.match(/"widthM":\s*([0-9.]+)/)||s.match(/([0-9]{4,})/);
  assert.ok(m,'found a numeric value to tamper');
  const repl=m[1].startsWith('9')?m[1].replace(/^9/,'8'):m[1].replace(/^[0-9]/,'9');
  fs.writeFileSync(p,s.replace(m[1],repl))});
 const {buildVisualSceneDescriptor}=require(path.join(tmp,'src/clean-runtime/school/scene-v2/visual-descriptor.js'));
 const d=buildVisualSceneDescriptor();
 assert.notEqual(d.status,'COMMITTED','tampered values must not produce COMMITTED (got '+d.status+')');
 assert.notEqual(d.worldRef&&d.worldRef.stateDigest,'fa1bbaa985a63a8bfa30c2bbd7fbaf14b2c4972d985815a093bdd68f7fe954ea');
 fs.rmSync(tmp,{recursive:true,force:true})});
const hasChrome=!!(process.env.CHROME_PATH||['/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].find(p=>fs.existsSync(p)));
let hasDeps=!!process.env.SCRATCH_NODE_MODULES;if(!hasDeps){try{require.resolve('puppeteer');hasDeps=true}catch{}}
test('B7 engine smoke: in-browser instantiate executes fail-closed against certified pins',{skip:!(hasChrome&&hasDeps)&&'no Chromium binary or dev deps (puppeteer) on this host'},()=>{
 const out=execFileSync('node',['scripts/track-b/b7-engine-smoke.js'],{cwd:ROOT,encoding:'utf8',timeout:180000,env:{...process.env}});
 assert.match(out,/RESULT: PASS/)});
