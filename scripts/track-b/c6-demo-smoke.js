'use strict';
// C6 demo panel browser smoke: seat REJECT / floor COMMIT / wall REJECT, RTL Hebrew output, digests.
const path=require('node:path'),{execSync,spawn}=require('node:child_process'),fs=require('node:fs');
const ROOT=path.join(__dirname,'../..');
(async()=>{
 const puppeteer=require('/home/sandbox/verify/node_modules/puppeteer');
 const srv=spawn('python3',['-m','http.server','8899','-d',ROOT],{stdio:'ignore'});
 for(let i=0;i<30;i++){try{execSync('curl -sf -o /dev/null http://127.0.0.1:8899/visual-slice/index.html');break}catch(e){await new Promise(r=>setTimeout(r,500))}}
 const browser=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',
  args:['--no-sandbox','--disable-gpu','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const out={checks:[],shots:[]};
 async function runViewport(name,w,h){
  const page=await browser.newPage();
  await page.setViewport({width:w,height:h,deviceScaleFactor:1});
  const errs=[];page.on('pageerror',e=>errs.push(String(e)));
  await page.goto('http://127.0.0.1:8899/visual-slice/',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForSelector('#btnSeat',{timeout:30000});
  async function click(id){await page.click('#'+id);await page.waitForFunction(
    `!document.querySelector('#demoOut').textContent.includes('מעבד')`,{timeout:30000});
   return page.$eval('#demoOut',el=>el.textContent)}
  const seat=await click('btnSeat');
  const legal=await click('btnLegal');
  const wall=await click('btnWall');
  const base='fa1bbaa985a63a8bfa30c2bbd7fbaf14b2c4972d985815a093bdd68f7fe954ea';
  const nd='0ff66dcebe2cdb310e08ee4b9d493e3360e6c3f2077dfe896716238a6f61066e';
  const c=(label,ok)=>out.checks.push((ok?'PASS ':'FAIL ')+name+': '+label);
  c('seat REJECTED with LEGALITY_FAIL + CONTACT_GAP_FLOATING',seat.includes('LEGALITY_FAIL')&&seat.includes('CONTACT_GAP_FLOATING'));
  c('seat digest unchanged line (base==state)',seat.includes(base.slice(0,16)));
  c('floor COMMITTED with new digest',legal.includes('אושר והופעל')&&legal.includes(nd.slice(0,16)));
  c('floor anchors shown (package digest)',legal.includes('187cf1a4c0af01ef'));
  c('wall REJECTED OBSTACLE_PENETRATION, run twice deterministic',wall.includes('OBSTACLE_PENETRATION')&&wall.includes('דטרמיניסטי'));
  c('wall digest unchanged',wall.includes(base.slice(0,16)));
  c('no page errors',errs.length===0);
  const rtl=await page.$eval('#demo',el=>getComputedStyle(el).direction);
  c('demo panel is RTL',rtl==='rtl');
  const shot='/tmp/c6-demo-'+name+'.png';
  await page.screenshot({path:shot});out.shots.push(shot);
  await page.close();
 }
 await runViewport('desktop',1440,900);
 await runViewport('mobile',390,844);
 await browser.close();srv.kill();
 const fails=out.checks.filter(x=>x.startsWith('FAIL'));
 out.checks.forEach(x=>console.log(x));
 console.log('SCREENSHOTS: '+out.shots.join(' '));
 console.log('RESULT: '+(fails.length?'FAIL ('+fails.length+')':'PASS'));
 process.exit(fails.length?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
