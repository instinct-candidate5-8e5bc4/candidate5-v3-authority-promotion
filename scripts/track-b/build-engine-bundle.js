'use strict';
// TRACK B / B7 build step: bundles the UNMODIFIED clean-runtime instantiate
// path (+ read-only visual builders) into visual-slice/engine-bundle.js for
// in-browser page-load execution. Fail-closed:
//  - every inlined evidence file is checked BYTE-EXACT against
//    visual-slice/engine/pins.json (any byte difference, incl. whitespace,
//    aborts the build);
//  - the manifest records per-inline path/size/sha, esbuild version, bundle
//    sha and the Node-side descriptor digest for the same tree.
// Requires esbuild available to node (e.g. `npm i esbuild (record the version; it lands in the manifest)` in a scratch
// dir with NODE_PATH, or repo-local dev install). Zero cost; no network at
// page runtime beyond the pinned three.js CDN.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
let esbuild;try{esbuild=require('esbuild')}catch{console.error('FAIL: esbuild not resolvable. Install with: npm i esbuild (record the version; it lands in the manifest) (dev-time only, $0) and rerun with NODE_PATH if needed.');process.exit(1)}
const ROOT=process.env.TRACKB_ROOT||path.join(__dirname,'../..'),pins=JSON.parse(fs.readFileSync(path.join(ROOT,'visual-slice/engine/pins.json'),'utf8'));
const manifest={manifestVersion:'1.0.0',kind:'TRACK_B_B7_ENGINE_MANIFEST',generatedAt:new Date().toISOString(),git:{branch:'UNKNOWN',commit:'UNKNOWN'},inlines:[],checks:[]};
try{manifest.git.branch=require('node:child_process').execSync('git rev-parse --abbrev-ref HEAD',{cwd:ROOT,encoding:'utf8'}).trim();manifest.git.commit=require('node:child_process').execSync('git rev-parse HEAD',{cwd:ROOT,encoding:'utf8'}).trim()}catch{}
for(const p of pins.inlined){
 const abs=path.join(ROOT,p.repoPath),bytes=fs.readFileSync(abs),sha=crypto.createHash('sha256').update(bytes).digest('hex');
 const ok=sha===p.sha256&&bytes.length===p.bytes;
 manifest.inlines.push({repoPath:p.repoPath,bytes:bytes.length,sha256:sha,pinnedSha256:p.sha256,pinnedBytes:p.bytes,byteExact:ok});
 manifest.checks.push({check:'byte-exact inline pin',target:p.repoPath,pass:ok});
 if(!ok){fs.writeFileSync(path.join(ROOT,'evidence/clean-runtime/track-b/b7-engine-manifest.json'),JSON.stringify(manifest,null,2));console.error('FAIL-CLOSED: inline pin mismatch on '+p.repoPath+' (expected '+p.sha256+'/'+p.bytes+', got '+sha+'/'+bytes.length+')');process.exit(1)}}
// Node-side descriptor digest for the same tree (browser must equal this).
const {buildVisualSceneDescriptor}=require(path.join(ROOT,'src/clean-runtime/school/scene-v2/visual-descriptor.js'));
const nodeDescriptor=buildVisualSceneDescriptor();
manifest.nodeDescriptor={status:nodeDescriptor.status,digest:nodeDescriptor.descriptorDigest,worldDigest:nodeDescriptor.worldRef.stateDigest,packageDigest:nodeDescriptor.sourcePackage.scenePackageDigest,replayMatchesCommittedState:nodeDescriptor.worldRef.replayMatchesCommittedState};
const expectedPins={packageDigest:'187cf1a4c0af01ef12087879f44eeb88a355499a860665e29cdb2f5ab0d06aec',worldDigest:'fa1bbaa985a63a8bfa30c2bbd7fbaf14b2c4972d985815a093bdd68f7fe954ea',nodeDescriptorDigest:'5f6829b7b10bbbc91ff0bd7e66bd5de3c69473091d56af92f8decbc8cbecaa18'};
for(const [k,v] of Object.entries(expectedPins)){const actual=k==='packageDigest'?manifest.nodeDescriptor.packageDigest:k==='worldDigest'?manifest.nodeDescriptor.worldDigest:manifest.nodeDescriptor.digest;const ok=actual===v;manifest.checks.push({check:'runtime anchor '+k,target:v,pass:ok});if(!ok){fs.writeFileSync(path.join(ROOT,'evidence/clean-runtime/track-b/b7-engine-manifest.json'),JSON.stringify(manifest,null,2));console.error('FAIL-CLOSED: '+k+' mismatch (expected '+v+', got '+actual+')');process.exit(1)}}
(async()=>{
 const result=await esbuild.build({entryPoints:[path.join(ROOT,'visual-slice/engine/entry.mjs')],bundle:true,format:'esm',platform:'browser',outfile:path.join(ROOT,'visual-slice/engine-bundle.js'),logLevel:'silent',
  alias:{'node:crypto':path.join(ROOT,'visual-slice/engine/shims/crypto.mjs'),'node:fs':path.join(ROOT,'visual-slice/engine/shims/fs.mjs'),'node:path':path.join(ROOT,'visual-slice/engine/shims/path.mjs')},
  inject:[path.join(ROOT,'visual-slice/engine/shims/buffer-inject.mjs')],define:{__dirname:'"/virtual"'},loader:{'.json':'text'}});
 manifest.esbuildVersion=esbuild.version;
 const bundleBytes=fs.readFileSync(path.join(ROOT,'visual-slice/engine-bundle.js'));
 manifest.bundle={path:'visual-slice/engine-bundle.js',bytes:bundleBytes.length,sha256:crypto.createHash('sha256').update(bundleBytes).digest('hex'),minified:false};
 manifest.checks.push({check:'bundle built',target:manifest.bundle.sha256,pass:true});
 fs.writeFileSync(path.join(ROOT,'evidence/clean-runtime/track-b/b7-engine-manifest.json'),JSON.stringify(manifest,null,2));
 console.log('OK bundle',manifest.bundle.bytes,'bytes sha',manifest.bundle.sha256.slice(0,16)+'...','| esbuild',esbuild.version,'| node descriptor',manifest.nodeDescriptor.digest.slice(0,16)+'...');
})().catch(e=>{console.error('FAIL',e.message);process.exit(1)});
