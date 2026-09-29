// TRACK B / B-W1 (C4): real-hardware FPS measurement harness - pure logic.
// FAIL-CLOSED: without an explicit non-empty named physical-device identifier
// AND the operator's physical-device attestation, the result is INVALID -
// never a number presented as a measurement. No emulated, scaled, or
// projected FPS values exist anywhere in this module: every number comes
// from the injected frame timestamps, window = fixed frame count.
export const HARNESS_SCHEMA_VERSION='1.0.0';
export const WINDOW_FRAMES=600;
function percentile(sortedAsc,p){const i=Math.min(sortedAsc.length-1,Math.floor(p*sortedAsc.length));return sortedAsc[i]}
export function createPerfHarness({windowFrames=WINDOW_FRAMES}={}){
 let frames=null,meta=null;
 return{
  // start({deviceId, os, browser, physicalDeviceAttested, startedAt})
  start(m){
   meta={deviceId:(m.deviceId||'').trim(),os:m.os||'',browser:m.browser||'',
    physicalDeviceAttested:m.physicalDeviceAttested===true,startedAt:m.startedAt||''};
   frames=[]},
  // record one real rAF timestamp (ms). Ignored after the window closes.
  recordFrame(ts){
   if(!frames||frames.length>=windowFrames)return;
   if(frames.length)frames.push(ts);else frames.push(ts)},
  get frameCount(){return frames?Math.max(0,frames.length-1):0},
  get complete(){return !!(frames&&frames.length>=windowFrames)},
  // finalize(): MEASURED result or INVALID with reason. Never throws.
  finalize(){
   const invalid=reason=>({schemaVersion:HARNESS_SCHEMA_VERSION,status:'INVALID',invalidReason:reason,
    deviceId:meta?meta.deviceId:'',os:meta?meta.os:'',browser:meta?meta.browser:'',startedAt:meta?meta.startedAt:'',
    windowFrames,frameTimesMs:[],medianFps:null,p95Fps:null});
   if(!meta||!frames)return invalid('harness never started');
   if(!meta.deviceId)return invalid('no named physical-device identifier - measurement refused');
   if(!meta.physicalDeviceAttested)return invalid('physical-device attestation missing - emulated/virtualized results are not reportable');
   if(frames.length<windowFrames)return invalid('incomplete window: '+frames.length+'/'+(windowFrames)+' frames');
   const dts=[];
   for(let i=1;i<frames.length;i++){const dt=frames[i]-frames[i-1];
    if(!Number.isFinite(dt)||dt<=0)return invalid('non-finite or non-positive frame time at frame '+i);
    dts.push(dt)}
   const fps=dts.map(dt=>1000/dt).sort((a,b)=>a-b);
   return{schemaVersion:HARNESS_SCHEMA_VERSION,status:'MEASURED',
    deviceId:meta.deviceId,os:meta.os,browser:meta.browser,startedAt:meta.startedAt,
    windowFrames,frameTimesMs:dts,
    medianFps:percentile(fps,.5),p95Fps:percentile(fps,.95),
    note:'Real measurement on the named device ONLY. Not comparable across devices; never a certification claim.'}}}}
