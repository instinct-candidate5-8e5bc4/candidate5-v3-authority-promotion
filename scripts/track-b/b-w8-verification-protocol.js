'use strict';
// B-W8: scripted desktop+mobile visual verification protocol for the Track B
// visual slice. Full matrix: (1440x900 desktop, 390x844 mobile) x
// (day/night/winter lighting rigs) x (seat/legal/wall demo actions), plus
// first-frame composition checks and the UNAVAILABLE scene-family negative
// case. Runnable against any pushed head via --base-url (default: local
// server against this repo). Honest-output policy: outcomes are asserted
// against the certified anchor set; a changed outcome FAILS - expectations
// are never adjusted to pass. Exit 0 = PASS, 1 = any FAIL.
//
// Usage: node scripts/track-b/b-w8-verification-protocol.js
//          [--base-url URL] [--out report.json] [--shots-dir DIR] [--port N]
const path=require('node:path'),fs=require('node:fs'),{spawn,execSync}=require('node:child_process');
const ROOT=path.join(__dirname,'../..');

const MATRIX={
 viewports:[{name:'desktop',width:1440,height:900},{name:'mobile',width:390,height:844}],
 rigs:['day','night','winter'],
 actions:['seat','legal','wall'],
 unavailableFamily:'drowning',
};
// Certified anchor set - the fail-closed contract for all Track B verification.
const ANCHORS={
 baseWorldDigest:'fa1bbaa985a63a8bfa30c2bbd7fbaf14b2c4972d985815a093bdd68f7fe954ea',
 legalMoveWorldDigest:'0ff66dcebe2cdb310e08ee4b9d493e3360e6c3f2077dfe896716238a6f61066e',
 packageDigestPrefix:'187cf1a4c0af01ef',
 sceneFamily:'school-treatment-room',
 sceneId:'school-treatment-room-v1',
 bannerWarning:'VISUALS ARE NOT CERTIFIED PHYSICS',
};
const EXPECT={
 seat:['LEGALITY_FAIL','CONTACT_GAP_FLOATING',ANCHORS.baseWorldDigest.slice(0,16)],
 legal:['אושר והופעל',ANCHORS.legalMoveWorldDigest.slice(0,16),ANCHORS.packageDigestPrefix],
 wall:['OBSTACLE_PENETRATION','דטרמיניסטי',ANCHORS.baseWorldDigest.slice(0,16)],
};
// Blank-canvas detectors (not quality bars): scene background 0x101a20 maxes
// at channel 32, so >40 means rendered content. Night is dark by design.
const PIXELS={day:{minNonBlack:0.01,minBuckets:6},night:{minNonBlack:0.001,minBuckets:3},winter:{minNonBlack:0.01,minBuckets:6}};

module.exports={MATRIX,ANCHORS,EXPECT};

async function main(){
 const argv=process.argv.slice(2);
 const arg=n=>{const i=argv.indexOf('--'+n);return i>=0?argv[i+1]:undefined};
 let baseUrl=arg('base-url');
 const outPath=arg('out')||'/tmp/b-w8-report.json';
 const shotsDir=arg('shots-dir')||'/tmp/b-w8-shots';
 const port=arg('port')||'8897';
 fs.mkdirSync(shotsDir,{recursive:true});
 let srv=null;
 if(!baseUrl){
  srv=spawn('python3',['-m','http.server',port,'-d',ROOT],{stdio:'ignore'});
  for(let i=0;i<30;i++){try{execSync(`curl -sf -o /dev/null http://127.0.0.1:${port}/visual-slice/index.html`);break}catch(e){await new Promise(r=>setTimeout(r,500))}}
  baseUrl=`http://127.0.0.1:${port}/visual-slice/`;
 }
 if(!baseUrl.endsWith('/'))baseUrl+='/';
 const puppeteer=require('puppeteer');
 const browser=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',
  args:['--no-sandbox','--disable-gpu','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const checks=[],shots=[];
 const check=(scope,name,ok,detail)=>{checks.push({scope,name,ok:!!ok,detail:detail||''});
  console.log((ok?'PASS ':'FAIL ')+scope+': '+name+(detail?' ('+detail+')':''))};
 async function analyzeShot(page,file,scope,rig){
  const buf=await page.screenshot();
  fs.writeFileSync(file,buf);shots.push(file);
  const st=await page.evaluate(async du=>{
   const img=new Image();
   await new Promise((res,rej)=>{img.onload=res;img.onerror=rej;img.src=du});
   const c=document.createElement('canvas');c.width=img.width;c.height=img.height;
   const g=c.getContext('2d');g.drawImage(img,0,0);
   const d=g.getImageData(0,0,c.width,c.height).data;
   let nb=0,t=0;const bk=new Set();
   for(let i=0;i<d.length;i+=64){const r=d[i],gg=d[i+1],b=d[i+2];t++;
    if(Math.max(r,gg,b)>40)nb++;
    bk.add((r>>5)+','+(gg>>5)+','+(b>>5))}
   return{nonBlackRatio:nb/t,buckets:bk.size};
  },'data:image/png;base64,'+buf.toString('base64'));
  const t=PIXELS[rig];
  check(scope,`canvas non-blank under ${rig} rig`,st.nonBlackRatio>=t.minNonBlack&&st.buckets>=t.minBuckets,
   `nonBlack=${(st.nonBlackRatio*100).toFixed(2)}% buckets=${st.buckets}`);
 }
 async function runViewport(vp){
  const scope=vp.name;
  const page=await browser.newPage();
  await page.setViewport({width:vp.width,height:vp.height,deviceScaleFactor:1});
  const errs=[];page.on('pageerror',e=>errs.push(String(e)));
  await page.goto(baseUrl,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForSelector('#btnSeat',{timeout:30000});
  // B-W2 race fix: buttons ship disabled and enable only after fail-closed
  // engine init completes. Wait for all three ENABLED before any interaction.
  await page.waitForFunction(
   `['btnSeat','btnLegal','btnWall'].every(id=>{const b=document.getElementById(id);return b&&!b.disabled})`,
   {timeout:30000});
  const ev=(sel,fn)=>page.$eval(sel,fn);
  // --- first-frame composition ---
  const hud=await ev('#hud',el=>el.textContent);
  check(scope,'banner carries the honesty warning',hud.includes(ANCHORS.bannerWarning));
  check(scope,'distinction line rendered',(await ev('#distinction',el=>el.textContent.trim())).length>10);
  const meta=await ev('#meta',el=>el.textContent);
  check(scope,'meta line carries branch + world + package digests',meta.includes('branch')&&meta.includes(ANCHORS.baseWorldDigest.slice(0,16))&&meta.includes(ANCHORS.packageDigestPrefix));
  check(scope,'engine line rendered',(await ev('#engine',el=>el.textContent.trim())).length>20);
  check(scope,'caveats block rendered',(await ev('#caveats',el=>el.textContent.trim())).length>20);
  const ds=await page.evaluate(()=>({...document.body.dataset}));
  check(scope,'engine descriptor pinned (64-hex)',/^[0-9a-f]{64}$/.test(ds.engineDescriptor||''));
  check(scope,'scene family + id from registry',ds.sceneFamily===ANCHORS.sceneFamily&&ds.sceneId===ANCHORS.sceneId,`family=${ds.sceneFamily} id=${ds.sceneId}`);
  const cs=await page.evaluate(()=>{const c=document.querySelector('canvas');return c?{w:c.clientWidth,h:c.clientHeight}:null});
  check(scope,'canvas attached and sized',!!cs&&cs.w>0&&cs.h>0,cs?`${cs.w}x${cs.h}`:'no canvas');
  try{await page.waitForFunction(`document.getElementById('fps')&&document.getElementById('fps').textContent.includes('FPS')`,{timeout:5000});
   check(scope,'FPS meter live (measured on this hardware)',true)}catch(e){check(scope,'FPS meter live (measured on this hardware)',false)}
  check(scope,'day rig active by default',await page.evaluate(()=>document.querySelector('#rigbar button[data-rig="day"]').dataset.active==='true'));
  check(scope,'demo panel is RTL',(await ev('#demo',el=>getComputedStyle(el).direction))==='rtl');
  await analyzeShot(page,path.join(shotsDir,`b-w8-${scope}-firstframe-day.png`),scope,'day');
  // --- lighting rigs: presentation-only, geometry/digests untouched ---
  for(const rig of['night','winter']){
   await page.click(`#rigbar button[data-rig="${rig}"]`);
   await page.waitForFunction(`document.querySelector('#rigbar button[data-rig="${rig}"]').dataset.active==='true'`,{timeout:10000});
   const after=await page.evaluate(()=>({desc:document.body.dataset.engineDescriptor,out:document.getElementById('demoOut').textContent}));
   check(scope,`${rig} rig activates, descriptor unchanged, demo state untouched`,after.desc===ds.engineDescriptor&&after.out==='');
   await analyzeShot(page,path.join(shotsDir,`b-w8-${scope}-rig-${rig}.png`),scope,rig);
  }
  await page.click('#rigbar button[data-rig="day"]');
  await page.waitForFunction(`document.querySelector('#rigbar button[data-rig="day"]').dataset.active==='true'`,{timeout:10000});
  // --- demo actions: exact certified gate outcomes ---
  async function act(id){await page.click('#'+id);
   await page.waitForFunction(`!document.querySelector('#demoOut').textContent.includes('מעבד')`,{timeout:30000});
   return ev('#demoOut',el=>el.textContent)}
  for(const a of MATRIX.actions){
   const id='btn'+a[0].toUpperCase()+a.slice(1);
   const out=await act(id);
   for(const sub of EXPECT[a])check(scope,`${a}: output contains "${sub.slice(0,24)}"`,out.includes(sub));
  }
  check(scope,'no page errors',errs.length===0,errs.slice(0,2).join(' | '));
  await page.close();
 }
 async function runUnavailable(vp){
  const scope=vp.name+'-unavailable';
  const page=await browser.newPage();
  await page.setViewport({width:vp.width,height:vp.height,deviceScaleFactor:1});
  const errs=[];page.on('pageerror',e=>errs.push(String(e)));
  await page.goto(baseUrl+'?scene='+MATRIX.unavailableFamily,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(`document.body.dataset.sceneUnavailable`,{timeout:30000});
  const ds=await page.evaluate(()=>({...document.body.dataset}));
  check(scope,'UNAVAILABLE family flagged, no fallback scene',ds.sceneUnavailable===MATRIX.unavailableFamily&&!ds.sceneFamily);
  const err=await page.$eval('#err',el=>({t:el.textContent,d:getComputedStyle(el).display}));
  check(scope,'explicit Hebrew unavailable reason shown',err.d==='flex'&&err.t.includes('אינה זמינה'));
  check(scope,'demo buttons stay disabled (no engine, no actions)',await page.evaluate(()=>document.getElementById('btnSeat').disabled===true));
  check(scope,'exactly one fail-closed page error',errs.length===1&&errs[0].includes('scene unavailable'),errs[0]||'none');
  await page.screenshot({path:path.join(shotsDir,`b-w8-${scope}.png`)});
  await page.close();
 }
 for(const vp of MATRIX.viewports){await runViewport(vp);await runUnavailable(vp)}
 await browser.close();if(srv)srv.kill();
 const failures=checks.filter(c=>!c.ok);
 const report={baseUrl,startedAt:new Date().toISOString(),totalChecks:checks.length,failures:failures.length,checks,screenshots:shots,result:failures.length?'FAIL':'PASS'};
 fs.writeFileSync(outPath,JSON.stringify(report,null,1));
 console.log('REPORT: '+outPath);
 console.log('RESULT: '+(failures.length?`FAIL (${failures.length})`:'PASS - '+checks.length+' checks'));
 process.exit(failures.length?1:0);
}
if(require.main===module)main().catch(e=>{console.error(e);process.exit(1)});
