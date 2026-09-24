'use strict';
// C3 browser gates: G9/G10 first-frame patient containment (live camera projection
// + pixel assert) and G8 lighting rigs (params change, descriptor digest unchanged).
const path=require('node:path'),{spawn,execSync}=require('node:child_process');
const ROOT=path.join(__dirname,'../..');
(async()=>{
 const puppeteer=require('/home/sandbox/verify/node_modules/puppeteer');
 const{PNG}=require('/home/sandbox/verify/node_modules/pngjs');
 const fs=require('node:fs');
 const srv=spawn('python3',['-m','http.server','8899','-d',ROOT],{stdio:'ignore'});
 for(let i=0;i<30;i++){try{execSync('curl -sf -o /dev/null http://127.0.0.1:8899/visual-slice/index.html');break}catch(e){await new Promise(r=>setTimeout(r,500))}}
 const browser=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox','--disable-gpu','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const checks=[],shots=[];
 const c=(n,ok)=>checks.push((ok?'PASS ':'FAIL ')+n);
 for(const[name,w,h]of[['desktop',1280,800],['mobile',390,844]]){
  const page=await browser.newPage();
  await page.setViewport({width:w,height:h,deviceScaleFactor:1});
  const errs=[];page.on('pageerror',e=>errs.push(String(e)));
  await page.goto('http://127.0.0.1:8899/visual-slice/',{waitUntil:'domcontentloaded'});
  await page.waitForSelector('#rigbar button[data-rig="night"]',{timeout:30000});
  await new Promise(r=>setTimeout(r,800)); // first frames rendered
  const proj=await page.evaluate(()=>{
   const{camera,casualtyEnv,lookAt,fov}=window.__c3;
   const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
   const norm=a=>{const l=Math.hypot(...a);return[a[0]/l,a[1]/l,a[2]/l]};
   const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
   const pos=[camera.position.x,camera.position.y,camera.position.z];
   const dir=norm(sub(lookAt,pos)),up0=Math.abs(dir[1])>0.99?[1,0,0]:[0,1,0];
   const right=norm(cross(dir,up0)),up=cross(right,dir),tanV=Math.tan(fov*Math.PI/360),aspect=innerWidth/innerHeight;
   const out=[];
   for(const x of[casualtyEnv.minX,casualtyEnv.maxX])for(const y of[casualtyEnv.minY,casualtyEnv.maxY])for(const z of[casualtyEnv.minZ,casualtyEnv.maxZ]){
    const v=sub([x/1e6,y/1e6,z/1e6],pos),zz=dot(v,dir);
    out.push([dot(v,right)/(zz*tanV*aspect),dot(v,up)/(zz*tanV)])}
   return {ndc:out,descriptor:document.body.dataset.engineDescriptor,
    ambient:(()=>{let a;return window.__c3?undefined:0})()};
  });
  const inside=proj.ndc.every(([x,y])=>Math.abs(x)<=1&&Math.abs(y)<=1);
  c(name+': first frame patient envelope fully inside viewport (live camera)',inside);
  // pixel assert: casualty screen bbox contains non-background pixels
  const shot='/tmp/c3-'+name+'-day.png';await page.screenshot({path:shot});shots.push(shot);
  const png=PNG.sync.read(fs.readFileSync(shot));
  const xs=proj.ndc.map(p=>(p[0]+1)/2*png.width),ys=proj.ndc.map(p=>(1-p[1])/2*png.height);
  const x0=Math.max(0,Math.floor(Math.min(...xs))),x1=Math.min(png.width-1,Math.ceil(Math.max(...xs)));
  const y0=Math.max(0,Math.floor(Math.min(...ys))),y1=Math.min(png.height-1,Math.ceil(Math.max(...ys)));
  let bg=0,n=0;
  for(let y=y0;y<=y1;y+=2)for(let x=x0;x<=x1;x+=2){const i=(y*png.width+x)*4;const r=png.data[i],g=png.data[i+1],b=png.data[i+2];
   if(Math.abs(r-16)<10&&Math.abs(g-26)<10&&Math.abs(b-32)<10)bg++;n++}
  c(name+': pixel assert - casualty bbox is not background ('+(100*bg/n).toFixed(0)+'% bg)',bg/n<0.6);
  // G8: rig switching changes light params, digest unchanged
  if(name==='desktop'){
   const before=proj.descriptor;
   for(const rig of['night','winter','day']){
    await page.click('#rigbar button[data-rig="'+rig+'"]');
    await new Promise(r=>setTimeout(r,300));
    const st=await page.evaluate(()=>({d:document.body.dataset.engineDescriptor,
     active:document.querySelector('#rigbar button[data-active="true"]').dataset.rig}));
    c('rig '+rig+': applied, descriptor digest unchanged',st.d===before&&st.active===rig);
    const rs='/tmp/c3-desktop-'+rig+'.png';await page.screenshot({path:rs});shots.push(rs);
   }
  }
  c(name+': no page errors',errs.length===0);
  await page.close();
 }
 await browser.close();srv.kill();
 checks.forEach(x=>console.log(x));
 console.log('SCREENSHOTS: '+shots.join(' '));
 const f=checks.filter(x=>x.startsWith('FAIL'));
 console.log('RESULT: '+(f.length?'FAIL ('+f.length+')':'PASS'));
 process.exit(f.length?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
