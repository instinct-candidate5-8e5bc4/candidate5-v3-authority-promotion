'use strict';
// TRACK B / B6 visual smoke test. Asserts PIXELS/VISUAL BEHAVIOR ONLY - never
// physical legality. Requires a Chromium-family binary (CHROME_PATH or common
// paths) and `npm i puppeteer pngjs` in a scratch dir (dev-only, zero cost).
// Emulated/software-GL FPS is NOT a perf result and is never asserted here.
const fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const CANDIDATES=[process.env.CHROME_PATH,'/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser','C:/Program Files/Google/Chrome/Application/chrome.exe'].filter(Boolean);
const chrome=CANDIDATES.find(p=>fs.existsSync(p));
async function main(){
 if(!chrome){console.log('SKIP: no Chromium binary found (set CHROME_PATH)');process.exit(2)}
 let puppeteer,PNG;
 try{puppeteer=require('puppeteer')}catch{console.log('SKIP: puppeteer not installed (dev-only: npm i puppeteer pngjs)');process.exit(2)}
 try{PNG=require('pngjs').PNG}catch{console.log('SKIP: pngjs not installed (dev-only: npm i puppeteer pngjs)');process.exit(2)}
 const root=path.join(__dirname,'../..');
 const server=spawn('python3',['-m','http.server','8123'],{cwd:root,stdio:'ignore'});await new Promise(r=>setTimeout(r,1200));
 const fails=[];const check=(name,ok,detail)=>{fails.push(...(ok?[]:[name+(detail?': '+detail:'')]));console.log((ok?'PASS':'FAIL')+' '+name+(detail?' ('+detail+')':''))};
 try{
  const browser=await puppeteer.launch({executablePath:chrome,headless:'new',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--window-size=1280,800']});
  const page=await browser.newPage();await page.setViewport({width:1280,height:800});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://localhost:8123/visual-slice/',{waitUntil:'networkidle0',timeout:60000});
  await new Promise(r=>setTimeout(r,4000));
  const c=await page.evaluate(()=>{const cv=document.querySelector('canvas'),hud=document.getElementById('hud').innerText;return {canvas:!!cv,webgl:!!(cv&&(cv.getContext('webgl2')||cv.getContext('webgl'))),banner:hud.includes('VISUALS ARE NOT CERTIFIED PHYSICS'),distinction:hud.includes('presentation-only projection'),branch:/candidate5-track-b-visual-slice/.test(hud),fpsMeter:!!document.getElementById('fps')}});
  check('canvas exists',c.canvas);check('webgl context',c.webgl);check('banner VISUALS ARE NOT CERTIFIED PHYSICS',c.banner);check('visuals-vs-physical distinction shown',c.distinction);check('branch+commit shown',c.branch);check('FPS meter present',c.fpsMeter);check('no page errors',errors.length===0,errors.join('; '));
  const png=PNG.sync.read(await page.screenshot());let sum=0,dark=0;const n=png.width*png.height;
  for(let i=0;i<png.data.length;i+=4){const l=(png.data[i]+png.data[i+1]+png.data[i+2])/3;sum+=l;if(l<12)dark++}
  const avg=sum/n,frac=dark/n;
  check('scene renders non-black pixels',avg>8,'avgLuma='+avg.toFixed(1));
  check('scene is not a blank dark frame',frac<0.9,'darkFrac='+frac.toFixed(3));
  await browser.close();
 }finally{server.kill()}
 if(fails.length){console.log('RESULT: FAIL ('+fails.length+')');process.exit(1)}
 console.log('RESULT: PASS')}
main().catch(e=>{console.error('ERROR',e.message);process.exit(1)});
