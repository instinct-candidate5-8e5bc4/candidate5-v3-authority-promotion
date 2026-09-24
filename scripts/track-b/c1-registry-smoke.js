'use strict';
// TRACK B / C1 registry smoke (evidence-only). Asserts the scene-family
// registry contract in a real browser: default family renders; UNAVAILABLE
// and unknown families show the explicit UNAVAILABLE state and render no
// scene. Dev-only deps: puppeteer via SCRATCH_NODE_MODULES. Zero cost.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const CANDIDATES=[process.env.CHROME_PATH,'/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].filter(Boolean);
const chrome=CANDIDATES.find(p=>fs.existsSync(p));
function loadPuppeteer(){try{return require('puppeteer')}catch{} if(process.env.SCRATCH_NODE_MODULES){try{return require(require('node:module').createRequire(path.join(process.env.SCRATCH_NODE_MODULES,'puppeteer','package.json')).resolve('puppeteer'))}catch{}} console.log('SKIP: puppeteer not installed');process.exit(2)}
async function main(){
 if(!chrome){console.log('SKIP: no Chromium binary');process.exit(2)}
 const puppeteer=loadPuppeteer();
 const root=path.join(__dirname,'../..');
 const MIME={'.html':'text/html','.js':'text/javascript','.json':'application/json','.mjs':'text/javascript'};
 const server=http.createServer((req,res)=>{const f=path.join(root,decodeURIComponent(new URL(req.url,'http://x').pathname));
  fs.readFile(f,(e,b)=>{if(e){res.writeHead(404);res.end('nf')}else{res.writeHead(200,{'content-type':MIME[path.extname(f)]||'application/octet-stream'});res.end(b)}})});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const BASE='http://127.0.0.1:'+server.address().port;
 const fails=[];const check=(n,ok,d)=>{fails.push(...(ok?[]:[n]));console.log((ok?'PASS':'FAIL')+' '+n+(d?' ('+d+')':''))};
 try{
  const browser=await puppeteer.launch({executablePath:chrome,headless:'new',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const probe=async(url)=>{const p=await browser.newPage();await p.setViewport({width:1280,height:800});
   await p.goto(url,{waitUntil:'networkidle0',timeout:60000}).catch(()=>{});
   await new Promise(r=>setTimeout(r,2500));
   const r2=await p.evaluate(()=>({unavail:document.body.dataset.sceneUnavailable||null,family:document.body.dataset.sceneFamily||null,sceneId:document.body.dataset.sceneId||null,canvas:!!document.querySelector('canvas'),err:document.getElementById('err').textContent,errVisible:getComputedStyle(document.getElementById('err')).display!=='none',dir:document.getElementById('err').getAttribute('dir'),lang:document.getElementById('err').getAttribute('lang')}));
   await p.close();return r2};
  const d=await probe(BASE+'/visual-slice/index.html');
  check('default family renders the treatment room',d.canvas&&d.family==='school-treatment-room'&&d.sceneId==='school-treatment-room-v1'&&!d.unavail,JSON.stringify({family:d.family,unavail:d.unavail}));
  const u=await probe(BASE+'/visual-slice/index.html?scene=drowning');
  check('drowning family -> UNAVAILABLE panel (Hebrew RTL)',u.errVisible&&/\u05d0\u05d9\u05e0\u05d4 \u05d6\u05de\u05d9\u05e0\u05d4/.test(u.err)&&u.unavail==='drowning'&&u.dir==='rtl'&&u.lang==='he',u.err.slice(0,60)+' dir='+u.dir);
  check('drowning renders NO scene canvas',!u.canvas);
  check('UNAVAILABLE states the honest reason (Hebrew)',/\u05d8\u05d1\u05d9\u05e2\u05d4/.test(u.err)&&/\u05ea\u05d7\u05dc\u05d9\u05e3/.test(u.err),u.err.slice(0,80));
  const s=await probe(BASE+'/visual-slice/index.html?scene=synagogue');
  check('synagogue family -> UNAVAILABLE (registry honesty, no placeholder)',s.errVisible&&/\u05d1\u05d9\u05ea \u05db\u05e0\u05e1\u05ea/.test(s.err)&&s.unavail==='synagogue'&&!s.canvas);
  const x=await probe(BASE+'/visual-slice/index.html?scene=bogus');
  check('unknown family -> UNAVAILABLE (no fallback)',x.errVisible&&/\u05d0\u05d9\u05e0\u05d4 \u05e7\u05d9\u05d9\u05de\u05ea/.test(x.err)&&x.unavail==='bogus'&&!x.canvas);
  await browser.close();
 }finally{server.close()}
 if(fails.length){console.log('RESULT: FAIL ('+fails.length+')');process.exit(1)}
 console.log('RESULT: PASS')}
main().catch(e=>{console.error('ERROR',e.message);process.exit(1)});
