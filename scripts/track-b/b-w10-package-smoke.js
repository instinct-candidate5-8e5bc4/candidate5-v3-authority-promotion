'use strict';
// TRACK B / B-W10 package browser smoke: mount, status, projection render
// (highlight + finding), placement validation (legal/illegal), unmount.
const path=require('node:path'),{execSync,spawn}=require('node:child_process');
const ROOT=path.join(__dirname,'../..');
(async()=>{
function loadPuppeteer(){try{return require('puppeteer')}catch{}
 if(process.env.SCRATCH_NODE_MODULES){for(const n of['puppeteer','puppeteer-core']){try{return require(require('node:module').createRequire(require('node:path').join(process.env.SCRATCH_NODE_MODULES,n,'package.json')).resolve(n))}catch{}}}
 try{return require('puppeteer-core')}catch{}
 console.log('SKIP: puppeteer not installed');process.exit(2)}
 const puppeteer=loadPuppeteer();
 const srv=spawn('python3',['-m','http.server','8898','-d',ROOT],{stdio:'ignore'});
 for(let i=0;i<30;i++){try{execSync('curl -sf -o /dev/null http://127.0.0.1:8898/visual-slice/package/smoke-host.html');break}catch(e){await new Promise(r=>setTimeout(r,500))}}
 const browser=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',
  args:['--no-sandbox','--disable-gpu','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage();
 await page.setViewport({width:1000,height:700,deviceScaleFactor:1});
 const errs=[];page.on('pageerror',e=>errs.push(String(e)));
 await page.goto('http://127.0.0.1:8898/visual-slice/package/smoke-host.html',{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(`document.body.dataset.mount&&document.body.dataset.mount.startsWith('ok')`,{timeout:60000});
 const out=[];const c=(label,ok)=>out.push((ok?'PASS ':'FAIL ')+label);
 const st=await page.evaluate(()=>window.__smoke.pkg.status());
 c('mount ok + status mounted',st.mounted===true);
 c('build stamp commit is 40-hex',/^[0-9a-f]{40}$/.test(st.build.commit));
 c('manifest verified in-browser',st.manifestOk===true);
 c('gate statuses detailed (reviewIds)',st.statuses.statuses.casualty.reviewId==='gate-b-user-review-ee04481'&&st.statuses.statuses.chair.reviewId==='gate-c-user-review-0c27c92');
 c('stale casualty label marked superseded',st.statuses.superseded.length===1&&st.statuses.superseded[0].entityId==='school-casualty-adult-v1');
 c('3 certified entities bound in registry (synthetic unit tracked separately)',st.boundEntities.length===3);
 c('synthetic unit bound via host table',st.syntheticUnit&&st.syntheticUnit.bound===true&&st.syntheticUnit.gateAStatus==='PROPOSED_NOT_ADMITTED');
 // Projection: examine-style highlight + bounded finding text.
 const proj=await page.evaluate(()=>window.__smoke.pkg.renderFromProjection({
  kind:'TRACK_B_PUBLIC_PROJECTION',contractVersion:'0.2',cue:'SYNTHETIC_ACTION_COMPLETED',
  entities:[{publicRef:'pub-casualty-1',highlightComponentIds:['head','torso'],visiblePoseCode:'SUPINE_FLOOR',findingText:'ממצא ציבורי מצונזר: אוויר נכנס ויוצא.'}]}));
 c('projection applied (highlight+finding+pose)',proj.applied===true&&proj.actions.length===3);
 const findingShown=await page.evaluate(()=>{const el=[...document.querySelectorAll('#host div')].pop();return el.textContent.includes('אוויר נכנס')&&el.style.display!=='none'});
 c('finding text rendered verbatim in bounded panel',findingShown);
 // Rejections: unbound ref, unknown component, unknown cue, unknown pose.
 const rej=await page.evaluate(()=>[
  window.__smoke.pkg.renderFromProjection({kind:'TRACK_B_PUBLIC_PROJECTION',contractVersion:'0.2',entities:[{publicRef:'nobody',highlightComponentIds:['head']}]}),
  window.__smoke.pkg.renderFromProjection({kind:'TRACK_B_PUBLIC_PROJECTION',contractVersion:'0.2',entities:[{publicRef:'pub-casualty-1',highlightComponentIds:['jetpack']}]}),
  window.__smoke.pkg.renderFromProjection({kind:'TRACK_B_PUBLIC_PROJECTION',contractVersion:'0.2',cue:'FLY_AWAY',entities:[]}),
  window.__smoke.pkg.renderFromProjection({kind:'TRACK_B_PUBLIC_PROJECTION',contractVersion:'0.2',entities:[{publicRef:'pub-casualty-1',visiblePoseCode:'RUNNING'}]})].map(r=>r.applied));
 c('4 hostile projections all rejected with no visual action',rej.every(x=>x===false));
 // Placement validation propose-only: floor legal, wall illegal.
 const rel=await page.evaluate(()=>window.__smoke.pkg.validatePlacement({positionMicrounits:[-1200000,175000,1000000],relation:window.__srcRel}));
 c('floor placement propose-valid',rel.valid===true&&rel.code==='OK');
 const wall=await page.evaluate(()=>window.__smoke.pkg.validatePlacement({positionMicrounits:[0,175000,-3900000],relation:window.__srcRel}));
 c('wall placement propose-invalid (OBSTACLE_PENETRATION)',wall.valid===false&&wall.code!=='OK');
 const st2=await page.evaluate(()=>window.__smoke.pkg.status());
 c('world unchanged by validations (bag still INITIAL)',st2.bagLocation==='INITIAL');
 // Bag relocation via projection (committed-result presentation).
 const mv=await page.evaluate(()=>window.__smoke.pkg.renderFromProjection({kind:'TRACK_B_PUBLIC_PROJECTION',contractVersion:'0.2',cue:'SYNTHETIC_ACTION_COMPLETED',entities:[{publicRef:'pub-bag-1',visibleLocationCode:'FLOOR_BESIDE_CHAIR'}]}));
 const moved=await page.evaluate(()=>window.__smoke.pkg.status().bagLocation);
 c('bag relocation projection applied',mv.applied===true&&moved==='FLOOR_BESIDE_CHAIR');
 // B-W11 (contract v0.3): synthetic unit use-state presentation + hostile rejections.
 const syn=await page.evaluate(()=>window.__smoke.pkg.renderFromProjection({kind:'TRACK_B_PUBLIC_PROJECTION',contractVersion:'0.3',entities:[{publicRef:'pub-synthetic-unit-1',publicUseState:'RESERVED'}]}));
 c('v0.3 use-state projection applied to synthetic unit',syn.applied===true);
 const synSt=await page.evaluate(()=>window.__smoke.pkg.status().syntheticUnit);
 c('status reports synthetic unit RESERVED, still PROPOSED_NOT_ADMITTED',synSt.bound===true&&synSt.useState==='RESERVED'&&synSt.gateAStatus==='PROPOSED_NOT_ADMITTED');
 const rej3=await page.evaluate(()=>[
  window.__smoke.pkg.renderFromProjection({kind:'TRACK_B_PUBLIC_PROJECTION',contractVersion:'9.9',entities:[]}),
  window.__smoke.pkg.renderFromProjection({kind:'TRACK_B_PUBLIC_PROJECTION',contractVersion:'0.3',entities:[{publicRef:'pub-casualty-1',publicUseState:'RESERVED'}]}),
  window.__smoke.pkg.renderFromProjection({kind:'TRACK_B_PUBLIC_PROJECTION',contractVersion:'0.3',entities:[{publicRef:'pub-synthetic-unit-1',publicUseState:'EXPLODED'}]})].map(r=>r.applied));
 c('3 hostile v0.3 projections all rejected (unknown version, use-state on clinical entity, unknown use-state)',rej3.every(x=>x===false));
 const shot='/tmp/b-w10-package-smoke.png';await page.screenshot({path:shot});
 const un=await page.evaluate(()=>window.__smoke.pkg.unmount());
 c('unmount clean',un.ok===true);
 c('no page errors',errs.length===0);
 await browser.close();srv.kill();
 out.forEach(x=>console.log(x));console.log('SCREENSHOT: '+shot);
 const fails=out.filter(x=>x.startsWith('FAIL'));
 console.log('RESULT: '+(fails.length?'FAIL ('+fails.length+')':'PASS'));
 process.exit(fails.length?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
