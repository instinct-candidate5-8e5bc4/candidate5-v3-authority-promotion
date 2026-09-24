'use strict';
// TRACK B / B7 engine smoke (evidence-only). Starts a local static server,
// loads visual-slice in headless Chromium and asserts the fail-closed engine
// gate: page-load instantiate executes in-browser, browser descriptor digest
// equals the Node digest pin, and all exported anchors match the certified
// pins. Dev-only deps: puppeteer in a scratch dir (SCRATCH_NODE_MODULES=...
// or NODE_PATH resolvable via createRequire), zero cost. Emulated GL only;
// NOT a perf result.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {createRequire}=require('node:module');
const CANDIDATES=[process.env.CHROME_PATH,'/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].filter(Boolean);
const chrome=CANDIDATES.find(p=>fs.existsSync(p));
function loadPuppeteer(){
 try{return require('puppeteer')}catch{}
 if(process.env.SCRATCH_NODE_MODULES){try{return createRequire(path.join(process.env.SCRATCH_NODE_MODULES,'puppeteer','package.json'))('puppeteer')}catch{}}
 console.log('SKIP: puppeteer not installed (dev-only: npm i puppeteer in a scratch dir, set SCRATCH_NODE_MODULES)');process.exit(2)}
async function main(){
 if(!chrome){console.log('SKIP: no Chromium binary found (set CHROME_PATH)');process.exit(2)}
 const puppeteer=loadPuppeteer();
 const root=path.join(__dirname,'../..');
 const MIME={'.html':'text/html','.js':'text/javascript','.json':'application/json','.mjs':'text/javascript'};
 const server=http.createServer((req,res)=>{const f=path.join(root,decodeURIComponent(new URL(req.url,'http://x').pathname));
  fs.readFile(f,(e,b)=>{if(e){res.writeHead(404);res.end('nf')}else{res.writeHead(200,{'content-type':MIME[path.extname(f)]||'application/octet-stream'});res.end(b)}})});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const BASE='http://127.0.0.1:'+server.address().port;
 const fails=[];const check=(n,ok,d)=>{fails.push(...(ok?[]:[n+(d?': '+d:'')]));console.log((ok?'PASS':'FAIL')+' '+n+(d?' ('+d+')':''))};
 try{
  const browser=await puppeteer.launch({executablePath:chrome,headless:'new',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--window-size=1280,800']});
  const page=await browser.newPage();await page.setViewport({width:1280,height:800});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(BASE+'/visual-slice/index.html',{waitUntil:'networkidle0',timeout:60000});
  await new Promise(r=>setTimeout(r,3000));
  const r2=await page.evaluate(async()=>{const E=await import('./engine-bundle.js');
   const d=E.buildVisualSceneDescriptor();
   return {failed:document.body.dataset.engineFailed||null,datasetDigest:document.body.dataset.engineDescriptor||null,status:d.status,packageDigest:d.sourcePackage.scenePackageDigest,worldDigest:d.worldRef.stateDigest,replay:d.worldRef.replayMatchesCommittedState,descriptorDigest:d.descriptorDigest,expected:E.EXPECTED}});
  check('no page errors',errors.length===0,errors.slice(0,2).join('; '));
  check('no fail-closed trigger',r2.failed===null,r2.failed);
  check('status COMMITTED',r2.status==='COMMITTED',r2.status);
  check('package digest anchor',r2.packageDigest===r2.expected.packageDigest);
  check('world digest anchor',r2.worldDigest===r2.expected.worldDigest);
  check('replay matches committed state',r2.replay===true);
  check('browser descriptor == Node descriptor pin',r2.descriptorDigest===r2.expected.nodeDescriptorDigest,r2.descriptorDigest);
  check('HUD dataset digest pinned',r2.datasetDigest===r2.expected.nodeDescriptorDigest,r2.datasetDigest);
  // NEGATIVE (page layer): invoking the fail-closed hook must surface the
  // full-screen error panel and mark the document, i.e. a digest mismatch
  // cannot render silently.
  await page.evaluate(()=>{try{window.__engineFailClosed('synthetic digest mismatch')}catch(e){}});
  await new Promise(r=>setTimeout(r,200));
  const neg=await page.evaluate(()=>{const e=document.getElementById('err');const cs=getComputedStyle(e);return {visible:cs.display!=='none',text:e.textContent,flag:document.body.dataset.engineFailed||null}});
  check('negative: fail hook shows error panel',neg.visible&&/FAIL-CLOSED/.test(neg.text),neg.text&&neg.text.slice(0,60));
  check('negative: document marked failed',neg.flag==='synthetic digest mismatch',neg.flag);
  await browser.close();
 }finally{server.close()}
 if(fails.length){console.log('RESULT: FAIL ('+fails.length+')');process.exit(1)}
 console.log('RESULT: PASS')}
main().catch(e=>{console.error('ERROR',e.message);process.exit(1)});
